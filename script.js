const map = L.map("map").setView([20, 0], 2);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
}).addTo(map);

// 🎈 Emoji marker instead of image
const balloonIcon = L.divIcon({
  html: `<div style="
    font-size: 32px;
    transform: translate(-50%, -50%);
  ">🎈</div>`,
  className: "",
  iconSize: [32, 32],
});

// Cluster group with big bubbles
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
      className: "balloon-cluster",
      iconSize: [50, 50],
    });
  },
});

// Deduplicate positions (one marker per ~0.01° tile)
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

      json.forEach((point) => {
        if (Array.isArray(point) && point.length >= 2) {
          const lat = Number(point[0]);
          const lon = Number(point[1]);
          const alt = point[2] != null ? Number(point[2]) : null;

          if (Number.isNaN(lat) || Number.isNaN(lon)) {
            return;
          }

          // Dedup key: round to 0.01 degrees
          const key = lat.toFixed(2) + "," + lon.toFixed(2);

          if (!seen.has(key)) {
            seen.add(key);
            balloons.push({ lat, lon, alt });
          }
        }
      });
    } catch (err) {
      console.log("Error fetching hour:", hour, err);
    }
  }

  return balloons;
}

// 🌫️ Air quality via Open-Meteo (no backend, no CORS drama)
async function fetchAQ(lat, lon) {
  try {
    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality` +
      `?latitude=${lat}&longitude=${lon}` +
      `&hourly=pm2_5,pm10,us_aqi&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) {
      console.log("Open-Meteo AQ error status:", res.status);
      return null;
    }

    const data = await res.json();
    const hourly = data.hourly;
    if (!hourly || !hourly.us_aqi || !hourly.us_aqi.length) {
      return null;
    }

    const idx = hourly.us_aqi.length - 1; // most recent hour

    return {
      aqi: hourly.us_aqi[idx],
      pm25: hourly.pm2_5 ? hourly.pm2_5[idx] : null,
      pm10: hourly.pm10 ? hourly.pm10[idx] : null,
      time: hourly.time ? hourly.time[idx] : null,
    };
  } catch (err) {
    console.log("Error fetching AQ:", err);
    return null;
  }
}

async function plotBalloons() {
  const balloons = await fetchBalloonHistory();

  for (const b of balloons) {
    const lat = b.lat;
    const lon = b.lon;
    const alt = b.alt;

    const aq = await fetchAQ(lat, lon);

    let aqHtml = "No air-quality data available";
    if (aq) {
      aqHtml = `
        AQI (US): ${aq.aqi ?? "N/A"}<br>
        PM2.5: ${aq.pm25 ?? "N/A"} µg/m³<br>
        PM10: ${aq.pm10 ?? "N/A"} µg/m³<br>
        Time: ${aq.time ?? "N/A"}
      `;
    }

    const popupText = `
      <strong>Balloon</strong><br>
      <strong>Lat:</strong> ${lat.toFixed(3)}<br>
      <strong>Lon:</strong> ${lon.toFixed(3)}<br>
      <strong>Altitude:</strong> ${
        alt != null ? alt.toFixed(1) + " m" : "N/A"
      }<br><br>
      <strong>Air Quality (Open-Meteo):</strong><br>
      ${aqHtml}
    `;

    const marker = L.marker([lat, lon], { icon: balloonIcon }).bindPopup(
      popupText
    );

    clusterGroup.addLayer(marker);
  }

  map.addLayer(clusterGroup);
}

plotBalloons();

// Refresh once a minute to get live constellation + AQ updates
setInterval(() => {
  location.reload();
}, 60000);
