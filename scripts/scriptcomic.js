

document.addEventListener("DOMContentLoaded", () => {
    const comicsList = [
        { title: "The Day Nobody Died", file: "comics/day-nobody-died.csv", icon: "images/icon/comic_icon_The-Day-Nobody-Died.ico" },
        { title: "The King and Guardian", file: "comics/king-and-guardian.csv", icon: "images/icon/comic_icon_The-King-and-Guardian.ico" },
    ];

    setupComics(comicsList);
    createComicPages(comicsList);
    if (!window.location.hash) {
        history.replaceState(null, '', '#home');
    }
});

function setupComics(comicsList) {
    const dropdownContent = document.querySelector(".dropdown-content-comics");
    const comicsGrid = document.querySelector("#comics-grid");

    let dropdownHtml =  '';//`<a href="#comics" onclick="showPage('comics')">Comics</a>`;
    let gridHtml = '';

    comicsList.forEach((comic, index) => {
        const urlFriendlyTitle = comic.title.replace(/\s+/g, '-');
        dropdownHtml += `
                    <div class="dropdown-item">
                        <a href="#comic-${urlFriendlyTitle}" onclick="showPage('comic-${urlFriendlyTitle}')">${comic.title}</a>
                <div class="nav-hover-image-dropdown" style="background: url('${comic.icon}') center/cover no-repeat;"></div>
                    </div>`;
        gridHtml += `
            <div class="comic-preview" data-target="comic-${urlFriendlyTitle}">
                <div class="comic-card">
                    <div class="comic-image-container">
                        <img src="" alt="${comic.title}" id="comic-preview-image-${index}" class="comic-image">
                    </div>
                    <h4>${comic.title}</h4>
                </div>
            </div>`;
        fetchFirstComicImage(comic.file, `#comic-preview-image-${index}`);
    });

    dropdownContent.innerHTML = dropdownHtml;
    comicsGrid.innerHTML = gridHtml;
    const comicPreviews = document.querySelectorAll(".comic-preview");
    comicPreviews.forEach(preview => {
        preview.addEventListener("click", () => {
            const target = preview.getAttribute("data-target");
            showPage(target);
        });
    });
}

function fetchFirstComicImage(filePath, imgSelector) {
    loadCSV(filePath, (data) => {
        if (data.length > 0) {
            const firstItem = data[0];
            const imgElement = document.querySelector(imgSelector);
            if (imgElement) {
                imgElement.src = firstItem.ImageUrl;
                imgElement.alt = firstItem.Title;
            }
        } else {
            console.error("No data found in CSV file.");
        }
    });
}

function createComicPages(comicsList) {
    const mainContainer = document.querySelector('page');

    comicsList.forEach((comic, index) => {
        const comicPage = document.createElement('div');
        comicPage.id = `comic-${comic.title.replace(/\s+/g, '-')}`;
        comicPage.className = 'page';
        comicPage.innerHTML = `
            <h2 style="text-align: center;">${comic.title}</h2>
            <div class="comics-container">
                <div>
                    <button id="first-top-comic-${index}">First</button>
                    <button id="previous-top-comic-${index}">Prev</button>
                    <select id="comic-selector-${index}" class="comic-selector"></select>
                    <button id="next-top-comic-${index}">Next</button>
                    <button id="last-top-comic-${index}">Last</button>
                </div>
                <div id="comic-display-${index}" class="comic-display">
                    <img id="comic-image-${index}" src="" alt="${comic.title}" style="width: 100%; object-fit: contain; display: block; margin: auto;">
                </div>
                <div>
                    <button id="first-bot-comic-${index}">First</button>
                    <button id="previous-bot-comic-${index}">Prev</button>
                    <select id="comic-selector-bottom-${index}" class="comic-selector"></select>
                    <button id="next-bot-comic-${index}">Next</button>
                    <button id="last-bot-comic-${index}">Last</button>
                </div>
            </div>
        `;
        mainContainer.appendChild(comicPage);
        setupComicNavigation(comic, index);
    });
}

function loadCSV(filePath, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", filePath, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const data = parseCSV(xhr.responseText);
            callback(data);
        }
    };
    xhr.send();
}

