#!/usr/bin/env python3

import json
import os
import re
import unicodedata
import shutil
import subprocess
import tempfile
from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse
from urllib.error import HTTPError
from urllib.request import Request, urlopen


APPROVED_LABEL = os.getenv("APPROVED_LABEL", "approved")
MAX_EXTRA_SUFFIX = 9999

SECTION_HEADER_RE = re.compile(r"^###\s+(.*?)\s*$", re.MULTILINE)
IMAGE_URL_RE = re.compile(r"https?://[^\s<>)\"']+")
MARKDOWN_IMAGE_RE = re.compile(r"!\[[^\]]*?\]\(([^)\s]+)")
HTML_IMAGE_RE = re.compile(r"<img[^>]+src=['\"]([^'\"]+)['\"]", re.I)


def slugify(text: str) -> str:
    normalized = (
        unicodedata.normalize("NFKD", text or "")
        .encode("ascii", "ignore")
        .decode("ascii")
    )
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", normalized.strip().lower())
    return slug.strip("-") or "entry"


def read_issue_payload():
    event_path = Path(os.environ["GITHUB_EVENT_PATH"])
    return json.loads(event_path.read_text(encoding="utf-8"))


def has_label(issue, label_name: str) -> bool:
    for label in issue.get("labels", []):
        if label.get("name") == label_name:
            return True
    return False


def normalize_field_name(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", (name or "").strip().lower()).strip("_")


def parse_issue_sections(body: str):
    sections = {}
    current_key = None
    current_lines = []
    for line in (body or "").splitlines():
        match = SECTION_HEADER_RE.match(line)
        if match:
            if current_key is not None:
                sections[current_key] = "\n".join(current_lines).strip()
            current_key = normalize_field_name(match.group(1))
            current_lines = []
            continue
        if current_key is not None:
            current_lines.append(line)
    if current_key is not None:
        sections[current_key] = "\n".join(current_lines).strip()
    return sections


def canonical_field_name(field_name: str) -> str:
    alias_map = {
        "entry_type": "submission_type",
        "project_title": "title",
        "title": "title",
        "submission_type": "submission_type",
        "short_summary": "summary",
        "summary": "summary",
        "detailed_description": "description",
        "description": "description",
        "screenshot_urls": "screenshot_urls",
        "screenshots_and_videos": "screenshot_urls",
        "cover_image": "cover_image",
        "project_link": "project_link",
        "tags": "tags",
        "authors": "authors",
        "platforms": "platforms",
        "steam_link": "steam_link",
        "itch_link": "itch_link",
        "indiedb_link": "indiedb_link",
        "website_link": "publisher_link",
        "publisher_link": "publisher_link",
        "github_link": "github_link",
    }
    return alias_map.get(field_name, field_name)


def normalize_sections(raw_sections):
    sections = {}
    for key, value in raw_sections.items():
        canonical = canonical_field_name(key)
        existing = sections.get(canonical)
        value = (value or "").strip()
        if not value or is_no_response(value):
            continue
        if canonical == "tags" or canonical == "platforms":
            sections[canonical] = value
        elif existing:
            sections[canonical] = f"{existing}\n{value}"
        else:
            sections[canonical] = value
    return sections


def is_no_response(value: str) -> bool:
    normalized = (value or "").strip().strip("_*`").strip().lower()
    return normalized == "no response"


def extract_image_urls(text: str):
    if not text:
        return []

    urls = []
    urls.extend(MARKDOWN_IMAGE_RE.findall(text))
    urls.extend(HTML_IMAGE_RE.findall(text))
    urls.extend(IMAGE_URL_RE.findall(text))

    # Deduplicate while preserving order.
    return list(dict.fromkeys(sanitize_url(url) for url in urls if sanitize_url(url)))


def sanitize_url(url: str) -> str:
    return (url or "").strip().rstrip("\"'.,;:!?]}")


def is_probably_image(url: str) -> bool:
    parsed = urlparse(url)
    path = parsed.path.lower()
    if any(path.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg", ".mp4", ".webm", ".ogg", ".mov"]):
        return True
    if "user-images.githubusercontent.com" in parsed.netloc:
        return True
    if "github.com" in parsed.netloc and "/user-attachments/" in path:
        return True
    return False


def is_github_attachment(url: str) -> bool:
    parsed = urlparse(url)
    return "github.com" in parsed.netloc and "/user-attachments/" in parsed.path


def make_image_request(url: str, include_auth: bool):
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 github-issue-showcase-importer",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,video/webm,video/*,*/*;q=0.8",
        },
    )
    token = os.environ.get("GITHUB_TOKEN")
    if token and include_auth:
        request.add_header("Authorization", f"Bearer {token}")
    return request


