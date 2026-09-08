import React from 'react';
import { X, MousePointer, Keyboard, Box, Sparkles } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div
      id="help-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1115]/85 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none"
    >
      <div
        id="help-modal-card"
        className="w-full max-w-lg bg-[#161b22] border-4 border-[#2d333b] rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#2d333b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold font-tactical block leading-none">
                Operator Operations Manual
              </span>
              <h2 className="text-lg font-black italic uppercase text-white tracking-tight mt-1">
                Forklift Crane Protocols
              </h2>
            </div>
          </div>

          <button
            id="btn-close-help"
            onClick={onClose}
            className="w-9 h-9 border-2 border-[#2d333b] flex items-center justify-center rounded-lg bg-[#0f1115] text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 text-xs sm:text-sm text-slate-300">
          {/* Mission Objective */}
          <div className="bg-[#0f1115] border-2 border-[#2d333b] rounded-xl p-3.5">
            <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5 font-tactical">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Shift Objective</span>
            </h3>
            <p className="leading-relaxed text-slate-300">
              Pilot your hydraulic forklift through the logistics facility, latch onto cargo crates with your electromagnetic arm, and stack them into the heavy loader truck's target bays!
            </p>
          </div>

          {/* Controls Table */}
          <div className="bg-[#0f1115] border-2 border-[#2d333b] rounded-xl p-3.5">
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 font-tactical">
              <Keyboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Manipulator Keybindings</span>
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1 border-b border-[#2d333b]">
                <span className="text-slate-400">Drive Left / Right</span>
                <span className="font-mono bg-[#1f2937] border-b-2 border-gray-900 px-2 py-0.5 rounded text-amber-400 font-bold text-xs">
                  A / D or ← / →
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#2d333b]">
                <span className="text-slate-400">Hydraulic Jump</span>
                <span className="font-mono bg-[#1f2937] border-b-2 border-gray-900 px-2 py-0.5 rounded text-amber-400 font-bold text-xs">
                  W or ↑
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#2d333b]">
                <span className="text-slate-400">Aim Crane Arm</span>
                <span className="font-mono bg-[#1f2937] border-b-2 border-gray-900 px-2 py-0.5 rounded text-sky-400 font-bold text-xs flex items-center gap-1">
                  <MousePointer className="w-3 h-3" /> Cursor Reticle / Touch
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#2d333b]">
                <span className="text-slate-400">Electromagnet Grab</span>
                <span className="font-mono bg-[#1f2937] border-b-2 border-gray-900 px-2 py-0.5 rounded text-sky-400 font-bold text-xs">
                  Left Click or Space / E
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Reset Sector</span>
                <span className="font-mono bg-[#1f2937] border-b-2 border-gray-900 px-2 py-0.5 rounded text-slate-300 font-bold text-xs">
                  R
                </span>
              </div>
            </div>
          </div>

          {/* Crate Types */}
          <div className="bg-[#0f1115] border-2 border-[#2d333b] rounded-xl p-3.5">
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-2 font-tactical">
              Cargo Classifications
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#161b22] border border-amber-900/60 flex items-start gap-2">
                <span className="text-base">📦</span>
                <div>
                  <span className="font-bold text-amber-400">Wood Cargo:</span>
                  <p className="text-[11px] text-slate-400">Primary delivery shipment for the truck dock.</p>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#2d333b] flex items-start gap-2">
                <span className="text-base">⚙️</span>
                <div>
                  <span className="font-bold text-slate-300">Heavy Steel:</span>
                  <p className="text-[11px] text-slate-400">High-density ballast to hold down floor switches.</p>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#161b22] border border-rose-900/60 flex items-start gap-2">
                <span className="text-base">💥</span>
                <div>
                  <span className="font-bold text-rose-400">TNT Explosive:</span>
                  <p className="text-[11px] text-slate-400">Impact ordnance that detonates cracked blast walls.</p>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#161b22] border border-emerald-900/60 flex items-start gap-2">
                <span className="text-base">🟢</span>
                <div>
                  <span className="font-bold text-emerald-400">Bouncy Polymer:</span>
                  <p className="text-[11px] text-slate-400">Elastic spring block to vault the chassis upward.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
