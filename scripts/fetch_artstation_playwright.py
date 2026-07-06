#!/usr/bin/env python3
"""
fetch_artstation_playwright.py — Automated ArtStation fetch via Playwright,
to clear Cloudflare's Managed Challenge on /users/rilyrobo/projects.json.

v3 changes:
  - Adds a `tags` field (list of gallery slugs, e.g. ["featured","3d-art"])
    to every item, so the frontend merge engine only shows an ArtStation
    piece in the galleries it actually belongs to — previously every AS
    item bled into every gallery page (Featured, 2D, 3D, Character Design
    all showed identical AS content, since no per-gallery association
    existed at all).
  - IMPORTANT: since this script overwrites artstation.json wholesale on
    every scheduled run, it now loads the EXISTING file first and carries
    over tags for any item it recognizes (matched by link, the one stable
    identifier). Only genuinely new items get DEFAULT_TAGS. Without this,
    any manual retagging done via add_artstation_item.py would silently
    revert on the next automated fetch — a data-loss trap worth closing
    proactively rather than discovering later.
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
CHALLENGE_TIMEOUT_MS = 35_000

# ── Configuration, not magic values ──────────────────────────────────────────
# All current ArtStation content is 3D work, so new items default to these
# two galleries. If your ArtStation output diversifies later, either:
#   (a) update this default, or
#   (b) leave it and retag specific items afterward with:
#       python3 scripts/add_artstation_item.py --retag "Title" --tags 2d-art
# Must match the gallery slugs derived in scriptgallery.js's gallerySlug()
# — i.e. each da-<slug>.json filename with "da-" and ".json" stripped.
DEFAULT_TAGS = ["featured", "3d-art"]
KNOWN_TAGS = ["featured", "2d-art", "3d-art", "character-design"]


def _extract_date(entry: dict) -> str:
    raw = entry.get("published_at") or entry.get("created_at") or entry.get("updated_at") or ""
    return raw[:10] if len(raw) >= 10 else ""


def _load_existing_tags_by_link() -> dict:
    """Returns {link: tags} for whatever's currently on disk, so a re-fetch
    doesn't clobber manual tag edits on items that still exist upstream."""
    if not os.path.exists(DATA_FILE):
        return {}
    try:
        with open(DATA_FILE) as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}
    return {i["link"]: i.get("tags", DEFAULT_TAGS)
            for i in data.get("items", []) if i.get("link")}


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

        existing_tags = _load_existing_tags_by_link()
        items = []
        for entry in data.get("data", data.get("projects", [])):
            title = (entry.get("title") or "").strip()
            link = entry.get("permalink") or entry.get("url") or ""
            cover = entry.get("cover") or {}
            image = cover.get("image_url") or cover.get("thumb_url") or ""

            if title and link and image:
                items.append({
                    "title": title,
                    "link": link,
                    "image": image,
                    "date": _extract_date(entry),
                    # Preserve prior manual tags for known items; only
                    # genuinely new links get the default set.
                    "tags": existing_tags.get(link, DEFAULT_TAGS),
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

    new_count = sum(1 for i in items if i["tags"] == DEFAULT_TAGS)
    os.makedirs("data", exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump({"items": items}, f, indent=2)

    print(f"✓ {len(items)} items → {DATA_FILE} "
          f"({new_count} new/default-tagged, {len(items) - new_count} retained prior tags)")


if __name__ == "__main__":
    main()
