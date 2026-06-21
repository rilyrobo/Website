const username = "RilyRobo";
const discordID = "277498825403531264";

const platforms = [
    { name: "Twitter",      url: `https://twitter.com/${username}`,             icon: "https://img.icons8.com/?size=100&id=phOKFKYpe00C&format=png&color=ffffff", color: "#1A91DA" },
    { name: "Instagram",    url: `https://instagram.com/${username}`,           icon: "https://img.icons8.com/?size=100&id=32309&format=png&color=ffffff",        color: "#C13584" },
    { name: "YouTube",      url: `https://www.youtube.com/@${username}`,        icon: "https://img.icons8.com/?size=100&id=37326&format=png&color=ffffff",        color: "#CC0000" },
    { name: "DeviantArt",   url: `https://www.deviantart.com/${username}`,      icon: "https://img.icons8.com/?size=100&id=38504&format=png&color=ffffff",        color: "#04A045" },
    { name: "Artstation",   url: `https://www.artstation.com/${username}`,      icon: "https://img.icons8.com/?size=100&id=pB77uEobJRjy&format=png&color=ffffff", color: "#42A5F5" },
    { name: "Newgrounds",   url: `https://${username}.newgrounds.com`,          icon: "https://img.icons8.com/?size=100&id=15771&format=png&color=ffffff",        color: "#E6B800" },
    { name: "Twitch",       url: `https://www.twitch.tv/${username}`,           icon: "https://img.icons8.com/?size=100&id=18104&format=png&color=ffffff",        color: "#772CE8" },
    { name: "Picarto",      url: `https://picarto.tv/${username}`,              icon: "https://img.icons8.com/?size=100&id=6byL4WgkpyPg&format=png&color=ffffff", color: "#00CC00" },
    { name: "Patreon",      url: `https://www.patreon.com/c/${username}`,       icon: "https://img.icons8.com/?size=100&id=tIshI0hyXw3f&format=png&color=ffffff", color: "#E36254" },
    { name: "Subscribestar",url: `https://www.subscribestar.com/${username}`,   icon: "https://img.icons8.com/?size=100&id=7856&format=png&color=ffffff",         color: "#E6B800" },
    { name: "Ko-fi",        url: `https://www.ko-fi.com/${username}`,           icon: "https://img.icons8.com/?size=100&id=8342&format=png&color=ffffff",         color: "#E6C200" },
];

const contacts = [
    { name: "Twitter", url: `https://twitter.com/${username}`,             icon: "https://img.icons8.com/?size=100&id=phOKFKYpe00C&format=png&color=ffffff", color: "#1A91DA" },
    { name: "Ko-fi",   url: `https://www.ko-fi.com/${username}`,           icon: "https://img.icons8.com/?size=100&id=8342&format=png&color=ffffff",         color: "#E6C200" },
    { name: "Email",   url: `mailto:${username}@gmail.com`,                icon: "https://img.icons8.com/?size=100&id=60688&format=png&color=ffffff",        color: "#ffffff" },
    { name: "Discord", url: `https://discordapp.com/users/${discordID}`,   icon: "https://img.icons8.com/?size=100&id=30888&format=png&color=ffffff",        color: "#7289da" },
];

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
    const hash = window.location.hash.substring(1);

    if (!hash) {
        showPage("home");
        history.replaceState(null, "", "#home");
        return;
    }

    // Comic deep-link: #comic-Title-page-3
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

    showPage(hash);
}

// Smooth page transition using visibility + opacity instead of display flicker
function showPage(pageId) {
    const pages = document.querySelectorAll(".page");
    pages.forEach(page => {
        if (page.id === pageId) {
            page.style.display = "block";
            // Defer so the display change is painted before the transition fires
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    page.classList.add("active");
                    // Scroll only after the new page has display:block and is
                    // laid out — scrolling before this point can land at a
                    // stale position because the target page's height isn't
                    // final yet (it's still display:none or mid-transition).
                    window.scrollTo(0, 0);
                });
            });
        } else {
            page.classList.remove("active");
            // Wait for transition before hiding
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
function attachModalListeners(gridSelector) {
    const galleryGrid = document.querySelector(gridSelector);
    if (!galleryGrid) return;
    const modal      = document.getElementById("gallery-modal");
    const modalImage = document.getElementById("modal-image");
    const modalLink  = document.getElementById("modal-link");

    galleryGrid.addEventListener("click", (e) => {
        const card = e.target.closest(".gallery-card");
        if (card) {
            modalImage.src  = card.dataset.image;
            modalLink.href  = card.dataset.link;
            modal.style.display = "flex";
        }
    });
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
    });
}

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