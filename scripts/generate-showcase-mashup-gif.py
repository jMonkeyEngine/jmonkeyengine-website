#!/usr/bin/env python3
"""Generate a static showcase "mashup wall" image.

The script scans `static/images/showcase/<slug>/` for each showcase entry and
`static/images/showcase-tools/<slug>/` for tool entries. It falls back to local
front matter `image` / `images` entries when needed, picks ONE image
per showcase, randomizes per-game image choice and wall ordering, then composes a
single dense grid image and writes it next to the website assets.
"""

from __future__ import annotations

import argparse
import math
import random
import shutil
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory

import numpy as np
import yaml

ROOT = Path(__file__).resolve().parents[1]

CONTENT_DIR = ROOT / "content" / "showcase"
TOOLS_CONTENT_DIR = ROOT / "content" / "showcase-tools"
STATIC_DIR = ROOT / "static"
OUTPUT_DIR = STATIC_DIR / "images" / "showcase-mashup"
OUTPUT_WEBP = OUTPUT_DIR / "showcase-mashup.webp"
EXTRA_SCREENSHOT_DIRS = (
    STATIC_DIR / "images" / "showcase" / "screenshot",
    STATIC_DIR / "images" / "showcase" / "screenshots",
    STATIC_DIR / "images" / "showcase" / "experiments",
    STATIC_DIR / "images" / "showcase" / "tools",
)

IMAGE_EXTENSIONS = {".webp"}

IMAGE_FIELD_KEYS = ("image", "images")
DEFAULT_MAX_IMAGES = 16
DEFAULT_CELL_WIDTH = 256
DEFAULT_CELL_ASPECT = 16 / 9
DEFAULT_PADDING = 2
DEFAULT_PADDING_COLOR = "0x06080f"
TARGET_ASPECT = 16 / 9


