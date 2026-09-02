const matches = {

    top14: [

        {
            id: 1,
            domicile: "Stade Toulousain",
            exterieur: "La Rochelle",
            date: "05/09/2026 21:05"
        },

        {
            id: 2,
            domicile: "RC Toulon",
            exterieur: "ASM Clermont",
            date: "06/09/2026 21:05"
        }

    ],

    prod2: [

        {
            id: 3,
            domicile: "CA Brive",
            exterieur: "Oyonnax",
            date: "05/09/2026 19:30"
        },

        {
            id: 4,
            domicile: "Grenoble",
            exterieur: "Biarritz",
            date: "06/09/2026 19:30"
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
function afficherMatchs(competition) {

    matchesDiv.innerHTML = "";

    const joueur =
    window.currentUser
        ? window.currentUser.displayName
        : "";

    matches[competition].forEach(match => {

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

        matchesDiv.innerHTML += `

            <div class="match">

                <h3>
                    ${match.domicile} -
                    ${match.exterieur}
                </h3>

                <p>
                    📅 ${match.date}
                </p>

                <p>
                    Match n°${match.id}
                </p>

                <div class="prono">

                    <input
                        type="number"
                        min="0"
                        value="${scoreDom}"
                        placeholder="Domicile"
                        id="dom-${match.id}">

                    <input
                        type="number"
                        min="0"
                        value="${scoreExt}"
                        placeholder="Extérieur"
                        id="ext-${match.id}">

                    <button
                        onclick="enregistrerProno(${match.id})">

                        Enregistrer

                    </button>

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

        afficherMatchs(tab.dataset.tab);

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

afficherMatchs("top14");
afficherClassement();
