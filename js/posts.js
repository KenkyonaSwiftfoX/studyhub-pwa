let posts = [];

export function loadPosts() {
  const saved = localStorage.getItem("studyhub_posts");
  posts = saved ? JSON.parse(saved) : [];
}

export function savePosts() {
  localStorage.setItem("studyhub_posts", JSON.stringify(posts));
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
}

export function updatePosts(newPosts) {
  posts = newPosts;
  savePosts();
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

// La réorganisation des posts est gérée par drag & drop, donc on a besoin de cette fonction pour mettre à jour l'ordre dans le localStorage
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

  post.comments.push({
    id: crypto.randomUUID(),
    author: "Étudiant",
    text: comment,
    createdAt: new Date().toISOString(),
  });

  savePosts();
}

export function toggleFavorite(id) {
  const post = posts.find((p) => p.id === id);

  if (!post) return;

  post.favorite = !post.favorite;

  savePosts();
}

export function toggleReaction(id) {
  const post = posts.find((post) => post.id === id);

  if (!post) return;

  post.reactions.heart++;

  savePosts();
}
