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
        { name: "Twitter", url: `https://twitter.com/${username}`, icon: "https://img.icons8.com/?size=100&id=phOKFKYpe00C&format=png&color=ffffff" , color: "#1A91DA" },
        { name: "Instagram", url: `https://instagram.com/${username}`, icon: "https://img.icons8.com/?size=100&id=32309&format=png&color=ffffff" , color: "#C13584" },
        { name: "YouTube", url: `https://www.youtube.com/@${username}`, icon: "https://img.icons8.com/?size=100&id=37326&format=png&color=ffffff" , color: "#CC0000" },
        { name: "DeviantArt", url: `https://www.deviantart.com/${username}`, icon: "https://img.icons8.com/?size=100&id=38504&format=png&color=ffffff" , color: "#04A045" },
        { name: "Newgrounds", url: `https://${username}.newgrounds.com`, icon: "https://img.icons8.com/?size=100&id=15771&format=png&color=ffffff" , color: "#E6B800" },
        { name: "Twitch", url: `https://www.twitch.tv/${username}`, icon: "https://img.icons8.com/?size=100&id=18104&format=png&color=ffffff" , color: "#772CE8" },
        { name: "Picarto", url: `https://picarto.tv/${username}`, icon: "https://img.icons8.com/?size=100&id=6byL4WgkpyPg&format=png&color=ffffff" , color: "#00CC00" },
        { name: "Patreon", url: `https://www.patreon.com/c/${username}`, icon: "https://img.icons8.com/?size=100&id=tIshI0hyXw3f&format=png&color=ffffff" , color: "#E36254" },
        { name: "Subscribestar", url: `https://www.subscribestar.com/${username}`, icon: "https://img.icons8.com/?size=100&id=7856&format=png&color=ffffff" , color: "#E6B800" },
        { name: "BuyMeACoffee", url: `https://www.buymeacoffee.com/${username}`, icon: "https://img.icons8.com/?size=100&id=8342&format=png&color=ffffff" , color: "#E6C200" },
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
    const dropdownContent = document.querySelector(".dropdown-content");
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
        nsfwMultiplier: 0.2,
        additionalMultiplier: 0.5
    },
    "3d": {
        lowpoly: 150,
        highpoly: 300,
        staticprop: 30,
        dynamicprop: 50,
        kitbashchar: 75,
        kitbashprop: 75,
        viseme: 10,
        nsfwMultiplier: 0.2
    }
};

document.addEventListener("DOMContentLoaded", () => {
    function setPrices(prices) {

        document.getElementById('2d-sketch-portrait').textContent = `$${prices["2d"].sketch.portrait}`;
        document.getElementById('2d-sketch-upperhalf').textContent = `$${prices["2d"].sketch.upperhalf}`;
        document.getElementById('2d-sketch-fullbody').textContent = `$${prices["2d"].sketch.fullbody}`;
        document.getElementById('2d-lineart-portrait').textContent = `$${prices["2d"].lineart.portrait}`;
        document.getElementById('2d-lineart-upperhalf').textContent = `$${prices["2d"].lineart.upperhalf}`;
        document.getElementById('2d-lineart-fullbody').textContent = `$${prices["2d"].lineart.fullbody}`;
        document.getElementById('2d-flatcolors-portrait').textContent = `$${prices["2d"].flatcolors.portrait}`;
        document.getElementById('2d-flatcolors-upperhalf').textContent = `$${prices["2d"].flatcolors.upperhalf}`;
        document.getElementById('2d-flatcolors-fullbody').textContent = `$${prices["2d"].flatcolors.fullbody}`;
        document.getElementById('2d-shading-portrait').textContent = `$${prices["2d"].shading.portrait}`;
        document.getElementById('2d-shading-upperhalf').textContent = `$${prices["2d"].shading.upperhalf}`;
        document.getElementById('2d-shading-fullbody').textContent = `$${prices["2d"].shading.fullbody}`;
        document.getElementById('2d-background-colourgradient').textContent = `$${prices["2d"].background.colourgradient}`;
        document.getElementById('2d-background-detailedbackground').textContent = `$${prices["2d"].background.detailedbackground}`;

        document.getElementById('3d-lowpoly').textContent = `$${prices["3d"].lowpoly}`;
        document.getElementById('3d-highpoly').textContent = `$${prices["3d"].highpoly}`;
        document.getElementById('3d-staticprop').textContent = `$${prices["3d"].staticprop}`;
        document.getElementById('3d-dynamicprop').textContent = `$${prices["3d"].dynamicprop}`;
        document.getElementById('3d-kitbashchar').textContent = `$${prices["3d"].kitbashchar}`;
        document.getElementById('3d-kitbashprop').textContent = `$${prices["3d"].kitbashprop}`;
        document.getElementById('3d-viseme').textContent = `$${prices["3d"].viseme}`;
    }

    setPrices(prices);
});

document.addEventListener("DOMContentLoaded", () => {
    updateOptions();
    updateVisemeOption();
});

function updateOptions() {
    const type = document.getElementById('type').value;
    const options2D = document.getElementById('2d-options');
    const options3D = document.getElementById('3d-options');

    if (type === '2d') {
        options2D.style.display = 'block';
        options3D.style.display = 'none';
    } else {
        options2D.style.display = 'none';
        options3D.style.display = 'block';
    }
}

function updateVisemeOption() {
    const type3D = document.getElementById('3d-type').value;
    const visemeOption = document.getElementById('viseme-option');

    if (type3D === 'lowpoly' || type3D === 'highpoly' || type3D === 'kitbashchar') {
        visemeOption.style.display = 'block';
    } else {
        visemeOption.style.display = 'none';
    }
}

function calculatePrice() {
    const type = document.getElementById('type').value;
    const nsfw = document.getElementById('nsfw').value;
    let basePrice = 0;

    if (type === '2d') {
        const type2D = document.getElementById('2d-type').value;
        const coverage = document.getElementById('coverage').value;
        const additional = parseInt(document.getElementById('additional').value);
        const background = document.getElementById('background').value;

        basePrice = prices["2d"][type2D][coverage];
        const additionalCost = additional * (basePrice * prices["2d"].additionalMultiplier);
        const backgroundCost = prices["2d"].background[background] || 0;
        const nsfwCost = nsfw === 'yes' ? basePrice * prices["2d"].nsfwMultiplier : 0;

        basePrice += additionalCost + backgroundCost + nsfwCost;
    } else {
        const type3D = document.getElementById('3d-type').value;
        const viseme = document.getElementById('viseme').value;

        basePrice = prices["3d"][type3D];
        const visemeCost = (type3D === 'lowpoly' || type3D === 'highpoly' || type3D === 'kitbashchar') && viseme === 'yes' 
            ? prices["3d"].viseme 
            : 0;
        const nsfwCost = nsfw === 'yes' ? basePrice * prices["3d"].nsfwMultiplier : 0;

        basePrice += visemeCost + nsfwCost;
    }
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
}