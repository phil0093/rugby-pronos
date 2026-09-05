import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import json
import os
import requests
from bs4 import BeautifulSoup


BASE_URL = "https://top14.lnr.fr/calendrier-et-resultats/2026-2027"

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


all_matchs = []

firebase_json = json.loads(os.environ["FIREBASE_CREDENTIALS"])
cred = credentials.Certificate(firebase_json)
firebase_admin.initialize_app(cred)
db = firestore.client()

for journee in range(1, 27):

    url = f"{BASE_URL}/j{journee}"

    response = requests.get(
        url,
        headers={"User-Agent": "Mozilla/5.0"}
    )

    soup = BeautifulSoup(response.text, "html.parser")

    # On récupère, dans l'ordre du HTML, les blocs date ET les blocs ligne
    # (chaque bloc ligne contient un match). C'est cet ordre qui permet
    # d'associer la bonne date à chaque match.
    elements = soup.select(
        ".calendar-results__fixture-date, .calendar-results__line"
    )

    date_courante = ""

    for elem in elements:

        classes = elem.get("class", [])

        # Cas 1 : bloc-date -> on met à jour la date courante
        if "calendar-results__fixture-date" in classes:
            date_courante = parse_date(elem.get_text(strip=True))
            print(f"J{journee}: nouvelle date -> {date_courante}")
            continue

        # Cas 2 : bloc-ligne -> il contient un .match-calendar-line
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

        all_matchs.append({
            "id_lnr": id_lnr,
            "competition": "top14",
            "saison": "2026-2027",
            "journee": journee,
            "domicile": equipes[0].get_text(strip=True),
            "exterieur": equipes[1].get_text(strip=True),
            "heure": heure.get_text(strip=True).replace("h", ":") if heure else "00:00",
            "date": date_courante,
            "scoreDom": score_dom,
            "scoreExt": score_ext,
            "statut": statut
        })

print(f"{len(all_matchs)} matchs trouvés")
print(all_matchs[:3])

for match in all_matchs:
    db.collection("matchs").document(match["id_lnr"]).set(match)

print(f"{len(all_matchs)} matchs écrits dans Firestore")
