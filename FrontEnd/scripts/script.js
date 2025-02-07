document.addEventListener("DOMContentLoaded", () => {
    setupLoginLogout(); // Gère l'affichage Login/Logout
    fetchWorks(); // Charge les projets dynamiquement
    fetchCategories(); // Charge les filtres des catégories
    setupAdminPanel(); // Affiche le mode édition si admin
});

/**
 * Vérifie si l'utilisateur est connecté
 */
function checkUserLogin() {
    return !!sessionStorage.getItem("token"); // Renvoie true si connecté, false sinon
}

/**
 * Gère l'affichage du menu Login/Logout
 */
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

/**
 * Récupère et affiche les projets dynamiquement depuis l’API
 */
async function fetchWorks() {
    try {
        const response = await fetch("http://localhost:5678/api/works");
        if (!response.ok) throw new Error("Erreur lors de la récupération des travaux");
        
        const works = await response.json();
        displayWorks(works);
    } catch (error) {
        console.error(error);
    }
}

/**
 * Affiche dynamiquement les projets
 */
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

        // Ajoute un bouton de suppression si admin connecté
        if (checkUserLogin()) {
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "🗑 Supprimer";
            deleteBtn.classList.add("delete-btn");
            deleteBtn.addEventListener("click", () => deleteWork(work.id));
            figure.appendChild(deleteBtn);
        }

        gallery.appendChild(figure);
    });
}

/**
 * Récupère et affiche les catégories sous forme de filtres
 */
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

/**
 * Affiche dynamiquement les filtres
 */
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

/**
 * Filtre les projets par catégorie
 */
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

/**
 * Affiche le mode édition pour l’administrateur
 */
function setupAdminPanel() {
    const adminPanel = document.getElementById("admin-panel");
    const filters = document.querySelector(".filters");

    if (checkUserLogin()) {
        adminPanel.style.display = "block"; // Affiche le bouton Modifier
        filters.style.display = "none"; // Cache les filtres
    } else {
        filters.style.display = "flex"; // Affiche les filtres si non admin
    }
}

/**
 * Gère le mode édition
 */
function setupEditMode() {
    const editButton = document.getElementById("edit-mode");
    if (editButton) {
        editButton.addEventListener("click", () => {
            document.body.classList.toggle("edit-mode-active");
        });
    }
}

/**
 * Supprime un projet (Admin uniquement)
 */
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
