#!/usr/bin/env python3
"""
add_video_source.py — Manages data/video-sources.json (curator intent) and
data/videos.json (resolved output) together, as a single operation.

This exists for three cases fetch_video_metadata.py alone doesn't cover:
  1. Quick single-video adds without hand-editing JSON.
  2. Manual fallback when a platform's oEmbed is blocked or unsupported
     (mirrors add_artstation_item.py's role as ArtStation's manual fallback
     when its Cloudflare challenge can't be cleared automatically).
  3. Safe removal/retagging/re-featuring that keeps both JSON files in sync
     — editing them separately by hand is how they'd drift apart.

Reuses fetch_video_metadata.py's oEmbed resolution logic via import rather
than duplicating it — there is exactly one place in this codebase that
knows how to talk to YouTube/Rumble's oEmbed endpoints.

Usage:
    python3 scripts/add_video_source.py                          # add, resolved via oEmbed
    python3 scripts/add_video_source.py --manual                 # add, enter details by hand
    python3 scripts/add_video_source.py --list
    python3 scripts/add_video_source.py --remove "Demo Reel Quarter 6"
    python3 scripts/add_video_source.py --retag "Demo Reel Quarter 6" --tags demo-reel
    python3 scripts/add_video_source.py --set-featured "Animation Demo Reel 2020"
"""
import argparse
import json
import os
import sys
from datetime import date as date_cls

from fetch_video_metadata import (
    resolve_source,
    slugify,
    extract_youtube_id,
    load_json,
    SOURCES_FILE,
    OUTPUT_FILE,
)

# Must match the keys of VIDEO_TAG_LABELS in scripts/scriptvideo.js — no
# shared config file exists across Python/JS in this static-site setup, so
# these two locations are kept in sync manually. Same pattern already used
# for ArtStation's gallery tags (see KNOWN_TAGS in add_artstation_item.py).
KNOWN_TAGS = ["demo-reel", "animation", "narration"]


# ── Prompt helpers ──────────────────────────────────────────────────────────
def prompt_nonempty(label: str) -> str:
    while True:
        value = input(f"{label}: ").strip()
        if value:
            return value
        print("  (required, try again)")


def confirm(prompt: str) -> bool:
    return input(f"{prompt} [y/N]: ").strip().lower() == "y"


def prompt_optional_date() -> str | None:
    while True:
        value = input("Upload date if known (YYYY-MM-DD, optional — enables SEO structured data): ").strip()
        if not value:
            return None
        try:
            date_cls.fromisoformat(value)
            return value
        except ValueError:
            print("  Invalid format — use YYYY-MM-DD (e.g. 2026-03-14), or leave blank.")


def parse_and_validate_tags(raw: str) -> list:
    tags = [t.strip() for t in raw.split(",") if t.strip()]
    unknown = [t for t in tags if t not in KNOWN_TAGS]
    if unknown:
        print(f"  ⚠ Warning: {unknown} not in known tags {KNOWN_TAGS}.")
        print("    The video will still be saved, but won't get a readable filter-button")
        print("    label until you add it to VIDEO_TAG_LABELS in scripts/scriptvideo.js.")
    return tags


def prompt_tags() -> list:
    raw = input(f"Tags (comma-separated: {', '.join(KNOWN_TAGS)}, or blank to skip): ").strip()
    return parse_and_validate_tags(raw) if raw else []


def prompt_manual_resolution(url: str, tags: list, featured: bool, date: str | None) -> dict:
    print("\nManual entry mode — enter the video's details by hand.")
    platform = ""
    while platform not in ("youtube", "rumble", "other"):
        platform = input("Platform (youtube/rumble/other): ").strip().lower()

    title = prompt_nonempty("Title")
    thumbnail = input("Thumbnail image URL (optional, blank = none): ").strip() or None

    resolved = {
        "url": url, "platform": platform, "title": title,
        "thumbnail": thumbnail, "slug": slugify(title), "tags": tags,
    }
    if featured:
        resolved["featured"] = True
    if date:
        resolved["date"] = date

    if platform == "youtube":
        resolved["videoId"] = extract_youtube_id(url) or prompt_nonempty(
            "YouTube video ID (the 11-character code from the URL)"
        )
    else:
        resolved["embedUrl"] = prompt_nonempty(
            "Direct iframe embed URL (find this via the platform's own \"Share > Embed\" option)"
        )

    return resolved


