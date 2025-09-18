## Application Overview

**Title:** DFA Public Network Coverage  
**Application ID:** cf425ebaa2044ed08bacf33dabf2135e  
**Portal URL:** https://gisportal.dfafrica.co.za/arcgis  
**Technology:** ArcGIS Web AppBuilder (WAB) version 2.21

## Technology Stack

### Core Technologies:
1. **ArcGIS JavaScript API** - Version 3.x (uses Dojo 1.16.3)
   - API URL: https://gisportal.dfafrica.co.za/arcgis/jsapi/jsapi/
   - Built on Esri's ArcGIS platform

2. **Web Application Framework:**
   - ArcGIS Web AppBuilder (WAB)
   - Jimu.js framework for widget management
   - LaunchPad theme for UI

## Map Services and APIs

### 1. **DFA Infrastructure Layers** (Custom Services)

#### a) **Connected Buildings Service**
- **URL:** `https://gisportal.dfafrica.co.za/server/rest/services/API/DFA_Connected_Buildings/MapServer`
- **Layer ID:** 0
- **Purpose:** Shows buildings with active DFA fiber connections
- **Query Capabilities:** Spatial queries, attribute queries

#### b) **API Based OSP Layers**
- **URL:** `https://gisportal.dfafrica.co.za/server/rest/services/API/API_BasedOSPLayers/MapServer`
- **Layer ID:** 1
- **Content:** Ductbank infrastructure
- **Categories:** 
  - Construction (in progress)
  - Completed

#### c) **Promotions Service**
- **URL:** `https://gisportal.dfafrica.co.za/server/rest/services/API/Promotions/MapServer`
- **Layer ID:** 1
- **Purpose:** Near-Net Buildings (potential connection targets)

### 2. **Base Map Services**

#### a) **World Imagery (Esri)**
- **URL:** `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer`
- **Resolution Layers:**
  - Low Resolution: 15m imagery
  - High Resolution: 60cm imagery
  - Ultra High Resolution: 30cm imagery
- **Service Type:** Tiled map service
- **Provider:** Maxar, Esri Community Maps

#### b) **Vector Basemap**
- **URL:** `https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer`
- **Format:** Vector tiles (.pbf format)
- **Styling:** Mapbox GL style specification

## API Capabilities

### Query Operations:
The services support standard ArcGIS REST API operations:

1. **Spatial Queries:**
   - Envelope-based queries using bounding boxes
   - Geometry intersection queries
   - Spatial relationship filters (esriSpatialRelIntersects)

2. **Query Parameters:**
   ```
   - f=json (response format)
   - returnGeometry=true/false
   - spatialRel=esriSpatialRelIntersects
   - geometry={envelope object}
   - geometryType=esriGeometryEnvelope
   - outFields=* (all fields)
   - outSR=102100 (Web Mercator projection)
   - quantizationParameters (for optimization)
   ```

3. **Response Features:**
   - JSON format responses
   - Quantized geometry for performance
   - Support for pagination via resultOffset/resultRecordCount

## Coverage Information

### Geographic Coverage:
- **Primary Focus:** South Africa
- **Coordinate System:** Web Mercator (WKID: 102100)
- **Current View Center:** Approximately 28.062°E, -26.043°S (Johannesburg area)

### Layer Categories:

1. **Infrastructure Coverage:**
   - **Connected Buildings:** Active fiber connections
   - **Near-Net Buildings:** Buildings within proximity to fiber network
   - **Ductbank:** Underground conduit infrastructure
     - Construction phase (orange)
     - Completed (green)

2. **Imagery Coverage:**
   - Multiple resolution levels from 15m to 30cm
   - Attribution to multiple providers
   - Tiled delivery for performance

## Widget and Tool Capabilities

The application includes several interactive tools:

1. **Search Widget:** Address and location search
2. **Basemap Gallery:** Switch between different base maps
3. **Measurement Tool:** Distance and area measurements
4. **Legend:** Dynamic layer symbology display
5. **Overview Map:** Context navigation
6. **Zoom Slider:** Scale control
7. **My Location:** GPS positioning
8. **Coordinate Display:** Real-time coordinate tracking
9. **Scale Bar:** Map scale reference

## Authentication and Portal Integration

- **Portal Services:** `https://gisportal.dfafrica.co.za/arcgis/sharing/rest/`
- **OAuth2 Support:** Validated redirect URIs for authentication
- **Content Management:** Integration with ArcGIS Online content items

## Performance Optimizations

1. **Tile Caching:** Map tiles cached at multiple zoom levels
2. **Vector Tiles:** Efficient vector data delivery
3. **Quantization:** Geometry compression for faster queries
4. **Web Workers:** Parallel processing for vector tile rendering
5. **Progressive Loading:** Dynamic loading of widgets and modules

This GIS portal provides a comprehensive view of DFA's fiber optic network infrastructure across South Africa, enabling users to visualize connected buildings, planned expansions, and network coverage through a performant web-based mapping interface built on Esri's ArcGIS platform.