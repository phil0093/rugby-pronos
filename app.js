const matches = {

    top14: [

        {
            id: 1,
            journee: 1,
            domicile: "Stade Toulousain",
            exterieur: "La Rochelle",
            date: "2026-09-05T21:05:00",

            scoreDom: 0,
            scoreExt: 0,
    
            statut: "avenir"
        },

        {
            id: 2,
            journee: 1,
            domicile: "RC Toulon",
            exterieur: "ASM Clermont",
            date: "2026-09-06T21:05:00",

            scoreDom: 0,
            scoreExt: 0,
    
            statut: "avenir"
        },

        {
            id: 5,
            journee: 2,
            domicile: "Castres",
            exterieur: "Bayonne",
            date: "2026-09-12T21:05:00",

            scoreDom: 0,
            scoreExt: 0,
    
            statut: "avenir"
        }

    ],

    prod2: [

        {
            id: 3,
            journee: 1,
            domicile: "CA Brive",
            exterieur: "Oyonnax",
            date: "2026-09-05T19:30:00",

            scoreDom: 0,
            scoreExt: 0,
    
            statut: "avenir"
        },

        {
            id: 4,
            journee: 1,
            domicile: "Grenoble",
            exterieur: "Biarritz",
            date: "2026-09-06T19:30:00",

            scoreDom: 0,
            scoreExt: 0,
    
            statut: "avenir"
        }

    ]

};
const resultats = {

    1: {
        domicile: 27,
        exterieur: 12
    },

    2: {
        domicile: 22,
        exterieur: 20
    },

    3: {
        domicile: 15,
        exterieur: 12
    },

    4: {
        domicile: 18,
        exterieur: 25
    }

};


const tabs = document.querySelectorAll(".tab");
const matchesDiv = document.getElementById("matches");

let competitionCourante = "top14";

let journeeCourante = 1;

function calculerPoints(
    reelDom,
    reelExt,
    pronoDom,
    pronoExt
) {

    let points = 0;

    const vainqueurReel =
        reelDom > reelExt ? "D" :
        reelExt > reelDom ? "E" :
        "N";

    const vainqueurProno =
        pronoDom > pronoExt ? "D" :
        pronoExt > pronoDom ? "E" :
        "N";

    if (vainqueurReel === vainqueurProno) {

        points += 3;

        if (Number(pronoDom) === reelDom) {
            points += 2;
        }

        if (Number(pronoExt) === reelExt) {
            points += 2;
        }

        const ecartDom =
            Math.abs(Number(pronoDom) - reelDom);

        const ecartExt =
            Math.abs(Number(pronoExt) - reelExt);

        if (
            ecartDom <= 4 &&
            ecartExt <= 4
        ) {
            points += 1;
        }

    }

    return points;
}

function formaterDate(dateISO) {

    const date = new Date(dateISO);

    return date.toLocaleDateString(
        "fr-FR"
    );

}

