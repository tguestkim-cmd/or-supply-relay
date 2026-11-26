/* OR Supply Relay service worker -- exists only to receive Web Push.
   It caches nothing, so it can never serve a stale copy of the app and the
   existing ?v=N refresh routine is unaffected. Keep it next to index.html. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; }
  catch (_) { d = { title: "OR Supply Relay", body: event.data ? event.data.text() : "" }; }

  const urgent = d.urgency === "now";
  /* iPhone requires every push to show a notification (a silent push gets
     the subscription revoked), so this never skips one -- even if the app is
     open on screen. */
  event.waitUntil(self.registration.showNotification(d.title || "OR Supply Relay", {
    body: d.body || "",
    icon: "icon-192.png",
    tag: d.tag || undefined,
    renotify: !!d.tag,              // throws if true without a tag
    requireInteraction: urgent,     // stays on screen until dismissed (Android / desktop)
    vibrate: urgent ? [250, 100, 250, 100, 250] : [200],
    data: { view: d.view || "clin" }
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const view = (event.notification.data && event.notification.data.view) || "clin";
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (wins.length) {
      const w = wins[0];
      await w.focus();
      w.postMessage({ type: "push-open", view });
      return;
    }
    await self.clients.openWindow("./?view=" + encodeURIComponent(view));
  })());
});
