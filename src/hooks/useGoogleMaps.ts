import { useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface UseGoogleMapsProps {
  libraries?: string[];
}

export const useGoogleMaps = ({ libraries = ['places'] }: UseGoogleMapsProps = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key is not configured');
      return;
    }

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries,
    });

    loader
      .load()
      .then(() => {
        setIsLoaded(true);
        setError(null);
      })
      .catch((err) => {
        setError(`Error loading Google Maps: ${err.message}`);
        setIsLoaded(false);
      });
  }, []);

  return { isLoaded, error };
};

export const useGooglePlaces = () => {
  const { isLoaded, error } = useGoogleMaps({ libraries: ['places'] });
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);

  useEffect(() => {
    if (isLoaded && window.google) {
      // Create a dummy map for the PlacesService
      const map = new google.maps.Map(document.createElement('div'));
      setPlacesService(new google.maps.places.PlacesService(map));
      setAutocompleteService(new google.maps.places.AutocompleteService());
    }
  }, [isLoaded]);

  const searchPlaces = (query: string, viewport?: google.maps.LatLngBounds): Promise<google.maps.places.AutocompletePrediction[]> => {
    return new Promise((resolve, reject) => {
      if (!autocompleteService) {
        reject(new Error('Places service not loaded'));
        return;
      }

      const request: google.maps.places.AutocompletionRequest = {
        input: query,
        componentRestrictions: { country: 'za' }, // Restrict to South Africa
        types: ['establishment', 'geocode'], // Include businesses and addresses
      };

      // Add viewport biasing if provided
      if (viewport) {
        request.bounds = viewport;
      }

      autocompleteService.getPlacePredictions(
        request,
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions);
          } else {
            reject(new Error(`Places search failed: ${status}`));
          }
        }
      );
    });
  };

  const getPlaceDetails = (placeId: string): Promise<google.maps.places.PlaceResult> => {
    return new Promise((resolve, reject) => {
      if (!placesService) {
        reject(new Error('Places service not loaded'));
        return;
      }

      placesService.getDetails(
        {
          placeId,
          fields: ['formatted_address', 'geometry', 'name', 'types', 'business_status', 'place_id'],
        },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && result) {
            resolve(result);
          } else {
            reject(new Error(`Place details failed: ${status}`));
          }
        }
      );
    });
  };

  return {
    isLoaded,
    error,
    searchPlaces,
    getPlaceDetails,
  };
};