def download_image(url: str, timeout: int = 60):
    url = sanitize_url(url)
    include_auth = not is_github_attachment(url)
    request = make_image_request(url, include_auth)

    try:
        with urlopen(request, timeout=timeout) as response:
            content_type = response.headers.get("Content-Type", "")
            if not (content_type.startswith("image/") or content_type.startswith("video/")):
                raise ValueError(f"URL is not supported media: {url} ({content_type})")
            return response.read(), content_type
    except HTTPError:
        if include_auth:
            request = make_image_request(url, False)
            with urlopen(request, timeout=timeout) as response:
                content_type = response.headers.get("Content-Type", "")
                if not (content_type.startswith("image/") or content_type.startswith("video/")):
                    raise ValueError(f"URL is not supported media: {url} ({content_type})")
                return response.read(), content_type
        raise


def convert_image_to_webp(image_data: bytes):
    try:
        from PIL import Image, ImageSequence
    except ImportError as exc:
        raise RuntimeError("Pillow is required to convert imported images to WebP.") from exc

    with Image.open(BytesIO(image_data)) as image:
        output = BytesIO()
        if getattr(image, "is_animated", False):
            frames = []
            durations = []
            for frame in ImageSequence.Iterator(image):
                frames.append(frame.convert("RGBA"))
                durations.append(frame.info.get("duration", image.info.get("duration", 100)))
            frames[0].save(
                output,
                format="WEBP",
                save_all=True,
                append_images=frames[1:],
                duration=durations,
                loop=image.info.get("loop", 0),
                quality=82,
                method=6,
            )
        else:
            target = image.convert("RGBA" if "A" in image.getbands() else "RGB")
            target.save(output, format="WEBP", quality=82, method=6)
        return output.getvalue()


def convert_video_to_webm(media_data: bytes, input_suffix: str = ".bin"):
    with tempfile.TemporaryDirectory() as temp_dir:
        input_path = Path(temp_dir) / f"input{input_suffix}"
        output_path = Path(temp_dir) / "output.webm"
        input_path.write_bytes(media_data)
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                str(input_path),
                "-an",
                "-c:v",
                "libvpx-vp9",
                "-b:v",
                "0",
                "-crf",
                "35",
                "-pix_fmt",
                "yuv420p",
                str(output_path),
            ],
            check=True,
        )
        return output_path.read_bytes()


def convert_cover_to_webp(image_data: bytes):
    try:
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError("Pillow is required to convert imported cover images to WebP.") from exc

    with Image.open(BytesIO(image_data)) as image:
        output = BytesIO()
        target = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        target.save(output, format="WEBP", quality=86, method=6)
        return output.getvalue()


def media_suffix_from_url(url: str):
    path = urlparse(url).path.lower()
    suffix = Path(path).suffix
    if suffix:
        return suffix
    return ".bin"


