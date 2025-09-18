import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { CoverageResult } from '../types';
import { apiClient } from '../utils/apiClient';
import clsx from 'clsx';
import { MapPin, Layers } from 'lucide-react';

interface GoogleMapProps {
  result: CoverageResult | null;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  className?: string;
  height?: string;
}

export const GoogleMap: React.FC<GoogleMapProps> = ({
  result,
  onLocationSelect,
  className,
  height = '400px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const overlayRef = useRef<google.maps.GroundOverlay | null>(null);

  const [showCoverageLayer, setShowCoverageLayer] = useState(true);

  const { isLoaded, error } = useGoogleMaps();

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: -26.2041, lng: 28.0473 }, // Johannesburg center
      zoom: 12,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // Add click listener for location selection
    if (onLocationSelect) {
      map.addListener('click', async (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();

          // Reverse geocode to get address
          const geocoder = new google.maps.Geocoder();
          try {
            const response = await geocoder.geocode({ location: { lat, lng } });
            const address = response.results[0]?.formatted_address || `${lat}, ${lng}`;
            onLocationSelect(lat, lng, address);
          } catch (err) {
            onLocationSelect(lat, lng, `${lat}, ${lng}`);
          }
        }
      });
    }

    // Removed Tarana data loading - using only live MTN APIs

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
      }
    };
  }, [isLoaded, onLocationSelect]);

  // Update map when result changes
  useEffect(() => {
    if (!mapInstanceRef.current || !result) return;

    const { lat, lng } = result.coordinates;
    const position = { lat, lng };

    // Update map center and zoom
    mapInstanceRef.current.setCenter(position);
    mapInstanceRef.current.setZoom(14);

    // Update or create marker
    if (markerRef.current) {
      markerRef.current.setPosition(position);
    } else {
      markerRef.current = new google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: result.address,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: result.success ? '#10B981' : '#EF4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold text-sm">${result.address}</h3>
            <p class="text-xs text-gray-600">${result.province}</p>
            <p class="text-xs ${result.success ? 'text-green-600' : 'text-red-600'}">
              ${result.success ? 'Coverage Available' : 'No Coverage Data'}
            </p>
          </div>
        `,
      });

      markerRef.current.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, markerRef.current);
      });
    }

    // Add coverage overlay if available and enabled
    if (showCoverageLayer && result.success) {
      addCoverageOverlay(lat, lng);
    } else if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }
  }, [result, showCoverageLayer]);


  const addCoverageOverlay = (lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;

    // Remove existing overlay
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
    }

    try {
      // Get WMS overlay URL from API client
      const overlayUrl = apiClient.getWMSMapUrl(lat, lng, 800, 600);

      const bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(lat - 0.05, lng - 0.05), // SW corner
        new google.maps.LatLng(lat + 0.05, lng + 0.05)  // NE corner
      );

      overlayRef.current = new google.maps.GroundOverlay(overlayUrl, bounds, {
        opacity: 0.6,
        clickable: false,
      });

      overlayRef.current.setMap(mapInstanceRef.current);
    } catch (err) {
      console.error('Failed to add coverage overlay:', err);
    }
  };

  const toggleCoverageLayer = () => {
    setShowCoverageLayer(prev => !prev);
  };


  if (error) {
    return (
      <div className={clsx("card", className)} style={{ height }}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Map Unavailable
            </h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={clsx("card animate-pulse", className)} style={{ height }}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("relative", className)}>
      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full rounded-lg border border-gray-200 shadow-sm"
        style={{ height }}
      />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <button
          onClick={toggleCoverageLayer}
          className={clsx(
            "flex items-center space-x-2 px-3 py-2 rounded-lg shadow-md transition-colors",
            "bg-white border border-gray-200 hover:bg-gray-50",
            "text-sm font-medium",
            showCoverageLayer ? "text-blue-600" : "text-gray-600"
          )}
          title="Toggle coverage overlay"
        >
          <Layers className="w-4 h-4" />
          <span>Coverage</span>
        </button>

      </div>

      {/* Click Instructions and Status */}
      <div className="absolute bottom-4 left-4 space-y-2">
        {onLocationSelect && (
          <div className="bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-md">
            <p className="text-xs text-gray-600">
              Click anywhere on the map to check coverage
            </p>
          </div>
        )}

      </div>
    </div>
  );
};