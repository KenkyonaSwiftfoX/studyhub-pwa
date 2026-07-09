<?php
// api/db.php — Connexion et initialisation de la base de données SQLite
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

function getDB() {
    $dbPath = __DIR__ . '/studyhub.sqlite';
    try {
        $pdo = new PDO("sqlite:" . $dbPath);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->setAttribute(PDO::ATTR_TIMEOUT, 5);
        $pdo->exec("PRAGMA busy_timeout = 5000;");
        $pdo->exec("PRAGMA journal_mode = WAL;");

        // Création de la table utilisateurs si elle n'existe pas
        $pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Création de la table des notes collaboratives (synchronisation multi-appareils)
        $pdo->exec("CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author TEXT NOT NULL,
            tags TEXT,
            created_at TEXT,
            pinned INTEGER DEFAULT 0,
            favorite INTEGER DEFAULT 0,
            reactions TEXT,
            comments TEXT,
            attachments TEXT
        )");

        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erreur de connexion à la base de données SQLite'
        ]);
        exit;
    }
}
