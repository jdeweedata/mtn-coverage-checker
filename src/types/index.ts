export interface CoverageResult {
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  province: string;
  timestamp: string;
  coverage: CoverageData;
  errors: ErrorInfo[];
  success: boolean;
}

export interface CoverageData {
  publicQuery?: {
    available: boolean;
    data: any;
    source: string;
  };
  coveragePoint?: {
    available: boolean;
    types: TechnologyCoverage[];
    source: string;
  };
  wmsFeatures?: {
    available: boolean;
    features: any[];
    source: string;
  };
  consumerApi?: {
    available: boolean;
    services: any;
    source: string;
  };
}

export interface TechnologyCoverage {
  type: TechnologyType;
  available: boolean;
  strength?: 'low' | 'medium' | 'high';
  speed?: string;
  quality?: number;
}

export type TechnologyType =
  | '2G'
  | '3G'
  | '4G'
  | '5G'
  | 'UNCAPPED_WIRELESS'
  | 'FIBRE'
  | 'LICENSED_WIRELESS'
  | 'FIXED_LTE';

export interface ErrorInfo {
  endpoint: number | string;
  error: string;
}

export interface AddressSearchResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name?: string;
  types: string[];
}

export interface ToggleState {
  [key in TechnologyType]: boolean;
}

export interface GoogleMapsConfig {
  apiKey: string;
  libraries: string[];
}