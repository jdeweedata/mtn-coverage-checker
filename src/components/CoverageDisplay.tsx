import React from 'react';
import { CoverageResult, TechnologyType, ToggleState } from '../types';
import clsx from 'clsx';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Clock,
  Signal,
  Wifi,
  Smartphone,
  Router,
  Cable,
  Zap
} from 'lucide-react';

interface CoverageDisplayProps {
  result: CoverageResult | null;
  toggleState: ToggleState;
  isLoading?: boolean;
  className?: string;
}

const technologyIcons: Record<TechnologyType, React.ComponentType<{ className?: string }>> = {
  '2G': Signal,
  '3G': Smartphone,
  '4G': Wifi,
  '5G': Zap,
  'UNCAPPED_WIRELESS': Router,
  'FIBRE': Cable,
  'FIXED_LTE': Signal
};

const strengthColors = {
  high: 'text-green-600 bg-green-100',
  medium: 'text-yellow-600 bg-yellow-100',
  low: 'text-red-600 bg-red-100'
};

export const CoverageDisplay: React.FC<CoverageDisplayProps> = ({
  result,
  toggleState,
  isLoading = false,
  className
}) => {
  if (isLoading) {
    return (
      <div className={clsx("card animate-pulse", className)}>
        <div className="card-content">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={clsx("card", className)}>
        <div className="card-content">
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Coverage Data
            </h3>
            <p className="text-gray-500">
              Enter an address to check MTN coverage in that area.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activeTechnologies = Object.keys(toggleState).filter(
    tech => toggleState[tech as TechnologyType]
  ) as TechnologyType[];

  const getCoverageInfo = () => {
    const info: Array<{
      type: TechnologyType;
      available: boolean;
      strength?: string;
      quality?: number;
      infrastructureType?: string;
      source?: string;
    }> = [];

    // Safety check for coverage data
    if (!result.coverage || typeof result.coverage !== 'object') {
      return info;
    }

    // Extract coverage data from different sources
    Object.values(result.coverage).forEach(source => {
      if (source?.types && Array.isArray(source.types)) {
        source.types.forEach((tech: any) => {
          if (activeTechnologies.includes(tech.type)) {
            info.push({
              type: tech.type,
              available: tech.available,
              strength: tech.strength,
              quality: tech.quality,
              infrastructureType: tech.infrastructureType,
              source: source.source
            });
          }
        });
      }
    });

    return info;
  };

  const coverageInfo = getCoverageInfo();

  return (
    <div className={clsx("space-y-6", className)}>
      {/* Location Info */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{result.address}</h3>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>{result.province}</span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(result.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
            <div className={clsx(
              "px-2 py-1 rounded-full text-xs font-medium",
              result.success
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            )}>
              {result.success ? 'Coverage Found' : 'No Data'}
            </div>
          </div>
        </div>
      </div>

      {/* Coverage Results */}
      {result.success && coverageInfo && coverageInfo.length > 0 ? (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Coverage Results</h3>
            <p className="text-sm text-gray-600">
              Showing results for {activeTechnologies?.length || 0} selected technologies
            </p>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              {coverageInfo.map((tech, index) => {
                const Icon = technologyIcons[tech.type];
                return (
                  <div
                    key={`${tech.type}-${index}`}
                    className={clsx(
                      "flex items-center justify-between p-4 rounded-lg border",
                      tech.available
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={clsx(
                        "w-5 h-5",
                        tech.available ? "text-green-600" : "text-red-600"
                      )} />
                      <div>
                        <div className="font-medium text-gray-900">
                          {tech.type.replace('_', ' ')}
                        </div>
                        {tech.infrastructureType && (
                          <div className="text-xs text-gray-600">
                            {tech.infrastructureType}
                          </div>
                        )}
                        {tech.source && (
                          <div className="text-xs text-gray-500">
                            Source: {tech.source}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {tech.available ? (
                        <>
                          <div className="flex flex-col items-end space-y-1">
                            {tech.strength && (
                              <span className={clsx(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                strengthColors[tech.strength as keyof typeof strengthColors]
                              )}>
                                {tech.strength} signal
                              </span>
                            )}
                            {tech.quality && (
                              <span className="text-xs text-gray-500">
                                Quality: {tech.quality}%
                              </span>
                            )}
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </>
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-content">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Coverage Data Available
              </h3>
              <p className="text-gray-500 mb-4">
                We couldn't find coverage information for this location.
              </p>
              {result.errors.length > 0 && (
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-700 mb-2">Errors:</p>
                  <ul className="text-sm text-red-600 space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index}>• {error.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Sources */}
      {result.success && Object.keys(result.coverage).length > 0 && (
        <div className="card">
          <div className="card-header">
            <h4 className="font-medium text-gray-900">Data Sources</h4>
          </div>
          <div className="card-content">
            <div className="space-y-2">
              {Object.values(result.coverage).map((source, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">{source.source}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};