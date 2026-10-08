self.addEventListener('push', (e) => {
    const d = e.data ? e.data.json() : { title: 'NEW ORDER', body: '' };
    e.waitUntil(self.registration.showNotification(d.title, {
        body: d.body,
        tag: d.orderId,               // one notification per order
        renotify: true,
        requireInteraction: true,     // stays until tapped
        vibrate: [500, 200, 500, 200, 500, 200, 500],
        data: { url: '/kitchen' },           // change to your cook page path
    }));
});

self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
        for (const c of list) if ('focus' in c) return c.focus();
        return clients.openWindow(e.notification.data.url);
    }));
});