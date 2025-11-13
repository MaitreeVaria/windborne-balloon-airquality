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
      if (!res.ok) throw new Error("Bad response");

      const data = await res.json();
      if (data && data.features) {
        balloons.push(...data.features);
      }
    } catch {
      console.log("Skipped corrupted or unavailable file:", hour);
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

  balloons.forEach(async (balloon) => {
    const coords = balloon.geometry?.coordinates;
    if (!coords || coords.length < 2) return;

    const [lon, lat] = coords;

    const aq = await fetchAQ(lat, lon);

    const popupText = `
      <strong>Balloon ID:</strong> ${balloon.properties?.id || "N/A"}<br>
      <strong>Lat:</strong> ${lat.toFixed(3)}<br>
      <strong>Lon:</strong> ${lon.toFixed(3)}<br>
      <strong>Altitude:</strong> ${balloon.properties?.alt || "N/A"} m<br><br>
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
