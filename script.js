const map = L.map("map").setView([20, 0], 2);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
}).addTo(map);

const balloonIcon = L.icon({
  iconUrl: "assets/balloon.png",
  iconSize: [38, 38],
});

// Create a big cluster group (with larger cluster dots)
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

// Deduplication map
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
        if (point.length >= 2) {
          const lat = point[0];
          const lon = point[1];
          const alt = point[2] || null;

          // Dedup key rounded to reduce density (tune this!)
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

async function fetchAQ(lat, lon) {
  try {
    const res = await fetch(
      `https://api.openaq.org/v2/latest?coordinates=${lat},${lon}`
    );
    const data = await res.json();
    return data.results?.[0] || null;
  } catch {
    return null;
  }
}

async function plotBalloons() {
  const balloons = await fetchBalloonHistory();

  for (const b of balloons) {
    const { lat, lon, alt } = b;

    const aq = await fetchAQ(lat, lon);

    const popupText = `
      <strong>Balloon</strong><br>
      <strong>Lat:</strong> ${lat.toFixed(3)}<br>
      <strong>Lon:</strong> ${lon.toFixed(3)}<br>
      <strong>Altitude:</strong> ${alt || "N/A"} m<br><br>
      <strong>Air Quality:</strong><br>
      ${
        aq
          ? `AQI: ${aq.measurements?.[0]?.value} ${
              aq.measurements?.[0]?.unit
            }<br>
          Pollutant: ${aq.measurements?.[0]?.parameter}`
          : "No AQI data available"
      }
    `;

    const marker = L.marker([lat, lon], { icon: balloonIcon }).bindPopup(
      popupText
    );

    clusterGroup.addLayer(marker);
  }

  map.addLayer(clusterGroup);
}

plotBalloons();

// Auto-refresh every minute
setInterval(() => {
  location.reload();
}, 60000);
