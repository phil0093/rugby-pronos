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
    
            statut: "termine"
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
    let bonVainqueur = 0;
    let scoreExact = 0;
    let bonusProximite = 0;
    
    const vainqueurReel =
        reelDom > reelExt ? "D" :
        reelExt > reelDom ? "E" :
        "N";

    const vainqueurProno =
        pronoDom > pronoExt ? "D" :
        pronoExt > pronoDom ? "E" :
        "N";

    if (vainqueurReel === vainqueurProno) {
        bonVainqueur = 1;
        points += 3;

        if (Number(pronoDom) === reelDom) {
            scoreExact = 1
            points += 1;
        }

        if (Number(pronoExt) === reelExt) {
            scoreExact = 1
            points += 1;
        }

        
        const ecartDom =
            Math.abs(Number(pronoDom) - reelDom);

        const ecartExt =
            Math.abs(Number(pronoExt) - reelExt);

        if (
            ecartDom <= 4 &&
            ecartExt <= 4
        ) {
            bonusProximite = 1;
            points += 2;
        }

    }

    return {
        points,
        bonVainqueur,
        scoreExact,
        bonusProximite
    };
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

        const match = Object
            .values(matches)
            .flat()
            .find(m => m.id === prono.matchId);

        if (!match) {
            continue;
        }

        if (
            match.statut !== "encours" &&
            match.statut !== "termine"
        ) {
            continue;
        }

        const resultat =
            resultats[prono.matchId];

        if (!resultat) {
            continue;
        }

        const joueur = prono.joueur;

        if (!classement[joueur]) {

            classement[joueur] = {

                paris: 0,
                scoreExact: 0,
                scoreJuste: 0,
                points: 0

            };

        }

        classement[joueur].paris++;

        const points =
            calculerPoints(

                resultat.domicile,
                resultat.exterieur,

                prono.domicile,
                prono.exterieur

            );

        classement[joueur].points += points;

        const exactDom =
            Number(prono.domicile) === resultat.domicile;

        const exactExt =
            Number(prono.exterieur) === resultat.exterieur;

        if (exactDom && exactExt) {

            classement[joueur].scoreExact++;

        }

        const vainqueurReel =
            resultat.domicile > resultat.exterieur
                ? "D"
                : resultat.exterieur > resultat.domicile
                ? "E"
                : "N";

        const vainqueurProno =
            prono.domicile > prono.exterieur
                ? "D"
                : prono.exterieur > prono.domicile
                ? "E"
                : "N";

        if (vainqueurReel === vainqueurProno) {

            classement[joueur].scoreJuste++;

        }

    }

    const rankingDiv =
        document.getElementById("ranking-list");

    rankingDiv.innerHTML = "";

    const lignes =
        Object.entries(classement)
            .sort(
                (a, b) =>
                b[1].points - a[1].points
            );

    rankingDiv.innerHTML = `

        <table class="classementTable">

            <thead>

                <tr>

                    <th>Joueur</th>
                    <th>Paris</th>
                    <th>Scores exacts</th>
                    <th>Scores justes</th>
                    <th>% Victoire</th>
                    <th>Points</th>

                </tr>

            </thead>

            <tbody>

                ${lignes.map(ligne => {

                    const nom = ligne[0];

                    const stats = ligne[1];

                    const pourcentage =
                        stats.paris > 0
                            ? (
                                stats.scoreJuste
                                /
                                stats.paris
                                * 100
                              ).toFixed(0)
                            : 0;

                    return `

                        <tr>

                            <td>${nom}</td>

                            <td>${stats.paris}</td>

                            <td>${stats.scoreExact}</td>

                            <td>${stats.scoreJuste}</td>

                            <td>${pourcentage}%</td>

                            <td>${stats.points}</td>

                        </tr>

                    `;

                }).join("")}

            </tbody>

        </table>

    `;

}

function afficherMatchs(competition, journee) {

    document.getElementById(
        "journeeTitre"
        ).textContent =
    "Journée " + journee;

    matchesDiv.innerHTML = "";

   const joueur =
    window.currentUser?.displayName
        ?.split(" ")[0]
        || "";

    const matchsJournee =
    matches[competition]
        .filter(m => m.journee === journee)
        .sort((a, b) =>  new Date(a.date) - new Date(b.date));

    matchsJournee.forEach(match => {
        let scoreDom = "";
        let scoreExt = "";

        if (joueur) {
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

        const resultatMatch =
            resultats[match.id];
        
        const scoreDomAffiche =
            resultatMatch
                ? resultatMatch.domicile
                : match.scoreDom;
        
        const scoreExtAffiche =
            resultatMatch
            ? resultatMatch.exterieur
            : match.scoreExt;
        
        matchesDiv.innerHTML += `

         <div class="match">
    
            <div class="grilleMatch">

                <div class="equipe">
                    ${match.domicile}
                </div>
            
                <div class="separateur">
                    -
                </div>
            
                <div class="equipe">
                    ${match.exterieur}
                </div>
            
                <div class="score">
                    ${${scoreDomAffiche ?? 0}
                </div>
            
                <div class="separateur">
                    -
                </div>
            
                <div class="score">
                    ${scoreExtAffiche ?? 0}
                </div>
            
                <div class="prono">
                    <input
                        type="number"
                        min="0"
                        value="${scoreDom}"
                        placeholder="0"
                        id="dom-${match.id}">
                </div>
            
                <div class="separateur">
                    -
                </div>
            
                <div class="prono">
                    <input
                        type="number"
                        min="0"
                        value="${scoreExt}"
                        placeholder="0"
                        id="ext-${match.id}">
                </div>
            
            </div>
            
            <div class="actionsMatch">
            
                <button
                    onclick="enregistrerProno(${match.id})">
            
                    Enregistrer
            
                </button>
            
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
