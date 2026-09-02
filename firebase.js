import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore
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

const app =
    initializeApp(firebaseConfig);

const db =
    getFirestore(app);

const auth =
    getAuth(app);

window.db = db;
window.auth = auth;

const provider =
    new GoogleAuthProvider();

window.loginGoogle =
async function () {

    await signInWithPopup(
        auth,
        provider
    );

};

onAuthStateChanged(
    auth,
    user => {

        if(user){

            window.currentUser = user;

            document
                .getElementById(
                    "currentUser"
                )
                .textContent =
                    user.displayName +
                    " (" +
                    user.email +
                    ")";

        }

    }
);

console.log("Firebase connecté");
