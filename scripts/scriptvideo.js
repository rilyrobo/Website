// ── Video Theater ─────────────────────────────────────────────────────────────
// Data-driven from data/videos.json. Architecture: ONE canonical player
// (#video-player-mount) plus many static thumbnail cards that select what
// plays in it. Cards themselves never become players — this is the fix for
// the previous version, where clicking a small card embedded a full YouTube
// player inside it, squeezing YouTube's own UI chrome into a space it wasn't
// designed for.
//
// Multi-platform support lives entirely in VIDEO_PLATFORMS below — adding a
// third host means adding one config entry, not branching logic elsewhere.

const VIDEO_DATA_FILE = "data/videos.json";
const VIDEO_HOME_LIMIT = 3;

const VIDEO_TAG_LABELS = {
    "demo-reel": "Demo Reels",
    "animation": "Animation",
    "narration": "Narration / Readings",
};

// ── Platform registry ─────────────────────────────────────────────────────────
const VIDEO_PLATFORMS = {
    youtube: {
        label: "YouTube",
        // youtube-nocookie.com defers setting YouTube's tracking cookies
        // until the visitor actually presses play, which they've already
        // done by this point — a small privacy/perf win with no UX cost.
        buildEmbedSrc: (v) => `https://www.youtube-nocookie.com/embed/${v.videoId}?autoplay=1&rel=0`,
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        thumbnailFallback: (v) => v.videoId ? `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg` : null,
    },
    rumble: {
        label: "Rumble",
        // Rumble's embed URL scheme is undocumented, so we rely entirely on
        // the exact src resolved by fetch_video_metadata.py's oEmbed call
        // rather than reconstructing it ourselves. No autoplay param is
        // assumed for the same reason — if Rumble supports one, it can be
        // appended manually to the stored embedUrl in videos.json.
        buildEmbedSrc: (v) => v.embedUrl || null,
        allow: "autoplay; fullscreen",
        thumbnailFallback: () => null,
    },
};

function getPlatformConfig(video) {
    return VIDEO_PLATFORMS[video.platform] || null;
}

function resolveThumbnail(video) {
    if (video.thumbnail) return video.thumbnail;
    return getPlatformConfig(video)?.thumbnailFallback?.(video) || null;
}

// ── Data loading (cached) ──────────────────────────────────────────────────────
let videoItemsCache = null;
let videoItemsPromise = null;

function fetchVideoItems() {
    if (videoItemsCache) return Promise.resolve(videoItemsCache);
    if (videoItemsPromise) return videoItemsPromise;
    videoItemsPromise = fetch(VIDEO_DATA_FILE + "?v=" + Date.now())
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then(d => { videoItemsCache = d.items || []; return videoItemsCache; })
        .catch(err => {
            console.error("Failed to load videos.json:", err);
            videoItemsCache = [];
            return [];
        });
    return videoItemsPromise;
}

// Ensures every video has a stable, unique, URL-safe slug — even if
// videos.json was hand-edited and is missing one (the fetch script always
// generates one, but this keeps the page from breaking if that step was
// skipped).
function ensureSlugs(items) {
    const seen = new Map();
    items.forEach(v => {
        if (!v.slug) v.slug = slugify(v.title);
        const count = seen.get(v.slug) || 0;
        if (count > 0) v.slug = `${v.slug}-${count + 1}`;
        seen.set(v.slug, count + 1);
    });
}

function slugify(str) {
    return String(str || "video").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "video";
}

function sortFeaturedFirst(items) {
    return [...items].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
}

// ── Boot ──────────────────────────────────────────────────────────────────────
let currentVideoSlug = null;
let pendingVideoSlug = null; // set if a deep-link arrives before data has loaded

document.addEventListener("DOMContentLoaded", () => {
    fetchVideoItems().then(items => {
        if (!items.length) return;
        ensureSlugs(items);

        const defaultVideo = items.find(v => v.featured) || items[0];
        currentVideoSlug = defaultVideo.slug;
        renderPlayerFacade(defaultVideo);

        renderVideoGrid(".video-grid-home", sortFeaturedFirst(items).slice(0, VIDEO_HOME_LIMIT), { filterable: false, linkOnly: true });
        renderVideoGrid(".video-grid-full", items, { filterable: true, linkOnly: false });

        highlightActiveCard(currentVideoSlug);
        injectVideoStructuredData(items);

        if (pendingVideoSlug) {
            const target = items.find(v => v.slug === pendingVideoSlug);
            if (target) selectVideo(target, { autoplay: true, scrollTo: true });
            pendingVideoSlug = null;
        }
    });
});

