#!/usr/bin/env python3
"""Fetch the current month's WIP screenshot thread from the Discourse forum.

This runs at build time so the public site never performs per-visitor API calls.
The generated output is stored in `data/community/monthly-wip.json`.

The script finds the topic whose title matches "(Month YYYY) Monthly WIP Screenshot
Thread" for the current month, then extracts images and YouTube video thumbnails
from the post content.

If the current month has fewer items than MIN_MONTHLY_WIP_ITEMS (default 10),
the script aggregates items from previous months until the minimum is reached,
respecting MAX_MONTHLY_WIP_LOOKBACK (default 3).

If no thread is found within the lookback window, the script exits with an error.
"""

from __future__ import annotations

import json
import random
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

DISCOURSE_BASE_URL = "https://hub.jmonkeyengine.org"
MONTHLY_CATEGORY_URL = f"{DISCOURSE_BASE_URL}/c/monthly/57.json"
USER_AGENT = "jMonkeyEngine-Website-MonthlyWipFetcher/1.0"

MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

DEFAULT_OUTPUT = "data/community/monthly-wip.json"
DEFAULT_LOOKBACK_MONTHS = 3
DEFAULT_MIN_ITEMS = 10


def _read_json(url: str, payload: Optional[dict] = None, timeout: int = 30) -> Tuple[Any, dict]:
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
    }

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
            return json.loads(raw), dict(response.headers)
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"HTTP error {exc.code} fetching {url}: {exc.reason}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Network error fetching {url}: {exc.reason}") from exc


def _to_str(value: Any) -> str:
    if value is None:
        return ""
    if not isinstance(value, str):
        value = str(value)
    return value.strip()


def _extract_images_from_cooked(cooked: str) -> List[str]:
    """Extract image URLs from Discourse lightbox wrappers in cooked HTML."""
    # Images live inside: <div class="lightbox-wrapper"> ... <img src="URL" ...>
    # We match the img src inside lightbox-wrapper divs.
    images: List[str] = []
    # Match all <img> tags and filter by src containing the uploads path
    for match in re.finditer(r'<img\s[^>]*src="([^"]+)"[^>]*>', cooked, re.IGNORECASE):
        src = match.group(1)
        # Skip avatars, letter proxies, and emoji
        if "/user_avatar/" in src or "/letter_avatar_proxy/" in src or "/images/" in src:
            continue
        if "uploads/default" in src or "uploads/original" in src:
            images.append(src)
    return images


