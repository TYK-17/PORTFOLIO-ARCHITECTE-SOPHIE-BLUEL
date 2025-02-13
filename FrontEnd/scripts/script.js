document.addEventListener("DOMContentLoaded", () => {
    setupLoginLogout(); // Gère l'affichage Login/Logout
    fetchWorks(); // Charge les projets dynamiquement
    fetchCategories(); // Charge les filtres des catégories
    setupAdminPanel(); // Affiche le mode édition si admin
});

/*** Vérifie si l'utilisateur est connecté ***/
function checkUserLogin() {
    return !!sessionStorage.getItem("token"); // Renvoie true si connecté, false sinon
}

/*** Gère l'affichage du menu Login/Logout ***/
function setupLoginLogout() {
    const loginLogout = document.getElementById("login-logout");
    
    if (checkUserLogin()) {
        loginLogout.innerHTML = `<a href="#" id="logout">Logout</a>`;
        document.getElementById("logout").addEventListener("click", () => {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("userId");
            window.location.reload(); // Recharge la page après déconnexion
        });
    }
}

/*** Récupère et affiche les projets dynamiquement depuis l’API ***/
async function fetchWorks() {
    try {
        const response = await fetch("http://localhost:5678/api/works"); // Endpoint Swagger
        if (!response.ok) throw new Error("Erreur lors de la récupération des travaux");
        
        const works = await response.json();
        displayWorks(works); // Affiche les projets dans la galerie principale
        displayModalGallery(works); // Affiche les projets dans la modal
    } catch (error) {
        console.error(error);
    }
}


/*** Affiche dynamiquement les projets ***/
function displayWorks(works) {
    const gallery = document.querySelector(".gallery");
    gallery.innerHTML = ""; // Nettoie l'ancienne galerie

    works.forEach(work => {
        const figure = document.createElement("figure");
        const img = document.createElement("img");
        img.src = work.imageUrl;
        img.alt = work.title;

        const figcaption = document.createElement("figcaption");
        figcaption.textContent = work.title;

        figure.appendChild(img);
        figure.appendChild(figcaption);

        gallery.appendChild(figure);
    });
}

/*** Récupère et affiche les catégories sous forme de filtres ***/
async function fetchCategories() {
    try {
        const response = await fetch("http://localhost:5678/api/categories");
        if (!response.ok) throw new Error("Erreur lors de la récupération des catégories");
        
        const categories = await response.json();
        displayFilters(categories);
    } catch (error) {
        console.error(error);
    }
}

/*** Affiche dynamiquement les filtres ***/
function displayFilters(categories) {
    const filterContainer = document.querySelector(".filters");
    filterContainer.innerHTML = ""; // Nettoie les anciens filtres

    // Bouton "Tous"
    const allButton = document.createElement("button");
    allButton.textContent = "Tous";
    allButton.classList.add("filter-btn", "active");
    allButton.addEventListener("click", () => fetchWorks());
    filterContainer.appendChild(allButton);

    // Boutons par catégorie
    categories.forEach(category => {
        const button = document.createElement("button");
        button.textContent = category.name;
        button.classList.add("filter-btn");
        button.addEventListener("click", () => filterWorks(category.id));
        filterContainer.appendChild(button);
    });
}

/*** Filtre les projets par catégorie ***/
async function filterWorks(categoryId) {
    try {
        const response = await fetch("http://localhost:5678/api/works");
        if (!response.ok) throw new Error("Erreur lors du filtrage");
        
        const works = await response.json();
        const filteredWorks = works.filter(work => work.categoryId === categoryId);
        displayWorks(filteredWorks);
    } catch (error) {
        console.error(error);
    }
}

/*** Affiche le mode édition pour l’administrateur ***/
function setupAdminPanel() {
    const adminPanel = document.getElementById("admin-panel");
    const filters = document.querySelector(".filters");

    if (checkUserLogin()) {
        adminPanel.style.display = "block"; // Affiche le bouton "Modifier" si connecté
        filters.style.display = "none"; // Cache les filtres
    } else {
        adminPanel.style.display = "none"; // Masque le bouton "Modifier" si non connecté
        filters.style.display = "flex"; // Affiche les filtres si non connecté
    }
}


/*** Gère le mode édition ***/
function setupEditMode() {
    const editButton = document.getElementById("edit-mode");
    if (editButton) {
        editButton.addEventListener("click", () => {
            document.body.classList.toggle("edit-mode-active");
        });
    }
}

/*** Supprime un projet (Admin uniquement) ***/
async function deleteWork(workId) {
    const token = sessionStorage.getItem("token");

    if (!token) {
        alert("Vous devez être connecté pour supprimer un projet.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5678/api/works/${workId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Erreur lors de la suppression du projet.");
        }

        alert("Projet supprimé avec succès !");
        fetchWorks(); // Rafraîchit la galerie après suppression
    } catch (error) {
        console.error(error);
    }
}

/*** Modal ***/
document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("modal-gallery");
    const openModal = document.getElementById("admin-panel"); // Bouton "Modifier"
    const closeModal = document.querySelector(".modal .close");
    const addPhotoBtn = document.querySelector(".add-photo-btn");

    // Ouvrir la modal uniquement si l'utilisateur est connecté
    openModal.addEventListener("click", function () {
        if (checkUserLogin()) {
            modal.style.display = "block"; // Affiche la modal si connecté
        } else {
            alert("Vous devez être connecté pour accéder à cette fonctionnalité.");
        }
    });

    // Fermer la modal
    closeModal.addEventListener("click", function () {
        modal.style.display = "none";
    });

    // Fermer si on clique en dehors de la modal
    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Exemple pour ajouter une fonctionnalité au bouton "Ajouter une photo"
    addPhotoBtn.addEventListener("click", function () {
        if (checkUserLogin()) {
            alert("Ajouter une photo !");
            // Vous pouvez ajouter du code pour ouvrir un formulaire ou uploader une photo ici
        } else {
            alert("Vous devez être connecté pour ajouter une photo.");
        }
    });
});

/*** Affiche les projets dans la modal ***/
function displayModalGallery(works) {
    const modalGallery = document.querySelector("#modal-gallery .gallery");
    modalGallery.innerHTML = ""; // Nettoie la galerie de la modal

    works.forEach(work => {
        const figure = document.createElement("figure");
        figure.classList.add("image-item");

        const img = document.createElement("img");
        img.src = work.imageUrl; // URL de l'image récupérée depuis Swagger
        img.alt = work.title;

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener("click", () => deleteWork(work.id)); // Supprimer le projet

        figure.appendChild(img);
        figure.appendChild(deleteBtn);
        modalGallery.appendChild(figure);
    });
}

