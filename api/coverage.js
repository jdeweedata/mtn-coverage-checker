// Vercel API route to proxy MTN coverage API calls
// This bypasses CORS restrictions by making server-side requests

export default async function handler(req, res) {
  // Enable CORS for your frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lng, technology = 'ALL', type = 'wms', width, height, format } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing required parameters: lat, lng' });
  }

  try {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    let url;
    let headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
    };

    // Build the appropriate URL based on request type
    if (type === 'wms') {
      // Handle both GetFeatureInfo (coverage checking) and GetMap (overlay images)
      const layerMap = {
        'ALL': 'EBU-RBUS-ALL',
        '2G': 'EBU-RBUS-ALL',
        '3G': 'EBU-RBUS-ALL',
        '4G': 'EBU-RBUS-ALL',
        '5G': 'EBU-RBUS-ALL',
        'UNCAPPED_WIRELESS': 'UncappedWirelessEBU',
        'FIBRE': 'FTTBCoverage',
        'LICENSED_WIRELESS': 'PMPCoverage',
        'FIXED_LTE': 'FLTECoverageEBU'
      };

      const mlid = layerMap[technology] || 'EBU-RBUS-ALL';

      if (width && height && format === 'image/png') {
        // GetMap request for overlay images
        const mapWidth = parseInt(width) || 800;
        const mapHeight = parseInt(height) || 600;
        const buffer = 0.05; // 5km buffer around point

        const params = new URLSearchParams({
          'mlid': mlid,
          'SERVICE': 'WMS',
          'VERSION': '1.1.1',
          'REQUEST': 'GetMap',
          'FORMAT': 'image/png',
          'TRANSPARENT': 'true',
          'LAYERS': mlid,
          'SRS': 'EPSG:4326',
          'WIDTH': mapWidth.toString(),
          'HEIGHT': mapHeight.toString(),
          'BBOX': `${longitude-buffer},${latitude-buffer},${longitude+buffer},${latitude+buffer}`
        });

        url = `https://mtnsi.mtn.co.za/cache/geoserver/wms?${params.toString()}`;
      } else {
        // GetFeatureInfo request for coverage checking
        const params = new URLSearchParams({
          'mlid': mlid,
          'SERVICE': 'WMS',
          'VERSION': '1.1.1',
          'REQUEST': 'GetFeatureInfo',
          'FORMAT': 'image/png',
          'TRANSPARENT': 'true',
          'QUERY_LAYERS': mlid,
          'LAYERS': mlid,
          'exceptions': 'application/vnd.ogc.se_inimage',
          'INFO_FORMAT': 'text/plain',
          'FEATURE_COUNT': '50',
          'X': '50',
          'Y': '50',
          'SRS': 'EPSG:4326',
          'WIDTH': '101',
          'HEIGHT': '101',
          'BBOX': `${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}`
        });

        url = `https://mtnsi.mtn.co.za/cache/geoserver/wms?${params.toString()}`;
      }
    } else if (type === 'point') {
      // Coverage API point endpoint
      url = `https://mtnsi.mtn.co.za/coverage/api/point?lat=${latitude}&lng=${longitude}`;
    } else if (type === 'public') {
      // Public coverage query
      url = `https://mtnsi.mtn.co.za/coverage/api/public/coverage?lat=${latitude}&lng=${longitude}`;
    } else {
      return res.status(400).json({ error: 'Invalid type parameter' });
    }

    console.log(`Proxying request to: ${url}`);

    const response = await fetch(url, {
      headers,
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      console.error(`MTN API error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        error: `MTN API error: ${response.status} ${response.statusText}`,
        url: url.replace(/([?&])(lat|lng|X|Y|BBOX)=[^&]*/g, '$1$2=***') // Hide sensitive data in logs
      });
    }

    const contentType = response.headers.get('content-type');

    // For GetMap requests (image overlays), return the image directly
    if (width && height && format === 'image/png' && contentType && contentType.includes('image')) {
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.status(200).send(Buffer.from(buffer));
      return;
    }

    // For other requests, return JSON
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(200).json(data);
    } else if (contentType && contentType.includes('text/')) {
      const text = await response.text();
      res.status(200).json({
        type: 'text',
        content: text,
        technology,
        coordinates: { lat: latitude, lng: longitude }
      });
    } else {
      // Handle binary data (like images) for other cases
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      res.status(200).json({
        type: 'binary',
        content: base64,
        contentType: contentType || 'application/octet-stream',
        technology,
        coordinates: { lat: latitude, lng: longitude }
      });
    }

  } catch (error) {
    console.error('Proxy error:', error);

    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return res.status(504).json({ error: 'Request timeout - MTN API too slow' });
    }

    return res.status(500).json({
      error: 'Failed to fetch coverage data',
      details: error.message
    });
  }
}