import React from 'react';
import { UncertaintyState } from '../services/uncertaintyEngine';

interface UncertaintyPanelProps {
  uncertainty: UncertaintyState;
  onTriggerObservation?: () => void;
}

export const UncertaintyPanel: React.FC<UncertaintyPanelProps> = ({
  uncertainty,
  onTriggerObservation,
}) => {
  const getBadgeStyle = () => {
    switch (uncertainty.label) {
      case 'LOWER':
        return 'bg-[#0e3522] text-emerald-300 border-emerald-500/40';
      case 'MODERATE':
        return 'bg-[#3b2b10] text-amber-300 border-amber-500/40';
      case 'HIGH':
      case 'CRITICAL':
      default:
        return 'bg-[#3b1220] text-[#f87171] border-rose-500/40';
    }
  };

  const getProgressColor = () => {
    switch (uncertainty.label) {
      case 'LOWER':
        return 'bg-emerald-400';
      case 'MODERATE':
        return 'bg-amber-400';
      case 'HIGH':
      case 'CRITICAL':
      default:
        return 'bg-rose-500';
    }
  };

  return (
    <div className="rounded-2xl bg-[#061426]/95 backdrop-blur-md border border-[#0f2c4d] p-5 shadow-2xl text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#0d2642]">
        <div className="flex items-center gap-2">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
            Uncertainty State
          </span>
        </div>

        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getBadgeStyle()}`}>
          UNCERTAINTY: {uncertainty.label}
        </span>
      </div>

      {/* Uncertainty Gauge / Score */}
      <div className="my-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-300 font-medium">Catchment Variance Index</span>
          <span className="font-mono font-bold text-slate-100 tabular-nums">
            {uncertainty.score}% Uncertainty <span className="text-slate-600">·</span> {uncertainty.confidenceScore}% Confidence
          </span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-2.5 bg-[#030914] rounded-full overflow-hidden p-0.5 border border-[#0d2238]">
          <div
            className={`h-full rounded-full transition-all duration-700 ${getProgressColor()}`}
            style={{ width: `${uncertainty.score}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
          <span>0% Ground Truth</span>
          <span className="text-cyan-400 font-semibold">{uncertainty.historicalDelta}</span>
          <span>100% Variance</span>
        </div>
      </div>

      {/* Dynamic Reason Explanation */}
      <div className="p-3.5 rounded-xl bg-[#040e1c] border border-[#0e2744] text-xs space-y-2 mt-4">
        <div className="flex items-center justify-between text-slate-400">
          <span className="font-semibold text-slate-300">Active Uncertainty Driver</span>
          <span className="text-[11px] text-cyan-300 font-mono">{uncertainty.primaryDriver}</span>
        </div>
        <p className="text-slate-200 leading-relaxed italic">
          "{uncertainty.reason}"
        </p>
      </div>

      {/* Honest Evidence Confidence Breakdown (Part 11) */}
      <div className="mt-3.5 p-3 rounded-xl bg-[#030d1a] border border-[#0e2744] space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
          <span>Confidence Breakdown</span>
          <span className="text-white">{uncertainty.confidenceScore}% Aggregated</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-[#061426] border border-[#0d2238] flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Weather Telemetry</span>
            <span className="text-[11px] font-semibold text-emerald-400">High (Open-Meteo)</span>
          </div>
          <div className="p-2 rounded-lg bg-[#061426] border border-[#0d2238] flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Satellite Coverage</span>
            <span className="text-[11px] font-semibold text-cyan-300">Medium (NASA GIBS)</span>
          </div>
          <div className="p-2 rounded-lg bg-[#061426] border border-[#0d2238] flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Stream Gauges</span>
            <span className="text-[11px] font-semibold text-amber-300">
              {uncertainty.score < 30 ? 'Calibrated' : 'Limited / Modelled'}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-[#061426] border border-[#0d2238] flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Citizen Ground Truth</span>
            <span className="text-[11px] font-semibold text-cyan-400">
              {uncertainty.score < 30 ? 'Verified in Reach' : 'Pending Verification'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Prompt if Uncertainty is High */}
      {uncertainty.score > 40 && onTriggerObservation && (
        <div className="mt-4 pt-3 border-t border-[#0d2642] flex items-center justify-between">
          <span className="text-xs text-slate-300">
            Submit Downstream Observation to lower uncertainty
          </span>
          <button
            onClick={onTriggerObservation}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow"
          >
            Collect Evidence →
          </button>
        </div>
      )}
    </div>
  );
};