# ── JSON helpers ──────────────────────────────────────────────────────────
def save_json(path: str, data: dict) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def dedupe_slugs(items: list) -> None:
    seen: dict[str, int] = {}
    for item in items:
        base = item.get("slug") or slugify(item.get("title", "video"))
        count = seen.get(base, 0)
        item["slug"] = base if count == 0 else f"{base}-{count + 1}"
        seen[base] = count + 1


def find_matching_sources(query: str, sources: list, resolved_by_url: dict) -> list:
    """Matches against a source's raw URL OR (if already resolved) its
    human-readable title — video-sources.json entries have no title of
    their own until oEmbed (or manual entry) resolves them."""
    norm = lambda s: "".join(c for c in s.lower() if c.isalnum())
    q = norm(query)
    matches = []
    for src in sources:
        url = src.get("url", "")
        title = resolved_by_url.get(url, {}).get("title", "")
        if q in norm(url) or (title and q in norm(title)):
            matches.append(src)
    return matches


def _report_ambiguous(matches: list, resolved_by_url: dict) -> None:
    print("Multiple sources matched — be more specific:")
    for m in matches:
        print(f"  - {resolved_by_url.get(m['url'], {}).get('title', m['url'])}")


# ── Commands ──────────────────────────────────────────────────────────────
def add_source(manual: bool):
    sources_doc = load_json(SOURCES_FILE, {"sources": []})
    videos_doc = load_json(OUTPUT_FILE, {"items": []})

    print("Add a new video source. Ctrl+C to cancel at any point.\n")
    url = prompt_nonempty("Video URL (YouTube or Rumble link)")

    if any(s.get("url") == url for s in sources_doc["sources"]):
        print(f"⚠ This URL is already in {SOURCES_FILE}. Use --retag/--remove instead.")
        return

    tags = prompt_tags()
    featured = confirm("Feature this as the default video shown when the Videos page loads?")
    date = prompt_optional_date()

    source_entry = {"url": url, "tags": tags}
    if date:
        source_entry["date"] = date
    if featured:
        for s in sources_doc["sources"]:
            s.pop("featured", None)
        source_entry["featured"] = True

    resolved = None
    if manual:
        source_entry["manual"] = True
        resolved = prompt_manual_resolution(url, tags, featured, date)
    else:
        print("Resolving via oEmbed...")
        resolved = resolve_source(source_entry)
        if resolved is None:
            print("\n⚠ Automatic resolution failed (see warning above).")
            if confirm("Enter the video's details manually instead?"):
                source_entry["manual"] = True
                resolved = prompt_manual_resolution(url, tags, featured, date)
            else:
                print(f"Saved to {SOURCES_FILE} unresolved — the next run of "
                      f"fetch_video_metadata.py will retry it automatically.")

    sources_doc["sources"].append(source_entry)
    save_json(SOURCES_FILE, sources_doc)

    if resolved:
        videos_doc["items"] = [i for i in videos_doc["items"] if i.get("url") != url]
        videos_doc["items"].append(resolved)
        dedupe_slugs(videos_doc["items"])
        save_json(OUTPUT_FILE, videos_doc)
        print(f"\n✓ Added \"{resolved['title']}\" — live in both {SOURCES_FILE} and {OUTPUT_FILE}.")
    else:
        print(f"\n✓ Added to {SOURCES_FILE} only (not yet resolved).")


def list_sources():
    sources_doc = load_json(SOURCES_FILE, {"sources": []})
    videos_doc = load_json(OUTPUT_FILE, {"items": []})
    resolved_by_url = {i["url"]: i for i in videos_doc.get("items", []) if i.get("url")}

    if not sources_doc["sources"]:
        print(f"{SOURCES_FILE} has no video sources yet.")
        return

    print(f"{len(sources_doc['sources'])} video source(s):\n")
    for i, src in enumerate(sources_doc["sources"], 1):
        url = src.get("url", "(no url)")
        resolved = resolved_by_url.get(url)
        title = resolved["title"] if resolved else "(not yet resolved)"
        tags = ", ".join(src.get("tags", [])) or "(untagged)"
        flags = [f for f, v in (("FEATURED", src.get("featured")), ("manual entry", src.get("manual"))) if v]
        flag_str = f" [{', '.join(flags)}]" if flags else ""
        print(f"  {i}. {title}{flag_str}\n     tags: {tags}\n     {url}")


