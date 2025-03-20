document.addEventListener("DOMContentLoaded", () => {
  setupLogin();
});

/* Gère la connexion de l'utilisateur */
function setupLogin() {
  const form = document.getElementById("login");

  if (!form) return;

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

      form.reset();
      window.location.href = "index.html";
    } catch (error) {
      console.error(error);
      if (error.message === "Failed to fetch") {
        showError("Vous êtes hors connexion");
      } else {
        showError(error.message);
      }
    } finally {
      resetSubmitButton(submitButton);
    }
  });
}

function showError(message) {
  const errorMessage = document.getElementById("error-login");
  errorMessage.textContent = message;
  errorMessage.style.color = "red";
  errorMessage.style.marginTop = "1rem";
  errorMessage.style.fontWeight = "bold";
  errorMessage.style.display = "block";
}

function resetSubmitButton(button) {
  button.value = "Se connecter";
  button.disabled = false;
}
