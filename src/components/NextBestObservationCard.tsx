import React from 'react';
import { ScenarioResult } from '../types';

interface NextBestObservationCardProps {
  scenarioResult: ScenarioResult;
  onStartObservation: (segmentId: string) => void;
  hasVerifiedObservation: boolean;
}

export const NextBestObservationCard: React.FC<NextBestObservationCardProps> = ({
  scenarioResult,
  onStartObservation,
  hasVerifiedObservation,
}) => {
  const { recommendedObservation } = scenarioResult;

  return (
    <div className="rounded-2xl bg-[#061426]/95 backdrop-blur-md border border-[#0f2c4d] p-5 shadow-2xl text-slate-100 relative overflow-hidden">
      {/* Decorative subtle background wave effect */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#0d2642] relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#0c2445] text-cyan-400 border border-cyan-400/30">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="22" y1="12" x2="18" y2="12" />
              <line x1="6" y1="12" x2="2" y2="12" />
              <line x1="12" y1="6" x2="12" y2="2" />
              <line x1="12" y1="22" x2="12" y2="18" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider text-cyan-400 uppercase font-semibold block">
              Targeted Sensing
            </span>
            <h3 className="text-sm font-bold text-white tracking-tight">
              NEXT BEST OBSERVATION
            </h3>
          </div>
        </div>

        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
            hasVerifiedObservation
              ? 'bg-[#0e3522] text-emerald-300 border-emerald-500/40'
              : 'bg-[#3b1220] text-[#f87171] border-rose-500/40'
          }`}
        >
          {hasVerifiedObservation ? 'VERIFIED METRIC LOGGED' : `${recommendedObservation.urgency} Priority`}
        </span>
      </div>

      {/* Details Grid */}
      <div className="space-y-3 relative z-10 text-xs">
        <div className="p-3 rounded-xl bg-[#040e1c] border border-[#0e2744] flex items-start justify-between gap-4">
          <div>
            <span className="text-slate-400 block text-[11px] mb-0.5">Target Location</span>
            <span className="text-sm font-bold text-white block">
              {recommendedObservation.locationName}
            </span>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-[#082240] px-2 py-1 rounded-lg border border-cyan-500/20">
            SEGMENT B
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#040e1c] border border-[#0e2744]">
          <span className="text-slate-400 block text-[11px] mb-0.5">Recommended Field Check</span>
          <span className="text-xs font-semibold text-cyan-200 block">
            {recommendedObservation.observationType}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#2e1d0d]/60 border border-amber-500/30">
          <span className="text-amber-400 font-semibold text-[11px] block mb-0.5">Why this observation?</span>
          <p className="text-amber-100/90 leading-relaxed italic">
            "{recommendedObservation.reason}"
          </p>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="mt-4 pt-3 border-t border-[#0d2642] flex items-center justify-between gap-3 relative z-10">
        <span className="text-xs text-slate-400">
          Takes ~2 minutes to record
        </span>
        <button
          onClick={() => onStartObservation(recommendedObservation.segmentId)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-2 active:scale-95"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span>START OBSERVATION</span>
        </button>
      </div>
    </div>
  );
};
