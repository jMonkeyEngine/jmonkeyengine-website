#!/usr/bin/env python3
"""Fetch homepage community data from OpenCollective and GitHub.

This runs at build time so the public site never performs per-visitor API calls.
The generated output is now stored in two compact payload files:
- `data/community/github.json`
- `data/community/open-collective.json`

Each payload contains the full dataset needed by templates; runtime selection of
community chips and featured message happens in the page at render/load time.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import time
import urllib.error
import urllib.request
import urllib.parse
from datetime import datetime, timezone, timedelta
from html import unescape
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

OPEN_COLLECTIVE_GRAPHQL_URL = "https://api.opencollective.com/graphql/v2"
OPEN_COLLECTIVE_REPO = "jmonkeyengine"
GITHUB_API_ENDPOINT = "https://api.github.com/repos/{repo}/contributors?per_page={per_page}&page={page}"
GITHUB_STATS_CONTRIBUTORS_ENDPOINT = "https://api.github.com/repos/{repo}/stats/contributors"
GITHUB_COMMITS_ENDPOINT = "https://api.github.com/repos/{repo}/commits?since={since}&per_page={per_page}&page={page}"
GITHUB_REPO_ENDPOINT = "https://api.github.com/repos/{repo}"
GITHUB_REPOS = ["jMonkeyEngine/jmonkeyengine", "jMonkeyEngine/sdk", "jMonkeyEngine/wiki"]
GITHUB_API_USER_AGENT = "jMonkeyEngine-Website-CommunityFetcher/1.1"


def _load_dotenv(path: Path, env: Optional[dict] = None) -> None:
    """Load key=value pairs from a local .env file when present.

    Keeps token loading simple for local runs without requiring external dependencies.
    """

    target = env if env is not None else os.environ
    if not path.exists():
        return

    try:
        content = path.read_text(encoding="utf-8")
    except OSError:
        return

    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if not key:
            continue
        value = value.strip()
        if len(value) >= 2 and ((value[0] == value[-1] == '"') or (value[0] == value[-1] == "'")):
            value = value[1:-1]
        if key not in target:
            target[key] = value


_load_dotenv(Path(__file__).resolve().parent.parent / ".env")


GITHUB_TOKEN = (
    os.environ.get("GITHUB_TOKEN", "").strip()
    or os.environ.get("GITHUB_API_TOKEN", "").strip()
    or os.environ.get("GH_TOKEN", "").strip()
)


SIX_MONTH_WINDOW_DAYS = 182
MAX_GITHUB_STATS_WAIT_SECONDS = 15 * 60

DEFAULT_OUTPUT_GITHUB = "data/community/github.json"
DEFAULT_OUTPUT_OPEN_COLLECTIVE = "data/community/open-collective.json"
DEFAULT_OUTPUT_OPEN_COLLECTIVE_UPDATES = "data/community/open-collective-updates.json"
DEFAULT_OUTPUT_NEWS_DIR = "content/news"

def _to_str(value: Any) -> str:
    if value is None:
        return ""
    if not isinstance(value, str):
        value = str(value)
    return value.strip()


def _to_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _to_int(value: Any) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def _humanize_count(value: Any) -> str:
    """Return a compact human-readable integer (e.g. 4.1k) for stats badges."""

    number = _to_int(value)
    if number < 0:
        number = 0
    if number >= 1_000_000:
        return f"{number / 1_000_000:.1f}M".rstrip("0").rstrip(".")
    if number >= 1_000:
        return f"{number / 1_000:.1f}k".rstrip("0").rstrip(".")
    return str(number)



def _read_json(url: str, payload: Optional[dict] = None, timeout: int = 30) -> Tuple[Any, dict]:
    headers = {
        "User-Agent": GITHUB_API_USER_AGENT,
        "Accept": "application/json",
    }

    if GITHUB_TOKEN and url.startswith("https://api.github.com"):
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

    method = "GET"
    data = None

    if payload is not None:
        method = "POST"
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            raw = response.read().decode("utf-8", errors="ignore")
            status_code = getattr(response, "status", None)
            if status_code == 202:
                raise RuntimeError(f"HTTP error 202 fetching {url}: Accepted")
            return json.loads(raw), dict(response.headers)
    except urllib.error.HTTPError as exc:  # pragma: no cover - network dependent
        raise RuntimeError(f"HTTP error {exc.code} fetching {url}: {exc.reason}") from exc
    except urllib.error.URLError as exc:  # pragma: no cover - network dependent
        raise RuntimeError(f"Network error fetching {url}: {exc.reason}") from exc


def _normalize_key(raw: Any) -> str:
    if isinstance(raw, str):
        normalized = raw.strip().lower()
        return normalized
    return _to_str(raw).lower()


def _dedupe_by_key(items: List[Dict[str, Any]], key: str) -> List[Dict[str, Any]]:
    """Keep the highest-value item for each key, preserving deterministic output."""

    merged: Dict[str, Dict[str, Any]] = {}

    for item in items:
        identifier = _normalize_key(item.get(key))
        if not identifier:
            continue

        existing = merged.get(identifier)
        if existing is None:
            merged[identifier] = item
            continue

        if _to_float(item.get("value", 0)) > _to_float(existing.get("value", 0)):
            existing["value"] = item.get("value")
            existing["currency"] = item.get("currency", existing.get("currency", ""))

        if not _to_str(existing.get("message")) and _to_str(item.get("message")):
            existing["message"] = item.get("message", "")
            existing["message_raw"] = item.get("message_raw", "")

        if _to_int(item.get("contributions", 0)) > _to_int(existing.get("contributions", 0)):
            existing["contributions"] = item.get("contributions")

    return list(merged.values())


def _sort_backers(backers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return sorted(
        backers,
        key=lambda item: (
            _to_float(item.get("value", 0)),
            _normalize_key(item.get("name")),
            _normalize_key(item.get("slug")),
        ),
        reverse=True,
    )


def _sort_contributors(contributors: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Sort contributors by:
    1) commits in the last 6 months (primary metric)
    2) total contributions (stable tie-break when the primary metric is equal)
    3) name/login to make ties deterministic.
    """

    return sorted(
        contributors,
        key=lambda item: (
            -_to_int(item.get("recentChanges", 0)),
            -_to_int(item.get("contributions", 0)),
            _normalize_key(item.get("name")),
            _normalize_key(item.get("login")),
        ),
    )




