"use client";

/**
 * QuickActionChips — Zero-cost hardcoded response buttons
 *
 * Displayed on the welcome screen. Clicking these does NOT call
 * any API — responses are served instantly from local data.
 *
 * Features staggered fade-in animation for a polished feel.
 */

import { quickActions, type QuickAction } from "@/data/quick-actions";

interface QuickActionChipsProps {
  onSelect: (action: QuickAction) => void;
  disabled?: boolean;
}

export default function QuickActionChips({
  onSelect,
  disabled = false,
}: QuickActionChipsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium px-1 mb-3">
        Quick Actions
      </p>
      <div className="grid grid-cols-2 gap-2">
        {quickActions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => onSelect(action)}
            disabled={disabled}
            className="quick-action-chip group flex items-center gap-2.5 px-3.5 py-3 rounded-xl
              text-left text-sm transition-all duration-300 ease-out
              bg-white border border-slate-200 shadow-sm
              hover:bg-slate-50 hover:border-blue-500/30 hover:shadow-md hover:shadow-blue-500/10
              active:scale-[0.97]
              disabled:opacity-50 disabled:pointer-events-none"
            style={{
              animationDelay: `${index * 100 + 200}ms`,
              border: '1px solid #cbd5e1',
              color: '#475569',
              display: 'flex',
              gap: '12px',
              padding: '12px 14px',
              boxSizing: 'border-box'
            }}
          >
            <span className="text-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              {action.icon}
            </span>
            <span className="text-slate-600 font-medium text-xs leading-tight group-hover:text-slate-900 transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
