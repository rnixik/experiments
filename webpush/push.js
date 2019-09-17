initSW();

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
    navigator.serviceWorker.register('sw.js')
        .then((serviceWorkerRegistration) => {
            console.log('serviceWorker installed!');
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
            'BG1aEfDXrGVx11G4B9mxb-2nHSLtvxNwGJkn-mqOmz9aanUycak4IPMvvPFimxu_5vZGufaZ-aO0lu3BIbfKWnU'
        )
    };

    serviceWorkerRegistration.pushManager.subscribe(subscribeOptions)
        .then((pushSubscription) => {
            const subscription = JSON.stringify(pushSubscription);
            console.log('Received PushSubscription: ', subscription);
            document.getElementById('log').value = subscription;
            if (window.opener) {
                window.opener.postMessage({"subscription": subscription}, '*');
            }
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