def _extract_additions_and_deletions_and_commits_from_stats(
    raw: Any, min_week_start: Optional[int] = None
) -> Tuple[int, int, int]:
    if not isinstance(raw, dict):
        return 0, 0, 0
    weeks = raw.get("weeks")
    if not isinstance(weeks, list):
        return 0, 0, 0

    if min_week_start is None:
        additions = sum(_to_int(week.get("a")) for week in weeks if isinstance(week, dict))
        deletions = sum(_to_int(week.get("d")) for week in weeks if isinstance(week, dict))
        commits = sum(_to_int(week.get("c")) for week in weeks if isinstance(week, dict))
        return additions, deletions, commits

    additions = 0
    deletions = 0
    commits = 0
    for week in weeks:
        if not isinstance(week, dict):
            continue
        week_start = _to_int(week.get("w"))
        if week_start >= min_week_start:
            additions += _to_int(week.get("a"))
            deletions += _to_int(week.get("d"))
            commits += _to_int(week.get("c"))
    return additions, deletions, commits


def fetch_github_contributor_additions(repos: List[str], allow_wait: bool = True) -> Dict[str, Dict[str, int]]:
    stats_by_login: Dict[str, Dict[str, int]] = {}
    utc_now = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    # Round down to UTC day boundaries to avoid jitter from second-level timestamp drift.
    six_months_ago = int((utc_now - timedelta(days=SIX_MONTH_WINDOW_DAYS)).timestamp())

    for repo in repos:
        attempts = 0
        start = time.monotonic()

        while True:
            try:
                response, _ = _read_json(
                    GITHUB_STATS_CONTRIBUTORS_ENDPOINT.format(repo=repo),
                )
            except RuntimeError as exc:  # pragma: no cover - network dependent
                if "HTTP error 202" in str(exc):
                    attempts += 1
                    if not allow_wait:
                        # Fail fast so callers can use commit fallback without waiting.
                        raise

                    elapsed = time.monotonic() - start
                    if elapsed >= MAX_GITHUB_STATS_WAIT_SECONDS:
                        print(
                            f"[ERROR] GitHub stats for {repo} were not ready after "
                            f"{MAX_GITHUB_STATS_WAIT_SECONDS // 60} minutes ({attempts} attempts)."
                        )
                        raise

                    wait_seconds = min(2**attempts, 60)
                    remaining_seconds = MAX_GITHUB_STATS_WAIT_SECONDS - int(elapsed)
                    if wait_seconds > remaining_seconds:
                        wait_seconds = remaining_seconds

                    print(
                        f"[INFO] GitHub stats for {repo} are not ready yet (HTTP 202). "
                        f"Retrying in {wait_seconds}s ({attempts} attempts). "
                        f"elapsed={int(elapsed)}s"
                    )
                    time.sleep(wait_seconds)
                    continue

                # If repository stats cannot be read, fail-fast and let caller handle the error.
                raise

            if not isinstance(response, list):
                raise RuntimeError(f"Invalid GitHub stats response for {repo}: expected list")

            for raw in response:
                if not isinstance(raw, dict):
                    continue

                author = raw.get("author")
                if not isinstance(author, dict):
                    continue

                login = _to_str(author.get("login"))
                if not login:
                    continue

                additions, deletions, commits = _extract_additions_and_deletions_and_commits_from_stats(
                    raw, min_week_start=six_months_ago
                )
                entry = stats_by_login.setdefault(login, {"additions": 0, "deletions": 0, "commits": 0})
                entry["additions"] = entry.get("additions", 0) + additions
                entry["deletions"] = entry.get("deletions", 0) + deletions
                entry["commits"] = entry.get("commits", 0) + commits
                # Keep `recentChanges` as the primary ranking metric, now based on commit count.
                entry["recentChanges"] = entry.get("commits", 0)

            break

    return stats_by_login


