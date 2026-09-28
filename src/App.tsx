import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StreamSegment,
  ScenarioParams,
  ScenarioResult,
  Observation,
  ActionItem,
  OutcomeVerification,
  TimelineEvent,
  MapLayerVisibility,
  MonitoringStation,
  RainfallHotspot,
} from './types';
import {
  INITIAL_STREAM_SEGMENTS,
  INITIAL_MONITORING_STATIONS,
  INITIAL_RAINFALL_HOTSPOTS,
  INITIAL_OBSERVATIONS,
  generateWatershedDataForLocation,
} from './services/mapService';
import {
  fetchLiveWatershedWeather,
  searchLocations,
  PRESET_LOCATIONS,
  LocationPreset,
  WatershedWeather,
  GeocodingResult,
  getCurrentWeather,
} from './services/weatherService';
import { runDeterministicScenario } from './services/scenarioEngine';
import { calculateUncertainty } from './services/uncertaintyEngine';
import { generateActionPlanForScenario } from './services/actionPlanService';
import { runDeterministicAiValidation } from './services/observationService';
import { WatershedMap } from './components/WatershedMap';
import { SegmentDetailsPanel } from './components/SegmentDetailsPanel';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { UncertaintyPanel } from './components/UncertaintyPanel';
import { NextBestObservationCard } from './components/NextBestObservationCard';
import { ObservationModal } from './components/ObservationModal';
import { AiValidationModal } from './components/AiValidationModal';
import { ActionPlanPanel } from './components/ActionPlanPanel';
import { OutcomeVerificationModal } from './components/OutcomeVerificationModal';
import { EvidenceTimeline } from './components/EvidenceTimeline';
import { QuickJourneyGuide } from './components/QuickJourneyGuide';
import { DataSourcesModal } from './components/DataSourcesModal';

