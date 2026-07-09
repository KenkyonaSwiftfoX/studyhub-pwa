<?php
// api/register.php — Inscription d'un nouvel étudiant avec code promo
session_start();
require_once __DIR__ . '/db.php';

$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true) ?? $_POST;

$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');
$inviteCode = strtoupper(trim($data['inviteCode'] ?? $data['invite_code'] ?? ''));

const VALID_INVITE_CODE = 'LPDWCA-2026';

if ($inviteCode !== VALID_INVITE_CODE) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => "Code d'accès promo incorrect."
    ]);
    exit;
}

$username = strip_tags($username);
if (strlen($username) < 3 || strlen($username) > 30 || !preg_match('/^[\p{L}\p{N}_\- ]{3,30}$/u', $username)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => "Le nom d'utilisateur doit contenir entre 3 et 30 caractères autorisés (lettres, chiffres, tirets, espaces)."
    ]);
    exit;
}

if (strlen($password) < 4) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => "Le mot de passe doit contenir au moins 4 caractères."
    ]);
    exit;
}

$pdo = getDB();

// Vérification si l'utilisateur existe déjà
$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
$stmt->execute([$username]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode([
        'success' => false,
        'message' => "Ce nom d'utilisateur est déjà utilisé."
    ]);
    exit;
}

// Hash sécurisé du mot de passe
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$insertStmt = $pdo->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
$insertStmt->execute([$username, $passwordHash]);
$newId = $pdo->lastInsertId();

session_regenerate_id(true);
$_SESSION['user'] = [
    'id' => (int)$newId,
    'username' => $username
];

echo json_encode([
    'success' => true,
    'message' => 'Inscription réussie ! Bienvenue sur Study Hub.',
    'user' => $_SESSION['user']
]);
