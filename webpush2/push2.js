(function() {
    
setTimeout(initSW, 5000);

function initSW() {
    if (!"serviceWorker" in navigator) {
        //service worker isn't supported
        return;
    }

    //don't use it here if you use service worker
    //for other stuff.
    if (!"PushManager" in window) {
        //push isn't supported
        return;
    }

    //register the service worker
    navigator.serviceWorker.register('sw2.js')
        .then((serviceWorkerRegistration) => {
            console.log('serviceWorker2 installed!');
            initPush(serviceWorkerRegistration);
        })
        .catch((err) => {
            console.log(err);
        });
}

function initPush(serviceWorkerRegistration) {
    new Promise(function (resolve, reject) {
        const permissionResult = Notification.requestPermission(function (result) {
            resolve(result);
        });

        if (permissionResult) {
            permissionResult.then(resolve, reject);
        }
    })
        .then((permissionResult) => {
            if (permissionResult !== 'granted') {
                throw new Error('We weren\'t granted permission.');
            }
            subscribeUser(serviceWorkerRegistration);
        });
}

function subscribeUser(serviceWorkerRegistration) {
    const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
            'BEYdQN2lEM3VA8KGSddZ9fPJAXqrjj1TpCMHr77R9hYFkzPBuxHq6U-a4kQHdZ1cD9WkEZIaK_4oqHv4fL-UUCQ'
        )
    };

    serviceWorkerRegistration.pushManager.subscribe(subscribeOptions)
        .then((pushSubscription) => {
            console.log('Received PushSubscription2: ', JSON.stringify(pushSubscription));
            document.getElementById('log2').value = JSON.stringify(pushSubscription);
        });
}

function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

})();
