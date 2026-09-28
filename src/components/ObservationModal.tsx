import React, { useState } from 'react';
import { StreamSegment, Observation } from '../types';
import { generateSampleWaterPhoto } from '../services/observationService';

interface ObservationModalProps {
  segments: StreamSegment[];
  initialSegmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitObservation: (observationData: Partial<Observation>) => void;
}

export const ObservationModal: React.FC<ObservationModalProps> = ({
  segments,
  initialSegmentId,
  isOpen,
  onClose,
  onSubmitObservation,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>(initialSegmentId);
  const [observerName, setObserverName] = useState('Jordan Lee (Field Volunteer)');

  // Form Fields
  const [waterAppearance, setWaterAppearance] = useState<Observation['waterAppearance']>('Muddy / Brown');
  const [flowCondition, setFlowCondition] = useState<Observation['flowCondition']>('Elevated Flow');
  const [visibleDebris, setVisibleDebris] = useState<Observation['visibleDebris']>('Leaf litter & branches');
  const [odorObservation, setOdorObservation] = useState<Observation['odorObservation']>('None / Natural earthy');
  const [notes, setNotes] = useState(
    'Culvert water stage swollen after convective storm band. Brown suspended sediment plumes visible near south bridge abutment.'
  );

  // Photo
  const [photoUrl, setPhotoUrl] = useState<string>(generateSampleWaterPhoto('turbid'));
  const [photoName, setPhotoName] = useState<string>('segment_b_turbid_post_rain.svg');

  if (!isOpen) return null;

  const currentSegment = segments.find((s) => s.id === selectedSegmentId) || segments[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPresetPhoto = (variant: 'turbid' | 'clear' | 'debris' | 'culvert') => {
    setPhotoUrl(generateSampleWaterPhoto(variant));
    setPhotoName(`simulated_field_sample_${variant}.svg`);
  };

  const handleFinalSubmit = () => {
    setStep(4);
    setTimeout(() => {
      onSubmitObservation({
        segmentId: currentSegment.id,
        segmentName: currentSegment.name,
        coordinates: currentSegment.centerCoord,
        observerName,
        waterAppearance,
        flowCondition,
        visibleDebris,
        odorObservation,
        notes,
        photoUrl,
        photoName,
      });
    }, 850);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#020610]/85 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-2xl bg-[#061426] border border-[#0f2c4d] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header & Step Progress */}
        <div className="px-6 py-4 border-b border-[#0d2642] bg-[#040e1c] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono tracking-wider text-cyan-400 uppercase font-semibold">
              Community Ground Truth Intake
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">Record Field Observation</h2>
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

        {/* Step Indicator */}
        <div className="px-6 py-2.5 bg-[#030914] border-b border-[#0d2238] flex items-center justify-between text-xs">
          {[
            { num: 1, label: 'Location' },
            { num: 2, label: 'Observation' },
            { num: 3, label: 'Review' },
            { num: 4, label: 'Submit' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  step === s.num
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                    : step > s.num
                    ? 'bg-[#0e3522] text-emerald-400 border border-emerald-500/40'
                    : 'bg-[#08182b] text-slate-400'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </span>
              <span className={step === s.num ? 'text-cyan-300 font-semibold' : 'text-slate-400'}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* STEP 1: LOCATION */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Select Watershed Stream Segment
                </label>
                <div className="space-y-2">
                  {segments.map((seg) => {
                    const isSelected = seg.id === selectedSegmentId;
                    return (
                      <div
                        key={seg.id}
                        onClick={() => setSelectedSegmentId(seg.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-cyan-400 bg-[#0c2445] shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                            : 'border-[#0e2744] bg-[#040e1c] hover:border-[#143a63]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-cyan-400">{seg.code}</span>
                            <span className="text-sm font-semibold text-white">{seg.name}</span>
                          </div>
                          <span className="text-xs text-slate-400 block mt-0.5">{seg.currentCondition}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono text-slate-300 tabular-nums">Rain: {seg.rainfallMm}mm</span>
                          <span className="text-[11px] text-amber-400 block">{seg.flowCondition}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Observer Identity / Volunteer Call-sign
                </label>
                <input
                  type="text"
                  value={observerName}
                  onChange={(e) => setObserverName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#040e1c] border border-[#0e2744] text-slate-100 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          {/* STEP 2: OBSERVATION */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Water Appearance */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Water Appearance / Turbidity
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['Clear', 'Slightly Turbid', 'Muddy / Brown', 'Milky / Foamy', 'Sheen / Oily'] as const).map(
                    (app) => (
                      <button
                        type="button"
                        key={app}
                        onClick={() => setWaterAppearance(app)}
                        className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                          waterAppearance === app
                            ? 'border-cyan-400 bg-[#0c2445] text-cyan-200'
                            : 'border-[#0e2744] bg-[#040e1c] text-slate-400 hover:border-[#143a63]'
                        }`}
                      >
                        {app}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Flow Condition */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Flow Velocity & Channel Elevation
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    ['Sluggish / Stagnant', 'Normal Flow', 'Elevated Flow', 'Rapid Torrent', 'Overbank Spilling'] as const
                  ).map((fc) => (
                    <button
                      type="button"
                      key={fc}
                      onClick={() => setFlowCondition(fc)}
                      className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                        flowCondition === fc
                          ? 'border-cyan-400 bg-[#0c2445] text-cyan-200'
                          : 'border-[#0e2744] bg-[#040e1c] text-slate-400 hover:border-[#143a63]'
                      }`}
                    >
                      {fc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visible Debris & Odor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Visible Debris</label>
                  <select
                    value={visibleDebris}
                    onChange={(e) => setVisibleDebris(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#040e1c] border border-[#0e2744] text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="None">None</option>
                    <option value="Leaf litter & branches">Leaf litter & branches</option>
                    <option value="Urban trash & plastic">Urban trash & plastic</option>
                    <option value="Heavy woody debris">Heavy woody debris</option>
                    <option value="Sediment plume">Sediment plume</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Odor Observation</label>
                  <select
                    value={odorObservation}
                    onChange={(e) => setOdorObservation(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#040e1c] border border-[#0e2744] text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="None / Natural earthy">None / Natural earthy</option>
                    <option value="Petroleum / chemical">Petroleum / chemical</option>
                    <option value="Stagnant / sulfur">Stagnant / sulfur</option>
                    <option value="Musty organic">Musty organic</option>
                  </select>
                </div>
              </div>

              {/* Field Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Field Observations & Context Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record bank clearance, unusual color, storm drain outflow..."
                  className="w-full px-3 py-2 rounded-xl bg-[#040e1c] border border-[#0e2744] text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Geotagged Photo Evidence</label>
                  <span className="text-[11px] text-cyan-400 font-mono">100% Client-side local</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#040e1c] border border-[#0e2744] space-y-3">
                  <div className="flex items-center gap-4">
                    {photoUrl && (
                      <img
                        src={photoUrl}
                        alt="Evidence Preview"
                        className="w-24 h-16 rounded-xl object-cover border border-cyan-500/40 shadow"
                      />
                    )}
                    <div className="space-y-1">
                      <label className="px-3 py-1.5 rounded-lg bg-[#0c2445] hover:bg-[#123661] text-cyan-300 text-xs font-semibold cursor-pointer transition-colors inline-block">
                        Browse Device File...
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>
                      <span className="text-[11px] text-slate-400 block truncate max-w-xs">{photoName}</span>
                    </div>
                  </div>

                  {/* Preset Photos */}
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Preset sensor snapshots:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectPresetPhoto('turbid')}
                        className="px-2.5 py-1 rounded-lg bg-[#07192e] hover:bg-[#0c2445] text-[11px] text-slate-300"
                      >
                        Turbid Storm Flow
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPresetPhoto('culvert')}
                        className="px-2.5 py-1 rounded-lg bg-[#07192e] hover:bg-[#0c2445] text-[11px] text-slate-300"
                      >
                        Culvert Stage 2.8m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPresetPhoto('clear')}
                        className="px-2.5 py-1 rounded-lg bg-[#07192e] hover:bg-[#0c2445] text-[11px] text-slate-300"
                      >
                        Clear Baseflow
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 3 && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#040e1c] border border-[#0e2744] space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-[#0d2238]">
                  <span className="font-semibold text-slate-300">Target Stream Reach:</span>
                  <span className="font-bold text-cyan-300">{currentSegment.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Observer:</span>
                  <span className="text-white">{observerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Water Appearance:</span>
                  <span className="font-semibold text-cyan-200">{waterAppearance}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Flow Condition:</span>
                  <span className="font-semibold text-amber-300">{flowCondition}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Debris & Plume:</span>
                  <span className="text-slate-200">{visibleDebris}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#040e1c] border border-[#0e2744]">
                <span className="text-slate-400 block mb-1 font-semibold">Notes:</span>
                <p className="text-slate-200 italic">{notes}</p>
              </div>

              {photoUrl && (
                <div className="p-2.5 rounded-xl bg-[#040e1c] border border-[#0e2744] flex items-center gap-3">
                  <img src={photoUrl} alt="Review" className="w-16 h-12 rounded-lg object-cover border border-slate-700" />
                  <span className="text-xs text-slate-300">Photo attached: {photoName}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: SUBMIT CONFIRMATION */}
          {step === 4 && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 mx-auto flex items-center justify-center animate-pulse">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                  Ground Truth Ingestion
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight mt-1">NEW EVIDENCE RECEIVED</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Routing telemetry packet to deterministic AI Validation Engine for cross-consistency analysis...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step < 4 && (
          <div className="px-6 py-4 bg-[#040e1c] border-t border-[#0d2642] flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-2 rounded-xl bg-[#08182b] hover:bg-[#0c2445] text-xs font-medium text-slate-300 transition-colors"
              >
                ← Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#08182b] hover:bg-[#0c2445] text-xs font-medium text-slate-400 transition-colors"
              >
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as any)}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                Submit Field Evidence
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
