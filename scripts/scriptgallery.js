// ── Modal listener (self-contained — no dependency on script.js load order) ───
function attachModalListeners(gridSelector) {
    const grid       = document.querySelector(gridSelector);
    const modal      = document.getElementById("gallery-modal");
    const modalImage = document.getElementById("modal-image");
    const modalLink  = document.getElementById("modal-link");
    if (!grid || !modal || !modalImage || !modalLink) return;

    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const fresh = grid.cloneNode(true);
    grid.parentNode.replaceChild(fresh, grid);

    fresh.addEventListener("click", (e) => {
        const card = e.target.closest(".gallery-card");
        if (card) {
            modalImage.src = card.dataset.image;
            modalLink.href = card.dataset.link;
            modal.style.display = "flex";
            window.acquireModalLock?.();
        }
    });

    if (!modal.dataset.listenerBound) {
        modal.dataset.listenerBound = "1";
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
                window.releaseModalLock?.();
            }
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && modal.style.display === "flex") {
                modal.style.display = "none";
                window.releaseModalLock?.();
            }
        });
    }
}

// ── Gallery configuration ─────────────────────────────────────────────────────
// Each gallery specifies its DeviantArt RSS feed. The single ArtStation feed
// covers all work — it's merged into every gallery tab by title matching.
const ARTSTATION_FEED = "https://www.artstation.com/rss/user/rilyrobo";

const galleryData = [
    { url: "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/31357645/featured",         title: "Featured",         icon: "images/icon/nav_icon_Work.gif",     description: "A collection of my latest work"       },
    { url: "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/96210416/2d-art",           title: "2D Art",           icon: "images/icon/nav_icon_Gallery.gif",  description: "A collection of my 2D artwork"         },
    { url: "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/96210354/3d-art",           title: "3D Art",           icon: "images/icon/nav_icon_3D.gif",       description: "A collection of my 3D artwork"         },
    { url: "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/57218144/reference-images", title: "Character Design", icon: "images/icon/nav_icon_Gallery2.gif", description: "A collection of my character designs"  },
];

// Cached ArtStation items — fetched once, shared across all gallery merges
let asItemsCache = null;
let asItemsPromise = null;

function getArtStationItems() {
    if (asItemsCache) return Promise.resolve(asItemsCache);
    if (asItemsPromise) return asItemsPromise;
    asItemsPromise = proxiedFetch(ARTSTATION_FEED)
        .then(str => {
            const xml = new DOMParser().parseFromString(str, "text/xml");
            if (xml.querySelector("parsererror")) throw new Error("AS XML parse error");
            asItemsCache = parseRSSItems(xml);
            return asItemsCache;
        })
        .catch(() => {
            asItemsCache = []; // treat as empty on failure
            return [];
        });
    return asItemsPromise;
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    // Home preview: DA featured only (5 items, no merge needed on the tiny grid)
    fetchGalleryData(galleryData[0], ".gallery-grid-home", 5);
    // Full featured on the gallery page: merged
    fetchMergedGallery(galleryData[0], ".gallery-grid-full");
    setupGalleries(galleryData);
});

