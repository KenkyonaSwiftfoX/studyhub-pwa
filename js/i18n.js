// js/i18n.js — Système de traduction (FR / EN / RU) et gestionnaire de thème (Clair / Sombre)

const translations = {
  fr: {
    appSubtitle: "Le babillard d’entraide de ta promo — En temps réel — Disponible hors ligne",
    logoutBtn: "Se déconnecter",
    authTitle: "Espace Étudiant",
    authSubtitle: "Connectez-vous ou rejoignez la promotion",
    tabLogin: "Connexion",
    tabRegister: "Inscription",
    labelUsername: "Nom d'utilisateur",
    labelPassword: "Mot de passe",
    labelInviteCode: "Code d'accès promo",
    btnSubmitLogin: "Se connecter",
    btnSubmitRegister: "Rejoindre Study Hub",
    searchPlaceholder: "Rechercher par titre, tag ou auteur...",
    filterAll: "Tout",
    btnNewNote: "Nouvelle Note",
  },
  en: {
    appSubtitle: "Your cohort collaboration board — Real-time — Offline ready",
    logoutBtn: "Log out",
    authTitle: "Student Portal",
    authSubtitle: "Sign in or join your cohort",
    tabLogin: "Sign In",
    tabRegister: "Register",
    labelUsername: "Username",
    labelPassword: "Password",
    labelInviteCode: "Cohort access code",
    btnSubmitLogin: "Sign In",
    btnSubmitRegister: "Join Study Hub",
    searchPlaceholder: "Search by title, tag or author...",
    filterAll: "All",
    btnNewNote: "New Note",
  },
  ru: {
    appSubtitle: "Доска взаимопомощи вашей группы — В реальном времени — Оффлайн доступ",
    logoutBtn: "Выйти",
    authTitle: "Студенческий портал",
    authSubtitle: "Войдите или присоединитесь к группе",
    tabLogin: "Вход",
    tabRegister: "Регистрация",
    labelUsername: "Имя пользователя",
    labelPassword: "Пароль",
    labelInviteCode: "Код доступа группы",
    btnSubmitLogin: "Войти",
    btnSubmitRegister: "Присоединиться",
    searchPlaceholder: "Поиск по названию, тегу или автору...",
    filterAll: "Все",
    btnNewNote: "Новая заметка",
  },
};

let currentLang = localStorage.getItem("studyhub_lang") || "fr";
let currentTheme = localStorage.getItem("studyhub_theme") || "light";

export function t(key) {
  return translations[currentLang]?.[key] || translations.fr[key] || key;
}

export function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (el.tagName === "INPUT" && el.hasAttribute("placeholder")) {
      el.placeholder = t(key);
    } else {
      el.textContent = t(key);
    }
  });

  // Mise à jour visuelle des boutons de langue
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
  });
}

export function setLang(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem("studyhub_lang", lang);
  applyTranslations();
}

export function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("studyhub_theme", theme);

  const themeIcon = document.getElementById("themeIcon");
  if (themeIcon) {
    themeIcon.className = theme === "dark" ? "uil uil-sun" : "uil uil-moon";
  }
}

export function toggleTheme() {
  const next = currentTheme === "dark" ? "light" : "dark";
  applyTheme(next);
}

export function initI18nAndTheme() {
  applyTheme(currentTheme);
  applyTranslations();

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });

  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }
}
