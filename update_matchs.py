import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import json
import os
import requests
from bs4 import BeautifulSoup

BASE_URL = "https://top14.lnr.fr/calendrier-et-resultats/2026-2027"

all_matchs = []

firebase_json = json.loads(
    os.environ["FIREBASE_CREDENTIALS"]
)

cred = credentials.Certificate(
    firebase_json
)

firebase_admin.initialize_app(
    cred
)

db = firestore.client()

for journee in range(1, 27):

    url = f"{BASE_URL}/j{journee}"

    response = requests.get(
        url,
        headers={
            "User-Agent": "Mozilla/5.0"
        }
    )

    soup = BeautifulSoup(
        response.text,
        "html.parser"
    )

    for match in soup.select(".match-calendar-line"):

        equipes = match.select(
            ".club-line__name"
        )

        heure = match.select_one(
            ".match-line__time"
        )

        score = match.select_one(
            ".match-line__score"
        )

        score_dom = None
        score_ext = None
        statut = "avenir"
        
        if score:
        
            statut = "termine"
        
            texte_score = score.get_text(
                strip=True
            )
        
            if " - " in texte_score:
        
                score_dom, score_ext = (
                    texte_score.split(" - ")
                )
                score_dom = int(score_dom)
                score_ext = int(score_ext)
                
        lien = match.select_one(
            'a[href*="feuille-de-match"]'
        )
        
        url_match = (
            lien["href"]
            if lien else ""
        )
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

            "domicile":
                equipes[0].get_text(
                    strip=True
                ),

            "exterieur":
                equipes[1].get_text(
                    strip=True
                ),

            "heure":
                heure.get_text(
                    strip=True
                ) if heure else "",

            "scoreDom": score_dom,

            "scoreExt": score_ext,

            "statut": statut

        })

print(
    f"{len(all_matchs)} matchs trouvés"
)
print(all_matchs[:3])

for match in all_matchs:

    db.collection("matchs") \
      .document(match["id_lnr"]) \
      .set(match)

print(
    f"{len(all_matchs)} matchs écrits dans Firestore"
)

