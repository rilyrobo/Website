document.addEventListener("DOMContentLoaded", () => {
    const galleryData = [
        {url: 'https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/31357645/featured', title: 'Featured', icon: 'images/icon/nav_icon_Work.gif', description: 'A collection of my latest work'},
        {url: 'https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/96210416/2d-art', title: '2D Art', icon: 'images/icon/nav_icon_Gallery.gif', description: 'A collection of my 2D artwork'},
        {url: 'https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/96210354/3d-art', title: '3D Art', icon: 'images/icon/nav_icon_3D.gif', description: 'A collection of my 3D artwork'},
        {url: 'https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/57218144/reference-images', title: 'Character Design', icon: 'images/icon/nav_icon_Gallery2.gif', description: 'A collection of my character designs'},
    ];
    
    fetchGalleryData(galleryData[0], '.gallery-grid-home', 5);
    fetchGalleryData(galleryData[0], '.gallery-grid-full');
    setupGalleries(galleryData);
});

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
                    <a href="https://www.artstation.com/RilyRobo" target="_blank" rel="noopener noreferrer" class="button artstation-button">
                        More on Artstation
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