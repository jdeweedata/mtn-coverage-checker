## UI-to-API Interaction Flow

### 1. **Map Viewport-Driven Queries**
When you pan or zoom the map, the application automatically triggers API calls based on the visible extent:

```javascript
// Example query triggered by map movement
https://gisportal.dfafrica.co.za/server/rest/services/API/DFA_Connected_Buildings/MapServer/0/query?
  geometry={
    "xmin": 3122299.729,  // Left boundary
    "ymin": -3004892.454, // Bottom boundary  
    "xmax": 3122911.225,  // Right boundary
    "ymax": -3004280.957  // Top boundary
  }
  &geometryType=esriGeometryEnvelope
  &spatialRel=esriSpatialRelIntersects
```

### 2. **Layer Rendering Architecture**

The map uses a **tile-based quadtree system** where the viewport is divided into tiles:

```
Tile Pattern: /tile/{zoom}/{x}/{y}
Example: /tile/17/75362/75749
```

Each movement triggers:
- **Base map tiles** (imagery) loading
- **Feature queries** for vector layers (buildings, ductwork)
- **Progressive rendering** from low to high detail

### 3. **Layer Interaction Hierarchy**

```
User Interaction (Pan/Zoom)
       ↓
Map Extent Changes
       ↓
Calculate Visible Bounds
       ↓
Parallel API Calls:
  ├─→ Base Map Tiles (Imagery)
  ├─→ Connected Buildings Query
  ├─→ Near-Net Buildings Query  
  └─→ Ductbank Infrastructure Query
       ↓
Render Results on Map Canvas
```

### 4. **Smart Query Optimization**

The system uses **spatial indexing** to optimize queries:

```javascript
// Quantization parameters reduce data transfer
quantizationParameters: {
  mode: "view",
  originPosition: "upperLeft", 
  tolerance: 1.194, // Simplification tolerance
  extent: {...}     // Reference extent
}
```

### 5. **Layer-Specific Behaviors**

#### **Connected Buildings (Blue Dots)**
- Queries fire on every pan/zoom
- Returns point geometries
- Attributes include building details

#### **Near-Net Buildings (Purple Dots)**  
- Similar query pattern
- Represents "opportunity" locations
- Within service distance of fiber

#### **Ductbank (Lines)**
- Linear features
- Two states: Construction (orange), Completed (green)
- Heavier geometry data

### 6. **Performance Strategy**

The application implements several optimization techniques:

1. **Viewport Chunking**: Divides viewport into 6 chunks for parallel queries
2. **Request Deduplication**: Prevents duplicate API calls
3. **Tile Caching**: Reuses previously loaded map tiles
4. **Geometry Simplification**: Reduces point precision based on zoom level

### 7. **API Response Handling**

```javascript
// Typical response structure
{
  "features": [
    {
      "geometry": {
        "x": 3122456.789,
        "y": -3004567.890
      },
      "attributes": {
        "OBJECTID": 123,
        "BuildingName": "Example Tower",
        "Status": "Connected"
      }
    }
  ],
  "exceededTransferLimit": false
}
```

### 8. **UI State Management**

The Legend widget dynamically reflects:
- Currently visible layers
- Active symbology
- Layer visibility toggles

Each layer can be toggled on/off, which:
1. Updates internal layer visibility state
2. Prevents API calls for hidden layers
3. Removes/adds features from the map canvas

### 9. **Event-Driven Architecture**

```
User Events:
- mouse-move → Update coordinate display
- map-drag → Calculate new extent → Trigger queries
- zoom-in/out → Change level of detail → Load new tiles
- click-feature → Show popup with attributes
```

### 10. **Intelligent Loading Pattern**

The system loads data in priority order:
1. **First**: Base map tiles (visual context)
2. **Second**: Vector features in viewport
3. **Third**: Adjacent tiles (predictive loading)
4. **Last**: Attribution and metadata

This creates a smooth user experience where the map appears responsive even while data is still loading. The purple/blue dots (buildings) and orange/green lines (ductwork) render on top of the satellite imagery as vector overlays, updating dynamically as you navigate the map.

The entire system is event-driven and reactive - every user interaction with the map triggers a cascade of API calls that fetch only the data needed for the current view, making it efficient even with large datasets.