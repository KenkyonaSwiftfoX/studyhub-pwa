/**
 * Génère un identifiant unique universel compatible HTTP, HTTPS et mobiles
 */
export function generateUUID() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch (e) {}
  }
  return "id-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
}

/**
 * Gère l'ouverture d'une modale
 */
export function openModal(modalElement) {
  if (!modalElement) return;
  modalElement.classList.add("active");
  modalElement.style.display = "flex";
  document.body.style.overflow = "hidden";
}

/**
 * Gère la fermeture d'une modale
 */
export function closeModal(modalElement, formElement = null) {
  if (!modalElement) return;
  modalElement.classList.remove("active");
  modalElement.style.display = "none";
  document.body.style.overflow = "auto";
  if (formElement) {
    formElement.reset();
  }
}
