'use strict';

// Références aux éléments HTML
const audio1 = document.getElementById('audio1');
const audio2 = document.getElementById('audio2');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const usernameInput = document.getElementById('username');
const registerButton = document.getElementById('registerButton');
const statusSpan = document.getElementById('status');
const remoteIdInput = document.getElementById('remoteId');
const userSetupDiv = document.getElementById('user-setup');
const callControlsDiv = document.getElementById('call-controls');

// Éléments audio pour la sonnerie
const ringtoneAudio = document.getElementById('ringtoneAudio');
const incomingCallAudio = document.getElementById('incomingCallAudio');


// Variables WebRTC et de statut d'appel
let localStream;
let peerConnection;
let currentCallingId = null; // L'ID de l'utilisateur que j'appelle ou qui m'appelle
let myUserId = null; // Mon propre ID
let isMakingCall = false; // Pour savoir si je suis l'appelant (true) ou le récepteur (false)

// Socket.IO client (pas de changement ici)
const socket = io();

// --- Initialisation au chargement de la page ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialisation de l'UI
    callButton.disabled = true;
    hangupButton.disabled = true;
    callControlsDiv.style.display = 'none';
    statusSpan.textContent = 'Chargement microphone...'; // Message initial

    // Obtenir le flux audio local dès le chargement
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            localStream = stream;
            audio1.srcObject = stream;
            registerButton.disabled = false; // Activer le bouton d'enregistrement
            statusSpan.textContent = 'Microphone prêt. Entrez votre ID et S\'enregistrer.';
        })
        .catch(e => {
            console.error('getUserMedia error:', e);
            statusSpan.textContent = 'Erreur: Impossible d\'accéder au microphone. (HTTPS/localhost requis)';
            alert('Impossible d\'accéder à votre microphone. Assurez-vous d\'avoir autorisé l\'accès et que votre site est servi via HTTPS ou sur localhost.');
            registerButton.disabled = true; // Désactiver l'enregistrement si pas de micro
        });
});

// --- Événements Socket.IO ---
socket.on('registered', (userId) => {
    myUserId = userId;
    statusSpan.textContent = `Enregistré comme : ${myUserId}. Entrez l'ID à appeler.`;
    usernameInput.disabled = true; // Empêcher de changer l'ID une fois enregistré
    registerButton.disabled = true; // Désactiver le bouton d'enregistrement
    userSetupDiv.style.display = 'none'; // Cacher la section d'enregistrement
    callControlsDiv.style.display = 'block'; // Afficher la section d'appel
    callButton.disabled = false;
    console.log(`Je suis enregistré comme ${myUserId}`);
});

socket.on('registration_failed', (message) => {
    statusSpan.textContent = `Échec de l'enregistrement: ${message}`;
    registerButton.disabled = false; // Réactiver l'enregistrement
    usernameInput.disabled = false;
});

socket.on('incoming_call', async (data) => {
    const { callerId } = data;

    // Si on est déjà en appel ou en train d'appeler, refuser
    if (peerConnection && peerConnection.connectionState !== 'closed') {
        console.log(`Occupé, refuse l'appel de ${callerId}`);
        socket.emit('call_declined', { targetId: callerId, reason: 'Occupé' });
        return;
    }

    currentCallingId = callerId;
    isMakingCall = false; // Je suis le récepteur

    statusSpan.textContent = `Appel entrant de ${callerId}...`;
    remoteIdInput.value = callerId; // Pré-remplir l'ID de l'appelant
    callButton.disabled = true; // Désactiver l'appel pendant la réception
    hangupButton.disabled = false;

    playIncomingCallSound(); // Jouer la sonnerie d'appel entrant

    // Créer PeerConnection et attendre l'offre
    await createPeerConnection();
    // L'offre sera reçue par l'événement 'offer'
});

socket.on('offer', async (data) => {
    const { from, sdp } = data;
    stopSounds(); // Arrêter la sonnerie si elle était en cours
    statusSpan.textContent = `Reçu offre de ${from}. Connexion...`;
    
    // Si la PeerConnection n'a pas été créée par 'incoming_call' (ex: si l'utilisateur rafraîchit)
    if (!peerConnection) {
        await createPeerConnection();
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', { targetId: from, sdp: peerConnection.localDescription });
});

socket.on('answer', async (data) => {
    const { from, sdp } = data;
    stopSounds(); // Arrêter la sonnerie si elle était en cours
    statusSpan.textContent = `Reçu réponse de ${from}. Établissement de la connexion...`;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
});

socket.on('candidate', async (data) => {
    const { from, candidate } = data;
    try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        // console.log(`ICE candidate ajouté de ${from}`);
    } catch (e) {
        console.error(`Erreur addIceCandidate: ${e.name}: ${e.message}`);
    }
});

socket.on('call_failed', (message) => {
    statusSpan.textContent = `Échec de l'appel: ${message}`;
    stopSounds();
    hangup(); // Réinitialiser l'état
});

socket.on('call_initiated', (targetId) => {
    statusSpan.textContent = `Appel lancé vers ${targetId}. Sonnerie...`;
    playRingtone(); // Jouer la sonnerie pour l'appelant
});

