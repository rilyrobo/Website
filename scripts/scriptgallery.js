// ── Modal population + dismissal ─────────────────────────────────────────────
// Centralized here so both the multi-source "View on" buttons and the
// backdrop/Escape/close-button dismissal logic exist in exactly one place,
// instead of being duplicated across attachModalListeners and
// attachModalListenersToElement (as the single-link version used to be).
function populateModal(card) {
    const modalImage = document.getElementById("modal-image");
    const modalLinks = document.getElementById("modal-links");
    const modalDate  = document.getElementById("modal-date");
    if (!modalImage || !modalLinks) return;

    modalImage.src = card.dataset.image;

    const daLink = card.dataset.daLink;
    const asLink = card.dataset.asLink;
    let linksHtml = "";
    if (daLink) linksHtml += `<a href="${daLink}" target="_blank" rel="noopener noreferrer" class="button deviantart-button">View on DeviantArt</a>`;
    if (asLink) linksHtml += `<a href="${asLink}" target="_blank" rel="noopener noreferrer" class="button artstation-button">View on ArtStation</a>`;
    modalLinks.innerHTML = linksHtml;

    if (modalDate) {
        const raw = card.dataset.date;
        const parsed = raw ? new Date(raw) : null;
        modalDate.textContent = (parsed && !isNaN(parsed))
            ? `Uploaded ${parsed.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}`
            : "";
    }
}

function bindModalDismissal(modal) {
    if (modal.dataset.listenerBound) return;
    modal.dataset.listenerBound = "1";

    const closeBtn = modal.querySelector(".close");
    const close = () => {
        modal.style.display = "none";
        window.releaseModalLock?.();
    };

    closeBtn?.addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.style.display === "flex") close();
    });
}

function attachModalListeners(gridSelector) {
    const grid  = document.querySelector(gridSelector);
    const modal = document.getElementById("gallery-modal");
    if (!grid || !modal) return;

    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const fresh = grid.cloneNode(true);
    grid.parentNode.replaceChild(fresh, grid);

    fresh.addEventListener("click", (e) => {
        const card = e.target.closest(".gallery-card");
        if (card) {
            populateModal(card);
            modal.style.display = "flex";
            window.acquireModalLock?.();
        }
    });

    bindModalDismissal(modal);
}

function attachModalListenersToElement(el) {
    const modal = document.getElementById("gallery-modal");
    if (!el || !modal) return;

    if (modal.parentElement !== document.body) document.body.appendChild(modal);

    el.addEventListener("click", (e) => {
        const card = e.target.closest(".gallery-card");
        if (card) {
            populateModal(card);
            modal.style.display = "flex";
            window.acquireModalLock?.();
        }
    });

    bindModalDismissal(modal);
}

// ── Data sources ──────────────────────────────────────────────────────────────
const DATA_BASE = "data/";

const galleryData = [
    { file: "da-featured.json",         title: "Featured",         icon: "images/icon/nav_icon_Work.gif",     description: "A collection of my latest work"      },
    { file: "da-2d-art.json",           title: "2D Art",           icon: "images/icon/nav_icon_Gallery.gif",  description: "A collection of my 2D artwork"        },
    { file: "da-3d-art.json",           title: "3D Art",           icon: "images/icon/nav_icon_3D.gif",       description: "A collection of my 3D artwork"        },
    { file: "da-character-design.json", title: "Character Design", icon: "images/icon/nav_icon_Gallery2.gif", description: "A collection of my character designs" },
];

let asItemsCache = null;
let asItemsPromise = null;

function getArtStationItems() {
    if (asItemsCache) return Promise.resolve(asItemsCache);
    if (asItemsPromise) return asItemsPromise;
    asItemsPromise = fetchJSON("artstation.json")
        .then(d => { asItemsCache = d.items || []; return asItemsCache; })
        .catch(() => { asItemsCache = []; return []; });
    return asItemsPromise;
}

