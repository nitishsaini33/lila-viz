# LILA BLACK — Player Journey Visualizer

A web-based tool for Level Designers to explore player behavior across LILA BLACK's maps — built with React + Vite, rendered on HTML Canvas.

🔗 **Live URL:** _Add after deploying to Vercel_

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend framework | React 19 + Vite 8 |
| Map rendering | HTML5 Canvas (custom, no mapping lib) |
| Data format | JSON (pre-processed from Parquet) |
| Hosting | Vercel (static site) |
| Styling | CSS Modules + CSS custom properties |
| Data pipeline | Python (PyArrow + Pandas) |

---

## Project Structure

```
new_assignment/
├── process_data.py          ← Python script: parquet → JSON
├── player_data/             ← Raw parquet files + minimaps
│   ├── February_10/ … February_14/
│   └── minimaps/
└── lila-viz/                ← React app (deploy this)
    ├── public/
    │   ├── data/
    │   │   ├── matches.json         ← Index of all 796 matches
    │   │   ├── matches/*.json       ← Per-match player journeys
    │   │   └── heatmaps/*.json      ← Aggregated heatmap data
    │   └── maps/                    ← Minimap images
    └── src/
        ├── App.jsx / App.module.css
        ├── constants.js
        ├── hooks.js
        └── components/
            ├── Sidebar.jsx
            ├── MapCanvas.jsx
            └── Timeline.jsx
```

---

## Setup & Local Development

### Prerequisites
- Node.js >= 18
- Python >= 3.10 with `pyarrow` and `pandas`

### 1. Install Python dependencies
```bash
pip install pyarrow pandas
```

### 2. Process the raw data (only needs to run once)
```bash
cd new_assignment
python process_data.py
```
This reads all 1,243 parquet files and writes optimized JSON to `lila-viz/public/data/`.

### 3. Install Node dependencies
```bash
cd lila-viz
npm install
```

### 4. Start the dev server
```bash
npm run dev
# Open http://localhost:5173
```

---

## Deploying to Vercel

### Option A — Vercel CLI (recommended)

```bash
# Install Vercel CLI globally (one-time)
npm install -g vercel

# From the lila-viz directory
cd lila-viz

# Deploy
vercel

# Follow prompts:
#   Set up and deploy? Yes
#   Which scope? your account
#   Link to existing project? No
#   Project name: lila-viz
#   Directory: ./  (already in lila-viz/)
#   Override build settings? No

# Production deploy
vercel --prod
```

### Option B — Vercel Dashboard (drag and drop)

1. Build locally:
   ```bash
   cd lila-viz && npm run build
   ```
2. Go to [vercel.com](https://vercel.com) → New Project → Browse
3. Drag the entire `lila-viz/dist/` folder into the upload area
4. Click Deploy

### Option C — GitHub + Vercel Auto-Deploy

1. Push `lila-viz/` to a GitHub repo
2. Go to vercel.com → Import Git Repository
3. Set **Root Directory** to `lila-viz`
4. Framework preset: **Vite**
5. Build command: `npm run build`
6. Output directory: `dist`
7. Click Deploy — auto-deploys on every push to main

---

## Environment Variables

None required. All data is static JSON served from the `public/` folder.

---

## Re-processing Data

If new data arrives, re-run:
```bash
python process_data.py
```
Then redeploy.

---

## Features

| Feature | Status |
|---------|--------|
| Load and parse parquet data | Pre-processed to JSON |
| Player journeys on minimap | Canvas rendering with zoom/pan |
| Human vs bot distinction | Blue paths vs orange dashed paths |
| Kill / death / loot / storm markers | Shape and color coded |
| Filter by map / date / match | Sidebar filters |
| Timeline playback | Scrubber + speed control (0.5x to 8x) |
| Heatmap overlays | 5 layer types |
| Click player for detail panel | Stats + recent event feed |
| Hosted URL | Deploy to get shareable link |
