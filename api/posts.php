<?php
// api/posts.php — API REST de gestion et synchronisation des notes collaboratives
require_once __DIR__ . '/db.php';

$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');

    // Récupère toutes les notes depuis la base SQLite
    $stmt = $pdo->query("SELECT * FROM posts ORDER BY created_at DESC");
    $rows = $stmt->fetchAll();
    
    $posts = [];
    foreach ($rows as $row) {
        $posts[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'content' => $row['content'],
            'author' => $row['author'],
            'tags' => json_decode($row['tags'] ?: '[]', true),
            'createdAt' => $row['created_at'],
            'pinned' => (bool)$row['pinned'],
            'favorite' => (bool)$row['favorite'],
            'reactions' => json_decode($row['reactions'] ?: '{"heart":0}', true),
            'comments' => json_decode($row['comments'] ?: '[]', true),
            'attachments' => json_decode($row['attachments'] ?: '[]', true)
        ];
    }

    echo json_encode(['success' => true, 'posts' => $posts]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        echo json_encode(['success' => false, 'message' => 'Données invalides']);
        exit;
    }

    $action = $input['action'] ?? 'save_post';

    if ($action === 'delete_post') {
        $id = $input['id'] ?? '';
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM posts WHERE id = ?");
            $stmt->execute([$id]);
        }
        echo json_encode(['success' => true]);
        exit;
    }

    if ($action === 'save_post' || $action === 'sync_post') {
        $post = $input['post'] ?? null;
        if ($post && !empty($post['id'])) {
            $stmt = $pdo->prepare("INSERT OR REPLACE INTO posts 
                (id, title, content, author, tags, created_at, pinned, favorite, reactions, comments, attachments)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $post['id'],
                $post['title'] ?? '',
                $post['content'] ?? '',
                $post['author'] ?? 'Anonyme',
                json_encode($post['tags'] ?? []),
                $post['createdAt'] ?? date('c'),
                !empty($post['pinned']) ? 1 : 0,
                !empty($post['favorite']) ? 1 : 0,
                json_encode($post['reactions'] ?? ['heart' => 0]),
                json_encode($post['comments'] ?? []),
                json_encode($post['attachments'] ?? [])
            ]);
        }
        echo json_encode(['success' => true]);
        exit;
    }

    if ($action === 'sync_all') {
        $clientPosts = $input['posts'] ?? [];
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("INSERT OR REPLACE INTO posts 
            (id, title, content, author, tags, created_at, pinned, favorite, reactions, comments, attachments)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        foreach ($clientPosts as $post) {
            if (!empty($post['id'])) {
                $stmt->execute([
                    $post['id'],
                    $post['title'] ?? '',
                    $post['content'] ?? '',
                    $post['author'] ?? 'Anonyme',
                    json_encode($post['tags'] ?? []),
                    $post['createdAt'] ?? date('c'),
                    !empty($post['pinned']) ? 1 : 0,
                    !empty($post['favorite']) ? 1 : 0,
                    json_encode($post['reactions'] ?? ['heart' => 0]),
                    json_encode($post['comments'] ?? []),
                    json_encode($post['attachments'] ?? [])
                ]);
            }
        }
        $pdo->commit();
        echo json_encode(['success' => true]);
        exit;
    }
}
