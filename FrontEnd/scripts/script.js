// Lorsque le DOM est complètement chargé, on initialise l'application
document.addEventListener("DOMContentLoaded", () => {
  setupLoginLogout();
  initializeApp();
});

// Variables globales utilisées comme cache local
let cachedWorks = [];
let cachedCategories = [];

// INITIALIZATION
async function initializeApp() {
  try {
    await Promise.all([fetchWorks(), fetchCategories()]);
    setupAdminPanel();
    setupEditBar();
    setupModals();
  } catch (error) {
    console.error("Erreur d'initialisation :", error);
  }
}

// AUTHENTIFICATION
// Vérifie si l'utilisateur est connecté en regardant s'il y a un token dans sessionStorage
function checkUserLogin() {
  return !!sessionStorage.getItem("token");
}

// Gère l'affichage du bouton login/logout selon l'état de connexion de l'utilisateur
function setupLoginLogout() {
  const loginLogout = document.getElementById("login-logout");

  if (checkUserLogin()) {
    loginLogout.innerHTML = "";
    const logoutLink = document.createElement("a");
    logoutLink.href = "#";
    logoutLink.id = "logout";
    logoutLink.textContent = "logout";
    loginLogout.appendChild(logoutLink);

    logoutLink.addEventListener("click", () => {
      sessionStorage.clear();
      window.location.reload();
    });
  }
}

// MESSAGES
// Traduit les messages d'erreur techniques en français pour l'utilisateur
function translateError(message) {
  const errorMessages = {
    "Failed to fetch": "Vous êtes hors connexion",
    "Erreur lors de la récupération des travaux":
      "Impossible de charger les projets.",
    "Erreur lors de la récupération des catégories":
      "Impossible de charger les catégories.",
    "Erreur lors du filtrage": "Impossible d'afficher les projets filtrés.",
    "Erreur lors de la suppression": "Impossible de supprimer l'élément.",
    "Erreur lors de l'ajout": "Impossible d'ajouter le projet.",
  };
  return errorMessages[message] || message;
}

// Affiche un message d'erreur dans la zone prévue
function showErrorMessage(message) {
  const errorElement = document.querySelector("#error");
  if (errorElement) {
    errorElement.innerText = message;
    errorElement.style.display = message ? "block" : "none";
  }
}

// FETCH DATA (API CALLS)
async function fetchCategories() {
  try {
    const response = await fetch("http://localhost:5678/api/categories");
    if (!response.ok)
      throw new Error("Erreur lors de la récupération des catégories");

    cachedCategories = await response.json();

    displayFilters(cachedCategories);
  } catch (error) {
    showErrorMessage(translateError(error.message));
  }
}

function loadCategoriesForModal() {
  const categoryInput = document.getElementById("photo-category");

  if (!categoryInput) return;

  if (!cachedCategories.length) {
    showErrorMessage("Erreur lors de la récupération des catégories.");
    return;
  }

  categoryInput.innerHTML = ""; // Reset select
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  categoryInput.appendChild(emptyOption);

  cachedCategories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categoryInput.appendChild(option);
  });
}

// DISPLAY DATA
// Affiche les projets dans la galerie principale
function displayWorks(works) {
  const gallery = document.querySelector(".gallery");
  gallery.innerHTML = "";

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

// Affiche les boutons filtres pour les catégories
function displayFilters(categories) {
  const filterContainer = document.querySelector(".filters");
  filterContainer.innerHTML = "";

  const allButton = createFilterButton("Tous", () => filterWorks(null), true);
  filterContainer.appendChild(allButton);

  // Parcourt chaque catégorie et crée un bouton de filtre correspondant
  categories.forEach((category) => {
    const button = createFilterButton(category.name, () =>
      filterWorks(category.id)
    );
    filterContainer.appendChild(button);
  });
}

// Crée un bouton de filtre avec gestion des clics
function createFilterButton(label, onClick, isActive = false) {
  const button = document.createElement("button");
  button.textContent = label;
  button.classList.add("filter-btn");
  if (isActive) button.classList.add("active");

  button.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-btn")
      .forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    onClick();
  });

  return button;
}

async function fetchWorks() {
  try {
    const response = await fetch("http://localhost:5678/api/works");
    if (!response.ok)
      throw new Error("Erreur lors de la récupération des travaux");

    cachedWorks = await response.json();
    displayWorks(cachedWorks);
    displayModalGallery(cachedWorks);
  } catch (error) {
    showErrorMessage(translateError(error.message));
  }
}

// Fonction qui filtre les projets selon la catégorie sélectionnée
function filterWorks(categoryId) {
  const filteredWorks = categoryId
    ? cachedWorks.filter((work) => work.categoryId === categoryId)
    : cachedWorks;

  displayWorks(filteredWorks);
}