def normalize_downloaded_media(raw_url: str, media_data: bytes, content_type: str):
    content_type = (content_type or "").split(";")[0].lower()
    suffix = media_suffix_from_url(raw_url)

    if content_type == "image/webp" or suffix == ".webp":
        return {"url": raw_url, "data": media_data, "extension": ".webp", "kind": "image"}

    if content_type == "image/gif" or suffix == ".gif":
        return {
            "url": raw_url,
            "data": convert_video_to_webm(media_data, ".gif"),
            "extension": ".webm",
            "kind": "video",
        }

    if content_type == "video/webm" or suffix == ".webm":
        return {"url": raw_url, "data": media_data, "extension": ".webm", "kind": "video"}

    if content_type.startswith("video/") or suffix in {".mp4", ".ogg", ".mov"}:
        return {
            "url": raw_url,
            "data": convert_video_to_webm(media_data, suffix),
            "extension": ".webm",
            "kind": "video",
        }

    if content_type.startswith("image/") or suffix in {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".svg"}:
        return {
            "url": raw_url,
            "data": convert_image_to_webp(media_data),
            "extension": ".webp",
            "kind": "image",
        }

    raise ValueError(f"Unsupported media type: {content_type or suffix}")


def json_api_request(method: str, url: str, payload: dict):
    token = os.environ["GITHUB_TOKEN"]
    data = json.dumps(payload).encode("utf-8")
    request = Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "github-issue-experiment-importer",
            "Content-Type": "application/json",
        },
    )
    with urlopen(request, timeout=30) as response:
        return response.status, response.read().decode("utf-8")


def git(*command: str, check: bool = True):
    completed = subprocess.run(
        ["git", *command],
        check=check,
        capture_output=True,
        text=True,
    )
    if completed.stdout:
        print(completed.stdout.strip())
    if completed.stderr and completed.returncode != 0:
        print(completed.stderr.strip())
    return completed


def get_field_value(sections: dict, key: str):
    value = sections.get(key)
    if value:
        return value
    return ""


def split_list(value: str):
    if not value:
        return []
    result = []
    for chunk in re.split(r"[,;\n]+", value):
        chunk = chunk.strip(" -\t")
        if chunk:
            result.append(chunk)
    return result


def make_entry_type(issue):
    body = issue.get("body", "") or ""
    sections = normalize_sections(parse_issue_sections(body))

    body_type = (get_field_value(sections, "submission_type") or "").lower().strip()
    if body_type == "game or app":
        return "showcase"
    if body_type == "tool, editor, or engine":
        return "tools"
    if body_type == "experiment":
        return "experiment"

    return ""


def next_available_path(target_dir: Path, base_name: str, extension: str):
    candidate = f"{base_name}{extension}"
    if not (target_dir / candidate).exists():
        return candidate
    for index in range(1, MAX_EXTRA_SUFFIX + 1):
        candidate = f"{base_name}-{index:02d}{extension}"
        if not (target_dir / candidate).exists():
            return candidate
    raise RuntimeError("Unable to find a free filename for downloaded image.")


def collect_image_urls(sections: dict):
    screenshot_urls = split_list(get_field_value(sections, "screenshot_urls"))
    all_urls = []
    for line in screenshot_urls:
        all_urls.extend(extract_image_urls(line))
    return [url for url in dict.fromkeys([sanitize_url(u) for u in all_urls if is_probably_image(sanitize_url(u))])]


def collect_cover_urls(sections: dict):
    cover_value = get_field_value(sections, "cover_image")
    all_urls = []
    for line in split_list(cover_value):
        all_urls.extend(extract_image_urls(line))
    return [url for url in dict.fromkeys([sanitize_url(u) for u in all_urls if is_probably_image(sanitize_url(u))])]


def collect_downloaded_images(image_urls):
    downloaded = []
    for raw_url in image_urls:
        try:
            image_data, content_type = download_image(raw_url)
            downloaded.append(normalize_downloaded_media(raw_url, image_data, content_type))
        except Exception as exc:
            print(f"Skipping URL (download failed): {raw_url} ({exc})")
    return downloaded