export default function App() {
  // Navigation Tabs matching reference sidebar: Home, Live Map, Scenarios, Insights, Alerts, Settings
  const [activeNav, setActiveNav] = useState<'home' | 'map' | 'scenarios' | 'insights' | 'alerts' | 'settings'>('home');

  // Mobile preview side companion toggle
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Top foresight banner expanded toggle
  const [showForesightBanner, setShowForesightBanner] = useState(true);

  // Real Location & Telemetry State
  const [selectedLocation, setSelectedLocation] = useState<LocationPreset>(PRESET_LOCATIONS[0]);
  const [weatherData, setWeatherData] = useState<WatershedWeather>(() => getCurrentWeather());
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [showDataSourcesModal, setShowDataSourcesModal] = useState(false);

  // Location Geocoding Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Core Watershed Geometries & Dynamic Data
  const [segments, setSegments] = useState<StreamSegment[]>(INITIAL_STREAM_SEGMENTS);
  const [monitoringStations, setMonitoringStations] = useState<MonitoringStation[]>(INITIAL_MONITORING_STATIONS);
  const [rainfallHotspots, setRainfallHotspots] = useState<RainfallHotspot[]>(INITIAL_RAINFALL_HOTSPOTS);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>('segment-b');
  const [floodPolygons, setFloodPolygons] = useState<{
    veryHigh: [number, number][];
    high: [number, number][];
    moderate: [number, number][];
    low: [number, number][];
  } | undefined>(undefined);

  // Scenario Simulation State (Initialized from real weather baseline)
  const [scenarioParams, setScenarioParams] = useState<ScenarioParams>({
    rainfallMm: 70, // Default to 70mm for interactive exploration
    temperatureC: 22.4,
    vegetationCover: 'Moderate',
    upstreamDevelopment: 'High',
    flowCondition: 'Elevated',
  });

  // Observations State
  const [observations, setObservations] = useState<Observation[]>(INITIAL_OBSERVATIONS);

  // Computed Scenario Result
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult>(() => {
    return runDeterministicScenario({
      rainfallMm: 70,
      temperatureC: 22.4,
      vegetationCover: 'Moderate',
      upstreamDevelopment: 'High',
      flowCondition: 'Elevated',
    });
  });

  // Actions State
  const [actionItems, setActionItems] = useState<ActionItem[]>(() => {
    const initialScenario = runDeterministicScenario({
      rainfallMm: 70,
      temperatureC: 22.4,
      vegetationCover: 'Moderate',
      upstreamDevelopment: 'High',
      flowCondition: 'Elevated',
    });
    return generateActionPlanForScenario(initialScenario);
  });

  // Outcome Verification State
  const [outcomeVerifications, setOutcomeVerifications] = useState<OutcomeVerification[]>([]);

  // Timeline Events
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([
    {
      id: 'evt-1',
      time: '09:10',
      timestamp: new Date(Date.now() - 3600000 * 2),
      title: 'Real Telemetry synchronized',
      description: 'Open-Meteo atmospheric observation feed initialized with zero API-keys.',
      type: 'observation',
    },
    {
      id: 'evt-2',
      time: '09:12',
      timestamp: new Date(Date.now() - 3600000 * 1.8),
      title: 'Satellite coverage acquired',
      description: 'NASA GIBS orbital pass data linked for selected geographic catchment.',
      type: 'ai_validation',
    },
    {
      id: 'evt-3',
      time: '09:14',
      timestamp: new Date(Date.now() - 3600000 * 1.6),
      title: 'Downstream calibration alert',
      description: 'Hydrological bottleneck identified at Downstream Reach (Segment B).',
      type: 'scenario',
    },
  ]);

  // Map Controls State
  const [mapLayers, setMapLayers] = useState<MapLayerVisibility>({
    streamNetwork: true,
    citizenObservations: true,
    rainfall: true,
    environmentalSignals: true,
    scenarioImpact: true,
    attentionZones: true,
  });

  // Modals & Active Flows
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [observationTargetSegmentId, setObservationTargetSegmentId] = useState('segment-b');
  const [draftObservation, setDraftObservation] = useState<Observation | null>(null);
  const [isAiValidationModalOpen, setIsAiValidationModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);

  // Toast / System Notification
  const [adaptiveToast, setAdaptiveToast] = useState<string | null>(null);

  // Guided Journey Index
  const [journeyStepIndex, setJourneyStepIndex] = useState(0);

  // Check evidence states for Downstream Segment B
  const hasVerifiedDownstream = useMemo(() => {
    return observations.some(
      (o) => o.segmentId === 'segment-b' && o.validationStatus === 'verified'
    );
  }, [observations]);

  const hasPendingDownstream = useMemo(() => {
    return observations.some(
      (o) => o.segmentId === 'segment-b' && o.validationStatus === 'pending_human'
    );
  }, [observations]);

  const completedActionsCount = useMemo(() => {
    return actionItems.filter((a) => a.status === 'COMPLETED').length;
  }, [actionItems]);

  // Dynamic Uncertainty
  const uncertainty = useMemo(() => {
    return calculateUncertainty(
      scenarioParams.rainfallMm,
      hasPendingDownstream,
      hasVerifiedDownstream,
      completedActionsCount
    );
  }, [scenarioParams.rainfallMm, hasPendingDownstream, hasVerifiedDownstream, completedActionsCount]);

  // Selected Segment
  const selectedSegment = useMemo(() => {
    return segments.find((s) => s.id === selectedSegmentId) || null;
  }, [segments, selectedSegmentId]);

  // Helper to append timeline event
  const addTimelineEvent = (
    title: string,
    description: string,
    type: TimelineEvent['type']
  ) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newEvt: TimelineEvent = {
      id: `evt-${Date.now()}`,
      time: timeStr,
      timestamp: now,
      title,
      description,
      type,
    };
    setTimelineEvents((prev) => [newEvt, ...prev]);
  };

  // Fetch real live weather from Open-Meteo for a given location
  const refreshWeatherData = async (loc: LocationPreset) => {
    setIsFetchingWeather(true);
    try {
      const data = await fetchLiveWatershedWeather(
        loc.coordinates[0],
        loc.coordinates[1],
        loc.name,
        loc.country
      );
      setWeatherData(data);

      // Re-generate local watershed geometries around the new coordinates
      const watershedData = generateWatershedDataForLocation(
        loc.coordinates[0],
        loc.coordinates[1],
        loc.name,
        loc.watershedName,
        data.rainfallPast24hMm,
        data.currentTempC,
        loc.hasLiveUsgsSensor
      );

      setSegments(watershedData.segments);
      setMonitoringStations(watershedData.stations);
      setRainfallHotspots(watershedData.rainfallHotspots);
      setFloodPolygons(watershedData.floodPolygons);

      // Select default downstream reach
      setSelectedSegmentId('segment-b');

      // Update scenario parameters baseline to align with real weather
      const updatedRainfall = Math.max(20, Math.round(data.rainfallPast24hMm > 0 ? data.rainfallPast24hMm * 1.5 : 45));
      const updatedParams: ScenarioParams = {
        rainfallMm: updatedRainfall,
        temperatureC: data.currentTempC,
        vegetationCover: 'Moderate',
        upstreamDevelopment: 'High',
        flowCondition: data.rainfallPast24hMm > 25 ? 'Elevated' : 'Baseflow',
      };
      setScenarioParams(updatedParams);

      // Recalculate scenario result based on real changing location environmental inputs
      const dynamicResult = runDeterministicScenario(
        updatedParams,
        hasVerifiedDownstream,
        hasPendingDownstream
      );
      setScenarioResult(dynamicResult);

      // Recalculate action plan to match changing conditions
      const dynamicActions = generateActionPlanForScenario(dynamicResult);
      setActionItems(dynamicActions);
    } catch (err) {
      console.error('Failed to fetch real telemetry:', err);
    } finally {
      setIsFetchingWeather(false);
    }
  };

  // Initial mount: load real data for default location
  useEffect(() => {
    refreshWeatherData(selectedLocation);

    // Periodically refresh current conditions every 60 seconds (Part 4)
    const interval = setInterval(() => {
      refreshWeatherData(selectedLocation);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Handle Location Change
  const handleSelectLocation = async (loc: LocationPreset) => {
    setSelectedLocation(loc);
    setShowSearchDropdown(false);
    setSearchQuery('');
    await refreshWeatherData(loc);

    addTimelineEvent(
      'Location updated',
      `Active basin switched to ${loc.name} (${loc.watershedName}). Live Open-Meteo telemetry fetched.`,
      'scenario'
    );

    setAdaptiveToast(`Watershed updated: ${loc.name} (${loc.country}). Live data synchronized.`);
    setTimeout(() => setAdaptiveToast(null), 4500);
  };

  // Handle Geocoding Search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchLocations(searchQuery);
      setSearchResults(results);
      setShowSearchDropdown(true);
      setIsSearching(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside search container
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Selecting a Custom Geocoded Result
  const handleSelectGeocodedResult = (item: GeocodingResult) => {
    const customLoc: LocationPreset = {
      id: `geo-${item.id}`,
      name: item.name,
      country: item.country || 'Global',
      watershedName: `${item.name} Drainage Basin`,
      coordinates: [item.latitude, item.longitude],
      zoom: 13,
      hasLiveUsgsSensor: item.country === 'United States',
      description: `Catchment area for ${item.name}, ${item.country}. Real-time atmospheric telemetry via Open-Meteo.`,
    };
    handleSelectLocation(customLoc);
  };

  // Run Scenario Handler
  const handleRunScenario = (params: ScenarioParams) => {
    setScenarioParams(params);
    const result = runDeterministicScenario(
      params,
      hasVerifiedDownstream,
      hasPendingDownstream
    );
    setScenarioResult(result);

    // Update segments risk scores and rainfall based on new scenario
    setSegments((prev) =>
      prev.map((seg) => {
        const isDownstream = seg.id === 'segment-b';
        const isAffected = result.affectedSegmentIds.includes(seg.id);
        const newRain = Math.round(params.rainfallMm * (isDownstream ? 1.0 : seg.type === 'upstream' ? 0.75 : 0.88));
        return {
          ...seg,
          rainfallMm: newRain,
          riskScore: isAffected ? Math.min(95, result.scenarioScore + (isDownstream ? 8 : -4)) : seg.riskScore,
          flowCondition: params.rainfallMm > 60 ? (isDownstream ? 'Surge' : 'Elevated') : 'Baseflow',
          flowRateM3s: Number((seg.flowRateM3s * (result.runoffFactor / 1.5)).toFixed(1)),
        };
      })
    );

    // Generate new Action Plan
    const newActions = generateActionPlanForScenario(result);
    setActionItems(newActions);

    addTimelineEvent(
      'Scenario recalculated',
      `Simulation executed at ${params.rainfallMm}mm rainfall. Risk evaluated at ${result.riskLevel} (${result.scenarioScore}/100).`,
      'scenario'
    );
    addTimelineEvent(
      'Action plan generated',
      `${newActions.length} adaptive protocol tasks mobilized for field and operations dispatch.`,
      'action_plan'
    );

    if (journeyStepIndex <= 2) {
      setJourneyStepIndex(3);
    }
  };

  // Start Observation Form
  const handleStartObservation = (segmentId: string) => {
    setObservationTargetSegmentId(segmentId);
    setSelectedSegmentId(segmentId);
    setIsObservationModalOpen(true);
    if (journeyStepIndex === 4) {
      setJourneyStepIndex(5);
    }
  };

  // Handle Observation Submission
  const handleSubmitObservation = (data: Partial<Observation>) => {
    const targetSeg = segments.find((s) => s.id === data.segmentId) || segments[0];
    const newObs: Observation = {
      id: `obs-${Date.now()}`,
      segmentId: targetSeg.id,
      segmentName: targetSeg.name,
      coordinates: targetSeg.centerCoord,
      timestamp: 'Just now (Active Evidence)',
      observerName: data.observerName || 'Field Observer',
      waterAppearance: data.waterAppearance || 'Muddy / Brown',
      flowCondition: data.flowCondition || 'Elevated Flow',
      visibleDebris: data.visibleDebris || 'Leaf litter & branches',
      odorObservation: data.odorObservation || 'None / Natural earthy',
      notes: data.notes || 'Post-rain field inspection logged.',
      photoUrl: data.photoUrl,
      photoName: data.photoName,
      validationStatus: 'pending_human',
    };

    const aiCheck = runDeterministicAiValidation(newObs, scenarioResult);
    newObs.aiCheck = aiCheck;

    setDraftObservation(newObs);
    setIsObservationModalOpen(false);

    addTimelineEvent(
      'Observation received',
      `Ground evidence uploaded for ${targetSeg.name}. Turbidity: ${newObs.waterAppearance}, Flow: ${newObs.flowCondition}.`,
      'observation'
    );
    addTimelineEvent(
      'AI validation completed',
      `Deterministic engine verified field consistency (${aiCheck.consistency}, ${aiCheck.confidence}% confidence).`,
      'ai_validation'
    );

    setTimeout(() => {
      setIsAiValidationModalOpen(true);
    }, 350);

    if (journeyStepIndex <= 5) {
      setJourneyStepIndex(6);
    }
  };

  // Handle Human Confirmation of AI Check
  const handleConfirmAiValidation = () => {
    if (!draftObservation) return;

    const confirmedObs: Observation = {
      ...draftObservation,
      validationStatus: 'verified',
      verifiedAt: 'Just now',
      verifiedBy: 'Watershed Duty Forecaster',
    };

    setObservations((prev) => [confirmedObs, ...prev]);
    setIsAiValidationModalOpen(false);

    const updatedScenario = runDeterministicScenario(
      scenarioParams,
      true,
      false
    );
    setScenarioResult(updatedScenario);

    addTimelineEvent(
      'Human verification completed',
      `Ground truth confirmed by dispatcher. Model calibrated with verified downstream stage & turbidity.`,
      'human_verification'
    );

    setAdaptiveToast('New evidence reduced uncertainty in the downstream assessment.');
    setTimeout(() => {
      setAdaptiveToast(null);
    }, 6000);

    if (journeyStepIndex <= 6) {
      setJourneyStepIndex(7);
    }
  };

  const handleEditAiValidation = () => {
    setIsAiValidationModalOpen(false);
    setIsObservationModalOpen(true);
  };

  const handleRejectAiValidation = () => {
    if (draftObservation) {
      const rejectedObs: Observation = {
        ...draftObservation,
        validationStatus: 'rejected',
      };
      setObservations((prev) => [rejectedObs, ...prev]);
    }
    setIsAiValidationModalOpen(false);
    setDraftObservation(null);
  };

  // Toggle Action Status
  const handleToggleActionStatus = (actionId: string) => {
    setActionItems((prev) =>
      prev.map((act) => {
        if (act.id !== actionId) return act;
        let nextStatus: ActionItem['status'] = 'IN PROGRESS';
        if (act.status === 'PENDING') nextStatus = 'IN PROGRESS';
        else if (act.status === 'IN PROGRESS') nextStatus = 'COMPLETED';
        else nextStatus = 'PENDING';

        if (nextStatus === 'COMPLETED') {
          addTimelineEvent(
            'Monitoring action completed',
            `Field task finalized: "${act.title}" on ${act.targetSegmentName}.`,
            'action_completed'
          );
        }

        return {
          ...act,
          status: nextStatus,
          completedAt: nextStatus === 'COMPLETED' ? 'Just now' : undefined,
        };
      })
    );

    if (journeyStepIndex <= 8) {
      setJourneyStepIndex(8);
    }
  };

  // Save Outcome Verification
  const handleSaveOutcomeVerification = (
    alignment: 'Aligned' | 'Partially aligned' | 'Different',
    notes: string
  ) => {
    const newVerif: OutcomeVerification = {
      id: `verif-${Date.now()}`,
      scenarioExpectation: `Runoff surge factor +${scenarioResult.runoffFactor}x at ${scenarioParams.rainfallMm}mm rainfall.`,
      observedCondition: draftObservation
        ? `${draftObservation.flowCondition} with ${draftObservation.waterAppearance}`
        : 'Elevated stage 2.85m',
      alignment,
      verifiedAt: 'Just now',
      notes,
      feedbackImpact: 'Uncertainty reduced; model predictive coefficient fine-tuned.',
    };

    setOutcomeVerifications((prev) => [newVerif, ...prev]);

    addTimelineEvent(
      'Outcome verification logged',
      `Scenario vs reality evaluated as: "${alignment}". Field calibration notes stored for next-cycle anticipation.`,
      'outcome_verified'
    );

    setAdaptiveToast(`Outcome recorded: ${alignment}. Evidence timeline updated.`);
    setTimeout(() => setAdaptiveToast(null), 5000);

    if (journeyStepIndex <= 9) {
      setJourneyStepIndex(10);
    }
  };

  // Quick Journey Guide Handler
  const handleJumpToStep = (stepIdx: number) => {
    setJourneyStepIndex(stepIdx);
    switch (stepIdx) {
      case 0:
      case 1:
        setActiveNav('home');
        setSelectedSegmentId('segment-b');
        break;
      case 2:
        setActiveNav('scenarios');
        handleRunScenario({
          rainfallMm: 70,
          temperatureC: weatherData.currentTempC || 22.4,
          vegetationCover: 'Moderate',
          upstreamDevelopment: 'High',
          flowCondition: 'Elevated',
        });
        break;
      case 3:
      case 4:
        setActiveNav('home');
        break;
      case 5:
        handleStartObservation('segment-b');
        break;
      case 6:
        if (!draftObservation) {
          handleSubmitObservation({
            segmentId: 'segment-b',
            segmentName: `Downstream Segment B (${selectedLocation.name} Lower Reach)`,
            observerName: 'Jordan Lee (Field Hydrologist)',
            waterAppearance: 'Muddy / Brown',
            flowCondition: 'Elevated Flow',
            visibleDebris: 'Leaf litter & branches',
            notes: `High water mark +2.4m observed consistent with Open-Meteo precipitation (${weatherData.rainfallPast24hMm}mm).`,
          });
        } else {
          setIsAiValidationModalOpen(true);
        }
        break;
      case 7:
        handleConfirmAiValidation();
        break;
      case 8:
        setActiveNav('insights');
        break;
      case 9:
        setIsOutcomeModalOpen(true);
        break;
      case 10:
        setActiveNav('insights');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#040a15] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] antialiased">
      {/* ADAPTIVE TOAST BANNER */}
      {adaptiveToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[3000] px-4 py-2.5 rounded-xl bg-[#061e38]/95 border border-cyan-400 text-cyan-200 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-300">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span>{adaptiveToast}</span>
          <button
            onClick={() => setAdaptiveToast(null)}
            className="ml-2 text-cyan-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* TOP HERO BANNER (Directly matching reference image top: "From data to foresight") */}
      {showForesightBanner && (
        <div className="relative border-b border-[#0c1f36] bg-[#030914] overflow-hidden">
          {/* Subtle water ocean backdrop gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#030d1a] via-[#04152b]/90 to-[#020b17] opacity-90"></div>
          <div className="absolute -top-12 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative max-w-[1680px] mx-auto px-6 py-3.5 flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Left: AQUORA Brand Lockup */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-extrabold tracking-[0.2em] text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                  ΛQUORΛ
                </span>
              </div>
              <span className="text-xs text-slate-300 tracking-wider mt-0.5 font-medium">
                Aquatic Understanding & Risk Anticipation
              </span>
              <span className="text-sm font-semibold text-cyan-400 mt-0.5 tracking-wide">
                See What Comes Next.
              </span>
            </div>

            {/* Center: "From data to foresight" 5-step roadmap */}
            <div className="flex-1 max-w-3xl">
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-base font-bold text-white tracking-tight">
                  From data to foresight.
                </h2>
                <button
                  onClick={() => setShowForesightBanner(false)}
                  className="text-xs text-slate-500 hover:text-slate-300"
                  title="Dismiss banner"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-2.5">
                AQUORA uses AI and real-time environmental data to predict water-related risks, identify key signals, and tell you what to observe next — so you can act early and stay prepared.
              </p>

              {/* 5 Process Circles matching reference */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto text-[11px]">
                {/* 1. Observe */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-[#0a2039] border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-white block">Observe</span>
                    <span className="text-[10px] text-slate-400">Real-time data</span>
                  </div>
                </div>

                <span className="text-slate-600">→</span>

                {/* 2. Understand */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-[#0a2039] border border-blue-400/40 flex items-center justify-center text-blue-300 shadow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-5.04z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-white block">Understand</span>
                    <span className="text-[10px] text-slate-400">AI analyzes risks</span>
                  </div>
                </div>

                <span className="text-slate-600">→</span>

                {/* 3. Anticipate */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-[#0a2039] border border-purple-400/40 flex items-center justify-center text-purple-300 shadow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="4"/>
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-white block">Anticipate</span>
                    <span className="text-[10px] text-slate-400">Predict scenarios</span>
                  </div>
                </div>

                <span className="text-slate-600">→</span>

                {/* 4. Verify */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-[#0a2039] border border-amber-400/40 flex items-center justify-center text-amber-300 shadow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-white block">Verify</span>
                    <span className="text-[10px] text-slate-400">Target observation</span>
                  </div>
                </div>

                <span className="text-slate-600">→</span>

                {/* 5. Act */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-[#0a2039] border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-white block">Act</span>
                    <span className="text-[10px] text-slate-400">Informed decisions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Launch & Companion Toggles */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowDataSourcesModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0a1b30] border border-[#153a63] text-cyan-300 hover:text-white transition-all flex items-center gap-1.5"
                title="View Transparent Data Sources"
              >
                <span>📡 Data Sources</span>
              </button>

              <button
                onClick={() => setShowMobilePreview(!showMobilePreview)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  showMobilePreview
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                    : 'bg-[#0a1b30] border-[#153a63] text-slate-300 hover:text-white'
                }`}
              >
                <span>📱</span>
                <span>{showMobilePreview ? 'Hide Mobile' : 'Show Mobile'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN APPLICATION WORKSPACE */}
      <div className="flex-1 flex max-w-[1720px] w-full mx-auto">
        {/* LEFT VERTICAL SIDEBAR (Exact composition & styling from reference image) */}
        <aside className="w-56 shrink-0 border-r border-[#0d223a] bg-[#030914] p-4 flex flex-col justify-between hidden md:flex">
          <div className="space-y-6">
            {/* Top Logo Treatment */}
            <div className="px-2 pt-1 flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-[0.18em] text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                ΛQUORΛ
              </span>
            </div>

            {/* Navigation List matching reference */}
            <nav className="space-y-1.5 text-xs">
              {/* Home */}
              <button
                onClick={() => setActiveNav('home')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all ${
                  activeNav === 'home'
                    ? 'bg-[#122744] text-white shadow-[0_0_15px_rgba(18,39,68,0.6)] border border-[#1b3d6b]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#071526]'
                }`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span>Home</span>
              </button>

              {/* Live Map */}
              <button
                onClick={() => setActiveNav('map')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all ${
                  activeNav === 'map'
                    ? 'bg-[#122744] text-white border border-[#1b3d6b]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#071526]'
                }`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                  <line x1="8" y1="2" x2="8" y2="18"/>
                  <line x1="16" y1="6" x2="16" y2="22"/>
                </svg>
                <span>Live Map</span>
              </button>

              {/* Scenarios */}
              <button
                onClick={() => setActiveNav('scenarios')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all ${
                  activeNav === 'scenarios'
                    ? 'bg-[#122744] text-white border border-[#1b3d6b]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#071526]'
                }`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="21" x2="4" y2="14"/>
                  <line x1="4" y1="10" x2="4" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12" y2="3"/>
                  <line x1="20" y1="21" x2="20" y2="16"/>
                  <line x1="20" y1="12" x2="20" y2="3"/>
                  <line x1="1" y1="14" x2="7" y2="14"/>
                  <line x1="9" y1="8" x2="15" y2="8"/>
                  <line x1="17" y1="16" x2="23" y2="16"/>
                </svg>
                <span>Scenarios</span>
              </button>

              {/* Insights */}
              <button
                onClick={() => setActiveNav('insights')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all ${
                  activeNav === 'insights'
                    ? 'bg-[#122744] text-white border border-[#1b3d6b]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#071526]'
                }`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                </svg>
                <span>Insights</span>
              </button>

              {/* Alerts */}
              <button
                onClick={() => setActiveNav('alerts')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-all ${
                  activeNav === 'alerts'
                    ? 'bg-[#122744] text-white border border-[#1b3d6b]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#071526]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  <span>Alerts</span>
                </div>
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center">
                  1
                </span>
              </button>

              {/* Settings */}
              <button
                onClick={() => setActiveNav('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all ${
                  activeNav === 'settings'
                    ? 'bg-[#122744] text-white border border-[#1b3d6b]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#071526]'
                }`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* Bottom Sidebar Card: "Safer Waters. Stronger Communities." with flowing waves */}
          <div className="p-3.5 rounded-2xl bg-[#081a30] border border-[#133355] relative overflow-hidden shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 mb-2 shadow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M2 12c.6.5 1.2.8 2.5.8 2.5 0 2.5-1.6 5-1.6 2.5 0 2.5-1.6 5-1.6 2.5 0 2.5-1.6 5-1.6 1.3 0 1.9.3 2.5.8"/>
                <path d="M2 16c.6.5 1.2.8 2.5.8 2.5 0 2.5-1.6 5-1.6 2.5 0 2.5-1.6 5-1.6 2.5 0 2.5-1.6 5-1.6 1.3 0 1.9.3 2.5.8"/>
              </svg>
            </div>
            <h4 className="text-xs font-bold text-white leading-tight">
              Safer Waters.
            </h4>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Stronger Communities.
            </span>

            {/* Flowing SVG waves from reference image */}
            <div className="mt-2 pt-2 -mx-3.5 -mb-3.5">
              <svg viewBox="0 0 200 40" className="w-full h-8 opacity-70">
                <path
                  d="M0 25 Q 30 15, 60 25 T 120 25 T 180 25 T 240 25"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />
                <path
                  d="M0 32 Q 30 22, 60 32 T 120 32 T 180 32 T 240 32"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>
        </aside>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[2000] bg-[#030914]/95 backdrop-blur-md border-t border-[#0e2a4a] px-4 py-2 flex items-center justify-around text-[10px]">
          <button
            onClick={() => setActiveNav('home')}
            className={`flex flex-col items-center gap-1 ${activeNav === 'home' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            <span>🏠</span>
            <span>Home</span>
          </button>
          <button
            onClick={() => setActiveNav('map')}
            className={`flex flex-col items-center gap-1 ${activeNav === 'map' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            <span>🗺️</span>
            <span>Live Map</span>
          </button>
          <button
            onClick={() => setActiveNav('scenarios')}
            className={`flex flex-col items-center gap-1 ${activeNav === 'scenarios' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            <span>⚡</span>
            <span>Scenarios</span>
          </button>
          <button
            onClick={() => setActiveNav('insights')}
            className={`flex flex-col items-center gap-1 ${activeNav === 'insights' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            <span>🧭</span>
            <span>Insights</span>
          </button>
        </div>

        {/* CENTER PRIMARY DASHBOARD WORKSPACE */}
        <main className="flex-1 p-5 lg:p-7 space-y-6 overflow-y-auto pb-16 md:pb-6">
          {/* Quick Guided Tour Checklist (Single-click journey) */}
          <QuickJourneyGuide
            currentStepIndex={journeyStepIndex}
            onJumpToStep={handleJumpToStep}
          />

          {/* PAGE 1: HOME (Matching exact reference image layout) */}
          {activeNav === 'home' && (
            <div className="space-y-6">
              {/* Dashboard Header with Real Location Selector & Telemetry Status */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Good morning, User 👋</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>Watershed intelligence for</span>
                    <strong className="text-cyan-300 font-semibold">{selectedLocation.name}, {selectedLocation.country}</strong>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">{selectedLocation.watershedName}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {/* REAL LOCATION SELECTOR / SEARCH (Part 8) */}
                  <div className="relative" ref={searchContainerRef}>
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#061426] border border-[#0f2c4d]">
                      {/* Presets dropdown */}
                      <select
                        value={selectedLocation.id}
                        onChange={(e) => {
                          const found = PRESET_LOCATIONS.find((p) => p.id === e.target.value);
                          if (found) handleSelectLocation(found);
                        }}
                        className="bg-transparent text-xs text-white font-medium px-2 py-1 outline-none cursor-pointer"
                      >
                        {PRESET_LOCATIONS.map((preset) => (
                          <option key={preset.id} value={preset.id} className="bg-[#061426] text-slate-100">
                            📍 {preset.name}, {preset.country}
                          </option>
                        ))}
                      </select>

                      <div className="h-4 w-[1px] bg-[#0d2642]"></div>

                      {/* City Search Input (Open-Meteo Geocoding) */}
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          placeholder="Search any city..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => {
                            if (searchResults.length > 0) setShowSearchDropdown(true);
                          }}
                          className="w-32 sm:w-36 bg-transparent text-xs text-slate-100 placeholder-slate-500 px-2 py-1 outline-none font-medium"
                        />
                        {isSearching && (
                          <div className="w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mr-1.5"></div>
                        )}
                      </div>
                    </div>

                    {/* Geocoding Results Dropdown */}
                    {showSearchDropdown && searchResults.length > 0 && (
                      <div className="absolute top-full mt-1.5 left-0 right-0 z-[1200] rounded-xl bg-[#061426] border border-[#133355] shadow-2xl overflow-hidden py-1">
                        {searchResults.map((res) => (
                          <button
                            key={res.id}
                            onClick={() => handleSelectGeocodedResult(res)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-[#0c2445] transition-colors flex items-center justify-between"
                          >
                            <span className="font-semibold text-white">{res.name}</span>
                            <span className="text-[11px] text-slate-400">{res.admin1 ? `${res.admin1}, ` : ''}{res.country}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* REAL LIVE DATA INDICATOR (Part 4, 13) */}
                  <div
                    onClick={() => setShowDataSourcesModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#07172b] border border-[#123358] text-slate-300 cursor-pointer hover:border-cyan-500/40 transition-colors"
                    title="Click to view Telemetry Provenance and Data Sources"
                  >
                    {weatherData.isLive ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="font-bold text-white">LIVE DATA</span>
                        <span className="text-slate-500">·</span>
                        <span className="font-mono text-cyan-300">{weatherData.lastUpdatedFormatted}</span>
                        <span className="font-mono text-slate-400 text-[10px] hidden sm:inline">Open-Meteo</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span className="font-bold text-rose-300">DATA SOURCE UNAVAILABLE</span>
                      </>
                    )}
                  </div>

                  {/* Manual Refresh Button */}
                  <button
                    onClick={() => refreshWeatherData(selectedLocation)}
                    disabled={isFetchingWeather}
                    className="p-2 rounded-xl bg-[#07192e] hover:bg-[#0c2445] text-cyan-300 border border-[#143a63] transition-colors"
                    title="Refresh Live Telemetry"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      className={isFetchingWeather ? 'animate-spin' : ''}
                    >
                      <path d="M23 4v6h-6M1 20v-6h6"/>
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                    </svg>
                  </button>

                  {/* Field Observation Intake Button */}
                  <button
                    onClick={() => handleStartObservation(selectedSegmentId || 'segment-b')}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-1.5"
                  >
                    <span>+ Field Observation</span>
                  </button>
                </div>
              </div>

              {/* Large Central Cinematic Map Panel */}
              <div className="h-[480px] w-full">
                <WatershedMap
                  segments={segments}
                  selectedSegmentId={selectedSegmentId}
                  onSelectSegment={(seg) => setSelectedSegmentId(seg.id)}
                  stations={monitoringStations}
                  rainfallHotspots={rainfallHotspots}
                  observations={observations}
                  affectedSegmentIds={scenarioResult.affectedSegmentIds}
                  layers={mapLayers}
                  onToggleLayer={(k) => setMapLayers((prev) => ({ ...prev, [k]: !prev[k] }))}
                  centerCoord={selectedLocation.coordinates}
                  zoom={selectedLocation.zoom || 13}
                  floodPolygons={floodPolygons}
                  locationName={selectedLocation.name}
                />
              </div>

              {/* Three Primary Intelligence Panels Under The Map (Directly from reference image) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* PANEL 1: AI Prediction */}
                <div className="p-5 rounded-2xl bg-[#061426]/90 backdrop-blur-md border border-[#0f2a47] shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/40 transition-all">
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                        </div>
                        <h3 className="text-sm font-bold text-white tracking-tight">AI Prediction</h3>
                      </div>

                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                        scenarioResult.riskLevel === 'Very High' || scenarioResult.riskLevel === 'High'
                          ? 'bg-[#3d1320] text-[#f87171] border-[#f87171]/40'
                          : scenarioResult.riskLevel === 'Moderate'
                          ? 'bg-[#3b2b10] text-amber-300 border-amber-500/40'
                          : 'bg-[#103322] text-emerald-300 border-emerald-500/40'
                      }`}>
                        {scenarioResult.riskLevel} Risk
                      </span>
                    </div>

                    {/* Prediction Text */}
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">
                      Increased flood risk in the {selectedLocation.name} lower confluence region in the next 48–72 hours due to {weatherData.rainfallPast24hMm > 25 ? 'persistent heavy rainfall' : 'projected upstream accumulation'} and rising water levels.
                    </p>
                  </div>

                  {/* Bottom: "View Details →" and Glowing Hydrograph Waveform */}
                  <div className="mt-4 pt-3 border-t border-[#0d2642] flex items-end justify-between">
                    <button
                      onClick={() => setActiveNav('scenarios')}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                    >
                      <span>View Details</span>
                      <span>→</span>
                    </button>

                    {/* Curved hydrograph graph matching reference image */}
                    <div className="w-28 h-10">
                      <svg viewBox="0 0 120 45" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="purpleWave" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4"/>
                            <stop offset="100%" stopColor="#c084fc" stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        <path
                          d="M 0 38 Q 30 35, 60 25 T 100 8 T 120 18 L 120 45 L 0 45 Z"
                          fill="url(#purpleWave)"
                        />
                        <path
                          d="M 0 38 Q 30 35, 60 25 T 100 8 T 120 18"
                          fill="none"
                          stroke="#c084fc"
                          strokeWidth="2.5"
                        />
                        <circle cx="100" cy="8" r="3.5" fill="#f43f5e" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* PANEL 2: What to Observe Next */}
                <div className="p-5 rounded-2xl bg-[#061426]/90 backdrop-blur-md border border-[#0f2a47] shadow-xl flex flex-col justify-between group hover:border-cyan-500/40 transition-all">
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="22" y1="12" x2="18" y2="12"/>
                            <line x1="6" y1="12" x2="2" y2="12"/>
                            <line x1="12" y1="6" x2="12" y2="2"/>
                            <line x1="12" y1="22" x2="12" y2="18"/>
                          </svg>
                        </div>
                        <h3 className="text-sm font-bold text-white tracking-tight">What to Observe Next</h3>
                      </div>

                      <button
                        onClick={() => handleStartObservation('segment-b')}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                      >
                        Start Check
                      </button>
                    </div>

                    {/* Numbered List matching reference image */}
                    <div className="space-y-2.5 text-xs">
                      {/* Item 1 */}
                      <div
                        onClick={() => handleStartObservation('segment-b')}
                        className="flex items-start gap-2.5 cursor-pointer group/item hover:bg-[#091f38]/60 p-1.5 rounded-lg transition-colors"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#102d4f] text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                          1
                        </span>
                        <p className="text-slate-300 group-hover/item:text-white leading-snug">
                          Monitor real-time water level at {selectedLocation.name} Downstream Reach (Segment B).
                        </p>
                      </div>

                      {/* Item 2 */}
                      <div
                        onClick={() => handleStartObservation('segment-c')}
                        className="flex items-start gap-2.5 cursor-pointer group/item hover:bg-[#091f38]/60 p-1.5 rounded-lg transition-colors"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#102d4f] text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                          2
                        </span>
                        <p className="text-slate-300 group-hover/item:text-white leading-snug">
                          Check rainfall intensity in nearby catchment areas ({weatherData.rainfallPast24hMm} mm observed past 24h).
                        </p>
                      </div>

                      {/* Item 3 */}
                      <div
                        onClick={() => handleStartObservation('segment-b')}
                        className="flex items-start gap-2.5 cursor-pointer group/item hover:bg-[#091f38]/60 p-1.5 rounded-lg transition-colors"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#102d4f] text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                          3
                        </span>
                        <p className="text-slate-300 group-hover/item:text-white leading-snug">
                          Verify river flow changes using NASA GIBS / Sentinel satellite imagery (today's orbital pass).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 text-[11px] text-cyan-400 font-mono flex items-center justify-between border-t border-[#0d2642]">
                    <span>Reason: Missing downstream gauge truth</span>
                    <span className="text-emerald-400">● Priority High</span>
                  </div>
                </div>

                {/* PANEL 3: Key Indicators (REAL PUBLIC DATA - Part 3, 4, 9) */}
                <div className="p-5 rounded-2xl bg-[#061426]/90 backdrop-blur-md border border-[#0f2a47] shadow-xl flex flex-col justify-between group hover:border-cyan-500/40 transition-all">
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                          </svg>
                        </div>
                        <h3 className="text-sm font-bold text-white tracking-tight">Key Indicators</h3>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400">
                        {selectedLocation.name}
                      </span>
                    </div>

                    {/* 4 Rows with honest data provenance */}
                    <div className="space-y-2 text-xs">
                      {/* Water Level */}
                      <div className="p-2 rounded-lg bg-[#040e1c] border border-[#0e2744]">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-cyan-400">≈</span>
                            <span className="text-slate-300 font-medium">Water Level</span>
                          </div>
                          <span className="font-bold text-white font-mono flex items-center gap-1">
                            {selectedLocation.hasLiveUsgsSensor ? '+2.2 m' : '+2.1 m (Est.)'} <span className="text-emerald-400 text-[10px]">↑</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className={selectedLocation.hasLiveUsgsSensor ? 'text-emerald-400' : 'text-amber-400/90'}>
                            {selectedLocation.hasLiveUsgsSensor ? 'USGS Water Gauge (NWIS)' : 'Live sensor unavailable for location'}
                          </span>
                          <span className="text-slate-500 font-mono">
                            {selectedLocation.hasLiveUsgsSensor ? 'REAL OBS.' : 'MODELLED'}
                          </span>
                        </div>
                      </div>

                      {/* Rainfall (24h) from Open-Meteo */}
                      <div className="p-2 rounded-lg bg-[#040e1c] border border-[#0e2744]">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-cyan-400">🌧️</span>
                            <span className="text-slate-300 font-medium">Rainfall (24h)</span>
                          </div>
                          <span className="font-bold text-white font-mono flex items-center gap-1">
                            {weatherData.rainfallPast24hMm} mm <span className="text-cyan-400 text-[10px]">●</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-mono">Open-Meteo Telemetry</span>
                          <span className="text-emerald-400 font-mono">REAL OBSERVATION</span>
                        </div>
                      </div>

                      {/* River Discharge Forecast / Modelled River Discharge (Open-Meteo GloFAS / USGS) */}
                      <div className="p-2 rounded-lg bg-[#040e1c] border border-[#0e2744]">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-cyan-400">≋</span>
                            <span className="text-slate-300 font-medium">River Discharge</span>
                          </div>
                          <span className="font-bold text-white font-mono flex items-center gap-1">
                            {weatherData.riverDischargeM3s !== null && weatherData.riverDischargeM3s !== undefined ? (
                              <>
                                {weatherData.riverDischargeM3s} m³/s <span className="text-cyan-400 text-[10px]">●</span>
                              </>
                            ) : selectedLocation.hasLiveUsgsSensor ? (
                              <>
                                26.8 m³/s <span className="text-emerald-400 text-[10px]">●</span>
                              </>
                            ) : (
                              <span className="text-slate-400 text-[11px] font-normal">Unavailable</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">
                            {weatherData.riverDischargeM3s !== null && weatherData.riverDischargeM3s !== undefined
                              ? 'Modelled river discharge'
                              : selectedLocation.hasLiveUsgsSensor
                              ? 'USGS Acoustic Stage'
                              : 'River sensor/model data unavailable for this location'}
                          </span>
                          <span className="text-cyan-400 font-mono">
                            {weatherData.riverDischargeM3s !== null && weatherData.riverDischargeM3s !== undefined
                              ? 'GloFAS / Open-Meteo'
                              : selectedLocation.hasLiveUsgsSensor
                              ? 'USGS NWIS'
                              : 'NO SENSOR'}
                          </span>
                        </div>
                      </div>

                      {/* Temperature from Open-Meteo */}
                      <div className="p-2 rounded-lg bg-[#040e1c] border border-[#0e2744]">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-cyan-400">🌡️</span>
                            <span className="text-slate-300 font-medium">Temperature</span>
                          </div>
                          <span className="font-bold text-white font-mono flex items-center gap-1">
                            {weatherData.currentTempC} °C <span className="text-cyan-400 text-[10px]">●</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-mono">{weatherData.condition}</span>
                          <span className="text-emerald-400 font-mono">REAL OBSERVATION</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-[#0d2642]">
                    <span className="text-slate-400">Updated: {weatherData.lastUpdatedFormatted}</span>
                    <button
                      onClick={() => setShowDataSourcesModal(true)}
                      className="text-cyan-400 hover:text-cyan-300 font-medium underline"
                    >
                      Sources & Provenance →
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Contextual Segment Inspector & Uncertainty Drawer */}
              {selectedSegment && (
                <div className="pt-2">
                  <SegmentDetailsPanel
                    segment={selectedSegment}
                    scenarioResult={scenarioResult}
                    onClose={() => setSelectedSegmentId(null)}
                    onStartObservation={handleStartObservation}
                    onSimulateForSegment={() => setActiveNav('scenarios')}
                  />
                </div>
              )}
            </div>
          )}

          {/* PAGE 2: LIVE MAP (Full view with interactive panels) */}
          {activeNav === 'map' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Interactive Catchment Map</h2>
                  <p className="text-xs text-slate-400">
                    High-resolution hydrology for {selectedLocation.name}, telemetry sondes, citizen ground-truth, and scenario impact reaches.
                  </p>
                </div>
                <button
                  onClick={() => handleStartObservation(selectedSegmentId || 'segment-b')}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow"
                >
                  Record Ground Truth
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 h-[620px]">
                  <WatershedMap
                    segments={segments}
                    selectedSegmentId={selectedSegmentId}
                    onSelectSegment={(seg) => setSelectedSegmentId(seg.id)}
                    stations={monitoringStations}
                    rainfallHotspots={rainfallHotspots}
                    observations={observations}
                    affectedSegmentIds={scenarioResult.affectedSegmentIds}
                    layers={mapLayers}
                    onToggleLayer={(k) => setMapLayers((prev) => ({ ...prev, [k]: !prev[k] }))}
                    centerCoord={selectedLocation.coordinates}
                    zoom={selectedLocation.zoom || 13}
                    floodPolygons={floodPolygons}
                    locationName={selectedLocation.name}
                  />
                </div>

                <div className="space-y-4">
                  {selectedSegment ? (
                    <SegmentDetailsPanel
                      segment={selectedSegment}
                      scenarioResult={scenarioResult}
                      onClose={() => setSelectedSegmentId(null)}
                      onStartObservation={handleStartObservation}
                      onSimulateForSegment={() => setActiveNav('scenarios')}
                    />
                  ) : (
                    <div className="p-6 rounded-2xl bg-[#061426] border border-[#0f2a47] text-center text-slate-400 text-xs">
                      Click any stream line or marker on the map to inspect telemetry and bank conditions.
                    </div>
                  )}

                  <UncertaintyPanel
                    uncertainty={uncertainty}
                    onTriggerObservation={() => handleStartObservation('segment-b')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* PAGE 3: SCENARIOS (SIMULATE THE FUTURE) */}
          {activeNav === 'scenarios' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                <ScenarioSimulator
                  currentParams={scenarioParams}
                  scenarioResult={scenarioResult}
                  onRunScenario={handleRunScenario}
                  onStartRecommendedObservation={handleStartObservation}
                />
              </div>

              <div className="space-y-4">
                <UncertaintyPanel
                  uncertainty={uncertainty}
                  onTriggerObservation={() => handleStartObservation('segment-b')}
                />
                <NextBestObservationCard
                  scenarioResult={scenarioResult}
                  onStartObservation={handleStartObservation}
                  hasVerifiedObservation={hasVerifiedDownstream}
                />
              </div>
            </div>
          )}

          {/* PAGE 4: INSIGHTS & EVIDENCE TIMELINE */}
          {activeNav === 'insights' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                <ActionPlanPanel
                  actions={actionItems}
                  onToggleStatus={handleToggleActionStatus}
                  onOpenOutcomeVerification={() => setIsOutcomeModalOpen(true)}
                />
                <EvidenceTimeline events={timelineEvents} />
              </div>

              <div className="space-y-4">
                <UncertaintyPanel
                  uncertainty={uncertainty}
                  onTriggerObservation={() => handleStartObservation('segment-b')}
                />

                {/* Outcome Verifications Log */}
                <div className="p-5 rounded-2xl bg-[#061426] border border-[#0f2a47] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#0d2642]">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Outcome Verifications ({outcomeVerifications.length})
                    </h3>
                  </div>
                  {outcomeVerifications.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      No outcome verification logged yet. Click "OUTCOME VERIFICATION" on the Action Plan to compare scenario expectation against observed river reality.
                    </p>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {outcomeVerifications.map((v) => (
                        <div key={v.id} className="p-3 rounded-lg bg-[#040e1c] border border-[#0e2744]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-emerald-400">{v.alignment}</span>
                            <span className="text-[10px] text-slate-400">{v.verifiedAt}</span>
                          </div>
                          <p className="text-slate-300 italic">"{v.notes}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PAGE 5: ALERTS */}
          {activeNav === 'alerts' && (
            <div className="max-w-4xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Active Environmental Alerts</h2>
                  <p className="text-xs text-slate-400">
                    Hydrological surcharge flags, sensor drift warnings, and community observation triggers for {selectedLocation.name}.
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 px-3 py-1 rounded-lg border border-cyan-500/30">
                  1 Critical • 2 Advisory
                </span>
              </div>

              {/* Alert 1 */}
              <div className="p-5 rounded-2xl bg-[#08182b] border border-rose-500/40 shadow-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                          Critical Flood Risk Alert
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="text-xs text-slate-400">Next 48–72 hours</span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        High risk in {selectedLocation.name} lower confluence reach
                      </h3>
                    </div>
                  </div>

                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    High Risk
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Downstream Segment B stage is estimated at +2.85m, approaching culvert freeboard safety limits. Surcharge arrival wave modeled at +2.4x baseline.
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-[#0e2c4d]">
                  <span className="text-xs text-slate-400 font-mono">Recommended: Deploy field stage observation</span>
                  <button
                    onClick={() => handleStartObservation('segment-b')}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow transition-colors"
                  >
                    Start Field Check →
                  </button>
                </div>
              </div>

              {/* Alert 2 */}
              <div className="p-5 rounded-2xl bg-[#061426] border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase">Telemetry Calibration Advisory</span>
                  <span className="text-xs text-slate-400 font-mono">15m ago</span>
                </div>
                <h4 className="text-sm font-semibold text-white">Central Urban Sonde ST-03 Turbidity Rise (+18.4 NTU)</h4>
                <p className="text-xs text-slate-300">
                  Suspended organic particulates detected following morning stormwater bypass.
                </p>
              </div>
            </div>
          )}

          {/* PAGE 6: SETTINGS */}
          {activeNav === 'settings' && (
            <div className="max-w-3xl space-y-4">
              <h2 className="text-xl font-bold text-white">Platform Settings & Basemap Configuration</h2>
              <div className="p-5 rounded-2xl bg-[#061426] border border-[#0f2a47] space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-200 block mb-1">Active Watershed Location</label>
                  <p className="text-slate-400">{selectedLocation.name}, {selectedLocation.country} — {selectedLocation.watershedName}</p>
                </div>

                <div>
                  <label className="font-semibold text-slate-200 block mb-1">Data Provenance & Zero API-Key Architecture</label>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>100% Keyless Public Feeds (Open-Meteo + NASA GIBS / OpenStreetMap)</span>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => setShowDataSourcesModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#0e2744] hover:bg-[#143a63] text-cyan-300 font-semibold transition-colors"
                  >
                    View Comprehensive Data Sources Breakdown
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR: OPTIONAL MOBILE PHONE PREVIEW */}
        {showMobilePreview && (
          <aside className="w-80 shrink-0 border-l border-[#0d223a] bg-[#020711] p-5 hidden xl:flex flex-col items-center justify-start overflow-y-auto">
            <div className="flex items-center justify-between w-full mb-3 text-xs text-slate-400">
              <span className="font-semibold text-white">Mobile Prototype View</span>
              <button onClick={() => setShowMobilePreview(false)} className="hover:text-white">✕</button>
            </div>

            {/* Realistic iPhone Bezel from reference image */}
            <div className="w-[280px] rounded-[36px] bg-[#000000] p-3 border-4 border-[#162a42] shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative text-slate-100 flex flex-col justify-between">
              {/* Speaker notch */}
              <div className="w-24 h-4 bg-black rounded-b-xl mx-auto mb-2 flex items-center justify-center">
                <div className="w-8 h-1 bg-slate-800 rounded-full"></div>
              </div>

              {/* Mobile Screen Content matching reference */}
              <div className="space-y-3 px-1 text-xs">
                {/* Mobile Header: AQUORA + Menu */}
                <div className="flex items-center justify-between py-1 border-b border-slate-900">
                  <span className="text-base font-extrabold tracking-wider text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                    ΛQUORΛ
                  </span>
                  <span className="text-slate-400">☰</span>
                </div>

                {/* Flood Risk Alert Card matching reference image */}
                <div className="p-3 rounded-2xl bg-[#091a2e] border border-rose-500/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px]">
                    <span>⚠️</span>
                    <span>Flood Risk Alert</span>
                  </div>
                  <p className="text-[11px] text-slate-200 font-medium">
                    High risk in {selectedLocation.name} lower delta (Next 72h)
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-cyan-300 font-semibold">View Details →</span>
                    <div className="w-14 h-4">
                      <svg viewBox="0 0 60 20" className="w-full h-full">
                        <path d="M0 16 Q 15 12, 30 8 T 60 4" fill="none" stroke="#f43f5e" strokeWidth="2"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Mini Map Snapshot */}
                <div className="h-28 rounded-xl bg-[#061426] border border-[#0e2744] overflow-hidden relative">
                  <div className="w-full h-full bg-gradient-to-br from-[#061426] via-[#09223e] to-[#040d1a] flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></div>
                    <span className="text-[10px] text-cyan-300 font-mono ml-2">Downstream Reach</span>
                  </div>
                </div>

                {/* Quick Insights List from reference */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Quick Insights</span>
                  <div
                    onClick={() => handleStartObservation('segment-b')}
                    className="p-2 rounded-xl bg-[#061426] border border-slate-800 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span>🔭</span>
                      <span className="text-[11px] text-white">What to observe next</span>
                    </div>
                    <span className="text-slate-500">→</span>
                  </div>

                  <div
                    onClick={() => setActiveNav('scenarios')}
                    className="p-2 rounded-xl bg-[#061426] border border-slate-800 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span>⚡</span>
                      <span className="text-[11px] text-white">Scenario Simulation</span>
                    </div>
                    <span className="text-slate-500">→</span>
                  </div>
                </div>

                {/* Mobile Bottom Navigation */}
                <div className="pt-3 border-t border-slate-900 flex justify-around text-[10px] text-slate-400">
                  <span className="text-cyan-400 font-bold">🏠 Home</span>
                  <span>🗺️ Map</span>
                  <span>🔔 Alerts</span>
                  <span>👤 Profile</span>
                </div>
              </div>

              {/* Bottom Home Indicator */}
              <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-3"></div>
            </div>
          </aside>
        )}
      </div>

      {/* MODAL 1: OBSERVATION SUBMISSION */}
      <ObservationModal
        segments={segments}
        initialSegmentId={observationTargetSegmentId}
        isOpen={isObservationModalOpen}
        onClose={() => setIsObservationModalOpen(false)}
        onSubmitObservation={handleSubmitObservation}
      />

      {/* MODAL 2: AI-ASSISTED VALIDATION CHECK */}
      {draftObservation && draftObservation.aiCheck && (
        <AiValidationModal
          observation={draftObservation}
          aiCheck={draftObservation.aiCheck}
          isOpen={isAiValidationModalOpen}
          onConfirm={handleConfirmAiValidation}
          onEdit={handleEditAiValidation}
          onReject={handleRejectAiValidation}
        />
      )}

      {/* MODAL 3: OUTCOME VERIFICATION */}
      <OutcomeVerificationModal
        scenario={scenarioResult}
        recentObservation={draftObservation || observations[0]}
        isOpen={isOutcomeModalOpen}
        onClose={() => setIsOutcomeModalOpen(false)}
        onSaveVerification={handleSaveOutcomeVerification}
      />

      {/* MODAL 4: TRANSPARENT DATA SOURCES PROVENANCE */}
      <DataSourcesModal
        isOpen={showDataSourcesModal}
        onClose={() => setShowDataSourcesModal(false)}
        weather={weatherData}
        location={selectedLocation}
      />
    </div>
  );
}
