from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import httpx
import asyncio
import sqlite3
import csv
import io
import json
import os
import time
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
import logging

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("weather")

DB_PATH = "/home/pauli/weather-api/weather.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS readings (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                ts            TEXT NOT NULL,
                temperature   REAL,
                humidity      REAL,
                wind_speed    REAL,
                rain_total    REAL,
                illuminance   REAL,
                sunshine_min  REAL,
                is_raining    INTEGER
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_ts ON readings(ts)")
        conn.commit()

HA_URL   = os.environ.get("HA_URL", "http://homeassistant.local:8123")
HA_TOKEN = os.environ["HA_TOKEN"]
HEADERS  = {"Authorization": f"Bearer {HA_TOKEN}"}

ENTITIES = {
    "temperature":       "sensor.hmip_swo_pl_00181d89a01e55_temperatur",
    "humidity":          "sensor.hmip_swo_pl_00181d89a01e55_luftfeuchtigkeit",
    "wind_speed":        "sensor.hmip_swo_pl_00181d89a01e55_windgeschwindigkeit",
    "rain_total":        "sensor.hmip_swo_pl_00181d89a01e55_regenzahler_gesamt",
    "illuminance":       "sensor.hmip_swo_pl_00181d89a01e55_beleuchtungsstarke",
    "sunshine_duration": "sensor.hmip_swo_pl_00181d89a01e55_sonnenscheindauer",
    "is_raining":        "binary_sensor.hmip_swo_pl_00181d89a01e55_regen",
}

HA_HISTORY_IDS = [
    "sensor.hmip_swo_pl_00181d89a01e55_temperatur",
    "sensor.hmip_swo_pl_00181d89a01e55_luftfeuchtigkeit",
    "sensor.hmip_swo_pl_00181d89a01e55_windgeschwindigkeit",
]

# ── In-memory cache ────────────────────────────────────────────────────────────
_cache: dict = {}

def cache_get(key: str, ttl: int):
    entry = _cache.get(key)
    if entry and time.time() - entry["t"] < ttl:
        return entry["v"]
    return None

def cache_set(key: str, value):
    _cache[key] = {"t": time.time(), "v": value}

def safe_float(v):
    try: return float(v)
    except: return None

def _is_float(v):
    try: float(v); return True
    except: return False

def get_today_base() -> dict:
    """Return first recorded rain_total and sunshine_min since midnight today."""
    midnight = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    with get_db() as conn:
        row = conn.execute(
            "SELECT rain_total, sunshine_min FROM readings WHERE ts >= ? AND rain_total IS NOT NULL ORDER BY ts LIMIT 1",
            (midnight,)
        ).fetchone()
    if row:
        return {"rain": row["rain_total"], "sun": row["sunshine_min"]}
    return {"rain": None, "sun": None}

async def fetch_all_current(client):
    tasks = [client.get(f"{HA_URL}/api/states/{eid}", headers=HEADERS, timeout=10)
             for eid in ENTITIES.values()]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    data = {}
    for i, (key, _) in enumerate(ENTITIES.items()):
        r = results[i]
        if isinstance(r, Exception):
            continue
        j = r.json()
        data[key] = {
            "value": j.get("state"),
            "unit":  j.get("attributes", {}).get("unit_of_measurement", ""),
            "name":  j.get("attributes", {}).get("friendly_name", ""),
            "last_updated": j.get("last_updated"),
        }
    return data

async def fetch_ha_history(hours: int) -> dict:
    """Fetch up to 168h from Home Assistant."""
    hours = min(hours, 168)
    start = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
    url = (f"{HA_URL}/api/history/period/{start}"
           f"?filter_entity_id={','.join(HA_HISTORY_IDS)}&minimal_response=true")
    async with httpx.AsyncClient() as client:
        r = await client.get(url, headers=HEADERS, timeout=30)
    raw = r.json()
    keys = ["temperature", "humidity", "wind_speed"]
    result: dict = {k: [] for k in keys}
    for series in raw:
        if not series: continue
        eid = series[0].get("entity_id", "")
        for k, hid in zip(keys, HA_HISTORY_IDS):
            if eid == hid:
                result[k] = [
                    {"t": s.get("last_changed") or s.get("last_updated"), "v": float(s["state"])}
                    for s in series
                    if s.get("state") not in (None, "unavailable", "unknown") and _is_float(s["state"])
                ]
    return result