def collect_downloaded_cover(cover_urls):
    for raw_url in cover_urls:
        try:
            image_data, content_type = download_image(raw_url)
            content_type = (content_type or "").split(";")[0].lower()
            if content_type.startswith("video/"):
                print(f"Skipping cover URL (video is not valid as cover): {raw_url}")
                continue
            return {"url": raw_url, "data": convert_cover_to_webp(image_data), "extension": ".webp", "kind": "image"}
        except Exception as exc:
            print(f"Skipping cover URL (download failed): {raw_url} ({exc})")
    return None


def collect_image_paths(target_dir: Path, slug: str):
    removed = []
    if not target_dir.exists():
        return removed
    escaped = re.escape(slug)
    pattern = re.compile(rf"^{escaped}(?:-\d{{2}})?$")
    for item in sorted(target_dir.glob("*")):
        if not item.is_file():
            continue
        if pattern.match(item.stem):
            removed.append(item)
    return removed


def remove_matching_dirs(base_dir: Path, slug: str):
    removed = []
    if not base_dir.exists():
        return removed
    for child in sorted(base_dir.iterdir()):
        if not child.is_dir():
            continue
        if child.name != slug:
            continue
        removed.extend(p for p in child.rglob("*") if p.is_file())
        shutil.rmtree(child)
    return removed


def section_date_or_fallback(issue):
    return issue.get("created_at", "").replace("Z", "+00:00") or "2000-01-01T00:00:00+00:00"


def yaml_scalar(value):
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, dict):
        return None
    return json.dumps(value, ensure_ascii=False)


def write_yaml_list(lines, key, values, indent=""):
    if not values:
        lines.append(f"{indent}{key}: []")
        return
    lines.append(f"{indent}{key}:")
    item_prefix = f"{indent}  - "
    for item in values:
        lines.append(f"{item_prefix}{yaml_scalar(item)}")


def build_frontmatter_for_showcase(title: str, sections: dict, issue: dict, cover_image: str = ""):
    lines = []
    lines.append("---")
    lines.append(f'title: {yaml_scalar(title)}')
    lines.append(f'date: {yaml_scalar(section_date_or_fallback(issue))}')
    lines.append("draft: false")
    lines.append('type: "default"')
    lines.append('layout: "post_layout_showcase"')
    if cover_image:
        lines.append(f'cover_image: {yaml_scalar(cover_image)}')

    authors = split_list(get_field_value(sections, "authors"))
    if authors:
        write_yaml_list(lines, "authors", authors)

    tags = split_list(get_field_value(sections, "tags"))
    if "showcase" not in [t.lower() for t in tags]:
        tags.insert(0, "showcase")
    write_yaml_list(lines, "tags", tags or ["showcase"])

    for key in ["steam_link", "itch_link", "indiedb_link", "publisher_link", "github_link"]:
        value = get_field_value(sections, key)
        if value:
            lines.append(f'{key}: {yaml_scalar(value)}')

    platforms = split_list(get_field_value(sections, "platforms"))
    if platforms:
        write_yaml_list(lines, "platforms", platforms)

    summary = get_field_value(sections, "summary")
    if summary:
        lines.append(f'summary: {yaml_scalar(summary)}')

    lines.append("---")
    return lines


def build_frontmatter_for_tools(
    title: str, sections: dict, issue: dict, image_items, cover_image: str = ""
):
    lines = []
    lines.append("---")
    lines.append(f'title: {yaml_scalar(title)}')
    lines.append(f'date: {yaml_scalar(section_date_or_fallback(issue))}')
    lines.append("draft: false")
    lines.append('tool_type: "Tool"')
    if cover_image:
        lines.append(f'cover_image: {yaml_scalar(cover_image)}')

    tags = split_list(get_field_value(sections, "tags"))
    if tags:
        write_yaml_list(lines, "tags", tags)

    platforms = split_list(get_field_value(sections, "platforms"))
    if platforms:
        write_yaml_list(lines, "platforms", platforms)

    summary = get_field_value(sections, "summary")
    if summary:
        lines.append(f'summary: {yaml_scalar(summary)}')

    for key in ["github_link", "indiedb_link", "publisher_link"]:
        value = get_field_value(sections, key)
        if value:
            if key == "publisher_link":
                lines.append(f'website_link: {yaml_scalar(value)}')
            else:
                lines.append(f'{key}: {yaml_scalar(value)}')

    if image_items:
        write_yaml_list(lines, "images", image_items)

    lines.append("---")
    return lines


