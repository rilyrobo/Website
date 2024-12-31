document.addEventListener("DOMContentLoaded", () => {
        
    const channelId = 'UCNlAFfQIh6Eycmd2yntbK7Q';

    const videoIds = [
        'uQXPa-OcfFQ',
        'yaDXBP_9nLM',
        '9ufioUSRtWs',
        'HRU_q-m73IM',
        'OKIYQ-5k22I',
        // Add more video IDs here
    ];
    

    // Fetch Gallery Data for Home Page
        fetch(`https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo`)
            .then(response => response.text())
            .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
            .then(data => {
                const items = Array.from(data.querySelectorAll("item")).slice(0, 5);
                let html = "";

                items.forEach(el => {
                    const title = el.querySelector("title").textContent;
                    const link = el.querySelector("link").textContent;
                    const image = el.querySelector("media\\:content, content").getAttribute("url");

                    html += `
                        <div class="gallery-card grid-item" data-link="${link}" data-image="${image}">
                            <img src="${image}" alt="${title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px;">
                            <h4 style="color: #FFFFFF; margin-top: 10px; font-size: 1em;">${title}</h4>
                        </div>`;
                });

                document.querySelector(".gallery-grid-home").innerHTML = html;

                // Attach modal functionality to gallery items
                attachModalListeners(".gallery-grid-home");
        })
        .catch(error => {
            console.error("Error loading gallery data:", error);
            const errorMessage = document.querySelector(".gallery-grid-home");
            errorMessage.innerHTML = 'Failed to load gallery items. Please try again later.';
            errorMessage.classList.add('error-message');
        });

        // Fetch Gallery Data for Dedicated Page
        fetch(`https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo`)
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
                        <div class="gallery-card grid-item" data-link="${link}" data-image="${image}">
                            <img src="${image}" alt="${title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px;">
                            <h4 style="color: #FFFFFF; margin-top: 10px; font-size: 1em;">${title}</h4>
                        </div>`;
                });

                document.querySelector(".gallery-grid-full").innerHTML = html;

                // Attach modal functionality to gallery items
                attachModalListeners(".gallery-grid-full");

        })
        .catch(error => {
            console.error("Error loading gallery data:", error);
            const errorMessage = document.querySelector(".gallery-grid-full");
            errorMessage.innerHTML = 'Failed to load gallery items. Please try again later.';
            errorMessage.classList.add('error-message');
        });


          
        // Home Page Videos
        const videoGridHome = document.querySelector('.video-grid-home');
        let homeHtml = '';
        
        videoIds.slice(0, 3).forEach(videoId => {
            homeHtml += `
                <div class="video-card">
                    <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                    <h4>Video Title</h4> <!-- You can manually add titles if you want -->
                </div>`;
        });
        
        videoGridHome.innerHTML = homeHtml;
        
        // Video Page Videos
        const videoGridFull = document.querySelector('.video-grid-full');
        let fullHtml = '';
        
        videoIds.forEach(videoId => {
            fullHtml += `
                <div class="video-card">
                    <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                    <h4>Video Title</h4> <!-- You can manually add titles if you want -->
                </div>`;
        });
        
        videoGridFull.innerHTML = fullHtml;
        
                
        /*
        fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)
        .then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(data => {
            const items = data.querySelectorAll("entry");
            const videoGrid = document.querySelector('.video-grid-home');
            let html = '';
    
            items.forEach(item => {
                const title = item.querySelector("title").textContent;
                const videoId = item.querySelector("yt\\:videoId").textContent;
    
                html += `
                    <div class="video-card">
                        <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                        <h4>${title}</h4>
                    </div>`;
            });
    
            videoGrid.innerHTML = html;
        })
        .catch(error => {
            console.error('Error fetching RSS feed:', error);
            const errorMessage = document.querySelector('.video-grid-home');
            errorMessage.innerHTML = 'Failed to load videos.';
            errorMessage.classList.add('error-message');
        });

        fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
            .then(data => {
            const videoGrid = document.querySelector('.video-grid-full');
            let html = '';

            videoIds.forEach(videoId => {
                html += `
                    <div class="video-card">
                        <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                        <h4>Video Title</h4> <!-- You can manually add titles if you want -->
                    </div>`;
            });

            videoGrid.innerHTML = html;

            })
            .catch(error => {
                console.error('Error fetching RSS feed:', error);
                const errorMessage = document.querySelector('.video-grid-full');
                errorMessage.innerHTML = 'Failed to load videos.';
                errorMessage.classList.add('error-message');
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
            const errorMessage = document.querySelector('.video-grid-home');
            errorMessage.innerHTML = 'Failed to load videos.';
            errorMessage.classList.add('error-message');
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
            const errorMessage = document.querySelector('.video-grid-full');
            errorMessage.innerHTML = 'Failed to load videos.';
            errorMessage.classList.add('error-message');
        });*/
});

let players = []; // To store YouTube players

// Initialize YouTube players
function onYouTubeIframeAPIReady() {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe, index) => {
        const player = new YT.Player(iframe, {
            events: {
                'onReady': onPlayerReady,
            }
        });
        players[index] = player;
    });
}

// Function to handle player readiness
function onPlayerReady(event) {
    // Player is ready to be controlled
}

// Function to stop all videos
function stopVideos() {
    players.forEach(player => {
        if (player && player.pauseVideo) {
            player.pauseVideo(); // Pause the video
        }
    });
}



function showPage(pageId) {
    stopVideos(); // Stop all videos before switching
    const pages = document.querySelectorAll('.page');
    const activePage = document.querySelector('.page.active');

    if (activePage) {
        activePage.classList.add('fade-out');
        activePage.classList.remove('fade-in', 'active');
        setTimeout(() => {
            activePage.style.display = 'none';
            activePage.classList.remove('fade-out');

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
            modal.style.display = "flex"; // Show modal
        }
    });

    // Close modal when clicking outside modal content
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none"; // Hide modal
        }
    });
}

function attachExampleImageListeners() {
    const exampleImages = document.querySelectorAll(".example-image");
    const modal = document.getElementById("gallery-modal");
    const modalImage = document.getElementById("modal-image");
    const modalLink = document.getElementById("modal-link");

    exampleImages.forEach(image => {
        image.addEventListener("click", () => {
            const imageUrl = image.src;

            modalImage.src = imageUrl;
            modalLink.style.display = "none"; // Hide the link for example images
            modal.style.display = "flex"; // Show modal
        });
    });

    // Close modal when clicking outside modal content
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none"; // Hide modal
            modalLink.style.display = "block"; // Reset link visibility for other uses
        }
    });
}

// Call the function after DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    attachExampleImageListeners();
});