import React from 'react';
import { StreamSegment, ScenarioResult } from '../types';

interface SegmentDetailsPanelProps {
  segment: StreamSegment;
  scenarioResult: ScenarioResult | null;
  onClose: () => void;
  onStartObservation: (segmentId: string) => void;
  onSimulateForSegment: (segment: StreamSegment) => void;
}

export const SegmentDetailsPanel: React.FC<SegmentDetailsPanelProps> = ({
  segment,
  scenarioResult,
  onClose,
  onStartObservation,
  onSimulateForSegment,
}) => {
  const isAffectedByScenario = scenarioResult?.affectedSegmentIds.includes(segment.id);
  const confidence = scenarioResult?.confidence ?? 72;

  return (
    <div className="rounded-2xl bg-[#061426]/95 backdrop-blur-md border border-[#0f2c4d] p-5 shadow-2xl text-slate-100 animate-in fade-in slide-in-from-bottom duration-200">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#0d2642]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">{segment.code}</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400 capitalize">{segment.type} Catchment Reach</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">{segment.name}</h3>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0a2039] transition-colors"
          title="Close details"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Scenario Sensitivity Banner if affected */}
      {isAffectedByScenario && (
        <div className="mt-3 p-3 rounded-xl bg-[#2e101a] border border-rose-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
            <span className="text-xs font-semibold text-rose-300">Scenario Sensitivity: Elevated Surcharge Stress</span>
          </div>
          <span className="text-xs font-mono text-rose-400 font-bold">Risk {segment.riskScore}/100</span>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="p-2.5 rounded-xl bg-[#040e1c] border border-[#0e2744]">
          <span className="text-[11px] text-slate-400 block mb-0.5">Rainfall</span>
          <span className="text-base font-bold text-cyan-300 font-mono tabular-nums">{segment.rainfallMm} mm</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#040e1c] border border-[#0e2744]">
          <span className="text-[11px] text-slate-400 block mb-0.5">Flow Condition</span>
          <span className={`text-sm font-bold ${segment.flowCondition === 'Elevated' || segment.flowCondition === 'Surge' ? 'text-amber-400' : 'text-emerald-400'}`}>
            {segment.flowCondition}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#040e1c] border border-[#0e2744]">
          <span className="text-[11px] text-slate-400 block mb-0.5">Temperature</span>
          <span className="text-base font-bold text-slate-200 font-mono tabular-nums">{segment.temperatureC}°C</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#040e1c] border border-[#0e2744]">
          <span className="text-[11px] text-slate-400 block mb-0.5">Last Observation</span>
          <span className="text-xs font-medium text-slate-300">{segment.lastObservation}</span>
        </div>
      </div>

      {/* Current Condition & Recent Observation */}
      <div className="space-y-3 text-xs">
        <div className="p-3 rounded-xl bg-[#040e1c] border border-[#0e2744]">
          <span className="text-slate-400 block font-semibold mb-1">Current Condition</span>
          <p className="text-slate-200 leading-relaxed">{segment.currentCondition}</p>
        </div>

        <div className="p-3 rounded-xl bg-[#040e1c] border border-[#0e2744]">
          <span className="text-slate-400 block font-semibold mb-1">Recent Observation</span>
          <p className="text-slate-300 leading-relaxed italic">{segment.recentObservation}</p>
        </div>

        {/* Evidence Gap */}
        <div className="p-3 rounded-xl bg-[#2b1b0b]/60 border border-amber-500/30">
          <div className="flex items-center gap-1.5 mb-1 text-amber-400 font-semibold">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Evidence Gap</span>
          </div>
          <p className="text-amber-200/90 leading-relaxed">{segment.evidenceGap}</p>
        </div>

        {/* Recommended Action */}
        <div className="p-3 rounded-xl bg-[#072442]/50 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-cyan-400 font-semibold">Recommended Action</span>
            <span className="text-cyan-300 font-mono text-[11px]">Confidence: {confidence}%</span>
          </div>
          <p className="text-cyan-100 font-medium leading-relaxed">{segment.recommendedAction}</p>
        </div>
      </div>

      {/* Interactive Actions CTA */}
      <div className="mt-4 pt-3 border-t border-[#0d2642] flex flex-wrap items-center gap-2">
        <button
          onClick={() => onStartObservation(segment.id)}
          className="flex-1 min-w-[150px] px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center justify-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span>Start Observation</span>
        </button>

        <button
          onClick={() => onSimulateForSegment(segment)}
          className="px-3.5 py-2.5 rounded-xl bg-[#0a1c30] hover:bg-[#0f2845] text-cyan-300 font-semibold text-xs border border-[#143a63] transition-colors flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span>Simulate Reach</span>
        </button>
      </div>
    </div>
  );
};
