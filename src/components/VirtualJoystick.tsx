import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Compass, Crosshair, RotateCcw } from 'lucide-react';

interface VirtualJoystickProps {
  onAimChange: (offset: { x: number; y: number }) => void;
  disabled?: boolean;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onAimChange,
  disabled = false,
}) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [aimAngleDeg, setAimAngleDeg] = useState<number>(-45);
  const [reachPercent, setReachPercent] = useState<number>(75);
  const activePointerId = useRef<number | null>(null);

  const maxRadius = 46; // Max knob displacement from center in px

  const processPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!baseRef.current || disabled) return;
      const rect = baseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist < 4) {
        // Center deadzone
        setKnobPos({ x: 0, y: 0 });
        return;
      }

      const clampedDist = Math.min(dist, maxRadius);
      const angle = Math.atan2(dy, dx);
      const knobX = Math.cos(angle) * clampedDist;
      const knobY = Math.sin(angle) * clampedDist;

      setKnobPos({ x: knobX, y: knobY });

      const norm = Math.max(0.1, clampedDist / maxRadius);
      // Crane arm reach: min 45px to max 135px
      const reach = 45 + norm * 90;
      const aimX = Math.cos(angle) * reach;
      const aimY = Math.sin(angle) * reach;

      // Update feedback info
      let deg = Math.round((angle * 180) / Math.PI);
      setAimAngleDeg(deg);
      setReachPercent(Math.round(norm * 100));

      onAimChange({ x: aimX, y: aimY });
    },
    [disabled, maxRadius, onAimChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    activePointerId.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(true);
    processPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || e.pointerId !== activePointerId.current) return;
    e.preventDefault();
    processPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activePointerId.current) return;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    setIsDragging(false);
    activePointerId.current = null;
    // Spring knob back to center while maintaining aimed direction on the crane
    setKnobPos({ x: 0, y: 0 });
  };

  const handleResetAim = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAimAngleDeg(-45);
    setReachPercent(75);
    const rad = (-45 * Math.PI) / 180;
    const reach = 85;
    onAimChange({ x: Math.cos(rad) * reach, y: Math.sin(rad) * reach });
  };

  return (
    <div className="flex flex-col items-center select-none touch-none pointer-events-auto">
      {/* Tactical Status Tag above Joystick */}
      <div className="flex items-center justify-between w-32 px-1.5 py-0.5 mb-1 bg-black/80 border border-amber-500/40 rounded text-[10px] font-tactical text-amber-300 tracking-wider shadow-md backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <Crosshair className="w-3 h-3 text-amber-400" />
          <span>CRANE AIM</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono-num text-[9px] text-amber-400 font-bold">
          <span>{aimAngleDeg}°</span>
          <span className="text-gray-500">|</span>
          <span>{reachPercent}%</span>
        </div>
      </div>

      {/* Main Joystick Bezel & Track */}
      <div
        id="crane-virtual-joystick"
        ref={baseRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-32 h-32 sm:w-36 sm:h-36 rounded-full border-2 cursor-grab active:cursor-grabbing transition-colors duration-200 shadow-2xl flex items-center justify-center ${
          isDragging
            ? 'bg-[#12161f]/95 border-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.35)]'
            : 'bg-[#10141d]/85 border-[#2d333b] hover:border-amber-500/50 shadow-black/80'
        }`}
        style={{
          touchAction: 'none',
        }}
        title="Crane Arm Joystick: Drag in any direction to aim and extend arm"
      >
        {/* Radial Markings / Compass Reticle */}
        <div className="absolute inset-2 rounded-full border border-dashed border-amber-500/20 pointer-events-none" />
        <div className="absolute inset-5 rounded-full border border-slate-700/50 pointer-events-none" />

        {/* Crosshair Axes */}
        <div className="absolute top-1 bottom-1 w-px bg-slate-700/40 pointer-events-none" />
        <div className="absolute left-1 right-1 h-px bg-slate-700/40 pointer-events-none" />

        {/* Direction Labels */}
        <span className="absolute top-1 text-[8px] font-tactical font-black text-slate-500 pointer-events-none uppercase">
          UP
        </span>
        <span className="absolute bottom-1 text-[8px] font-tactical font-black text-slate-500 pointer-events-none uppercase">
          DN
        </span>
        <span className="absolute left-1.5 text-[8px] font-tactical font-black text-slate-500 pointer-events-none uppercase">
          L
        </span>
        <span className="absolute right-1.5 text-[8px] font-tactical font-black text-slate-500 pointer-events-none uppercase">
          R
        </span>

        {/* Directional Laser / Vector Line when dragging */}
        {isDragging && (knobPos.x !== 0 || knobPos.y !== 0) && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <line
              x1="50%"
              y1="50%"
              x2={`calc(50% + ${knobPos.x}px)`}
              y2={`calc(50% + ${knobPos.y}px)`}
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeDasharray="3 2"
              strokeLinecap="round"
              className="animate-pulse"
            />
          </svg>
        )}

        {/* Last Aim Direction Needle (Subtle tick on ring when idle) */}
        {!isDragging && (
          <div
            className="absolute w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] pointer-events-none transition-all duration-300"
            style={{
              transform: `translate(${Math.cos((aimAngleDeg * Math.PI) / 180) * 44}px, ${
                Math.sin((aimAngleDeg * Math.PI) / 180) * 44
              }px)`,
            }}
          />
        )}

        {/* Floating Joystick Thumb Knob */}
        <div
          className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center shadow-2xl transition-transform duration-75 pointer-events-none ${
            isDragging
              ? 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-200 text-black scale-105 shadow-[0_0_16px_rgba(245,158,11,0.6)]'
              : 'bg-gradient-to-b from-[#242b35] to-[#161b22] border-[#3d4554] text-amber-400'
          }`}
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        >
          {/* Knob Center Texture */}
          <div className="w-6 h-6 rounded-full border border-black/30 flex items-center justify-center bg-black/20">
            <Compass className={`w-3.5 h-3.5 ${isDragging ? 'text-black animate-spin' : 'text-amber-400/80'}`} />
          </div>
        </div>
      </div>

      {/* Small Reset Button */}
      <button
        onClick={handleResetAim}
        className="mt-1 flex items-center gap-1 text-[9px] font-tactical text-gray-400 hover:text-amber-300 active:scale-95 transition-all py-0.5 px-2 rounded bg-[#161b22]/60 border border-gray-800 pointer-events-auto"
        title="Reset Crane to 45° carry angle"
      >
        <RotateCcw className="w-2.5 h-2.5" />
        <span>RESET AIM</span>
      </button>
    </div>
  );
};
