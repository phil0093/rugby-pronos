import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
    initializeFirestore,
    collection,
    onSnapshot,
    doc,
    setDoc
}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCxZ-e7pbvgfxPGnSFcgr2RQOn_0XFnU5M",
    authDomain: "rugby-pronos.firebaseapp.com",
    projectId: "rugby-pronos",
    storageBucket: "rugby-pronos.firebasestorage.app",
    messagingSenderId: "367460767993",
    appId: "1:367460767993:web:4735c83e703b359e1d2a28"
};

const app = initializeApp(firebaseConfig);

const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true
});

const auth = getAuth(app);

window.db = db;
window.auth = auth;

// Rempli et mis à jour automatiquement par les listeners Firestore ci-dessous.
window.matchesParCompetition = {
    top14: [],
    prod2: []
};

window.pronosTousLesJoueurs = [];

function rafraichirAffichage() {
    if (typeof window.rafraichirAffichage === "function") {
        window.rafraichirAffichage();
    }
}

// Écoute Firestore en temps réel sur les matchs.
onSnapshot(
    collection(db, "matchs"),
    (querySnapshot) => {

        const tousLesMatchs =
            querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        window.matchesParCompetition = {
            top14: tousLesMatchs.filter(
                m => m.competition === "top14"
            ),
            prod2: tousLesMatchs.filter(
                m => m.competition === "prod2"
            )
        };

        console.log(
            `Matchs Firestore mis à jour : ${tousLesMatchs.length}`
        );

        rafraichirAffichage();
    },
    (erreur) => {
        console.error(
            "Erreur de lecture Firestore (matchs) :",
            erreur
        );
    }
);

// Écoute Firestore en temps réel sur les pronostics de TOUS les joueurs
// (nécessaire pour calculer le classement commun).
onSnapshot(
    collection(db, "pronostics"),
    (querySnapshot) => {

        window.pronosTousLesJoueurs =
            querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        console.log(
            `Pronostics Firestore mis à jour : ${window.pronosTousLesJoueurs.length}`
        );

        rafraichirAffichage();
    },
    (erreur) => {
        console.error(
            "Erreur de lecture Firestore (pronostics) :",
            erreur
        );
    }
);

// Enregistre (ou remplace) le pronostic de l'utilisateur connecté
// pour un match donné.
window.enregistrerPronoFirestore = async function (matchId, domicile, exterieur) {

    if (!window.currentUser) {
        throw new Error("Utilisateur non connecté");
    }

    const uid = window.currentUser.uid;

    const joueur =
        window.currentUser.displayName
            ? window.currentUser.displayName.split(" ")[0]
            : window.currentUser.email;

    const pronosticId = `${matchId}_${uid}`;

    await setDoc(doc(db, "pronostics", pronosticId), {
        matchId: matchId,
        uid: uid,
        joueur: joueur,
        domicile: Number(domicile),
        exterieur: Number(exterieur)
    });
};

const provider = new GoogleAuthProvider();

window.loginGoogle = async function () {
    await signInWithPopup(
        auth,
        provider
    );
};

onAuthStateChanged(auth, (user) => {

    if (user) {

        window.currentUser = user;

        const prenom =
            user.displayName
                ? user.displayName.split(" ")[0]
                : user.email;

        const currentUser =
            document.getElementById("currentUser");

        if (currentUser) {
            currentUser.textContent =
                "Connecté : " + prenom;
        }

        rafraichirAffichage();
    }
});

console.log("Firebase connecté");