function formaterHeure(dateISO) {

    const date = new Date(dateISO);

    return date.toLocaleTimeString(
        "fr-FR",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}

function afficherClassement() {

    const classement = {};

    for (let i = 0; i < localStorage.length; i++) {

        const cle = localStorage.key(i);

        if (!cle.startsWith("prono_")) {
            continue;
        }

        const prono =
            JSON.parse(
                localStorage.getItem(cle)
            );

        const resultat =
            resultats[prono.matchId];

        if (!resultat) {
            continue;
        }

        const points =
            calculerPoints(
                resultat.domicile,
                resultat.exterieur,
                prono.domicile,
                prono.exterieur
            );

        if (!classement[prono.joueur]) {
            classement[prono.joueur] = 0;
        }

        classement[prono.joueur] += points;
    }

    const rankingDiv =
        document.getElementById("ranking-list");

    rankingDiv.innerHTML = "";

    const rows =
        Object.entries(classement)
            .sort((a, b) => b[1] - a[1]);

    rows.forEach(ligne => {

        rankingDiv.innerHTML += `
            <p>
                <strong>${ligne[0]}</strong>
                : ${ligne[1]} pts
            </p>
        `;

    });
}

function afficherMatchs(competition, journee) {

    document.getElementById(
        "journeeTitre"
        ).textContent =
    "Journée " + journee;

    matchesDiv.innerHTML = "";

   const joueur =
    window.currentUser?.displayName
        ? window.currentUser.displayName.split(" ")[0]
        : "";

    const matchsJournee =
    matches[competition]
        .filter(m => m.journee === journee)
        .sort((a, b) => {return new Date(a.date) - new Date(b.date)});

    matchsJournee.forEach(match => {
        let scoreDom = "";
        let scoreExt = "";

        if (joueur) {
            console.log(
                `prono_${joueur}_${match.id}`
            );
            const pronoSauve =
                localStorage.getItem(
                    `prono_${joueur}_${match.id}`
                );

            if (pronoSauve) {
                const prono =
                    JSON.parse(pronoSauve);

                scoreDom = prono.domicile;
                scoreExt = prono.exterieur;
            }
        }

        matchesDiv.innerHTML += `

     <div class="match">

         <div class="equipes">

            <span>
                ${match.domicile}
            </span>
        
            <span>
                ${match.exterieur}
            </span>
        
        </div>

    <div class="resultat">

        <span>${match.scoreDom}</span>
    
        <span>-</span>
    
        <span>${match.scoreExt}</span>
    
    </div>
    
<div class="pronoScores">

    <div class="pronoCol">
        <input
            type="number"
            min="0"
            value="${scoreDom}"
            placeholder="0"
            id="dom-${match.id}">
    </div>

    <div class="pronoMilieu">
        -
    </div>

    <div class="pronoCol">
        <input
            type="number"
            min="0"
            value="${scoreExt}"
            placeholder="0"
            id="ext-${match.id}">
    </div>

    <div class="pronoBtn">

        <button
            onclick="enregistrerProno(${match.id})">

            Enregistrer

        </button>

    </div>

</div>
                
                <p>

                    📅 ${formaterDate(match.date)}

                    🕒 ${formaterHeure(match.date)}

                </p>

                <p class="statut ${match.statut}">

    ${
        match.statut === "avenir"
            ? "⚪ À venir"
            : match.statut === "encours"
            ? "🟠 En cours"
            : "🟢 Terminé"
    }

</p>

                <p>
                    Match n°${match.id}
                </p>

                

            </div>

        `;
    });
}

tabs.forEach(tab => {

    tab.addEventListener("click", () => {

    tabs.forEach(t => {
        t.classList.remove("active");
    });

    tab.classList.add("active");

    competitionCourante =
        tab.dataset.tab;

    afficherMatchs(
        competitionCourante,
        journeeCourante
    );

});

});

function enregistrerProno(matchId) {

    const domicile =
        document.getElementById(`dom-${matchId}`).value;

    const exterieur =
        document.getElementById(`ext-${matchId}`).value;

    if(!window.currentUser){

    alert(
        "Connecte-toi avec Google"
    );

    return;
}

const joueur =
    window.currentUser.displayName.split(" ")[0];

const pronostic = {

    joueur: joueur,
    matchId: matchId,
    domicile: domicile,
    exterieur: exterieur

};

localStorage.setItem(

    `prono_${joueur}_${matchId}`,

    JSON.stringify(pronostic)

);

afficherClassement();

alert("Pronostic enregistré");

}

document
    .getElementById("loginBtn")
    .addEventListener(
        "click",
        () => {

            loginGoogle();

        }
    );

document
.getElementById("journeeSuivante")
.addEventListener("click", () => {

    journeeCourante++;

    afficherMatchs(
        competitionCourante,
        journeeCourante
    );

});

document
.getElementById("journeePrecedente")
.addEventListener("click", () => {

    if (journeeCourante > 1) {

        journeeCourante--;

    }

    afficherMatchs(
        competitionCourante,
        journeeCourante
    );

});

afficherMatchs(
    competitionCourante,
    journeeCourante
);
afficherClassement();
