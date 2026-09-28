import React from 'react';
import { ActionItem } from '../types';

interface ActionPlanPanelProps {
  actions: ActionItem[];
  onToggleStatus: (actionId: string) => void;
  onOpenOutcomeVerification: () => void;
}

export const ActionPlanPanel: React.FC<ActionPlanPanelProps> = ({
  actions,
  onToggleStatus,
  onOpenOutcomeVerification,
}) => {
  const completedCount = actions.filter((a) => a.status === 'COMPLETED').length;
  const progressPct = Math.round((completedCount / actions.length) * 100);

  const getStatusBadge = (status: ActionItem['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-[#0e3522] text-emerald-300 border-emerald-500/40';
      case 'IN PROGRESS':
        return 'bg-[#0c2445] text-cyan-300 border-cyan-400/40 animate-pulse';
      case 'PENDING':
      default:
        return 'bg-[#040e1c] text-slate-400 border-[#0d2238]';
    }
  };

  const getPriorityStyle = (priority: ActionItem['priority']) => {
    if (priority.includes('High')) return 'text-rose-400 font-semibold';
    if (priority.includes('Medium')) return 'text-amber-400 font-medium';
    return 'text-slate-400';
  };

  return (
    <div className="rounded-2xl bg-[#061426]/95 backdrop-blur-md border border-[#0f2c4d] p-6 shadow-2xl text-slate-100 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#0d2642]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="text-[11px] font-mono tracking-wider text-cyan-400 uppercase font-semibold">
              Adaptive Foresight Protocol
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">ACTION PLAN</h2>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold text-cyan-300 tabular-nums">
            {completedCount} / {actions.length} Completed
          </span>
          <div className="w-28 h-1.5 bg-[#030914] rounded-full mt-1 overflow-hidden border border-[#0d2238]">
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Click any action item to cycle status: <strong className="text-slate-400">PENDING</strong> →{' '}
        <strong className="text-cyan-300">IN PROGRESS</strong> →{' '}
        <strong className="text-emerald-400">COMPLETED</strong>.
      </p>

      {/* Action Items List */}
      <div className="space-y-2.5">
        {actions.map((act, index) => {
          const isDone = act.status === 'COMPLETED';
          return (
            <div
              key={act.id}
              onClick={() => onToggleStatus(act.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                isDone
                  ? 'bg-[#0a2318]/50 border-emerald-500/30'
                  : act.status === 'IN PROGRESS'
                  ? 'bg-[#0c2445]/60 border-cyan-400/40 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                  : 'bg-[#040e1c] border-[#0e2744] hover:border-[#143a63]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      isDone
                        ? 'bg-emerald-500 text-slate-950'
                        : act.status === 'IN PROGRESS'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-[#091b30] text-slate-400'
                    }`}
                  >
                    {isDone ? '✓' : index + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${getPriorityStyle(act.priority)}`}>
                        {act.priority}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs text-slate-400 font-mono">{act.targetSegmentName}</span>
                    </div>

                    <h4
                      className={`text-sm font-semibold mt-0.5 tracking-tight ${
                        isDone ? 'line-through text-slate-500' : 'text-slate-100 group-hover:text-cyan-200'
                      }`}
                    >
                      {act.title}
                    </h4>

                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {act.reason}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(act.status)}`}>
                    {act.status}
                  </span>
                  <span className="text-[10px] text-slate-500 group-hover:text-cyan-400 transition-colors">
                    Click to advance
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Outcome Verification Trigger */}
      <div className="pt-3 border-t border-[#0d2642] flex items-center justify-between">
        <div className="text-xs text-slate-400">
          Compare scenario expectation against field observations
        </div>

        <button
          onClick={onOpenOutcomeVerification}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>OUTCOME VERIFICATION</span>
        </button>
      </div>
    </div>
  );
};
