#!/usr/bin/env python3
"""
fetch_artstation_playwright.py — Automated ArtStation fetch using a real
browser engine, to clear Cloudflare's Managed Challenge on
/users/rilyrobo/projects.json (confirmed via cf-mitigated: challenge header
and cType: 'managed' in the challenge payload — plain curl/requests can
never pass this, since it requires real JavaScript execution).

Runs both locally (--headed for debugging) and in GitHub Actions (always
headless there). Reliability is expected to be LOWER when run from GitHub
Actions than from a residential connection — datacenter IP ranges get
harsher Cloudflare scrutiny (same root cause that blocked the DeviantArt
RSS endpoint earlier in this project), and CI runners are ephemeral, so a
persistent clearance-cookie profile can't meaningfully carry over between
scheduled runs the way it can locally.

This is NOT guaranteed to keep working indefinitely — Cloudflare tightens
headless-browser fingerprinting periodically. That's expected to happen
eventually, not a bug to chase when it does. The calling workflow treats a
failure here as routine and recoverable: it leaves existing data untouched
and opens a tracking issue rather than failing loudly or corrupting data.
Fallback: scripts/add_artstation_item.py (zero scraping, zero fragility).

Usage:
    python3 scripts/fetch_artstation_playwright.py
    python3 scripts/fetch_artstation_playwright.py --headed   # local debug only
"""
import argparse
import json
import os
import sys
import time

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

DATA_FILE = "data/artstation.json"
PROFILE_DIR = ".playwright-profile"   # only meaningfully persistent locally; harmless in CI
TARGET_URL = "https://www.artstation.com/users/rilyrobo/projects.json"
CHALLENGE_TIMEOUT_MS = 25_000


def fetch_via_browser(headed: bool) -> list | None:
    """
    Returns a list of {"title","link","image"} dicts on success, or None if
    the challenge couldn't be cleared. Caller must NOT overwrite existing
    data on None — that's the safety contract this whole project relies on.
    """
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            PROFILE_DIR,
            headless=not headed,
            viewport={"width": 1280, "height": 800},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
        )
        page = context.new_page()

        try:
            response = page.goto(TARGET_URL, wait_until="networkidle", timeout=CHALLENGE_TIMEOUT_MS)
        except PlaywrightTimeout:
            print("✗ Page load timed out — network issue or challenge never resolved.", file=sys.stderr)
            context.close()
            return None

        content = page.content()
        if "cf_challenge_container" in content or "Just a moment" in content:
            # Managed Challenges sometimes take a few seconds of JS execution
            # before auto-resolving — give it one real chance rather than
            # failing on first sight of challenge markup.
            try:
                page.wait_for_selector("body", timeout=CHALLENGE_TIMEOUT_MS)
                time.sleep(3)
                content = page.content()
            except PlaywrightTimeout:
                pass

        if "cf_challenge_container" in content or "Just a moment" in content:
            print("✗ Challenge did not clear automatically — likely escalated to", file=sys.stderr)
            print("  an interactive challenge, which headless Playwright cannot solve.", file=sys.stderr)
            context.close()
            return None

        try:
            body = response.text() if response else content
            data = json.loads(body)
        except (json.JSONDecodeError, AttributeError) as e:
            print(f"✗ Challenge appeared to clear, but response wasn't valid JSON: {e}", file=sys.stderr)
            context.close()
            return None

        context.close()

        items = []
        for entry in data.get("data", data.get("projects", [])):
            title = (entry.get("title") or "").strip()
            link = entry.get("permalink") or entry.get("url") or ""
            cover = entry.get("cover") or {}
            image = cover.get("image_url") or cover.get("thumb_url") or ""

            if title and link and image:
                items.append({"title": title, "link": link, "image": image})

        return items


def main():
    parser = argparse.ArgumentParser(description="Automated ArtStation fetch via Playwright.")
    parser.add_argument("--headed", action="store_true", help="Show the browser window (local debugging only — has no effect/use in CI)")
    args = parser.parse_args()

    print("Attempting automated ArtStation fetch (this may take 10-25s)...")
    items = fetch_via_browser(headed=args.headed)

    if items is None:
        print(f"\n⚠ Fetch failed. Existing {DATA_FILE} left untouched.", file=sys.stderr)
        print("  Fallback: python3 scripts/add_artstation_item.py", file=sys.stderr)
        sys.exit(1)

    if not items:
        print(f"⚠ 0 items parsed from a successful response — NOT overwriting {DATA_FILE}.", file=sys.stderr)
        print("  Response shape may have changed; inspect manually.", file=sys.stderr)
        sys.exit(1)

    os.makedirs("data", exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump({"items": items}, f, indent=2)

    print(f"✓ {len(items)} items → {DATA_FILE}")


if __name__ == "__main__":
    main()