// ── Comic data (exposed globally so script.js hash routing can access it) ────
window.comicsList = [
    { title: "The Day Nobody Died",    file: "comics/day-nobody-died.csv",   icon: "images/icon/comic_icon_The-Day-Nobody-Died.ico" },
    { title: "The King and Guardian",  file: "comics/king-and-guardian.csv", icon: "images/icon/comic_icon_The-King-and-Guardian.ico" },
];

document.addEventListener("DOMContentLoaded", () => {
    setupComics(window.comicsList);
    createComicPages(window.comicsList);
    if (!window.location.hash) {
        history.replaceState(null, "", "#home");
    }
});

// ── Comics landing grid + dropdown ───────────────────────────────────────────
function setupComics(comicsList) {
    const dropdownContent = document.querySelector(".dropdown-content-comics");
    const comicsGrid      = document.querySelector("#comics-grid");
    if (!dropdownContent || !comicsGrid) return;

    let dropdownHtml = "";
    let gridHtml     = "";

    comicsList.forEach((comic, index) => {
        const slug = comic.title.replace(/\s+/g, "-");
        dropdownHtml += `
            <div class="dropdown-item">
                <a href="#comic-${slug}" onclick="showPage('comic-${slug}')">${comic.title}</a>
                <div class="nav-hover-image-dropdown" style="background:url('${comic.icon}') center/cover no-repeat;"></div>
            </div>`;
        gridHtml += `
            <div class="comic-preview" data-target="comic-${slug}">
                <div class="comic-card">
                    <div class="comic-image-container">
                        <div class="comic-preview-loader"><div class="comic-loader-spinner"></div></div>
                        <img src="" alt="${comic.title}" id="comic-preview-image-${index}" class="comic-image comic-preview-img-loading">
                    </div>
                    <h4>${comic.title}</h4>
                </div>
            </div>`;
        fetchFirstComicImage(comic.file, `#comic-preview-image-${index}`);
    });

    dropdownContent.innerHTML = dropdownHtml;
    comicsGrid.innerHTML      = gridHtml;

    document.querySelectorAll(".comic-preview").forEach(preview => {
        preview.addEventListener("click", () => showPage(preview.getAttribute("data-target")));
    });
}

// ── Dynamic comic pages ──────────────────────────────────────────────────────
function createComicPages(comicsList) {
    // querySelector('page') targets the custom <page> element in index.html
    const mainContainer = document.querySelector("page");
    if (!mainContainer) {
        console.error("Could not find <page> container element.");
        return;
    }

    comicsList.forEach((comic, index) => {
        // Don't create a duplicate if the page already exists (e.g. hot-reload)
        if (document.getElementById(`comic-${comic.title.replace(/\s+/g, "-")}`)) return;

        const comicPage = document.createElement("div");
        comicPage.id        = `comic-${comic.title.replace(/\s+/g, "-")}`;
        comicPage.className = "page";
        comicPage.innerHTML = `
            <h2 style="text-align:center;">${comic.title}</h2>
            <div class="comics-container">
                <div class="comic-navigation">
                    <button class="comic-btn" id="first-top-comic-${index}" title="First page" aria-label="First page">⏮</button>
                    <button class="comic-btn" id="previous-top-comic-${index}" title="Previous page" aria-label="Previous page">◀</button>
                    <select id="comic-selector-${index}" class="comic-selector" aria-label="Jump to page"></select>
                    <button class="comic-btn" id="next-top-comic-${index}" title="Next page" aria-label="Next page">▶</button>
                    <button class="comic-btn" id="last-top-comic-${index}" title="Last page" aria-label="Last page">⏭</button>
                </div>
                <div id="comic-display-${index}" class="comic-display">
                    <div id="comic-loader-${index}" class="comic-loader" aria-label="Loading page…">
                        <div class="comic-loader-spinner"></div>
                        <span>Loading page…</span>
                    </div>
                    <img id="comic-image-${index}" src="" alt="${comic.title}" style="width:100%;object-fit:contain;display:block;margin:auto;">
                </div>
                <div class="comic-navigation">
                    <button class="comic-btn" id="first-bot-comic-${index}" title="First page" aria-label="First page">⏮</button>
                    <button class="comic-btn" id="previous-bot-comic-${index}" title="Previous page" aria-label="Previous page">◀</button>
                    <select id="comic-selector-bottom-${index}" class="comic-selector" aria-label="Jump to page"></select>
                    <button class="comic-btn" id="next-bot-comic-${index}" title="Next page" aria-label="Next page">▶</button>
                    <button class="comic-btn" id="last-bot-comic-${index}" title="Last page" aria-label="Last page">⏭</button>
                </div>
            </div>`;
        mainContainer.appendChild(comicPage);
        setupComicNavigation(comic, index);
    });
}

