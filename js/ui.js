/**
 * js/ui.js — Module de rendu visuel (Vues HTML dynamique et sécurisées)
 * Contient les fonctions de formatage de dates, de sélection d'icônes/classes
 * selon les tags, et de génération du DOM sécurisé contre les failles XSS.
import { getCurrentUserId } from "./posts.js";

/**
 * Formate une date ISO en chaîne lisible (format français)
 */
export function formatDate(dateString) {
  return new Date(dateString).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getTagClass(tag) {
  const classes = {
    entraide: "tag-entraide",
    ressources: "tag-ressources",
    infosPromo: "tag-infosPromo",
    flashcards: "tag-flashcards",
    reunion: "tag-reunion",
    cours: "tag-cours",
    urgence: "tag-urgence",
  };
  return classes[tag] || "";
}

export function getTagName(tag) {
  const names = {
    entraide: "Entraide",
    ressources: "Ressources",
    infosPromo: "Infos Promo",
    flashcards: "Flashcards",
    reunion: "Réunion",
    cours: "Cours",
    urgence: "Urgence",
  };
  return names[tag] || tag;
}

/**
 * Retourne un temps relatif court ("à l'instant", "8m", "3h", "2j")
 * pour imiter l'affichage type "réseau social" façon Padlet
 */
export function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}j`;
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function getTagIcon(tag) {
  const icons = {
    entraide: '<i class="uil uil-users-alt"></i>',
    ressources: '<i class="uil uil-book-open"></i>',
    infosPromo: '<i class="uil uil-megaphone"></i>',
    flashcards: '<i class="uil uil-layer-group"></i>',
    reunion: '<i class="uil uil-video"></i>',
    cours: '<i class="uil uil-graduation-cap"></i>',
    urgence: '<i class="uil uil-exclamation-triangle"></i>',
  };
  return icons[tag] || "";
}

/**
 * Échappe les caractères spéciaux HTML afin de prévenir les attaques XSS
 */
export function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Met à jour l'état de l'affichage si la liste est vide
 */
export function updateEmptyState(emptyStateElement, notesToCheck) {
  if (emptyStateElement) {
    emptyStateElement.style.display =
      notesToCheck.length === 0 ? "block" : "none";
  }
}

function isPostLikedByUser(note) {
  try {
    if (!note || !note.reactions) return false;
    const likedBy = note.reactions.likedBy;
    if (!Array.isArray(likedBy)) return false;
    return likedBy.includes(getCurrentUserId());
  } catch (e) {
    return false;
  }
}

/**
 * Génère le HTML des cartes de notes et l'injecte dans le conteneur
 */
function renderAttachment(att) {
  if (!att) return "";
  const name = escapeHtml(att.name || "Fichier joint");
  const size = escapeHtml(att.size || "");
  const url = att.url || "";

  const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(att.name || "") || (url && url.startsWith("data:image/"));

  let html = "";
  if (isImage && url) {
    html += `<img src="${url}" alt="${name}" class="attachment-image-preview" title="Cliquez pour télécharger ${name}" onclick="const a=document.createElement('a');a.href=this.src;a.download='${name}';a.click();">`;
  }

  if (url) {
    html += `
      <a href="${url}" download="${name}" class="attachment-card" title="Télécharger ${name}">
        <i class="uil uil-import" style="font-size:1.4rem; color:var(--primary);"></i>
        <div class="attachment-info">
          <strong>${name}</strong>
          <small>${size} — Télécharger</small>
        </div>
      </a>`;
  } else {
    html += `
      <div class="attachment-card">
        <i class="uil uil-file"></i>
        <div class="attachment-info">
          <strong>${name}</strong>
          <small>${size}</small>
        </div>
      </div>`;
  }
  return html;
}

export function renderNotes(
  container,
  notesToRender,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
) {
  if (!container) return;
  container.innerHTML = "";

  // Tri : les notes épinglées (pinned) apparaissent en premier
  const sorted = [...notesToRender].sort(
    (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0),
  );

  sorted.forEach((note) => {
    try {
      if (!note || !note.id) return;
      const card = document.createElement("article");
      card.className = `note-card fade-in ${note.pinned ? "pinned" : ""}`;

      // Configuration du Drag & Drop
      card.draggable = true;
      card.dataset.id = note.id;
      card.addEventListener("dragstart", onDragStart);
      card.addEventListener("dragover", onDragOver);
      card.addEventListener("drop", onDrop);
      card.addEventListener("dragend", onDragEnd);

      const tagList = note.tags && note.tags.length ? note.tags : [];
      const primaryTag = tagList[0];

      const escapedTitle = escapeHtml(note.title || "Sans titre");
      const escapedContent = escapeHtml(note.content || "");
      const likedClass = isPostLikedByUser(note) ? "liked" : "";

      card.innerHTML = `
        <div class="note-content">
          <div class="note-author">
            <div class="note-avatar ${primaryTag ? getTagClass(primaryTag) : ""}">
              ${primaryTag ? getTagIcon(primaryTag) : '<i class="uil uil-user"></i>'}
            </div>
            <div class="note-author-info">
              <span class="note-author-name">${escapeHtml(note.author || "Étudiant promo")}</span>
              <span class="note-time">${timeAgo(note.createdAt)}</span>
            </div>
            <div class="note-actions">
              <button class="menu-btn" data-id="${note.id}">
                <i class="uil uil-ellipsis-v"></i>
              </button>
              <div class="card-menu hidden" id="menu-${note.id}">
                <button class="edit-btn" data-id="${note.id}">
                  <i class="uil uil-edit"></i> Modifier
                </button>
                <button class="copy-btn" data-id="${note.id}">
                  <i class="uil uil-copy"></i> Copier le texte
                </button>
                <button class="delete-btn" data-id="${note.id}">
                  <i class="uil uil-trash"></i> Supprimer
                </button>
              </div>
            </div>
          </div>
          <div class="note-header">
            <h3 class="note-title">${escapedTitle}</h3>
          </div>
          <div class="note-body">
            <p class="note-text">${escapedContent}</p>
          </div>
          <div class="note-tags">
            ${
              note.tags && Array.isArray(note.tags)
                ? note.tags
                    .map(
                      (tag) => `
              <span class="note-tag ${getTagClass(tag)}">
                ${getTagIcon(tag)} ${getTagName(tag)}
              </span>`,
                    )
                    .join("")
                : ""
            }
          </div>
          <div class="note-file">
            ${
              note.attachments?.length
                ? renderAttachment(note.attachments[0])
                : ""
            }
          </div>
          <div class="note-social">
            <button class="reaction-btn ${likedClass}" data-id="${note.id}">
              <i class="uil uil-heart"></i>
              <span>${note.reactions?.heart || 0}</span>
            </button>
            <button class="comment-btn" data-id="${note.id}">
              <i class="uil uil-comment"></i>
              <span>${note.comments?.length || 0}</span>
            </button>
            <span class="note-date" title="${formatDate(note.createdAt)}">${timeAgo(note.createdAt)}</span>
          </div>
          <div class="comments-container hidden" id="comments-${note.id}">
            <div class="comments-list">
              ${(Array.isArray(note.comments) ? note.comments : [])
                .map(
                  (comment) => `
                <div class="comment">
                  <div class="comment-avatar">
                    <i class="uil uil-user"></i>
                  </div>
                  <div class="comment-content">
                    <strong>${escapeHtml(comment.author || "Anonyme")}</strong>
                    <p>${escapeHtml(comment.text || "")}</p>
                    <small>${formatDate(comment.createdAt)}</small>
                  </div>
                </div>`,
                )
                .join("")}
            </div>
            <div class="comment-form">
              <input class="comment-input" data-id="${note.id}" placeholder="Ajouter un commentaire...">
              <button class="comment-send" data-id="${note.id}">
                <i class="uil uil-message"></i>
              </button>
            </div>
          </div>
        </div>`;

      container.appendChild(card);
    } catch (err) {
      console.error("Erreur de rendu de la note:", note, err);
    }
  });
}

