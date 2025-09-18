import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2, Building2 } from 'lucide-react';
import { useGooglePlaces } from '../hooks/useGoogleMaps';
import clsx from 'clsx';

interface AddressInputProps {
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  onAddressSelect,
  placeholder = "Enter an address, business name, or place in South Africa...",
  className,
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { isLoaded, error, searchPlaces, getPlaceDetails } = useGooglePlaces();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchDebounced = useRef<NodeJS.Timeout>();

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);

    if (searchDebounced.current) {
      clearTimeout(searchDebounced.current);
    }

    if (value.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    searchDebounced.current = setTimeout(async () => {
      if (!isLoaded) return;

      setIsLoading(true);
      try {
        const results = await searchPlaces(value);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (err) {
        console.error('Places search error:', err);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSuggestionClick = async (prediction: google.maps.places.AutocompletePrediction) => {
    setIsLoading(true);
    try {
      const details = await getPlaceDetails(prediction.place_id);
      if (details.geometry?.location) {
        const lat = details.geometry.location.lat();
        const lng = details.geometry.location.lng();
        const address = details.name && details.types?.includes('establishment')
          ? `${details.name}, ${details.formatted_address}`
          : details.formatted_address || prediction.description;

        setQuery(address);
        onAddressSelect(address, lat, lng);
        setIsOpen(false);
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Place details error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  if (error) {
    return (
      <div className="w-full p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center text-red-600">
          <MapPin className="w-5 h-5 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={clsx("relative w-full", className)}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 3 && suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled || !isLoaded}
          className={clsx(
            "w-full h-14 pl-12 pr-6 text-lg",
            "border-2 border-gray-200 rounded-xl",
            "bg-white/80 backdrop-blur-sm",
            "focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20",
            "disabled:bg-gray-50 disabled:text-gray-500",
            "placeholder:text-gray-500",
            "transition-all duration-200 ease-out",
            "hover:border-gray-300 hover:shadow-md"
          )}
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => {
            const isEstablishment = suggestion.types?.includes('establishment');
            const Icon = isEstablishment ? Building2 : MapPin;

            return (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={clsx(
                  "w-full px-5 py-4 text-left hover:bg-yellow-50 flex items-start space-x-3",
                  "border-b border-gray-100 last:border-b-0",
                  selectedIndex === index && "bg-yellow-50 hover:bg-yellow-50",
                  "focus:outline-none focus:bg-yellow-50",
                  "transition-colors duration-150"
                )}
              >
                <Icon className={clsx(
                  "w-4 h-4 mt-0.5 flex-shrink-0",
                  isEstablishment ? "text-orange-500" : "text-gray-400"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </div>
                  {suggestion.structured_formatting?.secondary_text && (
                    <div className="text-xs text-gray-500 truncate">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  )}
                  {isEstablishment && (
                    <div className="text-xs text-orange-600 font-medium">
                      Business
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};