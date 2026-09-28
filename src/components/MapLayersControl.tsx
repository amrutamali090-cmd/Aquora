import React from 'react';
import { MapLayerVisibility } from '../types';

interface MapLayersControlProps {
  layers: MapLayerVisibility;
  onToggleLayer: (layerKey: keyof MapLayerVisibility) => void;
  affectedCount: number;
}

export const MapLayersControl: React.FC<MapLayersControlProps> = ({
  layers,
  onToggleLayer,
  affectedCount,
}) => {
  const layerDefs: {
    key: keyof MapLayerVisibility;
    label: string;
    description: string;
    indicatorColor: string;
    badge?: string;
  }[] = [
    {
      key: 'streamNetwork',
      label: 'Stream Network',
      description: 'Connected reaches & hydrologic centerlines',
      indicatorColor: 'bg-cyan-400',
    },
    {
      key: 'citizenObservations',
      label: 'Citizen Observations',
      description: 'Geotagged ground truth photos & flow notes',
      indicatorColor: 'bg-emerald-400',
    },
    {
      key: 'rainfall',
      label: 'Rainfall Radar',
      description: 'Convective radar precipitation footprint',
      indicatorColor: 'bg-blue-400',
    },
    {
      key: 'environmentalSignals',
      label: 'Environmental Signals',
      description: 'Acoustic stage transducers & turbidity sondes',
      indicatorColor: 'bg-sky-400',
    },
    {
      key: 'scenarioImpact',
      label: 'Scenario Impact',
      description: 'Simulated surcharge zones & flood stress reaches',
      indicatorColor: 'bg-rose-500',
      badge: affectedCount > 0 ? `${affectedCount} Active` : undefined,
    },
    {
      key: 'attentionZones',
      label: 'Attention Zones',
      description: 'Confluence bottlenecks & low-clearance culverts',
      indicatorColor: 'bg-amber-400',
    },
  ];

  return (
    <div className="rounded-xl bg-slate-900/90 backdrop-blur-md border border-cyan-500/25 p-4 shadow-2xl text-slate-100">
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
          <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
            Map Layer Toggles
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Live Overlay State</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {layerDefs.map((layer) => {
          const isEnabled = layers[layer.key];
          return (
            <button
              type="button"
              key={layer.key}
              onClick={() => onToggleLayer(layer.key)}
              className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                isEnabled
                  ? 'bg-slate-950/80 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-950/30 border-slate-800 opacity-60 hover:opacity-85'
              }`}
            >
              <div className="flex items-center justify-between gap-1 w-full mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isEnabled ? layer.indicatorColor : 'bg-slate-600'
                    }`}
                  />
                  <span className="text-xs font-semibold text-white truncate">{layer.label}</span>
                </div>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => {}} // handled by parent button click
                  className="rounded text-cyan-500 focus:ring-0 w-3.5 h-3.5 bg-slate-900 border-slate-700 cursor-pointer pointer-events-none"
                />
              </div>
              <span className="text-[10px] text-slate-400 line-clamp-1">{layer.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
