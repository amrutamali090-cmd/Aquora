import React from 'react';
import { Observation, AiValidationCheck } from '../types';

interface AiValidationModalProps {
  observation: Observation;
  aiCheck: AiValidationCheck;
  isOpen: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  onReject: () => void;
}

export const AiValidationModal: React.FC<AiValidationModalProps> = ({
  observation,
  aiCheck,
  isOpen,
  onConfirm,
  onEdit,
  onReject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 bg-[#020610]/85 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-2xl bg-[#061426] border border-[#0f2c4d] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#0d2642] bg-[#040e1c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0c2445] border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2v-2h2zm0-4h-2V7h2z"/>
              </svg>
            </div>
            <div>
              <span className="text-[11px] font-mono tracking-wider text-cyan-400 uppercase font-semibold block">
                Deterministic Validation Engine
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">AI-ASSISTED CHECK</h2>
            </div>
          </div>

          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#0c2445] text-cyan-300 border border-cyan-500/40">
            Awaiting Confirmation
          </span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Consistency & Completeness Badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#040e1c] border border-[#0e2744]">
              <span className="text-[11px] text-slate-400 block mb-0.5">Consistency</span>
              <span
                className={`text-sm font-bold ${
                  aiCheck.consistency === 'High' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {aiCheck.consistency}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#040e1c] border border-[#0e2744]">
              <span className="text-[11px] text-slate-400 block mb-0.5">Evidence</span>
              <span className="text-sm font-bold text-cyan-300">
                {aiCheck.evidenceCompleteness}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#040e1c] border border-[#0e2744]">
              <span className="text-[11px] text-slate-400 block mb-0.5">Confidence</span>
              <span className="text-sm font-bold font-mono text-cyan-400 tabular-nums">
                {aiCheck.confidence}%
              </span>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-4 rounded-xl bg-[#072442]/40 border border-cyan-500/30 space-y-1.5">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block">
              Validation Synthesis
            </span>
            <p className="text-xs text-slate-100 leading-relaxed font-medium">
              "{aiCheck.explanation}"
            </p>
          </div>

          {/* Detected Signals */}
          {aiCheck.detectedSignals.length > 0 && (
            <div className="space-y-1.5 text-xs">
              <span className="text-slate-400 font-semibold text-[11px] block">Detected Sensor Signals:</span>
              <div className="space-y-1">
                {aiCheck.detectedSignals.map((signal, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    <span>{signal}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submitted Observation Summary */}
          <div className="p-3 rounded-xl bg-[#040e1c] border border-[#0e2744] text-xs text-slate-300 flex items-center justify-between">
            <div>
              <span className="font-semibold text-white">{observation.segmentName}</span>
              <span className="text-slate-400 block mt-0.5">
                {observation.waterAppearance} · {observation.flowCondition}
              </span>
            </div>
            {observation.photoUrl && (
              <img
                src={observation.photoUrl}
                alt="Mini"
                className="w-14 h-10 rounded-lg object-cover border border-slate-700"
              />
            )}
          </div>
        </div>

        {/* Action Buttons: CONFIRM, EDIT, REJECT */}
        <div className="px-6 py-4 bg-[#040e1c] border-t border-[#0d2642] flex items-center justify-between gap-3">
          <button
            onClick={onReject}
            className="px-4 py-2 rounded-xl bg-[#2e101a] hover:bg-[#3d1522] text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
          >
            REJECT
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 rounded-xl bg-[#08182b] hover:bg-[#0c2445] text-slate-300 text-xs font-semibold transition-colors"
            >
              EDIT
            </button>

            <button
              onClick={onConfirm}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>CONFIRM EVIDENCE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
