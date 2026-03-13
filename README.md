# Wetterstation Wien – Weather API

Eine selbst gehostete Wetterstation-API für Wien, die Sensordaten einer **HomematicIP HmIP-SWO-PL** Wetterstation über Home Assistant abruft, in einer lokalen SQLite-Datenbank speichert und über eine REST-API sowie ein React-Frontend bereitstellt.

Öffentlich erreichbar unter: **api.treesinvienna.eu**

---

## Architektur

```
[HmIP-SWO-PL Sensor]
        │
        ▼
[Home Assistant]  ←── homeassistant.local:8123
        │
        ▼
[FastAPI Backend]  ←── 127.0.0.1:8000  (systemd: weather-api.service)
   + SQLite DB       ←── /home/pauli/weather-api/weather.db
        │
        ▼
[Nginx Reverse Proxy]  ←── port 80
   /api/weather/*  →  FastAPI
   /*              →  React Frontend (/var/www/weather)
```

---

## Komponenten

### Backend – `app.py`

Python-basierte REST-API mit **FastAPI** und **uvicorn**.

**Gemessene Sensordaten:**

| Feld              | Einheit | Beschreibung              |
|-------------------|---------|---------------------------|
| `temperature`     | °C      | Temperatur                |
| `humidity`        | %       | Luftfeuchtigkeit          |
| `wind_speed`      | km/h    | Windgeschwindigkeit        |
| `rain_total`      | mm      | Regenzähler gesamt        |
| `illuminance`     | lx      | Beleuchtungsstärke        |
| `sunshine_min`    | min     | Sonnenscheindauer         |
| `is_raining`      | bool    | Regen aktiv (ja/nein)     |

**Automatische Aufzeichnung:** Alle **5 Minuten** wird ein Messwert in der SQLite-Datenbank gespeichert (Background-Task `record_loop`).

**In-Memory Cache:** Aktuelle Messwerte werden **30 Sekunden** gecacht, um die Home-Assistant-API zu entlasten.

---

## API-Endpunkte

Basis-URL: `http://api.treesinvienna.eu/api/weather/`

### `GET /api/weather/current`
Gibt den aktuellen Messwert zurück (30s Cache).

```json
{
  "temperature": {"value": "12.4", "unit": "°C", "name": "Temperatur", "last_updated": "..."},
  "humidity":    {"value": "68.0", "unit": "%",  ...},
  "wind_speed":  {"value": "5.2",  "unit": "km/h", ...},
  ...
  "fetched_at": "2026-03-13T10:00:00+00:00",
  "station":    "Wetterstation Wien - HmIP-SWO-PL"
}
```

### `GET /api/weather/history`
Historische Daten (Temperatur, Luftfeuchtigkeit, Wind).

| Parameter | Standard | Beschreibung                     |
|-----------|----------|----------------------------------|
| `hours`   | `24`     | Anzahl der Stunden (max. 8760)   |
| `days`    | –        | Alternativ: Anzahl der Tage      |

Fallback auf Home-Assistant-History-API wenn die lokale DB < 10 Einträge hat (max. 168h).

```json
{
  "data": {
    "temperature": [{"t": "2026-03-13T09:00:00Z", "v": 11.2}, ...],
    "humidity":    [...],
    "wind_speed":  [...]
  },
  "hours": 24,
  "source": "db",
  "points": 288
}
```

### `GET /api/weather/export`
Datenexport als CSV oder JSON.

| Parameter | Standard | Erlaubte Werte   |
|-----------|----------|------------------|
| `format`  | `csv`    | `csv`, `json`    |
| `days`    | `30`     | 1–365            |

Dateinamen: `wetterstation_30d.csv` / `wetterstation_30d.json`

### `GET /api/weather/stats`
Datenbankstatistik.

```json
{"count": 4320, "first": "2026-01-01T00:00:00Z", "last": "2026-03-13T10:00:00Z"}
```

---

## Deployment

### Systemanforderungen

- Python 3.13+
- nginx
- systemd
- SQLite (kein separater Datenbankserver nötig)

### Installation

```bash
# Repository klonen
git clone ... /home/pauli/weather-api
cd /home/pauli/weather-api

# Virtual Environment
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn httpx

# Datenbank wird beim ersten Start automatisch erstellt
```

### Systemd Service einrichten

