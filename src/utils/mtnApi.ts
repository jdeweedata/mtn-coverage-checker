import { CoverageResult, TechnologyType, CoverageData } from '../types';
// Removed Tarana static data import - using only live MTN APIs

export class MTNApi {
  private endpoints = {
    publicCoverage: 'https://www.mtn.co.za/home/coverage/query',
    coverageMap: 'https://www.mtn.co.za/home/coverage/',
    geoserver: 'https://mtnsi.mtn.co.za/cache/geoserver/wms',
    coverageApi: 'https://mtnsi.mtn.co.za/coverage/api/point',
    tiles: 'https://mtnsi.mtn.co.za/tiles',
    consumerApi: 'https://api.mtn.co.za/coverage/v1/availability',
    signalApi: 'https://api.mtn.co.za/coverage/v1/signal'
  };

  // WMS Layer configurations extracted from official MTN coverage map documentation
  private technologyLayers = {
    'ALL': {
      mlid: 'EBU-RBUS-ALL',
      geoserverLayer: 'mtnsi:MTN-EBU-RBUS-ALL2',
      style: 'MTN-EBU-RBUS-ALL',
      opacity: 0.7
    },
    '2G': {
      mlid: 'EBU-RBUS-ALL',
      geoserverLayer: 'mtnsi:MTNSA-Coverage-2G',
      style: 'MTN-Coverage-2G',
      opacity: 0.7
    },
    '3G': {
      mlid: 'EBU-RBUS-ALL',
      geoserverLayer: 'mtnsi:MTNSA-Coverage-3G',
      style: 'MTN-Coverage-3G',
      opacity: 0.7
    },
    '4G': {
      mlid: 'EBU-RBUS-ALL',
      geoserverLayer: 'mtnsi:MTNSA-Coverage-4G',
      style: 'MTN-Coverage-4G',
      opacity: 0.7
    },
    '5G': {
      mlid: 'EBU-RBUS-ALL',
      geoserverLayer: 'mtnsi:MTNSA-Coverage-5G',
      style: 'MTN-Coverage-5G',
      opacity: 0.7
    },
    'UNCAPPED_WIRELESS': {
      mlid: 'UncappedWirelessEBU',
      geoserverLayer: 'mtnsi:MTNSA-Coverage-Tarana',
      style: 'MTN-Coverage-UWA-EBU',
      opacity: 0.7
    },
    'FIBRE': {
      mlid: 'FTTBCoverage',
      geoserverLayer: 'mtnsi:MTN-FTTB-Feasible',
      style: 'MTN-FTTB-Feasible-G',
      opacity: 0.7
    },
    'LICENSED_WIRELESS': {
      mlid: 'PMPCoverage',
      geoserverLayer: 'mtnsi:MTN-PMP-Feasible-Integrated',
      style: 'MTN-PMP-Feasible-B',
      opacity: 0.7
    },
    'FIXED_LTE': {
      mlid: 'FLTECoverageEBU',
      geoserverLayer: 'mtnsi:MTNSA-Coverage-FIXLTE-EBU-0',
      style: 'MTN-Coverage-FIXLTE-EBU-R',
      opacity: 0.7
    }
  };

  private saBounds = {
    north: -22,
    south: -35,
    east: 33,
    west: 16
  };

  private cache = new Map<string, { data: CoverageResult; timestamp: number }>();
  private cacheTimeout = 300000; // 5 minutes