// Fonction qui affiche les projets dans la galerie modale d'administration
function displayModalGallery(works) {
  const modalGallery = document.querySelector("#modal-gallery .gallery");
  modalGallery.innerHTML = "";

  works.forEach((work) => {
    const figure = document.createElement("figure");
    figure.classList.add("image-item");

    const img = document.createElement("img");
    img.src = work.imageUrl;
    img.alt = work.title;

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");

    const icon = document.createElement("i");
    icon.classList.add("fas", "fa-trash");

    deleteBtn.appendChild(icon);
    deleteBtn.addEventListener("click", () => deleteWork(work.id));

    figure.appendChild(img);
    figure.appendChild(deleteBtn);
    modalGallery.appendChild(figure);
  });
}

// DELETE WORK
// Supprime un projet en appelant l'API
async function deleteWork(workId) {
  const token = sessionStorage.getItem("token");

  // Vérifie si l'utilisateur est connecté (token présent)
  if (!token) {
    alert("Connectez-vous pour supprimer un projet.");
    return;
  }

  try {
    const response = await fetch(`http://localhost:5678/api/works/${workId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Erreur lors de la suppression");
    fetchWorks();
    closeAllModals();
  } catch (error) {
    showErrorMessage(translateError(error.message));
  }
}

// ADMIN PANEL & EDIT BAR
// Fonction qui affiche ou masque le panneau d'administration et les filtres
function setupAdminPanel() {
  const adminPanel = document.getElementById("admin-panel");
  const filters = document.querySelector(".filters");

  // Si les éléments ne sont pas trouvés, on arrête la fonction
  if (!adminPanel || !filters) return;

  // Si l'utilisateur est connecté (mode admin)
  if (checkUserLogin()) {
    adminPanel.style.display = "block";
    filters.style.display = "none";
  } else {
    adminPanel.style.display = "none";
    filters.style.display = "flex";
  }
}

function setupEditBar() {
  const editBar = document.getElementById("edit-bar");
  const modalGallery = document.getElementById("modal-gallery");

  if (!editBar || !modalGallery) return;

  if (checkUserLogin()) {
    editBar.classList.remove("hidden");

    // Supprime les anciens listeners en clonant l'élément
    const newEditBar = editBar.cloneNode(true);
    editBar.parentNode.replaceChild(newEditBar, editBar);

    newEditBar.addEventListener("click", () => {
      openModal(modalGallery);
    });
  } else {
    editBar.classList.add("hidden");
  }
}

// Fonction qui gère la sélection et l'affichage d'un fichier image dans le formulaire d'ajout de photo
function handleFileInput(event) {
  const preview = document.getElementById("image-preview");
  const fileInput = event.target;
  const file = fileInput.files[0];

  if (!file) {
    resetImagePreview(preview);
    return;
  }

  // Liste des types de fichiers autorisés
  const allowedTypes = ["image/jpeg", "image/png"];
  const maxSizeInBytes = 4 * 1024 * 1024;

  // Vérifie si le type du fichier sélectionné est valide (JPEG ou PNG)
  if (!allowedTypes.includes(file.type)) {
    alert("Format invalide ! JPG ou PNG requis.");
    fileInput.value = "";
    resetImagePreview(preview);
    return;
  }

  // Vérifie si le fichier est trop volumineux
  if (file.size > maxSizeInBytes) {
    alert("Fichier trop volumineux ! Maximum 4 Mo.");
    fileInput.value = "";
    resetImagePreview(preview);
    return;
  }

  // Crée un objet FileReader pour lire le contenu du fichier
  const reader = new FileReader();
  reader.onload = (e) => {
    preview.classList.add("has-image");
    preview.innerHTML = "";

    const imgPreview = document.createElement("img");
    imgPreview.src = e.target.result;
    imgPreview.alt = "Aperçu de l'image";

    preview.appendChild(imgPreview);
  };

  reader.readAsDataURL(file);
}

// MODAL MANAGEMENT
function setupModals() {
  const modalGallery = document.getElementById("modal-gallery");
  const modalAddPhoto = document.getElementById("modal-add-photo");

  const adminPanel = document.getElementById("admin-panel");
  const addPhotoBtn = document.querySelector(".add-photo-btn");
  const closeAddBtn = document.querySelector(".close-add");
  const returnBtn = document.querySelector(".return-btn");

  const fileInput = document.getElementById("photo-file");
  const titleInput = document.getElementById("photo-title");
  const categoryInput = document.getElementById("photo-category");
  const validateBtn = document.getElementById("validate-btn");
  const preview = document.getElementById("image-preview");

  // CLICK SUR LE BOUTON "MODIFIER"
  if (adminPanel && modalGallery) {
    adminPanel.addEventListener("click", () => {
      openModal(modalGallery);
    });
  }

  // Fermeture de la modale gallery (icone croix)
  const closeModalGalleryBtn = document.querySelector(".modal .close");
  if (closeModalGalleryBtn && modalGallery) {
    closeModalGalleryBtn.addEventListener("click", () => {
      closeModal(modalGallery);
    });
  }

  // Vérifie si la modale galerie existe
  if (modalGallery) {
    modalGallery.addEventListener("click", (e) => {
      if (e.target === modalGallery) {
        closeModal(modalGallery);
      }
    });
  }

  // Ajout photo
  if (addPhotoBtn) {
    addPhotoBtn.addEventListener("click", () => {
      closeModal(modalGallery);
      openModal(modalAddPhoto);
      loadCategoriesForModal();
      resetAddPhotoForm();
    });
  }

  // Fermer modale ajout photo
  if (closeAddBtn) {
    closeAddBtn.addEventListener("click", () => {
      closeModal(modalAddPhoto);
      resetAddPhotoForm();
    });
  }

  // Retour vers la galerie depuis modale ajout photo
  if (returnBtn) {
    returnBtn.addEventListener("click", () => {
      closeModal(modalAddPhoto);
      resetAddPhotoForm();
      openModal(modalGallery);
    });
  }

  // Escape key => fermer toutes les modales
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal(modalGallery);
      closeModal(modalAddPhoto);
      resetAddPhotoForm();
    }
  });

  // Fichier + formulaire
  if (fileInput) {
    fileInput.addEventListener("change", (event) => {
      handleFileInput(event);
      checkFormCompletion(fileInput, titleInput, categoryInput, validateBtn);
    });
  }

  // Boucle sur tous les champs du formulaire (fichier, titre, catégorie)
  [fileInput, titleInput, categoryInput].forEach((input) => {
    if (input) {
      input.addEventListener("input", () =>
        checkFormCompletion(fileInput, titleInput, categoryInput, validateBtn)
      );
    }
  });

  // Sélectionne le formulaire complet d'ajout de photo
  const addPhotoForm = document.getElementById("add-photo-form");
  if (addPhotoForm) {
    addPhotoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await submitNewPhoto(fileInput, titleInput, categoryInput, validateBtn);
    });
  }
}

// Vérifie si tous les champs du formulaire sont remplis pour activer le bouton de validation
function checkFormCompletion(fileInput, titleInput, categoryInput) {
  const validateBtn = document.getElementById("validate-btn");
  validateBtn.disabled = !(
    fileInput.files.length &&
    titleInput.value.trim() &&
    categoryInput.value
  );
}

// Soumet une nouvelle photo au serveur après vérification et préparation des données
async function submitNewPhoto(fileInput, titleInput, categoryInput) {
  const file = fileInput.files[0];
  const title = titleInput.value
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .toLowerCase();
  const categoryId = categoryInput.value;
  const token = sessionStorage.getItem("token");

  // Vérifie que tous les champs sont remplis
  if (!file || !title || !categoryId) {
    alert("Tous les champs sont obligatoires !");
    return;
  }

  // Crée un nouveau fichier en renommant avec le titre et en conservant l'extension d'origine
  const newFile = new File([file], `${title}.${file.name.split(".").pop()}`, {
    type: file.type,
  });
  // Prépare l'objet FormData pour envoyer les données sous forme multipart/form-data
  const formData = new FormData();
  formData.append("image", newFile);
  formData.append("title", title);
  formData.append("category", categoryId);

  try {
    const response = await fetch("http://localhost:5678/api/works", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    // Si la réponse est mauvaise (statut HTTP non 200), on lève une erreur
    if (!response.ok) throw new Error("Erreur lors de l'ajout");
    await fetchWorks();
    closeAllModals();
  } catch (error) {
    showErrorMessage(translateError(error.message));
  }
}

// Réinitialise l'aperçu de l'image dans le formulaire d'ajout
function resetImagePreview(preview) {
  preview.classList.remove("has-image");
  preview.innerHTML = `
    <i class="fa-regular fa-image fa-4x"></i>
    <p>+ Ajouter photo</p>
    <span>jpg, png : 4mo max</span>
  `;
}

// Réinitialise complètement le formulaire d'ajout de photo
function resetAddPhotoForm() {
  const addPhotoForm = document.getElementById("add-photo-form");
  const fileInput = document.getElementById("photo-file");
  const preview = document.getElementById("image-preview");
  const validateBtn = document.getElementById("validate-btn");

  addPhotoForm.reset();
  fileInput.value = "";

  resetImagePreview(preview);

  validateBtn.disabled = true;
}

// Ouvre une modale spécifique
function openModal(modalElement) {
  modalElement.classList.add("open");
}

// Ferme une modale spécifique
function closeModal(modalElement) {
  if (modalElement && modalElement.classList.contains("open")) {
    modalElement.classList.remove("open");
  }
}

// Ferme toutes les modales ouvertes
function closeAllModals() {
  closeModal(document.getElementById("modal-gallery"));
  closeModal(document.getElementById("modal-add-photo"));
  resetAddPhotoForm();
}
