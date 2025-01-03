document.addEventListener("DOMContentLoaded", () => {
    // YouTube Video IDs and Player Management
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

    // Display YouTube Videos
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

    // Gallery Fetching and Modal Management
    function fetchGalleryData(endpoint, gridSelector, limit = null) {
        fetch(endpoint)
            .then(response => response.text())
            .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
            .then(data => {
                const items = Array.from(data.querySelectorAll("item"));
                let html = '';

                // Limit the items if a limit is specified
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

                // Attach modal functionality
                attachModalListeners(gridSelector);
            })
            .catch(error => {
                console.error(`Error loading data for ${gridSelector}:`, error);
                const errorMessage = document.querySelector(gridSelector);
                errorMessage.innerHTML = 'Failed to load items. Please try again later.';
                errorMessage.classList.add('error-message');
            });
    }

    // Social
    fetch('https://example.com/rss/twitter/Rilyrobo')
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
        const items = data.querySelectorAll("item");
        let html = "";
        items.forEach(item => {
            const title = item.querySelector("title").textContent;
            const link = item.querySelector("link").textContent;
            html += `<p><a href="${link}" target="_blank">${title}</a></p>`;
        });
        document.getElementById("twitter-feed").innerHTML = html;
    });



    // Fetch limited gallery for the home page (e.g., 5 items)
    fetchGalleryData('https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/31357645/featured', '.gallery-grid-home', 5);

    // Fetch full gallery for the dedicated gallery page
    fetchGalleryData('https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/31357645/featured', '.gallery-grid-full');

    // Populate dropdown and comics grid
    function setupComics(comicsList) {
        const dropdownContent = document.querySelector(".dropdown-content");
        const comicsGrid = document.querySelector("#comics-grid");
    
        let dropdownHtml = `<a href="#comics" onclick="showPage('comics')">Comics</a>`; // Add "Comics" as the first dropdown option
        let gridHtml = '';
    
        comicsList.forEach((comic, index) => {
            // Populate dropdown
            dropdownHtml += `<a href="#comic-${index}" onclick="showPage('comic-${index}')">${comic.title}</a>`;
    
            // Populate comics grid
            gridHtml += `
                <div class="comic-preview" onclick="showPage('comic-${index}')">
                    <div class="comic-card">
                        <div class="comic-image-container">
                            <img src="" alt="${comic.title}" id="comic-preview-image-${index}" class="comic-image" style="width: 100%; height: auto;">
                        </div>
                        <h4>${comic.title}</h4>
                    </div>
                </div>`;
    
            // Fetch the first image of the comic
            fetchGalleryData(comic.url, `#comic-preview-image-${index}`, 1);
        });
    
        dropdownContent.innerHTML = dropdownHtml;
        comicsGrid.innerHTML = gridHtml;
    }
    
    function createComicPages(comicsList) {
        const mainContainer = document.querySelector("page");
    
        comicsList.forEach((comic, index) => {
            const comicPage = document.createElement("div");
            comicPage.id = `comic-${index}`;
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
    
            // Fetch and display the comic gallery for this page
            fetchComicGallery(comic.url, index);
        });
    }
    function fetchComicGallery(endpoint, comicIndex) {
        fetch(endpoint)
            .then(response => response.text())
            .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
            .then(data => {
                const items = Array.from(data.querySelectorAll("item"));
                const images = items.map((el) => ({
                    title: el.querySelector("title").textContent,
                    link: el.querySelector("link").textContent,
                    image: el.querySelector("media\\:content, content").getAttribute("url"),
                }));
    
                setupComicNavigation(images, comicIndex);
                displayComicImage(images, comicIndex, 0); // Start with the first image
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
            bottomSelector.appendChild(option.cloneNode(true));
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
        const comicTitle = document.getElementById(`comic-title-${comicIndex}`);
    
        const { image, title } = images[currentIndex];
        comicImage.src = image;
        comicTitle.textContent = title;
    }         

    // List of comics with titles and gallery URLs
    const comicsList = [
        { title: "Comic 1", url: "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/57218117/the-day-nobody-died" },
        { title: "Comic 2", url: "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/62710269/oct-the-one-year-journey" },
        // Add more comics here
    ];

    setupComics(comicsList);
    createComicPages(comicsList);




    // Modal Functionality
    function attachModalListeners(gridSelector) {
        const galleryGrid = document.querySelector(gridSelector);
        const modal = document.getElementById("gallery-modal");
        const modalImage = document.getElementById("modal-image");
        const modalLink = document.getElementById("modal-link");

        galleryGrid.addEventListener("click", (e) => {
            const galleryCard = e.target.closest(".gallery-card");
            const comicGalleryCard = e.target.closest(".comic-gallery-card");
            if (galleryCard) {
                const imageUrl = galleryCard.dataset.image;
                const deviantArtLink = galleryCard.dataset.link;

                modalImage.src = imageUrl;
                modalLink.href = deviantArtLink;
                modal.style.display = "flex"; // Show modal
            }
            if (comicGalleryCard) {
                const selectorPrefix = comicGalleryCard.dataset.selectorPrefix;
                window.location.hash = `#${selectorPrefix}`;
                showPage(selectorPrefix);
            }       
        });

        // Close modal when clicking outside modal content
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.style.display = "none"; // Hide modal
            }
        });
    }


    // Page Switching
    function showPage(pageId) {
        stopVideos(); // Stop videos when switching pages
        const pages = document.querySelectorAll('.page');
        const activePage = document.querySelector('.page.active');

        if (activePage) {
            activePage.classList.remove('active');
            activePage.style.display = 'none';
        }

        const newPage = document.getElementById(pageId);
        newPage.style.display = 'block';
        newPage.classList.add('active');
    }

    // Attach to navigation
    document.querySelectorAll("nav a").forEach(link => {
        link.addEventListener("click", (e) => {
            const targetPage = e.target.getAttribute("href").substring(1);
            showPage(targetPage);
        });
    });
});
