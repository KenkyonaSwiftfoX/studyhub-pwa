<?php
// api/user.php — Vérifier l'état de la session utilisateur
session_start();
header('Content-Type: application/json; charset=utf-8');

if (isset($_SESSION['user'])) {
    echo json_encode([
        'authenticated' => true,
        'user' => $_SESSION['user']
    ]);
} else {
    echo json_encode([
        'authenticated' => false
    ]);
}
