import React from 'react';

interface OperatorConsoleProps {
  onLeftChange: (active: boolean) => void;
  onRightChange: (active: boolean) => void;
  onJumpChange: (active: boolean) => void;
  onMagnetToggle: () => void;
  onRestart: () => void;
  isMagnetActive: boolean;
  cargoLoaded: number;
  totalCargo: number;
  hint?: string;
}

export const OperatorConsole: React.FC<OperatorConsoleProps> = ({
  onLeftChange,
  onRightChange,
  onJumpChange,
  onMagnetToggle,
  onRestart,
  isMagnetActive,
  cargoLoaded,
  totalCargo,
  hint,
}) => {
  const isComplete = cargoLoaded >= totalCargo;

  return (
    <footer
      id="operator-console"
      className="h-14 sm:h-20 bg-[#0c0e12] border-t-2 sm:border-t-4 border-[#2d333b] flex items-center justify-between px-3 sm:px-8 shrink-0 z-20 select-none shadow-2xl"
    >
      {/* Controls: Navigation & Manipulator (Desktop / Keyboard View) */}
      <div className="hidden sm:flex items-center gap-4 sm:gap-8">
        {/* Navigation Keycaps */}
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest font-tactical">
            Navigation
          </span>
          <div className="flex gap-1.5 sm:gap-2.5 mt-1">
            <button
              id="keycap-a"
              onPointerDown={(e) => {
                e.preventDefault();
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {}
                onLeftChange(true);
              }}
              onPointerUp={(e) => {
                try {
                  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  }
                } catch {}
                onLeftChange(false);
              }}
              onPointerCancel={() => onLeftChange(false)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#1f2937] active:bg-amber-500 active:text-black border-b-2 sm:border-b-4 border-gray-900 active:border-amber-800 flex items-center justify-center font-bold text-xs sm:text-sm text-slate-200 transition-colors cursor-pointer touch-none"
              title="Drive Left (A or ←)"
            >
              A
            </button>
            <button
              id="keycap-s"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#1f2937]/70 border-b-2 sm:border-b-4 border-gray-900 flex items-center justify-center font-bold text-xs sm:text-sm text-slate-500 cursor-default"
              title="Brake / Neutral (S)"
            >
              S
            </button>
            <button
              id="keycap-d"
              onPointerDown={(e) => {
                e.preventDefault();
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {}
                onRightChange(true);
              }}
              onPointerUp={(e) => {
                try {
                  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  }
                } catch {}
                onRightChange(false);
              }}
              onPointerCancel={() => onRightChange(false)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#1f2937] active:bg-amber-500 active:text-black border-b-2 sm:border-b-4 border-gray-900 active:border-amber-800 flex items-center justify-center font-bold text-xs sm:text-sm text-slate-200 transition-colors cursor-pointer touch-none"
              title="Drive Right (D or →)"
            >
              D
            </button>
            <button
              id="keycap-w"
              onPointerDown={(e) => {
                e.preventDefault();
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {}
                onJumpChange(true);
              }}
              onPointerUp={(e) => {
                try {
                  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  }
                } catch {}
                onJumpChange(false);
              }}
              onPointerCancel={() => onJumpChange(false)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#1f2937] active:bg-amber-500 active:text-black border-b-2 sm:border-b-4 border-gray-900 active:border-amber-800 flex items-center justify-center font-bold text-xs sm:text-sm text-slate-200 transition-colors cursor-pointer touch-none"
              title="Hydraulic Jump (W or ↑)"
            >
              W
            </button>
          </div>
        </div>

        {/* Manipulator Keycaps */}
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest font-tactical">
            Manipulator
          </span>
          <div className="flex gap-2 sm:gap-3 mt-1">
            <button
              id="keycap-space"
              onClick={onMagnetToggle}
              className={`px-2.5 sm:px-4 h-7 sm:h-8 rounded border-b-2 sm:border-b-4 flex items-center justify-center font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                isMagnetActive
                  ? 'bg-amber-500 text-slate-950 border-amber-800 shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-[0.98]'
                  : 'bg-[#1f2937] hover:bg-[#283548] text-amber-400 border-gray-900'
              }`}
              title="Toggle Electromagnet (Space, E, or Left Click)"
            >
              {isMagnetActive ? 'MAGNET (ON)' : 'SPACE (GRAB)'}
            </button>
            <button
              id="keycap-r"
              onClick={onRestart}
              className="px-2.5 sm:px-3 h-7 sm:h-8 rounded bg-[#1f2937] hover:bg-[#283548] active:bg-[#111827] border-b-2 sm:border-b-4 border-gray-900 flex items-center justify-center font-bold text-xs sm:text-sm uppercase text-slate-300 transition-all cursor-pointer"
              title="Reset Sector (R)"
            >
              R (RESET)
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Telemetry & Quick Reset Button */}
      <div className="flex sm:hidden items-center gap-2">
        <button
          id="btn-mobile-quick-reset"
          onClick={onRestart}
          className="px-2.5 py-1 rounded-lg bg-[#1f2937] active:bg-amber-600 border border-[#2d333b] text-slate-200 text-xs font-bold font-tactical uppercase flex items-center gap-1 cursor-pointer"
        >
          <span>↺ RESET</span>
        </button>
        {hint && (
          <span className="text-[11px] text-slate-400 font-tactical truncate max-w-[170px]">
            {hint}
          </span>
        )}
      </div>

      {/* Middle: Tactical Sector Directive / Hint */}
      {hint && (
        <div className="hidden xl:flex items-center gap-2 bg-[#161b22] px-3.5 py-1.5 rounded-lg border border-[#2d333b] max-w-md">
          <span className="text-[10px] text-amber-500 uppercase font-bold tracking-wider font-tactical">
            Directive:
          </span>
          <span className="text-xs text-slate-300 truncate">{hint}</span>
        </div>
      )}

      {/* Right: System Telemetry Status */}
      <div className="flex flex-col items-end justify-center">
        <div className="text-[10px] text-gray-500 uppercase mb-1 font-bold tracking-wider font-tactical">
          System Status
        </div>
        <div className="flex items-center gap-2">
          {isComplete ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-pulse" />
              <span className="text-xs font-mono-num text-amber-400 font-bold tracking-tight">
                CARGO SECURED
              </span>
            </>
          ) : isMagnetActive ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
              <span className="text-xs font-mono-num text-cyan-300 font-bold tracking-tight">
                MAGNET ENGAGED
              </span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
              <span className="text-xs font-mono-num text-gray-400 font-medium tracking-tight">
                HYDRAULICS NOMINAL
              </span>
            </>
          )}
        </div>
      </div>
    </footer>
  );
};
