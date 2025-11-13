export default async function handler(req, res) {
  const hour = req.query.hour;

  if (!hour || !/^\d{2}$/.test(hour)) {
    return res.status(400).json({ error: "Invalid hour format. Use 00-23." });
  }

  const url = `https://a.windbornesystems.com/treasure/${hour}.json`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MaitreeBalloonProject/1.0)",
        "Accept": "application/json,text/plain,*/*"
      }
    });

    if (!response.ok) {
      console.log("WindBorne status:", response.status);
      return res.status(500).json({ error: "WindBorne returned an error." });
    }

    const data = await response.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(data);

  } catch (err) {
    console.error("WindBorne fetch failed:", err);
    return res.status(500).json({ error: "Failed to fetch data." });
  }
}
