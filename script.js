document.addEventListener("DOMContentLoaded", () => {
    const comicsList = [
        { title: "The Day Nobody Died", url: "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/57218117/the-day-nobody-died", dimensions: "w_1024,h_1326,q_80" },
        { title: "The King and Guardian", url: "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/62710269/oct-the-one-year-journey", dimensions: "w_1024,h_4452,q_80" },
    ];

    setupComics(comicsList);
    createComicPages(comicsList);
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
});

document.addEventListener("DOMContentLoaded", () => {
    const videoData = [
        { id: 'uQXPa-OcfFQ', title: 'Toy Story 2 ReAnimated - Scene 319' },
        { id: 'yaDXBP_9nLM', title: 'Rily Robinson Animation Demo Reel 2020' },
        { id: '9ufioUSRtWs', title: 'Demo Reel AGFVE Quarter 6' },
        { id: 'HRU_q-m73IM', title: 'Demo Reel AGFVE Quarter 1' },
        { id: 'OKIYQ-5k22I', title: 'Jester Reads : Darkness' }
    ];

    displayVideos('.video-grid-home', videoData.slice(0, 3));
    displayVideos('.video-grid-full', videoData);
});

document.addEventListener("DOMContentLoaded", () => {
    const galleryEndpoint = 'https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/31357645/featured';
    fetchGalleryData(galleryEndpoint, '.gallery-grid-home', 5);
    fetchGalleryData(galleryEndpoint, '.gallery-grid-full');
});

document.addEventListener("DOMContentLoaded", () => {
    const username = "RilyRobo";
    const platforms = [
        { name: "Twitter", url: `https://twitter.com/${username}`, icon: "https://img.icons8.com/?size=100&id=phOKFKYpe00C&format=png&color=ffffff" },
        { name: "Instagram", url: `https://instagram.com/${username}`, icon: "https://img.icons8.com/?size=100&id=32309&format=png&color=ffffff" },
        { name: "YouTube", url: `https://www.youtube.com/@${username}`, icon: "https://img.icons8.com/?size=100&id=37326&format=png&color=ffffff" },
        { name: "DeviantArt", url: `https://www.deviantart.com/${username}`, icon: "https://img.icons8.com/?size=100&id=38504&format=png&color=ffffff" },
        { name: "Newgrounds", url: `https://${username}.newgrounds.com`, icon: "https://static.wikia.nocookie.net/logopedia/images/2/2a/Newgrounds_2006.svg/revision/latest?cb=20231103140730" },
        { name: "Twitch", url: `https://www.twitch.tv/${username}`, icon: "https://img.icons8.com/?size=100&id=18104&format=png&color=ffffff" },
        { name: "Picarto", url: `https://picarto.tv/${username}`, icon: "https://img.icons8.com/?size=100&id=6byL4WgkpyPg&format=png&color=ffffff" },
        { name: "Patreon", url: `https://www.patreon.com/c/${username}`, icon: "https://img.icons8.com/?size=100&id=tIshI0hyXw3f&format=png&color=ffffff" },
        { name: "Subscribestar", url: `https://www.subscribestar.com/${username}`, icon: "https://img.icons8.com/?size=100&id=7856&format=png&color=ffffff" },
        { name: "BuyMeACoffee", url: `https://www.buymeacoffee.com/${username}`, icon: "https://img.icons8.com/?size=100&id=8342&format=png&color=ffffff" },
    ];

    const socialMediasContainers = document.querySelectorAll(".social-media");

    if (socialMediasContainers.length === 0) {
        console.error("No containers with class 'social-media' found.");
        return;
    }

    socialMediasContainers.forEach(container => {
        platforms.forEach(platform => {
            const link = document.createElement("a");
            link.href = platform.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.addEventListener("click", (e) => e.stopPropagation());

            const img = document.createElement("img");
            img.src = platform.icon;
            img.alt = platform.name;
            img.style.width = "24px";
            img.style.height = "24px";
            img.style.margin = "0 8px";

            if (container.classList.contains("social-media-icon")) {
                link.appendChild(img);
            } else {
                link.innerHTML = `${platform.name}`;
                link.style.display = "block";
                link.style.marginBottom = "10px";
                link.style.textDecoration = "none";
                link.style.color = "#660000";
                link.style.fontSize = "16px";
                link.insertBefore(img, link.firstChild);
            }

            container.appendChild(link);
        });
    });
});

