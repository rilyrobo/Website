// ── Live Stream Section (home page) ──────────────────────────────────────────
// Shows a "Watch Me Live" section ONLY when at least one platform is
// confirmed live, per data/live-status.json — kept fresh by a scheduled
// GitHub Actions job (.github/workflows/check-live-status.yml) that checks
// Twitch, YouTube, Picarto, and Kick server-side (their live-status APIs
// require credentials that can never be safely exposed in browser JS).
//
// Rumble is intentionally excluded — it has no public live-status API.
//
// Because this depends on a scheduled job (not truly real-time), status can
// lag the actual stream start by several minutes — GitHub's own docs note
// scheduled workflow runs are best-effort and can be delayed under load.
// The "status checked N minutes ago" line makes that lag visible rather
// than implying real-time accuracy.

const LIVE_STATUS_FILE = "data/live-status.json";
const DEFAULT_LIVE_PLATFORM = "twitch";

// ── Config — the only place usernames/IDs should ever be edited ─────────────
const LIVE_CONFIG = {
    twitch:  { username: "RilyRobo" },
    youtube: { channelId: "UCNlAFfQIh6Eycmd2yntbK7Q" },
    picarto: { username: "RilyRobo" },
    // ⚠ UNVERIFIED — could not be confirmed via web search (Kick channel
    // pages aren't reliably indexed) or a direct fetch (blocked by
    // Cloudflare bot detection, same category of block as ArtStation/
    // Rumble elsewhere in this repo).
    //
    // This is the CLIENT-SIDE half of this value — it builds the embed
    // iframe src if Kick is live. The SERVER-SIDE half (which actually
    // checks whether Kick is live) is KICK_USERNAME in
    // scripts/fetch_live_status.py, configured there via the
    // KICK_USERNAME repo variable so it can be corrected without a code
    // change. This file has no build step and can't read that variable,
    // so the two values must be kept in sync BY HAND — if you correct one,
    // correct the other in the same edit.
    kick:    { username: "RilyRobo" },
};

const LIVE_PLATFORMS = {
    twitch: {
        label: "Twitch",
        buildSrc: () => {
            // Twitch requires `parent` to match the serving hostname —
            // computed live so a future custom domain keeps working
            // without a code change.
            const parent = window.location.hostname || "rilyrobo.github.io";
            const u = LIVE_CONFIG.twitch.username;
            return `https://player.twitch.tv/?channel=${encodeURIComponent(u)}&parent=${encodeURIComponent(parent)}&muted=true`;
        },
        allow: "autoplay; fullscreen",
    },
    youtube: {
        label: "YouTube",
        buildSrc: () => `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(LIVE_CONFIG.youtube.channelId)}`,
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
    },
    picarto: {
        label: "Picarto",
        buildSrc: () => `https://player.picarto.tv/${encodeURIComponent(LIVE_CONFIG.picarto.username)}?muted=true`,
        allow: "autoplay; fullscreen",
    },
    kick: {
        label: "Kick",
        buildSrc: () => `https://player.kick.com/${encodeURIComponent(LIVE_CONFIG.kick.username)}?muted=true`,
        allow: "autoplay; fullscreen",
    },
};

let currentLivePlatform = null;
let liveStatusCache = null;

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const section = document.querySelector(".live-stream-section");
    if (!section) return;

    fetch(LIVE_STATUS_FILE + "?v=" + Date.now())
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then(status => {
            liveStatusCache = status;
            const livePlatforms = Object.keys(LIVE_PLATFORMS).filter(key => status[key]?.live);

            if (!livePlatforms.length) {
                section.style.display = "none";
                return;
            }

            section.style.display = "";
            const startPlatform = livePlatforms.includes(DEFAULT_LIVE_PLATFORM)
                ? DEFAULT_LIVE_PLATFORM
                : livePlatforms[0];

            buildLiveSwitcher(section, livePlatforms);
            loadLivePlatform(startPlatform);
            renderLastChecked(section, status, startPlatform);
        })
        .catch(err => {
            // Fail closed: if live status can't be confirmed, don't show
            // the section rather than risk showing it wrong.
            console.warn("Live status unavailable:", err);
            section.style.display = "none";
        });
});

function buildLiveSwitcher(section, livePlatformKeys) {
    const switcher = section.querySelector(".live-source-switcher");
    if (!switcher) return;

    if (livePlatformKeys.length < 2) {
        switcher.innerHTML = "";
        return;
    }

    switcher.innerHTML = livePlatformKeys.map(key => `
        <button type="button" class="video-source-btn live-source-btn" data-platform="${key}">
            ${escapeLiveHtml(LIVE_PLATFORMS[key].label)}
        </button>`).join("");

    switcher.addEventListener("click", (e) => {
        const btn = e.target.closest(".live-source-btn");
        if (btn) {
            loadLivePlatform(btn.dataset.platform);
            renderLastChecked(section, liveStatusCache, btn.dataset.platform);
        }
    });
}

function loadLivePlatform(platformKey) {
    const cfg = LIVE_PLATFORMS[platformKey];
    const mount = document.getElementById("live-player-mount");
    if (!cfg || !mount) return;

    currentLivePlatform = platformKey;
    highlightActiveLiveButton(platformKey);
    mount.innerHTML = "";

    const iframe = document.createElement("iframe");
    iframe.src = cfg.buildSrc();
    iframe.title = `${cfg.label} live stream`;
    iframe.setAttribute("frameborder", "0");
    if (cfg.allow) iframe.setAttribute("allow", cfg.allow);
    iframe.setAttribute("allowfullscreen", "");
    iframe.className = "video-embed-iframe";
    mount.appendChild(iframe);
}

function highlightActiveLiveButton(platformKey) {
    document.querySelectorAll(".live-source-btn").forEach(btn => {
        const active = btn.dataset.platform === platformKey;
        btn.classList.toggle("active", active);
        active ? btn.setAttribute("aria-current", "true") : btn.removeAttribute("aria-current");
    });
}

function renderLastChecked(section, status, platformKey) {
    const el = section.querySelector(".live-last-checked");
    if (!el) return;
    const checkedAt = status?.[platformKey]?.checkedAt;
    if (!checkedAt) { el.textContent = ""; return; }

    const minutesAgo = Math.max(0, Math.round((Date.now() - new Date(checkedAt).getTime()) / 60000));
    el.textContent = minutesAgo <= 1
        ? "Status checked less than a minute ago"
        : `Status checked ${minutesAgo} minutes ago`;
}

// Called from script.js's showPage() — tears the embed down when navigating
// away from Home, restores it when returning (same pattern as the video
// theater's stopVideoPlaybackIfLeavingVideosPage).
window.syncLivePlaybackForPage = function (nextPageId) {
    const mount = document.getElementById("live-player-mount");
    if (!mount) return;
    if (nextPageId === "home") {
        if (!mount.hasChildNodes() && currentLivePlatform) loadLivePlatform(currentLivePlatform);
    } else {
        mount.innerHTML = "";
    }
};

// ── Utilities ─────────────────────────────────────────────────────────────────
function escapeLiveHtml(str) {
    return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}