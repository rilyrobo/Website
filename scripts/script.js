const username = "RilyRobo";
const discordID = "277498825403531264";

const platforms = [
    { name: "Twitter",      url: `https://twitter.com/${username}`,             icon: "images/icon/twitter.png",          color: "#1A91DA" },
    { name: "Instagram",    url: `https://instagram.com/${username}`,           icon: "images/icon/instagram.png",        color: "#C13584" },
    { name: "YouTube",      url: `https://www.youtube.com/@${username}`,        icon: "images/icon/youtube.png",          color: "#CC0000" },
    { name: "DeviantArt",   url: `https://www.deviantart.com/${username}`,      icon: "images/icon/deviantart.png",       color: "#04A045" },
    { name: "Artstation",   url: `https://www.artstation.com/${username}`,      icon: "images/icon/artstation.png",       color: "#42A5F5" },
    { name: "Newgrounds",   url: `https://${username}.newgrounds.com`,          icon: "images/icon/newgrounds.png",       color: "#E6B800" },
    { name: "Twitch",       url: `https://www.twitch.tv/${username}`,           icon: "images/icon/twitch.png",           color: "#772CE8" },
    { name: "Picarto",      url: `https://picarto.tv/${username}`,              icon: "images/icon/picarto.png",          color: "#00CC00" },
    { name: "Kick",         url: `https://kick.com/${username}`,                icon: "images/icon/kick.png",             color: "#00CC00" },
    { name: "Patreon",      url: `https://www.patreon.com/c/${username}`,       icon: "images/icon/patreon.png",          color: "#E36254" },
    { name: "Subscribestar",url: `https://www.subscribestar.com/${username}`,   icon: "images/icon/subscribestar.png",    color: "#E6B800" },
    { name: "Ko-fi",        url: `https://www.ko-fi.com/${username}`,           icon: "images/icon/ko-fi.png",            color: "#E6C200" },
];

const contacts = [
    { name: "Twitter", url: `https://twitter.com/${username}`,             icon: "images/icon/twitter.png",       color: "#1A91DA" },
    { name: "Ko-fi",   url: `https://www.ko-fi.com/${username}`,           icon: "images/icon/ko-fi.png",         color: "#E6C200" },
    { name: "Email",   url: `mailto:${username}@gmail.com`,                icon: "images/icon/email.png",         color: "#ffffff" },
    { name: "Discord", url: `https://discordapp.com/users/${discordID}`,   icon: "images/icon/discord.png",       color: "#7289da" },
];

// Exposed so other page-specific scripts (e.g. scriptsocial.js) can reuse
// this data instead of hardcoding a second copy of the same URLs/colors.
window.platforms = platforms;
window.contacts = contacts;

// ── Social icon helpers ──────────────────────────────────────────────────────

function buildIconLink(item) {
    const link = document.createElement("a");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.addEventListener("click", (e) => e.stopPropagation());

    const img = document.createElement("img");
    img.src   = item.icon;
    img.alt   = item.name;
    img.classList.add("social-icon");
    link.appendChild(img);
    return link;
}

function buildBadgeLink(item) {
    const link = document.createElement("a");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.addEventListener("click", (e) => e.stopPropagation());

    const imgStart = document.createElement("img");
    imgStart.src = item.icon;
    imgStart.alt = item.name;
    imgStart.classList.add("social-icon");

    const imgEnd = imgStart.cloneNode(true);

    link.innerHTML = `<strong>${item.name}</strong>`;
    Object.assign(link.style, {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "10px", textDecoration: "none", color: "#ffffff",
        fontSize: "16px", backgroundColor: item.color,
        padding: "5px 10px", borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
    });
    link.insertBefore(imgStart, link.firstChild);
    link.appendChild(imgEnd);
    return link;
}

document.addEventListener("DOMContentLoaded", () => {
    // Contacts (social-contact containers)
    document.querySelectorAll(".social-contact").forEach(container => {
        contacts.forEach(contact => {
            container.appendChild(
                container.classList.contains("social-contact-icon")
                    ? buildIconLink(contact)
                    : buildBadgeLink(contact)
            );
        });
    });

    // Platforms (social-media containers)
    document.querySelectorAll(".social-media").forEach(container => {
        platforms.forEach(platform => {
            container.appendChild(
                container.classList.contains("social-media-icon")
                    ? buildIconLink(platform)
                    : buildBadgeLink(platform)
            );
        });
    });
});

// ── Page routing ─────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
});

