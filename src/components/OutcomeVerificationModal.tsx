import React, { useState } from 'react';
import { ScenarioResult, Observation } from '../types';

interface OutcomeVerificationModalProps {
  scenario: ScenarioResult;
  recentObservation: Observation | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveVerification: (alignment: 'Aligned' | 'Partially aligned' | 'Different', notes: string) => void;
}

export const OutcomeVerificationModal: React.FC<OutcomeVerificationModalProps> = ({
  scenario,
  recentObservation,
  isOpen,
  onClose,
  onSaveVerification,
}) => {
  const [alignment, setAlignment] = useState<'Aligned' | 'Partially aligned' | 'Different'>('Aligned');
  const [notes, setNotes] = useState(
    'Downstream culvert stage reached 2.85m within 35 minutes of rainfall peak, conforming closely with the simulated +2.4x runoff accumulation wave.'
  );

  if (!isOpen) return null;

  const scenarioExpectation = `Anticipated ${scenario.riskLevel.toLowerCase()} runoff stress in Downstream Segment B with runoff surge factor +${
    scenario.runoffFactor
  }x at ${scenario.params.rainfallMm}mm rainfall.`;

  const observedCondition = recentObservation
    ? `${recentObservation.flowCondition} with ${recentObservation.waterAppearance} turbidity reported by ${recentObservation.observerName} at ${recentObservation.segmentName}.`
    : `Elevated channel velocity with turbid water and partial bank wetting confirmed at Downstream Segment B.`;

  const handleConfirm = () => {
    onSaveVerification(alignment, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 bg-[#020610]/85 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-2xl bg-[#061426] border border-[#0f2c4d] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#0d2642] bg-[#040e1c] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0c2445] border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div>
              <span className="text-[11px] font-mono tracking-wider text-cyan-400 uppercase font-semibold block">
                Model Recalibration Loop
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">OUTCOME VERIFICATION</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0a2039] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Comparison Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-400">
            Compare model prediction against ground reality to close the anticipation loop and calibrate next-cycle uncertainty.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Scenario Expectation */}
            <div className="p-3.5 rounded-xl bg-[#040e1c] border border-[#0e2744] space-y-1.5">
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                Scenario Expectation
              </span>
              <p className="text-slate-200 leading-relaxed font-medium">
                {scenarioExpectation}
              </p>
            </div>

            {/* Observed Condition */}
            <div className="p-3.5 rounded-xl bg-[#040e1c] border border-[#0e2744] space-y-1.5">
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                Observed Condition
              </span>
              <p className="text-slate-200 leading-relaxed font-medium">
                {observedCondition}
              </p>
            </div>
          </div>

          {/* Alignment Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              How closely did observed stream behavior align with the scenario?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'Aligned', label: 'Aligned (High Fit)', color: 'border-emerald-400 text-emerald-300 bg-[#0e3522]' },
                { val: 'Partially aligned', label: 'Partially Aligned', color: 'border-amber-400 text-amber-300 bg-[#3b2b10]' },
                { val: 'Different', label: 'Different (Anomaly)', color: 'border-rose-400 text-rose-300 bg-[#3b1220]' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setAlignment(opt.val as any)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    alignment === opt.val
                      ? `${opt.color} shadow-[0_0_12px_rgba(56,189,248,0.2)]`
                      : 'border-[#0e2744] bg-[#040e1c] text-slate-400 hover:border-[#143a63]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Hydrological Calibration Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#040e1c] border border-[#0e2744] text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#040e1c] border-t border-[#0d2642] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#08182b] hover:bg-[#0c2445] text-xs font-medium text-slate-400"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-1.5"
          >
            <span>Record Verification & Update Timeline</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
