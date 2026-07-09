#!/usr/bin/env python3
"""
check_rumble_live.py — Best-effort detection of whether RilyRobo is
currently live-streaming on Rumble, via the same Playwright + persistent
cookie profile approach as fetch_rumble_channel.py (Rumble sits behind a
Cloudflare Managed Challenge, so a plain HTTP request won't clear it —
see that script's docstring for the full rationale).

WHY THIS IS ITS OWN SCRIPT, NOT PART OF fetch_live_status.py:
Every other check in fetch_live_status.py is a lightweight plain-HTTP
request. This one needs a full Chromium launch, a meaningfully heavier
dependency (Playwright + browser binary). Keeping it isolated means a
failure here can never affect the simple checks — fetch_live_status.py
just imports and calls it, same pattern add_video_source.py already uses
to import from fetch_video_metadata.py.

HOW "LIVE" IS DETECTED:
Rumble's channel page shows a "LIVE" badge on the currently-streaming
video's card. Like fetch_rumble_channel.py, this deliberately does NOT key
off Rumble's undocumented, unstable CSS class names — it looks for the
literal text "LIVE" as a short standalone badge, then walks up to the
nearest ancestor link matching Rumble's video URL pattern
(/v<id>-<slug>.html — stable routing, not styling) to recover that
stream's video ID. This is the only way to get a working embed URL for a
Rumble live stream at all: there is no "embed whatever's currently live on
this channel by username" URL to fall back on.

If a LIVE badge is found but the video ID can't be confidently extracted,
this returns (True, None) — the frontend then shows a "Watch on Rumble"
link instead of a broken iframe, the same fallback already used for
Rumble sources missing an embedUrl in scripts/scriptvideo.js.

Usage:
    python3 scripts/check_rumble_live.py --channel-url https://rumble.com/c/rilyrobo
"""
import argparse
import re
import sys
import time

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

from fetch_rumble_channel import PROFILE_DIR, CHALLENGE_TIMEOUT_MS, VIDEO_HREF_PATTERN

# Rumble's live badge is short, standalone text — matched exactly (not
# "contains LIVE" against arbitrary sentences) to avoid false positives
# from unrelated page text that happens to include those letters.
LIVE_BADGE_TEXT = re.compile(r"^\s*LIVE\s*$")


def _clear_cloudflare_if_present(page) -> bool:
    """Same Cloudflare-clearing logic as fetch_artstation_playwright.py /
    fetch_rumble_channel.py — duplicated rather than extracted into a
    shared module, matching this repo's existing precedent of light
    duplication between those two rather than forcing a shared-utility
    refactor no one asked for."""
    content = page.content()
    if "cf_challenge_container" in content or "Just a moment" in content:
        try:
            page.wait_for_selector("body", timeout=CHALLENGE_TIMEOUT_MS)
            time.sleep(3)
            content = page.content()
        except PlaywrightTimeout:
            pass
    return not ("cf_challenge_container" in content or "Just a moment" in content)


def check_rumble_live(channel_url: str, headed: bool = False) -> tuple[bool, str | None]:
    """Returns (is_live, embed_url_or_none). Raises on failure (network
    error, challenge never clears) so the caller's existing try/except
    safety-contract handling in fetch_live_status.py applies uniformly."""
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
            context.close()
            raise RuntimeError("page load timed out")

        if not _clear_cloudflare_if_present(page):
            context.close()
            raise RuntimeError("Cloudflare challenge did not clear")

        live_badge = page.get_by_text(LIVE_BADGE_TEXT).first
        try:
            live_badge.wait_for(timeout=5000)
        except PlaywrightTimeout:
            context.close()
            return False, None  # page loaded fine, no LIVE badge present — genuinely offline

        # Walk up from the badge to find the nearest ancestor <a> matching
        # Rumble's stable video URL pattern, to recover that stream's ID.
        video_link = live_badge.locator(
            "xpath=ancestor-or-self::a[contains(@href,'/v')][1] | "
            "xpath=ancestor::*[position()<=4]//a[contains(@href,'/v')][1]"
        ).first

        embed_url = None
        try:
            href = video_link.get_attribute("href", timeout=3000)
            if href and VIDEO_HREF_PATTERN.search(href):
                match = re.search(r"/v([a-z0-9]+)-", href, re.IGNORECASE)
                if match:
                    embed_url = f"https://rumble.com/embed/{match.group(1)}/"
        except PlaywrightTimeout:
            pass

        context.close()
        return True, embed_url


def main():
    parser = argparse.ArgumentParser(description="Check whether a Rumble channel is currently live.")
    parser.add_argument("--channel-url", required=True)
    parser.add_argument("--headed", action="store_true")
    args = parser.parse_args()

    try:
        live, embed_url = check_rumble_live(args.channel_url, headed=args.headed)
    except Exception as e:
        print(f"✗ Check failed: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"LIVE — embed URL: {embed_url or '(not found, will fall back to a channel link)'}" if live else "offline")


if __name__ == "__main__":
    main()