// ── CORS proxy chain ──────────────────────────────────────────────────────────
// DeviantArt and ArtStation block direct browser requests. We route through
// public CORS proxies. Each is tried in order until one succeeds — if
// corsproxy.io is blocked or rate-limited, the next proxy takes over.
const CORS_PROXIES = [
    (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

function proxiedFetch(url) {
    // Try each proxy in sequence, stopping on the first that returns a
    // non-error response (even a 404 is a real response — we only retry
    // on network failures and explicit 4xx/5xx from the proxy itself).
    function tryProxy(index) {
        if (index >= CORS_PROXIES.length) {
            return Promise.reject(new Error("All proxies failed for: " + url));
        }
        const proxyUrl = CORS_PROXIES[index](url);
        return fetch(proxyUrl)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status} from proxy ${index}`);
                return r.text();
            })
            .catch(err => {
                console.warn(`Proxy ${index} failed (${err.message}), trying next…`);
                return tryProxy(index + 1);
            });
    }
    return tryProxy(0);
}

// ── RSS parsing ───────────────────────────────────────────────────────────────
function extractMediaUrl(item) {
    const mc = item.querySelector("media\\:content") || item.querySelector("content");
    if (mc && mc.getAttribute("url")) return mc.getAttribute("url");

    const mt = item.querySelector("media\\:thumbnail") || item.querySelector("thumbnail");
    if (mt && mt.getAttribute("url")) return mt.getAttribute("url");

    const enc = item.querySelector("enclosure");
    if (enc && enc.getAttribute("url")) return enc.getAttribute("url");

    for (const el of item.querySelectorAll("*")) {
        const u = el.getAttribute("url") || el.getAttribute("href");
        if (u && (u.includes("images-wixmp") || u.includes("deviantart.net") || u.includes("wixmp.com") || u.includes("cdnb.artstation"))) {
            return u;
        }
    }

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
    }).filter(i => i.image);
}

// Normalise title for fuzzy matching: lowercase, strip all non-alphanumeric
function normTitle(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ── Merge engine ──────────────────────────────────────────────────────────────
// Fetches a DeviantArt gallery feed and the shared ArtStation cache in
// parallel, then deduplicates by normalised title.
// Result order: "both" (matched on both platforms) first, then DA-only,
// then AS-only — so cross-posted work is always the most prominent.
function mergeItems(daItems, asItems) {
    const asMap = new Map();
    asItems.forEach(item => asMap.set(normTitle(item.title), item));

    const asMatched = new Set();
    const both  = [];
    const daOnly = [];

    daItems.forEach(daItem => {
        const key    = normTitle(daItem.title);
        const asItem = asMap.get(key);
        if (asItem) {
            asMatched.add(key);
            both.push({ title: daItem.title, image: daItem.image, daLink: daItem.link, asLink: asItem.link, sources: "both" });
        } else {
            daOnly.push({ title: daItem.title, image: daItem.image, daLink: daItem.link, asLink: null, sources: "da" });
        }
    });

    const asOnly = [];
    asItems.forEach(asItem => {
        if (!asMatched.has(normTitle(asItem.title))) {
            asOnly.push({ title: asItem.title, image: asItem.image, daLink: null, asLink: asItem.link, sources: "as" });
        }
    });

    return [...both, ...daOnly, ...asOnly];
}

// ── Merged gallery fetch ──────────────────────────────────────────────────────
function fetchMergedGallery(daEndpoint, gridSelector, limit = null) {
    const container = document.querySelector(gridSelector);
    if (!container) return;

    container.innerHTML = `<div class="gallery-loading">Loading artwork…</div>`;

    Promise.allSettled([
        proxiedFetch(daEndpoint.url).then(str => {
            const xml = new DOMParser().parseFromString(str, "text/xml");
            if (xml.querySelector("parsererror")) throw new Error("DA XML parse error");
            return parseRSSItems(xml);
        }),
        getArtStationItems()
    ]).then(([daResult, asResult]) => {
        const daItems = daResult.status === "fulfilled" ? daResult.value : [];
        const asItems = asResult.status === "fulfilled" ? asResult.value : [];

        if (daItems.length === 0 && asItems.length === 0) {
            container.innerHTML = fallbackBothHtml();
            return;
        }

        const merged  = mergeItems(daItems, asItems);
        const display = limit ? merged.slice(0, limit) : merged;

        // Inject the filter bar then the grid inside the container
        renderMergedContainer(container, gridSelector, display);

        if (daResult.status === "rejected") {
            container.insertAdjacentHTML("beforebegin", partialFailBanner("DeviantArt", "https://www.deviantart.com/rilyrobo"));
        }
        if (asResult.status === "rejected") {
            container.insertAdjacentHTML("beforebegin", partialFailBanner("ArtStation", "https://www.artstation.com/rilyrobo"));
        }
    });
}

// ── Render merged container (filter bar + cards) ──────────────────────────────
function renderMergedContainer(container, gridSelector, items) {
    const hasBoth = items.some(i => i.sources === "both");
    const hasDA   = items.some(i => i.sources === "da");
    const hasAS   = items.some(i => i.sources === "as");

    // Build filter bar only if there's something meaningful to filter
    let filterBar = "";
    if (hasBoth || (hasDA && hasAS)) {
        const slug = gridSelector.replace(/[^a-z0-9]/gi, "");
        filterBar = `
            <div class="gallery-filter-bar" data-grid="${slug}">
                <button class="gallery-filter-btn active" data-filter="all"    onclick="galleryFilter(this,'all',   '${slug}')">All</button>
                ${hasBoth ? `<button class="gallery-filter-btn" data-filter="both"   onclick="galleryFilter(this,'both',  '${slug}')"><span class="gfb-da">DA</span> + <span class="gfb-as">AS</span></button>` : ""}
                ${hasDA   ? `<button class="gallery-filter-btn" data-filter="da"     onclick="galleryFilter(this,'da',    '${slug}')">DeviantArt only</button>` : ""}
                ${hasAS   ? `<button class="gallery-filter-btn" data-filter="as"     onclick="galleryFilter(this,'as',    '${slug}')">ArtStation only</button>` : ""}
            </div>`;
    }

    container.innerHTML = filterBar + `<div class="gallery-grid gallery-inner-grid" id="grid-${gridSelector.replace(/[^a-z0-9]/gi,'')}">` +
        items.map(item => renderMergedCard(item)).join("") +
        `</div>`;

    // Re-attach modal listeners to the inner grid
    const innerGrid = container.querySelector(".gallery-inner-grid");
    if (innerGrid) {
        innerGrid.id = `inner-${gridSelector.replace(/[^a-z0-9]/gi, "")}`;
        attachModalListenersToElement(innerGrid);
    }
}

// Filter handler — show/hide cards by their data-sources attribute
function galleryFilter(btn, filter, slug) {
    const bar = btn.closest(".gallery-filter-bar");
    if (bar) bar.querySelectorAll(".gallery-filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const container = btn.closest(".gallery-grid");
    if (!container) return;

    container.querySelectorAll(".gallery-card").forEach(card => {
        const src = card.dataset.sources;
        card.style.display = (filter === "all" || src === filter) ? "" : "none";
    });
}

// ── Card renderer ─────────────────────────────────────────────────────────────
function renderMergedCard(item) {
    const primaryLink = item.daLink || item.asLink;

    const badges = [
        item.daLink ? `<a href="${escapeAttr(item.daLink)}" class="gallery-badge badge-da" target="_blank" rel="noopener noreferrer" title="View on DeviantArt" onclick="event.stopPropagation()">DA</a>` : "",
        item.asLink ? `<a href="${escapeAttr(item.asLink)}" class="gallery-badge badge-as" target="_blank" rel="noopener noreferrer" title="View on ArtStation" onclick="event.stopPropagation()">AS</a>` : "",
    ].join("");

    const cardClass = item.sources === "both" ? "gallery-card gallery-both grid-item"
                    : item.sources === "as"   ? "gallery-card gallery-artstation grid-item"
                    :                            "gallery-card gallery-deviantart grid-item";

    return `
        <div class="${cardClass}"
             data-link="${escapeAttr(primaryLink)}"
             data-image="${escapeAttr(item.image)}"
             data-sources="${item.sources}">
            <img src="${escapeAttr(item.image)}"
                 alt="${escapeAttr(item.title)}"
                 loading="lazy"
                 onerror="this.closest('.gallery-card').style.display='none'">
            <div class="gallery-card-footer">
                <h4 title="${escapeAttr(item.title)}">${escapeHtml(item.title)}</h4>
                <div class="gallery-badges">${badges}</div>
            </div>
        </div>`;
}

// Attach modal listeners directly to a DOM element (not selector-based)
function attachModalListenersToElement(el) {
    const modal      = document.getElementById("gallery-modal");
    const modalImage = document.getElementById("modal-image");
    const modalLink  = document.getElementById("modal-link");
    if (!el || !modal || !modalImage || !modalLink) return;

    if (modal.parentElement !== document.body) document.body.appendChild(modal);

    el.addEventListener("click", (e) => {
        const card = e.target.closest(".gallery-card");
        if (card) {
            modalImage.src = card.dataset.image;
            modalLink.href = card.dataset.link;
            modal.style.display = "flex";
            window.acquireModalLock?.();
        }
    });

    if (!modal.dataset.listenerBound) {
        modal.dataset.listenerBound = "1";
        modal.addEventListener("click", (e) => {
            if (e.target === modal) { modal.style.display = "none"; window.releaseModalLock?.(); }
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && modal.style.display === "flex") {
                modal.style.display = "none"; window.releaseModalLock?.();
            }
        });
    }
}

// ── Single-source DA fetch (home preview, 2D Art, Character Design) ───────────
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
                container.innerHTML = `<p class="error-message">No artwork found.</p>`;
                return;
            }

            container.innerHTML = display.map(({ title, link, image }) => `
                <div class="gallery-card gallery-deviantart grid-item"
                     data-link="${escapeAttr(link)}"
                     data-image="${escapeAttr(image)}"
                     data-sources="da">
                    <img src="${escapeAttr(image)}"
                         alt="${escapeAttr(title)}"
                         loading="lazy"
                         onerror="this.closest('.gallery-card').style.display='none'">
                    <div class="gallery-card-footer">
                        <h4 title="${escapeAttr(title)}">${escapeHtml(title)}</h4>
                        <div class="gallery-badges">
                            <a href="${escapeAttr(link)}" class="gallery-badge badge-da" target="_blank" rel="noopener noreferrer" title="View on DeviantArt" onclick="event.stopPropagation()">DA</a>
                        </div>
                    </div>
                </div>`).join("");

            attachModalListeners(gridSelector);
        })
        .catch(err => {
            console.error(`Gallery load failed for ${gridSelector}:`, err);
            container.innerHTML = `<p class="error-message">Could not load artwork.
                <a href="https://www.deviantart.com/rilyrobo" target="_blank" rel="noopener noreferrer">View on DeviantArt →</a></p>`;
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
        galleryPage.innerHTML = `
            <h2 class="center-text">${gallery.title}</h2>
            <p class="center-text">${gallery.description}</p>
            <div class="gallery-grid gallery-grid-${slug}"></div>
            <div class="button-container">
                <a href="https://www.deviantart.com/rilyrobo" target="_blank" rel="noopener noreferrer" class="button deviantart-button">More on DeviantArt</a>
                <a href="https://www.artstation.com/rilyrobo" target="_blank" rel="noopener noreferrer" class="button artstation-button">More on ArtStation</a>
            </div>`;
        mainContainer.appendChild(galleryPage);

        // All category tabs get the merged view so ArtStation-only work
        // always surfaces, and dual-posted pieces show both platform links.
        fetchMergedGallery(gallery, `.gallery-grid-${slug}`);
    });

    dropdownContent.innerHTML = dropdownHtml;

    document.querySelectorAll(".gallery-preview").forEach(preview => {
        preview.addEventListener("click", () => showPage(preview.getAttribute("data-target")));
    });
}

// ── Error helpers ─────────────────────────────────────────────────────────────
function fallbackBothHtml() {
    return `<p class="error-message">
        Could not load galleries automatically.
        <a href="https://www.deviantart.com/rilyrobo" target="_blank" rel="noopener noreferrer">DeviantArt</a> ·
        <a href="https://www.artstation.com/rilyrobo" target="_blank" rel="noopener noreferrer">ArtStation</a>
    </p>`;
}

function partialFailBanner(platform, url) {
    return `<p class="gallery-partial-fail">Could not load ${platform} items.
        <a href="${url}" target="_blank" rel="noopener noreferrer">View on ${platform} →</a></p>`;
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