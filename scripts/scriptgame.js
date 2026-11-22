

document.addEventListener("DOMContentLoaded", () => {
    const myGames = [
        {
            title: "Unnamed Game Project",
            image: "images/game/game_projectt.jpg",
            description: "2013 A horror game project that was never completed. The game was to be a 2D gamemaker 8 engine horror, adventure game with a focus on story and atmosphere. The player would explore a world overtaken by monsters and fleshy masses with pills to swap between the apocolyptic world and a modern world with the ability to by pass threats and puzzles by changing worlds.",
            links: [
                
            ]
        },
        {
            title: "Secured Maze",
            image: "images/game/game_securedmaze.jpg",
            description: "2016 The Secured Maze was a 2.5D gamemaker 8 engine horror game, the player would travel through mazes gathering keys to open gates to find elevators to travel deeper.The players own sense would betray them as some monsters would rely on the players use of hearing and sight to track them down, requiring the player to block these sense and struggle to make it through the mazes",
            links: [
                
            ]
        },
        {
            title: "VRChat Retro Game Recreation",
            image: "images/game/game_arcaderecreation.jpg",
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
            image: "images/game/game_insertpaper.jpg",
            description: "2017 Before any professional training I joined the group Startreming for a short while. I did character modeling, UV unwrapping, texturing, rigging and test animating those characters",
            links: [
                { name: "Steam", url: "https://store.steampowered.com/app/661490/Insert_Paper/" }
            ]
        },
        {
            title: "CRITICAL MASS EPISODE I",
            image: "images/game/game_criticalmass.jpg",
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