async def record_loop():
    await asyncio.sleep(10)
    while True:
        try:
            async with httpx.AsyncClient() as client:
                data = await fetch_all_current(client)
            ts = datetime.now(timezone.utc).isoformat()
            is_rain = 1 if data.get("is_raining", {}).get("value") == "on" else 0
            with get_db() as conn:
                conn.execute("""
                    INSERT INTO readings
                      (ts, temperature, humidity, wind_speed, rain_total, illuminance, sunshine_min, is_raining)
                    VALUES (?,?,?,?,?,?,?,?)
                """, (
                    ts,
                    safe_float(data.get("temperature", {}).get("value")),
                    safe_float(data.get("humidity", {}).get("value")),
                    safe_float(data.get("wind_speed", {}).get("value")),
                    safe_float(data.get("rain_total", {}).get("value")),
                    safe_float(data.get("illuminance", {}).get("value")),
                    safe_float(data.get("sunshine_duration", {}).get("value")),
                    is_rain,
                ))
                conn.commit()
            # also refresh current cache
            today = get_today_base()
            cur_rain = safe_float(data.get("rain_total",        {}).get("value"))
            cur_sun  = safe_float(data.get("sunshine_duration", {}).get("value"))
            data["rain_today"]     = round(max(cur_rain - today["rain"], 0), 1) if cur_rain is not None and today["rain"] is not None else None
            data["sunshine_today"] = round(max(cur_sun  - today["sun"],  0), 1) if cur_sun  is not None and today["sun"]  is not None else None
            data["fetched_at"] = ts
            data["station"]    = "Wetterstation Wien - HmIP-SWO-PL"
            cache_set("current", data)
            log.info(f"Recorded snapshot at {ts}")
        except Exception as e:
            log.error(f"Record error: {e}")
        await asyncio.sleep(300)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    task = asyncio.create_task(record_loop())
    yield
    task.cancel()

