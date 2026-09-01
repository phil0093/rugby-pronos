import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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

window.db = db;

console.log("Firebase connecté");
`
