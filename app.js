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
        bonVainqueur += 1;
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
            bonusProximite =+ 1;
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

        const uid = prono.uid;

        if (!classement[uid]) {
            classement[uid] = {
                joueur: prono.joueur,
                paris: 0,
                scoreExact: 0,
                scoreJuste: 0,
                bonVainqueur: 0,
                points: 0
            };
        }

        classement[uid].paris++;

        const resultatCalcul =
            calculerPoints(
                match.scoreDom,
                match.scoreExt,
                prono.domicile,
                prono.exterieur
            );

        classement[uid].points +=
            resultatCalcul.points;

        classement[uid].scoreExact +=
            resultatCalcul.scoreExact;

        classement[uid].scoreJuste +=
            resultatCalcul.bonusProximite;

        classement[uid].bonVainqueur +=
            resultatCalcul.bonVainqueur;

    });

    const rankingDiv =
        document.getElementById("ranking-list");

    rankingDiv.innerHTML = "";

    const lignes =
        Object.values(classement)
            .sort(
                (a, b) =>
                b.points - a.points
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
                ${lignes.map(stats => {

                    const pourcentage =
                        stats.paris > 0
                            ? (
                                stats.bonVainqueur
                                /
                                stats.paris
                                * 100
                              ).toFixed(0)
                            : 0;

                    return `
                        <tr>
                            <td>${stats.joueur}</td>
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

function trouverJourneeCourante(competition) {

    const matchs =
        window.matchesParCompetition[
            competition
        ] || [];

    const journees =
        [...new Set(
            matchs.map(m => m.journee)
        )].sort((a, b) => a - b);

    for (const journee of journees) {

        const matchsJournee =
            matchs.filter(
                m => m.journee === journee
            );

        const tousTermines =
            matchsJournee.every(
                m => m.statut === "termine"
            );

        if (!tousTermines) {
            return journee;
        }
    }

    return journees[
        journees.length - 1
    ] || 1;
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
        let statutProno = "⚪";
        
        const uid = window.currentUser?.uid;

        if (uid) {
            const pronoSauve = (window.pronosTousLesJoueurs || [])
                .find(p => p.matchId === match.id && p.uid === uid);

            if (pronoSauve) {
                scoreDom = pronoSauve.domicile;
                scoreExt = pronoSauve.exterieur;

                statutProno = "🟡";
            }
        }

        const scoreDomAffiche = match.scoreDom;
        const scoreExtAffiche = match.scoreExt;
        let classeResultat = "";
        let scoreDomDore = "";
        let scoreExtDore = "";

        if (
            match.statut === "termine" &&
            scoreDom !== "" &&
            scoreExt !== ""
        ) {
        
            const resultatCalcul =
                calculerPoints(
                    match.scoreDom,
                    match.scoreExt,
                    scoreDom,
                    scoreExt
                );
        
            if (resultatCalcul.bonVainqueur) {
                classeResultat = "matchVert";
            }
        
            if (
                resultatCalcul.bonVainqueur &&
                resultatCalcul.bonusProximite
            ) {
                classeResultat = "matchVertFonce";
            }
        
            if (
                Number(scoreDom)
                ===
                match.scoreDom
            ) {
                scoreDomDore = "scoreDore";
            }
        
            if (
                Number(scoreExt)
                ===
                match.scoreExt
            ) {
                scoreExtDore = "scoreDore";
            }
        
        }
        
        const dateISO = construireDateISO(match);
        const maintenant = new Date();
        const matchCommence =
            match.statut === "encours"
            ||
            match.statut === "termine"
            ||
            (
                dateISO &&
                new Date(dateISO) <= maintenant
            );
       if (
            matchCommence &&
            statutProno !== "✅"
        ) {
        
            statutProno = "🔒";
        
        }
        
        matchesDiv.innerHTML += `
        
         <div class="match ${classeResultat}">
    
            <div class="grilleMatch">

                <div class="equipe">

                    <img
                        class="logoEquipe"
                        src="${match.logoDom}"
                        alt="${match.domicile}">
                
                    <span>
                        ${match.domicile}
                    </span>
                
                </div>
            
                <div class="separateur">
                    -
                </div>

                <div class="equipe">
               
                    <span>
                        ${match.exterieur}
                    </span>

                    <img
                        class="logoEquipe"
                        src="${match.logoExt}"
                        alt="${match.exterieur}">
                
                </div>
            
                <div class="score ${scoreDomDore}">
                    ${scoreDomAffiche ?? 0}
                </div>
            
                <div class="separateur">
                    -
                </div>
            
                <div class="score ${scoreExtDore}">
                    ${scoreExtAffiche ?? 0}
                </div>
            
                <div class="prono">
                    <input
                        type="number"
                        min="0"
                        value="${scoreDom}"
                        placeholder="0"
                        id="dom-${match.id}"
                        onchange="enregistrerProno('${match.id}')"
                        ${matchCommence ? "disabled" : ""}>
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
                        id="ext-${match.id}"
                        onchange="enregistrerProno('${match.id}')"
                        ${matchCommence ? "disabled" : ""}>
                </div>
            
            </div>
            
            <div class="actionsMatch">

                <span
                    class="etatProno"
                    id="etat-${match.id}">
                    ${statutProno}
                </span>
            
            </div>
                    
            <div class="infosMatch">

                <span>
                    📅 ${dateISO ? formaterDate(dateISO) : "?"}
                </span>
            
                <span>
                    🕒 ${dateISO ? formaterHeure(dateISO) : "?"}
                </span>
            
                <span class="statut ${match.statut}">
                    ${
                        match.statut === "avenir"
                            ? "⚪ À venir"
                            : match.statut === "encours"
                            ? "🟠 En cours"
                            : "🟢 Terminé"
                    }
                </span>
            
            </div>

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
    
    journeeCourante =
        trouverJourneeCourante(
            competitionCourante
        );
    
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
        const icone =
            document.getElementById(
                    `etat-${matchId}`
                );
            
        if (icone) {
        
            icone.textContent = "✅";
        
            setTimeout(() => {
        
                icone.textContent = "🟡";
        
            }, 2000);
        
        }
    } catch (erreur) {
        console.error("Erreur lors de l'enregistrement du pronostic :", erreur);
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

journeeCourante =
    trouverJourneeCourante(
        competitionCourante
    );

afficherMatchs(
    competitionCourante,
    journeeCourante
);
afficherClassement();

window.enregistrerProno = enregistrerProno;
window.rafraichirAffichage = function () {
    journeeCourante =
        trouverJourneeCourante(
            competitionCourante
        );
    
    afficherMatchs(
        competitionCourante,
        journeeCourante
    );
    afficherClassement();
};
