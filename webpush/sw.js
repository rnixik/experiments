self.addEventListener('push', function (e) {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        //notifications aren't supported or permission not granted!
        return;
    }

    if (e.data) {
        var msg = e.data.json();
        console.log(msg);
        e.waitUntil(self.registration.showNotification(msg.title, {
            body: msg.body,
            icon: msg.icon,
            data: msg.data,
            actions: msg.actions
        }));
    }
});

self.addEventListener('notificationclick', function(event) {
    const clickedNotification = event.notification;
    clickedNotification.close();

    const data = event.notification.data;

    if (data.url) {
        const urlToOpen = new URL(data.url, self.location.origin).href;

        const promiseChain = clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
            .then((windowClients) => {
                let matchingClient = null;

                for (let i = 0; i < windowClients.length; i++) {
                    const windowClient = windowClients[i];
                    if (windowClient.url === urlToOpen) {
                        matchingClient = windowClient;
                        break;
                    }
                }

                if (matchingClient) {
                    return matchingClient.focus();
                } else {
                    return clients.openWindow(urlToOpen);
                }
            });

        event.waitUntil(promiseChain);
    }
});
