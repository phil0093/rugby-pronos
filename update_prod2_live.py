import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import json
import os
import requests
from bs4 import BeautifulSoup


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


def lire_score_match(url_match):

    try:

        response = requests.get(
            url_match,
            headers={
                "User-Agent": "Mozilla/5.0"
            },
            timeout=10
        )

        soup = BeautifulSoup(
            response.text,
            "html.parser"
        )

        score_bloc = soup.select_one(
            ".title--large.title--textured.title--centered"
        )

        if not score_bloc:
            return None, None, "avenir"

        texte_score = (
            score_bloc.get_text(
                strip=True
            )
        )

        if " - " not in texte_score:
            return None, None, "avenir"

        score_dom, score_ext = (
            texte_score.split(" - ")
        )

        statut_bloc = soup.select_one(
            ".match-header__season-day"
        )
        
        if statut_bloc:
        
            texte_statut = statut_bloc.get_text(
                strip=True
            ).lower()
        
            if "terminé" in texte_statut:
                statut = "termine"
        
            elif "en cours" in texte_statut:
                statut = "encours"
        
            else:
                statut = "avenir"
        
        else:
        
            statut = "avenir"

        return (
                int(score_dom),
                int(score_ext),
                statut
            )
    except Exception as e:

        print(
            f"Erreur {url_match} : {e}"
        )

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
      .where(
          "competition",
          "==",
          "prod2"
      )
      .where(
          "journee",
          "==",
          journee
      )
      .stream()
)

matchs = [doc.to_dict() for doc in docs]

# ---------------------
# UPDATE LIVE
# ---------------------

for match in matchs:

    id_lnr = match["id_lnr"]

    nom_dom = EQUIPES_URL.get(
        match["domicile"]
    )
    
    nom_ext = EQUIPES_URL.get(
        match["exterieur"]
    )
    
    if not nom_dom or not nom_ext:
    
        continue
    
    url_match = (
        f"https://prod2.lnr.fr/"
        f"feuille-de-match/"
        f"{SAISON}/"
        f"j{journee}/"
        f"{match['id_lnr']}-"
        f"{nom_dom}-"
        f"{nom_ext}"
    )

    score_dom, score_ext, statut = (
        lire_score_match(
            url_match
        )
    )

    if score_dom is None:
        continue

    db.collection("matchs") \
      .document(id_lnr) \
      .update({

          "scoreDom": score_dom,

          "scoreExt": score_ext,

          "statut": statut

      })
