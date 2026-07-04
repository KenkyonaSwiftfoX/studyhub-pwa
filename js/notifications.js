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
 * Déclenche l'affichage d'une notification locale.
 *
 * Depuis l'ajout du Service Worker (mode hors-ligne / installation),
 * la page est "contrôlée" par celui-ci. Or, sur de nombreuses versions
 * de Chrome (et systématiquement sur Chrome Android), le constructeur
 * `new Notification()` est ignoré ou bloqué dès qu'un Service Worker
 * contrôle la page : il faut passer par
 * `ServiceWorkerRegistration.showNotification()`. C'est ce qui explique
 * que la permission apparaisse "Autorisée" sans qu'aucune notification
 * ne s'affiche. On utilise donc le Service Worker en priorité, et on ne
 * se rabat sur le constructeur classique que s'il n'y en a pas.
 */
export function showNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const options = {
    body,
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    tag: `study-hub-${title}`,
    renotify: true,
  };

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistration()
      .then((registration) => {
        if (registration) {
          registration.showNotification(title, options);
        } else {
          new Notification(title, options);
        }
      })
      .catch(() => {
        new Notification(title, options);
      });
  } else {
    new Notification(title, options);
  }
}
