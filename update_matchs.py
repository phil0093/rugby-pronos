import requests
from bs4 import BeautifulSoup

BASE_URL = "https://top14.lnr.fr/calendrier-et-resultats/2026-2027"

all_matchs = []

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
        
        lien = match.select_one(
            'a[href*="feuille-de-match"]'
        )
        
        url_match = (
            lien["href"]
            if lien else ""
        )

        if len(equipes) < 2:
            continue

        all_matchs.append({

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

            "id_lnr":
                url_match

        })

print(
    f"{len(all_matchs)} matchs trouvés"
)
print(all_matchs[:3])