def find_front_matter(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    start = text.find("---")
    if start != 0:
        return ""

    end = text.find("---", 3)
    if end == -1:
        return ""

    return text[3:end].strip()


def extract_image_paths(front_matter: str) -> list[str]:
    try:
        data = yaml.safe_load(front_matter)
    except Exception:
        return []

    if not isinstance(data, dict):
        return []

    urls: list[str] = []
    for key in IMAGE_FIELD_KEYS:
        value = data.get(key)
        if value is None:
            continue

        if isinstance(value, str):
            urls.append(value)
        elif isinstance(value, (list, tuple)):
            for item in value:
                if isinstance(item, str) and item.strip():
                    urls.append(item.strip())

    return urls


def resolve_static_file(url: str) -> Path | None:
    if not url or url.startswith(("http://", "https://")):
        return None

    candidate = url.strip()
    if candidate.startswith("/"):
        candidate = candidate[1:]

    static_path = STATIC_DIR / candidate
    if static_path.exists() and static_path.is_file():
        return static_path
    return None


def is_image_file(path: Path) -> bool:
    return path.suffix.lower() in IMAGE_EXTENSIONS


def collect_images_from_dir(path: Path) -> list[Path]:
    if not path.exists() or not path.is_dir():
        return []
    return [candidate for candidate in sorted(path.iterdir()) if candidate.is_file() and is_image_file(candidate)]


def collect_extra_screenshots() -> list[Path]:
    """Collect additional showcase images from the dedicated static screenshot folders."""
    images: list[Path] = []

    for extra_dir in EXTRA_SCREENSHOT_DIRS:
        if not extra_dir.exists() or not extra_dir.is_dir():
            continue

        for candidate in sorted(extra_dir.glob("**/*")):
            if candidate.is_file() and is_image_file(candidate):
                images.append(candidate)

    return images


def collect_tool_images_from_content() -> list[Path]:
    """Collect real local images referenced by content/showcase-tools pages.

    Tool cards may fall back to Font Awesome icons/placeholders in the site UI. Only
    actual local image assets are included in the mashup so remote screenshots do not
    make the build depend on external image downloads.
    """
    images: list[Path] = []
    seen: set[str] = set()
    for md in sorted(TOOLS_CONTENT_DIR.glob("*/index.md")):
        slug = md.parent.name
        page_images = collect_images_from_dir(STATIC_DIR / "images" / "showcase-tools" / slug)

        if not page_images:
            fm = find_front_matter(md)
            for rel in extract_image_paths(fm):
                resolved = resolve_static_file(rel)
                if resolved:
                    page_images.append(resolved)

        for resolved in page_images:
            key = resolved.as_posix()
            if key in seen:
                continue
            seen.add(key)
            images.append(resolved)
    return images


def collect_showcase_images() -> list[list[Path]]:
    """Return image lists grouped by showcase page (one list per game/project)."""
    by_game: list[list[Path]] = []

    for md in sorted(CONTENT_DIR.glob("*/index.md")):
        slug = md.parent.name
        images = collect_images_from_dir(STATIC_DIR / "images" / "showcase" / slug)

        if not images:
            fm = find_front_matter(md)
            for rel in extract_image_paths(fm):
                resolved = resolve_static_file(rel)
                if resolved:
                    images.append(resolved)

        if images:
            # Remove duplicates from the same showcase while preserving order.
            deduped: list[Path] = []
            seen = set()
            for item in images:
                key = item.as_posix()
                if key in seen:
                    continue
                seen.add(key)
                deduped.append(item)

            by_game.append(deduped)

    return by_game


def choose_one_per_game(
    by_game: list[list[Path]],
    *,
    randomize: bool = True,
    seed: int | None = None,
    rng: random.Random | None = None,
) -> list[Path]:
    """Pick one image per game and optionally randomize order."""
    if not by_game:
        return []

    if rng is None:
        rng = random.Random(seed) if seed is not None else random

    selected: list[Path] = []
    for game_images in by_game:
        if not game_images:
            continue
        if randomize:
            selected.append(rng.choice(game_images))
        else:
            selected.append(game_images[0])

    if randomize:
        rng.shuffle(selected)

    return selected
def ensure_ffmpeg_available() -> None:
    if not shutil.which("ffmpeg"):
        raise RuntimeError("ffmpeg not found in PATH")


def _hex_to_rgb(color: str) -> tuple[int, int, int]:
    """Convert 0xRRGGBB string to an RGB tuple."""
    raw = color.strip().lower()
    if raw.startswith("0x"):
        raw = raw[2:]
    value = int(raw, 16)
    return (value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF


def _read_png_rgb(path: Path) -> np.ndarray:
    with path.open("rb") as fp:
        header = fp.read(24)
    if len(header) < 24 or header[:8] != b"\x89PNG\r\n\x1a\n":
        raise RuntimeError(f"Not a PNG file: {path}")

    width = int.from_bytes(header[16:20], "big")
    height = int.from_bytes(header[20:24], "big")
    if width <= 0 or height <= 0:
        return np.zeros((height, width, 3), dtype=np.uint8)

    raw = subprocess.check_output(
        [
            "ffmpeg",
            "-v",
            "error",
            "-i",
            str(path),
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgb24",
            "-",
        ]
    )
    data = np.frombuffer(raw, dtype=np.uint8)
    expected = height * width * 3
    if data.size != expected:
        raise RuntimeError(f"Unexpected decoded PNG size for {path}: got {data.size}, expected {expected}")

    return data.reshape(height, width, 3)


def _write_png_rgb(path: Path, array: np.ndarray) -> None:
    h, w = array.shape[:2]
    rgb = np.ascontiguousarray(array[:, :, :3], dtype=np.uint8)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgb24",
            "-s",
            f"{w}x{h}",
            "-i",
            "pipe:0",
            "-frames:v",
            "1",
            "-update",
            "1",
            str(path),
        ],
        input=rgb.tobytes(),
        check=True,
    )


def _frame_is_too_dark(frame: np.ndarray) -> bool:
    """Reject near-empty/black screenshots so the wall never has black holes."""
    if frame.size == 0:
        return True
    luminance = frame.astype(np.float32).mean(axis=2)
    return float(luminance.mean()) < 34.0 or float(np.percentile(luminance, 95)) < 62.0


