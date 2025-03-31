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
    const commissionsFolder = 'images/commissions';
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
