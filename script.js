document.addEventListener("DOMContentLoaded", () => {
    const videoIds = [
        'uQXPa-OcfFQ',
        'yaDXBP_9nLM',
        '9ufioUSRtWs',
        'HRU_q-m73IM',
        'OKIYQ-5k22I'
    ];
    let players = [];

    function initializeYouTubePlayers() {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe, index) => {
            const player = new YT.Player(iframe, {
                events: {
                    'onReady': () => {
                        players[index] = player;
                    }
                }
            });
        });
    }

    function stopVideos() {
        players.forEach(player => {
            if (player && player.pauseVideo) {
                player.pauseVideo();
            }
        });
    }
    function displayVideos(gridSelector, ids) {
        const videoGrid = document.querySelector(gridSelector);
        let html = '';

        ids.forEach(videoId => {
            html += `
                <div class="video-card">
                    <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                    <h4>Video Title</h4> <!-- Placeholder Title -->
                </div>`;
        });

        videoGrid.innerHTML = html;
    }

    displayVideos('.video-grid-home', videoIds.slice(0, 3));
    displayVideos('.video-grid-full', videoIds);
    function fetchGalleryData(endpoint, gridSelector, limit = null) {
        fetch(endpoint)
            .then(response => response.text())
            .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
            .then(data => {
                const items = Array.from(data.querySelectorAll("item"));
                let html = '';
                const displayedItems = limit ? items.slice(0, limit) : items;

                displayedItems.forEach(el => {
                    const title = el.querySelector("title").textContent;
                    const link = el.querySelector("link").textContent;
                    const image = el.querySelector("media\\:content, content").getAttribute("url");

                    html += `
                        <div class="gallery-card grid-item" data-link="${link}" data-image="${image}">
                            <img src="${image}" alt="${title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px;">
                            <h4 style="color: #FFFFFF; margin-top: 10px; font-size: 1em;">${title}</h4>
                        </div>`;
                });

                document.querySelector(gridSelector).innerHTML = html;
                attachModalListeners(gridSelector);
            })
            .catch(error => {
                console.error(`Error loading data for ${gridSelector}:`, error);
                const errorMessage = document.querySelector(gridSelector);
                errorMessage.innerHTML = 'Failed to load items. Please try again later.';
                errorMessage.classList.add('error-message');
            });
    }
    fetchGalleryData('https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/31357645/featured', '.gallery-grid-home', 5);
    fetchGalleryData('https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/31357645/featured', '.gallery-grid-full');
    function setupComics(comicsList) {
        const dropdownContent = document.querySelector(".dropdown-content");
        const comicsGrid = document.querySelector("#comics-grid");
        let dropdownHtml = `<a href="#comics" onclick="showPage('comics')">Comics</a>`;
        let gridHtml = '';

        comicsList.forEach((comic, index) => {
            dropdownHtml += `<a href="#comic-${comic.title}" onclick="showPage('comic-${comic.title}')">${comic.title}</a>`;
            gridHtml += `
                <div class="comic-preview" data-target="comic-${comic.title}">
                    <div class="comic-card">
                        <div class="comic-image-container">
                            <img src="" alt="${comic.title}" id="comic-preview-image-${index}" class="comic-image" style="width: 100%; height: auto;">
                        </div>
                        <h4>${comic.title}</h4>
                    </div>
                </div>`;

                fetchFirstComicImage(comic.url, `#comic-preview-image-${index}`);
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

    function fetchFirstComicImage(endpoint, imageSelector) {
        fetch(endpoint)
            .then(response => response.text())
            .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
            .then(data => {
                const firstItem = data.querySelector("item");
                if (firstItem) {
                    const imageUrl = firstItem.querySelector("media\\:content, content").getAttribute("url");
                    const imageElement = document.querySelector(imageSelector);
                    if (imageElement) {
                        imageElement.src = imageUrl;
                    }
                }
            })
            .catch(error => console.error(`Error fetching first image for ${endpoint}:`, error));
    }    
    
    function createComicPages(comicsList) {
        const mainContainer = document.querySelector("page");
    
        comicsList.forEach((comic, index) => {
            const comicPage = document.createElement("div");
            comicPage.id = `comic-${comic.title}`;
            comicPage.className = "page";
            comicPage.innerHTML = `
                <h2 style="text-align: center;">${comic.title}</h2>
                <div class="comics-container">
                    <div>
                        <button id="first-top-comic-${index}">First</button>
                        <button id="previous-top-comic-${index}">Previous</button>
                        <select id="comic-selector-${index}" class="comic-selector"></select>
                        <button id="next-top-comic-${index}">Next</button>
                        <button id="last-top-comic-${index}">Last</button>
                    </div>
                    <div id="comic-display-${index}" class="comic-display">
                        <img id="comic-image-${index}" src="" alt="${comic.title}" style="width: 100%; object-fit: contain; display: block; margin: auto;">
                    </div>
                    <div>
                        <button id="first-bot-comic-${index}">First</button>
                        <button id="previous-bot-comic-${index}">Previous</button>
                        <select id="comic-selector-bottom-${index}" class="comic-selector"></select>
                        <button id="next-bot-comic-${index}">Next</button>
                        <button id="last-bot-comic-${index}">Last</button>
                    </div>
                </div>
            `;
            mainContainer.appendChild(comicPage);
            fetchComicGallery(comic.url, index, comic.dimensions);
        });
    }

    function fetchComicGallery(endpoint, comicIndex, dimensions = null) {
        fetch(endpoint)
            .then(response => response.text())
            .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
            .then(data => {
                const items = Array.from(data.querySelectorAll("item"));
                const images = Array.from(items).map(el => {
                    const title = el.querySelector("title").textContent;
                    const link = el.querySelector("link").textContent;
                    let image = el.querySelector("media\\:content, content").getAttribute("url");
                    if (image.includes("fill/w_")) {
                        image = image.replace(/fill\/w_\d+,h_\d+,q_\d+/g, `fill/${dimensions}`);
                    }
    
                    return { title, link, image };
                });
    
                setupComicNavigation(images, comicIndex);
                displayComicImage(images, comicIndex, 0);
            })
            .catch((error) => console.error(`Error fetching comic gallery for index ${comicIndex}:`, error));
    }
    
    function setupComicNavigation(images, comicIndex) {
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
            option.textContent = image.title;
            topSelector.appendChild(option);
    
            const bottomOption = option.cloneNode(true);
            bottomSelector.appendChild(bottomOption);
        });
    
        let currentIndex = 0;
    
        const updateImageDisplay = (index) => {
            if (index >= 0 && index < images.length) {
                currentIndex = index;
                displayComicImage(images, comicIndex, currentIndex);
                topSelector.value = currentIndex;
                bottomSelector.value = currentIndex;
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
    }
    
    function displayComicImage(images, comicIndex, currentIndex) {
        const comicImage = document.getElementById(`comic-image-${comicIndex}`);
        const topSelector = document.getElementById(`comic-selector-${comicIndex}`);
        const bottomSelector = document.getElementById(`comic-selector-bottom-${comicIndex}`);
    
        const { image, title } = images[currentIndex];
        comicImage.src = image;
        if (topSelector) topSelector.value = currentIndex;
        if (bottomSelector) bottomSelector.value = currentIndex;
    }
    const comicsList = [
        { title: "The Day Nobody Died", url: "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/57218117/the-day-nobody-died", dimensions: "w_1024,h_1326,q_80" },
        { title: "The King and Guardian", url: "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/62710269/oct-the-one-year-journey", dimensions: "w_1024,h_4452,q_80" },
    ];

    setupComics(comicsList);
    createComicPages(comicsList);

    function attachModalListeners(gridSelector) {
        const galleryGrid = document.querySelector(gridSelector);
        const modal = document.getElementById("gallery-modal");
        const modalImage = document.getElementById("modal-image");
        const modalLink = document.getElementById("modal-link");

        galleryGrid.addEventListener("click", (e) => {
            const galleryCard = e.target.closest(".gallery-card");
            if (galleryCard) {
                const imageUrl = galleryCard.dataset.image;
                const deviantArtLink = galleryCard.dataset.link;

                modalImage.src = imageUrl;
                modalLink.href = deviantArtLink;
                modal.style.display = "flex";
            }      
        });
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });
    }
    
    function showPage(pageId) {
        console.log(`Navigating to: ${pageId}`);
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            if (page.id === pageId) {
                page.style.display = 'block';
                page.classList.add('active');
            } else {
                page.style.display = 'none';
                page.classList.remove('active');
            }
        });
        history.pushState(null, '', `#${pageId}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    document.querySelectorAll("nav a").forEach(link => {
        link.addEventListener("click", (e) => {
            const targetPage = e.target.getAttribute("href").substring(1);
            showPage(targetPage);
        });
    });
});