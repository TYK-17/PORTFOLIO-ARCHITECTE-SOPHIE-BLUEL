document.addEventListener("DOMContentLoaded", () => {
  setupLoginLogout();
  fetchWorks();
  fetchCategories();
  setupAdminPanel();
  setupEditBar();
  setupModals();
});

/**
 * Vérifie si l'utilisateur est connecté
 */
function checkUserLogin() {
  return !!sessionStorage.getItem("token");
}

/* Gère l'affichage Login/Logout */
function setupLoginLogout() {
  const loginLogout = document.getElementById("login-logout");

  if (checkUserLogin()) {
    loginLogout.innerHTML = `<a href="#" id="logout">logout</a>`;
    document.getElementById("logout").addEventListener("click", () => {
      sessionStorage.clear();
      window.location.reload();
    });
  }
}

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

/* Affiche un message d'erreur */
function showErrorMessage(message) {
  const errorElement = document.querySelector("#error");
  if (errorElement) {
    errorElement.innerText = message;
    errorElement.style.display = "block";
  }
}

/* API CALLS - WORKS & CATEGORIES */

async function fetchWorks() {
  try {
    const response = await fetch("http://localhost:5678/api/works");
    if (!response.ok)
      throw new Error("Erreur lors de la récupération des travaux");

    const works = await response.json();
    displayWorks(works);
    displayModalGallery(works);
  } catch (error) {
    console.error(error);
    const translatedMessage = translateError(error.message);
    showErrorMessage(translatedMessage);
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
    console.error(error);
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
    categoryInput.innerHTML = '<option value=""></option>'; // Reset select

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      categoryInput.appendChild(option);
    });
  } catch (error) {
    console.error(error.message);
  }
}

/* DISPLAY WORKS, FILTERS, MODAL GALLERY */

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

  const allButton = createFilterButton("Tous", () => fetchWorks(), true);
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
    console.error(error);
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
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener("click", () => deleteWork(work.id));

    figure.appendChild(img);
    figure.appendChild(deleteBtn);
    modalGallery.appendChild(figure);
  });
}

function closeAllModals() {
  const modalGallery = document.getElementById("modal-gallery");
  const modalAddPhoto = document.getElementById("modal-add-photo");

  closeModal(modalGallery);
  closeModal(modalAddPhoto);

  // Remise à zéro uniquement si modalAddPhoto était ouverte
  if (modalAddPhoto.classList.contains("open")) {
    resetAddPhotoForm();
  }
}

/* DELETE WORK */

