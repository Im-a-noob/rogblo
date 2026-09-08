import React from 'react';
import { X, Plus, Flame, Shield, Sparkles, Box } from 'lucide-react';
import { BoxType } from '../types';

interface SandboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSpawnCrate: (type: BoxType) => void;
}

export const SandboxDrawer: React.FC<SandboxDrawerProps> = ({
  isOpen,
  onClose,
  onSpawnCrate,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="sandbox-drawer-backdrop"
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-[#0f1115]/70 backdrop-blur-sm p-4 animate-in fade-in select-none"
    >
      <div
        id="sandbox-drawer"
        className="w-full max-w-sm bg-[#161b22] border-4 border-[#2d333b] rounded-2xl p-5 shadow-2xl flex flex-col gap-3.5"
      >
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#2d333b]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold font-tactical block leading-none">
                Field Fabricator
              </span>
              <h3 className="font-bold text-white text-sm uppercase tracking-tight mt-0.5">
                Spawn Physics Crates
              </h3>
            </div>
          </div>
          <button
            id="btn-close-sandbox"
            onClick={onClose}
            className="w-8 h-8 border-2 border-[#2d333b] flex items-center justify-center rounded-lg bg-[#0f1115] text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Drop interactive cargo blocks into the warehouse at the forklift robot's coordinates:
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="btn-spawn-wood"
            onClick={() => onSpawnCrate('wood')}
            className="p-3 bg-[#0f1115] hover:bg-[#1a1d23] border-2 border-amber-900/60 hover:border-amber-500/60 rounded-xl flex items-center gap-2.5 text-left transition-transform active:scale-95 cursor-pointer group"
          >
            <Box className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-amber-200">Wood Cargo</div>
              <div className="text-[10px] text-slate-400">Standard stack</div>
            </div>
            <Plus className="w-4 h-4 ml-auto text-amber-400" />
          </button>

          <button
            id="btn-spawn-metal"
            onClick={() => onSpawnCrate('metal')}
            className="p-3 bg-[#0f1115] hover:bg-[#1a1d23] border-2 border-[#2d333b] hover:border-slate-400 rounded-xl flex items-center gap-2.5 text-left transition-transform active:scale-95 cursor-pointer group"
          >
            <Shield className="w-5 h-5 text-slate-300 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-slate-200">Heavy Steel</div>
              <div className="text-[10px] text-slate-400">3x mass ballast</div>
            </div>
            <Plus className="w-4 h-4 ml-auto text-slate-300" />
          </button>

          <button
            id="btn-spawn-tnt"
            onClick={() => onSpawnCrate('tnt')}
            className="p-3 bg-[#0f1115] hover:bg-[#1a1d23] border-2 border-rose-900/60 hover:border-rose-500/60 rounded-xl flex items-center gap-2.5 text-left transition-transform active:scale-95 cursor-pointer group"
          >
            <Flame className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-rose-200">TNT Explosive</div>
              <div className="text-[10px] text-slate-400">Blasts walls!</div>
            </div>
            <Plus className="w-4 h-4 ml-auto text-rose-400" />
          </button>

          <button
            id="btn-spawn-bouncy"
            onClick={() => onSpawnCrate('bouncy')}
            className="p-3 bg-[#0f1115] hover:bg-[#1a1d23] border-2 border-emerald-900/60 hover:border-emerald-500/60 rounded-xl flex items-center gap-2.5 text-left transition-transform active:scale-95 cursor-pointer group"
          >
            <Sparkles className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-emerald-200">Bouncy Rubber</div>
              <div className="text-[10px] text-slate-400">Super springy</div>
            </div>
            <Plus className="w-4 h-4 ml-auto text-emerald-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
