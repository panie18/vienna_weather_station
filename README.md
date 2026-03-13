# Wetterstation Wien

Live-Wetterdaten aus Wien mit einer eigenen Wetterstation — als Dashboard und offene REST-API.

**api.treesinvienna.eu**
<div align="center">
<img width="200" height="200" alt="image" src="[https://github.com/user-attachments/assets/ad52cc5a-5fd5-4481-92d8-f0d2aff88ae5](https://github.com/panie18/vienna_weather_station/blob/main/image.png)" />
</div>
---

## Was es kann

- **Live-Dashboard** mit Echtzeit-Sensordaten: Temperatur, Luftfeuchtigkeit, Wind, Niederschlag, Sonnenschein, Beleuchtungsstärke und gefühlte Temperatur
- **Interaktive Verlaufscharts** mit wählbarem Zeitraum (6h, 24h, 7d, 30d, 90d)
- **Offene REST-API** mit CORS — frei nutzbar für eigene Projekte
- **Datenexport** als CSV oder JSON (bis zu 365 Tage)
- Automatische Aufzeichnung alle 5 Minuten in einer lokalen SQLite-Datenbank

---

## Design

Das Frontend folgt **Material Design 3** mit dynamischem Theming, das sich je nach Tageszeit anpasst. Die UI-Komponenten nutzen morphende Shapes aus der `@m3e/web`-Library — jede Sensorkarte hat eine eigene Shape-Animation.

**Technik:**
- React + TypeScript, gebaut mit Vite
- Chart.js für die Verlaufsgraphen
- Google Sans + Material Icons Round
- Keine externen Tracking-Scripts, keine Cookies

---

## API

Basis-URL: `https://api.treesinvienna.eu/api/weather/`

### `GET /current`
Aktuelle Messwerte aller Sensoren.

```json
{
  "temperature": {"value": "12.4", "unit": "°C"},
  "humidity":    {"value": "68.0", "unit": "%"},
  "wind_speed":  {"value": "5.2",  "unit": "km/h"},
  "station":     "Wetterstation Wien"
}
```

### `GET /history?hours=24`
Zeitreihendaten (Temperatur, Luftfeuchtigkeit, Wind). Alternativ: `?days=7`

### `GET /export?format=csv&days=30`
Download als CSV oder JSON. Bis zu 365 Tage.

### `GET /stats`
Datenbankstatistik (Anzahl Einträge, erster/letzter Zeitstempel).

---

## Tech-Stack

| Schicht | Technologie |
|---------|-------------|
| Sensor | HomematicIP HmIP-SWO-PL |
| Backend | Python, FastAPI, uvicorn, SQLite |
| Frontend | React, TypeScript, Vite, Chart.js |
| Design | Material Design 3, @m3e/web Shapes |
| Hosting | Raspberry Pi, nginx, Cloudflare Tunnel |

---

## Projektstruktur

```
weather-api/
├── app.py                      # FastAPI Backend
├── requirements.txt            # Python-Abhängigkeiten
├── weather-api.service.example # systemd-Service-Vorlage
├── weather-nginx.conf          # nginx-Konfiguration
│
├── frontend/                   # Build (statisch)
│   ├── index.html
│   └── assets/
│
└── frontend-src/               # Quellcode
    ├── src/
    │   ├── App.tsx
    │   ├── api.ts
    │   ├── theme.ts
    │   ├── types.ts
    │   ├── utils.ts
    │   └── components/
    │       ├── HistoryChart.tsx
    │       ├── LegalModal.tsx
    │       ├── M3Shape.tsx
    │       └── SensorCard.tsx
    ├── package.json
    └── vite.config.ts
```

---

## Setup

```bash
# Backend
python3 -m venv venv && source venv/bin/activate
pip install fastapi uvicorn httpx

# Frontend
cd frontend-src && npm install && npm run build

# Service einrichten
sudo cp weather-api.service.example /etc/systemd/system/weather-api.service
# Umgebungsvariablen in der Service-Datei eintragen
sudo systemctl enable --now weather-api
```

Die Datenbank wird beim ersten Start automatisch erstellt.

---

## Sensor

**HomematicIP HmIP-SWO-PL** — Außen-Wettersensor mit Lichtsensor von eQ-3. Erfasst Temperatur, Luftfeuchtigkeit, Wind, Niederschlag, Sonnenschein und Beleuchtungsstärke. Messwerte werden alle 5 Minuten in der Datenbank gespeichert.

---

## Support

Bei Fragen, Feedback oder Problemen:

- **E-Mail:** support@treesinvienna.eu
- **Telefon:** +43 720 699 0677
- **GitHub Issues:** Issues in diesem Repository erstellen
