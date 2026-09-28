import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { StreamSegment, MonitoringStation, RainfallHotspot, Observation, MapLayerVisibility } from '../types';
import { WATERSHED_CENTER, WATERSHED_DEFAULT_ZOOM } from '../services/mapService';

interface InMapLayers {
  waterLevel: boolean;
  rainfall: boolean;
  floodRisk: boolean;
  predictedFlow: boolean;
}

interface WatershedMapProps {
  segments: StreamSegment[];
  selectedSegmentId: string | null;
  onSelectSegment: (segment: StreamSegment) => void;
  stations: MonitoringStation[];
  rainfallHotspots: RainfallHotspot[];
  observations: Observation[];
  affectedSegmentIds: string[];
  layers: MapLayerVisibility;
  onToggleLayer: (layerKey: keyof MapLayerVisibility) => void;
  onResetView?: () => void;
  tileTheme?: 'dark' | 'standard' | 'satellite';
  onToggleTileTheme?: () => void;
  centerCoord?: [number, number];
  zoom?: number;
  floodPolygons?: {
    veryHigh: [number, number][];
    high: [number, number][];
    moderate: [number, number][];
    low: [number, number][];
  };
  locationName?: string;
}

// Flood Risk Heatmap Coordinates (simulated realistic delta catchment hazard polygons matching the reference image)
const DELTA_FLOOD_POLYGONS = {
  veryHigh: [
    [45.495, -122.685],
    [45.488, -122.670],
    [45.476, -122.678],
    [45.468, -122.695],
    [45.474, -122.705],
    [45.486, -122.700],
  ] as [number, number][],
  high: [
    [45.508, -122.668],
    [45.498, -122.655],
    [45.485, -122.662],
    [45.478, -122.675],
    [45.488, -122.672],
    [45.502, -122.675],
  ] as [number, number][],
  moderate: [
    [45.522, -122.648],
    [45.512, -122.638],
    [45.500, -122.648],
    [45.505, -122.662],
    [45.516, -122.658],
  ] as [number, number][],
  low: [
    [45.542, -122.620],
    [45.530, -122.610],
    [45.518, -122.632],
    [45.528, -122.645],
    [45.538, -122.635],
  ] as [number, number][],
};

