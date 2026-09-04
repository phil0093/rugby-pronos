import requests
from bs4 import BeautifulSoup
import json

URL = "https://top14.lnr.fr/calendrier-et-resultats"

response = requests.get(
    URL,
    headers={
        "User-Agent":
        "Mozilla/5.0"
    }
)

soup = BeautifulSoup(
    response.text,
    "html.parser"
)

matchs = []

for match in soup.select(
    ".match-calendar-line"
):

    equipes = match.select(
        ".club-line__name"
    )

    heure = match.select_one(
        ".match-line__time"
    )

    if len(equipes) < 2:
        continue

    matchs.append({

        "competition": "top14",

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
            ) if heure else ""

    })

with open(
    "matchs.json",
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        matchs,
        f,
        ensure_ascii=False,
        indent=4
    )

print(
    f"{len(matchs)} matchs trouvés"
)
``
