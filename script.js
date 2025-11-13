const map = L.map("map").setView([20, 0], 2);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
}).addTo(map);

// 🌍 Add global air-quality layer (PM2.5)
L.tileLayer(
  "https://tile.open-meteo.com/v1/air-quality/{z}/{x}/{y}.png?parameter=pm2_5",
  { opacity: 0.55 }
).addTo(map);

// 🎈 Emoji marker instead of image
const balloonIcon = L.divIcon({
  html: `<div style="
    font-size: 32px;
    transform: translate(-50%, -50%);
  ">🎈</div>`,
  className: "",
  iconSize: [32, 32],
});

// Cluster group with nice bubbles
const clusterGroup = L.markerClusterGroup({
  maxClusterRadius: 60,
  iconCreateFunction: function (cluster) {
    const count = cluster.getChildCount();
    return L.divIcon({
      html: `<div style="
        background:#3f51b5;
        color:white;
        width:50px;
        height:50px;
        display:flex;
        justify-content:center;
        align-items:center;
        border-radius:50%;
        font-size:18px;
        font-weight:bold;
        border:3px solid white;
        box-shadow:0 0 10px rgba(0,0,0,0.3);
      ">${count}</div>`,
      className: "",
      iconSize: [50, 50],
    });
  },
});

// Deduplicate positions (~0.01° tiles)
const seen = new Set();

async function fetchBalloonHistory() {
  const balloons = [];

  for (let i = 0; i < 24; i++) {
    const hour = String(i).padStart(2, "0");

    try {
      const res = await fetch(`/api/balloon?hour=${hour}`);
      const json = await res.json();

      if (!Array.isArray(json) || json.error) {
        console.log("Skipped corrupted hour:", hour);
        continue;
      }

      json.forEach((pt) => {
        if (Array.isArray(pt) && pt.length >= 2) {
          const lat = Number(pt[0]);
          const lon = Number(pt[1]);
          const alt = pt[2] != null ? Number(pt[2]) : null;

          if (Number.isNaN(lat) || Number.isNaN(lon)) return;

          const key = lat.toFixed(2) + "," + lon.toFixed(2);

          if (!seen.has(key)) {
            seen.add(key);
            balloons.push({ lat, lon, alt });
          }
        }
      });
    } catch {
      console.log("Error fetching hour:", hour);
    }
  }

  return balloons;
}

async function plotBalloons() {
  const balloons = await fetchBalloonHistory();

  balloons.forEach((b) => {
    const { lat, lon, alt } = b;

    const popupText = `
      <strong>Balloon</strong><br>
      Lat: ${lat.toFixed(3)}<br>
      Lon: ${lon.toFixed(3)}<br>
      Altitude: ${alt != null ? alt.toFixed(1) + " m" : "N/A"}<br><br>
      <strong>Air Quality:</strong><br>
      Layer: PM2.5 heatmap (visual approximation)<br>
      Source: Open-Meteo global AQ tiles
    `;

    const marker = L.marker([lat, lon], { icon: balloonIcon }).bindPopup(popupText);

    clusterGroup.addLayer(marker);
  });

  map.addLayer(clusterGroup);
}

plotBalloons();

setInterval(() => location.reload(), 60000);
