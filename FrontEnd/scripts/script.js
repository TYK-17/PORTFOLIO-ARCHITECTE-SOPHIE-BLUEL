document.addEventListener("DOMContentLoaded", () => {
  setupLoginLogout();
  initializeApp();
});

// ==========================
// INITIALIZATION
// ==========================
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

// ==========================
// AUTHENTIFICATION
// ==========================
function checkUserLogin() {
  return !!sessionStorage.getItem("token");
}

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

// ==========================
// MESSAGES
// ==========================
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

function showErrorMessage(message) {
  const errorElement = document.querySelector("#error");
  if (errorElement) {
    errorElement.innerText = message;
    errorElement.style.display = "block";
  }
}

// ==========================
// FETCH DATA (API CALLS)
// ==========================
async function fetchWorks() {
  try {
    const response = await fetch("http://localhost:5678/api/works");
    if (!response.ok)
      throw new Error("Erreur lors de la récupération des travaux");
    const works = await response.json();
    displayWorks(works);
    displayModalGallery(works);
  } catch (error) {
    showErrorMessage(translateError(error.message));
  }
}

async function fetchCategories() {
  try {
    const response = await fetch("http://localhost:5678/api/categories");
    if (!response.ok)
      throw new Error("Erreur lors de la récupération des catégories");
    const categories = await response.json();
    displayFilters(categories);
  } catch (error) {
    showErrorMessage(translateError(error.message));
  }
}

async function loadCategoriesForModal() {
  const categoryInput = document.getElementById("photo-category");
  if (!categoryInput) return;

  try {
    const response = await fetch("http://localhost:5678/api/categories");
    if (!response.ok)
      throw new Error("Erreur lors de la récupération des catégories");
    const categories = await response.json();

    categoryInput.innerHTML = ""; // Reset select
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    categoryInput.appendChild(emptyOption);

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      categoryInput.appendChild(option);
    });
  } catch (error) {
    showErrorMessage(translateError(error.message));
  }
}

// ==========================
// DISPLAY DATA
// ==========================
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

function displayFilters(categories) {
  const filterContainer = document.querySelector(".filters");
  filterContainer.innerHTML = "";

  const allButton = createFilterButton("Tous", fetchWorks, true);
  filterContainer.appendChild(allButton);

  categories.forEach((category) => {
    const button = createFilterButton(category.name, () =>
      filterWorks(category.id)
    );
    filterContainer.appendChild(button);
  });
}

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
    showErrorMessage(translateError(error.message));
  }
}

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

// ==========================
// DELETE WORK (SECURED)
// ==========================
async function deleteWork(workId) {
  const token = sessionStorage.getItem("token");
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

// ==========================
// ADMIN PANEL & EDIT BAR
// ==========================
function setupAdminPanel() {
  const adminPanel = document.getElementById("admin-panel");
  const filters = document.querySelector(".filters");

  if (!adminPanel || !filters) return;

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

function handleFileInput(event) {
  const preview = document.getElementById("image-preview");
  const fileInput = event.target;
  const file = fileInput.files[0];

  if (!file) {
    resetImagePreview(preview);
    return;
  }

  const allowedTypes = ["image/jpeg", "image/png"];
  const maxSizeInBytes = 4 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    alert("Format invalide ! JPG ou PNG requis.");
    fileInput.value = "";
    resetImagePreview(preview);
    return;
  }

  if (file.size > maxSizeInBytes) {
    alert("Fichier trop volumineux ! Maximum 4 Mo.");
    fileInput.value = "";
    resetImagePreview(preview);
    return;
  }

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

// ==========================
// MODAL MANAGEMENT
// ==========================
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

  [fileInput, titleInput, categoryInput].forEach((input) => {
    if (input) {
      input.addEventListener("input", () =>
        checkFormCompletion(fileInput, titleInput, categoryInput, validateBtn)
      );
    }
  });

  const addPhotoForm = document.getElementById("add-photo-form");
  if (addPhotoForm) {
    addPhotoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await submitNewPhoto(fileInput, titleInput, categoryInput, validateBtn);
    });
  }
}

function checkFormCompletion(fileInput, titleInput, categoryInput) {
  const validateBtn = document.getElementById("validate-btn");
  validateBtn.disabled = !(
    fileInput.files.length &&
    titleInput.value.trim() &&
    categoryInput.value
  );
}

async function submitNewPhoto(fileInput, titleInput, categoryInput) {
  const file = fileInput.files[0];
  const title = titleInput.value
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .toLowerCase();
  const categoryId = categoryInput.value;
  const token = sessionStorage.getItem("token");

  if (!file || !title || !categoryId) {
    alert("Tous les champs sont obligatoires !");
    return;
  }

  const newFile = new File([file], `${title}.${file.name.split(".").pop()}`, {
    type: file.type,
  });
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
    if (!response.ok) throw new Error("Erreur lors de l'ajout");
    await fetchWorks();
    closeAllModals();
  } catch (error) {
    showErrorMessage(translateError(error.message));
  }
}

function resetImagePreview(preview) {
  preview.classList.remove("has-image");
  preview.innerHTML = `
    <i class="fa-regular fa-image fa-4x"></i>
    <p>+ Ajouter photo</p>
    <span>jpg, png : 4mo max</span>
  `;
}

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

function openModal(modalElement) {
  modalElement.classList.add("open");
}

function closeModal(modalElement) {
  if (modalElement && modalElement.classList.contains("open")) {
    modalElement.classList.remove("open");
  }
}

function closeAllModals() {
  closeModal(document.getElementById("modal-gallery"));
  closeModal(document.getElementById("modal-add-photo"));
  resetAddPhotoForm();
}