function displayVideos(gridSelector, videos) {
    const videoGrid = document.querySelector(gridSelector);
    let html = '';

    videos.forEach(video => {
        html += `
            <div class="video-card">
                <iframe src="https://www.youtube.com/embed/${video.id}" frameborder="0" allowfullscreen></iframe>
                <h4>${video.title}</h4>
            </div>`;
    });

    videoGrid.innerHTML = html;
}   

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

function setupComics(comicsList) {
    const dropdownContent = document.querySelector(".dropdown-content");
    const comicsGrid = document.querySelector("#comics-grid");

    let dropdownHtml = `<a href="#comics" onclick="showPage('comics')">Comics</a>`;
    let gridHtml = '';

    comicsList.forEach((comic, index) => {
        const urlFriendlyTitle = comic.title.replace(/\s+/g, '-');
        dropdownHtml += `<a href="#comic-${urlFriendlyTitle}" onclick="showPage('comic-${urlFriendlyTitle}')">${comic.title}</a>`;
        gridHtml += `
            <div class="comic-preview" data-target="comic-${urlFriendlyTitle}">
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

function fetchComicGallery(endpoint, comicIndex, dimensions = null, targetPage = 0) {
    fetch(endpoint)
        .then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(data => {
            const items = Array.from(data.querySelectorAll("item"));
            const images = items.map(el => {
                const title = el.querySelector("title").textContent;
                const link = el.querySelector("link").textContent;
                let image = el.querySelector("media\\:content, content").getAttribute("url");
                if (image.includes("fill/w_")) {
                    image = image.replace(/fill\/w_\d+,h_\d+,q_\d+/g, `fill/${dimensions}`);
                }
                return { title, link, image };
            });

            setupComicNavigation(images, comicIndex);
            const validPageIndex = Math.max(0, Math.min(targetPage, images.length - 1));
            displayComicImage(images, comicIndex, validPageIndex);
        })
        .catch(error => console.error(`Error fetching comic gallery for index ${comicIndex}:`, error));
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
            const comicId = `comic-${comicsList[comicIndex].title.replace(/\s+/g, '-')}`;
            const pageNumber = currentIndex + 1;
            history.replaceState(null, '', `#${comicId}-page-${pageNumber}`);
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
}

function displayComicImage(images, comicIndex, currentIndex) {
    const comicImage = document.getElementById(`comic-image-${comicIndex}`);
    const topSelector = document.getElementById(`comic-selector-${comicIndex}`);
    const bottomSelector = document.getElementById(`comic-selector-bottom-${comicIndex}`);

    const { image, title } = images[currentIndex];
    comicImage.src = image;
    comicImage.alt = title;

    if (topSelector) topSelector.value = currentIndex;
    if (bottomSelector) bottomSelector.value = currentIndex;
    const comicTitle = comicsList[comicIndex].title.replace(/\s+/g, '-');
    history.replaceState(null, '', `#comic-${comicTitle}-page-${currentIndex + 1}`);
}

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
    const [comicId] = pageId.split('-page-');
    console.log(`Navigating to: ${pageId}`);
    const pages = document.querySelectorAll('.page');

    pages.forEach(page => {
        if (page.id === comicId) {
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

function handleHashChange() {
    const hash = window.location.hash.substring(1);

    if (!hash) {
        showPage('home');
        return;
    }

    const [comicHash, pageHash] = hash.split('-page-');
    if (comicHash.startsWith('comic-')) {
        const comicTitle = comicHash.replace('comic-', '').replace(/-/g, ' ');
        const comicIndex = comicsList.findIndex(comic => comic.title === comicTitle);

        if (comicIndex !== -1) {
            const pageIndex = pageHash ? parseInt(pageHash, 10) - 1 : 0;
            fetchComicGallery(
                comicsList[comicIndex].url,
                comicIndex,
                comicsList[comicIndex].dimensions,
                pageIndex
            );
            return;
        }
    }

    showPage(hash);
}
window.addEventListener('hashchange', handleHashChange);

document.querySelectorAll("nav a").forEach(link => {
    if (link.href.startsWith("http")) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
    } else {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute("href").substring(1);
            showPage(targetPage);
        });
    }
});

document.querySelectorAll(".example-image").forEach(img => {
    img.addEventListener("click", () => {
        const modal = document.getElementById("example-image-modal");
        const modalImg = document.getElementById("example-image-modal-img");

        modalImg.src = img.src;
        modal.style.display = "flex";
    });
});
document.getElementById("example-image-modal").addEventListener("click", (e) => {
    if (e.target.id === "example-image-modal") {
        e.target.style.display = "none";
    }
});
    
document.querySelectorAll("nav a:not([href^='http'])").forEach(link => {
    link.addEventListener("click", (e) => { e.preventDefault();
        const targetPage = e.target.getAttribute("href").substring(1);
        showPage(targetPage);
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const myGames = [
        {
            title: "Game Title 1",
            image: "path-to-image1.jpg",
            description: "Brief description of the game you made.",
            link: "https://example.com/game1",
        },
        {
            title: "Game Title 2",
            image: "path-to-image2.jpg",
            description: "Brief description of another game you made.",
            link: "https://example.com/game2",
        },
    ];
    const contributedGames = [
        {
            title: "Contributed Game 1",
            image: "path-to-image3.jpg",
            description: "Brief description of your role in the project.",
            link: "https://example.com/contributed1",
        },
        {
            title: "Contributed Game 2",
            image: "path-to-image4.jpg",
            description: "Another game you contributed to.",
            link: "https://example.com/contributed2",
        },
    ];
    populateGamesGrid(myGames, document.getElementById("my-games-grid"));
    populateGamesGrid(contributedGames, document.getElementById("contributed-games-grid"));
});

function populateGamesGrid(games, gridElement) {
    games.forEach((game) => {
        const gameCard = document.createElement("div");
        gameCard.className = "game-card";

        gameCard.innerHTML = `
            <img src="${game.image}" alt="${game.title}" class="game-image">
            <h3>${game.title}</h3>
            <p>${game.description}</p>
            <a href="${game.link}" target="_blank" class="button">Learn More</a>
        `;

        gridElement.appendChild(gameCard);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const gumroadContainer = document.querySelector(".gumroad-container");
    const products = [
        {
            name: 'Mug "Normal People Scare Me" Multi-Texture',
            url: "https://rilyrobo.gumroad.com/l/vgOAs",
            image: "https://public-files.gumroad.com/tvi9ex2o1aa8uuoe00ebnefau9ly",
            price: "0.00"
        },
        {
            name: "Chair Red",
            url: "https://rilyrobo.gumroad.com/l/SlPZX",
            image: "https://public-files.gumroad.com/1f9f8ym196ip1idjk1k76pjucmud",
            price: "3.00"
        },
        {
            name: "Shark Chair",
            url: "https://rilyrobo.gumroad.com/l/gAVxf",
            image: "https://public-files.gumroad.com/milkiilabcpb1sbxjv1g2b9dx2ac",
            price: "3.00"
        },
        {
            name: "Metal Chair 4 Texture",
            url: "https://rilyrobo.gumroad.com/l/ZoHSP",
            image: "https://public-files.gumroad.com/fmw9aaojloo4o56m7z2ecdmt1vmz",
            price: "3.00"
        },
        {
            name: "Wood Barrel 3 Colours, Open, Closed",
            url: "https://rilyrobo.gumroad.com/l/DzXMGm",
            image: "https://public-files.gumroad.com/xw3d89gwsc1v89jdnqy80r3ts0n2",
            price: "3.00"
        }
    ];

    products.forEach(product => {
        const item = document.createElement("div");
        item.classList.add("gumroad-item");

        item.innerHTML = `
            <a href="${product.url}" target="_blank">
                <img src="${product.image}" alt="${product.name}">
                <h4>${product.name}</h4>
                <h4>${product.price} CAD</h4>
            </a>
        `;

        gumroadContainer.appendChild(item);
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const teespringIframe = document.getElementById("teespring-iframe");
    const gumroadIframe = document.getElementById("gumroad-iframe");
    const twitterIframe = document.getElementById("twitter-iframe");

    if (teespringIframe) {
        teespringIframe.src = "https://my-store-c7ca26-2.creator-spring.com";
    }
    if (gumroadIframe) {
        gumroadIframe.src = "https://gumroad.com/rilyrobo";
    }
    if (twitterIframe) {
        twitterIframe.src = "https://twitframe.com/show?url=https%3A%2F%2Fx.com%2FRilyrobo";
    }
});