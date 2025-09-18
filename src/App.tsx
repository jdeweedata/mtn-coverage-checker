import React, { useState } from 'react';
import { AddressInput } from './components/AddressInput';
import { TechnologyToggle } from './components/TechnologyToggle';
import { CoverageDisplay } from './components/CoverageDisplay';
import { GoogleMap } from './components/GoogleMap';
import { CoverageResult, ToggleState, TechnologyType } from './types';
import { apiClient } from './utils/apiClient';
import { Zap, MapPin, Settings, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

function App() {
  const [result, setResult] = useState<CoverageResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableTechnologies, setAvailableTechnologies] = useState<TechnologyType[]>([]);
  const [toggleState, setToggleState] = useState<ToggleState>({
    '2G': false,
    '3G': false,
    '4G': false,
    '5G': false,
    'UNCAPPED_WIRELESS': false,
    'FIBRE': false,
    'LICENSED_WIRELESS': false,
    'FIXED_LTE': false,
  });

  const handleAddressSelect = async (address: string, lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const coverage = await apiClient.checkCoverage(lat, lng, address);
      setResult(coverage);

      // Extract available technologies from coverage results
      const technologies: TechnologyType[] = [];

      // Safety check for coverage data
      if (coverage.coverage && typeof coverage.coverage === 'object') {
        Object.values(coverage.coverage).forEach(source => {
          if (source?.types && Array.isArray(source.types)) {
            source.types.forEach((tech: any) => {
              if (tech.available && !technologies.includes(tech.type)) {
                technologies.push(tech.type);
              }
            });
          }
        });
      }

      setAvailableTechnologies(technologies);

      // Auto-select all available technologies
      const newToggleState = {
        '2G': false,
        '3G': false,
        '4G': false,
        '5G': false,
        'UNCAPPED_WIRELESS': false,
        'FIBRE': false,
        'LICENSED_WIRELESS': false,
        'FIXED_LTE': false,
      } as ToggleState;

      technologies.forEach(tech => {
        newToggleState[tech] = true;
      });

      setToggleState(newToggleState);

    } catch (error) {
      console.error('Coverage check failed:', error);
      setResult({
        success: false,
        coordinates: { lat, lng },
        address,
        province: 'Unknown',
        timestamp: new Date().toISOString(),
        coverage: {},
        errors: [{ endpoint: 'api', error: error instanceof Error ? error.message : 'Unknown error' }]
      });
      setAvailableTechnologies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapLocationSelect = (lat: number, lng: number, address: string) => {
    handleAddressSelect(address, lat, lng);
  };

  const handleTechnologyToggle = (technology: TechnologyType, enabled: boolean) => {
    setToggleState(prev => ({
      ...prev,
      [technology]: enabled
    }));
  };

  const handleRefresh = () => {
    if (result) {
      const { lat, lng } = result.coordinates;
      handleAddressSelect(result.address, lat, lng);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">MTN Coverage Checker</h1>
                <p className="text-sm text-gray-600 font-medium">Network coverage across South Africa</p>
              </div>
            </div>

            {result && (
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className={clsx(
                  "flex items-center space-x-2 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-300 transition-all duration-200 font-medium",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                <RefreshCw className={clsx("w-4 h-4", isLoading && "animate-spin")} />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Side Menu Bar - Technology Cards */}
          <div className="w-80 flex-shrink-0">
            <div className="card h-fit sticky top-24">
              <div className="p-8">
                <div className="flex items-center space-x-3 mb-2">
                  <Settings className="w-6 h-6 text-yellow-600" />
                  <h2 className="text-xl font-bold text-gray-900">Coverage Options</h2>
                </div>
                <p className="text-gray-600 mb-8">
                  Select technologies to check coverage availability
                </p>
                <TechnologyToggle
                  toggleState={toggleState}
                  onToggle={handleTechnologyToggle}
                  availableTechnologies={availableTechnologies.length > 0 ? availableTechnologies : undefined}
                  addressSelected={result !== null}
                />
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-8">
            {/* Location Search */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg">
              <div className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Find Coverage</h2>
                    <p className="text-gray-600">
                      Search any address in South Africa
                    </p>
                  </div>
                </div>
                <AddressInput
                  onAddressSelect={handleAddressSelect}
                  disabled={isLoading}
                />
              </div>
            </div>
            {/* Map */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="p-8 pb-0">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-green-100 rounded-full">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Coverage Map</h2>
                    <p className="text-gray-600">
                      Interactive coverage visualization
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-8 pb-8">
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <GoogleMap
                    result={result}
                    onLocationSelect={handleMapLocationSelect}
                    height="500px"
                    className="xl:h-96"
                  />
                </div>
              </div>
            </div>

            {/* Coverage Results */}
            <CoverageDisplay
              result={result}
              toggleState={toggleState}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Sample Locations */}
        {!result && !isLoading && (
          <div className="mt-16">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Popular Locations
              </h3>
              <p className="text-lg text-gray-600">
                Quick coverage checks for major South African cities
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Johannesburg CBD', address: 'Johannesburg, South Africa', lat: -26.2041, lng: 28.0473 },
                { name: 'Cape Town CBD', address: 'Cape Town, South Africa', lat: -33.9249, lng: 18.4241 },
                { name: 'Durban', address: 'Durban, South Africa', lat: -29.8587, lng: 31.0218 },
                { name: 'Pretoria', address: 'Pretoria, South Africa', lat: -25.7479, lng: 28.2293 },
                { name: 'Port Elizabeth', address: 'Port Elizabeth, South Africa', lat: -33.9608, lng: 25.6022 },
                { name: 'Bloemfontein', address: 'Bloemfontein, South Africa', lat: -29.0852, lng: 26.1596 },
              ].map((location) => (
                <button
                  key={location.name}
                  onClick={() => handleAddressSelect(location.address, location.lat, location.lng)}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer text-left p-6 group hover:border-yellow-300 hover:-translate-y-1"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-yellow-100 rounded-full group-hover:bg-yellow-200 transition-colors">
                      <MapPin className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">{location.name}</div>
                      <div className="text-gray-600">{location.address}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-100 mt-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">MTN Coverage Checker</span>
            </div>
            <p className="text-gray-600 mb-2">
              Powered by MTN South Africa APIs
            </p>
            <p className="text-sm text-gray-500">
              Coverage data is approximate and may vary based on environmental factors
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;