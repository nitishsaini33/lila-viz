# ARCHITECTURE.md

## What I Built and Why

**Stack:** React 19 + Vite 8 (frontend) + Python/PyArrow (data pipeline) + HTML5 Canvas (rendering) + Vercel (hosting)

**Why this stack:**
- **React + Vite** — fast iteration, component reuse, hot reload. No SSR needed since all data is static.
- **HTML5 Canvas (not Leaflet/Mapbox)** — the minimap is a fixed 1024×1024 image, not a geo-referenced tile map. Canvas gives full control over render order, custom event marker shapes, and smooth animation without the overhead of a mapping library.
- **Static JSON pipeline** — serving pre-computed JSON from Vercel's CDN is 10–100× faster than running a Python server per request. All 796 matches are processed offline once.
- **Vercel** — zero-config static hosting with global CDN. No server to maintain.

---

## Data Flow

```
Raw parquet files (1,243 files, ~10 MB)
        │
        ▼
process_data.py  (Python, PyArrow + Pandas)
        │
        ├── Reads every .nakama-0 file
        ├── Decodes event bytes → strings
        ├── Groups files by match_id
        ├── Converts world coords (x,z) → pixel (px,py) per map
        ├── Normalizes timestamps → ms offset from match start
        └── Writes:
              public/data/matches.json          (match index, 796 entries)
              public/data/matches/{id}.json     (per-match player journeys)
              public/data/heatmaps/{map}.json   (aggregated heatmap buckets)
        │
        ▼
Vite build → dist/ (static assets)
        │
        ▼
Vercel CDN → browser
        │
        ▼
React app fetches JSON on demand (no server)
Canvas renders minimap + paths + events + heatmap
```

---

## Coordinate Mapping — The Tricky Part

The game uses a 3D world coordinate system. The minimap is a 1024×1024 pixel image.

**Key insight from the README:** `y` is elevation — ignore it. Only `x` and `z` map onto 2D.

Each map has a **scale** and an **origin** `(origin_x, origin_z)`:

```
u = (world_x - origin_x) / scale     → 0..1 horizontal fraction
v = (world_z - origin_z) / scale     → 0..1 vertical fraction

pixel_x = u * 1024
pixel_y = (1 - v) * 1024             ← Y flipped: image origin is top-left
                                         but world Z increases upward
```

| Map | Scale | Origin X | Origin Z |
|-----|-------|----------|----------|
| AmbroseValley | 900 | −370 | −473 |
| GrandRift | 581 | −290 | −290 |
| Lockdown | 1000 | −500 | −500 |

**Validation:** The README provides a worked example (`x=−301.45, z=−355.55` → pixel `78, 890` on AmbroseValley). My `world_to_pixel()` function reproduces this exactly.

**Edge case:** Coordinates slightly outside `[0, 1024]` are valid (players near the map edge). Canvas clips them naturally.

---

## Assumptions

| Ambiguity | Assumption Made |
|-----------|-----------------|
| Timestamp format | `ts` is stored as a datetime-like value representing ms elapsed in match context. I convert to Unix ms via `pd.Timestamp.timestamp() * 1000`, then offset all events within a match so `t=0` is match start. |
| Bot detection | Filenames where `user_id` matches `^\d+$` (pure integer) = bot. UUID format = human. Confirmed by event types (`BotPosition` only appears for numeric IDs). |
| `BotKill` / `BotKilled` attribution | `BotKill` = human killed a bot (recorded on the human's file). `BotKilled` = human was killed by a bot. I treat both as combat events and color them differently from PvP kills. |
| February 14 partial day | Included as-is. The README flags it as partial — matches load normally, they're just fewer. |
| Match duration | Defined as `max(ts) - min(ts)` within the combined match. Some matches show very short durations (< 10s) — these are likely players who disconnected early. |
| Heatmap bucket size | 16×16 pixel buckets (64×64 grid over 1024px). Balances spatial resolution with readable blob size at typical zoom levels. |

---

## Major Tradeoffs

| Decision | Alternatives Considered | Why I Chose This |
|----------|------------------------|-----------------|
| Pre-process to JSON | Run Python server live (FastAPI/Flask) | Static JSON = zero infra, instant CDN delivery, free hosting |
| HTML5 Canvas | Leaflet, MapboxGL, D3-SVG | Canvas handles 1000s of points at 60fps; SVG struggles above ~500 elements; Leaflet is overkill for a fixed image |
| Load match data on demand | Load all at once | 796 matches × avg 15 KB = ~12 MB — too heavy to preload. On-demand fetch per match is ~15 KB per click |
| CSS Modules | Tailwind, styled-components | Zero runtime overhead, scoped by default, no purge config needed |
| No WebSocket / real-time | Streaming from game server | Out of scope — working from historical data |

---

## Three Insights I Found Using the Tool

See `INSIGHTS.md` for the full analysis.

1. **Ambrose Valley dominates with 71% of matches** — the other two maps are underused to a concerning degree.
2. **Storm deaths cluster in a narrow band** — indicating players consistently underestimate the storm's speed in certain areas.
3. **Bots have predictable patrol corridors** — their paths form repeating lines that human players learn to avoid, creating "dead zones" in the map.
