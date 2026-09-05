import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import json
import os
import requests
from bs4 import BeautifulSoup


BASE_URL = "https://prod2.lnr.fr/calendrier-et-resultats"
SAISON = "2026-2027"
NB_JOURNEES = 30

MOIS = {
    "janvier": "01", "février": "02", "mars": "03", "avril": "04",
    "mai": "05", "juin": "06", "juillet": "07", "août": "08",
    "septembre": "09", "octobre": "10", "novembre": "11", "décembre": "12"
}


def parse_date(texte_date):
    """Convertit un texte du type 'samedi 05 septembre' en 'YYYY-MM-DD'."""
    if not texte_date:
        return ""

    texte_date = texte_date.lower().split("–")[0].strip()
    morceaux = texte_date.split()

    if len(morceaux) < 3:
        return ""

    jour = morceaux[1].zfill(2)
    mois_num = MOIS.get(morceaux[2])

    if not mois_num:
        return ""

    annee = "2027" if mois_num in ["01", "02", "03", "04", "05", "06"] else "2026"

    return f"{annee}-{mois_num}-{jour}"


def get_journee_actuelle():
    """
    Récupère le numéro de la journée en cours en lisant le titre affiché
    par défaut sur la page calendrier principale (sans suffixe /jX).
    """

    response = requests.get(
        BASE_URL,
        headers={"User-Agent": "Mozilla/5.0"}
    )
    soup = BeautifulSoup(response.text, "html.parser")

    titre_bloc = soup.select_one(".calendar-results__title")

    if titre_bloc is None:
        raise ValueError("Impossible de trouver le titre de la journée en cours.")

    texte = titre_bloc.get_text(strip=True)  # ex: "Journée 1"
    chiffres = "".join(filter(str.isdigit, texte))

    if not chiffres:
        raise ValueError(f"Impossible d'extraire un numéro de journée depuis : '{texte}'")

    return int(chiffres)


def scrape_journee(journee):
    """Scrape une journée donnée et renvoie la liste des matchs trouvés."""

    url = f"{BASE_URL}/{SAISON}/j{journee}"

    response = requests.get(
        url,
        headers={"User-Agent": "Mozilla/5.0"}
    )

    soup = BeautifulSoup(response.text, "html.parser")

    elements = soup.select(
        ".calendar-results__fixture-date, .calendar-results__line"
    )

    date_courante = ""
    matchs_journee = []

    for elem in elements:

        classes = elem.get("class", [])

        if "calendar-results__fixture-date" in classes:
            date_courante = parse_date(elem.get_text(strip=True))
            continue

        match = elem.select_one(".match-calendar-line")

        if match is None:
            continue

        equipes = match.select(".club-line__name")
        heure = match.select_one(".match-line__time")
        score = match.select_one(".match-line__score")

        score_dom = None
        score_ext = None
        statut = "avenir"

        if score:
            statut = "termine"
            texte_score = score.get_text(strip=True)

            if " - " in texte_score:
                score_dom, score_ext = texte_score.split(" - ")
                score_dom = int(score_dom)
                score_ext = int(score_ext)

        lien = match.select_one('a[href*="feuille-de-match"]')
        url_match = lien["href"] if lien else ""
        id_lnr = ""

        if "/j" in url_match:
            morceau = url_match.split("/")[-1]
            id_lnr = morceau.split("-")[0]

        if len(equipes) < 2:
            continue

        matchs_journee.append({
            "id_lnr": id_lnr,
            "competition": "prod2",
            "saison": SAISON,
            "journee": journee,
            "domicile": equipes[0].get_text(strip=True),
            "exterieur": equipes[1].get_text(strip=True),
            "heure": heure.get_text(strip=True).replace("h", ":") if heure else "00:00",
            "date": date_courante,
            "scoreDom": score_dom,
            "scoreExt": score_ext,
            "statut": statut
        })

    print(f"J{journee}: {len(matchs_journee)} matchs trouvés")

    return matchs_journee


# --- Programme principal ---

firebase_json = json.loads(os.environ["FIREBASE_CREDENTIALS"])
cred = credentials.Certificate(firebase_json)
firebase_admin.initialize_app(cred)
db = firestore.client()

journee_actuelle = get_journee_actuelle()
print(f"Journée actuelle détectée : {journee_actuelle}")

journees_a_traiter = [
    j for j in [journee_actuelle - 1, journee_actuelle, journee_actuelle + 1]
    if 1 <= j <= NB_JOURNEES
]

print(f"Journées à mettre à jour : {journees_a_traiter}")

all_matchs = []
for j in journees_a_traiter:
    all_matchs.extend(scrape_journee(j))

print(f"{len(all_matchs)} matchs au total")

for match in all_matchs:
    db.collection("matchs").document(match["id_lnr"]).set(match)

print(f"{len(all_matchs)} matchs écrits dans Firestore")