function parseCSV(data) {
    const lines = data.split("\n");
    const result = [];
    const headers = lines[0].split(",");

    for (let i = 1; i < lines.length; i++) {
        const obj = {};
        const currentLine = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);

        if (currentLine !== null) {
            for (let j = 0; j < headers.length; j++) {
                if (currentLine[j] !== undefined) {
                    obj[headers[j].trim()] = currentLine[j].replace(/(^"|"$)/g, '').trim();
                }
            }
            result.push(obj);
        }
    }
    return result;
}

function setupComicNavigation(comic, comicIndex) {
    loadCSV(comic.file, (images) => {
        const firstTopButton = document.getElementById(`first-top-comic-${comicIndex}`);
        const previousTopButton = document.getElementById(`previous-top-comic-${comicIndex}`);
        const nextTopButton = document.getElementById(`next-top-comic-${comicIndex}`);
        const lastTopButton = document.getElementById(`last-top-comic-${comicIndex}`);
        const firstBotButton = document.getElementById(`first-bot-comic-${comicIndex}`);
        const previousBotButton = document.getElementById(`previous-bot-comic-${comicIndex}`);
        const nextBotButton = document.getElementById(`next-bot-comic-${comicIndex}`);
        const lastBotButton = document.getElementById(`last-bot-comic-${comicIndex}`);
        const topSelector = document.getElementById(`comic-selector-${comicIndex}`);
        const bottomSelector = document.getElementById(`comic-selector-bottom-${comicIndex}`);

        images.forEach((image, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = image.Title;
            topSelector.appendChild(option);

            const bottomOption = option.cloneNode(true);
            bottomSelector.appendChild(bottomOption);
        });

        let currentIndex = 0;
        const hash = window.location.hash;
        const regex = new RegExp(`^#comic-[\\w-]+-page-(\\d+)$`);
        const match = regex.exec(hash);

        if (match) {
            const targetPage = parseInt(match[1], 10) - 1;
            if (targetPage >= 0 && targetPage < images.length) {
                currentIndex = targetPage;
            }
        }

        const updateImageDisplay = (index) => {
            if (index >= 0 && index < images.length) {
            currentIndex = index;
            displayComicImage(images, comicIndex, currentIndex);
            topSelector.value = currentIndex;
            bottomSelector.value = currentIndex;
            const comicId = `comic-${comic.title.replace(/\s+/g, '-')}`;
            const pageNumber = currentIndex + 1;
            if (window.location.hash.startsWith(`#${comicId}`)) {
                history.replaceState(null, '', `#${comicId}-page-${pageNumber}`);
            }
            }
        };

        firstTopButton.addEventListener("click", () => updateImageDisplay(0));
        previousTopButton.addEventListener("click", () => updateImageDisplay(currentIndex - 1));
        nextTopButton.addEventListener("click", () => updateImageDisplay(currentIndex + 1));
        lastTopButton.addEventListener("click", () => updateImageDisplay(images.length - 1));
        firstBotButton.addEventListener("click", () => updateImageDisplay(0));
        previousBotButton.addEventListener("click", () => updateImageDisplay(currentIndex - 1));
        nextBotButton.addEventListener("click", () => updateImageDisplay(currentIndex + 1));
        lastBotButton.addEventListener("click", () => updateImageDisplay(images.length - 1));
        topSelector.addEventListener("change", (e) => updateImageDisplay(Number(e.target.value)));
        bottomSelector.addEventListener("change", (e) => updateImageDisplay(Number(e.target.value)));
        updateImageDisplay(currentIndex);
    });
}

function displayComicImage(images, comicIndex, currentIndex) {
    const galleryDiv = document.getElementById(`comic-display-${comicIndex}`);
    const imageElement = galleryDiv.querySelector("img");

    if (images && images[currentIndex]) {
        const { Title, ImageUrl } = images[currentIndex];
        imageElement.src = ImageUrl;
        imageElement.alt = Title;
        ScrollToTop();
    } else {
        console.error(`Error fetching comic gallery for index ${comicIndex}: Image data is undefined.`);
    }
}