// ── CSV loading ───────────────────────────────────────────────────────────────
function loadCSV(filePath, callback) {
    fetch(filePath)
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status} loading ${filePath}`);
            return r.text();
        })
        .then(text => callback(parseCSV(text)))
        .catch(err => {
            console.error("CSV load error:", err);
            callback([]);
        });
}

function parseCSV(data) {
    const lines   = data.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim());
    const result  = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle quoted fields (e.g. URLs with commas)
        const cols = [];
        let current = "", inQuotes = false;
        for (let c = 0; c < line.length; c++) {
            const ch = line[c];
            if (ch === '"') {
                inQuotes = !inQuotes;
            } else if (ch === "," && !inQuotes) {
                cols.push(current.trim());
                current = "";
            } else {
                current += ch;
            }
        }
        cols.push(current.trim());

        if (cols.length < headers.length) continue;
        const obj = {};
        headers.forEach((h, j) => { obj[h] = cols[j] ?? ""; });
        result.push(obj);
    }
    return result;
}

// ── First-image preview for the comics grid ───────────────────────────────────
function fetchFirstComicImage(filePath, imgSelector) {
    loadCSV(filePath, (data) => {
        if (data.length === 0) return;
        const imgEl = document.querySelector(imgSelector);
        if (!imgEl) return;
        const loader = imgEl.closest(".comic-image-container")?.querySelector(".comic-preview-loader");

        const tempImg = new Image();
        tempImg.onload = () => {
            imgEl.src = data[0].ImageUrl;
            imgEl.alt = data[0].Title;
            imgEl.classList.remove("comic-preview-img-loading");
            if (loader) loader.style.display = "none";
        };
        tempImg.onerror = () => {
            if (loader) loader.style.display = "none";
        };
        tempImg.src = data[0].ImageUrl;
    });
}

// ── Navigation setup ──────────────────────────────────────────────────────────
function setupComicNavigation(comic, comicIndex) {
    loadCSV(comic.file, (images) => {
        if (images.length === 0) {
            console.warn(`No images found in ${comic.file}`);
            return;
        }

        const get = id => document.getElementById(id);

        const firstTop  = get(`first-top-comic-${comicIndex}`);
        const prevTop   = get(`previous-top-comic-${comicIndex}`);
        const nextTop   = get(`next-top-comic-${comicIndex}`);
        const lastTop   = get(`last-top-comic-${comicIndex}`);
        const firstBot  = get(`first-bot-comic-${comicIndex}`);
        const prevBot   = get(`previous-bot-comic-${comicIndex}`);
        const nextBot   = get(`next-bot-comic-${comicIndex}`);
        const lastBot   = get(`last-bot-comic-${comicIndex}`);
        const topSel    = get(`comic-selector-${comicIndex}`);
        const botSel    = get(`comic-selector-bottom-${comicIndex}`);

        // Populate selectors
        [topSel, botSel].forEach(sel => {
            sel.innerHTML = "";
            images.forEach((img, i) => {
                const opt = document.createElement("option");
                opt.value       = i;
                opt.textContent = img.Title || `Page ${i + 1}`;
                sel.appendChild(opt);
            });
        });

        // Read starting page from URL hash
        let currentIndex = 0;
        const hashMatch = window.location.hash.match(/-page-(\d+)$/);
        if (hashMatch) {
            const target = parseInt(hashMatch[1], 10) - 1;
            if (target >= 0 && target < images.length) currentIndex = target;
        }

        function updateDisplay(index) {
            if (index < 0 || index >= images.length) return;
            currentIndex         = index;
            topSel.value         = index;
            botSel.value         = index;
            firstTop.disabled    = firstBot.disabled = index === 0;
            prevTop.disabled     = prevBot.disabled  = index === 0;
            nextTop.disabled     = nextBot.disabled  = index === images.length - 1;
            lastTop.disabled     = lastBot.disabled  = index === images.length - 1;
            displayComicImage(images, comicIndex, index);

            const comicSlug = `comic-${comic.title.replace(/\s+/g, "-")}`;
            if (window.location.hash.startsWith(`#${comicSlug}`)) {
                history.replaceState(null, "", `#${comicSlug}-page-${index + 1}`);
            }
        }

        firstTop.addEventListener("click",  () => updateDisplay(0));
        prevTop .addEventListener("click",  () => updateDisplay(currentIndex - 1));
        nextTop .addEventListener("click",  () => updateDisplay(currentIndex + 1));
        lastTop .addEventListener("click",  () => updateDisplay(images.length - 1));
        firstBot.addEventListener("click",  () => updateDisplay(0));
        prevBot .addEventListener("click",  () => updateDisplay(currentIndex - 1));
        nextBot .addEventListener("click",  () => updateDisplay(currentIndex + 1));
        lastBot .addEventListener("click",  () => updateDisplay(images.length - 1));
        topSel  .addEventListener("change", e  => updateDisplay(Number(e.target.value)));
        botSel  .addEventListener("change", e  => updateDisplay(Number(e.target.value)));

        // ── Keyboard navigation (arrow keys) when this comic page is active ──
        document.addEventListener("keydown", (e) => {
            const comicPageId = `comic-${comic.title.replace(/\s+/g, "-")}`;
            const activePage  = document.querySelector(".page.active");
            if (!activePage || activePage.id !== comicPageId) return;
            if (e.key === "ArrowRight" || e.key === "ArrowDown")  updateDisplay(currentIndex + 1);
            if (e.key === "ArrowLeft"  || e.key === "ArrowUp")    updateDisplay(currentIndex - 1);
            if (e.key === "Home") updateDisplay(0);
            if (e.key === "End")  updateDisplay(images.length - 1);
        });

        // ── Touch/swipe support ───────────────────────────────────────────────
        const displayEl = document.getElementById(`comic-display-${comicIndex}`);
        let touchStartX = 0;
        displayEl.addEventListener("touchstart", e => { touchStartX = e.touches[0].clientX; }, { passive: true });
        displayEl.addEventListener("touchend",   e => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(dx) > 40) {
                dx < 0 ? updateDisplay(currentIndex + 1) : updateDisplay(currentIndex - 1);
            }
        });

        updateDisplay(currentIndex);
    });
}

