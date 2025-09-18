import { kmlParser, TaranaTower, TaranaCoverageData } from './kmlParser';
import { CoverageResult } from '../types';

export interface TaranaCoveragePoint {
  available: boolean;
  strength: 'high' | 'medium' | 'low';
  nearestTowers: Array<{
    tower: TaranaTower;
    distance: number;
    signalStrength: number;
  }>;
  coverageRadius: number;
}

/**
 * Service for checking Tarana Fixed Wireless coverage using static KMZ data
 */
export class TaranaCoverageService {
  private coverageData: TaranaCoverageData | null = null;
  private readonly MAX_COVERAGE_RADIUS = 15; // km - typical fixed wireless range
  private readonly HIGH_STRENGTH_RADIUS = 5; // km
  private readonly MEDIUM_STRENGTH_RADIUS = 10; // km

  /**
   * Initialize coverage data
   */
  async initialize(): Promise<void> {
    if (!this.coverageData) {
      this.coverageData = await kmlParser.loadTaranaCoverage();
    }
  }

  /**
   * Check coverage at specific coordinates
   */
  async checkCoverage(lat: number, lng: number): Promise<TaranaCoveragePoint> {
    await this.initialize();

    if (!this.coverageData) {
      throw new Error('Failed to load Tarana coverage data');
    }

    // Find nearby towers within coverage radius
    const nearbyTowers = this.findNearbyTowers(lat, lng);

    if (nearbyTowers.length === 0) {
      return {
        available: false,
        strength: 'low',
        nearestTowers: [],
        coverageRadius: 0
      };
    }

    // Calculate coverage strength based on nearest tower
    const nearestTower = nearbyTowers[0];
    const strength = this.calculateSignalStrength(nearestTower.distance);

    return {
      available: true,
      strength,
      nearestTowers: nearbyTowers.slice(0, 5), // Top 5 towers
      coverageRadius: this.MAX_COVERAGE_RADIUS
    };
  }

  /**
   * Find towers within coverage radius, sorted by distance
   */
  private findNearbyTowers(lat: number, lng: number): Array<{
    tower: TaranaTower;
    distance: number;
    signalStrength: number;
  }> {
    if (!this.coverageData) return [];

    const nearbyTowers: Array<{
      tower: TaranaTower;
      distance: number;
      signalStrength: number;
    }> = [];

    for (const tower of this.coverageData.towers) {
      const distance = this.calculateDistance(lat, lng, tower.lat, tower.lng);

      if (distance <= this.MAX_COVERAGE_RADIUS) {
        const signalStrength = this.calculateSignalScore(distance);
        nearbyTowers.push({
          tower,
          distance,
          signalStrength
        });
      }
    }

    // Sort by distance (closest first)
    return nearbyTowers.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate signal strength based on distance
   */
  private calculateSignalStrength(distance: number): 'high' | 'medium' | 'low' {
    if (distance <= this.HIGH_STRENGTH_RADIUS) {
      return 'high';
    } else if (distance <= this.MEDIUM_STRENGTH_RADIUS) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Calculate signal score (0-100) based on distance
   */
  private calculateSignalScore(distance: number): number {
    if (distance > this.MAX_COVERAGE_RADIUS) return 0;

    // Linear falloff from 100 at 0km to 20 at max radius
    const score = Math.max(20, 100 - (distance / this.MAX_COVERAGE_RADIUS) * 80);
    return Math.round(score);
  }

  /**
   * Check if coordinates are within coverage bounds
   */
  isWithinCoverageBounds(lat: number, lng: number): boolean {
    if (!this.coverageData) return false;

    const bounds = this.coverageData.metadata.bounds;
    return (
      lat >= bounds.south &&
      lat <= bounds.north &&
      lng >= bounds.west &&
      lng <= bounds.east
    );
  }

  /**
   * Get coverage statistics
   */
  getCoverageStats(): {
    totalTowers: number;
    coverageArea: number;
    averageSpacing: number;
  } | null {
    if (!this.coverageData) return null;

    const totalTowers = this.coverageData.towers.length;
    const bounds = this.coverageData.metadata.bounds;

    // Approximate coverage area (rectangular bounds)
    const latSpan = bounds.north - bounds.south;
    const lngSpan = bounds.east - bounds.west;
    const coverageArea = latSpan * lngSpan * 111 * 111; // Rough km² calculation

    // Average spacing between towers
    const averageSpacing = Math.sqrt(coverageArea / totalTowers);

    return {
      totalTowers,
      coverageArea: Math.round(coverageArea),
      averageSpacing: Math.round(averageSpacing * 100) / 100
    };
  }

  /**
   * Format coverage result for integration with MTN API
   */
  formatCoverageResult(
    lat: number,
    lng: number,
    address: string,
    coveragePoint: TaranaCoveragePoint
  ): CoverageResult {
    const province = this.getProvinceFromCoordinates(lat, lng);

    return {
      success: coveragePoint.available,
      coordinates: { lat, lng },
      address,
      province,
      timestamp: new Date().toISOString(),
      coverage: {
        taranaStatic: {
          available: coveragePoint.available,
          types: [{
            type: 'UNCAPPED_WIRELESS',
            available: coveragePoint.available,
            strength: coveragePoint.strength,
            details: {
              nearestTowers: coveragePoint.nearestTowers.length,
              coverageRadius: `${coveragePoint.coverageRadius}km`,
              signalStrength: coveragePoint.nearestTowers[0]?.signalStrength || 0
            }
          }],
          source: 'Tarana Fixed Wireless (Static KMZ Data)',
          metadata: {
            dataDate: this.coverageData?.metadata.date || '2025-07-16',
            totalTowers: this.coverageData?.towers.length || 0
          }
        }
      }
    };
  }

  /**
   * Determine province from coordinates (simplified)
   */
  private getProvinceFromCoordinates(lat: number, lng: number): string {
    // Simplified province detection based on coordinate ranges
    if (lat > -26 && lng > 27.5) return 'Gauteng';
    if (lat < -32 && lng < 20) return 'Western Cape';
    if (lat < -28 && lng > 29) return 'KwaZulu-Natal';
    if (lat > -26 && lng < 26) return 'North West';
    if (lat > -25) return 'Limpopo';
    if (lat > -30 && lng < 25) return 'Northern Cape';
    if (lat > -27 && lng > 25 && lng < 30) return 'Free State';
    if (lat > -27 && lng > 30) return 'Mpumalanga';
    return 'Eastern Cape';
  }

  /**
   * Clear cache to force reload
   */
  clearCache(): void {
    this.coverageData = null;
    kmlParser.clearCache();
  }
}

// Export singleton instance
export const taranaCoverageService = new TaranaCoverageService();