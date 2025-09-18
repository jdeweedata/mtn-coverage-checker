// Using browser's built-in DOMParser

export interface TaranaTower {
  id: string;
  name: string;
  lat: number;
  lng: number;
  altitude: number;
  heading?: number;
}

export interface TaranaCoverageData {
  towers: TaranaTower[];
  coverageOverlay: {
    imageUrl: string;
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
  metadata: {
    date: string;
    totalTowers: number;
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
}

/**
 * Parse KML file and extract Tarana tower locations and coverage data
 */
export class KMLParser {
  private cache: TaranaCoverageData | null = null;

  /**
   * Load and parse KML file from public assets
   */
  async loadTaranaCoverage(): Promise<TaranaCoverageData> {
    if (this.cache) {
      return this.cache;
    }

    try {
      const response = await fetch('/coverage/tarana/doc.kml');
      if (!response.ok) {
        throw new Error(`Failed to load KML: ${response.statusText}`);
      }

      const kmlText = await response.text();
      const parsed = this.parseKML(kmlText);

      this.cache = parsed;
      return parsed;
    } catch (error) {
      console.error('Error loading Tarana coverage KML:', error);
      throw error;
    }
  }

  /**
   * Parse KML text and extract tower data
   */
  private parseKML(kmlText: string): TaranaCoverageData {
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlText, 'text/xml');

    // Extract ground overlay bounds
    const groundOverlay = kmlDoc.getElementsByTagName('GroundOverlay')[0];
    const latLonBox = groundOverlay?.getElementsByTagName('LatLonBox')[0];
    const iconHref = groundOverlay?.getElementsByTagName('href')[0]?.textContent || '';

    const coverageBounds = {
      north: parseFloat(latLonBox?.getElementsByTagName('north')[0]?.textContent || '0'),
      south: parseFloat(latLonBox?.getElementsByTagName('south')[0]?.textContent || '0'),
      east: parseFloat(latLonBox?.getElementsByTagName('east')[0]?.textContent || '0'),
      west: parseFloat(latLonBox?.getElementsByTagName('west')[0]?.textContent || '0')
    };

    // Extract tower locations from placemarks
    const placemarks = kmlDoc.getElementsByTagName('Placemark');
    const towers: TaranaTower[] = [];

    for (let i = 0; i < placemarks.length; i++) {
      const placemark = placemarks[i];
      const name = placemark.getElementsByTagName('name')[0]?.textContent || '';

      // Only process station/tower placemarks (ST: prefix)
      if (!name.startsWith('ST:')) continue;

      const point = placemark.getElementsByTagName('Point')[0];
      if (!point) continue;

      const coordinates = point.getElementsByTagName('coordinates')[0]?.textContent?.trim();
      if (!coordinates) continue;

      // Parse coordinates (longitude,latitude,altitude)
      const [lng, lat, altitude] = coordinates.split(',').map(parseFloat);

      if (isNaN(lat) || isNaN(lng)) continue;

      // Extract heading from style if available
      const iconStyle = placemark.getElementsByTagName('IconStyle')[0];
      const headingText = iconStyle?.getElementsByTagName('heading')[0]?.textContent;
      const heading = headingText ? parseFloat(headingText) : undefined;

      towers.push({
        id: this.generateTowerId(name, lat, lng),
        name: name.replace('ST: ', ''),
        lat,
        lng,
        altitude: altitude || 0,
        heading
      });
    }

    const result: TaranaCoverageData = {
      towers,
      coverageOverlay: {
        imageUrl: `/coverage/tarana/${iconHref}`,
        bounds: coverageBounds
      },
      metadata: {
        date: '2025-07-16', // From filename
        totalTowers: towers.length,
        bounds: this.calculateBounds(towers)
      }
    };

    console.log(`Loaded ${towers.length} Tarana towers from KML`);
    return result;
  }

  /**
   * Generate unique tower ID
   */
  private generateTowerId(name: string, lat: number, lng: number): string {
    const cleanName = name.replace(/[^A-Za-z0-9]/g, '');
    const latStr = lat.toFixed(4).replace('.', '');
    const lngStr = lng.toFixed(4).replace('.', '');
    return `${cleanName}_${latStr}_${lngStr}`;
  }

  /**
   * Calculate bounding box from tower locations
   */
  private calculateBounds(towers: TaranaTower[]) {
    if (towers.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    let north = -90, south = 90, east = -180, west = 180;

    for (const tower of towers) {
      north = Math.max(north, tower.lat);
      south = Math.min(south, tower.lat);
      east = Math.max(east, tower.lng);
      west = Math.min(west, tower.lng);
    }

    return { north, south, east, west };
  }

  /**
   * Clear cache to force reload
   */
  clearCache(): void {
    this.cache = null;
  }
}

// Export singleton instance
export const kmlParser = new KMLParser();