def fetch_github_contributor_commits_last_6_months(
    repos: List[str], per_page: int = 100
) -> Dict[str, Dict[str, int]]:
    """Fallback metrics collector using the commits endpoint when /stats/contributors is not ready.

    Returns commit totals in the last 6 months for each author/login-like identity.
    """
    metrics: Dict[str, Dict[str, int]] = {}
    since = (
        datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        - timedelta(days=SIX_MONTH_WINDOW_DAYS)
    ).isoformat()

    for repo in repos:
        page = 1
        while page <= 50:
            response, _ = _read_json(
                GITHUB_COMMITS_ENDPOINT.format(
                    repo=repo,
                    since=urllib.parse.quote(since),
                    per_page=max(1, per_page),
                    page=page,
                )
            )

            if not isinstance(response, list):
                raise RuntimeError(f"Invalid GitHub commits response for {repo}: expected list")

            if not response:
                break

            for raw in response:
                if not isinstance(raw, dict):
                    continue

                author = raw.get("author")
                if not isinstance(author, dict):
                    author = {}
                committer = raw.get("committer")
                if not isinstance(committer, dict):
                    committer = {}
                commit_author = (raw.get("commit") or {}).get("author") or {}

                login = _to_str(author.get("login") or committer.get("login") or commit_author.get("email") or commit_author.get("name"))
                if not login:
                    continue

                entry = metrics.setdefault(
                    login,
                    {
                        "additions": 0,
                        "deletions": 0,
                        "commits": 0,
                    },
                )
                entry["commits"] = entry.get("commits", 0) + 1
                entry["recentChanges"] = entry.get("commits", 0)

            if len(response) < per_page:
                break
            page += 1

    return metrics


