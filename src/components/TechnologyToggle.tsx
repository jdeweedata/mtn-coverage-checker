import React from 'react';
import { TechnologyType, ToggleState } from '../types';
import clsx from 'clsx';
import { Wifi, Signal, Smartphone, Router, Cable, Zap, Check, Radio } from 'lucide-react';

interface TechnologyToggleProps {
  toggleState: ToggleState;
  onToggle: (technology: TechnologyType, enabled: boolean) => void;
  availableTechnologies?: TechnologyType[];
  addressSelected?: boolean;
  className?: string;
}

const technologyConfig: Record<TechnologyType, {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}> = {
  '2G': {
    label: '2G',
    description: 'Basic voice and SMS',
    icon: Signal,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 hover:bg-gray-200'
  },
  '3G': {
    label: '3G',
    description: 'Voice, SMS, basic data',
    icon: Smartphone,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 hover:bg-blue-200'
  },
  '4G': {
    label: '4G LTE',
    description: 'High-speed mobile data',
    icon: Wifi,
    color: 'text-green-600',
    bgColor: 'bg-green-100 hover:bg-green-200'
  },
  '5G': {
    label: '5G',
    description: 'Ultra-fast mobile data',
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 hover:bg-purple-200'
  },
  'UNCAPPED_WIRELESS': {
    label: 'Uncapped Wireless',
    description: 'Fixed wireless broadband',
    icon: Router,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 hover:bg-orange-200'
  },
  'FIBRE': {
    label: 'Fibre',
    description: 'High-speed fibre connection',
    icon: Cable,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 hover:bg-indigo-200'
  },
  'LICENSED_WIRELESS': {
    label: 'Licensed Wireless',
    description: 'Point-to-multipoint wireless',
    icon: Radio,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 hover:bg-cyan-200'
  },
  'FIXED_LTE': {
    label: 'Fixed LTE',
    description: 'Fixed LTE broadband',
    icon: Signal,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100 hover:bg-teal-200'
  }
};

export const TechnologyToggle: React.FC<TechnologyToggleProps> = ({
  toggleState,
  onToggle,
  availableTechnologies,
  addressSelected = false,
  className
}) => {
  const technologies = availableTechnologies || Object.keys(technologyConfig) as TechnologyType[];

  const allSelected = technologies.every(tech => toggleState[tech]);
  const someSelected = technologies.some(tech => toggleState[tech]);

  const handleSelectAll = () => {
    const newState = !allSelected;
    technologies.forEach(tech => {
      onToggle(tech, newState);
    });
  };

  return (
    <div className={clsx("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {addressSelected ? 'Available Technologies' : 'Coverage Types'}
        </h3>
        {technologies.length > 0 && (
          <button
            onClick={handleSelectAll}
            className={clsx(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              "border border-gray-300 hover:border-blue-400 hover:shadow-md",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              allSelected
                ? "bg-blue-50 text-blue-700 border-blue-300"
                : "bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            )}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {!addressSelected && technologies.length === 8 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            💡 Enter an address to see which technologies are actually available at that location
          </p>
        </div>
      )}

      {addressSelected && technologies.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-sm text-yellow-800">
            No MTN technologies are available at this address
          </p>
        </div>
      )}

      <div className="space-y-2">
        {technologies.map(tech => {
          const config = technologyConfig[tech];
          const Icon = config.icon;
          const isSelected = toggleState[tech];

          return (
            <button
              key={tech}
              onClick={() => onToggle(tech, !isSelected)}
              role="checkbox"
              aria-pressed={isSelected}
              aria-label={`${config.label} - ${config.description}${isSelected ? ', selected' : ''}`}
              className={clsx(
                "relative w-full p-4 rounded-xl border transition-all duration-200 ease-out",
                "focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2",
                "text-left group cursor-pointer flex items-center justify-between",
                "hover:shadow-lg hover:border-yellow-300",
                isSelected
                  ? [
                      "border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50",
                      "shadow-md ring-1 ring-yellow-200"
                    ]
                  : [
                      "border-gray-200 bg-white",
                      "hover:bg-gray-50"
                    ]
              )}
            >
              <div className="flex items-center space-x-4">
                <div className={clsx(
                  "flex-shrink-0 p-3 rounded-full transition-all duration-200",
                  isSelected
                    ? "bg-yellow-500 ring-2 ring-yellow-200"
                    : "bg-gray-100 group-hover:bg-gray-200"
                )}>
                  <Icon className={clsx(
                    "w-5 h-5 transition-colors duration-200",
                    isSelected ? "text-white" : "text-gray-600"
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className={clsx(
                    "font-semibold text-base",
                    isSelected ? "text-gray-900" : "text-gray-900"
                  )}>
                    {config.label}
                  </div>
                  <div className={clsx(
                    "text-sm mt-1",
                    isSelected ? "text-gray-600" : "text-gray-500"
                  )}>
                    {config.description}
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-6 h-6 bg-yellow-500 rounded-full">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {someSelected && (
        <div className="text-sm text-gray-600">
          {technologies.filter(tech => toggleState[tech]).length} of {technologies.length} technologies selected
        </div>
      )}
    </div>
  );
};