def _extract_text_preview(cooked: str, max_len: int = 100) -> str:
    """Extract a short plain-text preview from cooked HTML."""
    text = re.sub(r'<div[^>]*class="[^"]*lightbox-wrapper[^"]*"[^>]*>.*?</div>', ' ', cooked, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<img[^>]*>', ' ', text, flags=re.IGNORECASE)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    if len(text) < 5:
        return ""
    if len(text) > max_len:
        text = text[:max_len].rsplit(' ', 1)[0] + "…"
    return text


def _extract_videos_from_cooked(cooked: str) -> List[Dict[str, str]]:
    """Extract YouTube video thumbnails from Discourse onebox embeds in cooked HTML."""
    videos: List[Dict[str, str]] = []
    for match in re.finditer(
        r'data-video-id="([^"]+)"',
        cooked,
        re.IGNORECASE,
    ):
        video_id = match.group(1)
        videos.append({
            "videoId": video_id,
            "videoUrl": f"https://www.youtube.com/watch?v={video_id}",
            "src": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
        })
    return videos


def _extract_items_from_posts(posts: List[Dict[str, Any]], topic_url: str, month_sort_key: int = 0) -> List[Dict[str, Any]]:
    """Extract images and videos from a list of posts.

    Args:
        month_sort_key: Integer used for ordering items by recency (higher = more recent).
    """
    items: List[Dict[str, Any]] = []
    for post in posts:
        cooked = _to_str(post.get("cooked", ""))
        if not cooked:
            continue

        author = _to_str(post.get("username", ""))
        preview = _extract_text_preview(cooked)
        post_number = post.get("post_number", 1)
        post_url = f"{topic_url}/{post_number}"

        images = _extract_images_from_cooked(cooked)
        if images:
            item: Dict[str, Any] = {"type": "image", "src": random.choice(images), "author": author, "postUrl": post_url, "_sort": month_sort_key}
            if preview:
                item["preview"] = preview
            items.append(item)

        for video in _extract_videos_from_cooked(cooked):
            v: Dict[str, Any] = {"type": "video", "author": author, "postUrl": post_url, "_sort": month_sort_key}
            if preview:
                v["preview"] = preview
            v.update(video)
            items.append(v)

    return items


def _fetch_topic_posts(topic_id: int) -> List[Dict[str, Any]]:
    """Fetch all posts from a topic, handling pagination."""
    url = f"{DISCOURSE_BASE_URL}/t/{topic_id}.json"
    response, _ = _read_json(url)

    post_stream = response.get("post_stream", {})
    posts = post_stream.get("posts", [])
    stream = post_stream.get("stream", [])

    # If there are more posts than returned, fetch the remaining pages
    loaded_ids = {p.get("id") for p in posts}
    remaining_ids = [pid for pid in stream if pid not in loaded_ids]

    while remaining_ids:
        batch = remaining_ids[:20]
        remaining_ids = remaining_ids[20:]
        try:
            page_response, _ = _read_json(
                f"{DISCOURSE_BASE_URL}/t/{topic_id}/posts.json",
                payload={"post_ids": batch},
            )
            page_posts = page_response.get("post_stream", {}).get("posts", [])
            posts.extend(page_posts)
        except RuntimeError:
            # If a page fails, continue with what we have
            pass

    return posts


def find_thread_for_month(year: int, month: int) -> Optional[Dict[str, Any]]:
    """Find the topic matching the WIP thread for a given year/month."""
    month_name = MONTH_NAMES[month - 1]
    expected_title = f"({month_name} {year}) Monthly WIP Screenshot Thread"

    response, _ = _read_json(MONTHLY_CATEGORY_URL)
    topics = response.get("topic_list", {}).get("topics", [])

    for topic in topics:
        title = _to_str(topic.get("title"))
        if title.lower() == expected_title.lower():
            return topic

    return None


def _decrement_month(year: int, month: int) -> Tuple[int, int]:
    """Return the previous month as (year, month)."""
    if month == 1:
        return year - 1, 12
    return year, month - 1


def main() -> None:
    import os

    parser_args = sys.argv[1:]
    output_path = DEFAULT_OUTPUT
    if "--output" in parser_args:
        idx = parser_args.index("--output")
        if idx + 1 < len(parser_args):
            output_path = parser_args[idx + 1]

    max_lookback = int(os.environ.get("MAX_MONTHLY_WIP_LOOKBACK", DEFAULT_LOOKBACK_MONTHS))
    min_items = int(os.environ.get("MIN_MONTHLY_WIP_ITEMS", DEFAULT_MIN_ITEMS))

    now = datetime.now(timezone.utc)
    year, month = now.year, now.month

    print(f"[INFO] Looking for WIP thread (max {max_lookback} months lookback, min {min_items} items)...")

    all_items: List[Dict[str, Any]] = []
    source_topics: List[Dict[str, Any]] = []
    primary_topic = None
    attempt = 0

    for attempt in range(max_lookback + 1):
        month_name = MONTH_NAMES[month - 1]
        print(f"[INFO] Trying {month_name} {year}...")
        topic = find_thread_for_month(year, month)
        if topic is not None:
            topic_id = topic["id"]
            topic_slug = topic.get("slug", "")
            topic_title = _to_str(topic.get("title"))
            topic_url = f"{DISCOURSE_BASE_URL}/t/{topic_slug}/{topic_id}"

            print(f"[INFO] Found thread: {topic_title} (id={topic_id})")
            print(f"[INFO] Fetching posts...")

            posts = _fetch_topic_posts(topic_id)
            print(f"[INFO] Fetched {len(posts)} posts from {month_name} {year}")

            # Use inverse of attempt as sort key: 0 for current month, -1 for previous, etc.
            # Items with higher sort values appear first (leftmost)
            sort_key = -attempt
            month_items = _extract_items_from_posts(posts, topic_url, month_sort_key=sort_key)
            print(f"[INFO] Extracted {len(month_items)} items from {month_name} {year}")

            all_items.extend(month_items)
            source_topics.append({
                "id": topic_id,
                "title": topic_title,
                "url": topic_url,
                "year": year,
                "month": month,
                "monthName": month_name,
                "postsCount": _to_str(topic.get("posts_count")),
                "likeCount": _to_str(topic.get("like_count")),
                "views": _to_str(topic.get("views")),
            })

            if primary_topic is None:
                primary_topic = topic

            if len(all_items) >= min_items:
                print(f"[INFO] Reached minimum {min_items} items (have {len(all_items)})")
                break

        if attempt < max_lookback:
            print(f"[WARN] Have {len(all_items)} items so far, need {min_items}. Looking at previous month...")
            year, month = _decrement_month(year, month)

    if not all_items:
        print(
            f"[ERROR] No WIP thread found after checking {max_lookback + 1} month(s). "
            f"Tried back to {MONTH_NAMES[month - 1]} {year}."
        )
        sys.exit(1)

    if len(all_items) > min_items:
        print(f"[INFO] Randomly selecting {min_items} items from {len(all_items)} total")
        all_items = random.sample(all_items, min_items)

    # Sort items by recency: most recent month first (left), oldest month last (right)
    all_items.sort(key=lambda x: x.get("_sort", 0), reverse=True)

    # Remove internal sort key before output
    for item in all_items:
        item.pop("_sort", None)

    print(f"[INFO] Final selection: {len(all_items)} items ({sum(1 for i in all_items if i['type'] == 'image')} images, {sum(1 for i in all_items if i['type'] == 'video')} videos)")

    generated_at = datetime.now(timezone.utc).isoformat()

    image_count = sum(1 for i in all_items if i["type"] == "image")
    video_count = sum(1 for i in all_items if i["type"] == "video")
    parts = []
    if image_count:
        parts.append(f"{image_count} screenshot{'s' if image_count != 1 else ''}")
    if video_count:
        parts.append(f"{video_count} video{'s' if video_count != 1 else ''}")
    items_summary = " and ".join(parts) if parts else "no items"

    primary = source_topics[0] if source_topics else {}
    payload = {
        "generatedAt": generated_at,
        "subtitle": f"{items_summary} — our community is very active, check what they're working on this month!",
        "topic": {
            "id": primary.get("id", ""),
            "title": primary.get("title", ""),
            "url": primary.get("url", ""),
            "postsCount": primary.get("postsCount", ""),
            "likeCount": primary.get("likeCount", ""),
            "views": primary.get("views", ""),
        },
        "items": all_items,
        "sources": source_topics,
        "status": {
            "errors": [],
            "stale": False,
        },
    }

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[OK] Wrote {out} ({len(all_items)} items)")


if __name__ == "__main__":
    main()
