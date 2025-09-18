# MTN Coverage Map Implementation Guide

## Overview
This project replicates the MTN Business coverage map functionality, displaying multiple technology coverage layers (Fibre, Fixed LTE, Licensed Wireless, Uncapped Wireless) on a Google Maps interface using WMS (Web Map Service) overlays.

## Architecture

### Technology Stack
- **Google Maps JavaScript API v3**: Base mapping platform
- **GeoServer WMS**: Coverage data provider
- **jQuery 1.9.1**: DOM manipulation and event handling
- **jQuery Mobile 1.4.5**: UI components and styling

### Key Components

#### 1. Map Integration
- Base map using Google Maps API
- Multiple map styles (Street, Hybrid, Satellite, Terrain)
- Default center: Johannesburg, South Africa (-26.042489, 28.059244)
- Default zoom level: 18

#### 2. WMS Layer System
The application uses GeoServer WMS to fetch coverage data as map tiles:

```javascript
WMS Base URL: https://mtnsi.mtn.co.za/cache/geoserver/wms
Tile Size: 256x256 pixels
Projection: EPSG:900913 (Web Mercator)
Format: PNG with transparency
```

#### 3. Coverage Layers

| Layer Name | Layer ID | GeoServer Layer | Style | Color |
|------------|----------|-----------------|-------|-------|
| All Coverage | EBU-RBUS-ALL | mtnsi:MTN-EBU-RBUS-ALL2 | MTN-EBU-RBUS-ALL | Mixed |
| Fibre | FTTBCoverage | mtnsi:MTN-FTTB-Feasible | MTN-FTTB-Feasible-G | Green |
| Licensed Wireless | PMPCoverage | mtnsi:MTN-PMP-Feasible-Integrated | MTN-PMP-Feasible-B | Blue |
| Fixed LTE | FLTECoverageEBU | mtnsi:MTNSA-Coverage-FIXLTE-EBU-0 | MTN-Coverage-FIXLTE-EBU-R | Red |
| Uncapped Wireless | UncappedWirelessEBU | mtnsi:MTNSA-Coverage-Tarana | MTN-Coverage-UWA-EBU | Custom |

## Setup Instructions

### 1. Prerequisites
- Google Maps API Key with the following APIs enabled:
  - Maps JavaScript API
  - Places API
  - Geometry Library

### 2. Configuration

Replace `YOUR_GOOGLE_MAPS_API_KEY` in the HTML file with your actual API key:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&v=3&callback=mapLoaded&libraries=places,geometry"></script>
```

### 3. CORS Configuration (If Self-Hosting WMS)

If you're hosting your own GeoServer, configure CORS headers:

```xml
<filter>
    <filter-name>CorsFilter</filter-name>
    <filter-class>org.apache.catalina.filters.CorsFilter</filter-class>
    <init-param>
        <param-name>cors.allowed.origins</param-name>
        <param-value>*</param-value>
    </init-param>
    <init-param>
        <param-name>cors.allowed.methods</param-name>
        <param-value>GET,POST,HEAD,OPTIONS,PUT</param-value>
    </init-param>
</filter>
```

### 4. Development Setup with VS Code

1. Install recommended extensions:
   - Live Server
   - JavaScript (ES6) code snippets
   - HTML CSS Support

2. Project structure:
```
mtn-coverage-map/
├── index.html              # Main application file
├── css/
│   └── styles.css         # Custom styles (optional)
├── js/
│   └── app.js            # Separated JavaScript (optional)
├── config/
│   └── layers.json       # Layer configuration (optional)
└── README.md             # This file
```

### 5. Using with Claude Code

When using Claude Code for development:

1. **API Integration Testing**:
```javascript
// Test WMS endpoint availability
async function testWMSEndpoint() {
    const testUrl = 'https://mtnsi.mtn.co.za/cache/geoserver/wms?SERVICE=WMS&REQUEST=GetCapabilities';
    try {
        const response = await fetch(testUrl);
        console.log('WMS Status:', response.status);
    } catch (error) {
        console.error('WMS Error:', error);
    }
}
```

2. **Layer Configuration Management**:
```javascript
// Dynamic layer configuration
const layerManager = {
    addLayer: function(id, config) {
        CONFIG.layers[id] = config;
        initWMSLayers();
    },
    removeLayer: function(id) {
        toggleLayer(id, false);
        delete CONFIG.layers[id];
    }
};
```

## API Details

### WMS Request Parameters

Each tile request includes these parameters:

| Parameter | Description | Example |
|-----------|-------------|---------|
| mlid | Layer identifier | FTTBCoverage |
| SERVICE | Service type | WMS |
| REQUEST | Request type | GetMap |
| VERSION | WMS version | 1.1.1 |
| LAYERS | GeoServer layer name | mtnsi:MTN-FTTB-Feasible |
| STYLES | Layer style | MTN-FTTB-Feasible-G |
| FORMAT | Image format | image/png |
| TRANSPARENT | Transparency support | TRUE |
| TILED | Enable tiling | TRUE |
| SRS | Spatial Reference System | EPSG:900913 |
| BBOX | Bounding box coordinates | west,south,east,north |
| WIDTH | Tile width in pixels | 256 |
| HEIGHT | Tile height in pixels | 256 |

### Example WMS Request

```
https://mtnsi.mtn.co.za/cache/geoserver/wms?
  mlid=FTTBCoverage&
  SERVICE=WMS&
  REQUEST=GetMap&
  VERSION=1.1.1&
  LAYERS=mtnsi:MTN-FTTB-Feasible&
  STYLES=MTN-FTTB-Feasible-G&
  FORMAT=image/png&
  TRANSPARENT=TRUE&
  TILED=TRUE&
  SRS=EPSG:900913&
  BBOX=3123369.85,-3004433.83,3123522.72,-3004280.96&
  WIDTH=256&
  HEIGHT=256