async function deleteWork(workId) {
  const token = sessionStorage.getItem("token");
  if (!token) return alert("Connectez-vous pour supprimer un projet.");

  try {
    const response = await fetch(`http://localhost:5678/api/works/${workId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Erreur lors de la suppression");
    fetchWorks();
    closeAllModals();
  } catch (error) {
    console.error(error);
    showErrorMessage(translateError(error.message));
  }
}

/* ADMIN MODE & EDIT BAR */

function setupAdminPanel() {
  const adminPanel = document.getElementById("admin-panel");
  const filters = document.querySelector(".filters");

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

  if (checkUserLogin()) {
    editBar.classList.remove("hidden");
    editBar.addEventListener("click", () => {
      openModal(modalGallery);
    });
  } else {
    editBar.classList.add("hidden");
  }
}

/* MODAL MANAGEMENT */

function setupModals() {
  const modalGallery = document.getElementById("modal-gallery");
  const modalAddPhoto = document.getElementById("modal-add-photo");
  const openModalBtn = document.getElementById("admin-panel");
  const closeModalGallery = document.querySelector(".modal .close");
  const addPhotoBtn = document.querySelector(".add-photo-btn");
  const closeAddBtn = document.querySelector(".close-add");
  const returnBtn = document.querySelector(".return-btn");

  const fileInput = document.getElementById("photo-file");
  const titleInput = document.getElementById("photo-title");
  const categoryInput = document.getElementById("photo-category");
  const validateBtn = document.getElementById("validate-btn");
  const preview = document.getElementById("image-preview");

  if (openModalBtn) {
    openModalBtn.addEventListener("click", () => {
      if (checkUserLogin()) openModal(modalGallery);
    });
  }

  closeModalGallery.addEventListener("click", () => closeModal(modalGallery));
  modalGallery.addEventListener("click", (e) => {
    if (e.target === modalGallery) closeModal(modalGallery);
  });

  addPhotoBtn.addEventListener("click", () => {
    console.log("Click détecté : ouverture de modalAddPhoto");
    closeModal(modalGallery);
    openModal(modalAddPhoto);
    loadCategoriesForModal();
    resetImagePreview();
  });

  closeAddBtn.addEventListener("click", () => {
    closeModal(modalAddPhoto);
    resetAddPhotoForm();
  });

  returnBtn.addEventListener("click", () => {
    closeModal(modalAddPhoto);
    resetAddPhotoForm();
    openModal(modalGallery);
  });

  modalAddPhoto.addEventListener("click", (e) => {
    if (e.target === modalAddPhoto) {
      closeModal(modalAddPhoto);
      resetAddPhotoForm();
      openModal(modalGallery);
    }
  });

  // Gestion fichier image upload
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (modalAddPhoto.classList.contains("open")) {
        resetAddPhotoForm();
      }

      const modals = document.querySelectorAll(".modal.open");
      modals.forEach((modal) => closeModal(modal));
    }
  });

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];

    // 1. Vérifier si un fichier a été sélectionné
    if (!file) {
      resetImagePreview();
      return;
    }

    // 2. Vérification du type (MIME type)
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      alert("Format invalide ! Veuillez choisir un fichier JPG ou PNG.");
      fileInput.value = ""; // Réinitialise le champ
      resetImagePreview();
      return;
    }

    // 3. Vérification de la taille (max 4 Mo)
    const maxSizeInBytes = 4 * 1024 * 1024; // 4 Mo
    if (file.size > maxSizeInBytes) {
      alert("Fichier trop volumineux ! Maximum 4 Mo.");
      fileInput.value = ""; // Réinitialise le champ
      resetImagePreview();
      return;
    }

    // 4. Aperçu si tout est ok
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.classList.add("has-image");
      preview.innerHTML = `<img src="${e.target.result}" alt="Aperçu de l'image" />`;
    };
    reader.readAsDataURL(file);
  });

  [fileInput, titleInput, categoryInput].forEach((input) => {
    input.addEventListener("input", checkFormCompletion);
  });

  document
    .getElementById("add-photo-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const file = fileInput.files[0];
      let title = titleInput.value.trim();
      const categoryId = categoryInput.value;
      const token = sessionStorage.getItem("token");

      if (!file) {
        alert("L'image est obligatoire !");
        return;
      }

      if (!title || !categoryId) {
        alert("Le titre et la catégorie sont obligatoires !");
        return;
      }

      title = title.replace(/[^a-zA-Z0-9-_]/g, "_").toLowerCase();
      const newFile = new File(
        [file],
        `${title}.${file.name.split(".").pop()}`,
        { type: file.type }
      );
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
        fetchWorks();
        closeAllModals();
        document.getElementById("add-photo-form").reset();
        resetImagePreview();
        validateBtn.disabled = true;
      } catch (error) {
        console.error(error);
        showErrorMessage(translateError(error.message));
      }
    });

  function checkFormCompletion() {
    validateBtn.disabled = !(
      fileInput.files.length &&
      titleInput.value.trim() &&
      categoryInput.value
    );
  }

  function resetImagePreview() {
    preview.classList.remove("has-image");
    preview.innerHTML = `
      <i class="fa-regular fa-image fa-4x"></i>
      <p>+ Ajouter photo</p>
      <span>jpg, png : 4mo max</span>
    `;
  }

  function resetAddPhotoForm() {
    document.getElementById("add-photo-form").reset();
    resetImagePreview();
    validateBtn.disabled = true;
  }
}

/* ADD WORK TO GALLERY & MODAL*/

function addWorkToGallery(work) {
  const gallery = document.querySelector(".gallery");
  const figure = document.createElement("figure");

  const img = document.createElement("img");
  img.src = work.imageUrl;
  img.alt = work.title;

  const figcaption = document.createElement("figcaption");
  figcaption.textContent = work.title;

  figure.appendChild(img);
  figure.appendChild(figcaption);
  gallery.appendChild(figure);
}

function addWorkToModal(work) {
  const modalGallery = document.querySelector("#modal-gallery .gallery");
  const figure = document.createElement("figure");
  figure.classList.add("image-item");

  const img = document.createElement("img");
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

function openModal(modalElement) {
  modalElement.classList.add("open");
}

function closeModal(modalElement) {
  if (modalElement && modalElement.classList.contains("open")) {
    modalElement.classList.remove("open");
  }
}