function fetchJSON(filename) {
    return fetch(DATA_BASE + filename + "?v=" + Date.now())
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status} for ${filename}`);
            return r.json();
        });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    loadGalleryData(galleryData[0], ".gallery-grid-home", 5);
    loadMergedGallery(galleryData[0], ".gallery-grid-full");
    setupGalleries(galleryData);
});

// ── Title normalisation for fuzzy matching ────────────────────────────────────
function normTitle(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function parseDateSafe(str) {
    if (!str) return null;
    const t = Date.parse(str);
    return Number.isNaN(t) ? null : t;
}

// Returns whichever of two date strings is chronologically earliest. Falls
// back to whichever one exists if only one parsed successfully, and to null
// if neither did — callers must handle null (means "unknown", not "oldest").
function pickEarliestDate(dateA, dateB) {
    const tA = parseDateSafe(dateA);
    const tB = parseDateSafe(dateB);
    if (tA !== null && tB !== null) return tA <= tB ? dateA : dateB;
    return dateA || dateB || null;
}

// ── Merge engine ──────────────────────────────────────────────────────────────
// Dual-posted pieces use the EARLIEST known date across both platforms (the
// date it was actually first shared, regardless of which platform it hit
// first). The merged list is sorted chronologically (newest first) across
// ALL items — replacing the old "both-platform pieces always first"
// grouping, which was ordered by platform coverage rather than recency and
// became actively misleading once real dates were available. Platform
// coverage still drives the filter bar and the gold "both" border — it just
// no longer dictates position.
function mergeItems(daItems, asItems) {
    const asMap     = new Map(asItems.map(i => [normTitle(i.title), i]));
    const asMatched = new Set();
    const merged = [];

    daItems.forEach(da => {
        const key = normTitle(da.title);
        const as  = asMap.get(key);
        if (as) {
            asMatched.add(key);
            merged.push({
                title: da.title, image: da.image,
                daLink: da.link, asLink: as.link,
                date: pickEarliestDate(da.date, as.date),
                sources: "both",
            });
        } else {
            merged.push({
                title: da.title, image: da.image,
                daLink: da.link, asLink: null,
                date: da.date || null,
                sources: "da",
            });
        }
    });

    asItems.forEach(as => {
        if (!asMatched.has(normTitle(as.title))) {
            merged.push({
                title: as.title, image: as.image,
                daLink: null, asLink: as.link,
                date: as.date || null,
                sources: "as",
            });
        }
    });

    // Newest first. Flip `tb - ta` to `ta - tb` for oldest-first instead.
    // Items with no parseable date sort to the very end rather than being
    // treated as "oldest" via a 0/epoch fallback.
    merged.sort((a, b) => {
        const ta = parseDateSafe(a.date);
        const tb = parseDateSafe(b.date);
        if (ta === null && tb === null) return 0;
        if (ta === null) return 1;
        if (tb === null) return -1;
        return tb - ta;
    });

    return merged;
}

// ── Home preview (DA only, 5 items) ──────────────────────────────────────────
function loadGalleryData(gallery, gridSelector, limit = null) {
    const container = document.querySelector(gridSelector);
    if (!container) return;
    container.innerHTML = `<div class="gallery-loading">Loading artwork…</div>`;

    fetchJSON(gallery.file)
        .then(data => {
            const items   = data.items || [];
            const display = limit ? items.slice(0, limit) : items;
            if (!display.length) {
                container.innerHTML = noArtworkHtml();
                return;
            }
            container.innerHTML = display.map(i => renderCard({
                title: i.title, image: i.image,
                daLink: i.link, asLink: null,
                date: i.date || null, sources: "da",
            })).join("");
            attachModalListeners(gridSelector);
        })
        .catch(() => {
            container.innerHTML = fallbackHtml("https://www.deviantart.com/rilyrobo", "DeviantArt");
        });
}

// ── Merged gallery (DA + ArtStation) ─────────────────────────────────────────
function loadMergedGallery(gallery, gridSelector, limit = null) {
    const container = document.querySelector(gridSelector);
    if (!container) return;
    container.innerHTML = `<div class="gallery-loading">Loading artwork…</div>`;

    Promise.allSettled([
        fetchJSON(gallery.file),
        getArtStationItems()
    ]).then(([daResult, asResult]) => {
        const daItems = daResult.status === "fulfilled" ? (daResult.value.items || []) : [];
        const asItems = asResult.status === "fulfilled" ? asResult.value : [];

        if (!daItems.length && !asItems.length) {
            container.innerHTML = fallbackBothHtml();
            return;
        }

        const merged  = mergeItems(daItems, asItems);
        const display = limit ? merged.slice(0, limit) : merged;
        renderMergedContainer(container, display);

        if (daResult.status === "rejected") {
            container.insertAdjacentHTML("beforebegin",
                partialFailBanner("DeviantArt", "https://www.deviantart.com/rilyrobo"));
        }
        if (asResult.status === "rejected") {
            container.insertAdjacentHTML("beforebegin",
                partialFailBanner("ArtStation", "https://rilyrobo.artstation.com/"));
        }
    });
}

// ── Render merged container (filter bar + cards) ──────────────────────────────
function renderMergedContainer(container, items) {
    const hasBoth = items.some(i => i.sources === "both");
    const hasDA   = items.some(i => i.sources === "da");
    const hasAS   = items.some(i => i.sources === "as");

    let filterBar = "";
    if (hasBoth || (hasDA && hasAS)) {
        filterBar = `
            <div class="gallery-filter-bar">
                <button class="gallery-filter-btn active" onclick="galleryFilter(this,'all')">All</button>
                ${hasBoth ? `<button class="gallery-filter-btn" onclick="galleryFilter(this,'both')"><span class="gfb-da">DA</span> + <span class="gfb-as">AS</span></button>` : ""}
                ${hasDA   ? `<button class="gallery-filter-btn" onclick="galleryFilter(this,'da')">DeviantArt only</button>`  : ""}
                ${hasAS   ? `<button class="gallery-filter-btn" onclick="galleryFilter(this,'as')">ArtStation only</button>`  : ""}
            </div>`;
    }

    container.innerHTML = filterBar +
        `<div class="gallery-inner-grid">` +
        items.map(item => renderCard(item)).join("") +
        `</div>`;

    const innerGrid = container.querySelector(".gallery-inner-grid");
    if (innerGrid) attachModalListenersToElement(innerGrid);
}

function galleryFilter(btn, filter) {
    btn.closest(".gallery-filter-bar")
       ?.querySelectorAll(".gallery-filter-btn")
       .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    btn.closest(".gallery-grid, .gallery-inner-grid, .gallery-grid-full")
       ?.querySelectorAll(".gallery-card")
       .forEach(card => {
           card.style.display = (filter === "all" || card.dataset.sources === filter) ? "" : "none";
       });
}

// ── Card renderer ─────────────────────────────────────────────────────────────
// Carries both platform links + the resolved date in data-* attributes so
// the modal (populateModal, above) can build the correct set of "View on"
// buttons and the date caption without needing a second data lookup.
function renderCard(item) {
    const badges = [
        item.daLink ? `<a href="${escapeAttr(item.daLink)}" class="gallery-badge badge-da" target="_blank" rel="noopener noreferrer" title="View on DeviantArt" onclick="event.stopPropagation()">DA</a>` : "",
        item.asLink ? `<a href="${escapeAttr(item.asLink)}" class="gallery-badge badge-as" target="_blank" rel="noopener noreferrer" title="View on ArtStation" onclick="event.stopPropagation()">AS</a>` : "",
    ].join("");

    const cls = item.sources === "both" ? "gallery-card gallery-both grid-item"
              : item.sources === "as"   ? "gallery-card gallery-artstation grid-item"
              :                            "gallery-card gallery-deviantart grid-item";

    return `
        <div class="${cls}"
             data-da-link="${escapeAttr(item.daLink || '')}"
             data-as-link="${escapeAttr(item.asLink || '')}"
             data-image="${escapeAttr(item.image)}"
             data-date="${escapeAttr(item.date || '')}"
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

