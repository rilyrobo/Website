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

    // Fetch limited gallery for the home page (e.g., 5 items)
    fetchGalleryData('https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/31357645/featured', '.gallery-grid-home', 5);

    // Fetch full gallery for the dedicated gallery page
    fetchGalleryData('https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/31357645/featured', '.gallery-grid-full');

    // Comic Fetching and Display Management
    function fetchComicData(endpoint, displaySelector, selectorPrefix) {
        fetch(endpoint)
            .then(response => response.text())
            .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
            .then(data => {
                const items = Array.from(data.querySelectorAll("item"));
                const comicsData = items.map((el, index) => {
                    const mediaContent = el.querySelectorAll("media\\:content, content");
                    let imageUrl = "";
                    mediaContent.forEach((media) => {
                        if (media.getAttribute("medium") === "image" && media.getAttribute("url")) {
                            imageUrl = media.getAttribute("url").replace("w_428,h_1864,q_70,strp", "w_1024,h_4452,q_80,strp");
                        }
                    });

                    return {
                        title: el.querySelector("title").textContent,
                        link: el.querySelector("link").textContent,
                        image: imageUrl,
                        index: index,
                    };
                });

                let currentIndex = 0;

                // Function to update the display
                function displayComic(index) {
                    if (index < 0 || index >= comicsData.length) return; // Prevent out-of-bounds errors
    
                    currentIndex = index;
                    const comic = comicsData[currentIndex];
    
                    const displayArea = document.querySelector(displaySelector);
                    if (displayArea) {
                        displayArea.innerHTML = `
                            <div style="text-align: center;">
                                <img src="${comic.image}" alt="${comic.title}" style="width: 100%; height: auto; object-fit: contain;">
                            </div>
                        `;
                    }
    
                    // Update navigation selectors
                    updateSelectors(currentIndex, comicsData.length);
                }

                // Function to populate dropdown selectors
                function populateSelectors() {
                    const selectors = document.querySelectorAll(`.${selectorPrefix}-comic-selector`);
                    selectors.forEach((selector) => {
                        selector.innerHTML = comicsData
                            .map(
                                (comic, index) => `<option value="${index}">${comic.title}</option>`
                            )
                            .join("");
                    });
                }

                // Function to update selectors
                function updateSelectors(currentIndex, totalCount) {
                    const selectors = document.querySelectorAll(`.${selectorPrefix}-comic-selector`);
                    selectors.forEach((selector) => {
                        selector.value = currentIndex;
                    });
                }

                // Attach navigation button events
                function attachNavigationListeners() {
                    document
                        .getElementById(`first-top-comic-${selectorPrefix}`)
                        .addEventListener("click", () => displayComic(0));
                    document
                        .getElementById(`previous-top-comic-${selectorPrefix}`)
                        .addEventListener("click", () => displayComic(currentIndex - 1));
                    document
                        .getElementById(`next-top-comic-${selectorPrefix}`)
                        .addEventListener("click", () => displayComic(currentIndex + 1));
                    document
                        .getElementById(`last-top-comic-${selectorPrefix}`)
                        .addEventListener("click", () => displayComic(comicsData.length - 1));

                    document
                        .getElementById(`first-bot-comic-${selectorPrefix}`)
                        .addEventListener("click", () => {
                            displayComic(0);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        });
                    document
                        .getElementById(`previous-bot-comic-${selectorPrefix}`)
                        .addEventListener("click", () => {
                            displayComic(currentIndex - 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        });
                    document
                        .getElementById(`next-bot-comic-${selectorPrefix}`)
                        .addEventListener("click", () => {
                            displayComic(currentIndex + 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        });
                    document
                        .getElementById(`last-bot-comic-${selectorPrefix}`)
                        .addEventListener("click", () => {
                            displayComic(comicsData.length - 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        });

                    // Dropdown change events
                    const selectors = document.querySelectorAll(`.${selectorPrefix}-comic-selector`);
                    selectors.forEach((selector) => {
                        selector.addEventListener("change", (e) => {
                            displayComic(Number(e.target.value));
                        });
                    });
                }

                // Initial setup
                populateSelectors();
                attachNavigationListeners();
                displayComic(0); // Display the first comic by default
            })
            .catch((error) => {
                console.error(`Error loading comics for ${displaySelector}:`, error);
                const errorMessage = document.querySelector(displaySelector);
                if (errorMessage) {
                    errorMessage.innerHTML =
                        "Failed to load comics. Please try again later.";
                    errorMessage.classList.add("error-message");
                }
            });
    }

    // Example: Fetch comic data and set up the page
    fetchComicData(
        "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/57218117/the-day-nobody-died",
        "#comic-display-1",
        "comic-1"
    );

    fetchComicData(
        "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/62710269/oct-the-one-year-journey",
        "#comic-display-2",
        "comic-2"
    );
    
    // Function to populate the dropdown menu
    function populateDropdown(dropdownSelector, comics) {
        const dropdownContent = document.querySelector(dropdownSelector);
        let html = '<a href="#comics" onclick="showPage(\'comics\')">Comics</a>';

        comics.forEach((comic) => {
            html += `<a href="#${comic.selectorPrefix}" onclick="showPage('${comic.selectorPrefix}')">${comic.selectorPrefix}</a>`;
        });

        dropdownContent.innerHTML = html;
    }

    // Gallery Fetching and Modal Management
    function fetchComicGalleryData(endpoint, gridSelector, dropdownSelector, selectorPrefix, limit = null) {
        fetch(endpoint)
            .then(response => response.text())
            .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
            .then(data => {
                const items = Array.from(data.querySelectorAll("item"));
                let html = '';
                const comics = [];

                // Limit the items if a limit is specified
                const displayedItems = limit ? items.slice(0, limit) : items;

                displayedItems.forEach((el, index) => {
                    const title = el.querySelector("title").textContent;
                    const link = el.querySelector("link").textContent;
                    const image = el.querySelector("media\\:content, content").getAttribute("url");

                    // Only display the first image of the comic
                    if (index === 0) {
                        html += `
                            <div class="comic-gallery-card grid-item" data-link="${link}" data-image="${image}" data-selector-prefix="${selectorPrefix}">
                                <a href="#${selectorPrefix}" onclick="showPage('${selectorPrefix}')">
                                    <img src="${image}" alt="${title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px;">
                                    <h4 style="color: #FFFFFF; margin-top: 10px; font-size: 1em;">${title}</h4>
                                </a>
                            </div>`;

                        // Add comic to the list for the dropdown
                        //comics.push({ title, selectorPrefix });
                    }
                });

                document.querySelector(gridSelector).innerHTML = html;

                // Populate the dropdown menu
                //populateDropdown(dropdownSelector, comics);

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

    // Example: Fetch gallery data and set up the page
    fetchComicGalleryData(
        "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/57218117/the-day-nobody-died",
        "#comic-gallery-grid-1",
        ".dropdown-content",
        "comic-1"
    );

    fetchComicGalleryData(
        "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/62710269/oct-the-one-year-journey",
        "#comic-gallery-grid-2",
        ".dropdown-content",
        "comic-2"
    );



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