// Called by script.js's hash router for #videos:play:{slug} deep-links.
window.playVideoBySlugWhenReady = function (slug) {
    if (videoItemsCache) {
        const target = videoItemsCache.find(v => v.slug === slug);
        if (target) selectVideo(target, { autoplay: true, scrollTo: true });
    } else {
        pendingVideoSlug = slug;
    }
};

// ── Player (the single "now playing" area) ────────────────────────────────────
const PLAY_ICON_SVG = (w, h) => `
    <svg viewBox="0 0 68 48" width="${w}" height="${h}" aria-hidden="true">
        <path d="M66.5,7.7c-0.8-2.9-2.5-5.2-5.3-6C55.8,0,34,0,34,0S12.2,0,6.8,1.7C4,2.5,2.3,4.8,1.5,7.7C0,13.2,0,24,0,24s0,10.8,1.5,16.3c0.8,2.9,2.5,5.2,5.3,6C12.2,48,34,48,34,48s21.8,0,27.2-1.7c2.9-0.8,4.6-3.1,5.3-6C68,34.8,68,24,68,24S68,13.2,66.5,7.7z" fill="var(--accent-red)"/>
        <path d="M45,24L27,14v20L45,24z" fill="#fff"/>
    </svg>`;

function renderPlayerFacade(video) {
    const mount = document.getElementById("video-player-mount");
    if (!mount) return;

    const thumb = resolveThumbnail(video);
    mount.innerHTML = `
        <div class="video-thumb-wrap video-hero-thumb" style="aspect-ratio:16/9;">
            ${thumb
                ? `<img src="${escapeVideoAttr(thumb)}" alt="" loading="eager" decoding="async" class="video-thumb-img" onerror="this.style.display='none'">`
                : `<div class="video-thumb-placeholder"></div>`}
            <button type="button" class="video-play-trigger"
                    aria-label="Play video: ${escapeVideoAttr(video.title)}">
                <span class="video-play-icon">${PLAY_ICON_SVG(88, 62)}</span>
            </button>
        </div>
        <h3 class="video-hero-heading">${escapeVideoHtml(video.title)}</h3>`;

    mount.querySelector(".video-play-trigger")
        ?.addEventListener("click", () => selectVideo(video, { autoplay: true }));
}

function renderPlayerEmbed(video) {
    const mount = document.getElementById("video-player-mount");
    if (!mount) return;

    const cfg = getPlatformConfig(video);
    const src = cfg?.buildEmbedSrc?.(video);

    if (!src) {
        mount.innerHTML = `
            <div class="video-thumb-wrap video-hero-thumb" style="aspect-ratio:16/9;">
                <p class="error-message">Couldn't load this video's player.
                    ${video.url ? `<a href="${escapeVideoAttr(video.url)}" target="_blank" rel="noopener noreferrer">Watch on ${escapeVideoHtml(cfg?.label || "the source site")} →</a>` : ""}
                </p>
            </div>
            <h3 class="video-hero-heading">${escapeVideoHtml(video.title)}</h3>`;
        return;
    }

    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = video.title || "Video player";
    iframe.setAttribute("frameborder", "0");
    if (cfg.allow) iframe.setAttribute("allow", cfg.allow);
    iframe.setAttribute("allowfullscreen", "");
    iframe.className = "video-embed-iframe";

    mount.innerHTML = `<div class="video-thumb-wrap video-hero-thumb" style="aspect-ratio:16/9;"></div>
        <h3 class="video-hero-heading">${escapeVideoHtml(video.title)}</h3>`;
    mount.querySelector(".video-thumb-wrap").appendChild(iframe);

    // The button that had focus is gone from the DOM now — move focus into
    // the iframe so keyboard/screen-reader users aren't stranded.
    requestAnimationFrame(() => iframe.focus());
}

