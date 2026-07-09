#!/usr/bin/env python3
"""
backfill_rumble_embeds.py — Resolves missing Rumble `embedUrl` values in
data/videos.json via Rumble's oEmbed endpoint.

WHY THIS EXISTS:
Rumble videos onboarded via a manual data/video-sources.json entry get a
real embedUrl automatically — fetch_video_metadata.py calls oEmbed for
every manual source and extracts it from the response. Rumble videos
onboarded via channel AUTO-DISCOVERY (fetch_rumble_channel.py's Playwright
scraper) do NOT: that scraper only ever sees the watch-page URL (e.g.
https://rumble.com/v19tbhk-slug.html), never the embeddable one, because
Rumble's embed ID/URL scheme is undocumented (see extract_embed_src()'s
docstring in fetch_video_metadata.py) and is deliberately never guessed at
anywhere in this codebase.

The same gap shows up whenever an EXISTING item picks up a Rumble source
through cross-platform title-matching in video_merge_utils.merge_discovered()
— e.g. a video manually added as a YouTube source later gets a Rumble
re-upload auto-discovered and attached as an additional source. That
attached source has the same "url but no embedUrl" shape.

Without a real embedUrl, scripts/scriptvideo.js's player correctly falls
back to a "Watch on Rumble" link rather than trying (and silently failing)
to embed the raw watch page — Rumble sets X-Frame-Options/CSP that blocks
framing of it entirely. This script closes the gap by resolving the actual
embeddable URL via the exact same oEmbed call fetch_video_metadata.py
already uses successfully for manual sources, so auto-discovered Rumble
videos can play in-page too, instead of just linking out forever.

Safety contract (matches every other fetch/resolve script in this repo):
a source that fails to resolve is left exactly as it was. Never crashes
the run, never removes data, never touches a source that already has a
working embedUrl.

Usage:
    python3 scripts/backfill_rumble_embeds.py
"""
import json
import os
import sys
import urllib.error

# Reuses the oEmbed request/parsing logic that already works for Rumble —
# no reason to maintain a second copy of it here. Mirrors the same
# cross-script import pattern add_video_source.py already uses.
from fetch_video_metadata import fetch_oembed, extract_embed_src

OUTPUT_FILE = "data/videos.json"


def load_json(path: str, default: dict) -> dict:
    if not os.path.exists(path):
        return default
    try:
        with open(path) as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(f"⚠ {path} exists but isn't valid JSON — treating as empty.", file=sys.stderr)
        return default


def save_json(path: str, data: dict) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def resolve_rumble_embed_url(url: str) -> str | None:
    """Returns the embeddable iframe URL for a Rumble watch-page URL, or
    None on any failure. Never raises — callers apply the standard
    "leave it untouched, try again next run" safety contract instead of
    letting one bad video abort the whole backfill pass."""
    try:
        data = fetch_oembed("rumble", url)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError, KeyError):
        return None
    return extract_embed_src(data.get("html", ""))


def backfill(items: list) -> int:
    """Mutates `items` in place. Returns how many sources were fixed."""
    fixed = 0
    for item in items:
        for source in item.get("sources", []):
            if source.get("platform") != "rumble":
                continue
            if source.get("embedUrl") or not source.get("url"):
                continue  # already resolved, or nothing to resolve from

            embed_url = resolve_rumble_embed_url(source["url"])
            if embed_url:
                source["embedUrl"] = embed_url
                fixed += 1
                print(f"  ✓ Resolved: \"{item.get('title', source['url'])}\"")
            else:
                print(f"  ⚠ Still unresolved: \"{item.get('title', source['url'])}\" "
                      f"— will retry next run. Frontend falls back to a direct Rumble "
                      f"link in the meantime.", file=sys.stderr)
    return fixed


def main():
    doc = load_json(OUTPUT_FILE, {"items": []})
    items = doc.get("items", [])

    fixed = backfill(items)

    if fixed == 0:
        print("ℹ No missing Rumble embed URLs found (or none could be resolved this run).")
        return

    save_json(OUTPUT_FILE, {"items": items})
    print(f"✓ Backfilled {fixed} Rumble embed URL(s) → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()