```bash
sudo cp weather-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable weather-api
sudo systemctl start weather-api
```

**Service-Datei (`weather-api.service`):**

```ini
[Unit]
Description=Wetterstation Wien API
After=network.target

[Service]
User=pauli
WorkingDirectory=/home/pauli/weather-api
ExecStart=/home/pauli/weather-api/venv/bin/uvicorn app:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Nginx Konfiguration

```nginx
server {
    listen 80 default_server;
    server_name api.treesinvienna.eu _;

    root /var/www/weather;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/weather/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 30;

        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Access-Control-Allow-Headers "*" always;
    }
}
```

### Frontend

Das React-Frontend (gebaut mit Vite) liegt unter `/var/www/weather` und wird direkt von nginx ausgeliefert.

---

## Datenbankschema

```sql
CREATE TABLE readings (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    ts            TEXT NOT NULL,        -- ISO 8601 UTC Timestamp
    temperature   REAL,                 -- °C
    humidity      REAL,                 -- %
    wind_speed    REAL,                 -- km/h
    rain_total    REAL,                 -- mm
    illuminance   REAL,                 -- lx
    sunshine_min  REAL,                 -- min
    is_raining    INTEGER               -- 0 oder 1
);

CREATE INDEX idx_ts ON readings(ts);
```

Speicherort: `/home/pauli/weather-api/weather.db`
Aufzeichnungsintervall: alle **5 Minuten**
Speicherbedarf: ~50 KB pro Tag

---

## Dateien

```
weather-api/
├── app.py                      # FastAPI Backend
├── requirements.txt            # Python-Abhängigkeiten
├── weather-api.service.example # Systemd-Service-Vorlage (Platzhalter statt Secrets)
├── weather-nginx.conf          # Nginx-Konfiguration
├── README.md
├── .gitignore
│
├── frontend/                   # React/Vite Build (statisch)
│   ├── index.html
│   └── assets/
│       └── index-D2K5mqBv.js
│
│ # Die folgenden Dateien existieren auf dem Server, aber nicht im Repo:
│ # weather-api.service         ← echter Token (via .gitignore ausgeschlossen)
│ # weather.db                  ← SQLite-Datenbank
│ # venv/                       ← Python Virtual Environment
```

---

## Sensor-Hardware

**HomematicIP HmIP-SWO-PL** – Außen-Wettersensor mit Lichtsensor
Hersteller: eQ-3 / Homematic IP
Verbindung: über HomematicIP-Zentrale → Home Assistant

Entity-ID-Prefix: `sensor.hmip_swo_pl_00181d89a01e55_*`

---

## Sicherheit

### Umgesetzte Maßnahmen

| Maßnahme | Details |
|----------|---------|
| **Kein Token im Code** | `HA_TOKEN` und `HA_URL` als Umgebungsvariablen im systemd-Service |
| **Kein offener Port** | Cloudflare Tunnel – kein einziger Port von außen erreichbar |
| **Prozess-Sandbox** | systemd `IPAddressDeny=any` – Prozess darf nur zu localhost und HA-IP |
| **Server-Firewall** | ufw: default deny in+out, SSH nur vom LAN, ausgehend nur DNS/NTP/HA/HTTPS |
| **systemd-Härtung** | `NoNewPrivileges`, `ProtectSystem`, `ProtectHome`, `PrivateTmp` |
| **SSH-Key only** | Passwort-Login deaktiviert, nur Ed25519-Key |
| **fail2ban** | 5 Fehlversuche → IP 1h geblockt |
| **Auto-Updates** | `unattended-upgrades` täglich + pip-Update wöchentlich |

### Secrets – nicht committen

Der **HA-Token** und die **HA-URL** gehören **nicht** ins Repository.
Sie werden ausschließlich als Umgebungsvariablen im systemd-Service gesetzt.

```bash
# Vorlage: weather-api.service.example → nach /etc/systemd/system/weather-api.service kopieren
# und Platzhalter ersetzen
sudo cp weather-api.service.example /etc/systemd/system/weather-api.service
sudo nano /etc/systemd/system/weather-api.service  # Token + IP eintragen
sudo systemctl daemon-reload && sudo systemctl restart weather-api
```

> `weather-api.service` (mit echtem Token) ist in `.gitignore` eingetragen und wird nie committet.
