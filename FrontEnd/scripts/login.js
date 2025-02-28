document.addEventListener("DOMContentLoaded", () => {
  setupLogin();
  checkUserLogin(); // Vérifie si l'utilisateur est connecté au chargement de la page
});

/**
 * Gère la connexion de l'utilisateur
 */
function setupLogin() {
  const form = document.getElementById("login");

  if (!form) return; // Vérifie que le formulaire existe

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitButton = form.querySelector('input[type="submit"]');
    submitButton.value = "Connexion en cours...";
    submitButton.disabled = true;

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      showError("Veuillez remplir tous les champs !");
      resetSubmitButton(submitButton);
      return;
    }

    try {
      const response = await fetch("http://localhost:5678/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Identifiants incorrects !");
      }

      const data = await response.json();
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("userId", data.userId);

      form.reset(); // Réinitialise le formulaire
      window.location.href = "index.html"; // Redirection après connexion
    } catch (error) {
      showError(error.message);
    } finally {
      resetSubmitButton(submitButton);
    }
  });
}

/**
 * Vérifie si l'utilisateur est connecté et met à jour l'interface
 */
function checkUserLogin() {
  const token = sessionStorage.getItem("token");
  const loginButton = document.querySelector(".log-in-out");

  if (token) {
    loginButton.innerHTML = `<a href="#" id="logout">Logout</a>`;
    document.getElementById("logout").addEventListener("click", logoutUser);
  }
}

/**
 * Gère la déconnexion de l'utilisateur
 */
function logoutUser() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("userId");
  window.location.href = "login.html"; // Redirection vers la page de connexion
}

/**
 * Affiche un message d'erreur en cas d'échec de connexion
 */
function showError(message) {
  const errorMessage = document.getElementById("error-login");
  errorMessage.textContent = message;
  errorMessage.style.color = "red";
  errorMessage.style.marginTop = "1rem";
  errorMessage.style.fontWeight = "bold";
}

/**
 * Réinitialise le bouton de soumission après la connexion
 */
function resetSubmitButton(button) {
  button.value = "Se connecter";
  button.disabled = false;
}

/**
 * Ajoute un projet (requête `POST /works`)
 */
async function addWork(image, title, category) {
  const token = sessionStorage.getItem("token");

  if (!token) {
    alert("Vous devez être connecté pour ajouter un projet.");
    return;
  }

  const formData = new FormData();
  formData.append("image", image);
  formData.append("title", title);
  formData.append("category", category);

  try {
    const response = await fetch("http://localhost:5678/api/works", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Erreur lors de l'ajout du projet.");
    }

    alert("Projet ajouté avec succès !");
  } catch (error) {
    console.error(error);
  }
}

/**
 * Supprime un projet (requête `DELETE /works/{id}`)
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
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la suppression du projet.");
    }

    alert("Projet supprimé avec succès !");
  } catch (error) {
    console.error(error);
  }
}
