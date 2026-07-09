<?php
// api/login.php — Connexion utilisateur
session_start();
require_once __DIR__ . '/db.php';

$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true) ?? $_POST;

$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Veuillez saisir votre nom d\'utilisateur et mot de passe.'
    ]);
    exit;
}

$pdo = getDB();
$stmt = $pdo->prepare("SELECT id, username, password_hash FROM users WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    usleep(300000); // 300ms de protection contre le bruteforce et timing attacks
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Nom d\'utilisateur ou mot de passe incorrect.'
    ]);
    exit;
}

session_regenerate_id(true);
$_SESSION['user'] = [
    'id' => (int)$user['id'],
    'username' => $user['username']
];

echo json_encode([
    'success' => true,
    'message' => 'Connexion réussie.',
    'user' => $_SESSION['user']
]);