```

## Key Features

### 1. Layer Toggle System
- Click layer buttons to enable/disable coverage overlays
- "All" layer shows combined coverage
- Individual layers can be displayed simultaneously
- Visual feedback with ON/OFF status indicators

### 2. Search Functionality
- Google Places Autocomplete integration
- Search for addresses, businesses, or landmarks
- Map automatically centers on selected location

### 3. Map Style Switching
- Four map styles: Street, Hybrid, Satellite, Terrain
- Instant switching without losing coverage overlays

### 4. Performance Optimizations
- Tile-based loading for efficient data transfer
- Caching through `/cache/` endpoint
- Only loads tiles for visible viewport
- Parallel tile loading for faster rendering

## Customization Options

### 1. Modify Layer Colors/Styles
Update the style parameter in layer configuration:
```javascript
fibre: {
    style: 'MTN-FTTB-Feasible-G', // Change to different style
    opacity: 0.8  // Adjust transparency (0-1)
}
```

### 2. Add Custom Layers
```javascript
CONFIG.layers['custom-layer'] = {
    mlid: 'CustomLayerID',
    geoserverLayer: 'mtnsi:Custom-Layer-Name',
    style: 'Custom-Style',
    opacity: 0.7
};
```

### 3. Change Default View
```javascript
CONFIG.defaultCenter = { lat: -26.2041, lng: 28.0473 }; // Johannesburg
CONFIG.defaultZoom = 15; // City-level view
```

## Troubleshooting

### Common Issues and Solutions

1. **Map doesn't load**
   - Check API key is valid and has required APIs enabled
   - Verify internet connection
   - Check browser console for errors

2. **Coverage layers don't appear**
   - Verify WMS endpoint is accessible
   - Check for CORS issues if self-hosting
   - Ensure layer configurations are correct

3. **Search doesn't work**
   - Confirm Places API is enabled for your API key
   - Check API key restrictions

4. **Performance issues**
   - Reduce number of simultaneous layers
   - Increase tile cache time
   - Consider implementing viewport-based loading

## Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security Considerations

1. **API Key Protection**
   - Restrict API key to specific domains
   - Use environment variables for production
   - Implement quota limits

2. **HTTPS Requirements**
   - Google Maps API requires HTTPS in production
   - WMS endpoints should use HTTPS

## Production Deployment

1. **Optimize Assets**
```bash
# Minify HTML/CSS/JS
npm install -g html-minifier uglify-js clean-css-cli
html-minifier index.html -o dist/index.html
uglifyjs js/app.js -o dist/app.min.js
cleancss css/styles.css -o dist/styles.min.css
```

2. **Environment Configuration**
```javascript
// Use environment-specific configuration
const CONFIG = {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    wmsBaseUrl: process.env.WMS_BASE_URL || 'https://mtnsi.mtn.co.za/cache/geoserver/wms'
};
```

3. **Caching Strategy**
- Implement service workers for offline functionality
- Use browser caching for tile data
- Configure CDN for static assets

## License and Attribution
- Google Maps: Subject to Google Maps Platform Terms of Service
- Map Data: ©2025 AfriGIS (Pty) Ltd, Google
- Coverage Data: MTN South Africa

## Support and Resources
- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [GeoServer WMS Documentation](https://docs.geoserver.org/stable/en/user/services/wms/reference.html)
- [Web Mercator Projection (EPSG:900913)](https://epsg.io/900913)

## Version History
- v1.0.0: Initial implementation with all five coverage layers
- v1.0.1: Added search functionality and map style switching
- v1.0.2: Performance optimizations and error handling

## Contact
For questions or issues related to this implementation, please refer to the MTN Business support channels or consult your development team.
