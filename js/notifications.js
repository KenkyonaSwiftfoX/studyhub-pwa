// js/notifications.js

/**
 * Demande la permission d'envoyer des notifications
 */
export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

/**
 * Déclenche l'affichage d'une notification push locale
 */
export function showNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body: body,
      icon: "./icons/icon-192.png",
    });
  }
}
