// ── Video Theater ─────────────────────────────────────────────────────────────
// Data-driven from data/videos.json. Each item has a "sources" array (one
// entry per platform it exists on) rather than a single flat platform —
// this supports cross-platform duplicate merging: the same video on both
// YouTube and Rumble becomes ONE card with two sources, mirroring how the
// art galleries already merge DeviantArt + ArtStation pieces of one piece.

const VIDEO_DATA_FILE = "data/videos.json";
const VIDEO_HOME_LIMIT = 3;

const VIDEO_TAG_LABELS = {
    "demo-reel": "Demo Reels",
    "animation": "Animation",
    "narration": "Narration / Readings",
};

// ── Platform registry (keyed by an individual SOURCE, not the video item) ────
const VIDEO_PLATFORMS = {
    youtube: {
        label: "YouTube",
        buildEmbedSrc: (src) => `https://www.youtube-nocookie.com/embed/${src.videoId}?autoplay=1&rel=0`,
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
    },
    rumble: {
        label: "Rumble",
        // IMPORTANT: only src.embedUrl is ever embeddable — Rumble's own
        // watch-page URL (src.url) sets X-Frame-Options/CSP that blocks
        // framing entirely, so it must NEVER be used as an iframe src.
        // Falling back to it here previously produced a silently blank
        // player instead of the "Watch on Rumble" fallback link below.
        // embedUrl is populated by fetch_video_metadata.py's oEmbed
        // resolution (manual video-sources.json entries) and, for
        // auto-discovered videos, scripts/backfill_rumble_embeds.py.
        // Until it's resolved, returning null here correctly routes to
        // the existing "Couldn't load this video's player" fallback in
        // renderPlayerEmbed() instead of trying (and failing) to embed
        // the raw page.
        buildEmbedSrc: (src) => src.embedUrl || null,
        allow: "autoplay; fullscreen",
    },
};

function getPlatformConfig(source) {
    return VIDEO_PLATFORMS[source?.platform] || null;
}

// YouTube preferred by default (more reliable embed + guaranteed thumbnail
// derivation); a per-item "preferredPlatform" override always wins.
function pickPreferredSource(video) {
    const sources = video.sources || [];
    if (!sources.length) return null;
    if (video.preferredPlatform) {
        const preferred = sources.find(s => s.platform === video.preferredPlatform);
        if (preferred) return preferred;
    }
    return sources.find(s => s.platform === "youtube") || sources[0];
}

