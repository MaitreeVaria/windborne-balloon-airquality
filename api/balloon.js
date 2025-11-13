export default async function handler(req, res) {
    const hour = req.query.hour;
  
    // Validate hours like 00, 01, 02, ..., 23
    if (!hour || !/^\d{2}$/.test(hour)) {
      return res.status(400).json({ error: "Invalid hour format. Use 00-23." });
    }
  
    const url = `https://a.windbornesystems.com/treasure/${hour}.json`;
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(500).json({ error: "WindBorne returned an error." });
      }
  
      const data = await response.json();
  
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch data." });
    }
  }
  
