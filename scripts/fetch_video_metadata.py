#!/usr/bin/env python3
"""
fetch_video_metadata.py — Resolves data/video-sources.json (a hand-maintained
list of video URLs + curator-chosen tags/featured/date) into data/videos.json
(the fully-resolved file the frontend actually fetches).

Uses each platform's public oEmbed endpoint to auto-fill title/thumbnail/embed
markup — no API key or quota required for either YouTube or Rumble.

Known limitation: oEmbed does not return an upload date for either platform,
so the SEO "date" field must still be filled in by hand in video-sources.json
when known. VideoObject structured data is a nice-to-have, not this script's
primary job, so this gap is an accepted tradeoff rather than a blocker.

Safety contract (matches fetch_deviantart_api.py / fetch_artstation_playwright.py):
A source URL that fails to resolve (network error, deleted video, oEmbed 404,
or a blocked datacenter IP — see the ArtStation/DeviantArt precedent in this
repo) is SKIPPED with a warning. Its previous entry in videos.json, if any,
is left untouched rather than removed. Nothing is ever deleted just because
one run had a transient failure.

Usage:
    python3 scripts/fetch_video_metadata.py
    python3 scripts/fetch_video_metadata.py --refresh
        # Re-fetch metadata even for sources that already resolved
        # successfully in a previous run (normally skipped to avoid
        # hammering oEmbed endpoints on every CI run for no reason).
"""
import argparse
import json
import os
import re
import sys
import urllib.request
import urllib.parse
import urllib.error

SOURCES_FILE = "data/video-sources.json"
OUTPUT_FILE = "data/videos.json"

OEMBED_ENDPOINTS = {
    "youtube": "https://www.youtube.com/oembed?url={url}&format=json",
    "rumble": "https://rumble.com/api/Media/oembed.json?url={url}",
}

YOUTUBE_ID_PATTERN = re.compile(
    r"(?:youtu\.be/|youtube\.com/(?:watch\?v=|embed/|shorts/))([\w-]{11})"
)


def detect_platform(url: str) -> str | None:
    if "youtube.com" in url or "youtu.be" in url:
        return "youtube"
    if "rumble.com" in url:
        return "rumble"
    return None


def extract_youtube_id(url: str) -> str | None:
    match = YOUTUBE_ID_PATTERN.search(url)
    return match.group(1) if match else None


def extract_embed_src(oembed_html: str) -> str | None:
    """Pulls the iframe src out of an oEmbed 'html' field. This is how we get
    Rumble's actual working embed URL without reverse-engineering their
    undocumented ID/URL scheme ourselves — if Rumble changes their embed
    format tomorrow, this still works as long as their oEmbed response does."""
    match = re.search(r'src="([^"]+)"', oembed_html or "")
    return match.group(1) if match else None


def fetch_oembed(platform: str, url: str) -> dict:
    endpoint = OEMBED_ENDPOINTS[platform].format(url=urllib.parse.quote(url, safe=""))
    req = urllib.request.Request(endpoint, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())


def slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (title or "video").lower()).strip("-")
    return slug or "video"


def resolve_source(source: dict) -> dict | None:
    url = source.get("url", "").strip()
    if not url:
        print(f"⚠ Skipping source with no url: {source}", file=sys.stderr)
        return None

    platform = detect_platform(url)
    if not platform:
        print(f"⚠ Unrecognized platform for {url} — skipping. "
              f"Add a case to detect_platform() to support this host.", file=sys.stderr)
        return None

    try:
        data = fetch_oembed(platform, url)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
        print(f"⚠ oEmbed lookup failed for {url}: {e} — leaving any existing entry untouched.", file=sys.stderr)
        return None
    except json.JSONDecodeError:
        print(f"⚠ oEmbed returned non-JSON for {url} — leaving any existing entry untouched.", file=sys.stderr)
        return None

    title = data.get("title", "Untitled")
    resolved = {
        "url": url,
        "title": data.get("title", "Untitled"),
        "slug": slugify(data.get("title", "Untitled")),
    }
    source = {"platform": platform, "url": url, "thumbnail": data.get("thumbnail_url")}

    if platform == "youtube":
        video_id = extract_youtube_id(url)
        if not video_id:
            print(f"⚠ Could not extract a video ID from {url} — skipping.", file=sys.stderr)
            return None
        source["videoId"] = video_id
    else:
        embed_src = extract_embed_src(data.get("html", ""))
        if not embed_src:
            print(f"⚠ Could not extract an embed URL from {url}'s oEmbed response — skipping.", file=sys.stderr)
            return None
        source["embedUrl"] = embed_src

    resolved["sources"] = [source]
    for field in ("tags", "featured", "date", "description"):
        if field in source:  # NOTE: should read from the ORIGINAL `source` dict param (the video-sources.json entry), not the local `source` var above — rename one to avoid the collision
            resolved[field] = source[field]

    return resolved


def load_json(path: str, default: dict) -> dict:
    if not os.path.exists(path):
        return default
    try:
        with open(path) as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(f"⚠ {path} exists but isn't valid JSON — treating as empty.", file=sys.stderr)
        return default


def main():
    parser = argparse.ArgumentParser(description="Resolve video-sources.json into videos.json via oEmbed.")
    parser.add_argument("--refresh", action="store_true",
                         help="Re-fetch metadata even for sources that already resolved successfully last run.")
    args = parser.parse_args()

    sources_doc = load_json(SOURCES_FILE, {"sources": []})
    existing_doc = load_json(OUTPUT_FILE, {"items": []})
    existing_by_url = {item["url"]: item for item in existing_doc.get("items", []) if item.get("url")}

    # De-dupe slugs across the whole resolved set — two videos with similar
    # titles would otherwise collide and break deep-linking.
    seen_slugs: dict[str, int] = {}
    resolved_items = []
    failures = 0

    for source in sources_doc.get("sources", []):
        url = source.get("url", "").strip()
        already_resolved = existing_by_url.get(url)

        if source.get("manual"):
            # Manually-entered videos (added via add_video_source.py --manual
            # when oEmbed was blocked or the platform isn't supported) have
            # no oEmbed data to refresh from — never touch them here.
            if already_resolved:
                resolved_items.append(already_resolved)
            else:
                print(f"⚠ Source marked manual but has no resolved entry in {OUTPUT_FILE}: {url}. "
                    f"Run: python3 scripts/add_video_source.py --manual", file=sys.stderr)
                failures += 1
            continue

        if already_resolved and not args.refresh:
            resolved_items.append(already_resolved)
            continue

        resolved = resolve_source(source)

    for item in resolved_items:
        base = item.get("slug", "video")
        count = seen_slugs.get(base, 0)
        if count > 0:
            item["slug"] = f"{base}-{count + 1}"
        seen_slugs[base] = count + 1

    if not resolved_items:
        print(f"⚠ 0 videos resolved — NOT overwriting {OUTPUT_FILE}.", file=sys.stderr)
        sys.exit(1)

    os.makedirs("data", exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump({"items": resolved_items}, f, indent=2)

    print(f"✓ {len(resolved_items)} videos → {OUTPUT_FILE} ({failures} failed lookups this run)")


if __name__ == "__main__":
    main()