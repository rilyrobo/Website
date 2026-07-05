"""
video_merge_utils.py — Shared logic for merging auto-discovered videos
(from any platform) into data/videos.json. Used by both
fetch_channel_videos.py (YouTube) and fetch_rumble_channel.py (Rumble).

Extracted into its own module specifically to avoid duplicating
cross-platform duplicate-detection logic in two files — exactly the kind
of "two places that must be kept in sync by hand" trap this codebase
already hit once with ArtStation's KNOWN_TAGS list.

Duplicate-detection strategy (normalize title -> compare) deliberately
mirrors scriptgallery.js's normTitle()/mergeItems(), used to merge
DeviantArt + ArtStation pieces of the same artwork — same problem, same
solution, so videos and art behave consistently across the whole site.
"""
import json
import os
import re

OUTPUT_FILE = "data/videos.json"
OVERRIDES_FILE = "data/video-sources.json"


def norm_title(title: str) -> str:
    """Must stay behaviorally identical to normTitle() in scriptgallery.js."""
    return re.sub(r"[^a-z0-9]", "", (title or "").lower())


def slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (title or "video").lower()).strip("-")
    return slug or "video"


def dedupe_slugs(items: list) -> None:
    seen: dict[str, int] = {}
    for item in items:
        base = item.get("slug") or slugify(item.get("title", "video"))
        count = seen.get(base, 0)
        item["slug"] = base if count == 0 else f"{base}-{count + 1}"
        seen[base] = count + 1


def merge_discovered(discovered: list, existing_items: list, overrides: dict) -> list:
    """
    discovered: list of dicts — {platform, url, title, thumbnail, videoId?,
                embedUrl?, date?} — one per video found by a channel scan.
    existing_items: current contents of videos.json's "items" array
                (mutated in place and returned).
    overrides: parsed video-sources.json — curator intent (tags/featured)
                keyed by URL, for videos the automation can't classify.

    Three cases per discovered video, checked in order:
      1. A source with this exact URL already exists somewhere -> skip.
      2. An existing item's normalized title matches, but has no source on
         THIS platform yet -> attach as an additional source on that item
         (cross-platform duplicate). No new card created.
      3. Genuinely new -> create a new item, tags/featured pulled from a
         video-sources.json override if one exists for this URL.
    """
    url_to_item = {}
    title_to_items: dict[str, list] = {}
    for item in existing_items:
        for src in item.get("sources", []):
            if src.get("url"):
                url_to_item[src["url"]] = item
        title_to_items.setdefault(norm_title(item.get("title", "")), []).append(item)

    override_by_url = {s["url"]: s for s in overrides.get("sources", []) if s.get("url")}

    for video in discovered:
        url = video["url"]
        if url in url_to_item:
            continue  # case 1

        key = norm_title(video["title"])
        match = next(
            (i for i in title_to_items.get(key, [])
             if not any(s.get("platform") == video["platform"] for s in i.get("sources", []))),
            None
        )

        source_entry = {"platform": video["platform"], "url": url, "thumbnail": video.get("thumbnail")}
        if video.get("videoId"):
            source_entry["videoId"] = video["videoId"]
        if video.get("embedUrl"):
            source_entry["embedUrl"] = video["embedUrl"]

        if match:
            match.setdefault("sources", []).append(source_entry)
            url_to_item[url] = match
            if not match.get("date") and video.get("date"):
                match["date"] = video["date"]
            print(f"  ↳ Merged as additional source: \"{video['title']}\" "
                  f"(now on {', '.join(s['platform'] for s in match['sources'])})")
            continue

        override = override_by_url.get(url, {})
        new_item = {
            "title": video["title"],
            "slug": slugify(video["title"]),
            "tags": override.get("tags", []),
            "sources": [source_entry],
        }
        if video.get("date") or override.get("date"):
            new_item["date"] = video.get("date") or override.get("date")
        if "featured" in override:
            new_item["featured"] = override["featured"]

        existing_items.append(new_item)
        url_to_item[url] = new_item
        title_to_items.setdefault(key, []).append(new_item)
        print(f"  + New video discovered ({video['platform']}): \"{video['title']}\"")

    return existing_items


def load_json(path: str, default: dict) -> dict:
    if not os.path.exists(path):
        return default
    try:
        with open(path) as f:
            return json.load(f)
    except json.JSONDecodeError:
        return default


def save_json(path: str, data: dict) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)