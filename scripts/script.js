const username = "RilyRobo";
const discordID = "277498825403531264";

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

const contacts = [
    { name: "Twitter", url: `https://twitter.com/${username}`, icon: "https://img.icons8.com/?size=100&id=phOKFKYpe00C&format=png&color=ffffff" , color: "#1A91DA" },
    { name: "Ko-fi", url: `https://www.ko-fi.com/${username}`, icon: "https://img.icons8.com/?size=100&id=8342&format=png&color=ffffff" , color: "#E6C200" },
    { name: "Email", url: `mailto:${username}@gmail.com`, icon: "https://img.icons8.com/?size=100&id=60688&format=png&color=ffffff" , color: "#ffffff" },
    { name: "Discord", url: `https://discordapp.com/users/${discordID}`, icon: "https://img.icons8.com/?size=100&id=30888&format=png&color=ffffff" , color: "#7289da" },
];

document.addEventListener("DOMContentLoaded", () => {
    const socialMediasContainers = document.querySelectorAll(".social-contact");

    if (socialMediasContainers.length === 0) {
        console.error("No containers with class 'social-contact' found.");
        return;
    }

    socialMediasContainers.forEach(container => {
        contacts.forEach(contact => {
            const link = document.createElement("a");
            link.href = contact.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.addEventListener("click", (e) => e.stopPropagation());

            const imgStart = document.createElement("img");
            imgStart.src = contact.icon;
            imgStart.alt = contact.name;
            imgStart.classList.add("social-icon");

            const imgEnd = imgStart.cloneNode(true);

            if (container.classList.contains("social-contact-icon")) {
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

document.addEventListener("DOMContentLoaded", () => {
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

document.addEventListener("DOMContentLoaded", () => {
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
});

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
    ScrollToTop();
}
    
document.querySelectorAll("nav a:not([href^='http'])").forEach(link => {
    link.addEventListener("click", (e) => { e.preventDefault();
        const targetPage = e.target.getAttribute("href").substring(1);
        showPage(targetPage);
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const teespringIframe = document.getElementById("teespring-iframe");
    const gumroadIframe = document.getElementById("gumroad-iframe");
    const jinxxyIframe = document.getElementById("jinxxy-iframe");

    if (teespringIframe) {
        teespringIframe.src = "https://my-store-c7ca26-2.creator-spring.com";
    }
    if (gumroadIframe) {
        gumroadIframe.src = "https://gumroad.com/rilyrobo";
    }
    if (jinxxyIframe) {
        jinxxyIframe.src = "https://jinxxy.com/rilyrobo";
    }
});

function toggleMobileNav() {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.toggle('show');
};

function ScrollToTop() {
    window.scrollTo(0,0);
}

function loadAboutContent() {
    const aboutContentElement = document.getElementById('about-content');

    if (!aboutContentElement) {
        console.error('Element with ID "about-content" not found.');
        return;
    }

    fetch('aboutme.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load aboutme.html: ${response.statusText}`);
            }
            return response.text();
        })
        .then(html => {
            aboutContentElement.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading aboutme.html:', error);
            aboutContentElement.innerHTML = '<p>Failed to load content. Please try again later.</p>';
        });
}

document.addEventListener('DOMContentLoaded', loadAboutContent);