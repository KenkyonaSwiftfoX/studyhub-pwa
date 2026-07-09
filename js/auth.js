// js/auth.js — Client d'authentification pour Study Hub (PHP SQLite + repli local)

const REQUIRED_INVITE_CODE = "LPDWCA-2026";

export function initAuth({ onLoginSuccess, onLogout }) {
  const authContainer = document.getElementById("authContainer");
  const appContainer = document.getElementById("appContainer");
  const userProfileBadge = document.getElementById("userProfileBadge");
  const userProfileName = document.getElementById("userProfileName");
  const logoutBtn = document.getElementById("logoutBtn");

  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const authMessage = document.getElementById("authMessage");

  let currentUser = JSON.parse(localStorage.getItem("studyhub_user") || "null");

  function showMessage(msg, isError = true) {
    authMessage.textContent = msg;
    authMessage.className = `auth-message ${isError ? "error" : "success"}`;
  }

  function clearMessage() {
    authMessage.textContent = "";
    authMessage.className = "auth-message";
  }

  function renderAuthState() {
    if (currentUser) {
      authContainer.classList.add("hidden");
      appContainer.classList.remove("hidden");
      userProfileBadge.classList.remove("hidden");
      userProfileName.innerHTML = `<i class="uil uil-user-circle"></i> ${currentUser.username}`;
      window.currentUser = currentUser;
      if (onLoginSuccess) onLoginSuccess(currentUser);
    } else {
      authContainer.classList.remove("hidden");
      appContainer.classList.add("hidden");
      userProfileBadge.classList.add("hidden");
      window.currentUser = null;
    }
  }

  // Bascule entre les onglets Connexion et Inscription
  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    clearMessage();
  });

  tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    clearMessage();
  });

  // Soumission Inscription
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const username = document.getElementById("regUsername").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const inviteCode = document
      .getElementById("regInviteCode")
      .value.trim()
      .toUpperCase();

    if (inviteCode !== REQUIRED_INVITE_CODE) {
      showMessage("Code d'accès promo incorrect.");
      return;
    }

    try {
      const res = await fetch("api/register.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, inviteCode }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          currentUser = data.user;
          localStorage.setItem("studyhub_user", JSON.stringify(currentUser));
          renderAuthState();
          return;
        } else {
          showMessage(data.message || "Erreur lors de l'inscription.");
          return;
        }
      }
      // Si l'API PHP n'est pas joignable (ex: Live Server statique), repli local
      throw new Error("PHP offline");
    } catch (err) {
      // Repli local pour démo sans serveur PHP
      const localUsers = JSON.parse(
        localStorage.getItem("studyhub_users_db") || "[]",
      );
      if (localUsers.some((u) => u.username === username)) {
        showMessage("Ce nom d'utilisateur existe déjà.");
        return;
      }
      const newUser = { id: Date.now(), username, password };
      localUsers.push(newUser);
      localStorage.setItem("studyhub_users_db", JSON.stringify(localUsers));
      currentUser = { id: newUser.id, username: newUser.username };
      localStorage.setItem("studyhub_user", JSON.stringify(currentUser));
      renderAuthState();
    }
  });

  // Soumission Connexion
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    try {
      const res = await fetch("api/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          currentUser = data.user;
          localStorage.setItem("studyhub_user", JSON.stringify(currentUser));
          renderAuthState();
          return;
        } else {
          showMessage(data.message || "Identifiants incorrects.");
          return;
        }
      }
      throw new Error("PHP offline");
    } catch (err) {
      // Repli local pour démo sans serveur PHP
      const localUsers = JSON.parse(
        localStorage.getItem("studyhub_users_db") || "[]",
      );
      const found = localUsers.find(
        (u) => u.username === username && u.password === password,
      );
      if (found) {
        currentUser = { id: found.id, username: found.username };
        localStorage.setItem("studyhub_user", JSON.stringify(currentUser));
        renderAuthState();
      } else {
        showMessage("Nom d'utilisateur ou mot de passe incorrect.");
      }
    }
  });

  // Déconnexion
  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch("api/logout.php");
    } catch (e) {}
    currentUser = null;
    localStorage.removeItem("studyhub_user");
    renderAuthState();
    if (onLogout) onLogout();
  });

  renderAuthState();
}