// ── Gallery page setup ────────────────────────────────────────────────────────
function setupGalleries(galleryData) {
    const dropdownContent = document.querySelector(".dropdown-content-gallery");
    const mainContainer   = document.querySelector("page");
    if (!dropdownContent || !mainContainer) return;

    let dropdownHtml = "";

    galleryData.slice(1).forEach(gallery => {
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
                <a href="https://www.deviantart.com/rilyrobo"   target="_blank" rel="noopener noreferrer" class="button deviantart-button">More on DeviantArt</a>
                <a href="https://rilyrobo.artstation.com/"       target="_blank" rel="noopener noreferrer" class="button artstation-button">More on ArtStation</a>
            </div>`;
        mainContainer.appendChild(galleryPage);

        loadMergedGallery(gallery, `.gallery-grid-${slug}`);
    });

    dropdownContent.innerHTML = dropdownHtml;

    document.querySelectorAll(".gallery-preview").forEach(preview => {
        preview.addEventListener("click", () => showPage(preview.getAttribute("data-target")));
    });
}

// ── Error helpers ─────────────────────────────────────────────────────────────
function noArtworkHtml() {
    return `<p class="error-message">No artwork found in this gallery.</p>`;
}

function fallbackHtml(url, platform) {
    return `<p class="error-message">Could not load artwork.
        <a href="${url}" target="_blank" rel="noopener noreferrer">View on ${platform} →</a></p>`;
}

function fallbackBothHtml() {
    return `<p class="error-message">
        Could not load galleries.
        <a href="https://www.deviantart.com/rilyrobo" target="_blank" rel="noopener noreferrer">DeviantArt</a> ·
        <a href="https://rilyrobo.artstation.com/"    target="_blank" rel="noopener noreferrer">ArtStation</a>
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