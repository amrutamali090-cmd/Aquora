import React, { useState } from 'react';
import { ScenarioParams, ScenarioResult } from '../types';

interface ScenarioSimulatorProps {
  currentParams: ScenarioParams;
  scenarioResult: ScenarioResult;
  onRunScenario: (params: ScenarioParams) => void;
  onStartRecommendedObservation: (segmentId: string) => void;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  currentParams,
  scenarioResult,
  onRunScenario,
  onStartRecommendedObservation,
}) => {
  const [params, setParams] = useState<ScenarioParams>(currentParams);
  const [isSimulating, setIsSimulating] = useState(false);

  // Preset configurations
  const applyPreset = (preset: 'heavy_rain' | 'baseline' | 'flash_flood' | 'drought_heat') => {
    let next: ScenarioParams;
    switch (preset) {
      case 'heavy_rain':
        next = {
          rainfallMm: 70, // Matches exact prompt requirement: "CHANGE RAINFALL TO 70 MM"
          temperatureC: 22.4,
          vegetationCover: 'Moderate',
          upstreamDevelopment: 'High',
          flowCondition: 'Elevated',
        };
        break;
      case 'flash_flood':
        next = {
          rainfallMm: 105,
          temperatureC: 24,
          vegetationCover: 'Degraded',
          upstreamDevelopment: 'High',
          flowCondition: 'Flash Runoff',
        };
        break;
      case 'drought_heat':
        next = {
          rainfallMm: 12,
          temperatureC: 34,
          vegetationCover: 'Degraded',
          upstreamDevelopment: 'Moderate',
          flowCondition: 'Baseflow',
        };
        break;
      case 'baseline':
      default:
        next = {
          rainfallMm: 35,
          temperatureC: 19,
          vegetationCover: 'High',
          upstreamDevelopment: 'Low',
          flowCondition: 'Baseflow',
        };
        break;
    }
    setParams(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setTimeout(() => {
      onRunScenario(params);
      setIsSimulating(false);
    }, 280);
  };

  return (
    <div className="rounded-2xl bg-[#061426]/95 backdrop-blur-md border border-[#0f2c4d] p-6 shadow-2xl text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#0d2642] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-[11px] font-mono tracking-wider text-cyan-400 uppercase font-semibold">
              Predictive Environmental Foresight
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">SIMULATE THE FUTURE</h2>
        </div>

        {/* Quick Presets matching reference palette */}
        <div className="flex items-center gap-1.5 p-1 bg-[#040e1c] rounded-xl border border-[#0e2744] text-xs">
          <button
            type="button"
            onClick={() => applyPreset('heavy_rain')}
            className={`px-3 py-1 rounded-lg transition-all ${
              params.rainfallMm === 70
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Heavy Rain (70mm)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('flash_flood')}
            className={`px-3 py-1 rounded-lg transition-all ${
              params.rainfallMm > 90
                ? 'bg-rose-500 text-white font-bold shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Surge
          </button>
          <button
            type="button"
            onClick={() => applyPreset('baseline')}
            className={`px-3 py-1 rounded-lg transition-all ${
              params.rainfallMm < 40
                ? 'bg-[#122744] text-cyan-300 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Baseline
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rainfall Control */}
          <div className="p-3.5 rounded-xl bg-[#040e1c] border border-[#0e2744]">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="rainfall-slider" className="text-xs font-semibold text-slate-200">
                Rainfall Intensity
              </label>
              <span className="text-sm font-bold font-mono text-cyan-300 tabular-nums">
                {params.rainfallMm} mm
              </span>
            </div>
            <input
              id="rainfall-slider"
              type="range"
              min="10"
              max="120"
              step="1"
              value={params.rainfallMm}
              onChange={(e) => setParams({ ...params, rainfallMm: Number(e.target.value) })}
              className="w-full h-2 bg-[#0a1f36] rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>10 mm (Light)</span>
              <span>50 mm (Nominal)</span>
              <span className="text-rose-400">120 mm (Severe)</span>
            </div>
          </div>

          {/* Temperature Control */}
          <div className="p-3.5 rounded-xl bg-[#040e1c] border border-[#0e2744]">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="temp-slider" className="text-xs font-semibold text-slate-200">
                Ambient Air & Water Temperature
              </label>
              <span className="text-sm font-bold font-mono text-cyan-300 tabular-nums">
                {params.temperatureC}°C
              </span>
            </div>
            <input
              id="temp-slider"
              type="range"
              min="15"
              max="38"
              step="0.5"
              value={params.temperatureC}
              onChange={(e) => setParams({ ...params, temperatureC: Number(e.target.value) })}
              className="w-full h-2 bg-[#0a1f36] rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>15°C (Cool)</span>
              <span>25°C (Moderate)</span>
              <span className="text-amber-400">38°C (Extreme Heat)</span>
            </div>
          </div>

          {/* Vegetation Cover */}
          <div className="p-3.5 rounded-xl bg-[#040e1c] border border-[#0e2744]">
            <label className="text-xs font-semibold text-slate-200 block mb-2">
              Riparian Vegetation & Canopy Cover
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#030914] rounded-lg">
              {(['High', 'Moderate', 'Degraded'] as const).map((veg) => (
                <button
                  type="button"
                  key={veg}
                  onClick={() => setParams({ ...params, vegetationCover: veg })}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg transition-all ${
                    params.vegetationCover === veg
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {veg}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {params.vegetationCover === 'High'
                ? 'High canopy buffers runoff (-25% velocity)'
                : params.vegetationCover === 'Moderate'
                ? 'Standard urban buffer'
                : 'Degraded banks accelerate overland runoff (+45%)'}
            </span>
          </div>

          {/* Upstream Development */}
          <div className="p-3.5 rounded-xl bg-[#040e1c] border border-[#0e2744]">
            <label className="text-xs font-semibold text-slate-200 block mb-2">
              Upstream Impervious Development
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#030914] rounded-lg">
              {(['Low', 'Moderate', 'High'] as const).map((dev) => (
                <button
                  type="button"
                  key={dev}
                  onClick={() => setParams({ ...params, upstreamDevelopment: dev })}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg transition-all ${
                    params.upstreamDevelopment === dev
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {dev}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {params.upstreamDevelopment === 'High'
                ? 'Paved concrete surfaces funnel surge downstream'
                : params.upstreamDevelopment === 'Moderate'
                ? 'Mixed suburban catchment'
                : 'Natural permeable soils & green swales'}
            </span>
          </div>
        </div>

        {/* Flow Dynamic Selector */}
        <div className="p-3.5 rounded-xl bg-[#040e1c] border border-[#0e2744]">
          <label className="text-xs font-semibold text-slate-200 block mb-2">
            Baseline Flow Dynamic
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['Baseflow', 'Elevated', 'Storm Surge', 'Flash Runoff'] as const).map((flow) => (
              <button
                type="button"
                key={flow}
                onClick={() => setParams({ ...params, flowCondition: flow })}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center ${
                  params.flowCondition === flow
                    ? 'border-cyan-400 bg-[#0c2445] text-cyan-200 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                    : 'border-[#0e2744] bg-[#030914] text-slate-400 hover:border-[#143a63]'
                }`}
              >
                {flow}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Action Button: RUN SCENARIO */}
        <button
          type="submit"
          disabled={isSimulating}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          {isSimulating ? (
            <>
              <svg className="animate-spin h-5 w-5 text-slate-950" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>CALCULATING CATCHMENT HYDROLOGY...</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>RUN SCENARIO</span>
            </>
          )}
        </button>
      </form>

      {/* Scenario Output Card */}
      <div className="mt-6 pt-5 border-t border-[#0d2642] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
              MODELLED SCENARIO
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[11px] text-slate-400">Calculated at {scenarioResult.calculatedAt}</span>
          </div>

          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
              scenarioResult.riskLevel === 'Very High'
                ? 'bg-[#3b1220] text-[#f87171] border border-rose-500/40'
                : scenarioResult.riskLevel === 'High'
                ? 'bg-[#3d1912] text-orange-300 border border-orange-500/40'
                : scenarioResult.riskLevel === 'Moderate'
                ? 'bg-[#3b2b10] text-amber-300 border border-amber-500/40'
                : 'bg-[#103322] text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {scenarioResult.riskLevel} Potential Stress
          </span>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-[#040e1c] border border-[#0d2642] text-[11px] text-slate-400 flex items-center justify-between">
          <span>Input Baseline: <strong className="text-slate-200">Real Current Weather</strong> + <strong className="text-slate-200">Scenario Modulation</strong></span>
          <span className="text-cyan-400 font-mono">Simulated Projection</span>
        </div>

        {/* Indicators Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[#040e1c] border border-[#0e2744]">
            <span className="text-[11px] text-slate-400 block mb-0.5">Scenario Score</span>
            <span className="text-lg font-bold font-mono text-cyan-300 tabular-nums">
              {scenarioResult.scenarioScore} / 100
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#040e1c] border border-[#0e2744]">
            <span className="text-[11px] text-slate-400 block mb-0.5">Runoff Surge Factor</span>
            <span className="text-lg font-bold font-mono text-amber-400 tabular-nums">
              +{scenarioResult.runoffFactor}x
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#040e1c] border border-[#0e2744]">
            <span className="text-[11px] text-slate-400 block mb-0.5">Downstream Sensitivity</span>
            <span className="text-sm font-bold text-rose-400">
              {scenarioResult.downstreamSensitivity}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#040e1c] border border-[#0e2744]">
            <span className="text-[11px] text-slate-400 block mb-0.5">Affected Reaches</span>
            <span className="text-lg font-bold font-mono text-cyan-300 tabular-nums">
              {scenarioResult.affectedSegmentIds.length} Reach{scenarioResult.affectedSegmentIds.length > 1 ? 'es' : ''}
            </span>
          </div>
        </div>

        {/* AI Synthesis & Explanation */}
        <div className="p-4 rounded-xl bg-[#040e1c] border border-[#0e2744] space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2v-2h2zm0-4h-2V7h2z"/>
            </svg>
            <span>AI Environmental Foresight Assessment</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-normal">
            {scenarioResult.aiExplanation}
          </p>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-[#0d2642] flex items-center justify-between">
            <span>Model calibration confidence: <strong className="text-cyan-300 font-mono">{scenarioResult.confidence}%</strong></span>
            <span>Uncertainty score: <strong className="text-amber-400 font-mono">{scenarioResult.uncertaintyScore}%</strong></span>
          </div>
        </div>

        {/* Direct Verification Trigger */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#071f3a] to-[#0a294f] border border-[#143a63] flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-cyan-400 font-semibold uppercase tracking-wider block">
              Direct Verification Trigger
            </span>
            <span className="text-xs text-slate-200">
              {scenarioResult.recommendedObservation.locationName}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onStartRecommendedObservation(scenarioResult.recommendedObservation.segmentId)}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shrink-0 shadow"
          >
            Start Observation →
          </button>
        </div>
      </div>
    </div>
  );
};