def fetch_open_collective_backers(collective: str, page_size: int = 1000) -> List[Dict[str, Any]]:
    query = """
    query GetBackers($collective: String!, $offset: Int!, $limit: Int!) {
      collective(slug: $collective) {
        backers: members(role: BACKER, offset: $offset, limit: $limit) {
          nodes {
            publicMessage
            totalDonations { value currency }
            account {
              slug
              type
              name
              imageUrl
              website
              twitterHandle
            }
          }
        }
      }
    }
    """

    result: List[Dict[str, Any]] = []
    offset = 0

    while True:
        response, _ = _read_json(
            OPEN_COLLECTIVE_GRAPHQL_URL,
            payload={
                "query": query,
                "variables": {"collective": collective, "offset": offset, "limit": page_size},
            },
        )

        errors = response.get("errors")
        if errors:
            raise RuntimeError(f"OpenCollective GraphQL errors: {errors}")

        nodes = (
            response
            .get("data", {})
            .get("collective", {})
            .get("backers", {})
            .get("nodes", [])
        )

        if not isinstance(nodes, list):
            raise RuntimeError("OpenCollective response has unexpected shape for backers")

        if not nodes:
            break

        for raw in nodes:
            if not isinstance(raw, dict):
                continue

            account = raw.get("account")
            if not isinstance(account, dict):
                continue

            name = _to_str(account.get("name") or account.get("slug"))
            if not name:
                continue

            slug = _to_str(account.get("slug"))
            message = _to_str(raw.get("publicMessage"))
            total = raw.get("totalDonations") or {}
            currency = _to_str(total.get("currency"))
            value = _to_float(total.get("value"))

            result.append(
                {
                    "name": name,
                    "message": message,
                    "message_raw": _to_str(raw.get("publicMessage")),
                    "currency": currency,
                    "value": value,
                    "slug": slug,
                    "type": _to_str(account.get("type")),
                    "website": _to_str(account.get("website")),
                    "avatar": _to_str(account.get("imageUrl")),
                    "twitter": _to_str(account.get("twitterHandle")),
                    "accountUrl": f"https://opencollective.com/{slug}" if slug else "https://opencollective.com",
                }
            )

        if len(nodes) < page_size:
            break

        offset += page_size

    return _sort_backers(_dedupe_by_key(result, "slug"))


