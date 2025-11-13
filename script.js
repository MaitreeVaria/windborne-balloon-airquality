const map = L.map('map').setView([20, 0], 2);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

const balloonIcon = L.icon({
  iconUrl: "assets/balloon.png",
  iconSize: [38, 38]
});

// Fetch last 24 hours of balloon data through Vercel proxy
async function fetchBalloonHistory() {
  const balloons = [];

  for (let i = 0; i < 24; i++) {
    const hour = String(i).padStart(2, "0");

    try {
      const res = await fetch(`/api/balloon?hour=${hour}`);
      const json = await res.json();

      // Skip errors
      if (!json || json.error) {
        console.log("Skipped corrupted or unavailable file:", hour);
        continue;
      }

      // If the data is an array of balloon points (actual WindBorne format)
      if (Array.isArray(json)) {
        json.forEach(point => {
          // Format: [lat, lon, alt]
          if (point.length >= 2 && !isNaN(point[0]) && !isNaN(point[1])) {
            balloons.push({
              lat: point[0],
              lon: point[1],
              alt: point[2] || null
            });
          }
        });
      }

    } catch (error) {
      console.log("Error fetching hour:", hour, error);
    }
  }

  return balloons;
}

// Air quality request
async function fetchAQ(lat, lon) {
  try {
    const res = await fetch(`https://api.openaq.org/v2/latest?coordinates=${lat},${lon}`);
    const data = await res.json();
    return data.results?.[0] || null;
  } catch {
    return null;
  }
}

async function plotBalloons() {
  const balloons = await fetchBalloonHistory();

  balloons.forEach(async (b) => {
    const lat = b.lat;
    const lon = b.lon;
    const alt = b.alt;

    const aq = await fetchAQ(lat, lon);

    const popupText = `
      <strong>Balloon</strong><br>
      <strong>Lat:</strong> ${lat.toFixed(3)}<br>
      <strong>Lon:</strong> ${lon.toFixed(3)}<br>
      <strong>Altitude:</strong> ${alt || "N/A"} m<br><br>
      <strong>Air Quality:</strong><br>
      ${
        aq
          ? `
        AQI: ${aq.measurements?.[0]?.value} ${aq.measurements?.[0]?.unit}<br>
        Pollutant: ${aq.measurements?.[0]?.parameter}
        `
          : "No AQI data available"
      }
    `;

    L.marker([lat, lon], { icon: balloonIcon })
      .addTo(map)
      .bindPopup(popupText);
  });
}

plotBalloons();

// Auto-refresh
setInterval(() => {
  location.reload();
}, 60000);
