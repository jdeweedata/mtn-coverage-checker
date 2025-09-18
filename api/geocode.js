// Vercel API route to proxy geocoding requests
// This handles address to coordinates conversion

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Missing required parameter: address' });
  }

  try {
    // Use Google Geocoding API or alternative service
    // You'll need to add your API key as an environment variable
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Geocoding service not configured' });
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&region=za`;

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Geocoding service error' });
    }

    const data = await response.json();

    // Filter results to South Africa only
    const southAfricaResults = data.results.filter(result =>
      result.formatted_address.toLowerCase().includes('south africa')
    );

    const filteredData = {
      ...data,
      results: southAfricaResults
    };

    res.status(200).json(filteredData);

  } catch (error) {
    console.error('Geocoding error:', error);
    return res.status(500).json({
      error: 'Failed to geocode address',
      details: error.message
    });
  }
}