socket.on('call_declined', (data) => {
    const { from, reason } = data;
    statusSpan.textContent = `Appel de ${from} refusé: ${reason || 'inconnu'}.`;
    stopSounds();
    hangup();
});


socket.on('call_ended', (data) => {
    const { from } = data;
    statusSpan.textContent = `Appel terminé avec ${from || 'inconnu'}.`;
    stopSounds();
    hangup(); // Réinitialiser l'état local
});

// --- Gestion des événements UI ---
registerButton.onclick = () => {
    const userId = usernameInput.value.trim();
    if (userId) {
        if (!localStream) {
            statusSpan.textContent = 'Microphone non prêt. Veuillez attendre ou actualiser.';
            return;
        }
        socket.emit('register', userId);
        registerButton.disabled = true;
        usernameInput.disabled = true;
        statusSpan.textContent = 'Enregistrement en cours...';
    } else {
        alert('Veuillez entrer un ID utilisateur.');
    }
};

callButton.onclick = async () => {
    const targetId = remoteIdInput.value.trim();
    if (!targetId || targetId === myUserId) {
        alert('Veuillez entrer un ID distant valide et différent du vôtre.');
        return;
    }
    currentCallingId = targetId;
    isMakingCall = true; // Je suis l'appelant
    statusSpan.textContent = `Appel de ${targetId}...`;

    callButton.disabled = true;
    hangupButton.disabled = false;

    // Créer PeerConnection avant d'envoyer l'offre
    await createPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Envoyer l'offre et initier l'appel via le serveur de signalisation
    socket.emit('offer', { targetId: currentCallingId, sdp: peerConnection.localDescription });
    socket.emit('call_user', { targetId: currentCallingId });
};

hangupButton.onclick = () => {
    // Notifier le serveur et l'autre pair que j'ai raccroché
    socket.emit('hangup_call', { targetId: currentCallingId });
    hangup(); // Gérer le raccrochage localement
};

// --- Fonctions WebRTC ---
async function createPeerConnection() {
    // Ajoutez ici des serveurs STUN/TURN pour la production
    const servers = {
        // iceServers: [
        //     { urls: 'stun:stun.l.google.com:19302' },
        //     // { urls: 'turn:YOUR_TURN_SERVER_IP:PORT', username: 'YOUR_USERNAME', credential: 'YOUR_PASSWORD' }
        // ]
    };
    peerConnection = new RTCPeerConnection(servers);

    // Ajouter le flux local à la PeerConnection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Gérer les ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('candidate', { targetId: currentCallingId, candidate: event.candidate });
        }
    };

    // Gérer l'arrivée du flux distant
    peerConnection.ontrack = (event) => {
        if (audio2.srcObject !== event.streams[0]) {
            audio2.srcObject = event.streams[0];
            console.log('Flux distant reçu.');
            statusSpan.textContent = `Connecté avec ${currentCallingId} ! Parlez !`;
        }
    };

    // Gérer l'état de la connexion ICE
    peerConnection.oniceconnectionstatechange = () => {
        console.log(`ICE connection state: ${peerConnection.iceConnectionState}`);
        if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'disconnected') {
            console.warn('ICE connection failed or disconnected. Ending call.');
            // En cas d'échec de connexion, raccrocher automatiquement
            if (peerConnection.connectionState !== 'closed') { // Vérifier si pas déjà fermé par hangup
                socket.emit('hangup_call', { targetId: currentCallingId }); // Notifier l'autre côté
                hangup();
            }
        }
    };

    peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state: ${peerConnection.connectionState}`);
        if (peerConnection.connectionState === 'connected') {
            statusSpan.textContent = `Connecté avec ${currentCallingId}.`;
        } else if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
            statusSpan.textContent = `Connexion perdue avec ${currentCallingId}.`;
        } else if (peerConnection.connectionState === 'closed') {
             statusSpan.textContent = `Appel terminé.`;
        }
    };
}

function hangup() {
    console.log('Raccrochage local...');
    stopSounds(); // Arrêter toute sonnerie

    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    audio1.srcObject = null;
    audio2.srcObject = null;

    callButton.disabled = false;
    hangupButton.disabled = true;
    remoteIdInput.value = '';
    statusSpan.textContent = 'Prêt à appeler.';
    currentCallingId = null;
    isMakingCall = false;

    // Réactiver les champs d'enregistrement si l'ID n'est pas persistant
    // Pour cet exemple, l'ID enregistré reste actif.
}

// --- Fonctions de Sonnerie ---
function playRingtone() {
    if (ringtoneAudio) {
        ringtoneAudio.currentTime = 0; // Remettre au début
        ringtoneAudio.play().catch(e => console.error("Erreur lecture sonnerie: ", e));
    }
}

function playIncomingCallSound() {
    if (incomingCallAudio) {
        incomingCallAudio.currentTime = 0;
        incomingCallAudio.play().catch(e => console.error("Erreur lecture appel entrant: ", e));
    }
}

function stopSounds() {
    if (ringtoneAudio) {
        ringtoneAudio.pause();
        ringtoneAudio.currentTime = 0;
    }
    if (incomingCallAudio) {
        incomingCallAudio.pause();
        incomingCallAudio.currentTime = 0;
    }
}