def create_markdown_page(content_path: Path, frontmatter_lines, body: str):
    content = "\n".join(frontmatter_lines) + "\n\n"
    body = (body or "").strip()
    if not body:
        body = "_No description provided._"
    content += f"{body}\n"
    content_path.write_text(content, encoding="utf-8")


def close_issue(issue: dict):
    close_payload = {"state": "closed"}
    issue_url = issue["url"]
    status, response = json_api_request("PATCH", issue_url, close_payload)
    print(f'Closed issue #{issue.get("number")}: status={status}')
    if status >= 300:
        print(response)
        raise SystemExit(1)


def dispatch_build_workflow(branch: str):
    repo = os.environ["GITHUB_REPOSITORY"]
    workflow = os.environ.get("BUILD_WORKFLOW", "main.yml")
    url = f"https://api.github.com/repos/{repo}/actions/workflows/{workflow}/dispatches"
    payload = {"ref": branch}
    status, response = json_api_request("POST", url, payload)
    print(f"Dispatched build workflow {workflow} on {branch}: status={status}")
    if status >= 300:
        print(response)
        raise SystemExit(1)


def process_experiment(issue, sections, image_urls, issue_number):
    title = get_field_value(sections, "title") or (issue.get("title") or "").strip() or "experiment"
    description = get_field_value(sections, "description")
    if not description:
        description = (issue.get("body") or "").strip() or "No description provided."

    candidate_stem = slugify(title)
    target_dir = Path("static/images/showcase/experiments")
    if not target_dir.exists():
        target_dir.mkdir(parents=True, exist_ok=True)

    downloaded_images = collect_downloaded_images(image_urls)
    if not downloaded_images:
        print("No files were created due to download issues.")
        return []

    removed_files = collect_image_paths(target_dir, candidate_stem)
    for removed_file in removed_files:
        removed_file.unlink()

    created_files = []
    for idx, media in enumerate(downloaded_images, start=1):
        stem = (
            f"{candidate_stem}-{idx:02d}" if len(downloaded_images) > 1 else candidate_stem
        )
        filename = next_available_path(target_dir, stem, media["extension"])
        image_path = target_dir / filename
        json_path = target_dir / f"{Path(filename).stem}.json"

        with image_path.open("wb") as image_file:
            image_file.write(media["data"])

        metadata = {
            "description": description,
            "link": get_field_value(sections, "project_link") or issue.get("html_url", ""),
        }
        with json_path.open("w", encoding="utf-8") as metadata_file:
            json.dump(metadata, metadata_file, ensure_ascii=False, indent=2)
            metadata_file.write("\n")

        created_files.extend([image_path, json_path])
        print(f"Created experiment entry: {image_path.name}, {json_path.name}")
    return created_files + removed_files


