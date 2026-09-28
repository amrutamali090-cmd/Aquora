import React from 'react';
import { TimelineEvent } from '../types';

interface EvidenceTimelineProps {
  events: TimelineEvent[];
}

export const EvidenceTimeline: React.FC<EvidenceTimelineProps> = ({ events }) => {
  const getBadgeStyle = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'observation':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'ai_validation':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'human_verification':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'scenario':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'action_plan':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'action_completed':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'outcome_verified':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="rounded-2xl bg-[#061426]/95 backdrop-blur-md border border-[#0f2c4d] p-5 shadow-2xl text-slate-100 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#0d2642]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="text-[11px] font-mono tracking-wider text-cyan-400 uppercase font-semibold">
              Traceable Verification Audit
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">EVIDENCE TIMELINE</h2>
        </div>

        <span className="text-xs font-mono text-cyan-300">
          {events.length} Recorded Events
        </span>
      </div>

      {/* Events List */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#0e2744]">
        {events.map((evt) => (
          <div key={evt.id} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#061426] border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_8px_rgba(34,211,238,0.5)]">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
            </div>

            {/* Event Content */}
            <div className="p-3.5 rounded-xl bg-[#040e1c] border border-[#0e2744] hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-cyan-300">{evt.time}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider ${getBadgeStyle(evt.type)}`}>
                  {evt.type.replace('_', ' ')}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-slate-100">{evt.title}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{evt.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
