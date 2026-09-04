import requests

URL = "https://top14.lnr.fr/calendrier-et-resultats"

response = requests.get(
    URL,
    headers={
        "User-Agent": "Mozilla/5.0"
    }
)

print(response.status_code)

print(
    "match-calendar-line",
    response.text.count(
        "match-calendar-line"
    )
)

print(
    "Aviron Bayonnais",
    "Aviron Bayonnais" in response.text
)