def process_content_entry(issue, sections, entry_type: str, issue_number: int, image_urls):
    title = get_field_value(sections, "title") or (issue.get("title") or "").strip()
    if not title:
        title = f"{entry_type}-{issue_number}"

    slug = slugify(title)
    if entry_type == "showcase":
        content_root = Path("content/showcase")
        media_root = Path("static/images/showcase")
    else:
        content_root = Path("content/showcase-tools")
        media_root = Path("static/images/showcase-tools")

    downloaded_media = collect_downloaded_images(image_urls)
    if not downloaded_media:
        print("No files were created due to download issues.")
        return []

    downloaded_cover = collect_downloaded_cover(collect_cover_urls(sections))
    if not downloaded_cover:
        print("No cover image found for content issue, skipping import.")
        return []

    if not content_root.exists():
        content_root.mkdir(parents=True, exist_ok=True)
    if not media_root.exists():
        media_root.mkdir(parents=True, exist_ok=True)

    removed_files = remove_matching_dirs(content_root, slug) + remove_matching_dirs(media_root, slug)

    content_dir = content_root / slug
    page_path = content_dir / "index.md"
    media_dir = media_root / slug
    media_dir.mkdir(parents=True, exist_ok=True)

    created_files = []
    cover_image_url = ""
    if downloaded_cover:
        cover_filename = next_available_path(media_dir, "00-cover", ".webp")
        cover_path = media_dir / cover_filename
        with cover_path.open("wb") as cover_file:
            cover_file.write(downloaded_cover["data"])
        created_files.append(cover_path)
        cover_image_url = f"/images/{'showcase' if entry_type == 'showcase' else 'showcase-tools'}/{slug}/{cover_path.name}"

    images_urls = []
    for idx, media in enumerate(downloaded_media, start=1):
        stem = f"{slug}-{idx:02d}" if len(downloaded_media) > 1 else slug
        filename = next_available_path(media_dir, stem, media["extension"])
        image_path = media_dir / filename
        with image_path.open("wb") as image_file:
            image_file.write(media["data"])
        created_files.append(image_path)
        images_urls.append(
            f"/images/{'showcase' if entry_type == 'showcase' else 'showcase-tools'}/{slug}/{image_path.name}"
        )

    if not created_files:
        print("No files were created due to download issues.")
        return []

    content_dir.mkdir(parents=True, exist_ok=True)
    if entry_type == "showcase":
        frontmatter_lines = build_frontmatter_for_showcase(
            title, sections, issue, cover_image_url
        )
    else:
        frontmatter_lines = build_frontmatter_for_tools(
            title, sections, issue, images_urls, cover_image_url
        )

    create_markdown_page(
        page_path,
        frontmatter_lines,
        get_field_value(sections, "description"),
    )
    created_files.append(page_path)
    return created_files + removed_files


def commit_and_push(issue_number, created_files):
    if not created_files:
        return

    git("config", "user.name", "github-actions[bot]")
    git("config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com")

    str_paths = [str(path) for path in created_files]
    git("add", *str_paths)
    status = subprocess.run(["git", "status", "--short", "--", *str_paths], capture_output=True, text=True)
    if not status.stdout.strip():
        print("No changes after add; skipping commit.")
        return
    commit_message = f"Add showcase content from issue #{issue_number}"
    git("commit", "-m", commit_message)

    repo = os.environ["GITHUB_REPOSITORY"]
    branch = os.environ.get("TARGET_BRANCH", "master")
    git(
        "push",
        f"https://x-access-token:{os.environ['GITHUB_TOKEN']}@github.com/{repo}.git",
        f"HEAD:{branch}",
    )
    dispatch_build_workflow(branch)


def main():
    payload = read_issue_payload()
    issue = payload.get("issue", {})
    if not issue:
        print("No issue payload found, skipping.")
        return 0

    if not has_label(issue, APPROVED_LABEL):
        print(f"Issue is not labeled '{APPROVED_LABEL}', skipping.")
        return 0

    issue_number = issue.get("number")
    body = (issue.get("body") or "").strip()
    sections = normalize_sections(parse_issue_sections(body))

    entry_type = make_entry_type(issue)
    if not entry_type:
        print("Issue submission type is not supported, skipping.")
        return 0

    image_urls = collect_image_urls(sections)
    if not image_urls:
        print("No image URLs found in issue body, nothing to import.")
        return 0

    if entry_type == "experiment":
        created_files = process_experiment(issue, sections, image_urls, issue_number)
    else:
        created_files = process_content_entry(issue, sections, entry_type, issue_number, image_urls)

    if not created_files:
        print("No files were created due to validation or download errors.")
        return 0

    commit_and_push(issue_number, created_files)
    close_issue(issue)
    print(f"Imported {len(created_files)} files and closed issue #{issue_number}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
