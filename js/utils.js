// js/utils.js
// js/utils.js

/**
 * Gère l'ouverture d'une modale
 */
export function openModal(modalElement) {
  if (!modalElement) return;
  modalElement.classList.add("active");
  document.body.style.overflow = "hidden";
}

/**
 * Gère la fermeture d'une modale
 */
export function closeModal(modalElement, formElement = null) {
  if (!modalElement) return;
  modalElement.classList.remove("active");
  document.body.style.overflow = "auto";
  if (formElement) {
    formElement.reset();
  }
}