def remove_source(query: str):
    sources_doc = load_json(SOURCES_FILE, {"sources": []})
    videos_doc = load_json(OUTPUT_FILE, {"items": []})
    resolved_by_url = {i["url"]: i for i in videos_doc.get("items", []) if i.get("url")}

    matches = find_matching_sources(query, sources_doc["sources"], resolved_by_url)
    if not matches:
        print(f"No source matched \"{query}\".")
        return
    if len(matches) > 1:
        _report_ambiguous(matches, resolved_by_url)
        return

    target_url = matches[0]["url"]
    sources_doc["sources"] = [s for s in sources_doc["sources"] if s["url"] != target_url]
    videos_doc["items"] = [i for i in videos_doc["items"] if i.get("url") != target_url]

    save_json(SOURCES_FILE, sources_doc)
    save_json(OUTPUT_FILE, videos_doc)
    print(f"✓ Removed. {len(sources_doc['sources'])} source(s) remain.")


def retag_source(query: str, tags_raw: str):
    tags = parse_and_validate_tags(tags_raw)
    sources_doc = load_json(SOURCES_FILE, {"sources": []})
    videos_doc = load_json(OUTPUT_FILE, {"items": []})
    resolved_by_url = {i["url"]: i for i in videos_doc.get("items", []) if i.get("url")}

    matches = find_matching_sources(query, sources_doc["sources"], resolved_by_url)
    if not matches:
        print(f"No source matched \"{query}\".")
        return
    if len(matches) > 1:
        _report_ambiguous(matches, resolved_by_url)
        return

    target_url = matches[0]["url"]
    for s in sources_doc["sources"]:
        if s["url"] == target_url:
            s["tags"] = tags
    for i in videos_doc["items"]:
        if i.get("url") == target_url:
            i["tags"] = tags

    save_json(SOURCES_FILE, sources_doc)
    save_json(OUTPUT_FILE, videos_doc)
    print(f"✓ Retagged → {tags}")


def set_featured(query: str):
    sources_doc = load_json(SOURCES_FILE, {"sources": []})
    videos_doc = load_json(OUTPUT_FILE, {"items": []})
    resolved_by_url = {i["url"]: i for i in videos_doc.get("items", []) if i.get("url")}

    matches = find_matching_sources(query, sources_doc["sources"], resolved_by_url)
    if not matches:
        print(f"No source matched \"{query}\".")
        return
    if len(matches) > 1:
        _report_ambiguous(matches, resolved_by_url)
        return

    target_url = matches[0]["url"]

    # Exactly one featured video at a time — the frontend takes the first
    # match it finds, so leaving multiple set is a silent footgun rather
    # than a visible error. Enforced here as an atomic operation.
    for s in sources_doc["sources"]:
        s["featured"] = (s["url"] == target_url) or None
        if not s["featured"]:
            s.pop("featured", None)
    for i in videos_doc["items"]:
        if i.get("url") == target_url:
            i["featured"] = True
        else:
            i.pop("featured", None)

    save_json(SOURCES_FILE, sources_doc)
    save_json(OUTPUT_FILE, videos_doc)
    print(f"✓ \"{resolved_by_url.get(target_url, {}).get('title', target_url)}\" is now the featured video.")


def main():
    parser = argparse.ArgumentParser(description="Manage data/video-sources.json and data/videos.json together.")
    parser.add_argument("--manual", action="store_true",
                         help="Skip oEmbed and enter video details by hand (use when a platform's oEmbed is blocked or unsupported).")
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--remove", metavar="QUERY")
    parser.add_argument("--retag", metavar="QUERY")
    parser.add_argument("--tags", metavar="TAG1,TAG2", help="Used with --retag")
    parser.add_argument("--set-featured", metavar="QUERY")
    args = parser.parse_args()

    if args.list:
        list_sources()
    elif args.remove:
        remove_source(args.remove)
    elif args.retag:
        if not args.tags:
            print("✗ --retag requires --tags \"tag1,tag2\"", file=sys.stderr)
            sys.exit(1)
        retag_source(args.retag, args.tags)
    elif args.set_featured:
        set_featured(args.set_featured)
    else:
        add_source(manual=args.manual)


if __name__ == "__main__":
    main()