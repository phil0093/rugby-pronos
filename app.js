// Reconstruit une date ISO complète à partir des champs séparés
// "date" (YYYY-MM-DD) et "heure" (HH:MM) stockés dans Firestore.
function construireDateISO(match) {

    if (!match.date) {
        return null;
    }

    const heure = match.heure || "00:00";

    return `${match.date}T${heure}:00`;
}

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
            scoreExact += 1
            points += 1;
        }

        if (Number(pronoExt) === reelExt) {
            scoreExact += 1
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

    (window.pronosTousLesJoueurs || []).forEach(prono => {

        const match = Object
            .values(window.matchesParCompetition)
            .flat()
            .find(m => m.id === prono.matchId);

        if (!match) {
            return;
        }

        if (
            match.statut !== "encours" &&
            match.statut !== "termine"
        ) {
            return;
        }

        if (
            match.scoreDom === null ||
            match.scoreDom === undefined ||
            match.scoreExt === null ||
            match.scoreExt === undefined
        ) {
            return;
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

        const resultatCalcul =
            calculerPoints(

                match.scoreDom,
                match.scoreExt,

                prono.domicile,
                prono.exterieur

            );

        classement[joueur].points +=
            resultatCalcul.points;

        classement[joueur].scoreExact +=
            resultatCalcul.scoreExact;

        classement[joueur].scoreJuste +=
            resultatCalcul.bonVainqueur;

    });

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

    const matchsCompetition =
        window.matchesParCompetition[competition] || [];

    const matchsJournee =
        matchsCompetition
            .filter(m => m.journee === journee)
            .sort((a, b) =>
                new Date(construireDateISO(a))
                - new Date(construireDateISO(b))
            );

    matchsJournee.forEach(match => {
        let scoreDom = "";
        let scoreExt = "";

        const uid = window.currentUser?.uid;

        if (uid) {
            const pronoSauve = (window.pronosTousLesJoueurs || [])
                .find(p => p.matchId === match.id && p.uid === uid);

            if (pronoSauve) {
                scoreDom = pronoSauve.domicile;
                scoreExt = pronoSauve.exterieur;
            }
        }

        const scoreDomAffiche = match.scoreDom;
        const scoreExtAffiche = match.scoreExt;

        const dateISO = construireDateISO(match);

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
                    ${scoreDomAffiche ?? 0}
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
                    onclick="enregistrerProno('${match.id}')">
            
                    Enregistrer
            
                </button>
            
            </div>
                    
            <p>
    
                📅 ${dateISO ? formaterDate(dateISO) : "?"}
    
                🕒 ${dateISO ? formaterHeure(dateISO) : "?"}
    
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

async function enregistrerProno(matchId) {

    const domicile =
        document.getElementById(`dom-${matchId}`).value;

    const exterieur =
        document.getElementById(`ext-${matchId}`).value;

    if (!window.currentUser) {
        alert("Connecte-toi avec Google");
        return;
    }

    try {
        await window.enregistrerPronoFirestore(matchId, domicile, exterieur);
        alert("Pronostic enregistré");
    } catch (erreur) {
        console.error("Erreur lors de l'enregistrement du pronostic :", erreur);
        alert("Erreur lors de l'enregistrement du pronostic");
    }

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
window.enregistrerProno = enregistrerProno;
window.rafraichirAffichage = function () {
    afficherMatchs(
        competitionCourante,
        journeeCourante
    );
    afficherClassement();
};