  async checkCoverage(latitude: number, longitude: number, address?: string): Promise<CoverageResult> {
    // Validate coordinates are in South Africa
    if (!this.isInSouthAfrica(latitude, longitude)) {
      return {
        success: false,
        coordinates: { lat: latitude, lng: longitude },
        address: address || `${latitude}, ${longitude}`,
        province: 'Unknown',
        timestamp: new Date().toISOString(),
        coverage: {},
        errors: [{ endpoint: 'validation', error: 'Coordinates are outside South Africa' }]
      };
    }

    // Check cache first
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const results: CoverageResult = {
      coordinates: { lat: latitude, lng: longitude },
      address: address || `${latitude}, ${longitude}`,
      province: this.getProvince(latitude, longitude),
      timestamp: new Date().toISOString(),
      coverage: {},
      errors: [],
      success: false
    };

    // Try real MTN GeoServer WMS coverage data first
    const realCoverage = await this.getRealMTNCoverage(latitude, longitude, address);

    if (realCoverage) {
      results.coverage = realCoverage;
      results.success = true;
      this.addToCache(cacheKey, results);
      return results;
    }

    // Real MTN API failed - no fallback, return failure
    console.log('Real MTN API failed (likely CORS)');

    // Fallback to other API endpoints if WMS lookup fails
    const coveragePromises = [
      this.tryPublicCoverageQuery(latitude, longitude),
      this.tryCoverageApiPoint(latitude, longitude),
      this.tryWMSFeatureInfo(latitude, longitude),
      this.tryAlternativeEndpoint(latitude, longitude)
    ];

    try {
      const responses = await Promise.allSettled(coveragePromises);

      // Process responses
      responses.forEach((response, index) => {
        if (response.status === 'fulfilled' && response.value) {
          Object.assign(results.coverage, response.value);
        } else if (response.status === 'rejected') {
          results.errors.push({
            endpoint: index,
            error: response.reason?.message || 'Unknown error'
          });
        }
      });

      // Determine overall success
      results.success = Object.keys(results.coverage).length > 0;

      // Add to cache
      if (results.success) {
        this.addToCache(cacheKey, results);
      }
    } catch (error) {
      results.errors.push({
        endpoint: 'general',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }

    return results;
  }

  private async tryPublicCoverageQuery(lat: number, lng: number): Promise<Partial<CoverageData> | null> {
    try {
      const url = `${this.endpoints.publicCoverage}`;
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        type: 'all'
      });

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          publicQuery: {
            available: true,
            data: data,
            source: 'MTN Public Coverage Query'
          }
        };
      }
    } catch (error) {
      console.error('Public coverage query failed:', error);
    }
    return null;
  }

  private async tryCoverageApiPoint(lat: number, lng: number): Promise<Partial<CoverageData> | null> {
    try {
      const response = await fetch(this.endpoints.coverageApi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          location: { lat: lat, lng: lng },
          coverageTypes: ['3G', '4G', '5G', 'UNCAPPED_WIRELESS', 'FIBRE', 'FIXED_LTE']
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          coveragePoint: {
            available: true,
            types: data,
            source: 'MTN Coverage API Point'
          }
        };
      }
    } catch (error) {
      console.error('Coverage API point failed:', error);
    }
    return null;
  }

  private async tryWMSFeatureInfo(lat: number, lng: number): Promise<Partial<CoverageData> | null> {
    try {
      const bbox = `${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}`;

      const params = new URLSearchParams({
        service: 'WMS',
        version: '1.1.1',
        request: 'GetFeatureInfo',
        layers: 'mtn:uncapped_wireless_coverage',
        query_layers: 'mtn:uncapped_wireless_coverage',
        x: '400',
        y: '300',
        width: '800',
        height: '600',
        bbox: bbox,
        srs: 'EPSG:4326',
        info_format: 'application/json'
      });

      const response = await fetch(`${this.endpoints.geoserver}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          wmsFeatures: {
            available: true,
            features: data.features || [],
            source: 'MTN WMS Service'
          }
        };
      }
    } catch (error) {
      console.error('WMS GetFeatureInfo failed:', error);
    }
    return null;
  }

  private async tryAlternativeEndpoint(lat: number, lng: number): Promise<Partial<CoverageData> | null> {
    try {
      const url = `${this.endpoints.consumerApi}`;
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lng.toString(),
        service: 'UNCAPPED_WIRELESS'
      });

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          consumerApi: {
            available: true,
            services: data,
            source: 'MTN Consumer API'
          }
        };
      }
    } catch (error) {
      console.error('Alternative endpoint failed:', error);
    }
    return null;
  }

  /**
   * Get real MTN coverage data using the actual GeoServer WMS API
   * This method queries the official MTN coverage layers for each technology
   */
  private async getRealMTNCoverage(lat: number, lng: number, address?: string): Promise<Partial<CoverageData> | null> {
    try {
      const availableTechnologies = [];
      const errors = [];

      // Check each technology layer
      for (const [techType, layerConfig] of Object.entries(this.technologyLayers)) {
        try {
          const coverage = await this.checkTechnologyCoverage(lat, lng, techType as TechnologyType, layerConfig);
          if (coverage) {
            availableTechnologies.push(coverage);
          }
        } catch (error) {
          errors.push({ tech: techType, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      if (availableTechnologies.length === 0) {
        console.log('No MTN coverage found at this location:', { lat, lng, errors });
        return null;
      }

      return {
        mtnGeoServer: {
          available: true,
          types: availableTechnologies,
          source: 'MTN GeoServer WMS',
          coordinates: { lat, lng },
          address: address,
          errors: errors.length > 0 ? errors : undefined
        }
      };
    } catch (error) {
      console.error('Real MTN coverage lookup failed:', error);
      return null;
    }
  }

  /**
   * Check coverage for a specific technology using MTN's WMS GetFeatureInfo
   */
  private async checkTechnologyCoverage(lat: number, lng: number, techType: TechnologyType, layerConfig: any): Promise<any | null> {
    try {
      // Convert lat/lng to EPSG:900913 (Spherical Mercator) for MTN's system
      const mercatorCoords = this.convertToSphericalMercator(lat, lng);

      // Create a small bounding box around the point
      const buffer = 100; // meters
      const bbox = [
        mercatorCoords.x - buffer,
        mercatorCoords.y - buffer,
        mercatorCoords.x + buffer,
        mercatorCoords.y + buffer
      ].join(',');

      const params = new URLSearchParams({
        mlid: layerConfig.mlid,
        SERVICE: 'WMS',
        REQUEST: 'GetFeatureInfo',
        VERSION: '1.1.1',
        LAYERS: layerConfig.geoserverLayer,
        STYLES: layerConfig.style,
        FORMAT: 'application/json',
        TRANSPARENT: 'TRUE',
        TILED: 'TRUE',
        SRS: 'EPSG:900913',
        BBOX: bbox,
        WIDTH: '200',
        HEIGHT: '200',
        X: '100',
        Y: '100',
        QUERY_LAYERS: layerConfig.geoserverLayer,
        INFO_FORMAT: 'application/json',
        FEATURE_COUNT: '50'
      });

      const response = await fetch(`${this.endpoints.geoserver}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Check if any features were returned (indicates coverage)
        const hasCoverage = data.features && data.features.length > 0;

        if (hasCoverage) {
          // Analyze the coverage data to determine strength and quality
          const coverageAnalysis = this.analyzeCoverageFeatures(data.features, techType);

          return {
            type: techType,
            available: true,
            strength: coverageAnalysis.strength,
            quality: coverageAnalysis.quality,
            infrastructureType: this.getTechnologyDescription(techType),
            features: data.features,
            layerInfo: layerConfig
          };
        }
      } else {
        console.log(`No ${techType} coverage found:`, response.status, response.statusText);
      }

      return null;
    } catch (error) {
      console.error(`Error checking ${techType} coverage:`, error);
      return null;
    }
  }

  /**
   * Convert WGS84 coordinates to EPSG:900913 (Spherical Mercator)
   * Using the same projection calculations as the official MTN coverage map
   */
  private convertToSphericalMercator(lat: number, lng: number): { x: number, y: number } {
    const EARTH_RADIUS = 6378137.0; // Earth's radius in meters

    // Convert longitude to Web Mercator X
    const x = lng * Math.PI / 180 * EARTH_RADIUS;

    // Convert latitude to Web Mercator Y
    const latRad = lat * Math.PI / 180;
    const y = Math.log(Math.tan(latRad / 2 + Math.PI / 4)) * EARTH_RADIUS;

    return { x, y };
  }

  /**
   * Analyze coverage features to determine signal strength and quality
   */
  private analyzeCoverageFeatures(features: any[], techType: TechnologyType): { strength: string, quality: number } {
    if (!features || features.length === 0) {
      return { strength: 'low', quality: 0 };
    }

    // Analyze properties of coverage features to determine quality
    let totalQuality = 0;
    let qualityCount = 0;

    features.forEach(feature => {
      if (feature.properties) {
        // Look for signal strength indicators in feature properties
        const props = feature.properties;

        // Common property names that might indicate signal strength
        const signalProps = ['signal', 'strength', 'quality', 'level', 'power', 'rssi'];

        for (const prop of signalProps) {
          const value = props[prop];
          if (typeof value === 'number' && value > 0) {
            totalQuality += value;
            qualityCount++;
          }
        }
      }
    });

    // Calculate average quality or use technology-based defaults
    let quality: number;
    if (qualityCount > 0) {
      quality = Math.round(totalQuality / qualityCount);
    } else {
      // Default quality based on technology type
      const techQuality = {
        '2G': 60,
        '3G': 70,
        '4G': 85,
        '5G': 95,
        'UNCAPPED_WIRELESS': 80,
        'FIBRE': 98,
        'FIXED_LTE': 75
      };
      quality = techQuality[techType] || 70;
    }

    // Determine strength based on quality and feature count
    let strength: string;
    if (quality >= 85 && features.length >= 3) strength = 'high';
    else if (quality >= 65 || features.length >= 2) strength = 'medium';
    else strength = 'low';

    return { strength, quality: Math.min(100, Math.max(0, quality)) };
  }

  /**
   * Get human-readable description for technology type
   */
  private getTechnologyDescription(techType: TechnologyType): string {
    const descriptions = {
      '2G': 'Legacy Network',
      '3G': 'Enhanced Network',
      '4G': 'LTE Network',
      '5G': '5G Network',
      'UNCAPPED_WIRELESS': 'Fixed Wireless Access',
      'FIBRE': 'Fibre Network',
      'FIXED_LTE': 'Fixed LTE Access'
    };
    return descriptions[techType] || 'Network Coverage';
  }

  // Removed infrastructure analysis fallback - using only live MTN APIs

  private analyzeLocation(lat: number, lng: number, address?: string) {
    const province = this.getProvince(lat, lng);

    // Calculate distance from major cities
    const majorCities = [
      { name: 'Johannesburg', lat: -26.2041, lng: 28.0473, population: 4500000 },
      { name: 'Cape Town', lat: -33.9249, lng: 18.4241, population: 4600000 },
      { name: 'Durban', lat: -29.8587, lng: 31.0218, population: 3500000 },
      { name: 'Pretoria', lat: -25.7479, lng: 28.2293, population: 2500000 },
      { name: 'Port Elizabeth', lat: -33.9608, lng: 25.6022, population: 1300000 },
      { name: 'Bloemfontein', lat: -29.0852, lng: 26.1596, population: 750000 }
    ];

    let nearestCity = majorCities[0];
    let minDistance = this.calculateDistance(lat, lng, nearestCity.lat, nearestCity.lng);

    majorCities.forEach(city => {
      const distance = this.calculateDistance(lat, lng, city.lat, city.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    });

    // Analyze address characteristics
    const addressType = this.analyzeAddressType(address);

    // Determine urban density
    let urbanDensity: 'urban' | 'suburban' | 'rural';
    if (minDistance < 5) urbanDensity = 'urban';
    else if (minDistance < 25) urbanDensity = 'suburban';
    else urbanDensity = 'rural';

    // Location analysis preserved for potential future use
    return {
      province,
      nearestCity: nearestCity.name,
      distanceFromCity: Math.round(minDistance),
      urbanDensity,
      addressType,
      coordinates: { lat, lng }
    };
  }

  private analyzeAddressType(address?: string) {
    if (!address) return { isResidential: false, isBusiness: false, isIndustrial: false };

    const addressLower = address.toLowerCase();

    const businessKeywords = ['office', 'mall', 'center', 'centre', 'building', 'tower', 'plaza', 'complex', 'park', 'business'];
    const residentialKeywords = ['street', 'avenue', 'road', 'drive', 'lane', 'way', 'close', 'crescent'];
    const industrialKeywords = ['industrial', 'factory', 'warehouse', 'plant'];

    return {
      isBusiness: businessKeywords.some(keyword => addressLower.includes(keyword)),
      isResidential: residentialKeywords.some(keyword => addressLower.includes(keyword)),
      isIndustrial: industrialKeywords.some(keyword => addressLower.includes(keyword))
    };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  getTileUrl(z: number, x: number, y: number, layer = 'uncapped_wireless'): string {
    return `${this.endpoints.tiles}/${layer}/${z}/${x}/${y}.png`;
  }

  /**
   * Generate WMS URL for coverage overlay using proper Web Mercator projection
   * Based on the official MTN coverage map implementation
   */
  getWMSMapUrl(lat: number, lng: number, width = 800, height = 600, technology: TechnologyType = 'UNCAPPED_WIRELESS'): string {
    const layerConfig = this.technologyLayers[technology];
    if (!layerConfig) {
      console.warn(`No layer configuration found for technology: ${technology}`);
      return '';
    }

    // Convert center point to Web Mercator
    const center = this.convertToSphericalMercator(lat, lng);

    // Calculate buffer in meters (approximately 5km)
    const buffer = 5000; // 5km in meters

    // Create bounding box in Web Mercator projection
    const bbox = [
      center.x - buffer,
      center.y - buffer,
      center.x + buffer,
      center.y + buffer
    ].join(',');

    const params = new URLSearchParams({
      mlid: layerConfig.mlid,
      SERVICE: 'WMS',
      REQUEST: 'GetMap',
      VERSION: '1.1.1',
      LAYERS: layerConfig.geoserverLayer,
      STYLES: layerConfig.style,
      FORMAT: 'image/png',
      TRANSPARENT: 'TRUE',
      TILED: 'TRUE',
      SRS: 'EPSG:900913',
      BBOX: bbox,
      WIDTH: width.toString(),
      HEIGHT: height.toString()
    });

    return `${this.endpoints.geoserver}?${params}`;
  }

  private isInSouthAfrica(lat: number, lng: number): boolean {
    return lat >= this.saBounds.south &&
           lat <= this.saBounds.north &&
           lng >= this.saBounds.west &&
           lng <= this.saBounds.east;
  }

  private getProvince(lat: number, lng: number): string {
    const provinces = {
      'Gauteng': { lat: [-26.5, -25.0], lng: [27.5, 29.0] },
      'Western Cape': { lat: [-34.5, -31.0], lng: [17.5, 21.0] },
      'KwaZulu-Natal': { lat: [-31.5, -27.0], lng: [28.5, 33.0] },
      'Eastern Cape': { lat: [-33.5, -30.0], lng: [22.0, 28.5] },
      'Limpopo': { lat: [-25.5, -22.0], lng: [26.5, 31.5] },
      'Mpumalanga': { lat: [-26.5, -24.0], lng: [28.5, 32.0] },
      'North West': { lat: [-27.5, -24.0], lng: [22.0, 28.5] },
      'Free State': { lat: [-30.0, -26.5], lng: [24.0, 29.5] },
      'Northern Cape': { lat: [-32.0, -26.0], lng: [16.0, 26.0] }
    };

    for (const [province, bounds] of Object.entries(provinces)) {
      if (lat >= bounds.lat[0] && lat <= bounds.lat[1] &&
          lng >= bounds.lng[0] && lng <= bounds.lng[1]) {
        return province;
      }
    }
    return 'Unknown';
  }

  private addToCache(key: string, data: CoverageResult): void {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  private getFromCache(key: string): CoverageResult | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }
}

export const mtnApi = new MTNApi();