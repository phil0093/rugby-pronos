import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import json
import os
import requests
from bs4 import BeautifulSoup


BASE_URL = "https://top14.lnr.fr/calendrier-et-resultats"
SAISON = "2026-2027"
EQUIPES_URL = {
    "RC Vannes": "vannes",
    "Stade Toulousain": "toulouse",
    "Castres Olympique": "castres",
    "RC Toulon": "toulon",
    "Aviron Bayonnais": "bayonne",
    "ASM Clermont": "clermont",
    "Stade Rochelais": "la-rochelle",
    "Racing 92": "racing-92",
    "LOU Rugby": "lyon",
    "Section Paloise": "pau",
    "Montpellier Hérault Rugby": "montpellier",
    "USA Perpignan": "perpignan",
    "Union Bordeaux-Bègles": "bordeaux-begles",
    "Stade Français Paris": "paris"
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
            return None, None

        texte_score = (
            score_bloc.get_text(
                strip=True
            )
        )

        if " - " not in texte_score:
            return None, None

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

        return None, None


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

print(
    f"Journée détectée : {journee}"
)

# ---------------------
# MATCHS FIRESTORE
# ---------------------

docs = (
    db.collection("matchs")
      .where(
          "competition",
          "==",
          "top14"
      )
      .where(
          "journee",
          "==",
          journee
      )
      .stream()
)

matchs = [doc.to_dict() for doc in docs]

print(
    f"{len(matchs)} matchs trouvés"
)

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
    
        print(
            f"Nom équipe inconnu : "
            f"{match['domicile']} / "
            f"{match['exterieur']}"
        )
    
        continue
    
    url_match = (
        f"https://top14.lnr.fr/"
        f"feuille-de-match/"
        f"{SAISON}/"
        f"j{journee}/"
        f"{match['id_lnr']}-"
        f"{nom_dom}-"
        f"{nom_ext}"
    )
    print(url_match)

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

    print(
        f"{id_lnr} -> "
        f"{score_dom}-{score_ext}"
    )

print("Mise à jour terminée")
