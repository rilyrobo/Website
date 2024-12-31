document.addEventListener("DOMContentLoaded", () => {
    const API_KEYS = {
        youtube: 'AIzaSyCXMXW5hTQi-M1W8ZnU5Engfl2NAS5M6CI',
        deviantArt: 'RilyRobo',
    };
        
    const channelId = 'UCNlAFfQIh6Eycmd2yntbK7Q';

    // Fetch Gallery Data for Home Page
    fetch(`https://backend.deviantart.com/rss.xml?q=gallery:${API_KEYS.deviantArt}`)
        .then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(data => {
            const items = Array.from(data.querySelectorAll("item")).slice(0, 5);
            const galleryGrid = document.querySelector(".latest-gallery .gallery-grid-home");
            let html = "";
            
            items.forEach(el => {
                const title = el.querySelector("title").textContent;
                const link = el.querySelector("link").textContent;
                const image = el.querySelector("media\\:content, content").getAttribute("url");
                
                html += `
                <div class="gallery-card grid-item" style="border: 1px solid #ccc; border-radius: 10px; padding: 15px; background: rgba(0, 0, 0, 0.6); text-align: center;">
                    <img src="${image}" alt="${title}" data-link="${link}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px;">
                    <h4 style="color: #FFFFFF; margin-top: 10px; font-size: 1em;">${title}</h4>
                </div>`;
            });
            
            galleryGrid.innerHTML = html;
        })
        .catch(error => {
            console.error("Error loading gallery data:", error);
            const galleryGrid = document.querySelector(".latest-gallery .gallery-grid-home");
            galleryGrid.innerHTML = '<p style="color: red; text-align: center;">Failed to load gallery items. Please try again later.</p>';
        });

    // Fetch Gallery Data for Dedicated Page
    fetch(`https://backend.deviantart.com/rss.xml?q=gallery:${API_KEYS.deviantArt}`)
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
        const items = data.querySelectorAll("item");
        let html = "";

        items.forEach(el => {
            const title = el.querySelector("title").textContent;
            const link = el.querySelector("link").textContent;
            const image = el.querySelector("media\\:content, content").getAttribute("url");

            html += `
                <div class="gallery-card grid-item" style="border: 1px solid #ccc; border-radius: 10px; padding: 15px; background: rgba(0, 0, 0, 0.6); text-align: center;">
                    <img src="${image}" alt="${title}" data-link="${link}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px;">
                    <h4 style="color: #FFFFFF; margin-top: 10px; font-size: 1em;">${title}</h4>
                </div>`;
        });

        document.querySelector(".gallery-grid-full").innerHTML = html;
    });



        fetch(`https://www.googleapis.com/youtube/v3/search?key=${API_KEYS.youtube}&channelId=${channelId}&part=snippet&type=video&order=date&maxResults=3`)
        .then(response => response.json())
        .then(data => {
            const videoGrid = document.querySelector('.video-grid-home');
            let html = '';
            data.items.forEach(item => {
                const title = item.snippet.title;
                const videoId = item.id.videoId;
                html += `
                    <div class="video-card">
                        <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                        <h4>${title}</h4>
                    </div>`;
            });
            videoGrid.innerHTML = html;
        })
        .catch(error => {
            console.error('Error fetching videos:', error);
            document.querySelector('.video-grid-home').innerHTML = 'Failed to load videos.';
        });    
        
        fetch(`https://www.googleapis.com/youtube/v3/search?key=${API_KEYS.youtube}&channelId=${channelId}&part=snippet&type=video&order=date&maxResults=50`)
        .then(response => response.json())
        .then(data => {
            const videoGrid = document.querySelector('.video-grid-full');
            let html = '';
            data.items.forEach(item => {
                const title = item.snippet.title;
                const videoId = item.id.videoId;
                html += `
                    <div class="video-card">
                        <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                        <h4>${title}</h4>
                    </div>`;
            });
            videoGrid.innerHTML = html;
        })
        .catch(error => {
            console.error('Error fetching videos:', error);
            document.querySelector('.video-grid-full').innerHTML = 'Failed to load videos.';
        });   
});

function stopVideos() {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        const src = iframe.src;
        iframe.src = '';
        iframe.src = src;
    });
}



function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    const activePage = document.querySelector('.page.active');

    if (activePage) {
        activePage.classList.add('fade-out');
        activePage.classList.remove('fade-in', 'active');
        setTimeout(() => {
            activePage.style.display = 'none';
            activePage.classList.remove('fade-out');
            
            stopVideos(); // Stop videos when leaving the page
            
            const newPage = document.getElementById(pageId);
            newPage.style.display = 'block';
            setTimeout(() => {
                newPage.classList.add('fade-in', 'active');
            }, 50);
        }, 500);
    } else {
        const newPage = document.getElementById(pageId);
        newPage.style.display = 'block';
        setTimeout(() => {
            newPage.classList.add('fade-in', 'active');
        }, 50);
    }
}

function openModal(src) {
  const modal = document.getElementById("imageModal");
  const modalImage = document.getElementById("modalImage");
  modalImage.src = src;
  modal.style.display = "block";
}

function closeModal() {
  const modal = document.getElementById("imageModal");
  modal.style.display = "none";
}

// Close the modal when clicking outside of the modal content
window.onclick = function(event) {
  const modal = document.getElementById("imageModal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
    const galleryItems = document.querySelectorAll(".gallery-card img");
    const modal = document.getElementById("gallery-modal");
    const modalImage = document.getElementById("modal-image");
    const modalLink = document.getElementById("modal-link");
    const closeModal = modal.querySelector(".close");

    galleryItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault(); // Prevent default link behavior
            const imageUrl = e.target.src;
            const deviantArtLink = e.target.dataset.link;

            modalImage.src = imageUrl;
            modalLink.href = deviantArtLink;
            modal.style.display = "flex"; // Show modal
        });
    });

    closeModal.addEventListener("click", () => {
        modal.style.display = "none"; // Hide modal
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none"; // Hide modal if clicked outside content
        }
    });
});

items.forEach(el => {
    const title = el.querySelector("title").textContent;
    const link = el.querySelector("link").textContent;
    const image = el.querySelector("media\\:content, content").getAttribute("url");

    html += `
        <div class="gallery-card grid-item">
            <img src="${image}" alt="${title}" data-link="${link}">
            <h4>${title}</h4>
        </div>`;
});