// Central selection function — called by the hero facade, any grid card, or
// a deep-link. Handles rendering, active-state highlighting, an aria-live
// announcement for screen readers, and URL bookkeeping.
function selectVideo(video, { autoplay = false, scrollTo = false } = {}) {
    const isNewSelection = currentVideoSlug !== video.slug;
    currentVideoSlug = video.slug;

    autoplay ? renderPlayerEmbed(video) : renderPlayerFacade(video);
    highlightActiveCard(video.slug);
    if (isNewSelection) announceNowPlaying(video.title);

    // Reflect the current video in the URL (shareable, bookmarkable) without
    // adding a new back-button history entry for every single click — only
    // an explicit navigation (e.g. from a home-page link) should do that.
    history.replaceState(null, "", `#videos:play:${video.slug}`);

    if (scrollTo) {
        document.getElementById("video-player-mount")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

// Called by showPage() in script.js on every page navigation. Removing
// (not just hiding) the live <iframe> is the only reliable way to stop a
// YouTube/Rumble embed — display:none has no effect on a running embed's
// playback or audio, since the embedded document has no visibility
// awareness of its host page.
function stopVideoPlaybackIfLeavingVideosPage(nextPageId) {
    if (nextPageId === "videos") return; // staying on/entering Videos — nothing to tear down

    const mount = document.getElementById("video-player-mount");
    const liveIframe = mount?.querySelector("iframe.video-embed-iframe");
    if (!liveIframe) return; // only a thumbnail facade is showing — nothing is actually playing

    const current = videoItemsCache?.find(v => v.slug === currentVideoSlug);
    if (current) renderPlayerFacade(current); // swaps the live iframe back to a static thumbnail
}
window.stopVideoPlaybackIfLeavingVideosPage = stopVideoPlaybackIfLeavingVideosPage;

function highlightActiveCard(slug) {
    // "Active" means "currently loaded in the theater player," which only
    // exists on the Videos page. Scoping to .video-grid-full is what makes
    // it structurally impossible for a home-page preview card — which has
    // no player next to it at all — to ever show this state.
    const fullGrid = document.querySelector(".video-grid-full");
    fullGrid?.querySelectorAll(".video-card").forEach(card => {
        card.classList.toggle("active", card.dataset.slug === slug);
    });
}

let announceTimer = null;
function announceNowPlaying(title) {
    const el = document.getElementById("video-now-playing-announce");
    if (!el) return;
    el.textContent = "";
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => { el.textContent = `Now playing: ${title}`; }, 50);
}

// ── Grid cards (selectors only — never players) ───────────────────────────────
function renderVideoCard(video, { linkOnly }) {
    const platformCfg = getPlatformConfig(video);
    const thumb = resolveThumbnail(video);

    const badges = [
        platformCfg ? `<span class="video-badge video-badge-platform">${escapeVideoHtml(platformCfg.label)}</span>` : "",
        ...(video.tags || []).map(t => `<span class="video-badge">${escapeVideoHtml(VIDEO_TAG_LABELS[t] || t)}</span>`),
    ].join("");

    const thumbHtml = thumb
        ? `<img src="${escapeVideoAttr(thumb)}" alt="" loading="lazy" decoding="async" class="video-thumb-img" onerror="this.style.display='none'">`
        : `<div class="video-thumb-placeholder"></div>`;

    // linkOnly = home page: a real <a> that navigates to the Videos page
    // and deep-links into the theater there. NOT linkOnly = the Videos
    // page's own grid: a <button> that swaps the theater player in place.
    // This distinction is load-bearing — collapsing it back to one shared
    // element type is exactly how this class of bug re-appears.
    const tag = linkOnly ? "a" : "button";
    const openAttr = linkOnly
        ? `href="#videos:play:${escapeVideoAttr(video.slug)}"`
        : `type="button"`;

    return `
        <div class="video-card" data-slug="${escapeVideoAttr(video.slug)}" data-tags="${escapeVideoAttr((video.tags || []).join(" "))}">
            <div class="video-thumb-wrap" style="aspect-ratio:16/9;">
                <${tag} class="video-play-trigger video-select-trigger" ${openAttr}
                        data-slug="${escapeVideoAttr(video.slug)}"
                        aria-label="${linkOnly ? "Watch" : "Play"} video: ${escapeVideoAttr(video.title)}">
                    ${thumbHtml}
                </${tag}>
            </div>
            <div class="video-card-footer">
                <h4 title="${escapeVideoAttr(video.title)}">${escapeVideoHtml(video.title)}</h4>
                <div class="video-badges">${badges}</div>
            </div>
        </div>`;
}

function renderVideoGrid(gridSelector, items, { filterable, linkOnly }) {
    const container = document.querySelector(gridSelector);
    if (!container) return;

    if (!items.length) {
        container.innerHTML = `<p class="error-message">No videos to show yet.</p>`;
        return;
    }

    const tagsPresent = [...new Set(items.flatMap(v => v.tags || []))];
    const filterBar = (filterable && tagsPresent.length > 1) ? `
        <div class="gallery-filter-bar" role="group" aria-label="Filter videos by category">
            <button class="gallery-filter-btn active" onclick="videoFilter(this,'all')">All</button>
            ${tagsPresent.map(t =>
                `<button class="gallery-filter-btn" onclick="videoFilter(this,'${t}')">${escapeVideoHtml(VIDEO_TAG_LABELS[t] || t)}</button>`
            ).join("")}
        </div>` : "";

    container.innerHTML = filterBar + `<div class="video-inner-grid">${items.map(v => renderVideoCard(v, { linkOnly })).join("")}</div>`;
    bindVideoGridInteractions(container, items);
}

// Single delegated listener handling BOTH interaction types:
//   - <a> triggers (home page): intercepted and handled via direct function
//     calls rather than relying on a native hashchange round-trip through
//     script.js's router. This removes that cross-file dependency from the
//     most common click path. The real href stays on the element as a
//     genuine no-JS fallback — if this handler somehow never attaches, the
//     link still degrades to native hash navigation as long as the router
//     recognizes the hash shape (see the script.js fix below for that path).
//   - <button> triggers (Videos page itself): swap the theater in place,
//     no navigation involved.
function bindVideoGridInteractions(container, items) {
    container.addEventListener("click", (e) => {
        const trigger = e.target.closest(".video-select-trigger");
        if (!trigger) return;

        const video = items.find(v => v.slug === trigger.dataset.slug);
        if (!video) return;

        if (trigger.tagName === "A") {
            e.preventDefault();
            showPage("videos");
            selectVideo(video, { autoplay: true, scrollTo: true });
            return;
        }

        const mount = document.getElementById("video-player-mount");
        selectVideo(video, { autoplay: true, scrollTo: !isInUpperViewport(mount) });
    });
}

function isInUpperViewport(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.top < window.innerHeight * 0.5;
}

function videoFilter(btn, tag) {
    btn.closest(".gallery-filter-bar")
       ?.querySelectorAll(".gallery-filter-btn")
       .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    btn.closest(".video-grid-home, .video-grid-full")
       ?.querySelectorAll(".video-card")
       .forEach(card => {
           const tags = (card.dataset.tags || "").split(" ");
           card.style.display = (tag === "all" || tags.includes(tag)) ? "" : "none";
       });
}

// ── SEO: structured data ──────────────────────────────────────────────────────
// Google's VideoObject guidelines require an uploadDate, so only videos with
// a real "date" (hand-entered in video-sources.json — oEmbed doesn't provide
// one) get structured data. No fabricated dates.
function injectVideoStructuredData(items) {
    const dated = items.filter(v => v.date);
    if (!dated.length) return;

    document.getElementById("video-structured-data")?.remove();

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": dated.map(v => ({
            "@type": "VideoObject",
            "name": v.title,
            "description": v.description || v.title,
            "thumbnailUrl": resolveThumbnail(v) || undefined,
            "uploadDate": v.date,
            "embedUrl": v.platform === "youtube"
                ? `https://www.youtube.com/embed/${v.videoId}`
                : (v.embedUrl || v.url),
        })),
    };

    const script = document.createElement("script");
    script.id = "video-structured-data";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function escapeVideoHtml(str) {
    return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeVideoAttr(str) {
    return String(str ?? "").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}