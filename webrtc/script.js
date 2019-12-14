var chatElement = document.getElementById('chat');
var messageElement = document.getElementById('message');
var connectionsElement = document.getElementById('connections');
var chatContainerElement = document.getElementById('chat-container');
var textToCopyElement = document.getElementById("text-to-copy");
var signalingContainerElement = document.getElementById('signaling-container');
var linkContainerElement = document.getElementById('link-container');

function uuid () {
    var s4 = function() {
        return Math.floor(Math.random() * 0x10000).toString(16);
    };
    return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
}

var config = {
    iceServers: [
        {urls: "stun:stun.l.google.com:19302"}
    ]
};

var peers = {};

function initConnection(pc, id, sdpType) {
    console.log('init connection', sdpType);
    pc.onicecandidate = function (event) {
        console.log('got candidate', event);
        if (event.candidate) {
            peers[id].candidateCache.push(event.candidate);
        } else {
            console.log('not candidate');

            // Send ICE candidates?
            var data = {
                id: id,
                sdp: pc.localDescription
            };

            textToCopyElement.value = JSON.stringify(data);
            if (isInitiator) {
                linkContainerElement.innerHTML = '<a href="#' + encodeURI(JSON.stringify(data)) + '">Offer link</a>';
            }

            textToCopyElement.select();
            textToCopyElement.setSelectionRange(0, 99999);
        }
    };

    pc.oniceconnectionstatechange = function (event) {
        console.log('changed state', event);
        if (pc.iceConnectionState === 'disconnected') {
            connectionsElement.innerText = parseInt(connectionsElement.innerText) - 1;
            delete peers[id];
        }
    };
}

function bindEvents (channel) {
    channel.onopen = function () {
        console.log('channel OPEN!');
        chatContainerElement.style.display = 'block';
        signalingContainerElement.style.display ='none';
        connectionsElement.innerText = parseInt(connectionsElement.innerText) + 1;
    };
    channel.onclose = function () {
        console.log('channel CLOSE!');
    };
    channel.onmessage = function (e) {
        chatElement.innerHTML += "<div>Other peer says: " + e.data + "</div>";
    };
}

function remoteOfferReceived(id, data) {
    console.log('got offer', id, data);
    createConnection(id);
    var pc = peers[id].connection;

    pc.setRemoteDescription(data).then(function () {
        pc.createAnswer(function(answer) {
            pc.setLocalDescription(answer);
        }, function (err) {
            console.error(err);
        });
    });
}

function createConnection(id) {
    if (peers[id] === undefined) {
        console.log('create connection', id);
        peers[id] = {
            candidateCache: []
        };
        var pc = new RTCPeerConnection(config);
        initConnection(pc, id, "answer");

        peers[id].connection = pc;
        pc.ondatachannel = function(e) {
            console.log('ondatachannel');
            peers[id].channel = e.channel;
            peers[id].channel.owner = id;
            bindEvents(peers[id].channel);
        }
    }
}

function remoteAnswerReceived(id, data) {
    console.log('remoteAnswerReceived', id, data);
    var pc = peers[id].connection;
    pc.setRemoteDescription(data);
}


function remoteCandidateReceived(id, data) {
    console.log('remoteCandidateReceived', data);
    //createConnection(id);
    var pc = peers[id].connection;
    pc.addIceCandidate(data);
}

function sendMessage() {
    var msg = messageElement.value;
    for (var peer in peers) {
        if (peers.hasOwnProperty(peer)) {
            if (peers[peer].channel !== undefined) {
                try {
                    peers[peer].channel.send(msg);
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }
    chatElement.innerHTML += "<div>You say: " + msg + "</div>";
    messageElement.value = "";
}

var isInitiator= false;

function applyRemote() {
    var json = document.getElementById("remote").value;
    var data = JSON.parse(json);

    if (isInitiator) {
        createConnection(data.id);
        remoteAnswerReceived(data.id, data.sdp);
    } else {
        remoteOfferReceived(data.id, data.sdp);
    }
}

var locationHash = location.hash.substr(1);
if (locationHash) {
    var decodedData = decodeURI(locationHash);
    var remoteData = JSON.parse(decodedData);
    remoteOfferReceived(remoteData.id, remoteData.sdp);
}

function startSignaling() {
    isInitiator = true;
    var myId = uuid();

    peers[myId] = {
        candidateCache: []
    };

    var pc = new RTCPeerConnection(config);
    initConnection(pc, myId, "offer");
    peers[myId].connection = pc;
    var channel = pc.createDataChannel("some-channel");
    channel.owner = myId;
    peers[myId].channel = channel;
    bindEvents(channel);

    pc.onnegotiationneeded = async () => {
        try {
            await pc.setLocalDescription(await pc.createOffer());
        } catch (err) {
            console.error(err);
        }
    };
}

window.addEventListener("beforeunload", onBeforeUnload);

function onBeforeUnload(e) {
    for (var peer in peers) {
        if (peers.hasOwnProperty(peer)) {
            if (peers[peer].channel !== undefined) {
                try {
                    peers[peer].channel.close();
                } catch (e) {}
            }
        }
    }
}