app = FastAPI(title="Wetterstation Wien API", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Current — cached 30s ──────────────────────────────────────────────────────
@app.get("/api/weather/current")
async def current():
    cached = cache_get("current", ttl=30)
    if cached:
        return JSONResponse(content=cached, headers={"Cache-Control": "no-cache", "X-Cache": "HIT"})
    async with httpx.AsyncClient() as client:
        data = await fetch_all_current(client)
    today = get_today_base()
    cur_rain = safe_float(data.get("rain_total",        {}).get("value"))
    cur_sun  = safe_float(data.get("sunshine_duration", {}).get("value"))
    data["rain_today"]      = round(max(cur_rain - today["rain"], 0), 1) if cur_rain is not None and today["rain"] is not None else None
    data["sunshine_today"]  = round(max(cur_sun  - today["sun"],  0), 1) if cur_sun  is not None and today["sun"]  is not None else None
    data["fetched_at"] = datetime.now(timezone.utc).isoformat()
    data["station"]    = "Wetterstation Wien - HmIP-SWO-PL"
    cache_set("current", data)
    return JSONResponse(content=data, headers={"Cache-Control": "no-cache", "X-Cache": "MISS"})

# ── History ───────────────────────────────────────────────────────────────────
@app.get("/api/weather/history")
async def history(hours: int = 24, days: int = 0):
    if days > 0:
        hours = days * 24
    hours = min(hours, 8760)

    since = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
    with get_db() as conn:
        rows = conn.execute(
            "SELECT ts, temperature, humidity, wind_speed, rain_total, sunshine_min FROM readings WHERE ts >= ? ORDER BY ts",
            (since,)
        ).fetchall()

    # If DB is sparse, use HA for recent data (max 168h)
    if len(rows) < 10:
        try:
            ha_data = await fetch_ha_history(min(hours, 168))
            return JSONResponse(
                content={"data": ha_data, "hours": hours, "source": "ha_fallback"},
                headers={"Cache-Control": "no-cache"}
            )
        except Exception as e:
            log.error(f"HA history fallback failed: {e}")

    # Cumulative sensors: return accumulated value since start of period
    base_rain = next((r["rain_total"]   for r in rows if r["rain_total"]   is not None), None)
    base_sun  = next((r["sunshine_min"] for r in rows if r["sunshine_min"] is not None), None)

    result = {
        "temperature": [{"t": r["ts"], "v": r["temperature"]} for r in rows if r["temperature"] is not None],
        "humidity":    [{"t": r["ts"], "v": r["humidity"]}    for r in rows if r["humidity"]    is not None],
        "wind_speed":  [{"t": r["ts"], "v": r["wind_speed"]}  for r in rows if r["wind_speed"]  is not None],
        "rain_total":  [{"t": r["ts"], "v": round(max(r["rain_total"]   - base_rain, 0), 1)} for r in rows if r["rain_total"]   is not None] if base_rain is not None else [],
        "sunshine_min":[{"t": r["ts"], "v": round(max(r["sunshine_min"] - base_sun,  0), 1)} for r in rows if r["sunshine_min"] is not None] if base_sun  is not None else [],
    }
    return JSONResponse(
        content={"data": result, "hours": hours, "source": "db", "points": len(rows)},
        headers={"Cache-Control": "no-cache"}
    )

# ── Export ────────────────────────────────────────────────────────────────────
@app.get("/api/weather/export")
async def export(
    format: str = Query("csv", pattern="^(csv|json)$"),
    days:   int = Query(30, ge=1, le=365),
):
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    with get_db() as conn:
        rows = conn.execute(
            """SELECT ts, temperature, humidity, wind_speed, rain_total,
                      illuminance, sunshine_min, is_raining
               FROM readings WHERE ts >= ? ORDER BY ts""",
            (since,)
        ).fetchall()

    if format == "json":
        data = [dict(r) for r in rows]
        content = json.dumps({
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "days": days, "count": len(data), "data": data
        }, ensure_ascii=False, indent=2)
        return StreamingResponse(
            io.StringIO(content),
            media_type="application/json",
            headers={
                "Content-Disposition": f'attachment; filename="wetterstation_{days}d.json"',
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Zeitstempel", "Temperatur (°C)", "Luftfeuchtigkeit (%)",
                     "Wind (km/h)", "Regen gesamt (mm)", "Beleuchtung (lx)",
                     "Sonnenschein (min)", "Regen"])
    for r in rows:
        writer.writerow([r["ts"], r["temperature"], r["humidity"], r["wind_speed"],
                         r["rain_total"], r["illuminance"], r["sunshine_min"],
                         "Ja" if r["is_raining"] else "Nein"])
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="wetterstation_{days}d.csv"',
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )

# ── Stats ─────────────────────────────────────────────────────────────────────
@app.get("/api/weather/stats")
async def stats():
    with get_db() as conn:
        row = conn.execute(
            "SELECT COUNT(*) as count, MIN(ts) as first, MAX(ts) as last FROM readings"
        ).fetchone()
    return {"count": row["count"], "first": row["first"], "last": row["last"]}

@app.get("/api/weather/")
async def root():
    return {"message": "Wetterstation Wien API v2", "endpoints": [
        "/api/weather/current",
        "/api/weather/history?hours=24",
        "/api/weather/history?days=30",
        "/api/weather/export?format=csv&days=30",
        "/api/weather/export?format=json&days=30",
        "/api/weather/stats",
    ]}
