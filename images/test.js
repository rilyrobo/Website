import { galleryData } from './comics/the-king-and-guardian.js';

document.addEventListener("DOMContentLoaded", () => {
    const firstImage = galleryData[0]?.image; // Get the first image
    const imageElement = document.getElementById("comic-image");

    if (firstImage && imageElement) {
        imageElement.src = firstImage;
        console.log("First image loaded:", firstImage);
    } else {
        console.error("No images found in galleryData.");
    }
});
