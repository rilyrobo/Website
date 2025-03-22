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
    const galleryData = [
        {url: 'https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/31357645/featured', title: 'Featured', icon: 'images/nav_icon_Work.gif', description: 'A collection of my latest work'},
        {url: 'https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/96210416/2d-art', title: '2D Art', icon: 'images/nav_icon_Work.gif', description: 'A collection of my 2D artwork'},
        {url: 'https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/96210354/3d-art', title: '3D Art', icon: 'images/nav_icon_Work.gif', description: 'A collection of my 3D artwork'},
        {url: 'https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/57218144/reference-images', title: 'Character Design', icon: 'images/nav_icon_Work.gif', description: 'A collection of my character designs'},
    ];
    
    fetchGalleryData(galleryData[0], '.gallery-grid-home', 5);
    fetchGalleryData(galleryData[0], '.gallery-grid-full');
    setupGalleries(galleryData);
});

document.addEventListener("DOMContentLoaded", () => {
    const username = "RilyRobo";
    const platforms = [
        { name: "Twitter", url: `https://twitter.com/${username}`, icon: "https://img.icons8.com/?size=100&id=phOKFKYpe00C&format=png&color=ffffff" , color: "#1A91DA" },
        { name: "Instagram", url: `https://instagram.com/${username}`, icon: "https://img.icons8.com/?size=100&id=32309&format=png&color=ffffff" , color: "#C13584" },
        { name: "YouTube", url: `https://www.youtube.com/@${username}`, icon: "https://img.icons8.com/?size=100&id=37326&format=png&color=ffffff" , color: "#CC0000" },
        { name: "DeviantArt", url: `https://www.deviantart.com/${username}`, icon: "https://img.icons8.com/?size=100&id=38504&format=png&color=ffffff" , color: "#04A045" },
        { name: "Artstation", url: `https://www.artstation.com/${username}`, icon: "https://img.icons8.com/?size=100&id=pB77uEobJRjy&format=png&color=ffffff" , color: "#42A5F5FF" },
        { name: "Newgrounds", url: `https://${username}.newgrounds.com`, icon: "https://img.icons8.com/?size=100&id=15771&format=png&color=ffffff" , color: "#E6B800" },
        { name: "Twitch", url: `https://www.twitch.tv/${username}`, icon: "https://img.icons8.com/?size=100&id=18104&format=png&color=ffffff" , color: "#772CE8" },
        { name: "Picarto", url: `https://picarto.tv/${username}`, icon: "https://img.icons8.com/?size=100&id=6byL4WgkpyPg&format=png&color=ffffff" , color: "#00CC00" },
        { name: "Patreon", url: `https://www.patreon.com/c/${username}`, icon: "https://img.icons8.com/?size=100&id=tIshI0hyXw3f&format=png&color=ffffff" , color: "#E36254" },
        { name: "Subscribestar", url: `https://www.subscribestar.com/${username}`, icon: "https://img.icons8.com/?size=100&id=7856&format=png&color=ffffff" , color: "#E6B800" },
        { name: "Ko-fi", url: `https://www.ko-fi.com/${username}`, icon: "https://img.icons8.com/?size=100&id=8342&format=png&color=ffffff" , color: "#E6C200" },
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

            const imgStart = document.createElement("img");
            imgStart.src = platform.icon;
            imgStart.alt = platform.name;
            imgStart.classList.add("social-icon");

            const imgEnd = imgStart.cloneNode(true);

            if (container.classList.contains("social-media-icon")) {
                link.appendChild(imgStart);
            } else {
                link.innerHTML = `<strong>${platform.name}</strong>`;
                link.style.display = "flex";
                link.style.alignItems = "center";
                link.style.justifyContent = "space-between";
                link.style.marginBottom = "10px";
                link.style.textDecoration = "none";
                link.style.color = "#ffffff";
                link.style.fontSize = "16px";
                link.style.backgroundColor = platform.color;
                link.style.padding = "5px 10px";
                link.style.borderRadius = "8px";
                link.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
                link.insertBefore(imgStart, link.firstChild);
                link.appendChild(imgEnd);
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
    fetch(endpoint.url)
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
                    <div class="gallery-card gallery-deviantart grid-item" data-link="${link}" data-image="${image}">
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

function fetchArtStationData(endpoint, gridSelector, limit = null) {
    fetch(endpoint.url)
        .then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(data => {
            const items = Array.from(data.querySelectorAll("item"));
            let html = '';
            const displayedItems = limit ? items.slice(0, limit) : items;

            displayedItems.forEach(el => {
                const title = el.querySelector("title").textContent;
                const link = el.querySelector("link").textContent;
                const image = el.querySelector("media\\:thumbnail, thumbnail").getAttribute("url");

                html += `
                    <div class="gallery-card gallery-artstation grid-item" data-link="${link}" data-image="${image}">
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

function setupGalleries(galleryData) {
    const dropdownContent = document.querySelector(".dropdown-content-gallery");
    const mainContainer = document.querySelector('page');

    let dropdownHtml = '';

    galleryData.slice(1).forEach((gallery) => {
        const urlFriendlyTitle = gallery.title.replace(/\s+/g, '-');
        dropdownHtml += `
            <div class="dropdown-item">
                <a href="#gallery-${urlFriendlyTitle}" onclick="showPage('gallery-${urlFriendlyTitle}')">${gallery.title}</a>
                <div class="nav-hover-image-dropdown" style="background: url('${gallery.icon}') center/cover no-repeat;"></div>
            </div>`;

        const galleryPage = document.createElement('div');
        galleryPage.id = `gallery-${gallery.title.replace(/\s+/g, '-')}`;
        galleryPage.className = 'page';

        if (gallery.title === 'ArtStation') {
            galleryPage.innerHTML = `
                <h2 class="center-text">${gallery.title}</h2>
                <p class="center-text">${gallery.description}</p>
                <div class="gallery-grid gallery-grid-${urlFriendlyTitle}">
                    <!-- Artwork thumbnails will be inserted dynamically -->
                </div>
                <div class="button-container">
                    <a href="https://www.artstation.com/RilyRobo" target="_blank" rel="noopener noreferrer" class="button artstation-button">
                        More on Artstation
                    </a>
                </div>`;
            mainContainer.appendChild(galleryPage);

            fetchArtStationData(gallery, `.gallery-grid-${urlFriendlyTitle}`);
        }
        else 
        {
            galleryPage.innerHTML = `
                <h2 class="center-text">${gallery.title}</h2>
                <p class="center-text">${gallery.description}</p>
                <div class="gallery-grid gallery-grid-${urlFriendlyTitle}">
                    <!-- Artwork thumbnails will be inserted dynamically -->
                </div>
                <div class="button-container">
                    <a href="https://www.deviantart.com/RilyRobo" target="_blank" rel="noopener noreferrer" class="button deviantart-button">
                        More on DeviantArt
                    </a>
                </div>`;
            mainContainer.appendChild(galleryPage);

            fetchGalleryData(gallery, `.gallery-grid-${urlFriendlyTitle}`);
        }
    });

    dropdownContent.innerHTML = dropdownHtml;
    const galleryPreviews = document.querySelectorAll(".gallery-preview");
    galleryPreviews.forEach(preview => {
        preview.addEventListener("click", () => {
            const target = preview.getAttribute("data-target");
            showPage(target);
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const comicsList = [
        { title: "The Day Nobody Died", file: "comics/day-nobody-died.csv", icon: "images/comic_icon_The-Day-Nobody-Died.ico" },
        { title: "The King and Guardian", file: "comics/king-and-guardian.csv", icon: "images/comic_icon_The-King-and-Guardian.ico" },
    ];

    setupComics(comicsList);
    createComicPages(comicsList);
    if (!window.location.hash) {
        history.replaceState(null, '', '#home');
    }
});

document.addEventListener("DOMContentLoaded", () => {
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
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
    } else {
        console.error(`Error fetching comic gallery for index ${comicIndex}: Image data is undefined.`);
    }
}

function handleHashChange() {
    const hash = window.location.hash.substring(1);

    if (!hash) {
        showPage('home');
        history.replaceState(null, '', '#home');
        return;
    }

    const [comicHash, pageHash] = hash.split('-page-');
    if (comicHash.startsWith('comic-')) {
        const comicTitle = comicHash.replace('comic-', '').replace(/-/g, ' ');
        const comicIndex = comicsList.findIndex(comic => comic.title === comicTitle);

        if (comicIndex !== -1) {
            const pageIndex = pageHash ? parseInt(pageHash, 10) - 1 : 0;
            loadCSV(comicsList[comicIndex].file, (images) => {
                displayComicImage(images, comicIndex, pageIndex);
                setupComicNavigation(comicsList[comicIndex], comicIndex);
                showPage(`comic-${comicTitle.replace(/\s+/g, '-')}`);
                history.replaceState(null, '', `#comic-${comicTitle.replace(/\s+/g, '-')}${pageHash ? `-page-${pageIndex + 1}` : ''}`);
            });
        }
        return;
    }

    showPage(hash);
}

window.addEventListener('hashchange', handleHashChange);

document.querySelectorAll("nav a").forEach(link => {
    if (link.href.startsWith("http")) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
    }
});

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
    
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.remove('show');

    history.pushState(null, '', `#${pageId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
    
document.querySelectorAll("nav a:not([href^='http'])").forEach(link => {
    link.addEventListener("click", (e) => { e.preventDefault();
        const targetPage = e.target.getAttribute("href").substring(1);
        showPage(targetPage);
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const myGames = [
        {
            title: "Unnamed Game Project",
            image: "images/game_projectt.jpg",
            description: "2013 A horror game project that was never completed. The game was to be a 2D gamemaker 8 engine horror, adventure game with a focus on story and atmosphere. The player would explore a world overtaken by monsters and fleshy masses with pills to swap between the apocolyptic world and a modern world with the ability to by pass threats and puzzles by changing worlds.",
            links: [
                
            ]
        },
        {
            title: "Secured Maze",
            image: "images/game_securedmaze.jpg",
            description: "2016 The Secured Maze was a 2.5D gamemaker 8 engine horror game, the player would travel through mazes gathering keys to open gates to find elevators to travel deeper.The players own sense would betray them as some monsters would rely on the players use of hearing and sight to track them down, requiring the player to block these sense and struggle to make it through the mazes",
            links: [
                
            ]
        },
        {
            title: "VRChat Retro Game Recreation",
            image: "images/game_arcaderecreation.jpg",
            description: "2023- An on-going project to create immersive retro arcade game cabinent assets and standalone games for use in VRChat. With various gameplay styles such as space invaders, arcanoid / block breaker, pong, snake, and more.",
            links: [
                { name: "Circus", url: "https://vrchat.com/home/launch?worldId=wrld_62530ca6-fbec-4b70-b249-7b79cc38d825" },
                { name: "Arcade", url: "https://vrchat.com/home/launch?worldId=wrld_5de8a59e-2c93-4ec4-a380-b5030310c76a" },
                { name: "Whack-A-Jack", url: "https://vrchat.com/home/launch?worldId=wrld_4855b5fb-a007-419c-9756-b57a16df7dd1" },
            ]
        },
    ];
    const contributedGames = [
        {
            title: "Insert Paper",
            image: "images/game_insertpaper.jpg",
            description: "2017 Before any professional training I joined the group Startreming for a short while. I did character modeling, UV unwrapping, texturing, rigging and test animating those characters",
            links: [
                { name: "Steam", url: "https://store.steampowered.com/app/661490/Insert_Paper/" }
            ]
        },
        {
            title: "CRITICAL MASS EPISODE I",
            image: "images/game_criticalmass.jpg",
            description: "2021-2023 As a Technical Animator, I was responsible for rigging characters and props, creating placeholder animations, and I animated some background assets. My contributions ensured smooth and realistic movement were possible, enhancing the overall visual experience of the game.",
            links: [
                { name: "Website", url: "https://www.arcadiagameworks.com/games" },
                { name: "YouTube", url: "https://www.youtube.com/channel/UCpreE7v8PZ41TifVkk-J04g" },
                { name: "Instagram", url: "https://www.instagram.com/arcadiagameworks/" }
            ]
        },
        {
            title: "NDA",
            image: "images/placeholder.jpg",
            description: "2022-2024 A work in progress game project that is currently in development. More information will be available.",
            links: [
                
            ]
        },
    ];
    populateGamesGrid(myGames, document.getElementById("my-games-grid"));
    populateGamesGrid(contributedGames, document.getElementById("contributed-games-grid"));
});

function populateGamesGrid(games, gridElement) {
    games.forEach((game) => {
        const gameCard = document.createElement("div");
        gameCard.className = "game-card";

        const linksHTML = game.links.map(link => `<a href="${link.url}" target="_blank" class="button">${link.name}</a>`).join(" ");

        gameCard.innerHTML = `
            <img src="${game.image}" alt="${game.title}" class="game-image">
            <h3>${game.title}</h3>
            <p>${game.description}</p>
            ${linksHTML}
        `;

        gridElement.appendChild(gameCard);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const teespringIframe = document.getElementById("teespring-iframe");
    const gumroadIframe = document.getElementById("gumroad-iframe");

    if (teespringIframe) {
        teespringIframe.src = "https://my-store-c7ca26-2.creator-spring.com";
    }
    if (gumroadIframe) {
        gumroadIframe.src = "https://gumroad.com/rilyrobo";
    }
});

const prices = {
    "2d": {
        sketch: { portrait: 8, upperhalf: 10, fullbody: 12 },
        lineart: { portrait: 12, upperhalf: 14, fullbody: 16 },
        flatcolors: { portrait: 16, upperhalf: 18, fullbody: 20 },
        shading: { portrait: 20, upperhalf: 22, fullbody: 24 },
        background: {
            colourgradient: 0,
            splashfilterphoto: 20,
            vagueenvironment: 40,
            detailedtargetmidground: 60,
            detailedbackground: 150
        },
        additionalMultiplier: 0.5
    },
    "3d": {
        lowpoly: { low: 150, high: 225 },
        midpoly: { low: 225, high: 300 },
        highpoly: { low: 300, high: 500 },
        staticprop: { low: 30, high: 50 },
        dynamicprop: { low: 50, high: 100 },
        kitbashchar: { low: 75, high: 150 },
        kitbashprop: { low: 75, high: 100 },
        viseme: 10,
    },
    "avatar": {
        fromScratch: { lowpoly: 150, midpoly: 225, highpoly: 300 },
        kitbashing: { low: 75, high: 200 },
        customClothing: { low: 30, high: 100 },
        hairstyle: { low: 30, high: 100 },
        texturing: { low: 30, high: 100 },
        expressions: { low: 10, high: 50 },
        rigging: { low: 30, high: 100 },
        fbtOptimization: { low: 30, high: 100 },
        optimization: { low: 30, high: 100 }
    },
    "vrchat": {
        dynamicBones: { low: 10, high: 50 },
        animations: { low: 10, high: 50 },
        toggleSetups: { low: 10, high: 50 },
        shaders: { low: 30, high: 100 },
        questConversion: { low: 50, high: 150 },
        customEffects: { low: 10, high: 100 }
    },
    "conversion": {
        vtuber: { low: 50, high: 200 },
        retargeting: { low: 30, high: 100 },
        faceTracking: { low: 75, high: 300 }
    },
    "additional": {
        rushOrder: 0.25,
        commercialUse: 0.5,
        nsfw: 0.2,
        tax: 0.15,
        additionalEdits: 10
    }
};

document.addEventListener("DOMContentLoaded", () => {
    function setPrices(prices) {
        const setText = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = `${value}`;
            }
        };

        // 2D Artwork
        setText('2d-sketch-portrait', `$${prices["2d"].sketch.portrait}`);
        setText('2d-sketch-upperhalf', `$${prices["2d"].sketch.upperhalf}`);
        setText('2d-sketch-fullbody', `$${prices["2d"].sketch.fullbody}`);
        setText('2d-lineart-portrait', `$${prices["2d"].lineart.portrait}`);
        setText('2d-lineart-upperhalf', `$${prices["2d"].lineart.upperhalf}`);
        setText('2d-lineart-fullbody', `$${prices["2d"].lineart.fullbody}`);
        setText('2d-flatcolors-portrait', `$${prices["2d"].flatcolors.portrait}`);
        setText('2d-flatcolors-upperhalf', `$${prices["2d"].flatcolors.upperhalf}`);
        setText('2d-flatcolors-fullbody', `$${prices["2d"].flatcolors.fullbody}`);
        setText('2d-shading-portrait', `$${prices["2d"].shading.portrait}`);
        setText('2d-shading-upperhalf', `$${prices["2d"].shading.upperhalf}`);
        setText('2d-shading-fullbody', `$${prices["2d"].shading.fullbody}`);

        // Backgrounds
        setText('2d-background-colourgradient', `$${prices["2d"].background.colourgradient}`);
        setText('2d-background-detailedbackground', `$${prices["2d"].background.detailedbackground}`);

        // 3D Artwork
        setText('3d-lowpoly', `$${prices["3d"].lowpoly.low} - $${prices["3d"].lowpoly.high}`);
        setText('3d-midpoly', `$${prices["3d"].midpoly.low} - $${prices["3d"].midpoly.high}`);
        setText('3d-highpoly', `$${prices["3d"].highpoly.low} - $${prices["3d"].highpoly.high}+`);
        setText('3d-staticprop', `$${prices["3d"].staticprop.low} - $${prices["3d"].staticprop.high}`);
        setText('3d-dynamicprop', `$${prices["3d"].dynamicprop.low} - $${prices["3d"].dynamicprop.high}`);
        setText('3d-kitbashchar', `$${prices["3d"].kitbashchar.low} - $${prices["3d"].kitbashchar.high}`);
        setText('3d-kitbashprop', `$${prices["3d"].kitbashprop.low} - $${prices["3d"].kitbashprop.high}`);
        setText('3d-viseme', `$${prices["3d"].viseme}`);

        // VRChat Avatars
        setText('avatar-fromScratch', `$${prices["avatar"].fromScratch.lowpoly} - $${prices["avatar"].fromScratch.highpoly}+`);
        setText('avatar-kitbashing', `$${prices["avatar"].kitbashing.low} - $${prices["avatar"].kitbashing.high}+`);
        setText('avatar-customClothing', `$${prices["avatar"].customClothing.low} - $${prices["avatar"].customClothing.high}`);
        setText('avatar-texturing', `$${prices["avatar"].texturing.low} - $${prices["avatar"].texturing.high}`);
        setText('avatar-expressions', `$${prices["avatar"].expressions.low} - $${prices["avatar"].expressions.high}`);
        setText('avatar-rigging', `$${prices["avatar"].rigging.low} - $${prices["avatar"].rigging.high}`);

        // VRChat Extras
        setText('vrchat-dynamicBones', `$${prices["vrchat"].dynamicBones.low} - $${prices["vrchat"].dynamicBones.high}`);
        setText('vrchat-animations', `$${prices["vrchat"].animations.low} - $${prices["vrchat"].animations.high}`);
        setText('vrchat-toggleSetups', `$${prices["vrchat"].toggleSetups.low} - $${prices["vrchat"].toggleSetups.high}`);
        setText('vrchat-questConversion', `$${prices["vrchat"].questConversion.low} - $${prices["vrchat"].questConversion.high}`);
        setText('vrchat-customEffects', `$${prices["vrchat"].customEffects.low} - $${prices["vrchat"].customEffects.high}`);

        // Game & VTuber Conversion
        setText('conversion-vtuber', `$${prices["conversion"].vtuber.low} - $${prices["conversion"].vtuber.high}`);
        setText('conversion-retargeting', `$${prices["conversion"].retargeting.low} - $${prices["conversion"].retargeting.high}`);
        setText('conversion-faceTracking', `$${prices["conversion"].faceTracking.low} - $${prices["conversion"].faceTracking.high}`);

        // Additional Costs
        setText('2d-adition-character', `${prices["2d"].additionalMultiplier * 100}%`);
        setText('additional-rushOrder', `${prices["additional"].rushOrder * 100}%`);
        setText('additional-commercialUse', `${prices["additional"].commercialUse * 100}%`);
        setText('additional-nsfw2d', `${prices["additional"].nsfw * 100}%`);
        setText('additional-nsfw3d', `${prices["additional"].nsfw * 100}%`);
        setText('additional-nsfw', `${prices["additional"].nsfw * 100}%`);
        setText('additional-edits', `$${prices["additional"].additionalEdits}`);

        const setMax = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.max = value;
            }
        };

        setMax('background-complexity', prices["2d"].background.detailedbackground);
        setMax('complexity', prices["3d"].highpoly.high);
        setMax('texturing', prices["avatar"].texturing.high);
        setMax('clothing-complexity', prices["avatar"].customClothing.high);
        setMax('rigging-complexity', prices["avatar"].rigging.high);
        setMax('dynamic-bones', prices["vrchat"].dynamicBones.high);
        setMax('props-complexity', prices["3d"].dynamicprop.high);
    }

    setPrices(prices);
});document.addEventListener("DOMContentLoaded", () => {
    updateOptions();
});

function updateOptions() {
    const type = document.getElementById('type').value;
    document.getElementById('2d-options').style.display = type === '2d' ? 'block' : 'none';
    document.getElementById('3d-options').style.display = type === '3d' ? 'block' : 'none';
}

// Update background pricing
function update2dBackgroundComplexityValue() {
    const complexity = document.getElementById('background-complexity').value;
    document.getElementById('background-complexity-value').textContent = `$${complexity}`;
    document.getElementById('background-comment').textContent = 
        complexity == 0 ? 'No Background or just a Gradient' : 
        complexity <= prices["2d"].background.splashfilterphoto ? 'Simple Background: Minimal details or abstract elements, such as gradients, patterns, or a single color.' : 
        complexity <= prices["2d"].background.vagueenvironment ? 'Vague Environment: General shapes and light details suggest an environment without specific or intricate elements.' : 
        complexity <= prices["2d"].background.detailedtargetmidground ? 'Detailed Midground: Richly developed central focus with defined objects or scenery, providing clear context for the subject.' : 
        'Full Detailed Background: Highly elaborate and immersive environment, with intricate details from the foreground to the distant background.';
}

// Update 3D complexity values
function updateComplexityValue() {
    const complexity = document.getElementById('complexity').value;
    document.getElementById('complexity-value').textContent = `$${complexity}`;
    document.getElementById('complexity-comment').textContent = 
        complexity == 0 ? 'No model' : 
        complexity <= prices["3d"].lowpoly.high ? 'Low-Poly Model (3-5k Tris): Simplified geometry for efficiency, often used in mobile games or distant objects.' : 
        complexity <= prices["3d"].midpoly.high ? 'Mid-Poly Model (10-20k Tris): Balanced detail suitable for most in-game characters and environments.' : 
        'High-Poly Model (50k+ Tris): High-detail geometry for realism, used in cinematics or close-up renders.';
}

// Update Sliders and Inputs
function updateClothingComplexityValue() {
    const complexity = document.getElementById('clothing-complexity').value;
    document.getElementById('clothing-complexity-value').textContent = `$${complexity}`;
    document.getElementById('clothing-comment').textContent = 
        complexity == 0 ? 'No Clothing' : 
        complexity <= prices["avatar"].customClothing.low ? 'Basic Clothing: Simple garments with minimal detail, like plain shirts or pants.' : 
        complexity <= prices["avatar"].customClothing.high-1 ? 'Intermediate Clothing: Moderately detailed garments, incorporating folds, seams.' : 
        'High-Quality Clothing: Highly intricate details, such as realistic fabric textures, stitching, and dynamic folds.';
}

function updateDynamicBonesValue() {
    const complexity = document.getElementById('dynamic-bones').value;
    document.getElementById('dynamic-bones-value').textContent = `$${complexity}`;
    document.getElementById('dynamic-bones-comment').textContent = 
        complexity == 0 ? 'No Dynamic Bones' : 
        complexity <= prices["vrchat"].dynamicBones.low ? 'Basic Dynamic Bones: Simple physics applied to a few elements, like hair tips or a single accessory, with minimal movement.' : 
        complexity <= prices["vrchat"].dynamicBones.high-1 ? 'Intermediate Physics: Moderate use of dynamic bones to create realistic motion in hair, tails, or clothing with noticeable interactions.' : 
        'Advanced Physics: Complex implementation of dynamic bones affecting multiple parts of the model, offering highly realistic and nuanced motion throughout.';
}

// Update texturing complexity
function updateTexturingValue() {
    const complexity = document.getElementById('texturing').value;
    document.getElementById('texturing-value').textContent = `$${complexity}`;
    document.getElementById('texturing-comment').textContent = 
        complexity == 0 ? 'No Texturing' : 
        complexity <= prices["avatar"].texturing.low ? 'Basic Texturing: Simple textures with flat colors or basic patterns, minimal detail or shading.' : 
        complexity <= prices["avatar"].texturing.high-1 ? 'Intermediate Texturing: Moderately detailed textures, including proper UV mapping, basic shading, and surface features.' : 
        'High-Quality Texturing: Highly detailed textures with advanced realism, including fine surface details, complex shading, and material depth (e.g., PBR workflow).';
}

// Update rigging complexity
function updateRiggingComplexityValue() {
    const complexity = document.getElementById('rigging-complexity').value;
    document.getElementById('rigging-complexity-value').textContent = `$${complexity}`;
    document.getElementById('rigging-comment').textContent = 
        complexity == 0 ? 'No Rigging' : 
        complexity <= prices["avatar"].rigging.low ? 'Basic Rigging: A simple rig with minimal bones and basic functionality, allowing for limited movement like simple poses or expressions.' : 
        'Advanced Rigging: A highly detailed rig with comprehensive functionality, including complex bone structures, IK (inverse kinematics), controllers, and facial expressions for smooth, dynamic animations.';
}

function updatePropComplexityValue() {
    const complexity = document.getElementById('props-complexity').value;
    document.getElementById('props-complexity-value').textContent = `$${complexity}`;
    document.getElementById('props-complexity-comment').textContent = 
        complexity == 0 ? 'No Props' : 
        complexity <= prices["3d"].staticprop.low ? 'Basic Prop: Simple static prop with minimal details.' : 
        complexity <= prices["3d"].dynamicprop.high-1 ? 'Intermediate Prop: Moderately detailed prop with some dynamic elements.' : 
        'Advanced Prop: Highly detailed prop with complex dynamic elements.';
}

// Price Calculation
function calculatePrice() {
    const type = document.getElementById('type').value;
    let basePrice = 0;

    if (type === '2d') {
        const type2D = document.getElementById('2d-type').value;
        const coverage = document.getElementById('coverage').value;
        const additional = parseInt(document.getElementById('additional').value);
        const background = parseInt(document.getElementById('background-complexity').value);

        basePrice = prices["2d"][type2D][coverage];
        basePrice += additional * basePrice * 0.5;
        basePrice += background;
    } else if (type === '3d') {
        basePrice = parseInt(document.getElementById('complexity').value);
        basePrice += parseInt(document.getElementById('clothing-complexity').value) * parseInt(document.getElementById('customClothing-items').value);
        basePrice += parseInt(document.getElementById('props-complexity').value) * parseInt(document.getElementById('props').value);
        basePrice += parseInt(document.getElementById('texturing').value);
        basePrice += parseInt(document.getElementById('rigging-complexity').value);
        basePrice += parseInt(document.getElementById('dynamic-bones').value);
        basePrice += parseInt(document.getElementById('toggles').value) * prices["vrchat"].toggleSetups.low;
        basePrice += parseInt(document.getElementById('custom-expressions').value) * prices["avatar"].expressions.low;
        if (document.getElementById('quest-optimization').checked) basePrice += prices["vrchat"].questConversion.low;
    }

    // Additional Costs
    const nsfw = document.getElementById('nsfw').checked ? basePrice * prices["additional"].nsfw : 0;
    const rushOrder = document.getElementById('rushOrder').checked ? basePrice * prices["additional"].rushOrder : 0;
    const commercialUse = document.getElementById('commercialUse').checked ? basePrice * prices["additional"].commercialUse : 0;

    basePrice += nsfw + rushOrder + commercialUse;
    document.getElementById('result').innerText = `Total Price: $${basePrice.toFixed(2)}`;
}

document.addEventListener("DOMContentLoaded", () => {
    const openTosModalButton = document.getElementById("open-tos-modal-button");
    const tosModal = document.getElementById("tos-modal");
    const closeTosModalButton = tosModal.querySelector(".close");
    const tosContent = document.getElementById("tos-content");

    openTosModalButton.addEventListener("click", (event) => {
        event.preventDefault();
        fetch('tos.html')
            .then(response => response.text())
            .then(data => {
                tosContent.innerHTML = data;
                tosModal.style.display = "block";
            })
            .catch(error => console.error('Error loading TOS:', error));
    });

    closeTosModalButton.addEventListener("click", () => {
        tosModal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if (event.target === tosModal) {
            tosModal.style.display = "none";
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector('header');
    const navItems = document.querySelectorAll('#nav-image');

    function checkHeaderVisibility() {
        const headerRect = header.getBoundingClientRect();
        const headerVisibleHeight = Math.max(0, headerRect.bottom - Math.max(0, headerRect.top));
        const headerVisiblePercentage = (headerVisibleHeight / headerRect.height) * 100;

        navItems.forEach(navItem => {
            if (headerVisiblePercentage < 10) {
                navItem.classList.remove('nav-hover-image');
                navItem.classList.add('nav-hover-image-side');
            } else {
                navItem.classList.remove('nav-hover-image-side');
                navItem.classList.add('nav-hover-image');
            }
        });
    }

    window.addEventListener('scroll', checkHeaderVisibility);
    checkHeaderVisibility();
});

document.addEventListener("DOMContentLoaded", () => {
    const commissionsFolder = 'commissions';
    const commissionsSlider = document.querySelector('.commissions-slider');
    const exampleImageModal = document.getElementById('example-image-modal');
    const exampleImageModalImg = document.getElementById('example-image-modal-img');
    const exampleImageModalVideo = document.getElementById('example-image-modal-video');
    const exampleImageModalVideoSource = exampleImageModalVideo.querySelector('source');
    const closeModalButton = exampleImageModal.querySelector('.close');

    const commissionMedia = [
        { icon: `${commissionsFolder}/3d_scr_image01.gif`, showcase: `${commissionsFolder}/3d_scr_image01.webm` },
        { icon: `${commissionsFolder}/3d_scr_image02.gif`, showcase: `${commissionsFolder}/3d_scr_image02.webm` },
        { icon: `${commissionsFolder}/3d_scr_image03.gif`, showcase: `${commissionsFolder}/3d_scr_image03.webm` },
    ];

    commissionMedia.forEach(media => {
        let mediaElement;
        if (media.icon.endsWith('.webm') || media.icon.endsWith('.mp4')) {
            mediaElement = document.createElement('video');
            mediaElement.src = media.icon;
            mediaElement.loop = true;
            mediaElement.muted = true;
        } else {
            mediaElement = document.createElement('img');
            mediaElement.src = media.icon;
        }
        mediaElement.alt = 'Commission Media';
        mediaElement.classList.add('example-image');

        mediaElement.addEventListener('click', () => {
            if (media.showcase.endsWith('.webm') || media.showcase.endsWith('.mp4')) {
                exampleImageModalImg.style.display = 'none';
                exampleImageModalVideo.style.display = 'flex';
                exampleImageModalVideoSource.src = media.showcase;
                exampleImageModalVideo.load();
                exampleImageModalVideo.play();
            } else {
                exampleImageModalVideo.style.display = 'none';
                exampleImageModalImg.style.display = 'flex';
                exampleImageModalImg.src = media.showcase;
            }
            exampleImageModal.style.display = 'flex';
        });
        commissionsSlider.appendChild(mediaElement);
    });

    closeModalButton.addEventListener('click', () => {
        exampleImageModal.style.display = 'none';
        exampleImageModalVideo.pause();
        exampleImageModalVideo.style.display = 'none';
        exampleImageModalImg.style.display = 'flex';
    });

    window.addEventListener('click', (event) => {
        if (event.target === exampleImageModal) {
            exampleImageModal.style.display = 'none';
            exampleImageModalVideo.pause();
            exampleImageModalVideo.style.display = 'none';
            exampleImageModalImg.style.display = 'flex';
        }
    });
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

function toggleMobileNav() {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.toggle('show');
};