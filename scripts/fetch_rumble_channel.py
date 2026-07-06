#!/usr/bin/env python3
"""
fetch_rumble_channel.py — Automated Rumble channel video discovery via
Playwright, mirroring fetch_artstation_playwright.py's approach in this
repo (real browser + persistent cookie profile — Rumble sits behind
Cloudflare, the same barrier ArtStation has, so a plain HTTP request
won't work the way it does for YouTube's RSS feed).

READ BEFORE TRUSTING THIS IN CI:
Rumble has no public API or RSS feed (official feed export is a paid
"Rumble Pro" feature only). This scrapes the channel's videos listing
page directly. Rumble's CSS classes are undocumented and could change
without notice, so this deliberately extracts data from the one thing
structurally guaranteed to stay stable — the video URL pattern itself
(/v<id>-<slug>.html is core routing, not a styling choice) — rather than
betting on specific class names I can't verify are current.

RUN LOCALLY FIRST: python3 scripts/fetch_rumble_channel.py --channel-url ... --headed --debug
If it finds 0 videos, re-run with --dump-html out.html, open that file,
and adjust extract_videos_from_page() to match what's actually there.

Safety contract (matches every other fetch script in this repo): a failed
run (challenge not cleared, 0 videos parsed) never overwrites videos.json.

Usage:
    python3 scripts/fetch_rumble_channel.py --channel-url https://rumble.com/c/YourChannel
"""
import argparse
import re
import sys
import time
from urllib.parse import urljoin

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

from video_merge_utils import merge_discovered, dedupe_slugs, load_json, save_json, OUTPUT_FILE, OVERRIDES_FILE

# Shared with fetch_artstation_playwright.py — same browser fingerprint/
# cookies work fine for both sites, no reason to maintain two profiles.
PROFILE_DIR = ".playwright-profile"
CHALLENGE_TIMEOUT_MS = 25_000

# Rumble video pages always match this shape — the one part of their
# markup that's routing, not styling, and so the most stable thing to key off.
# Rumble's own video-grid links are absolute (https://rumble.com/v...),
# while unrelated sidebar/recommendation widgets use root-relative hrefs
# (/v...) — confirmed by inspecting an actual dumped page. Matching on
# "/v<id>-" anywhere in the string (not anchored to the start) catches
# both forms, since the routing segment itself is what's stable, not
# whether Rumble happens to render it as absolute or relative that day.
VIDEO_HREF_PATTERN = re.compile(r"/v[a-z0-9]+-", re.IGNORECASE)


def extract_videos_from_page(page, base_url: str, debug: bool) -> list:
    anchors = page.query_selector_all("a[href]")
    seen = set()
    videos = []

    for a in anchors:
        href = a.get_attribute("href") or ""
        path = href.split("?")[0]
        if not VIDEO_HREF_PATTERN.search(path):
            continue

        full_url = urljoin(base_url, href)
        if full_url in seen:
            continue
        seen.add(full_url)

        title = (a.get_attribute("title") or a.get_attribute("aria-label") or "").strip()
        img = a.query_selector("img")
        thumbnail = None
        if img:
            thumbnail = img.get_attribute("src") or img.get_attribute("data-src")
            if not title:
                title = (img.get_attribute("alt") or "").strip()
        if not title:
            title = (a.inner_text() or "").strip()

        if title and thumbnail:
            videos.append({"platform": "rumble", "url": full_url, "title": title, "thumbnail": thumbnail})
        elif debug:
            print(f"  [debug] Skipped {full_url} — title={title!r} thumbnail={thumbnail!r}", file=sys.stderr)

    return videos


def fetch_via_browser(channel_url: str, headed: bool, debug: bool, dump_html: str | None) -> list | None:
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            PROFILE_DIR,
            headless=not headed,
            viewport={"width": 1280, "height": 1600},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
        )
        page = context.new_page()

        try:
            page.goto(channel_url, wait_until="networkidle", timeout=CHALLENGE_TIMEOUT_MS)
        except PlaywrightTimeout:
            print("✗ Page load timed out.", file=sys.stderr)
            context.close()
            return None

        content = page.content()
        if "cf_challenge_container" in content or "Just a moment" in content:
            try:
                page.wait_for_selector("body", timeout=CHALLENGE_TIMEOUT_MS)
                time.sleep(3)
                content = page.content()
            except PlaywrightTimeout:
                pass

        if "cf_challenge_container" in content or "Just a moment" in content:
            print("✗ Cloudflare challenge did not clear automatically.", file=sys.stderr)
            context.close()
            return None

        # Rumble channel pages lazy-load more videos as you scroll.
        for _ in range(4):
            page.mouse.wheel(0, 2000)
            page.wait_for_timeout(600)

        if dump_html:
            with open(dump_html, "w", encoding="utf-8") as f:
                f.write(page.content())
            print(f"  Saved rendered HTML → {dump_html}", file=sys.stderr)

        videos = extract_videos_from_page(page, channel_url, debug)
        context.close()
        return videos


def main():
    parser = argparse.ArgumentParser(description="Discover videos from a Rumble channel via Playwright.")
    parser.add_argument("--channel-url", required=True, help="e.g. https://rumble.com/c/YourChannel")
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--debug", action="store_true")
    parser.add_argument("--dump-html", metavar="FILE")
    args = parser.parse_args()

    print("Attempting automated Rumble channel fetch (this may take 15-30s)...")
    discovered = fetch_via_browser(args.channel_url, args.headed, args.debug, args.dump_html)

    if discovered is None:
        print("\n⚠ Fetch failed. Existing data left untouched.", file=sys.stderr)
        print("  Fallback: python3 scripts/add_video_source.py --manual", file=sys.stderr)
        sys.exit(1)

    if not discovered:
        print("⚠ 0 videos parsed — NOT overwriting existing data.", file=sys.stderr)
        print("  Re-run with --headed --debug --dump-html out.html to diagnose.", file=sys.stderr)
        sys.exit(1)

    existing_doc = load_json(OUTPUT_FILE, {"items": []})
    overrides_doc = load_json(OVERRIDES_FILE, {"sources": []})

    merged = merge_discovered(discovered, existing_doc.get("items", []), overrides_doc)
    dedupe_slugs(merged)

    save_json(OUTPUT_FILE, {"items": merged})
    print(f"\n✓ {len(discovered)} Rumble videos found, {len(merged)} total → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()