function handleHashChange() {
    const comicMatch = hash.match(/^(comic-[\w-]+?)(?:-page-(\d+))?$/);
    if (comicMatch) {
        const comicSlug  = comicMatch[1];
        const pageIndex  = comicMatch[2] ? parseInt(comicMatch[2], 10) - 1 : 0;
        const comicTitle = comicSlug.replace("comic-", "").replace(/-/g, " ");
        const comicIndex = (window.comicsList || []).findIndex(c => c.title === comicTitle);

        if (comicIndex !== -1) {
            loadCSV(window.comicsList[comicIndex].file, (images) => {
                displayComicImage(images, comicIndex, pageIndex);
                setupComicNavigation(window.comicsList[comicIndex], comicIndex);
                showPage(comicSlug);
            });
        }
        return;
    }

    // Video deep-link: #videos:play:some-video-slug — same hash-routing
    // approach as the comic deep-link above, applied to the video theater.
    const videoMatch = hash.match(/^videos:play:([\w-]+)$/);
    if (videoMatch) {
        showPage("videos");
        window.playVideoBySlugWhenReady?.(videoMatch[1]);
        return;
    }

    // Lazily boot the Social page's dynamic content (activity feed + X
    // embed) the first time it's actually visited — keeps that network/JS
    // cost off every other page instead of running it on initial load.
    if (location.hash === "#social") {
        window.initSocialPageOnce?.();
    }

    showPage(hash);
}

// Smooth page transition using visibility + opacity instead of display flicker
function showPage(pageId) {
    // Stop any live third-party video embed before we navigate away —
    // hiding its container does not stop it, only removing/replacing its
    // <iframe> does. Must run before the page-swap below, not after.
    window.stopVideoPlaybackIfLeavingVideosPage?.(pageId);

    const pages = document.querySelectorAll(".page");
    pages.forEach(page => {
        if (page.id === pageId) {
            page.style.display = "block";
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    page.classList.add("active");
                    // Explicit "instant" (not the default/unspecified
                    // behavior) so this scroll always supersedes any
                    // in-flight smooth-scroll animation — e.g. a video
                    // card's scrollIntoView — instead of the two
                    // potentially racing and leaving the viewport stuck
                    // somewhere in between.
                    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                });
            });
        } else {
            page.classList.remove("active");
            page.addEventListener("transitionend", function hide() {
                if (!page.classList.contains("active")) {
                    page.style.display = "none";
                }
                page.removeEventListener("transitionend", hide);
            }, { once: true });
        }
    });

    document.getElementById("nav-links")?.classList.remove("show");
    history.pushState(null, "", `#${pageId}`);
}

// ── External nav links ────────────────────────────────────────────────────────
// Only open a new tab for links pointing to a *different* domain.
// Hash links and same-origin links stay in the same tab.
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("nav a").forEach(link => {
        try {
            const url = new URL(link.href, window.location.href);
            if (url.hostname && url.hostname !== window.location.hostname) {
                link.setAttribute("target", "_blank");
                link.setAttribute("rel", "noopener noreferrer");
            }
        } catch (_) { /* malformed href — leave as-is */ }
    });
});

// ── Gallery modal ─────────────────────────────────────────────────────────────
// ── Gallery modal ─────────────────────────────────────────────────────────────
// attachModalListeners is defined in scriptgallery.js (self-contained there
// so it doesn't depend on this file's load order). Keeping only one copy
// avoids the two versions silently overwriting each other and reintroducing
// fixed bugs depending on which script tag loads last.

// ── Iframes ───────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const te = document.getElementById("teespring-iframe");
    const gu = document.getElementById("gumroad-iframe");
    const ji = document.getElementById("jinxxy-iframe");
    if (te) te.src = "https://my-store-c7ca26-2.creator-spring.com";
    if (gu) gu.src = "https://gumroad.com/rilyrobo";
    if (ji) ji.src = "https://jinxxy.com/rilyrobo";
});

// ── Mobile nav ────────────────────────────────────────────────────────────────
function toggleMobileNav() {
    document.getElementById("nav-links")?.classList.toggle("show");
}

// ── About page ────────────────────────────────────────────────────────────────
function loadAboutContent() {
    const el = document.getElementById("about-content");
    if (!el) return;
    fetch("aboutme.html")
        .then(r => { if (!r.ok) throw new Error(r.statusText); return r.text(); })
        .then(html => { el.innerHTML = html; })
        .catch(() => { el.innerHTML = "<p>Failed to load content. Please try again later.</p>"; });
}
document.addEventListener("DOMContentLoaded", loadAboutContent);