import React from 'react';
import { RotateCcw, Volume2, VolumeX, Grid, HelpCircle, Star, Sparkles, Gamepad2 } from 'lucide-react';
import { LevelData } from '../types';

interface HUDProps {
  level: LevelData;
  starsCollected: number;
  totalStars: number;
  cargoLoaded: number;
  totalCargo: number;
  levelTimeSec: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onRestart: () => void;
  onOpenLevelSelect: () => void;
  onOpenHelp: () => void;
  onOpenSandbox?: () => void;
  onOpenTitleScreen?: () => void;
  showJoystick?: boolean;
  onToggleJoystick?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  level,
  starsCollected,
  totalStars,
  cargoLoaded,
  totalCargo,
  levelTimeSec,
  isMuted,
  onToggleMute,
  onRestart,
  onOpenLevelSelect,
  onOpenHelp,
  onOpenSandbox,
  onOpenTitleScreen,
  showJoystick = false,
  onToggleJoystick,
}) => {
  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    const cs = Math.floor((sec % 1) * 100).toString().padStart(2, '0');
    return `${mins}:${s}.${cs}`;
  };

  const levelFormatted = level.id < 10 ? `0${level.id}` : `${level.id}`;
  const cleanTitle = level.title.replace(/^Level \d+:\s*/i, '');

  return (
    <header
      id="game-hud"
      className="h-16 border-b-4 border-[#2d333b] flex items-center justify-between px-3 sm:px-8 bg-[#161b22] z-20 shadow-xl shrink-0 select-none w-full"
    >
      {/* Left: Boxrob Brand Badge & Sector Assignment */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Boxrob Brand Badge Button */}
        {onOpenTitleScreen && (
          <button
            id="btn-hud-brand"
            onClick={onOpenTitleScreen}
            title="Open Boxrob Title & Cover Screen"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] border-2 border-amber-500/60 rounded-lg cursor-pointer transition-all active:scale-95 group shadow-md"
          >
            <span className="font-black text-xs sm:text-sm tracking-wider uppercase text-white group-hover:text-amber-400 font-tactical">
              BOXROB
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500 group-hover:animate-ping" />
          </button>
        )}

        {/* Sector Assignment */}
        <div className="flex flex-col justify-center">
          <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold font-tactical leading-none">
            Sector Assignment
          </span>
          <span className="text-sm sm:text-xl font-black italic tracking-tight text-white uppercase truncate max-w-[140px] sm:max-w-xs md:max-w-sm mt-0.5">
            LEVEL {levelFormatted}: {cleanTitle}
          </span>
        </div>

        {/* Industrial Tactical Divider */}
        <div className="h-8 w-[2px] bg-[#2d333b] hidden md:block" />

        {/* Objective with glowing square pips */}
        <div className="hidden sm:flex items-center gap-3.5">
          <div className="flex flex-col justify-center">
            <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider leading-none">
              Objective
            </span>
            <span className="text-xs sm:text-sm font-mono-num font-bold text-slate-200 mt-0.5">
              LOAD CRATES: {cargoLoaded.toString().padStart(2, '0')} / {totalCargo.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            {Array.from({ length: Math.max(totalCargo, 1) }).map((_, idx) => {
              const isFilled = idx < cargoLoaded;
              return (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-sm transition-all duration-300 ${
                    isFilled
                      ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b] scale-105'
                      : 'bg-[#21262d] border border-[#2d333b]'
                  }`}
                  title={isFilled ? 'Loaded' : 'Pending'}
                />
              );
            })}
          </div>
        </div>

        {/* Stars Telemetry Divider & Stars Pips */}
        <div className="h-8 w-[2px] bg-[#2d333b] hidden lg:block" />
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex flex-col justify-center">
            <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider leading-none">
              Stars Found
            </span>
            <span className="text-xs font-mono-num font-bold text-amber-400 mt-0.5">
              {starsCollected} / {totalStars}
            </span>
          </div>
          <div className="flex items-center gap-1 pt-1">
            {Array.from({ length: totalStars }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < starsCollected
                    ? 'text-amber-400 fill-amber-400 shadow-[0_0_6px_#f59e0b]'
                    : 'text-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right: Shift Timer & Tactical Action Buttons */}
      <div className="flex items-center gap-3 sm:gap-7">
        {/* Shift Timer */}
        <div className="text-right hidden xs:flex flex-col justify-center">
          <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider leading-none">
            Shift Timer
          </span>
          <span className="text-base sm:text-2xl font-mono-num font-bold text-amber-400 tracking-tight mt-0.5">
            {formatTimer(levelTimeSec)}
          </span>
        </div>

        {/* Tactical Control Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onOpenSandbox && (
            <button
              id="btn-hud-sandbox"
              onClick={onOpenSandbox}
              title="Spawn Physics Crates"
              className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-amber-500/30 flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/60 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          <button
            id="btn-hud-restart"
            onClick={onRestart}
            title="Reset Sector (R)"
            className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-amber-500/30 flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/60 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            id="btn-hud-levels"
            onClick={onOpenLevelSelect}
            title="Sector Roster"
            className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-amber-500/30 flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/60 active:scale-95 transition-all cursor-pointer"
          >
            <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {onToggleJoystick && (
            <button
              id="btn-hud-joystick"
              onClick={onToggleJoystick}
              title={showJoystick ? 'Virtual Joystick: ON (Click to toggle)' : 'Virtual Joystick: OFF (Click to toggle)'}
              className={`w-8 h-8 sm:w-10 sm:h-10 border-2 flex items-center justify-center rounded-lg active:scale-95 transition-all cursor-pointer ${
                showJoystick
                  ? 'border-amber-400 bg-amber-500/25 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-400/70 hover:bg-amber-500/20 hover:border-amber-500/60'
              }`}
            >
              <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          <button
            id="btn-hud-sound"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-amber-500/30 flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/60 active:scale-95 transition-all cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>

          <button
            id="btn-hud-help"
            onClick={onOpenHelp}
            title="Operator Manual"
            className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-amber-500/30 flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/60 active:scale-95 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
