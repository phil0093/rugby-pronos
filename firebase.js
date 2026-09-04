import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
            getFirestore,
            collection,
            getDocs
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

const db = getFirestore(app);

const auth = getAuth(app);

window.db = db;
window.auth = auth;

window.matchesFirestore = [];

window.matchesParCompetition = {
    top14: []
};

async function chargerMatchsFirestore() {

    const querySnapshot =
        await getDocs(
            collection(
                db,
                "matchs"
            )
        );

    window.matchesFirestore =
        querySnapshot.docs.map(doc => ({

            id: doc.id,

            ...doc.data()

        }));

    window.matchesParCompetition.top14 =
        window.matchesFirestore;

    console.log(
        "TOP14",
        window.matchesParCompetition.top14
    );

    console.log(
        "Matchs Firestore :",
        window.matchesFirestore
    );

    console.log(
        "Journee 1",
        window.matchesFirestore.filter(
            m => m.journee === 1
        )
    );

    window.matchesFirestore.forEach(match => {

        console.log(
            match.domicile +
            " - " +
            match.exterieur
        );

    });

}

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

        if (typeof afficherMatchs === "function") {

            afficherMatchs(
                competitionCourante,
                journeeCourante
            );

        }

    }

});

chargerMatchsFirestore();
console.log("Firebase connecté");
