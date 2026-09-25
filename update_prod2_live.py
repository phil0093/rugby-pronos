import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import json
import os
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import re

BASE_URL = "https://prod2.lnr.fr/calendrier-et-resultats"
SAISON = "2026-2027"
EQUIPES_URL = {
    "Stade Aurillacois": "aurillac",
    "CA Brive": "brive",
    "Nissa Rugby": "nice",
    "FC Grenoble Rugby": "grenoble",
    "Colomiers Rugby": "colomiers",
    "US Dax": "dax",
    "US Montauban": "montauban",
    "AS Béziers Hérault": "beziers",
    "RC Narbonnais": "narbonne",
    "Soyaux-Angoulême XV": "angouleme",
    "USON Nervers": "nevers",
    "Biarritz Olympique PB": "biarritz",
    "Valence Romans": "valence-romans",
    "Provence Rugby": "provence-rugby",
    "SU Agen": "agen",
    "Oyonnax Rugby": "oyonnax"
}

def get_journee_actuelle():

    response = requests.get(
        BASE_URL,
        headers={
            "User-Agent": "Mozilla/5.0"
        }
    )

    soup = BeautifulSoup(
        response.text,
        "html.parser"
    )

    titre = soup.select_one(
        ".calendar-results__title"
    )

    if not titre:
        raise Exception(
            "Journée introuvable"
        )

    texte = titre.get_text(
        strip=True
    )

    chiffres = "".join(
        filter(
            str.isdigit,
            texte
        )
    )

    return int(chiffres)


def lire_score_match_playwright(url_match):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url_match, timeout=20000)

        # -------------------------
        # 1. MATCH EN COURS (LIVE)
        # -------------------------
        live = page.locator(".match-header-broadcast__live-rec")
        print("DEBUG :", url_match), live
        if live.count() > 0:
            txt = live.inner_text().strip().lower()

            # Détection stricte du LIVE
            if "live" in txt:
                # Score brut
                score_raw = page.locator(".score").inner_text().strip()
                print("DEBUG SCORE ENCOURS :", repr(score_raw), url_match), live
                # On prend uniquement la première ligne avant le \n
                first_line = score_raw.split("\n")[0].strip()

                # Extraction du score X - Y
                match = re.search(r"(\d+)\s*-\s*(\d+)", first_line)
                if match:
                    dom = int(match.group(1))
                    ext = int(match.group(2))
                    browser.close()
                    return dom, ext, "encours"

        # -------------------------
        # 2. MATCH TERMINÉ (inchangé)
        # -------------------------
        fini = page.locator(".match-header__season-day")
        if fini.count() > 0:
            if "terminé" in fini.inner_text().lower():
                score_raw = page.locator(".title--large.title--textured.title--centered").inner_text().strip()
                print("DEBUG SCORE TERMINE :", repr(score_raw), url_match), live
                
                match = re.search(r"(\d+)\s*-\s*(\d+)", score_raw)
                if match:
                    dom = int(match.group(1))
                    ext = int(match.group(2))
                    browser.close()
                    return dom, ext, "termine"

        # -------------------------
        # 3. SINON → À VENIR
        # -------------------------
        browser.close()
        return None, None, "avenir"

# ---------------------
# FIRESTORE
# ---------------------

firebase_json = json.loads(
    os.environ[
        "FIREBASE_CREDENTIALS"
    ]
)

cred = credentials.Certificate(
    firebase_json
)

firebase_admin.initialize_app(
    cred
)

db = firestore.client()

# ---------------------
# JOURNEE COURANTE
# ---------------------

journee = get_journee_actuelle()

# ---------------------
# MATCHS FIRESTORE
# ---------------------

docs = (
    db.collection("matchs")
      .where("competition", "==", "prod2")
      .where("journee", "==", journee)
      .stream()
)

matchs = [(doc.reference, doc.to_dict()) for doc in docs]

# ---------------------
# UPDATE LIVE
# ---------------------

for ref, match in matchs:
    nom_dom = EQUIPES_URL.get(match["domicile"])
    nom_ext = EQUIPES_URL.get(match["exterieur"])
    if not nom_dom or not nom_ext:
        continue

    url_match = (
        f"https://prod2.lnr.fr/feuille-de-match/{SAISON}/"
        f"j{journee}/{match['id_lnr']}-{nom_dom}-{nom_ext}"
    )

    score_dom, score_ext, statut = lire_score_match_playwright(url_match)

    if score_dom is None:
        continue

    ref.update({
        "scoreDom": score_dom,
        "scoreExt": score_ext,
        "statut": statut
    })
