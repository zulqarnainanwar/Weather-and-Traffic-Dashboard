import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

// Serve static frontend files (index.html)
app.use(express.static('./'));

const PORT = process.env.PORT || 5000;

// 1. Dynamic Cities Proxy Endpoint
app.get('/api/cities', async (req, res) => {
  const { country } = req.query;

  if (!country) {
    return res.status(400).json({ error: "Country parameter is required." });
  }

  try {
    const response = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({ error: "Failed to fetch cities" });
  }
});

// 2. Current Weather Endpoint Proxy
app.get('/api/weather', async (req, res) => {
  const { city, country } = req.query;
  const apiKey = process.env.WEATHER_API_KEY;

  if (!city || !country) {
    return res.status(400).json({ error: "City and country parameters are required." });
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},${encodeURIComponent(country)}&units=metric&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching weather:", error);
    res.status(500).json({ error: "Failed to fetch current weather data" });
  }
});

// 3. 7-Day / Multi-day Forecast Proxy
app.get('/api/forecast', async (req, res) => {
  const { city, country } = req.query;
  const apiKey = process.env.WEATHER_API_KEY;

  if (!city || !country) {
    return res.status(400).json({ error: "City and country parameters are required." });
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)},${encodeURIComponent(country)}&units=metric&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching forecast:", error);
    res.status(500).json({ error: "Failed to fetch forecast data" });
  }
});

// 4. TomTom Live Traffic Incidents Proxy
app.get('/api/traffic', async (req, res) => {
  const { lat, lon } = req.query;
  const apiKey = process.env.TOMTOM_API_KEY;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Latitude and longitude parameters are required." });
  }

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  const bbox = `${lonNum - 0.08},${latNum - 0.08},${lonNum + 0.08},${latNum + 0.08}`;

  const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${apiKey}&bbox=${bbox}&fields={incidents{type,properties{iconCategory,description,delay}}}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching traffic incidents:", error);
    res.status(500).json({ error: "Failed to fetch traffic incidents" });
  }
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Secure Proxy Server running on http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});