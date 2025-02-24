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
    if (!response.ok)
      throw new Error("Erreur lors de la récupération des travaux");

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

  works.forEach((work) => {
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
    if (!response.ok)
      throw new Error("Erreur lors de la récupération des catégories");

    const categories = await response.json();
    displayFilters(categories);
  } catch (error) {
    console.error(error);
  }
}

/*** 📂 Charge les catégories dans la modal d'ajout de photo ***/
async function loadCategoriesForModal() {
  const categoryInput = document.getElementById("photo-category");
  if (!categoryInput) return;

  try {
    const response = await fetch("http://localhost:5678/api/categories");
    if (!response.ok)
      throw new Error("Erreur lors de la récupération des catégories");

    const categories = await response.json();
    categoryInput.innerHTML =
      '<option value="">Sélectionnez une catégorie</option>';

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      categoryInput.appendChild(option);
    });

    console.log("📂 Catégories chargées pour la modal :", categories);
  } catch (error) {
    console.error(
      "❌ Erreur lors du chargement des catégories pour la modal :",
      error
    );
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
  categories.forEach((category) => {
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
    const filteredWorks = works.filter(
      (work) => work.categoryId === categoryId
    );
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
        Authorization: `Bearer ${token}`,
      },
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
  if (openModal) {
    openModal.addEventListener("click", function () {
      if (checkUserLogin()) {
        modal.style.display = "block"; // Affiche la modal si connecté
      } else {
        alert("Vous devez être connecté pour accéder à cette fonctionnalité.");
      }
    });
  }

  // Fermer la modal
  if (modal && closeModal) {
    closeModal.addEventListener("click", function () {
      modal.style.display = "none";
    });

    // Fermer si on clique en dehors de la modal
    window.addEventListener("click", function (event) {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });
  }

  // Exemple pour ajouter une fonctionnalité au bouton "Ajouter une photo"
  addPhotoBtn.addEventListener("click", function () {
    if (checkUserLogin()) {
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

  works.forEach((work) => {
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

document.addEventListener("DOMContentLoaded", function () {
  const modalGallery = document.getElementById("modal-gallery");
  const modalAddPhoto = document.getElementById("modal-add-photo");

  if (modalAddPhoto && modalGallery) {
    modalAddPhoto.style.display = "none";
    modalGallery.style.display = "block";
  }

  const addPhotoBtn = document.querySelector(".add-photo-btn");
  const closeAddBtn = document.querySelector(".close-add");
  const fileInput = document.getElementById("photo-file");
  const titleInput = document.getElementById("photo-title");
  const categoryInput = document.getElementById("photo-category");
  const validateBtn = document.getElementById("validate-btn");
  const preview = document.getElementById("image-preview");

  /*** ✅ Remplace la modal galerie par celle d'ajout ***/
  addPhotoBtn.addEventListener("click", function () {
    modalGallery.style.display = "none";
    modalAddPhoto.style.display = "block";
    loadCategoriesForModal();
  });

  /*** ❌ Ferme la modal d'ajout et revient à la galerie ***/
  closeAddBtn.addEventListener("click", function () {
    modalAddPhoto.style.display = "none";
    modalGallery.style.display = "block";
  });

  /*** 📸 Affichage de l'aperçu de l'image sélectionnée ***/
  fileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; height:auto; border-radius:5px;">`;
      };
      reader.readAsDataURL(file);
    }
  });

  /*** 🎯 Vérifie que tous les champs sont remplis pour activer le bouton "Valider" ***/
  function checkFormCompletion() {
    if (
      fileInput.files.length > 0 &&
      titleInput.value.trim() !== "" &&
      categoryInput.value !== ""
    ) {
      validateBtn.disabled = false;
    } else {
      validateBtn.disabled = true;
    }
  }

  fileInput.addEventListener("change", checkFormCompletion);
  titleInput.addEventListener("input", checkFormCompletion);
  categoryInput.addEventListener("change", checkFormCompletion);

  /*** Envoi du formulaire et ajout de la photo ***/

  /*** ✅ Ajoute un projet à la galerie principale ***/
  function addWorkToGallery(work) {
    const gallery = document.querySelector(".gallery");

    const figure = document.createElement("figure");
    const img = document.createElement("img");

    // 🔹 Vérification et construction de l'URL complète
    const imageUrl = work.imageUrl.startsWith("http")
      ? work.imageUrl
      : `http://localhost:5678/images/${work.imageUrl}`;

    console.log("📸 Chemin final de l'image :", imageUrl);

    img.src = imageUrl;
    img.alt = work.title;

    const figcaption = document.createElement("figcaption");
    figcaption.textContent = work.title;

    figure.appendChild(img);
    figure.appendChild(figcaption);
    gallery.appendChild(figure);
  }

  /*** 📤 Envoi du formulaire et ajout de la photo ***/
  document
    .getElementById("add-photo-form")
    .addEventListener("submit", async function (event) {
      event.preventDefault();

      // 📂 Récupération des données du formulaire
      const file = document.getElementById("photo-file").files[0];
      let title = document.getElementById("photo-title").value.trim();
      let categoryId = Number(document.getElementById("photo-category").value);
      let userId = Number(sessionStorage.getItem("userId"));
      const token = sessionStorage.getItem("token");

      if (!token) {
        alert("❌ Vous devez être connecté pour ajouter une photo.");
        return;
      }

      // 🛑 Vérification des champs obligatoires
      if (!file || !title || isNaN(categoryId) || isNaN(userId)) {
        alert("❌ Veuillez remplir tous les champs !");
        return;
      }

      // 🔄 Renommage du fichier avec le titre
      title = title.replace(/[^a-zA-Z0-9-_]/g, "_").toLowerCase();
      const newFileName = `${title}.${file.name.split(".").pop()}`;
      const renamedFile = new File([file], newFileName, { type: file.type });

      console.log("📂 Fichier original :", file.name);
      console.log("🔄 Nouveau fichier :", renamedFile.name);

      // 📝 Construction des données à envoyer
      const formData = new FormData();
      formData.append("image", renamedFile); // ✅ L'API va générer `imageUrl`
      formData.append("title", title);
      formData.append("categoryId", Number(categoryId)); // ✅ Correct
      formData.append("userId", Number(userId)); // ✅ Correct

      console.log("📤 Données envoyées détaillées :");
      formData.forEach((value, key) => {
        console.log(`📝 ${key}:`, value);
      });

      let responseData = null; // 🔹 Déclare la variable avant le try

      try {
        const response = await fetch("http://localhost:5678/api/works", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData, // Envoi du fichier correctement
        });

        console.log("📩 Statut réponse API :", response.status);

        // Vérification avant de tenter d'extraire le JSON
        if (!response.ok) {
          console.error("❌ Erreur API (avant JSON) :", response);

          // 🔹 Récupérer et afficher le message d'erreur brut
          const responseText = await response.text();
          console.log("📜 Réponse brute API :", responseText);

          alert("Erreur API : " + response.status);
          return;
        }

        // 🔹 Si on arrive ici, response.ok est true → On peut récupérer le JSON
        responseData = await response.json();
        console.log("📜 Réponse complète API après ajout :", responseData);
      } catch (error) {
        console.error("❌ Erreur critique :", error);
        alert("❌ Une erreur inattendue est survenue.");
        return;
      }

      if (!responseData) {
        console.error("❌ Aucune donnée reçue de l'API.");
        return;
      }

      const newWork = responseData;
      console.log("✅ Nouvelle image ajoutée :", newWork);

      // ✅ Vérification que l'API retourne bien `imageUrl` et `id`
      if (!newWork.imageUrl || !newWork.id) {
        console.error(
          "⚠️ L'API n'a pas renvoyé `imageUrl` ou `id` correctement !"
        );
        alert(
          "L'image a été ajoutée, mais elle ne peut pas s'afficher correctement."
        );
        return;
      }

      // ✅ Affichage immédiat de l’image dans la galerie et la modal
      addWorkToGallery(newWork);
      addWorkToModal(newWork);

      console.log("🎉 Image ajoutée immédiatement à la galerie !");

      // ✅ Vérification et correction de `imageUrl` si nécessaire
      //if (!newWork.imageUrl.startsWith("http")) {
      //newWork.imageUrl = `http://localhost:5678/images/${newWork.imageUrl}`;
      //}
      //console.log("✅ URL corrigée :", newWork.imageUrl);

      // ✅ Recharge la galerie
      //fetchWorks();
      //console.log("🔄 Rechargement de la galerie après ajout...");

      // ✅ Réinitialisation du formulaire
      this.reset();
      document.getElementById(
        "image-preview"
      ).innerHTML = `<i class="fas fa-image"></i><p>+ Ajouter photo</p><span>jpg, png : 4mo max</span>`;
      document.getElementById("validate-btn").disabled = true;

      // ✅ Ferme la modal d'ajout et retourne à la galerie
      document.getElementById("modal-add-photo").style.display = "none";
      document.getElementById("modal-gallery").style.display = "block";
    });

  /*** ✅ Fonction d'ajout d'une image dans la galerie ***/
  function addWorkToGallery(work) {
    console.log("🖼️ Ajout de l’image dans la galerie :", work);

    const gallery = document.querySelector(".gallery");
    const figure = document.createElement("figure");
    const img = document.createElement("img");

    console.log("📸 Chemin final de l'image :", work.imageUrl);

    img.src = work.imageUrl;
    img.alt = work.title;

    const figcaption = document.createElement("figcaption");
    figcaption.textContent = work.title;

    figure.appendChild(img);
    figure.appendChild(figcaption);
    gallery.appendChild(figure);
  }

  /*** ✅ Fonction d'ajout d'une image dans la modal ***/
  function addWorkToModal(work) {
    const modalGallery = document.querySelector("#modal-gallery .gallery");

    const figure = document.createElement("figure");
    figure.classList.add("image-item");

    const img = document.createElement("img");

    console.log("📸 Chemin final de l'image (Modal) :", work.imageUrl);

    img.src = work.imageUrl;
    img.alt = work.title;

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener("click", () => deleteWork(work.id));

    figure.appendChild(img);
    figure.appendChild(deleteBtn);
    modalGallery.appendChild(figure);
  }
});