def choose_grid(
    n: int,
    cell_w: int,
    cell_h: int,
    target_ratio: float = TARGET_ASPECT,
) -> tuple[int, int, int]:
    """Pick cols/rows and number of used images without empty cells.

    If the requested image count does not tile neatly, we reduce it gradually until
    the final grid is a complete rectangle with no holes. This guarantees no
    blank cells in the rendered wall while keeping the selection as large as possible.
    """
    if n <= 0:
        return 1, 1, 1

    best_cols = 1
    best_rows = n
    best_used = n
    best_score = float("inf")

    candidates: list[tuple[int, int, int]] = []
    for used in range(n, 0, -1):
        for cols in range(1, used + 1):
            if used % cols != 0:
                continue
            rows = used // cols
            width = cols * cell_w + max(cols - 1, 0) * DEFAULT_PADDING
            height = rows * cell_h + max(rows - 1, 0) * DEFAULT_PADDING
            ratio = width / height

            ratio_penalty = abs(math.log(ratio / target_ratio))
            compact_penalty = abs(math.log(max(cols, rows) / max(1, min(cols, rows))) ) * 0.08
            reduction_penalty = (n - used) / max(n, 1) * 1.6

            # Prefer larger used counts close to n (only shrink when it improves geometry).
            score = ratio_penalty + compact_penalty + reduction_penalty
            candidates.append((score, used, cols, rows))

    best_score, best_used, best_cols, best_rows = min(candidates, key=lambda x: x[0])
    return best_cols, best_rows, best_used