function resolveThumbnail(video, source) {
    const s = source || pickPreferredSource(video);
    if (s?.thumbnail) return s.thumbnail;
    if (s?.platform === "youtube" && s.videoId) return `https://i.ytimg.com/vi/${s.videoId}/hqdefault.jpg`;
    return null;
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
let currentSourcePlatform = null;
let pendingVideoSlug = null;

document.addEventListener("DOMContentLoaded", () => {
    fetchVideoItems().then(items => {
        if (!items.length) return;
        ensureSlugs(items);

        const defaultVideo = items.find(v => v.featured) || items[0];
        currentVideoSlug = defaultVideo.slug;
        currentSourcePlatform = pickPreferredSource(defaultVideo)?.platform || null;
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

window.playVideoBySlugWhenReady = function (slug) {
    if (videoItemsCache) {
        const target = videoItemsCache.find(v => v.slug === slug);
        if (target) selectVideo(target, { autoplay: true, scrollTo: true });
    } else {
        pendingVideoSlug = slug;
    }
};

// ── Player ────────────────────────────────────────────────────────────────────
const PLAY_ICON_SVG = (w, h) => `
    <svg viewBox="0 0 68 48" width="${w}" height="${h}" aria-hidden="true">
        <path d="M66.5,7.7c-0.8-2.9-2.5-5.2-5.3-6C55.8,0,34,0,34,0S12.2,0,6.8,1.7C4,2.5,2.3,4.8,1.5,7.7C0,13.2,0,24,0,24s0,10.8,1.5,16.3c0.8,2.9,2.5,5.2,5.3,6C12.2,48,34,48,34,48s21.8,0,27.2-1.7c2.9-0.8,4.6-3.1,5.3-6C68,34.8,68,24,68,24S68,13.2,66.5,7.7z" fill="var(--accent-red)"/>
        <path d="M45,24L27,14v20L45,24z" fill="#fff"/>
    </svg>`;

// Small pill row for choosing which platform to watch on, shown only when
// a video has more than one source — mirrors the gallery modal's
// "View on DeviantArt / View on ArtStation" dual-button pattern.
function renderSourceSwitcher(video, activePlatform) {
    if (!video.sources || video.sources.length < 2) return "";
    const buttons = video.sources.map(s => {
        const cfg = getPlatformConfig(s);
        const isActive = s.platform === activePlatform;
        return `<button type="button"
                    class="video-source-btn${isActive ? " active" : ""}"
                    data-platform="${escapeVideoAttr(s.platform)}"
                    ${isActive ? 'aria-current="true"' : ""}>
                    ${escapeVideoHtml(cfg?.label || s.platform)}
                </button>`;
    }).join("");
    return `<div class="video-source-switcher" role="group" aria-label="Choose source platform">${buttons}</div>`;
}

function bindSourceSwitcher(mount, video) {
    mount.querySelectorAll(".video-source-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const source = video.sources.find(s => s.platform === btn.dataset.platform);
            if (source) renderPlayerEmbed(video, source);
        });
    });
}

function renderPlayerFacade(video) {
    const mount = document.getElementById("video-player-mount");
    if (!mount) return;

    const source = video.sources?.find(s => s.platform === currentSourcePlatform) || pickPreferredSource(video);
    const thumb = resolveThumbnail(video, source);

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
        <h3 class="video-hero-heading">${escapeVideoHtml(video.title)}</h3>
        ${renderSourceSwitcher(video, source?.platform)}`;

    mount.querySelector(".video-play-trigger")
        ?.addEventListener("click", () => selectVideo(video, { autoplay: true }));
    bindSourceSwitcher(mount, video);
}

function renderPlayerEmbed(video, sourceOverride) {
    const mount = document.getElementById("video-player-mount");
    if (!mount) return;

    const source = sourceOverride || video.sources?.find(s => s.platform === currentSourcePlatform) || pickPreferredSource(video);
    currentSourcePlatform = source?.platform || null;

    const cfg = getPlatformConfig(source);
    const src = cfg?.buildEmbedSrc?.(source);

    if (!src) {
        mount.innerHTML = `
            <div class="video-thumb-wrap video-hero-thumb" style="aspect-ratio:16/9;">
                <p class="error-message">Couldn't load this video's player.
                    ${source?.url ? `<a href="${escapeVideoAttr(source.url)}" target="_blank" rel="noopener noreferrer">Watch on ${escapeVideoHtml(cfg?.label || "the source site")} →</a>` : ""}
                </p>
            </div>
            <h3 class="video-hero-heading">${escapeVideoHtml(video.title)}</h3>
            ${renderSourceSwitcher(video, source?.platform)}`;
        bindSourceSwitcher(mount, video);
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
        <h3 class="video-hero-heading">${escapeVideoHtml(video.title)}</h3>
        ${renderSourceSwitcher(video, source?.platform)}`;
    mount.querySelector(".video-thumb-wrap").appendChild(iframe);
    bindSourceSwitcher(mount, video);

    requestAnimationFrame(() => iframe.focus());
}

function selectVideo(video, { autoplay = false, scrollTo = false } = {}) {
    const isNewSelection = currentVideoSlug !== video.slug;
    currentVideoSlug = video.slug;
    if (isNewSelection) currentSourcePlatform = pickPreferredSource(video)?.platform || null;

    autoplay ? renderPlayerEmbed(video) : renderPlayerFacade(video);
    highlightActiveCard(video.slug);
    if (isNewSelection) announceNowPlaying(video.title);

    history.replaceState(null, "", `#videos:play:${video.slug}`);

    if (scrollTo) {
        document.getElementById("video-player-mount")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function highlightActiveCard(slug) {
    // Scoped to .video-grid-full only — "active" means "currently loaded
    // in the theater," which only exists on the Videos page. Scoping this
    // is what makes it structurally impossible for a home-page card to
    // ever show this state.
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

// ── Render a comic image ── (n/a — kept name pattern consistent with rest of file)

// ── Grid cards ──────────────────────────────────────────────────────────────
function renderVideoCard(video, { linkOnly }) {
    const source = pickPreferredSource(video);
    const thumb = resolveThumbnail(video, source);

    const platformBadges = (video.sources || [])
        .map(s => getPlatformConfig(s)?.label)
        .filter(Boolean)
        .map(label => `<span class="video-badge video-badge-platform">${escapeVideoHtml(label)}</span>`)
        .join("");
    const tagBadges = (video.tags || [])
        .map(t => `<span class="video-badge">${escapeVideoHtml(VIDEO_TAG_LABELS[t] || t)}</span>`)
        .join("");

    const thumbHtml = thumb
        ? `<img src="${escapeVideoAttr(thumb)}" alt="" loading="lazy" decoding="async" class="video-thumb-img" onerror="this.style.display='none'">`
        : `<div class="video-thumb-placeholder"></div>`;

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
                <div class="video-badges">${platformBadges}${tagBadges}</div>
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

// THE FIX for Bug 1: intercept BOTH trigger types under one selector, and
// branch on tagName. <a> triggers (home page) are handled directly here —
// showPage() + selectVideo() called immediately — rather than depending on
// the native hashchange -> script.js router round-trip. This removes a
// cross-file dependency from the single most common click on the site.
// The real href stays on the element as a genuine no-JS fallback: if this
// listener somehow fails to attach, the link still degrades to native hash
// navigation, provided the router recognizes the hash shape.
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

// THE FIX for Bug 2: stops a live embed from continuing to play after
// leaving the Videos page. display:none on a hidden .page has no effect
// on a running <iframe>'s playback — the embedded document has no
// awareness that its host page was hidden. Removing/replacing the iframe
// is the only reliable way to stop it. Called by showPage() in script.js
// on every navigation.
function stopVideoPlaybackIfLeavingVideosPage(nextPageId) {
    if (nextPageId === "videos") return; // staying on/entering Videos — nothing to tear down

    const mount = document.getElementById("video-player-mount");
    const liveIframe = mount?.querySelector("iframe.video-embed-iframe");
    if (!liveIframe) return; // only a thumbnail facade is showing — nothing is actually playing

    const current = videoItemsCache?.find(v => v.slug === currentVideoSlug);
    if (current) renderPlayerFacade(current);
}
window.stopVideoPlaybackIfLeavingVideosPage = stopVideoPlaybackIfLeavingVideosPage;

// ── SEO: structured data ──────────────────────────────────────────────────────
function injectVideoStructuredData(items) {
    const dated = items.filter(v => v.date);
    if (!dated.length) return;

    document.getElementById("video-structured-data")?.remove();

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": dated.map(v => {
            const source = pickPreferredSource(v);
            return {
                "@type": "VideoObject",
                "name": v.title,
                "description": v.description || v.title,
                "thumbnailUrl": resolveThumbnail(v, source) || undefined,
                "uploadDate": v.date,
                "embedUrl": source?.platform === "youtube"
                    ? `https://www.youtube.com/embed/${source.videoId}`
                    : (source?.embedUrl || source?.url),
            };
        }),
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