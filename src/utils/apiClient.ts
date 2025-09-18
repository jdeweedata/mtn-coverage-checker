// API client for handling both development and production environments
// Uses Vercel proxy in production, handles direct calls in development

export class ApiClient {
  private baseUrl: string;
  private useProxy: boolean;

  constructor() {
    // Detect environment
    this.useProxy = process.env.NODE_ENV === 'production' ||
                   window.location.hostname !== 'localhost';

    this.baseUrl = this.useProxy ? '' : 'http://localhost:3001';
  }

  /**
   * Proxy MTN coverage API calls through Vercel function for a single technology
   */
  async checkSingleTechnology(lat: number, lng: number, technology: string = 'ALL'): Promise<any> {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        technology,
        type: 'wms'
      });

      const url = this.useProxy
        ? `/api/coverage?${params.toString()}`
        : `${this.baseUrl}/api/coverage?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Coverage check failed for ${technology}:`, error);
      throw error;
    }
  }

  /**
   * Check coverage for multiple technologies
   */
  async checkMultipleTechnologies(lat: number, lng: number, technologies: string[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    // Run checks in parallel for better performance
    const promises = technologies.map(async (tech) => {
      try {
        const result = await this.checkSingleTechnology(lat, lng, tech);
        return { tech, result };
      } catch (error) {
        return { tech, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    const responses = await Promise.allSettled(promises);

    responses.forEach((response) => {
      if (response.status === 'fulfilled') {
        const { tech, result, error } = response.value;
        if (error) {
          results[tech] = { error };
        } else {
          results[tech] = result;
        }
      } else {
        // This shouldn't happen with Promise.allSettled, but handle just in case
        console.error('Unexpected promise rejection:', response.reason);
      }
    });

    return results;
  }

  /**
   * Geocode an address using proxy
   */
  async geocodeAddress(address: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        address: address
      });

      const url = this.useProxy
        ? `/api/geocode?${params.toString()}`
        : `${this.baseUrl}/api/geocode?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Geocoding failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Geocoding failed:', error);
      throw error;
    }
  }

  /**
   * Check coverage for a location with address - compatible with existing app structure
   */
  async checkCoverage(lat: number, lng: number, address: string): Promise<any> {
    try {
      // Check multiple technologies in parallel
      const technologies = ['2G', '3G', '4G', '5G', 'UNCAPPED_WIRELESS', 'FIBRE', 'LICENSED_WIRELESS', 'FIXED_LTE'];
      const results = await this.checkMultipleTechnologies(lat, lng, technologies);

      // Process results to determine coverage availability
      const processedCoverage: any = {};

      Object.entries(results).forEach(([tech, result]: [string, any]) => {
        if (result && !result.error) {
          // Check if we have actual coverage data
          const hasCoverage = this.parseCoverageResult(result);

          processedCoverage[tech] = {
            types: [{
              type: tech,
              available: hasCoverage,
              signal_strength: hasCoverage ? 'Good' : 'No Signal',
              technology: tech
            }]
          };
        } else {
          // No coverage or error
          processedCoverage[tech] = {
            types: [{
              type: tech,
              available: false,
              signal_strength: 'No Signal',
              technology: tech
            }]
          };
        }
      });

      // Format the response to match the expected structure
      return {
        address,
        coordinates: { lat, lng },
        coverage: processedCoverage,
        timestamp: new Date().toISOString(),
        source: 'MTN Live API (via Vercel proxy)'
      };
    } catch (error) {
      console.error('Coverage check failed:', error);
      // Return a structure that indicates no coverage available
      return {
        address,
        coordinates: { lat, lng },
        coverage: {},
        timestamp: new Date().toISOString(),
        source: 'MTN Live API (via Vercel proxy)',
        error: error instanceof Error ? error.message : 'Coverage check failed'
      };
    }
  }

  /**
   * Parse MTN API response to determine if coverage is available
   */
  private parseCoverageResult(result: any): boolean {
    if (!result) return false;

    // If it's a text response, check for coverage indicators
    if (result.type === 'text' && result.content) {
      const content = result.content.toLowerCase();
      // MTN returns specific text when there's no coverage
      return !content.includes('no features') &&
             !content.includes('outside') &&
             content.trim() !== '';
    }

    // If it's binary data (image), assume it means there's coverage
    if (result.type === 'binary' && result.content) {
      return true;
    }

    // For other response types, be conservative
    return false;
  }

  /**
   * Generate WMS URL for coverage overlay using proxy
   */
  getWMSMapUrl(lat: number, lng: number, width = 800, height = 600, technology: string = 'ALL'): string {
    // Return a URL that uses our Vercel proxy for WMS requests
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      technology,
      type: 'wms',
      width: width.toString(),
      height: height.toString(),
      format: 'image/png'
    });

    return this.useProxy
      ? `/api/coverage?${params.toString()}`
      : `${this.baseUrl}/api/coverage?${params.toString()}`;
  }

  /**
   * Test if the proxy is working
   */
  async testConnection(): Promise<{ proxy: boolean; direct: boolean }> {
    const results = { proxy: false, direct: false };

    // Test proxy endpoint
    try {
      const proxyResponse = await fetch('/api/coverage?lat=-26.2041&lng=28.0473&technology=ALL&type=wms');
      results.proxy = proxyResponse.ok;
    } catch (error) {
      console.log('Proxy test failed:', error);
    }

    // Test direct MTN API (will likely fail due to CORS)
    try {
      const directResponse = await fetch('https://mtnsi.mtn.co.za/cache/geoserver/wms?mlid=EBU-RBUS-ALL&SERVICE=WMS&REQUEST=GetFeatureInfo');
      results.direct = directResponse.ok;
    } catch (error) {
      console.log('Direct API test failed (expected due to CORS):', error);
    }

    return results;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();