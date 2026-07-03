#!/usr/bin/env python3
"""
add_artstation_item.py — Manually adds a single artwork entry to
data/artstation.json.

Why this exists: ArtStation's RSS feed and internal JSON endpoints are both
behind a Cloudflare Managed Challenge (confirmed via cf-mitigated: challenge
header + JS-orchestrated challenge payload on both /rss and
/users/rilyrobo/projects.json). This requires actual JavaScript execution
in a real browser to pass — no curl/requests-based fetch can clear it, and
workarounds (curl-impersonate, headless browser scraping) trade a one-time
fix for an ongoing arms race against Cloudflare's fingerprinting updates,
which is a worse long-term maintenance trade than a 30-second manual step
per new artwork.

Output schema matches the DeviantArt fetch scripts exactly, so
scriptgallery.js's merge engine treats entries from this tool identically
to API-fetched ones — no downstream changes needed.

Usage:
    python3 scripts/add_artstation_item.py
    python3 scripts/add_artstation_item.py --list      # view current entries
    python3 scripts/add_artstation_item.py --remove "Title text"
"""
import argparse
import json
import os
import sys

DATA_FILE = "data/artstation.json"


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


def add_item():
    data = load_data()

    print("Add a new ArtStation item. Ctrl+C to cancel at any point.\n")
    title = prompt_nonempty("Title")
    link = prompt_nonempty("Link (artstation.com project URL)")
    image = prompt_nonempty("Image URL (direct link to the artwork image)")

    # Prevent accidental duplicates — matched the same way the merge engine
    # does (case-insensitive, alphanumeric-only) so a re-entry of the same
    # piece doesn't create a phantom duplicate card in the gallery.
    norm = lambda s: "".join(c for c in s.lower() if c.isalnum())
    existing_titles = {norm(i["title"]) for i in data["items"]}
    if norm(title) in existing_titles:
        confirm = input(f"⚠ An item titled similarly to \"{title}\" already exists. Add anyway? [y/N]: ").strip().lower()
        if confirm != "y":
            print("Cancelled.")
            return

    data["items"].append({"title": title, "link": link, "image": image})
    save_data(data)
    print(f"\n✓ Added. {DATA_FILE} now has {len(data['items'])} items.")


def list_items():
    data = load_data()
    if not data["items"]:
        print(f"{DATA_FILE} has no items yet.")
        return
    print(f"{len(data['items'])} items in {DATA_FILE}:\n")
    for i, item in enumerate(data["items"], 1):
        print(f"  {i}. {item['title']}")
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


def main():
    parser = argparse.ArgumentParser(description="Manage manually-entered ArtStation gallery items.")
    parser.add_argument("--list", action="store_true", help="List all current items")
    parser.add_argument("--remove", metavar="TITLE", help="Remove an item by title (partial match)")
    args = parser.parse_args()

    if args.list:
        list_items()
    elif args.remove:
        remove_item(args.remove)
    else:
        add_item()


if __name__ == "__main__":
    main()