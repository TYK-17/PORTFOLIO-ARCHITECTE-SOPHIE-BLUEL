document.addEventListener("DOMContentLoaded", () => {
    setupLogin();
});

/**
 * Gère la connexion de l'utilisateur
 */
function setupLogin() {
    const form = document.getElementById("login");
    
    if (!form) return; // Vérifie que le formulaire existe

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("http://localhost:5678/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error("Identifiants incorrects !");
            }

            const data = await response.json();
            sessionStorage.setItem("token", data.token);
            sessionStorage.setItem("userId", data.userId);

            window.location.href = "index.html"; // Redirection après connexion
        } catch (error) {
            showError(error.message);
        }
    });
}

/**
 * Affiche un message d'erreur en cas d'échec de connexion
 */
function showError(message) {
    const errorMessage = document.getElementById("error-login");
    errorMessage.textContent = message;
    errorMessage.style.color = "red";
}
