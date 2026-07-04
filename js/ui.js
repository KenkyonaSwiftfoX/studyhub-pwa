// js/ui.js

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
 * Met à jour l'état de l'affichage si la liste est vide
 */
export function updateEmptyState(emptyStateElement, notesToCheck) {
  if (emptyStateElement) {
    emptyStateElement.style.display =
      notesToCheck.length === 0 ? "block" : "none";
  }
}

/**
 * Génère le HTML des cartes de notes et l'injecte dans le conteneur
 */
export function renderNotes(
  container,
  notesToRender,
  onDeleteCallback,
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
    const card = document.createElement("article");
    card.className = `note-card fade-in ${note.pinned ? "pinned" : ""}`;

    // Configuration du Drag & Drop (Une seule fois !)
    card.draggable = true;
    card.dataset.id = note.id;
    card.addEventListener("dragstart", onDragStart);
    card.addEventListener("dragover", onDragOver);
    card.addEventListener("drop", onDrop);
    card.addEventListener("dragend", onDragEnd);

    const tagList = note.tags && note.tags.length ? note.tags : [];
    const primaryTag = tagList[0];

    card.innerHTML = `
      <div class="note-content">
        <div class="note-author">
          <div class="note-avatar ${primaryTag ? getTagClass(primaryTag) : ""}">
            ${primaryTag ? getTagIcon(primaryTag) : '<i class="uil uil-user"></i>'}
          </div>
          <div class="note-author-info">
            <span class="note-author-name">Étudiant</span>
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
          <h3 class="note-title">${note.title}</h3>
        </div>
        <div class="note-body">
          <p class="note-text">${note.content}</p>
        </div>
        <div class="note-tags">
          ${
            note.tags
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
              ? `
            <div class="attachment-card">
              <i class="uil uil-file"></i>
              <div>
                <strong>${note.attachments[0].name}</strong>
                <small>${note.attachments[0].size}</small>
              </div>
            </div>`
              : ""
          }
        </div>
        <div class="note-social">
          <button class="reaction-btn" data-id="${note.id}">
            <i class="uil uil-heart"></i>
            <span>${note.reactions?.heart || 0}</span>
          </button>
          <button class="comment-btn" data-id="${note.id}">
            <i class="uil uil-comment"></i>
            <span>${note.comments?.length || 0}</span>
          </button>
          <span class="note-date" title="${formatDate(note.createdAt)}">${timeAgo(note.createdAt)}</span>
        </div>
        <div
class="comments-container hidden"
id="comments-${note.id}">

    <div
        class="comments-list">

        ${(note.comments || [])
          .map(
            (comment) => `
            <div class="comment">

                <div class="comment-avatar">

                    <i class="uil uil-user"></i>

                </div>

                <div class="comment-content">

                    <strong>

                        ${comment.author}

                    </strong>

                    <p>

                        ${comment.text}

                    </p>

                    <small>

                        ${formatDate(comment.createdAt)}

                    </small>

                </div>

            </div>
        `,
          )
          .join("")}

    </div>

    <div class="comment-form">

        <input
            class="comment-input"
            data-id="${note.id}"
            placeholder="Ajouter un commentaire...">

        <button
            class="comment-send"
            data-id="${note.id}">

            <i class="uil uil-message"></i>

        </button>

    </div>

</div>
      </div>`;

    container.appendChild(card);
  });

  // Liaison dynamique des boutons de suppression via le callback délégué
  container.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", onDeleteCallback);
  });
}