export const WatershedMap: React.FC<WatershedMapProps> = ({
  segments,
  selectedSegmentId,
  onSelectSegment,
  stations,
  rainfallHotspots,
  observations,
  affectedSegmentIds,
  layers,
  onToggleLayer,
  centerCoord,
  zoom,
  floodPolygons,
  locationName = 'Catchment Area',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // In-map top-left layer toggles (matching the exact reference image pill)
  const [inMapLayers, setInMapLayers] = useState<InMapLayers>({
    waterLevel: true,
    rainfall: true,
    floodRisk: true,
    predictedFlow: true,
  });

  // Map tile style mode: OpenStreetMap dark tactical / OSM standard / NASA-Esri Satellite
  const [basemapStyle, setBasemapStyle] = useState<'osm_dark' | 'osm_standard' | 'satellite'>('osm_dark');

  const activeFloodPolygons = floodPolygons || DELTA_FLOOD_POLYGONS;

  const layerGroupsRef = useRef<{
    streams: L.LayerGroup;
    stations: L.LayerGroup;
    rainfall: L.LayerGroup;
    observations: L.LayerGroup;
    floodRiskHeat: L.LayerGroup;
    scenarioImpact: L.LayerGroup;
  } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: WATERSHED_CENTER,
      zoom: WATERSHED_DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    // Default: OpenStreetMap tiles (Free public no-key map implementation with dark theme filter)
    const tileLayer = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(map);

    tileLayerRef.current = tileLayer;

    // Apply dark tactical styling to match AQUORA aesthetic
    if (mapContainerRef.current) {
      mapContainerRef.current.classList.add('aquora-dark-tiles');
    }

    // Layer groups
    const floodRiskHeatGroup = L.layerGroup().addTo(map);
    const streamsGroup = L.layerGroup().addTo(map);
    const rainfallGroup = L.layerGroup().addTo(map);
    const stationsGroup = L.layerGroup().addTo(map);
    const observationsGroup = L.layerGroup().addTo(map);
    const scenarioImpactGroup = L.layerGroup().addTo(map);

    layerGroupsRef.current = {
      streams: streamsGroup,
      stations: stationsGroup,
      rainfall: rainfallGroup,
      observations: observationsGroup,
      floodRiskHeat: floodRiskHeatGroup,
      scenarioImpact: scenarioImpactGroup,
    };

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Tiles (OpenStreetMap & NASA/Esri Satellite - Completely Keyless)
  useEffect(() => {
    if (!tileLayerRef.current || !mapInstanceRef.current) return;

    let url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    if (basemapStyle === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    } else {
      url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    }

    tileLayerRef.current.setUrl(url);

    if (mapContainerRef.current) {
      if (basemapStyle === 'osm_dark') {
        mapContainerRef.current.classList.add('aquora-dark-tiles');
        mapContainerRef.current.classList.remove('aquora-osm-tiles');
      } else if (basemapStyle === 'osm_standard') {
        mapContainerRef.current.classList.remove('aquora-dark-tiles');
        mapContainerRef.current.classList.add('aquora-osm-tiles');
      } else {
        mapContainerRef.current.classList.remove('aquora-dark-tiles');
        mapContainerRef.current.classList.remove('aquora-osm-tiles');
      }
    }
  }, [basemapStyle]);

  // Dynamic pan/flyTo when centerCoord changes
  useEffect(() => {
    if (!mapInstanceRef.current || !centerCoord) return;
    mapInstanceRef.current.flyTo(centerCoord, zoom || 13, { duration: 1.2 });
  }, [centerCoord, zoom]);

  // Render Flood Risk Heatmap Overlays (From reference image: Red in lower delta, Orange, Yellow, Green)
  useEffect(() => {
    const lg = layerGroupsRef.current;
    if (!lg) return;

    lg.floodRiskHeat.clearLayers();

    if (inMapLayers.floodRisk) {
      // 1. Very High Risk (Red/Crimson)
      const veryHighPoly = L.polygon(activeFloodPolygons.veryHigh, {
        color: '#ef4444',
        weight: 1.5,
        fillColor: '#ef4444',
        fillOpacity: 0.42,
        dashArray: '3, 4',
      });
      veryHighPoly.bindTooltip(
        '<div style="font-size:11px; font-weight:bold; color:#f87171;">● Very High Risk Zone</div><div style="font-size:10px; color:#f1f5f9;">Downstream Convergence Bottleneck</div>',
        { sticky: true }
      );
      lg.floodRiskHeat.addLayer(veryHighPoly);

      // 2. High Risk (Coral/Orange)
      const highPoly = L.polygon(activeFloodPolygons.high, {
        color: '#f97316',
        weight: 1.2,
        fillColor: '#f97316',
        fillOpacity: 0.35,
      });
      highPoly.bindTooltip(
        '<div style="font-size:11px; font-weight:bold; color:#fb923c;">● High Risk Zone</div><div style="font-size:10px; color:#f1f5f9;">Central Channel Surcharge Corridor</div>',
        { sticky: true }
      );
      lg.floodRiskHeat.addLayer(highPoly);

      // 3. Moderate Risk (Yellow/Amber)
      const modPoly = L.polygon(activeFloodPolygons.moderate, {
        color: '#eab308',
        weight: 1,
        fillColor: '#eab308',
        fillOpacity: 0.28,
      });
      modPoly.bindTooltip(
        '<div style="font-size:11px; font-weight:bold; color:#facc15;">● Moderate Risk Zone</div><div style="font-size:10px; color:#f1f5f9;">Mid-Corridor Storm Buffer</div>',
        { sticky: true }
      );
      lg.floodRiskHeat.addLayer(modPoly);

      // 4. Low Risk (Green/Cyan)
      const lowPoly = L.polygon(activeFloodPolygons.low, {
        color: '#22c55e',
        weight: 1,
        fillColor: '#22c55e',
        fillOpacity: 0.22,
      });
      lowPoly.bindTooltip(
        '<div style="font-size:11px; font-weight:bold; color:#4ade80;">● Low Risk Zone</div><div style="font-size:10px; color:#f1f5f9;">Upper Catchment Headwaters</div>',
        { sticky: true }
      );
      lg.floodRiskHeat.addLayer(lowPoly);
    }
  }, [inMapLayers.floodRisk, activeFloodPolygons]);

  // Render Stream Network & Predicted Flow
  useEffect(() => {
    const lg = layerGroupsRef.current;
    if (!lg) return;

    lg.streams.clearLayers();

    if (layers.streamNetwork) {
      segments.forEach((seg) => {
        const isSelected = seg.id === selectedSegmentId;
        const isAffected = affectedSegmentIds.includes(seg.id);

        let strokeColor = '#00c3ff'; // vivid cyan
        if (seg.riskScore >= 70 || isAffected) {
          strokeColor = '#f43f5e'; // red
        } else if (seg.riskScore >= 45) {
          strokeColor = '#fb923c'; // orange
        }

        const weight = isSelected ? 8 : isAffected ? 6 : 4.5;

        // Glow line
        const glow = L.polyline(seg.coordinates, {
          color: strokeColor,
          weight: weight + 6,
          opacity: 0.28,
          lineCap: 'round',
        });

        // Main water polyline
        const polyline = L.polyline(seg.coordinates, {
          color: strokeColor,
          weight,
          opacity: 0.95,
          dashArray: inMapLayers.predictedFlow && isAffected ? '8, 6' : undefined,
          lineCap: 'round',
        });

        polyline.on('click', () => onSelectSegment(seg));

        polyline.bindTooltip(
          `<div style="font-size:12px; font-weight:bold; color:#38bdf8; font-family:'Plus Jakarta Sans',sans-serif;">${seg.name}</div>
           <div style="font-size:11px; color:#cbd5e1;">Flow: <strong>${seg.flowCondition}</strong> • Rain: <strong>${seg.rainfallMm} mm</strong></div>
           <div style="font-size:10px; color:#94a3b8; margin-top:2px;">Click to inspect stream telemetry →</div>`,
          { sticky: true }
        );

        lg.streams.addLayer(glow);
        lg.streams.addLayer(polyline);

        // Center Marker with Location Pin (Matching white pin with red dot in reference image!)
        if (seg.id === 'segment-b') {
          const pinIcon = L.divIcon({
            className: 'aquora-river-pin',
            html: `
              <div style="position: relative; width: 32px; height: 38px; cursor: pointer; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.8));">
                <svg width="32" height="38" viewBox="0 0 32 38" fill="none">
                  <path d="M16 0C7.163 0 0 7.163 0 16C0 27 16 38 16 38C16 38 32 27 32 16C32 7.163 24.837 0 16 0Z" fill="#ffffff" />
                  <circle cx="16" cy="15" r="7" fill="#ef4444" />
                </svg>
                <div style="position: absolute; -bottom: 18px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: rgba(5,14,28,0.92); border: 1px solid rgba(56,189,248,0.4); border-radius: 4px; padding: 1px 5px; font-size: 10px; font-weight: bold; color: #ffffff; font-family: sans-serif;">
                  River Point A
                </div>
              </div>
            `,
            iconSize: [32, 38],
            iconAnchor: [16, 38],
          });
          const pinMarker = L.marker(seg.centerCoord, { icon: pinIcon });
          pinMarker.on('click', () => onSelectSegment(seg));
          lg.streams.addLayer(pinMarker);
        } else {
          // Regular stream node
          const nodeIcon = L.divIcon({
            className: 'stream-dot',
            html: `
              <div style="width: 14px; height: 14px; border-radius: 50%; background: ${strokeColor}; border: 2px solid #ffffff; box-shadow: 0 0 8px ${strokeColor}; cursor: pointer;"></div>
            `,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });
          const nodeMarker = L.marker(seg.centerCoord, { icon: nodeIcon });
          nodeMarker.on('click', () => onSelectSegment(seg));
          lg.streams.addLayer(nodeMarker);
        }
      });
    }
  }, [segments, selectedSegmentId, affectedSegmentIds, layers.streamNetwork, inMapLayers.predictedFlow, onSelectSegment]);

  // Render Rainfall Hotspots Layer (When inMapLayers.rainfall is true)
  useEffect(() => {
    const lg = layerGroupsRef.current;
    if (!lg) return;

    lg.rainfall.clearLayers();

    if (inMapLayers.rainfall && layers.rainfall) {
      rainfallHotspots.forEach((rf) => {
        const circle = L.circle(rf.coordinates, {
          radius: rf.radiusMeters,
          color: '#38bdf8',
          weight: 1,
          fillColor: '#0284c7',
          fillOpacity: 0.18,
        });

        circle.bindTooltip(
          `<span style="color:#38bdf8; font-weight:bold;">${rf.name}</span><br/><span style="color:#f8fafc; font-size:11px;">Radar Precip: ${rf.intensityMm} mm/24h (${rf.category})</span>`
        );

        lg.rainfall.addLayer(circle);
      });
    }
  }, [rainfallHotspots, inMapLayers.rainfall, layers.rainfall]);

  // Render Monitoring Stations (When inMapLayers.waterLevel is true)
  useEffect(() => {
    const lg = layerGroupsRef.current;
    if (!lg) return;

    lg.stations.clearLayers();

    if (inMapLayers.waterLevel && layers.environmentalSignals) {
      stations.forEach((st) => {
        const isWarn = st.status === 'warning';
        const icon = L.divIcon({
          className: 'station-marker',
          html: `<div style="
            background: rgba(4, 12, 24, 0.92);
            border: 1.5px solid ${isWarn ? '#f59e0b' : '#38bdf8'};
            border-radius: 6px;
            padding: 2px 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            cursor: pointer;
          ">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${isWarn ? '#f59e0b' : '#10b981'};"></span>
            <span style="font-size: 10px; font-weight: 600; color: #f1f5f9;">${st.name.split(' ')[0]}</span>
            <span style="font-size: 9px; font-family: monospace; color: #38bdf8;">${st.currentValue}</span>
          </div>`,
          iconAnchor: [30, 10],
        });

        const marker = L.marker(st.coordinates, { icon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 170px;">
            <div style="font-size: 13px; font-weight: bold; color: #38bdf8;">${st.name}</div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">${st.type}</div>
            <div style="font-size: 14px; font-weight: bold; color: #f8fafc; font-family: monospace;">${st.currentValue} ${st.unit}</div>
          </div>
        `);
        lg.stations.addLayer(marker);
      });
    }
  }, [stations, inMapLayers.waterLevel, layers.environmentalSignals]);

  // Render Citizen Observations
  useEffect(() => {
    const lg = layerGroupsRef.current;
    if (!lg) return;

    lg.observations.clearLayers();

    if (layers.citizenObservations) {
      observations.forEach((obs) => {
        const isVerified = obs.validationStatus === 'verified';
        const icon = L.divIcon({
          className: 'obs-pin',
          html: `
            <div style="width: 24px; height: 24px; border-radius: 50%; background: ${isVerified ? '#10b981' : '#f59e0b'}; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.6); cursor: pointer;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(obs.coordinates, { icon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 210px;">
            <div style="font-size: 10px; font-weight: bold; color: ${isVerified ? '#34d399' : '#fbbf24'}; text-transform: uppercase;">
              ● ${isVerified ? 'VERIFIED EVIDENCE' : 'AWAITING VERIFICATION'}
            </div>
            <div style="font-size: 13px; font-weight: bold; color: #f8fafc; margin-top: 2px;">${obs.segmentName}</div>
            <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">Flow: ${obs.flowCondition} • Water: ${obs.waterAppearance}</div>
            <div style="font-size: 10px; color: #94a3b8; font-style: italic; margin-top: 4px;">"${obs.notes}"</div>
          </div>
        `);
        lg.observations.addLayer(marker);
      });
    }
  }, [observations, layers.citizenObservations]);

  // Recenter Map
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(WATERSHED_CENTER, WATERSHED_DEFAULT_ZOOM, {
        animate: true,
      });
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-2xl overflow-hidden border border-[#132d4b] shadow-[0_10px_30px_rgba(0,0,0,0.6)] bg-[#030914]">
      {/* Real Interactive Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '460px' }} />

      {/* TOP-LEFT FLOATING LAYER SELECTOR (Exact layout & styling from AQUORA reference image) */}
      <div className="absolute top-4 left-4 z-[1000] pointer-events-auto">
        <div className="px-3.5 py-2.5 rounded-xl bg-[#051122]/90 backdrop-blur-md border border-[#143354] shadow-[0_8px_20px_rgba(0,0,0,0.6)] flex flex-col gap-2 min-w-[145px]">
          {/* Water Level */}
          <button
            onClick={() => setInMapLayers((prev) => ({ ...prev, waterLevel: !prev.waterLevel }))}
            className="flex items-center gap-2 text-xs transition-colors hover:opacity-100 text-left"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full border transition-all ${
                inMapLayers.waterLevel
                  ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                  : 'bg-transparent border-slate-600'
              }`}
            />
            <span className={inMapLayers.waterLevel ? 'text-slate-100 font-medium' : 'text-slate-400'}>
              Water Level
            </span>
          </button>

          {/* Rainfall */}
          <button
            onClick={() => setInMapLayers((prev) => ({ ...prev, rainfall: !prev.rainfall }))}
            className="flex items-center gap-2 text-xs transition-colors hover:opacity-100 text-left"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full border transition-all ${
                inMapLayers.rainfall
                  ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                  : 'bg-transparent border-slate-600'
              }`}
            />
            <span className={inMapLayers.rainfall ? 'text-slate-100 font-medium' : 'text-slate-400'}>
              Rainfall
            </span>
          </button>

          {/* Flood Risk */}
          <button
            onClick={() => setInMapLayers((prev) => ({ ...prev, floodRisk: !prev.floodRisk }))}
            className="flex items-center gap-2 text-xs transition-colors hover:opacity-100 text-left"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full border transition-all ${
                inMapLayers.floodRisk
                  ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                  : 'bg-transparent border-slate-600'
              }`}
            />
            <span className={inMapLayers.floodRisk ? 'text-slate-100 font-medium' : 'text-slate-400'}>
              Flood Risk
            </span>
          </button>

          {/* Predicted Flow */}
          <button
            onClick={() => setInMapLayers((prev) => ({ ...prev, predictedFlow: !prev.predictedFlow }))}
            className="flex items-center gap-2 text-xs transition-colors hover:opacity-100 text-left"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full border transition-all ${
                inMapLayers.predictedFlow
                  ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                  : 'bg-transparent border-slate-600'
              }`}
            />
            <span className={inMapLayers.predictedFlow ? 'text-slate-100 font-medium' : 'text-slate-400'}>
              Predicted Flow
            </span>
          </button>
        </div>
      </div>

      {/* TOP-RIGHT FLOATING LEGEND (Exact layout & colors from AQUORA reference image) */}
      <div className="absolute top-4 right-4 z-[1000] pointer-events-auto">
        <div className="px-3.5 py-2.5 rounded-xl bg-[#051122]/90 backdrop-blur-md border border-[#143354] shadow-[0_8px_20px_rgba(0,0,0,0.6)] min-w-[145px]">
          <div className="text-[11px] font-semibold text-slate-300 mb-2">
            Flood Risk (Next 72h)
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_6px_rgba(239,68,68,0.8)]"></span>
              <span className="text-slate-200">Very High</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></span>
              <span className="text-slate-200">High</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]"></span>
              <span className="text-slate-200">Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></span>
              <span className="text-slate-200">Low</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM-RIGHT REFINED MAP CONTROLS (+, -, Recenter) */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-1.5 pointer-events-auto">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-lg bg-[#07162c]/90 hover:bg-[#0c2445] text-cyan-300 border border-[#153b63] shadow-md flex items-center justify-center font-bold text-base transition-all"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-lg bg-[#07162c]/90 hover:bg-[#0c2445] text-cyan-300 border border-[#153b63] shadow-md flex items-center justify-center font-bold text-base transition-all"
          title="Zoom Out"
        >
          –
        </button>
        <button
          onClick={handleRecenter}
          className="w-8 h-8 rounded-lg bg-[#07162c]/90 hover:bg-[#0c2445] text-cyan-300 border border-[#153b63] shadow-md flex items-center justify-center transition-all"
          title="Recenter Map"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="22" y1="12" x2="18" y2="12"/>
            <line x1="6" y1="12" x2="2" y2="12"/>
            <line x1="12" y1="6" x2="12" y2="2"/>
            <line x1="12" y1="22" x2="12" y2="18"/>
          </svg>
        </button>
      </div>

      {/* BOTTOM-LEFT VISIBLE ATTRIBUTION & BASEMAP TOGGLE */}
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="px-2.5 py-1 rounded-lg bg-[#051122]/90 backdrop-blur-md border border-[#143354] text-[10px] text-slate-300 flex items-center gap-1.5 shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-slate-200 font-medium">
            {basemapStyle === 'satellite'
              ? 'Satellite: NASA GIBS / Esri World Imagery'
              : '© OpenStreetMap contributors (No Key Required)'}
          </span>
          <span className="text-slate-400 border-l border-slate-700 pl-1.5">{locationName}</span>
        </div>

        <button
          onClick={() =>
            setBasemapStyle((prev) =>
              prev === 'osm_dark' ? 'osm_standard' : prev === 'osm_standard' ? 'satellite' : 'osm_dark'
            )
          }
          className="px-2.5 py-1 rounded-lg bg-[#07162c]/90 hover:bg-[#0c2445] text-[10px] font-medium text-cyan-300 border border-[#153b63] shadow transition-colors flex items-center gap-1"
          title="Switch Map Texture (OSM Dark / OSM Standard / Satellite)"
        >
          <span>Tiles:</span>
          <strong className="text-white capitalize">
            {basemapStyle === 'osm_dark' ? 'OSM Dark' : basemapStyle === 'osm_standard' ? 'OSM Standard' : 'Satellite (NASA/Esri)'}
          </strong>
        </button>
      </div>
    </div>
  );
};