def build_static_wall(
    frames: list[Path],
    output: Path,
    max_width: int | None = None,
    max_cols: int | None = None,
) -> Path:
    output.parent.mkdir(parents=True, exist_ok=True)

    n = len(frames)
    if n == 0:
        raise RuntimeError("No source frames provided")

    cell_w = DEFAULT_CELL_WIDTH
    cell_h = int(cell_w / DEFAULT_CELL_ASPECT)

    if max_cols is None:
        max_cols = n

    effective_count = min(n, max_cols)
    cols, rows, used = choose_grid(effective_count, cell_w, cell_h)
    selected_frames = frames[:used]

    if used < n:
        # Keep the final layout dense and centered: no empty cells.
        print(f"Using {used} of {n} collected images to avoid empty cells")

    with TemporaryDirectory() as tmp_dir:
        tmp = Path(tmp_dir)

        # Normalize every source frame to the same cell size, skipping black/empty
        # screenshots and pulling later candidates as replacements. If every
        # remaining source is dark, repeat a valid tile rather than leaving a hole.
        normalized = []
        skipped_dark = []
        candidate_index = 0
        attempts = 0
        max_attempts = max(len(frames) * 2, used)
        while len(normalized) < used and attempts < max_attempts:
            src = frames[candidate_index % len(frames)]
            candidate_index += 1
            attempts += 1
            dst = tmp / f"frame_{len(normalized):03d}.png"
            cmd = [
                "ffmpeg",
                "-y",
                "-loglevel",
                "error",
                "-i",
                str(src),
                "-vf",
                (
                    f"scale={cell_w}:{cell_h}:force_original_aspect_ratio=increase," \
                    f"crop={cell_w}:{cell_h}:x='(iw-{cell_w})/2':y='(ih-{cell_h})/2'"
                ),
                "-frames:v",
                "1",
                "-update",
                "1",
                str(dst),
            ]
            subprocess.check_call(cmd)
            frame = _read_png_rgb(dst)
            if _frame_is_too_dark(frame):
                skipped_dark.append(src)
                try:
                    dst.unlink()
                except OSError:
                    pass
                continue
            normalized.append(dst)

        if len(normalized) < used and normalized:
            print(f"Filling {used - len(normalized)} dark/empty slots by repeating valid frames")
            repeat_source = list(normalized)
            while len(normalized) < used:
                src = repeat_source[len(normalized) % len(repeat_source)]
                dst = tmp / f"frame_{len(normalized):03d}.png"
                shutil.copy2(src, dst)
                normalized.append(dst)
        if len(normalized) < used:
            raise RuntimeError("No non-dark showcase frames available for mashup")
        if skipped_dark:
            print(f"Skipped {len(skipped_dark)} too-dark screenshot(s) while filling the mashup")

        # Compose grid in one output frame (no animation).
        # The local ffmpeg tile implementation can collapse multi-row layouts, so
        # we stitch normalized frames in Python for reliability.
        raw_output = tmp / "mashup_raw.png"
        bg_r, bg_g, bg_b = _hex_to_rgb(DEFAULT_PADDING_COLOR)
        tile_w = cols * cell_w + max(cols - 1, 0) * DEFAULT_PADDING
        tile_h = rows * cell_h + max(rows - 1, 0) * DEFAULT_PADDING
        canvas = np.ones((tile_h, tile_w, 3), dtype=np.uint8)
        canvas[:, :, 0] *= bg_r
        canvas[:, :, 1] *= bg_g
        canvas[:, :, 2] *= bg_b

        for idx, frame_path in enumerate(normalized):
            row = idx // cols
            col = idx % cols
            if row >= rows:
                break

            frame = _read_png_rgb(frame_path)
            y0 = row * (cell_h + DEFAULT_PADDING)
            x0 = col * (cell_w + DEFAULT_PADDING)
            canvas[y0 : y0 + cell_h, x0 : x0 + cell_w, :] = frame

        _write_png_rgb(raw_output, canvas)

        # Keep the composition readable on the homepage while avoiding very wide outputs.
        if max_width is None:
            final_target = raw_output
        else:
            tile_w = cols * cell_w + max(cols - 1, 0) * DEFAULT_PADDING
            tile_h = rows * cell_h + max(rows - 1, 0) * DEFAULT_PADDING
            if tile_w > max_width:
                scale = f"scale={max_width}:-2"
                final_target = tmp / "mashup_scaled.png"
                resize_cmd = [
                    "ffmpeg",
                    "-y",
                    "-loglevel",
                    "error",
                    "-i",
                    str(raw_output),
                    "-vf",
                    scale,
                    "-frames:v",
                    "1",
                    "-update",
                    "1",
                    str(final_target),
                ]
                subprocess.check_call(resize_cmd)
            else:
                final_target = raw_output

        if output.suffix.lower() == ".webp":
            encode_cmd = [
                "ffmpeg",
                "-y",
                "-loglevel",
                "error",
                "-i",
                str(final_target),
                "-quality",
                "86",
                str(output),
            ]
            subprocess.check_call(encode_cmd)
        else:
            shutil.copy2(final_target, output)

    return output


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-images", type=int, default=DEFAULT_MAX_IMAGES, help="Maximum number of source images used in the wall (default 30)")
    parser.add_argument("--output", type=str, default=str(OUTPUT_WEBP))
    parser.add_argument("--max-width", type=int, default=1024)
    parser.add_argument("--seed", type=int, default=None, help="Optional seed for deterministic shuffling")
    parser.add_argument(
        "--no-random",
        action="store_true",
        help="Disable random image/game order (keep deterministic first image per game in path order)",
    )
    args = parser.parse_args()

    ensure_ffmpeg_available()

    image_groups = collect_showcase_images()
    extra_frames = collect_extra_screenshots()
    tool_frames = collect_tool_images_from_content()
    extra_frames.extend(tool_frames)

    # Allow showcase wall entries from standalone screenshots/experiments/tools in addition to
    # the one-shot-per-project assets under /content/showcase.
    if not image_groups and not extra_frames:
        raise RuntimeError("No local showcase image found under /content/showcase or /static/images/showcase/screenshot[s]/experiments/tools")

    randomize = not args.no_random
    rng = random.Random(args.seed) if args.seed is not None else random

    selected = choose_one_per_game(image_groups, randomize=randomize, rng=rng)
    if extra_frames:
        if randomize:
            if isinstance(rng, random.Random):
                rng.shuffle(extra_frames)
            else:
                random.shuffle(extra_frames)
        selected.extend(extra_frames)
        if randomize:
            if isinstance(rng, random.Random):
                rng.shuffle(selected)
            else:
                random.shuffle(selected)

    target_count = None
    if args.max_images > 0:
        target_count = max(1, min(args.max_images, len(selected)))
    elif args.max_images == 0:
        raise ValueError("--max-images must be > 0")
    if not selected:
        raise RuntimeError("No source frames selected for mashup")

    print(f"Collected {len(image_groups)} showcase entries, {len(extra_frames)} standalone/tool images ({len(tool_frames)} from tools content)")
    print(f"Using {target_count or len(selected)} images for mashup")
    print(f"Randomized: {randomize}")


    output = Path(args.output)
    build_static_wall(selected, output, max_width=args.max_width, max_cols=target_count)

    print(f"Created {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
