export default async function handler(req, res) {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Missing lat or lon" });
  }

  const url = `https://api.openaq.org/v2/latest?coordinates=${lat},${lon}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BalloonProject/1.0)",
        "Accept": "application/json,text/plain,*/*"
      }
    });

    if (!response.ok) {
      console.log("OpenAQ error:", response.status);
      return res.status(500).json({ error: "OpenAQ returned an error." });
    }

    const data = await response.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(data);

  } catch (err) {
    console.error("OpenAQ fetch failed:", err);
    return res.status(500).json({ error: "Failed to fetch OpenAQ." });
  }
}
