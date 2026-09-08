import React from 'react';
import { X, Star, Trophy, Play, Check } from 'lucide-react';
import { LevelData, LevelProgress } from '../types';

interface LevelSelectModalProps {
  levels: LevelData[];
  currentLevelId: number;
  progressMap: Record<number, LevelProgress>;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  levels,
  currentLevelId,
  progressMap,
  onSelectLevel,
  onClose,
}) => {
  // Calculate total stars earned across all levels
  const totalStarsEarned = Object.values(progressMap).reduce(
    (acc: number, p: LevelProgress) => acc + (p?.stars || 0),
    0
  );
  const maxPossibleStars = levels.length * 3;

  return (
    <div
      id="level-select-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1115]/85 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none"
    >
      <div
        id="level-select-card"
        className="w-full max-w-2xl bg-[#161b22] border-4 border-[#2d333b] rounded-2xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#2d333b]">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold font-tactical block leading-none">
              Sector Management
            </span>
            <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-white uppercase flex items-center gap-2 mt-1">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Assignment Roster</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg text-xs font-bold text-amber-400 font-mono-num">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>
                {totalStarsEarned} / {maxPossibleStars} Stars
              </span>
            </div>

            <button
              id="btn-close-level-select"
              onClick={onClose}
              className="w-9 h-9 border-2 border-[#2d333b] flex items-center justify-center rounded-lg bg-[#0f1115] text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Level Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 overflow-y-auto pr-1">
          {levels.map((lvl) => {
            const prog = progressMap[lvl.id] || { stars: 0, completed: false };
            const isCurrent = lvl.id === currentLevelId;
            const lvlFormatted = lvl.id < 10 ? `0${lvl.id}` : `${lvl.id}`;

            return (
              <button
                key={lvl.id}
                onClick={() => {
                  onSelectLevel(lvl.id);
                  onClose();
                }}
                className={`p-4 rounded-xl text-left border-2 transition-all flex flex-col justify-between group cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                    : prog.completed
                    ? 'bg-[#0f1115] border-[#2d333b] hover:border-amber-500/60 hover:bg-[#1a1d23]'
                    : 'bg-[#0c0e12] border-[#21262d] hover:border-[#2d333b] hover:bg-[#0f1115]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded bg-[#1f2937] border-b-2 border-gray-900 font-mono-num font-black text-xs flex items-center justify-center text-amber-400 group-hover:text-amber-300 group-hover:border-amber-500/40 transition-colors">
                      {lvlFormatted}
                    </span>
                    <h3 className="font-bold text-sm text-slate-100 group-hover:text-amber-300 transition-colors uppercase tracking-tight">
                      {lvl.title.replace(/^Level \d+:\s*/i, '')}
                    </h3>
                  </div>
                  {prog.completed && (
                    <span className="p-1 bg-emerald-500/20 text-emerald-400 rounded-md">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-1 mb-3">
                  {lvl.subtitle}
                </p>

                {/* Stars and action footer */}
                <div className="flex items-center justify-between pt-2 border-t border-[#2d333b]">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= prog.stars
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-[#2d333b]'
                        }`}
                      />
                    ))}
                  </div>

                  <span className="text-xs font-bold text-slate-400 group-hover:text-amber-400 flex items-center gap-1 transition-colors uppercase tracking-wider font-tactical">
                    <span>Deploy</span>
                    <Play className="w-3 h-3 fill-current" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
