/**
 * js/app.js — Contrôleur principal de l'application Study Hub (PWA Monopage)
 * Orchestre l'interaction entre les modules d'authentification (auth.js),
 * de gestion des données (posts.js), d'interface utilisateur (ui.js),
 * d'internationalisation et thème (i18n.js) et les notifications Push (notifications.js).
 */
import {
  loadPosts,
  getPosts,
  getPostById,
  addPost,
  updatePost,
  removePost,
  addComment,
  toggleReaction,
  reorderPosts,
} from "./posts.js";

import { renderNotes, updateEmptyState } from "./ui.js";
import { openModal, closeModal, generateUUID } from "./utils.js";
import {
  requestNotificationPermission,
  showNotification,
} from "./notifications.js";
import { initAuth } from "./auth.js";
import { initI18nAndTheme } from "./i18n.js";

document.addEventListener("DOMContentLoaded", function () {
  console.log("Study Hub chargé");

  // 1. Ciblage des éléments du DOM en TOUT PREMIER pour éviter ReferenceError dans initAuth
  const notesContainer = document.getElementById("notesContainer");
  const addNoteBtn = document.getElementById("addNoteBtn");
  const addNoteModal = document.getElementById("addNoteModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const noteForm = document.getElementById("noteForm");
  const modalTitle = document.querySelector("#addNoteModal .modal-title");
  const submitBtn = noteForm ? noteForm.querySelector(".submit-btn") : null;

  const attachmentInput = document.getElementById("attachmentInput");
  const attachmentPreview = document.getElementById("attachmentPreview");

  const searchInput = document.getElementById("searchInput");
  const filterSelect = document.getElementById("filterSelect");
  const emptyState = document.getElementById("emptyState");

  const confirmModal = document.getElementById("confirmModal");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  // Initialisation Langue & Thème
  initI18nAndTheme();

  // Enregistrement du Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        console.log("Service Worker enregistré :", reg.scope);
        reg.update();
      })
      .catch((err) =>
        console.error("Échec de l'enregistrement du Service Worker :", err),
      );
  }

  // Initialisation de l'authentification PWA
  initAuth({
    onLoginSuccess: (user) => {
      showNotification("Bienvenue !", `Connecté en tant que ${user.username}`);
      refreshUI();
    },
    onLogout: () => {
      showNotification("Déconnexion", "À bientôt sur Study Hub !");
    },
  });

  // Chargement initial des données locales + synchronisation serveur
  loadPosts();
  let notes = getPosts();
  window.addEventListener("postsUpdated", () => {
    notes = getPosts();
    refreshUI();
  });
  let noteToDeleteId = null; // Contiendra l'ID textuel unique (UUID)
  let selectedAttachment = null;
  let editingNoteId = null; // ID de la note en cours de modification (null = création)

  // Variable pour le drag & drop
  let draggedCardId = null;

  // Variable globale
  let dragOverCard = null;

  // Réinitialise la modale (mode création par défaut)
  function resetNoteModalState() {
    editingNoteId = null;
    selectedAttachment = null;
    if (attachmentPreview) attachmentPreview.innerHTML = "";
    if (modalTitle) modalTitle.textContent = "Nouvelle note";
    if (submitBtn) submitBtn.textContent = "Enregistrer la note";
  }

  // Gestion du drag & drop
  function handleDragStart(e) {
    draggedCardId = e.currentTarget.dataset.id;

    e.currentTarget.classList.add("dragging");
  }

  // Moteur de recherche et filtrage combiné
  function getFilteredNotes() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    const filterValue = filterSelect ? filterSelect.value : "all";
    let filtered = getPosts() || [];

    if (searchTerm) {
      filtered = filtered.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(searchTerm)) ||
          (n.content && n.content.toLowerCase().includes(searchTerm)),
      );
    }
    if (filterValue !== "all") {
      filtered = filtered.filter((n) => n.tags && n.tags.includes(filterValue));
    }
    return filtered;
  }

  // Fonction globale de rafraîchissement de l'interface
  function refreshUI(notesToDisplay = getFilteredNotes()) {
    renderNotes(
      notesContainer,
      notesToDisplay,
      handleDragStart,
      handleDragOver,
      handleDrop,
      handleDragEnd,
    );
    updateEmptyState(emptyState, notesToDisplay);
  }

  // Gestion de la demande de suppression (Clic sur l'icône corbeille)
  function handleDeleteClick(e) {
    noteToDeleteId = e.currentTarget.dataset.id; // Stockage de l'ID textuel sécurisé
    openModal(confirmModal);
  }

  // Gestion du drag & drop : autorisation du drop
  function handleDragOver(e) {
    e.preventDefault();

    const card = e.currentTarget;

    if (dragOverCard && dragOverCard !== card) {
      dragOverCard.classList.remove("drag-over");
    }

    dragOverCard = card;

    card.classList.add("drag-over");
  }

  // Gestion du drop : réorganisation des notes
  function handleDrop(e) {
    e.preventDefault();

    // On cherche la carte d'arrivée la plus proche du pointeur
    const targetCard = e.target.closest(".note-card");
    if (!targetCard) return;

    const targetId = targetCard.dataset.id;

    // Si on lâche la carte sur elle-même, on ne fait rien
    if (draggedCardId === targetId) return;

    // Appel au modèle (posts.js) pour réorganiser le tableau
    reorderPosts(draggedCardId, targetId);

    // Resynchronisation et mise à jour visuelle
    notes = getPosts();
    refreshUI();

    // Nettoyage de l'état visuel du drag & drop
    if (dragOverCard) {
      dragOverCard.classList.remove("drag-over");
      dragOverCard = null;
    }
  }

  // Gestion de la fin du drag : nettoyage de l'état visuel
  function handleDragEnd(e) {
    e.currentTarget.classList.remove("dragging");

    if (dragOverCard) {
      dragOverCard.classList.remove("drag-over");
      dragOverCard = null;
    }

    draggedCardId = null;
  }

  // Confirmation finale de la suppression
  function confirmDeleteNote() {
    if (noteToDeleteId !== null) {
      const deletedNote = getPostById(noteToDeleteId);
      removePost(noteToDeleteId);
      notes = getPosts(); // Resynchronisation locale
      refreshUI();
      closeModal(confirmModal);
      noteToDeleteId = null;
      showNotification(
        "Note supprimée",
        deletedNote ? deletedNote.title : "Une note a été supprimée.",
      );
    }
  }

  // Filtre et met à jour l'affichage
  function filterNotes() {
    refreshUI(getFilteredNotes());
  }

  // Déploiement de la zone de commentaires
  function toggleComments(id) {
    const zone = document.getElementById(`comments-${id}`);
    if (zone) zone.classList.toggle("hidden");
  }

  // Envoi du formulaire de création/modification de note
  noteForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const title = document.getElementById("noteTitle").value.trim();
    const content = document.getElementById("noteContent").value.trim();
    const selectedTags = Array.from(
      document.querySelectorAll(".tag-check:checked"),
    ).map((cb) => cb.value);

    if (!title || !content) return;

    const attachments = selectedAttachment
      ? [
          {
            name: selectedAttachment.name,
            size: selectedAttachment.isExisting || typeof selectedAttachment.size === "string"
              ? selectedAttachment.size
              : `${(selectedAttachment.size / 1024).toFixed(1)} Ko`,
            url: selectedAttachment.dataUrl || selectedAttachment.url || null,
          },
        ]
      : [];

    if (editingNoteId) {
      // Mode modification : on met à jour la note existante
      const existing = getPostById(editingNoteId);
      if (!existing) return;

      updatePost({
        ...existing,
        title,
        content,
        tags: selectedTags.length ? selectedTags : ["infosPromo"],
        attachments,
      });

      notes = getPosts();
      refreshUI();
      closeModal(addNoteModal, noteForm);
      resetNoteModalState();
      showNotification("Note modifiée", title);
      return;
    }

    // Mode création : nouvelle note
    const post = {
      id: generateUUID(),
      title,
      content,
      author: window.currentUser ? window.currentUser.username : "Étudiant promo",
      tags: selectedTags.length ? selectedTags : ["infosPromo"],
      createdAt: new Date().toISOString(),
      favorite: false,
      reactions: { heart: 0 },
      comments: [],
      attachments,
    };

    addPost(post);
    notes = getPosts();
    refreshUI();
    closeModal(addNoteModal, noteForm);
    resetNoteModalState();

    showNotification("Nouvelle note !", title);
  });

  // Écouteurs d'événements structurels (Modales, Filtres)
  addNoteBtn.addEventListener("click", (e) => {
    if (e) e.preventDefault();
    resetNoteModalState();
    if (noteForm) noteForm.reset();
    openModal(addNoteModal);
  });
  closeModalBtn.addEventListener("click", () => {
    closeModal(addNoteModal, noteForm);
    resetNoteModalState();
  });
  cancelDeleteBtn.addEventListener("click", () => closeModal(confirmModal));
  confirmDeleteBtn.addEventListener("click", confirmDeleteNote);

  // Fermeture des modales par clic sur le fond ou touche Échap
  [addNoteModal, confirmModal].forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        if (modal === addNoteModal) {
          closeModal(addNoteModal, noteForm);
          resetNoteModalState();
        } else {
          closeModal(confirmModal);
        }
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (addNoteModal.classList.contains("active")) {
        closeModal(addNoteModal, noteForm);
        resetNoteModalState();
      } else if (confirmModal.classList.contains("active")) {
        closeModal(confirmModal);
      }
    }
  });

  function adjustSearchInputWidth() {
    if (window.innerWidth >= 768) {
      const charLen = searchInput.value.length;
      if (charLen > 10) {
        const newWidth = Math.min(480, Math.max(240, charLen * 9 + 80));
        searchInput.style.width = `${newWidth}px`;
      } else if (document.activeElement === searchInput) {
        searchInput.style.width = "250px";
      } else {
        searchInput.style.width = "180px";
      }
    } else {
      searchInput.style.width = "100%";
    }
  }

  searchInput.addEventListener("input", () => {
    filterNotes();
    adjustSearchInputWidth();
  });
  searchInput.addEventListener("focus", adjustSearchInputWidth);
  searchInput.addEventListener("blur", adjustSearchInputWidth);
  window.addEventListener("resize", adjustSearchInputWidth);
  filterSelect.addEventListener("change", filterNotes);

  // Délégation d'événements unique sur le conteneur des cartes de notes
  notesContainer.addEventListener("click", (e) => {
    // 1. Bouton Menu Contextuel (Trois petits points)
    const menuBtn = e.target.closest(".menu-btn");
    if (menuBtn) {
      const id = menuBtn.dataset.id;
      document.querySelectorAll(".card-menu").forEach((menu) => {
        if (menu.id !== `menu-${id}`) menu.classList.add("hidden");
      });
      document.getElementById(`menu-${id}`).classList.toggle("hidden");
      return;
    }

    // 2. Bouton Réactions (Cœur de réseau social)
    const reactionBtn = e.target.closest(".reaction-btn");
    if (reactionBtn) {
      toggleReaction(reactionBtn.dataset.id);
      notes = getPosts();
      refreshUI();
      return;
    }

    // 3. Bouton Commentaires
    const commentBtn = e.target.closest(".comment-btn");
    if (commentBtn) {
      toggleComments(commentBtn.dataset.id);
      return;
    }

    // 4. Envoi d'un commentaire
    const sendBtn = e.target.closest(".comment-send");

    if (sendBtn) {
      const postId = sendBtn.dataset.id;

      const input = document.querySelector(
        `.comment-input[data-id="${postId}"]`,
      );

      const text = input.value.trim();

      if (!text) return;

      addComment(postId, text);

      notes = getPosts();

      refreshUI();

      toggleComments(postId); // Ré-ouvre ou maintient la zone affichée

      const commentedPost = getPostById(postId);
      showNotification(
        "Nouveau commentaire",
        commentedPost ? `Sur « ${commentedPost.title} »` : text,
      );

      return;
    }

    // 5. Bouton Modifier (menu contextuel)
    const editBtn = e.target.closest(".edit-btn");
    if (editBtn) {
      const id = editBtn.dataset.id;
      const post = getPostById(id);
      if (!post) return;

      editingNoteId = id;
      document.getElementById("noteTitle").value = post.title;
      document.getElementById("noteContent").value = post.content;
      document.querySelectorAll(".tag-check").forEach((cb) => {
        cb.checked = Boolean(post.tags && post.tags.includes(cb.value));
      });

      if (post.attachments && post.attachments.length) {
        const existing = post.attachments[0];
        selectedAttachment = {
          name: existing.name,
          size: existing.size,
          isExisting: true,
        };
        attachmentPreview.innerHTML = `
          <div class="attachment-card">
              <i class="uil uil-file"></i>
              <div class="attachment-info">
                  <strong>${existing.name}</strong>
                  <small>${existing.size}</small>
              </div>
              <button id="removeAttachment" class="attachment-remove" type="button">
                  <i class="uil uil-times"></i>
              </button>
          </div>`;
        document
          .getElementById("removeAttachment")
          .addEventListener("click", () => {
            selectedAttachment = null;
            attachmentInput.value = "";
            attachmentPreview.innerHTML = "";
          });
      } else {
        selectedAttachment = null;
        attachmentPreview.innerHTML = "";
      }

      modalTitle.textContent = "Modifier la note";
      submitBtn.textContent = "Mettre à jour";

      const menu = document.getElementById(`menu-${id}`);
      if (menu) menu.classList.add("hidden");

      openModal(addNoteModal);
      return;
    }

    // 6. Bouton Copier le texte (menu contextuel)
    const copyBtn = e.target.closest(".copy-btn");
    if (copyBtn) {
      const id = copyBtn.dataset.id;
      const post = getPostById(id);

      const menu = document.getElementById(`menu-${id}`);
      if (menu) menu.classList.add("hidden");

      if (!post) return;

      const textToCopy = `${post.title}\n\n${post.content}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(textToCopy)
          .then(() => showNotification("Copié !", "Le texte a été copié."))
          .catch(() =>
            showNotification("Erreur", "Impossible de copier le texte."),
          );
      }
      return;
    }

    // 7. Bouton Supprimer (menu contextuel)
    const deleteBtn = e.target.closest(".delete-btn");
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const menu = document.getElementById(`menu-${id}`);
      if (menu) menu.classList.add("hidden");
      noteToDeleteId = id;
      openModal(confirmModal);
      return;
    }
  });

  // Fermeture des petits menus contextuels lors d'un clic à côté
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".menu-btn") && !e.target.closest(".card-menu")) {
      document.querySelectorAll(".card-menu").forEach((menu) => {
        menu.classList.add("hidden");
      });
    }
  });

  // Gestion des pièces jointes à l'importation de fichiers (avec compression d'image pour ne jamais dépasser le quota)
  attachmentInput.addEventListener("change", () => {
    const file = attachmentInput.files[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(file.name);

    const updatePreview = (dataUrl, displaySizeKo) => {
      selectedAttachment = {
        name: file.name,
        size: displaySizeKo ? `${displaySizeKo} Ko` : `${(file.size / 1024).toFixed(1)} Ko`,
        dataUrl: dataUrl,
      };

      const sizeKo = displaySizeKo || (file.size / 1024).toFixed(1);
      attachmentPreview.innerHTML = `
        <div class="attachment-card">
            <i class="uil uil-file"></i>
            <div class="attachment-info">
                <strong>${escapeHtml(file.name)}</strong>
                <small>${sizeKo} Ko</small>
            </div>
            <button id="removeAttachment" class="attachment-remove" type="button">
                <i class="uil uil-times"></i>
            </button>
        </div>`;

      document
        .getElementById("removeAttachment")
        .addEventListener("click", () => {
          selectedAttachment = null;
          attachmentInput.value = "";
          attachmentPreview.innerHTML = "";
        });
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target.result;
      if (isImage) {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          const compressedUrl = canvas.toDataURL("image/jpeg", 0.75);
          const approxKo = Math.round((compressedUrl.length * 0.75) / 1024);
          updatePreview(compressedUrl, approxKo);
        };
        img.onerror = () => updatePreview(rawDataUrl);
        img.src = rawDataUrl;
      } else {
        updatePreview(rawDataUrl);
      }
    };
    reader.readAsDataURL(file);
  });

  // Rendu de démarrage initial
  refreshUI();
  requestNotificationPermission();

  // Notifie l'utilisateur des changements de connectivité (pertinent pour une PWA)
  window.addEventListener("online", () => {
    showNotification("Connexion rétablie", "Vous êtes de nouveau en ligne.");
  });
  window.addEventListener("offline", () => {
    showNotification(
      "Mode hors ligne",
      "Vous êtes hors ligne, Study Hub reste utilisable.",
    );
  });
});
