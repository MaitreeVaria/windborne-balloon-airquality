
# 🎈 WindBorne Balloon + Global Air Quality Map

**Live Demo:** [https://windborne-balloon-airquality.vercel.app/](https://windborne-balloon-airquality.vercel.app/)

A fully interactive, real-time visualization that combines **WindBorne's live 24-hour balloon telemetry** with a **global PM2.5 air-quality heatmap**, rendered on an intuitive Leaflet map with clustering and emoji markers.

This was created as part of the **WindBorne Systems Junior Web Developer engineering challenge**, with special attention to reliability, clarity, and playful interaction.

---

## 🚀 Features

### ✔ **Real-Time 24H Balloon History**

WindBorne exposes hourly JSON snapshots (`00.json` → `23.json`) of all active sounding balloons.
The app:

* Fetches all 24 files through a **Vercel serverless proxy** (solving CORS issues)
* Cleans and normalizes corrupted or partial data entries
* Deduplicates positions to avoid map overload
* Displays balloon locations using expressive 🎈 emoji markers

---

### ✔ **Global Air Quality Layer (PM2.5)**

Instead of issuing hundreds of per-balloon air quality API calls (which causes rate-limit failures), this project uses:

**Open-Meteo Global Air Quality Tiles**

```
https://tile.open-meteo.com/v1/air-quality/{z}/{x}/{y}.png?parameter=pm2_5
```

Benefits:

* Zero rate limits
* Zero CORS issues
* Worldwide, hour-updating PM2.5 data
* Visually intuitive heatmap overlay

Popups include contextual AQ info, referencing this global dataset.

---

### ✔ **Interactive Map with Marker Clustering**

* Beautiful custom cluster bubbles
* Emoji balloons for friendly UX
* Smooth performance even with hundreds of points

This keeps the map readable and visually clean.

---

### ✔ **Automatic Live Updates**

The entire map refreshes every **60 seconds**, pulling the latest available data from WindBorne.

---

### ✔ **Zero External Backend Requirements**

The project uses:

* Vercel serverless functions (`/api/balloon`)
* Browser-based Leaflet rendering
* No databases, no persistent storage

It’s fast, lightweight, and deploys instantly.

---

## 🧩 Architecture Overview

```
┌────────────────────────────┐
│ WindBorne Balloon API      │
│ a.windbornesystems.com/... │
└───────────────┬────────────┘
                │ (CORS)
                ▼
       ┌──────────────────┐
       │ Vercel API Route │  /api/balloon
       │ - Fetch + clean  │
       │ - Normalize JSON │
       └───────┬──────────┘
               ▼
   ┌────────────────────────┐
   │ Frontend (Leaflet Map) │
   │ - Plot balloons        │
   │ - Cluster markers      │
   │ - Overlay PM2.5 tiles  │
   └────────────────────────┘

External Dataset:
- Open-Meteo Air Quality Tiles (global PM2.5 heatmap)
```

This meets WindBorne’s requirement to **combine their dataset with an external one**, while handling the realities of real-time telemetry and imperfect remote data streams.

---

## 💻 Tech Stack

* **Leaflet.js** – interactive map rendering
* **Vercel Serverless Functions** – CORS-safe data fetching
* **Open-Meteo** – global PM2.5 air-quality tiles
* **MarkerClusterGroup** – clustering visualization
* **Vanilla JS / HTML / CSS** – zero framework overhead

---

## 🔧 Local Development

```bash
npm install
npm run dev
```

Serverless API routes run automatically via Vercel’s dev environment.

---

## 🌍 Deployment

This project is hosted on **Vercel**.
Every push to `main` automatically triggers a redeploy.

---

## 📝 Notes for WindBorne Reviewers

This project focuses on:

* **Resilience** to corrupted/missing telemetry
* **Efficient visual aggregation** (hundreds of balloons → clean clusters)
* **Responsible dataset selection** (one global AQ request vs. many rate-limited calls)
* **A playful, human-friendly UI** that matches WindBorne’s culture
* **Real-time system design thinking**

---