// ── Render a comic image ──────────────────────────────────────────────────────
function displayComicImage(images, comicIndex, index) {
    const displayDiv = document.getElementById(`comic-display-${comicIndex}`);
    if (!displayDiv) return;
    const imgEl    = displayDiv.querySelector("img");
    const loaderEl = document.getElementById(`comic-loader-${comicIndex}`);
    if (!imgEl) return;

    if (!images || !images[index]) {
        console.error(`Comic image data missing for index ${index}`);
        return;
    }

    const newSrc = images[index].ImageUrl;
    const newAlt = images[index].Title || `Page ${index + 1}`;

    // Show loader and fade out old image immediately
    if (loaderEl) loaderEl.classList.add("visible");
    imgEl.classList.add("loading");

    // Disable nav buttons while loading to prevent rapid-fire requests
    // (buttons are re-enabled in onload/onerror)
    displayDiv.closest(".comics-container")
        ?.querySelectorAll(".comic-btn")
        .forEach(b => b.classList.add("nav-loading"));

    const tempImg = new Image();

    tempImg.onload = () => {
        imgEl.src = newSrc;
        imgEl.alt = newAlt;
        imgEl.classList.remove("loading");
        if (loaderEl) loaderEl.classList.remove("visible");
        displayDiv.closest(".comics-container")
            ?.querySelectorAll(".comic-btn")
            .forEach(b => b.classList.remove("nav-loading"));
        window.scrollTo(0, 0);
    };

    tempImg.onerror = () => {
        imgEl.classList.remove("loading");
        if (loaderEl) {
            loaderEl.innerHTML = `<span class="comic-load-error">⚠ Could not load page ${index + 1}</span>`;
            loaderEl.classList.add("visible");
            loaderEl.classList.add("error");
        }
        displayDiv.closest(".comics-container")
            ?.querySelectorAll(".comic-btn")
            .forEach(b => b.classList.remove("nav-loading"));
    };

    tempImg.src = newSrc;
}