import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
        getFirestore,
        doc,
        getDoc
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

async function testFirestore() {

        const ref =
            doc(
                db,
                "matchs",
                "match-test"
            );
    
        const snap =
            await getDoc(ref);
    
        if (snap.exists()) {
    
            console.log(
                "Document trouvé :",
                snap.data()
            );
    
        } else {
    
            console.log(
                "Document introuvable"
            );
    
        }
    
    }
    
    testFirestore();

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
            user.displayName.split(" ")[0];

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

console.log("Firebase connecté");
