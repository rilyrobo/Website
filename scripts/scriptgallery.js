// ── Modal listener (self-contained — no dependency on script.js load order) ───
function attachModalListeners(gridSelector) {
    const grid       = document.querySelector(gridSelector);
    const modal      = document.getElementById("gallery-modal");
    const modalImage = document.getElementById("modal-image");
    const modalLink  = document.getElementById("modal-link");
    if (!grid || !modal || !modalImage || !modalLink) return;

    // Clone to strip any previously-bound duplicate listeners
    const fresh = grid.cloneNode(true);
    grid.parentNode.replaceChild(fresh, grid);

    fresh.addEventListener("click", (e) => {
        const card = e.target.closest(".gallery-card");
        if (card) {
            modalImage.src = card.dataset.image;
            modalLink.href = card.dataset.link;
            modal.style.display = "flex";
        }
    });
    // Only bind the close handler once
    if (!modal.dataset.listenerBound) {
        modal.dataset.listenerBound = "1";
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.style.display = "none";
        });
    }
}

// ── Gallery data ──────────────────────────────────────────────────────────────
// DeviantArt RSS feed URLs
const galleryData = [
    { url: "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/31357645/featured",          title: "Featured",          icon: "images/icon/nav_icon_Work.gif",      description: "A collection of my latest work" },
    { url: "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/96210416/2d-art",            title: "2D Art",            icon: "images/icon/nav_icon_Gallery.gif",   description: "A collection of my 2D artwork" },
    { url: "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/96210354/3d-art",            title: "3D Art",            icon: "images/icon/nav_icon_3D.gif",        description: "A collection of my 3D artwork" },
    { url: "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/57218144/reference-images",  title: "Character Design",  icon: "images/icon/nav_icon_Gallery2.gif",  description: "A collection of my character designs" },
];

document.addEventListener("DOMContentLoaded", () => {
    fetchGalleryData(galleryData[0], ".gallery-grid-home", 5);
    fetchGalleryData(galleryData[0], ".gallery-grid-full");
    setupGalleries(galleryData);
});

// ── DeviantArt RSS parser ────────────────────────────────────────────────────
// DeviantArt uses the media:content element. parseFromString works fine for
// this XML but the namespace prefix handling varies across browsers.
// We try multiple selector strategies so it works everywhere.
function extractMediaUrl(item) {
    // Strategy 1: media:content with url attribute (Chrome/Firefox with full namespace)
    const mc = item.querySelector("media\\:content") || item.querySelector("content");
    if (mc && mc.getAttribute("url")) return mc.getAttribute("url");

    // Strategy 2: media:thumbnail
    const mt = item.querySelector("media\\:thumbnail") || item.querySelector("thumbnail");
    if (mt && mt.getAttribute("url")) return mt.getAttribute("url");

    // Strategy 3: enclosure (RSS fallback)
    const enc = item.querySelector("enclosure");
    if (enc && enc.getAttribute("url")) return enc.getAttribute("url");

    // Strategy 4: scan all elements for url attribute containing deviantart CDN
    for (const el of item.querySelectorAll("*")) {
        const u = el.getAttribute("url") || el.getAttribute("href");
        if (u && (u.includes("images-wixmp") || u.includes("deviantart.net") || u.includes("wixmp.com"))) {
            return u;
        }
    }

    // Strategy 5: look in raw XML text for the first img src in description CDATA
    const description = item.querySelector("description")?.textContent || "";
    const imgMatch = description.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) return imgMatch[1];

    return null;
}

function parseRSSItems(xmlDoc) {
    return Array.from(xmlDoc.querySelectorAll("item")).map(item => {
        const title = item.querySelector("title")?.textContent?.trim() || "Untitled";
        const link  = item.querySelector("link")?.textContent?.trim() || "#";
        const image = extractMediaUrl(item);
        return { title, link, image };
    }).filter(i => i.image); // skip items with no detectable image
}

// ── CORS proxy wrapper ────────────────────────────────────────────────────────
// DeviantArt's RSS endpoint blocks direct browser requests (no CORS header).
// We route through corsproxy.io which injects the required header.
// If that also fails (proxy down, rate-limited) we show a fallback link.
const CORS_PROXY = "https://corsproxy.io/?url=";

