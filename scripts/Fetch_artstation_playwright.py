#!/usr/bin/env python3
"""
fetch_artstation_playwright.py — Automated ArtStation fetch via Playwright,
to clear Cloudflare's Managed Challenge on /users/rilyrobo/projects.json.

v2 changes: captures each project's publish date. ArtStation's exact field
name for this hasn't been confirmed yet (Cloudflare blocked every attempt
to inspect the real response before this script existed) — so this checks
several plausible key names and degrades to "" gracefully rather than
crashing if none match. First successful run should be spot-checked:
if every item comes back with an empty date, the key name guess was wrong
and needs adjusting once the real response shape is visible.
"""
import argparse
import json
import os
import sys
import time

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

DATA_FILE = "data/artstation.json"
PROFILE_DIR = ".playwright-profile"
TARGET_URL = "https://www.artstation.com/users/rilyrobo/projects.json"
CHALLENGE_TIMEOUT_MS = 25_000


def _extract_date(entry: dict) -> str:
    """
    Tries several plausible field names since the real ArtStation response
    shape hasn't been directly observed yet (Cloudflare blocked inspection).
    Takes just the YYYY-MM-DD prefix of an ISO8601 string, sidestepping
    timezone-parsing edge cases entirely — good enough for date-only sorting.
    """
    raw = entry.get("published_at") or entry.get("created_at") or entry.get("updated_at") or ""
    return raw[:10] if len(raw) >= 10 else ""


def fetch_via_browser(headed: bool) -> list | None:
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
            try:
                page.wait_for_selector("body", timeout=CHALLENGE_TIMEOUT_MS)
                time.sleep(3)
                content = page.content()
            except PlaywrightTimeout:
                pass

        if "cf_challenge_container" in content or "Just a moment" in content:
            print("✗ Challenge did not clear automatically.", file=sys.stderr)
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
                items.append({
                    "title": title, "link": link, "image": image,
                    "date": _extract_date(entry),
                })

        return items


def main():
    parser = argparse.ArgumentParser(description="Automated ArtStation fetch via Playwright.")
    parser.add_argument("--headed", action="store_true")
    args = parser.parse_args()

    print("Attempting automated ArtStation fetch (this may take 10-25s)...")
    items = fetch_via_browser(headed=args.headed)

    if items is None:
        print(f"\n⚠ Fetch failed. Existing {DATA_FILE} left untouched.", file=sys.stderr)
        print("  Fallback: python3 scripts/add_artstation_item.py", file=sys.stderr)
        sys.exit(1)

    if not items:
        print(f"⚠ 0 items parsed — NOT overwriting {DATA_FILE}.", file=sys.stderr)
        sys.exit(1)

    dated = sum(1 for i in items if i["date"])
    if dated == 0:
        print(f"⚠ Warning: none of {len(items)} items had a parseable date — "
              f"the field-name guess in _extract_date() likely needs updating "
              f"now that a real response has been seen.", file=sys.stderr)

    os.makedirs("data", exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump({"items": items}, f, indent=2)

    print(f"✓ {len(items)} items ({dated} dated) → {DATA_FILE}")


if __name__ == "__main__":
    main()