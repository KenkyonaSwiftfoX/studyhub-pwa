/**
 * js/posts.js — Module de gestion de l'état des données et de la persistance locale
 * Gère le chargement, l'enregistrement (localStorage), l'ajout, la modification
 * et la suppression des notes collaboratives en mode hors ligne.
 */
import { generateUUID } from "./utils.js";

let posts = [];

/**
 * Charge les notes depuis le stockage local (offline) puis synchronise et fusionne intelligemment avec le serveur SQLite
 */
export function loadPosts() {
  const saved = localStorage.getItem("studyhub_posts");
  posts = saved ? JSON.parse(saved) : [];

  // Nettoyage des anciennes notes démo si elles existent encore
  posts = posts.filter(p => !p.id.startsWith("demo-"));
  localStorage.setItem("studyhub_posts", JSON.stringify(posts));

  // Synchronisation avec le serveur (AlwaysData SQLite) en arrière-plan (sans cache)
  fetch(`./api/posts.php?_t=${Date.now()}`, { cache: "no-store" })
    .then((res) => res.json())
    .then((data) => {
      if (data && data.success && Array.isArray(data.posts)) {
        // Si le serveur renvoie 0 note mais qu'on a des notes locales, on ne les efface pas !
        if (data.posts.length === 0 && posts.length > 0) {
          fetch("./api/posts.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "sync_all", posts }),
          }).catch(() => {});
          return;
        }

        // Fusion intelligente : on garde toutes les notes du serveur ET toutes les notes locales non synchronisées
        const serverPostsMap = new Map(data.posts.map((p) => [p.id, p]));
        const merged = [...data.posts];

        let hasUnsyncedLocal = false;
        posts.forEach((localPost) => {
          if (!serverPostsMap.has(localPost.id)) {
            merged.push(localPost);
            hasUnsyncedLocal = true;
          }
        });

        posts = merged;
        try {
          localStorage.setItem("studyhub_posts", JSON.stringify(posts));
        } catch (e) {}
        window.dispatchEvent(new CustomEvent("postsUpdated"));

        // Si des notes locales n'étaient pas encore sur le serveur, on les synchronise vers le serveur
        if (hasUnsyncedLocal) {
          fetch("./api/posts.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "sync_all", posts }),
          }).catch(() => {});
        }
      }
    })
    .catch(() => {
      // Hors ligne : on conserve les notes locales
    });
}

export function getCurrentUserId() {
  if (window.currentUser && window.currentUser.username) {
    return window.currentUser.username;
  }
  let clientId = localStorage.getItem("studyhub_client_id");
  if (!clientId) {
    clientId = "anon_" + generateUUID();
    localStorage.setItem("studyhub_client_id", clientId);
  }
  return clientId;
}

export function savePosts() {
  try {
    localStorage.setItem("studyhub_posts", JSON.stringify(posts));
  } catch (err) {
    console.warn("Quota localStorage atteint:", err);
  }

  // Envoi au serveur SQLite
  if (posts.length > 0) {
    fetch("./api/posts.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync_all", posts }),
    })
      .then((res) => res.json())
      .catch((err) => console.warn("Erreur sync serveur:", err));
  }
}

export function saveSinglePostToServer(post) {
  if (post) {
    fetch("./api/posts.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_post", post }),
    }).catch(() => {});
  }
}

export function getPosts() {
  return posts;
}

export function addPost(post) {
  posts.unshift(post);
  savePosts();
}

export function removePost(id) {
  posts = posts.filter((post) => post.id !== id);
  savePosts();
  fetch("./api/posts.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete_post", id }),
  }).catch(() => {});
}

export function getPostById(id) {
  return posts.find((post) => post.id === id);
}

export function updatePost(updatedPost) {
  const index = posts.findIndex((post) => post.id === updatedPost.id);

  if (index !== -1) {
    posts[index] = updatedPost;
    savePosts();
  }
}

export function reorderPosts(startId, endId) {
  const startIndex = posts.findIndex((p) => p.id === startId);
  const endIndex = posts.findIndex((p) => p.id === endId);

  if (startIndex === -1 || endIndex === -1) return;

  const [moved] = posts.splice(startIndex, 1);
  posts.splice(endIndex, 0, moved);

  savePosts();
}

export function addComment(postId, comment) {
  const post = posts.find((p) => p.id === postId);

  if (!post) return;

  if (!post.comments) post.comments = [];

  post.comments.push({
    id: generateUUID(),
    author: window.currentUser ? window.currentUser.username : "Étudiant promo",
    text: comment,
    createdAt: new Date().toISOString(),
  });

  savePosts();
}

export function toggleReaction(id) {
  const post = posts.find((post) => post.id === id);

  if (!post) return;

  if (!post.reactions) post.reactions = { heart: 0, likedBy: [] };
  if (typeof post.reactions.heart !== "number") post.reactions.heart = 0;
  if (!Array.isArray(post.reactions.likedBy)) post.reactions.likedBy = [];

  const userId = getCurrentUserId();
  const index = post.reactions.likedBy.indexOf(userId);

  if (index !== -1) {
    // Déjà liké par cet utilisateur -> on retire le like (-1)
    post.reactions.likedBy.splice(index, 1);
    post.reactions.heart = Math.max(0, post.reactions.heart - 1);
  } else {
    // Pas encore liké -> on ajoute le like (+1)
    post.reactions.likedBy.push(userId);
    post.reactions.heart++;
  }

  savePosts();
}
