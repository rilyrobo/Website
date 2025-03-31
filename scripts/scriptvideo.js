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