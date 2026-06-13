#!/usr/bin/env python3
"""Fetch OpenCollective project funds for the donate page.

The main fund is intentionally kept local and stable. Dedicated project funds
are fetched at build time so published pages and JSON never call OpenCollective
from visitors' browsers.
"""

from __future__ import annotations

import argparse
import json
import re
import urllib.error
import urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from typing import Any, Dict, List, Set


OPEN_COLLECTIVE_GRAPHQL_URL = "https://api.opencollective.com/graphql/v2"
OPEN_COLLECTIVE_COLLECTIVE = "jmonkeyengine"
DEFAULT_OUTPUT = "data/donate/funds.json"

MAIN_FUND = {
    "id": "main",
    "slug": "jmonkeyengine",
    "name": "Main fund",
    "description": "Flexible support. The core team allocates funds where they are most needed.",
    "url": "https://opencollective.com/jmonkeyengine",
    "primary": True,
    "icon": "fa-solid fa-heart",
}


def _to_str(value: Any) -> str:
    if value is None:
        return ""
    if not isinstance(value, str):
        value = str(value)
    return value.strip()


def _read_json(url: str, payload: Dict[str, Any], timeout: int = 30) -> Dict[str, Any]:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "User-Agent": "jMonkeyEngine-Website-DonationFundsFetcher/1.0",
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8", errors="ignore"))
    except urllib.error.HTTPError as exc:  # pragma: no cover - network dependent
        raise RuntimeError(f"HTTP error {exc.code} fetching {url}: {exc.reason}") from exc
    except urllib.error.URLError as exc:  # pragma: no cover - network dependent
        raise RuntimeError(f"Network error fetching {url}: {exc.reason}") from exc


def _clean_text(value: Any) -> str:
    text = unescape(_to_str(value))
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _clean_project_name(project: Dict[str, Any]) -> str:
    name = _clean_text(project.get("name")) or _clean_text(project.get("slug"))
    name = re.sub(r"^j\s*monkey\s*engine\s*[-:–—]\s*", "", name, flags=re.IGNORECASE)
    name = re.sub(r"^j\s*monkey\s*[-:–—]\s*", "", name, flags=re.IGNORECASE)
    if name == name.lower() or "-" in name:
        name = name.replace("-", " ").strip().title()
    return name or "Project fund"


def fetch_project_funds(collective: str, page_size: int = 100) -> List[Dict[str, Any]]:
    query = """
    query GetProjectFunds($collective: String!, $offset: Int!, $limit: Int!) {
      account(slug: $collective) {
        childrenAccounts(offset: $offset, limit: $limit) {
          nodes {
            id
            slug
            name
            description
            type
            website
            isArchived
          }
        }
      }
    }
    """

    funds: List[Dict[str, Any]] = []
    seen: Set[str] = set()
    offset = 0

    while True:
        response = _read_json(
            OPEN_COLLECTIVE_GRAPHQL_URL,
            {
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
            .get("account", {})
            .get("childrenAccounts", {})
            .get("nodes", [])
        )
        if not isinstance(nodes, list):
            raise RuntimeError("OpenCollective response has unexpected shape for project funds")

        if not nodes:
            break

        for raw in nodes:
            if not isinstance(raw, dict):
                continue
            if _to_str(raw.get("type")).upper() != "PROJECT":
                continue
            if bool(raw.get("isArchived")):
                continue
            slug = _to_str(raw.get("slug"))
            if not slug or slug in seen:
                continue
            seen.add(slug)
            funds.append(
                {
                    "id": slug,
                    "slug": slug,
                    "name": _clean_project_name(raw),
                    "description": _clean_text(raw.get("description")),
                    "url": f"https://opencollective.com/{collective}/projects/{slug}",
                    "primary": False,
                    "website": _to_str(raw.get("website")),
                }
            )

        if len(nodes) < page_size:
            break
        offset += page_size

    return funds


def _safe_existing(path: Path) -> Dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch OpenCollective donation project funds")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help="Output JSON path")
    parser.add_argument("--collective", default=OPEN_COLLECTIVE_COLLECTIVE, help="OpenCollective collective slug")
    parser.add_argument("--page-size", type=int, default=100, help="OpenCollective project page size")
    args = parser.parse_args()

    output_path = Path(args.output)
    previous = _safe_existing(output_path)
    previous_funds = previous.get("funds", []) if isinstance(previous, dict) else []
    if not isinstance(previous_funds, list):
        previous_funds = []

    errors: List[str] = []
    try:
        project_funds = fetch_project_funds(args.collective, page_size=max(1, args.page_size))
        stale = False
    except Exception as exc:  # pragma: no cover - network dependent
        errors.append(str(exc))
        project_funds = [
            fund for fund in previous_funds
            if isinstance(fund, dict) and not bool(fund.get("primary"))
        ]
        stale = True

    funds = [MAIN_FUND, *project_funds]
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": {
            "provider": "opencollective",
            "collective": args.collective,
            "endpoint": OPEN_COLLECTIVE_GRAPHQL_URL,
        },
        "summary": {
            "funds": len(funds),
            "projectFunds": len(project_funds),
        },
        "funds": funds,
        "status": {
            "errors": errors,
            "stale": stale,
        },
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2, sort_keys=True, ensure_ascii=False), encoding="utf-8")

    if errors:
        print("[WARN] Donation funds refresh used previous project funds:")
        for error in errors:
            print(f"- {error}")
    else:
        print(f"[OK] Donation funds refreshed: {len(funds)} funds")


if __name__ == "__main__":
    main()