def _strip_html(value: Any) -> str:
    text = re.sub(r"<\s*br\s*/?>", "\n", _to_str(value), flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def _slugify(value: Any, fallback: str = "update") -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", _to_str(value).lower()).strip("-")
    return slug or fallback


def _json_escape_for_frontmatter(value: Any) -> str:
    return json.dumps(_to_str(value), ensure_ascii=False)


def fetch_open_collective_updates(collective: str, limit: int = 50) -> List[Dict[str, Any]]:
    query = """
    query GetUpdates($collective: String!, $offset: Int!, $limit: Int!) {
      account(slug: $collective) {
        updates(limit: $limit, offset: $offset) {
          totalCount
          nodes {
            id
            slug
            title
            summary
            html
            publishedAt
            createdAt
          }
        }
      }
    }
    """

    result: List[Dict[str, Any]] = []
    offset = 0
    page_size = max(1, min(limit, 50))
    total_count: Optional[int] = None

    while len(result) < limit:
        response, _ = _read_json(
            OPEN_COLLECTIVE_GRAPHQL_URL,
            payload={
                "query": query,
                "variables": {"collective": collective, "offset": offset, "limit": page_size},
            },
        )
        errors = response.get("errors")
        if errors:
            raise RuntimeError(f"OpenCollective GraphQL update errors: {errors}")

        updates = response.get("data", {}).get("account", {}).get("updates", {})
        if total_count is None:
            total_count = _to_int(updates.get("totalCount"))
        nodes = updates.get("nodes", [])
        if not isinstance(nodes, list) or not nodes:
            break

        for raw in nodes:
            if not isinstance(raw, dict):
                continue
            slug = _slugify(raw.get("slug") or raw.get("title") or raw.get("id"))
            title = _to_str(raw.get("title")) or slug.replace("-", " ").title()
            published_at = _to_str(raw.get("publishedAt") or raw.get("createdAt"))
            html = _to_str(raw.get("html"))
            summary = _to_str(raw.get("summary")) or _strip_html(html)[:220]
            result.append(
                {
                    "id": _to_str(raw.get("id")),
                    "slug": slug,
                    "title": title,
                    "summary": _strip_html(summary),
                    "html": html,
                    "publishedAt": published_at,
                    "createdAt": _to_str(raw.get("createdAt")),
                    "url": f"https://opencollective.com/{collective}/updates/{slug}",
                    "localUrl": f"/news/{slug}/",
                }
            )
            if len(result) >= limit:
                break

        offset += len(nodes)
        if total_count is not None and offset >= total_count:
            break
        if len(nodes) < page_size:
            break

    return sorted(result, key=lambda item: _to_str(item.get("publishedAt") or item.get("createdAt")), reverse=True)


def write_open_collective_news_posts(news_dir: Path, updates: List[Dict[str, Any]]) -> None:
    news_dir.mkdir(parents=True, exist_ok=True)
    for old in news_dir.glob("*.md"):
        if old.name != "_index.md":
            old.unlink()

    index_content = """---\ntitle: \"News\"\ndescription: \"Latest news from the jMonkeyEngine project.\"\ndisable_nav: true\n---\n"""
    (news_dir / "_index.md").write_text(index_content, encoding="utf-8")

    for update in updates:
        slug = _slugify(update.get("slug"))
        title = update.get("title")
        date = update.get("publishedAt") or update.get("createdAt") or datetime.now(timezone.utc).isoformat()
        summary = update.get("summary")
        body = _to_str(update.get("html")) or f"<p>{summary}</p>"
        content = "\n".join(
            [
                "---",
                f"title: {_json_escape_for_frontmatter(title)}",
                f"date: {_json_escape_for_frontmatter(date)}",
                "type: \"news\"",
                "layout: \"post_layout_default\"",
                "disable_nav: true",
                "tags: []",
                f"opencollective_url: {_json_escape_for_frontmatter(update.get('url'))}",
                "source_name: \"OpenCollective\"",
                "source_label: \"posted in\"",
                f"source_url: {_json_escape_for_frontmatter(update.get('url'))}",
                "source_link_label: \"Open original source\"",
                f"summary: {_json_escape_for_frontmatter(summary)}",
                "---",
                "",
                body,
                "",
            ]
        )
        (news_dir / f"{slug}.md").write_text(content, encoding="utf-8")


def fetch_github_repository_stats(repo: str) -> Dict[str, int]:
    """Fetch lightweight repository stats from GitHub API (stars/forks)."""

    response, _ = _read_json(GITHUB_REPO_ENDPOINT.format(repo=repo))
    if not isinstance(response, dict):
        raise RuntimeError(f"Invalid repository response for {repo}: expected object")

    return {
        "stars": _to_int(response.get("stargazers_count")),
        "forks": _to_int(response.get("forks_count")),
        "watchers": _to_int(response.get("watchers_count")),
        "openIssues": _to_int(response.get("open_issues_count")),
        "repo": repo,
    }


def fetch_github_contributors(repos: List[str], per_page: int = 100) -> List[Dict[str, Any]]:
    merged: Dict[str, Dict[str, Any]] = {}

    for repo in repos:
        page = 1
        while True:
            response, _ = _read_json(GITHUB_API_ENDPOINT.format(repo=repo, per_page=per_page, page=page))

            if not isinstance(response, list):
                raise RuntimeError(f"Invalid GitHub response for {repo}: expected list")

            if not response:
                break

            for raw in response:
                if not isinstance(raw, dict):
                    continue

                contributor_type = _to_str(raw.get("type"))
                if contributor_type != "User":
                    continue

                login = _to_str(raw.get("login"))
                if not login:
                    continue

                contributions = _to_int(raw.get("contributions"))
                profile_url = _to_str(raw.get("html_url") or f"https://github.com/{login}")

                if login not in merged:
                    merged_entry = {
                        "login": login,
                        "name": _to_str(raw.get("name") or login),
                        "url": profile_url,
                        "avatar": _to_str(raw.get("avatar_url")),
                        "contributions": contributions,
                        "type": _to_str(raw.get("type", "User")),
                        "repos": [repo],
                        "company": _to_str(raw.get("company")),
                        "bio": _to_str(raw.get("bio")),
                        "additions": 0,
                        "deletions": 0,
                        "recentChanges": 0,
                        "commits": 0,
                    }
                    merged[login] = merged_entry
                else:
                    merged_entry = merged[login]
                    merged_entry["contributions"] = _to_int(merged_entry.get("contributions", 0)) + contributions
                    if repo not in merged_entry.get("repos", []):
                        merged_entry["repos"].append(repo)


            if len(response) < per_page:
                break
            page += 1

    # Merge commit totals (and additions/deletions for completeness) from stats API (across repositories).
    # If stats API is still in 202 "warming" state, fall back to commits endpoint and
    # keep the same 182-day commit-based ordering.
    try:
        stats_by_login = fetch_github_contributor_additions(repos, allow_wait=False)
    except Exception as exc:  # pragma: no cover - network dependent
        if "HTTP error 202" in str(exc):
            print(f"[WARN] Falling back to commits endpoint: {exc}")
            stats_by_login = fetch_github_contributor_commits_last_6_months(repos, per_page=per_page)
            for login in stats_by_login:
                # Ensure contributors discovered only from commits are represented.
                if login not in merged:
                    merged[login] = {
                        "login": login,
                        "name": _to_str(login.split("@")[0] or login),
                        "url": f"https://github.com/{login}" if "@" not in login and "/" not in login else "",
                        "avatar": "",
                        "contributions": 0,
                        "type": "User",
                        "repos": list(repos),
                        "company": "",
                        "bio": "",
                        "additions": 0,
                        "deletions": 0,
                        "recentChanges": 0,
                        "commits": 0,
                    }
        else:
            raise

    for login, entry in merged.items():
        metrics = stats_by_login.get(login)
        if metrics:
            entry["additions"] = _to_int(metrics.get("additions", 0))
            entry["deletions"] = _to_int(metrics.get("deletions", 0))
            entry["commits"] = _to_int(metrics.get("commits", 0))
            # Keep `recentChanges` aligned with commit-based ranking.
            entry["recentChanges"] = _to_int(entry.get("commits", 0))

    # In case we had no /stats endpoint data and commit fallback was empty (or partial),
    # ensure each merged entry still has deterministic ranking fields.
    for entry in merged.values():
        entry.setdefault("additions", 0)
        entry.setdefault("deletions", 0)
        entry.setdefault("commits", 0)
        entry["recentChanges"] = _to_int(entry.get("recentChanges", 0))

    contributors = list(merged.values())
    return _sort_contributors(contributors)


def _safe_existing(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _deep_normalize(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _deep_normalize(value[key]) for key in sorted(value.keys())}
    if isinstance(value, list):
        return [_deep_normalize(item) for item in value]
    if isinstance(value, float):
        return float(value)
    return value


def _payload_signature(payload: Dict[str, Any], ignore: Optional[Set[str]] = None) -> str:
    if ignore is None:
        ignore = set()
    normalized = {
        key: _deep_normalize(value)
        for key, value in payload.items()
        if key not in ignore
    }
    return json.dumps(normalized, sort_keys=True, ensure_ascii=False)


def _write_json_if_changed(path: Path, payload: Dict[str, Any], previous: Dict[str, Any]) -> bool:
    previous_sig = _payload_signature(previous, {"generatedAt"})
    next_signature = _payload_signature(payload, {"generatedAt"})

    if previous_sig == next_signature and previous:
        payload["generatedAt"] = previous.get("generatedAt", payload.get("generatedAt"))
        return False

    path.write_text(json.dumps(payload, indent=2, sort_keys=True, ensure_ascii=False), encoding="utf-8")
    return True




def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch OpenCollective and GitHub community data")
    parser.add_argument(
        "--github-output",
        default=DEFAULT_OUTPUT_GITHUB,
        help="Output JSON path for GitHub community payload",
    )
    parser.add_argument(
        "--open-collective-output",
        default=DEFAULT_OUTPUT_OPEN_COLLECTIVE,
        help="Output JSON path for OpenCollective community payload",
    )
    parser.add_argument("--open-collective-page-size", type=int, default=1000, help="OpenCollective members page size")
    parser.add_argument("--open-collective-updates-output", default=DEFAULT_OUTPUT_OPEN_COLLECTIVE_UPDATES, help="Output JSON path for OpenCollective updates/news payload")
    parser.add_argument("--news-output-dir", default=DEFAULT_OUTPUT_NEWS_DIR, help="Generated Hugo content directory for OpenCollective news posts")
    parser.add_argument("--open-collective-updates-limit", type=int, default=50, help="Maximum OpenCollective updates to save as news posts")
    parser.add_argument("--github-per-page", type=int, default=100, help="GitHub contributors page size")
    args = parser.parse_args()

    github_output_path = Path(args.github_output)
    open_collective_output_path = Path(args.open_collective_output)
    open_collective_updates_output_path = Path(args.open_collective_updates_output)
    news_output_dir = Path(args.news_output_dir)

    previous_github = _safe_existing(github_output_path)
    previous_open_collective = _safe_existing(open_collective_output_path)
    previous_open_collective_updates = _safe_existing(open_collective_updates_output_path)

    previous_backers_all = previous_open_collective.get("backers", {}).get("all") if isinstance(
        previous_open_collective.get("backers", {}), dict
    ) else previous_open_collective.get("backers")
    if not isinstance(previous_backers_all, list):
        previous_backers_all = []

    previous_backers_messages = previous_open_collective.get("backers", {}).get("messages") if isinstance(
        previous_open_collective.get("backers", {}), dict
    ) else previous_open_collective.get("messages")
    if not isinstance(previous_backers_messages, list):
        previous_backers_messages = []

    previous_github_contributors = previous_github.get("contributors", {}).get("all") if isinstance(
        previous_github.get("contributors", {}), dict
    ) else previous_github.get("contributors")
    if not isinstance(previous_github_contributors, list):
        previous_github_contributors = []

    previous_updates = previous_open_collective_updates.get("updates", []) if isinstance(previous_open_collective_updates, dict) else []
    if not isinstance(previous_updates, list):
        previous_updates = []

    errors: List[str] = []
    status_tags: Set[str] = set()

    try:
        backers = fetch_open_collective_backers(
            OPEN_COLLECTIVE_REPO,
            page_size=max(1, args.open_collective_page_size),
        )
        status_tags.add("ok:open-collective")
    except Exception as exc:  # pragma: no cover - network dependent
        errors.append(str(exc))
        backers = previous_backers_all

    try:
        updates = fetch_open_collective_updates(
            OPEN_COLLECTIVE_REPO,
            limit=max(1, args.open_collective_updates_limit),
        )
        status_tags.add("ok:open-collective-updates")
    except Exception as exc:  # pragma: no cover - network dependent
        errors.append(str(exc))
        updates = previous_updates

    try:
        contributors = fetch_github_contributors(GITHUB_REPOS, per_page=max(1, args.github_per_page))
        status_tags.add("ok:github")
    except Exception as exc:  # pragma: no cover - network dependent
        errors.append(str(exc))
        contributors = previous_github_contributors

    # Repository-level stars/forks used in homepage stats.
    try:
        repo_stats = fetch_github_repository_stats(GITHUB_REPOS[0])
        status_tags.add("ok:github-repo")
    except Exception as exc:  # pragma: no cover - network dependent
        errors.append(str(exc))
        repo_stats = previous_github.get("repository", {}) if isinstance(previous_github, dict) else {}
        if not repo_stats:
            repo_stats = {"stars": 0, "forks": 0, "watchers": 0, "openIssues": 0, "repo": GITHUB_REPOS[0]}

    if not updates:
        updates = previous_updates
        if updates:
            status_tags.add("fallback:updates")

    if not backers:
        backers = previous_backers_all
        if backers:
            status_tags.add("fallback:backers")

    if not contributors:
        contributors = previous_github_contributors
        if contributors:
            status_tags.add("fallback:contributors")

    backers_with_message = [backer for backer in backers if _to_str(backer.get("message"))]

    # Keep top buckets deterministic; actual random sampling for chips/messages is done client-side
    # on every page load.
    top_backers = backers[: min(3, len(backers))]
    top_contributors = contributors[: min(3, len(contributors))]

    now = datetime.now(timezone.utc).isoformat()

    github_payload = {
        "generatedAt": now,
        "summary": {
            "contributors": len(contributors),
            "topContributors": len(top_contributors),
        },
        "source": {
            "provider": "github",
            "repos": GITHUB_REPOS,
            "mainRepo": GITHUB_REPOS[0],
            "perPage": max(1, args.github_per_page),
            "endpoint": "https://api.github.com",
        },
        "repository": {
            "repo": GITHUB_REPOS[0],
            "stars": _to_int(repo_stats.get("stars", 0)),
            "forks": _to_int(repo_stats.get("forks", 0)),
            "starsHuman": _humanize_count(repo_stats.get("stars", 0)),
            "forksHuman": _humanize_count(repo_stats.get("forks", 0)),
        },
        "contributors": {
            "all": contributors,
            "top": top_contributors,
        },
        "status": {
            "errors": errors,
            "stale": bool(errors),
            "tags": sorted(status_tags),
        },
    }

    open_collective_payload = {
        "generatedAt": now,
        "source": {
            "provider": "opencollective",
            "collective": OPEN_COLLECTIVE_REPO,
            "endpoint": OPEN_COLLECTIVE_GRAPHQL_URL,
            "pageSize": max(1, args.open_collective_page_size),
        },
        "backers": {
            "all": backers,
            "top": top_backers,
            "messages": backers_with_message,
        },
        "summary": {
            "backers": len(backers),
            "messages": len(backers_with_message),
            "topBackers": len(top_backers),
        },
        "status": {
            "errors": errors,
            "stale": bool(errors),
            "tags": sorted(status_tags),
        },
    }

    open_collective_updates_payload = {
        "generatedAt": now,
        "source": {
            "provider": "opencollective",
            "collective": OPEN_COLLECTIVE_REPO,
            "endpoint": OPEN_COLLECTIVE_GRAPHQL_URL,
            "contentDir": str(news_output_dir),
        },
        "summary": {
            "updates": len(updates),
        },
        "updates": updates,
        "status": {
            "errors": errors,
            "stale": bool(errors),
            "tags": sorted(status_tags),
        },
    }

    github_output_path.parent.mkdir(parents=True, exist_ok=True)
    open_collective_updates_output_path.parent.mkdir(parents=True, exist_ok=True)
    changed_github = _write_json_if_changed(github_output_path, github_payload, previous_github)
    changed_open_collective = _write_json_if_changed(open_collective_output_path, open_collective_payload, previous_open_collective)
    changed_updates = _write_json_if_changed(open_collective_updates_output_path, open_collective_updates_payload, previous_open_collective_updates)
    write_open_collective_news_posts(news_output_dir, updates)

    if errors:
        print("[WARN] Community data refresh completed with warnings:")
        for error in errors:
            print(f"- {error}")
        if not changed_github and not changed_open_collective and not changed_updates:
            print("[INFO] Data payload unchanged; files untouched for deterministic watch stability.")
    else:
        print("[OK] Community data refreshed successfully")
        print(f"[OK] Wrote github={changed_github}, openCollective={changed_open_collective}, updates={changed_updates}")


if __name__ == "__main__":
    main()