function proxiedFetch(url) {
    return fetch(CORS_PROXY + encodeURIComponent(url))
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.text();
        });
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────
function fetchGalleryData(endpoint, gridSelector, limit = null) {
    const container = document.querySelector(gridSelector);
    if (!container) return;

    container.innerHTML = `<div class="gallery-loading">Loading artwork…</div>`;

    proxiedFetch(endpoint.url)
        .then(str => {
            const xmlDoc = new DOMParser().parseFromString(str, "text/xml");
            if (xmlDoc.querySelector("parsererror")) throw new Error("XML parse error");

            const items   = parseRSSItems(xmlDoc);
            const display = limit ? items.slice(0, limit) : items;

            if (display.length === 0) {
                container.innerHTML = `<p class="error-message">No artwork found in this gallery.</p>`;
                return;
            }

            container.innerHTML = display.map(({ title, link, image }) => `
                <div class="gallery-card gallery-deviantart grid-item"
                     data-link="${escapeAttr(link)}"
                     data-image="${escapeAttr(image)}">
                    <img src="${escapeAttr(image)}"
                         alt="${escapeAttr(title)}"
                         loading="lazy"
                         onerror="this.closest('.gallery-card').style.display='none'">
                    <h4>${escapeHtml(title)}</h4>
                </div>`).join("");

            attachModalListeners(gridSelector);
        })
        .catch(err => {
            console.error(`Gallery load failed for ${gridSelector}:`, err);
            container.innerHTML = `
                <p class="error-message">
                    Could not load artwork automatically.
                    <a href="https://www.deviantart.com/RilyRobo" target="_blank" rel="noopener noreferrer">
                        View gallery on DeviantArt →
                    </a>
                </p>`;
        });
}

function fetchArtStationData(endpoint, gridSelector, limit = null) {
    const container = document.querySelector(gridSelector);
    if (!container) return;

    container.innerHTML = `<div class="gallery-loading">Loading artwork…</div>`;

    proxiedFetch(endpoint.url)
        .then(str => {
            const xmlDoc  = new DOMParser().parseFromString(str, "text/xml");
            const items   = Array.from(xmlDoc.querySelectorAll("item"));
            const display = limit ? items.slice(0, limit) : items;

            container.innerHTML = display.map(item => {
                const title = item.querySelector("title")?.textContent?.trim() || "Untitled";
                const link  = item.querySelector("link")?.textContent?.trim() || "#";
                const image = extractMediaUrl(item) || "";
                if (!image) return "";
                return `
                    <div class="gallery-card gallery-artstation grid-item"
                         data-link="${escapeAttr(link)}"
                         data-image="${escapeAttr(image)}">
                        <img src="${escapeAttr(image)}"
                             alt="${escapeAttr(title)}"
                             loading="lazy"
                             onerror="this.closest('.gallery-card').style.display='none'">
                        <h4>${escapeHtml(title)}</h4>
                    </div>`;
            }).join("");

            attachModalListeners(gridSelector);
        })
        .catch(err => {
            console.error(`ArtStation load failed for ${gridSelector}:`, err);
            container.innerHTML = `
                <p class="error-message">
                    Could not load artwork automatically.
                    <a href="https://www.artstation.com/RilyRobo" target="_blank" rel="noopener noreferrer">
                        View gallery on ArtStation →
                    </a>
                </p>`;
        });
}

// ── Gallery page setup ────────────────────────────────────────────────────────
function setupGalleries(galleryData) {
    const dropdownContent = document.querySelector(".dropdown-content-gallery");
    const mainContainer   = document.querySelector("page");
    if (!dropdownContent || !mainContainer) return;

    let dropdownHtml = "";

    galleryData.slice(1).forEach((gallery) => {
        const slug = gallery.title.replace(/\s+/g, "-");
        dropdownHtml += `
            <div class="dropdown-item">
                <a href="#gallery-${slug}" onclick="showPage('gallery-${slug}')">${gallery.title}</a>
                <div class="nav-hover-image-dropdown" style="background:url('${gallery.icon}') center/cover no-repeat;"></div>
            </div>`;

        const galleryPage = document.createElement("div");
        galleryPage.id        = `gallery-${slug}`;
        galleryPage.className = "page";

        const isArtStation = gallery.title === "ArtStation";
        galleryPage.innerHTML = `
            <h2 class="center-text">${gallery.title}</h2>
            <p class="center-text">${gallery.description}</p>
            <div class="gallery-grid gallery-grid-${slug}"></div>
            <div class="button-container">
                ${isArtStation ? "" : `<a href="https://www.deviantart.com/RilyRobo" target="_blank" rel="noopener noreferrer" class="button deviantart-button">More on DeviantArt</a>`}
                <a href="https://www.artstation.com/RilyRobo" target="_blank" rel="noopener noreferrer" class="button artstation-button">More on ArtStation</a>
            </div>`;
        mainContainer.appendChild(galleryPage);

        if (isArtStation) {
            fetchArtStationData(gallery, `.gallery-grid-${slug}`);
        } else {
            fetchGalleryData(gallery, `.gallery-grid-${slug}`);
        }
    });

    dropdownContent.innerHTML = dropdownHtml;

    document.querySelectorAll(".gallery-preview").forEach(preview => {
        preview.addEventListener("click", () => showPage(preview.getAttribute("data-target")));
    });
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function escapeAttr(str) {
    return String(str ?? "").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}