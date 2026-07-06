// ── Social page: Latest Activity feed + best-effort X/Twitter embed ─────────
// Both are lazily initialized (see initSocialPageOnce) the first time the
// Social page is actually visited, so pages that never open it pay zero
// network/JS cost for this file's contents.

const ACTIVITY_FEED_LIMIT = 8;           // configurable, not a magic number buried in the render loop
const TWITTER_WIDGET_TIMEOUT_MS = 5000;  // grace period before we give up and show the fallback link

let socialPageInitialized = false;

function initSocialPageOnce() {
    if (socialPageInitialized) return;
    socialPageInitialized = true;
    loadActivityFeed();
    loadTwitterEmbed();
}
window.initSocialPageOnce = initSocialPageOnce;

// ── Latest Activity feed (DeviantArt + ArtStation + YouTube, merged) ────────
function loadActivityFeed() {
    const container = document.querySelector(".activity-feed-grid");
    if (!container) return;
    container.innerHTML = `<div class="gallery-loading">Loading latest activity…</div>`;

    Promise.allSettled([
        window.getFeaturedMergedArtItems?.() ?? Promise.resolve([]),
        window.fetchVideoItems?.() ?? Promise.resolve([]),
    ]).then(([artResult, videoResult]) => {
        const artItems = (artResult.status === "fulfilled" ? artResult.value : [])
            .map(item => ({
                kind: "art",
                title: item.title,
                image: item.image,
                date: item.date,
                daLink: item.daLink,
                asLink: item.asLink,
            }));

        const videoItems = (videoResult.status === "fulfilled" ? videoResult.value : [])
            .map(video => {
                const source = window.pickPreferredSource?.(video);
                return {
                    kind: "video",
                    title: video.title,
                    image: window.resolveThumbnail?.(video, source),
                    date: video.date || null,
                    slug: video.slug,
                    platformLabels: (video.sources || [])
                        .map(s => window.getPlatformConfig?.(s)?.label)
                        .filter(Boolean),
                };
            });

        const combined = window.sortByDateDesc?.([...artItems, ...videoItems]).slice(0, ACTIVITY_FEED_LIMIT) ?? [];

        if (!combined.length) {
            container.innerHTML = `<p class="error-message">No recent activity to show yet.</p>`;
            return;
        }

        container.innerHTML = combined.map(renderActivityCard).join("");
        bindActivityCardInteractions(container);
    });
}

function renderActivityCard(item) {
    return item.kind === "video" ? renderVideoActivityCard(item) : renderArtActivityCard(item);
}

function renderArtActivityCard(item) {
    const badges = [
        item.daLink ? `<span class="gallery-badge badge-da">DA</span>` : "",
        item.asLink ? `<span class="gallery-badge badge-as">AS</span>` : "",
    ].join("");

    return `
        <div class="gallery-card activity-card activity-card-art"
             role="button"
             tabindex="0"
             aria-label="View artwork: ${escapeAttr(item.title)}"
             data-da-link="${escapeAttr(item.daLink || '')}"
             data-as-link="${escapeAttr(item.asLink || '')}"
             data-image="${escapeAttr(item.image)}"
             data-date="${escapeAttr(item.date || '')}">
            <img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title)}" loading="lazy"
                 onerror="this.closest('.activity-card').style.display='none'">
            <div class="gallery-card-footer">
                <h4 title="${escapeAttr(item.title)}">${escapeHtml(item.title)}</h4>
                <div class="gallery-badges">${badges}<span class="activity-type-badge">Art</span></div>
            </div>
        </div>`;
}

function renderVideoActivityCard(item) {
    const platformBadges = (item.platformLabels || [])
        .map(label => `<span class="video-badge video-badge-platform">${escapeVideoHtml(label)}</span>`)
        .join("");

    const thumbHtml = item.image
        ? `<img src="${escapeVideoAttr(item.image)}" alt="" loading="lazy" class="video-thumb-img" onerror="this.style.display='none'">`
        : `<div class="video-thumb-placeholder"></div>`;

    return `
        <a href="#videos:play:${escapeVideoAttr(item.slug)}"
           class="video-card activity-card activity-card-video"
           aria-label="Watch video: ${escapeVideoAttr(item.title)}">
            <div class="video-thumb-wrap" style="aspect-ratio:16/9;">
                ${thumbHtml}
                <span class="activity-play-icon" aria-hidden="true">${PLAY_ICON_SVG(48, 34)}</span>
            </div>
            <div class="video-card-footer">
                <h4 title="${escapeVideoAttr(item.title)}">${escapeVideoHtml(item.title)}</h4>
                <div class="video-badges">${platformBadges}<span class="activity-type-badge">Video</span></div>
            </div>
        </a>`;
}

function bindActivityCardInteractions(container) {
    // Reuses the shared gallery lightbox system (art cards only — video
    // cards are plain links and need no extra wiring).
    window.attachModalListenersToElement?.(container);

    // attachModalListenersToElement only binds click. A div with
    // role="button" gets no automatic Enter/Space activation from the
    // browser — that's on us to add per WCAG's authoring practices. (Your
    // existing .gallery-card divs elsewhere in the site have this same gap;
    // worth a follow-up pass there too, kept out of scope here.)
    container.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const card = e.target.closest(".activity-card-art");
        if (!card) return;
        e.preventDefault();
        card.click();
    });
}

// ── Best-effort X/Twitter timeline embed ─────────────────────────────────────
// X's embedded-timeline widget is documented as unreliable industry-wide as
// of 2026 (intermittent blank iframes, silent failures). Rather than risk a
// permanently empty box, this falls back to a plain "Follow on X" link if no
// iframe has appeared by the deadline below.
let twitterScriptPromise = null;

function loadTwitterEmbed() {
    const container = document.getElementById("twitter-timeline-embed");
    if (!container) return;

    injectTwitterWidgetScript()
        .then(() => window.twttr?.widgets?.load(container))
        .catch(() => { /* handled by the timeout fallback below regardless */ });

    setTimeout(() => {
        if (!container.querySelector("iframe")) {
            renderTwitterFallback(container);
        }
    }, TWITTER_WIDGET_TIMEOUT_MS);
}

function injectTwitterWidgetScript() {
    if (twitterScriptPromise) return twitterScriptPromise;
    twitterScriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
    return twitterScriptPromise;
}

function renderTwitterFallback(container) {
    const twitterInfo = (window.platforms || []).find(p => p.name === "Twitter");
    if (!twitterInfo) return;

    container.innerHTML = `
        <div class="twitter-fallback">
            <p class="twitter-fallback-text">Live embeds from X are unreliable right now — here's the direct link instead:</p>
            <a href="${twitterInfo.url}" target="_blank" rel="noopener noreferrer"
               class="button" style="background: linear-gradient(135deg, ${twitterInfo.color}, #0d5a8a);">
                Follow @RilyRobo on X
            </a>
        </div>`;
}

// ── Utilities (local copies to avoid a hard load-order dependency — mirrors
// the same defensive pattern scriptcommission.js already uses) ─────────────
function escapeAttr(str) {
    return String(str ?? "").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function escapeHtml(str) {
    return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeVideoHtml(str) {
    return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeVideoAttr(str) {
    return String(str ?? "").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}