#!/usr/bin/env python3
"""
add_artstation_item.py — Manually manages data/artstation.json.
Permanent, zero-fragility fallback for when automated Playwright fetching
can't clear ArtStation's Cloudflare challenge.

v3: adds gallery tagging. Each item's "tags" array controls which gallery
page(s) it appears on (frontend merge engine filters by tag, matching the
gallery's slug — see gallerySlug() in scripts/scriptgallery.js). Without
tags, an item won't appear in ANY merged gallery — it'll still exist in the
file, just invisible until tagged.

Usage:
    python3 scripts/add_artstation_item.py                # add one item
    python3 scripts/add_artstation_item.py --list
    python3 scripts/add_artstation_item.py --remove "Title text"
    python3 scripts/add_artstation_item.py --retag "Title text" --tags featured,3d-art
    python3 scripts/add_artstation_item.py --set-default-tags
        # One-time migration: applies DEFAULT_TAGS to any existing item
        # that has no "tags" field yet (e.g. items added before this
        # feature existed). Safe to run repeatedly — never touches items
        # that already have tags.
"""
import argparse
import json
import os
import sys
from datetime import date as date_cls

DATA_FILE = "data/artstation.json"

# Must match KNOWN_TAGS/DEFAULT_TAGS in fetch_artstation_playwright.py and
# the gallery slugs derived in scriptgallery.js's gallerySlug(). No shared
# config file exists across Python/JS in this static-site setup, so these
# three locations are kept in sync manually — update all three if a new
# gallery folder is ever added.
KNOWN_TAGS = ["featured", "2d-art", "3d-art", "character-design"]
DEFAULT_TAGS = ["featured", "3d-art"]


def load_data() -> dict:
    if not os.path.exists(DATA_FILE):
        return {"items": []}
    with open(DATA_FILE) as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            print(f"⚠ {DATA_FILE} exists but isn't valid JSON — starting fresh.", file=sys.stderr)
            return {"items": []}


def save_data(data: dict) -> None:
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def prompt_nonempty(label: str) -> str:
    while True:
        value = input(f"{label}: ").strip()
        if value:
            return value
        print("  (required, try again)")


def prompt_date() -> str:
    today = date_cls.today().isoformat()
    while True:
        value = input(f"Date uploaded (YYYY-MM-DD) [default: {today}]: ").strip()
        if not value:
            return today
        try:
            date_cls.fromisoformat(value)
            return value
        except ValueError:
            print("  Invalid format — use YYYY-MM-DD (e.g. 2026-03-14).")


def parse_and_validate_tags(raw: str) -> list:
    tags = [t.strip() for t in raw.split(",") if t.strip()]
    unknown = [t for t in tags if t not in KNOWN_TAGS]
    if unknown:
        print(f"  ⚠ Warning: {unknown} not in known gallery slugs {KNOWN_TAGS}.")
        print("    Item will still be saved, but won't appear on any existing gallery page")
        print("    with these unrecognized tags — check for typos.")
    return tags


def prompt_tags() -> list:
    default_str = ",".join(DEFAULT_TAGS)
    while True:
        raw = input(f"Galleries (comma-separated: {', '.join(KNOWN_TAGS)}) [default: {default_str}]: ").strip()
        if not raw:
            return DEFAULT_TAGS
        return parse_and_validate_tags(raw)


def add_item():
    data = load_data()

    print("Add a new ArtStation item. Ctrl+C to cancel at any point.\n")
    title = prompt_nonempty("Title")
    link = prompt_nonempty("Link (artstation.com project URL)")
    image = prompt_nonempty("Image URL (direct link to the artwork image)")
    upload_date = prompt_date()
    tags = prompt_tags()

    norm = lambda s: "".join(c for c in s.lower() if c.isalnum())
    existing_titles = {norm(i["title"]) for i in data["items"]}
    if norm(title) in existing_titles:
        confirm = input(f"⚠ An item titled similarly to \"{title}\" already exists. Add anyway? [y/N]: ").strip().lower()
        if confirm != "y":
            print("Cancelled.")
            return

    data["items"].append({
        "title": title, "link": link, "image": image,
        "date": upload_date, "tags": tags,
    })
    save_data(data)
    print(f"\n✓ Added, tagged {tags}. {DATA_FILE} now has {len(data['items'])} items.")


def list_items():
    data = load_data()
    if not data["items"]:
        print(f"{DATA_FILE} has no items yet.")
        return
    print(f"{len(data['items'])} items in {DATA_FILE}:\n")
    for i, item in enumerate(data["items"], 1):
        date_str = item.get("date") or "(no date)"
        tags_str = ", ".join(item.get("tags", [])) or "(untagged — invisible on all galleries)"
        print(f"  {i}. [{date_str}] {item['title']}")
        print(f"     tags: {tags_str}")
        print(f"     {item['link']}")


def remove_item(title_query: str):
    data = load_data()
    norm = lambda s: "".join(c for c in s.lower() if c.isalnum())
    query = norm(title_query)

    matches = [i for i in data["items"] if query in norm(i["title"])]
    if not matches:
        print(f"No items matched \"{title_query}\".")
        return
    if len(matches) > 1:
        print(f"Multiple items matched \"{title_query}\" — be more specific:")
        for m in matches:
            print(f"  - {m['title']}")
        return

    data["items"] = [i for i in data["items"] if i is not matches[0]]
    save_data(data)
    print(f"✓ Removed \"{matches[0]['title']}\". {DATA_FILE} now has {len(data['items'])} items.")


def retag_item(title_query: str, tags_raw: str):
    data = load_data()
    norm = lambda s: "".join(c for c in s.lower() if c.isalnum())
    query = norm(title_query)

    matches = [i for i in data["items"] if query in norm(i["title"])]
    if not matches:
        print(f"No items matched \"{title_query}\".")
        return
    if len(matches) > 1:
        print(f"Multiple items matched \"{title_query}\" — be more specific:")
        for m in matches:
            print(f"  - {m['title']}")
        return

    tags = parse_and_validate_tags(tags_raw)
    matches[0]["tags"] = tags
    save_data(data)
    print(f"✓ Retagged \"{matches[0]['title']}\" → {tags}")


def set_default_tags():
    """Migration helper: tags any pre-existing item that has no tags field
    (i.e. was added before this feature existed) with DEFAULT_TAGS. Never
    touches an item that already has a tags field, even an empty one —
    an empty list is treated as an intentional "show nowhere" choice."""
    data = load_data()
    updated = 0
    for item in data["items"]:
        if "tags" not in item:
            item["tags"] = DEFAULT_TAGS
            updated += 1
    save_data(data)
    print(f"✓ Applied default tags {DEFAULT_TAGS} to {updated} previously-untagged item(s).")
    if updated == 0:
        print("  (Nothing to do — every item already has a tags field.)")


def main():
    parser = argparse.ArgumentParser(description="Manage manually-entered ArtStation gallery items.")
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--remove", metavar="TITLE")
    parser.add_argument("--retag", metavar="TITLE")
    parser.add_argument("--tags", metavar="TAG1,TAG2", help="Used with --retag")
    parser.add_argument("--set-default-tags", action="store_true")
    args = parser.parse_args()

    if args.list:
        list_items()
    elif args.remove:
        remove_item(args.remove)
    elif args.retag:
        if not args.tags:
            print("✗ --retag requires --tags \"tag1,tag2\"", file=sys.stderr)
            sys.exit(1)
        retag_item(args.retag, args.tags)
    elif args.set_default_tags:
        set_default_tags()
    else:
        add_item()


if __name__ == "__main__":
    main()