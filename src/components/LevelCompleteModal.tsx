import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, ArrowRight, RotateCcw, Grid, Trophy, CheckCircle2 } from 'lucide-react';
import { LevelData } from '../types';

interface LevelCompleteModalProps {
  level: LevelData;
  timeSec: number;
  starsEarned: number;
  allStarsFound: boolean;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onLevelSelect: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  level,
  timeSec,
  starsEarned,
  allStarsFound,
  hasNextLevel,
  onNextLevel,
  onReplay,
  onLevelSelect,
}) => {
  useEffect(() => {
    // Confetti celebration blast
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#fbbf24', '#22c55e', '#38bdf8'],
    });
  }, []);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    const cs = Math.floor((sec % 1) * 100).toString().padStart(2, '0');
    return `${mins}:${s}.${cs}`;
  };

  const isSpeedStar = timeSec <= level.starTimeTargetSec;
  const levelFormatted = level.id < 10 ? `0${level.id}` : `${level.id}`;
  const cleanTitle = level.title.replace(/^Level \d+:\s*/i, '');

  return (
    <div
      id="level-complete-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1115]/85 backdrop-blur-md p-4 animate-in fade-in duration-300 select-none"
    >
      <div
        id="level-complete-card"
        className="w-full max-w-md bg-[#161b22] border-4 border-[#2d333b] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
      >
        {/* Top Hazard Accent Stripe */}
        <div className="absolute top-0 left-0 right-0 h-2.5 hazard-stripes opacity-70" />

        {/* Ambient glow */}
        <div className="absolute -top-20 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Sector Assignment Completed Badge */}
        <div className="flex items-center gap-2 text-amber-500 font-bold uppercase tracking-widest text-[10px] font-tactical mb-1 mt-1">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Sector Assignment Completed</span>
        </div>

        {/* Level Name */}
        <h2 className="text-xl sm:text-2xl font-black italic tracking-tight uppercase text-white mb-6">
          LEVEL {levelFormatted}: {cleanTitle}
        </h2>

        {/* 3 Stars Industrial Pods */}
        <div className="flex items-center justify-center gap-3.5 mb-6">
          {[1, 2, 3].map((starNum) => {
            const hasStar = starNum <= starsEarned;
            return (
              <div
                key={starNum}
                className={`flex flex-col items-center transition-all transform ${
                  hasStar ? 'scale-105' : 'scale-90 opacity-40'
                }`}
              >
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center border-2 ${
                    hasStar
                      ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_16px_#f59e0b]'
                      : 'bg-[#0f1115] border-[#2d333b]'
                  }`}
                >
                  <Star
                    className={`w-7 h-7 sm:w-8 sm:h-8 ${
                      hasStar ? 'text-amber-400 fill-amber-400 animate-bounce' : 'text-slate-600'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Objective Checklist in Industrial Sub-Card */}
        <div className="w-full bg-[#0f1115] border-2 border-[#2d333b] rounded-xl p-4 mb-6 text-left flex flex-col gap-2.5">
          {/* Criterion 1: Cargo Loaded */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Deliver Cargo to Truck</span>
            </div>
            <span className="font-bold text-amber-400 font-mono-num">+1 ★</span>
          </div>

          {/* Criterion 2: 3 Hidden Stars */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2
                className={`w-4 h-4 ${allStarsFound ? 'text-emerald-400' : 'text-slate-600'}`}
              />
              <span>Collect All 3 Hidden Stars</span>
            </div>
            <span
              className={`font-bold font-mono-num ${
                allStarsFound ? 'text-amber-400' : 'text-slate-600'
              }`}
            >
              {allStarsFound ? '+1 ★' : 'MISSED'}
            </span>
          </div>

          {/* Criterion 3: Speed Target */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2
                className={`w-4 h-4 ${isSpeedStar ? 'text-emerald-400' : 'text-slate-600'}`}
              />
              <span className="truncate">
                Beat Target ({formatTimer(timeSec)} / {formatTimer(level.starTimeTargetSec)})
              </span>
            </div>
            <span
              className={`font-bold font-mono-num ${
                isSpeedStar ? 'text-amber-400' : 'text-slate-600'
              }`}
            >
              {isSpeedStar ? '+1 ★' : 'TOO SLOW'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {hasNextLevel ? (
            <button
              id="btn-next-level"
              onClick={onNextLevel}
              className="flex-1 py-3 px-5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black rounded-xl border-b-4 border-amber-800 shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base transition-transform active:scale-95 cursor-pointer uppercase tracking-tight"
            >
              <span>Next Assignment</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              id="btn-finish-all"
              onClick={onLevelSelect}
              className="flex-1 py-3 px-5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black rounded-xl border-b-4 border-emerald-800 shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base transition-transform active:scale-95 cursor-pointer uppercase tracking-tight"
            >
              <span>All Sectors Cleared!</span>
              <Trophy className="w-5 h-5" />
            </button>
          )}

          <div className="flex gap-2">
            <button
              id="btn-replay-level"
              onClick={onReplay}
              title="Replay Sector"
              className="w-12 h-12 bg-[#1f2937] hover:bg-[#283548] active:bg-[#111827] text-slate-200 rounded-xl border-b-4 border-gray-900 transition-colors flex items-center justify-center cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              id="btn-modal-level-select"
              onClick={onLevelSelect}
              title="Sector Roster"
              className="w-12 h-12 bg-[#1f2937] hover:bg-[#283548] active:bg-[#111827] text-slate-200 rounded-xl border-b-4 border-gray-900 transition-colors flex items-center justify-center cursor-pointer"
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
