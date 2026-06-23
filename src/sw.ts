/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

// Workbox injects the precache manifest here at build time → app-shell
// caching for installability / offline shell (hardened further in Phase 10).
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// --- Web push (wired live in Phase 7) ---
self.addEventListener("push", (event: PushEvent) => {
  let data: { title?: string; body?: string; url?: string } = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { body: event.data?.text() };
  }

  const title = data.title ?? "FitFutures";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body ?? "You have an update.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url ?? "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data?.url as string) ?? "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
