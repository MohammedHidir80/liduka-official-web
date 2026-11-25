/* Liduka web push service worker (Firebase Cloud Messaging).
   The Firebase settings arrive in this file's URL (?apiKey=...), added by lib/webPush.js,
   so no keys are stored here. Check this worker in Chrome: DevTools > Application > Service Workers. */
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

const q = new URL(self.location.href).searchParams;
const cfg = {
  apiKey: q.get("apiKey"),
  authDomain: q.get("authDomain"),
  projectId: q.get("projectId"),
  storageBucket: q.get("storageBucket"),
  messagingSenderId: q.get("messagingSenderId"),
  appId: q.get("appId"),
};

if (!cfg.apiKey || !cfg.projectId || !cfg.messagingSenderId || !cfg.appId) {
  console.error("[push-sw] Firebase settings are missing from the worker URL. Open the site and run lidukaPushCheck() in the console.");
} else {
  firebase.initializeApp(cfg);
  const messaging = firebase.messaging();
  // Messages that carry a "notification" are shown by the browser itself (so we must not show them again here).
  messaging.onBackgroundMessage((payload) => {
    console.log("[push-sw] message received in the background:", payload);
  });
  console.log("[push-sw] ready");
}

// Tapping an alert opens (or focuses) the right page. The server puts the path in data.url.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = (event.notification.data && (event.notification.data.FCM_MSG && event.notification.data.FCM_MSG.data)) || event.notification.data || {};
  const target = new URL(data.url || "/notifications", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(self.location.origin) && "focus" in c) {
          return c.focus().then(() => ("navigate" in c ? c.navigate(target) : undefined));
        }
      }
      return self.clients.openWindow(target);
    })
  );
});