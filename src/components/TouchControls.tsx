import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Zap } from 'lucide-react';
import { VirtualJoystick } from './VirtualJoystick';

interface TouchControlsProps {
  onLeftChange: (active: boolean) => void;
  onRightChange: (active: boolean) => void;
  onJumpChange: (active: boolean) => void;
  onMagnetToggle: () => void;
  isMagnetActive: boolean;
  onAimChange?: (offset: { x: number; y: number }) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onLeftChange,
  onRightChange,
  onJumpChange,
  onMagnetToggle,
  isMagnetActive,
  onAimChange,
}) => {
  const [leftActive, setLeftActive] = useState(false);
  const [rightActive, setRightActive] = useState(false);
  const [jumpActive, setJumpActive] = useState(false);

  // Persistent pointer tracking
  const leftPointerId = useRef<number | null>(null);
  const rightPointerId = useRef<number | null>(null);
  const activeJumpPointers = useRef<Set<number>>(new Set());

  // LEFT STEERING HANDLERS
  const handleLeftDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      leftPointerId.current = e.pointerId;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setLeftActive(true);
      onLeftChange(true);
    },
    [onLeftChange]
  );

  const handleLeftUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (leftPointerId.current !== null && e.pointerId === leftPointerId.current) {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
        } catch {
          // ignore
        }
        leftPointerId.current = null;
        setLeftActive(false);
        onLeftChange(false);
      }
    },
    [onLeftChange]
  );

  // RIGHT STEERING HANDLERS
  const handleRightDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      rightPointerId.current = e.pointerId;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setRightActive(true);
      onRightChange(true);
    },
    [onRightChange]
  );

  const handleRightUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (rightPointerId.current !== null && e.pointerId === rightPointerId.current) {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
        } catch {
          // ignore
        }
        rightPointerId.current = null;
        setRightActive(false);
        onRightChange(false);
      }
    },
    [onRightChange]
  );

  // UNIVERSAL JUMP HANDLERS (Works for both Left and Right Jump buttons)
  const handleJumpDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      activeJumpPointers.current.add(e.pointerId);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setJumpActive(true);
      onJumpChange(true);
    },
    [onJumpChange]
  );

  const handleJumpUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      activeJumpPointers.current.delete(e.pointerId);
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore
      }
      if (activeJumpPointers.current.size === 0) {
        setJumpActive(false);
        onJumpChange(false);
      }
    },
    [onJumpChange]
  );

  return (
    <div
      id="touch-controls-container"
      className="absolute bottom-2 left-2 right-2 flex items-end justify-between pointer-events-none z-30 select-none touch-none max-w-full"
    >
      {/* LEFT ZONE: Steering D-Pad (Left Thumb - Pure Directional Control) */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#10141d]/85 border border-[#2d333b]/80 backdrop-blur-md shadow-2xl pointer-events-auto select-none touch-none shrink-0">
        <button
          id="btn-touch-left"
          onPointerDown={handleLeftDown}
          onPointerUp={handleLeftUp}
          onPointerCancel={handleLeftUp}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 flex items-center justify-center shadow-md backdrop-blur-md transition-colors duration-75 touch-none cursor-pointer ${
            leftActive
              ? 'bg-amber-400 border-amber-200 text-black shadow-[0_0_18px_rgba(245,158,11,0.7)]'
              : 'bg-[#161b22] border-[#2d333b] text-slate-100 hover:border-amber-500/40'
          }`}
          style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
          title="Steer Left (A or ←)"
        >
          <ArrowLeft className={`w-7 h-7 ${leftActive ? 'stroke-[2.5]' : ''}`} />
        </button>

        <button
          id="btn-touch-right"
          onPointerDown={handleRightDown}
          onPointerUp={handleRightUp}
          onPointerCancel={handleRightUp}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 flex items-center justify-center shadow-md backdrop-blur-md transition-colors duration-75 touch-none cursor-pointer ${
            rightActive
              ? 'bg-amber-400 border-amber-200 text-black shadow-[0_0_18px_rgba(245,158,11,0.7)]'
              : 'bg-[#161b22] border-[#2d333b] text-slate-100 hover:border-amber-500/40'
          }`}
          style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
          title="Steer Right (D or →)"
        >
          <ArrowRight className={`w-7 h-7 ${rightActive ? 'stroke-[2.5]' : ''}`} />
        </button>
      </div>

      {/* RIGHT ZONE: Crane Joystick & Dedicated Action Cluster (Right Thumb) */}
      <div className="flex items-end gap-2 pointer-events-auto select-none touch-none shrink-0">
        {/* Virtual 360° Joystick for Crane Arm */}
        {onAimChange && (
          <VirtualJoystick onAimChange={onAimChange} />
        )}

        {/* Dedicated Dual Action Buttons: Primary Jump & Magnet Grab */}
        <div className="flex flex-col items-center gap-1.5 p-1.5 rounded-2xl bg-[#10141d]/80 border border-[#2d333b]/80 backdrop-blur-md shadow-2xl select-none touch-none">
          {/* Primary Action Jump Button (Right Hand) - Solves running jump accessibility! */}
          <button
            id="btn-touch-jump-right"
            onPointerDown={handleJumpDown}
            onPointerUp={handleJumpUp}
            onPointerCancel={handleJumpUp}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 flex flex-col items-center justify-center shadow-lg transition-colors duration-75 touch-none cursor-pointer ${
              jumpActive
                ? 'bg-amber-400 border-amber-200 text-black shadow-[0_0_20px_rgba(245,158,11,0.8)] ring-2 ring-amber-300/50'
                : 'bg-amber-500/90 border-amber-600 text-slate-950 hover:bg-amber-400'
            }`}
            style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
            title="Jump (Space / W / ↑)"
          >
            <ArrowUp className="w-6 h-6 stroke-[3]" />
            <span className="text-[10px] font-black uppercase tracking-wider font-tactical">
              JUMP
            </span>
          </button>

          {/* Quick Magnet Claw Action Button */}
          <button
            id="btn-touch-magnet"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMagnetToggle();
            }}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 flex flex-col items-center justify-center shadow-lg backdrop-blur-md transition-colors duration-75 touch-none cursor-pointer ${
              isMagnetActive
                ? 'bg-cyan-500/30 border-cyan-300 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.6)] ring-2 ring-cyan-400/50'
                : 'bg-[#161b22] border-[#2d333b] text-slate-300 hover:border-cyan-500/40'
            }`}
            style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
            title="Toggle Magnetic Claw (Space or Click)"
          >
            <Zap className={`w-5 h-5 ${isMagnetActive ? 'fill-cyan-400 text-cyan-300 animate-pulse' : ''}`} />
            <span className="text-[9px] font-black uppercase mt-0.5 tracking-wider font-tactical">
              {isMagnetActive ? 'RELEASE' : 'GRAB'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
