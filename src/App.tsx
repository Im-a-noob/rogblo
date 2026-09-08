import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GameCanvas, GameCanvasHandle } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { OperatorConsole } from './components/OperatorConsole';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { TouchControls } from './components/TouchControls';
import { HelpModal } from './components/HelpModal';
import { SandboxDrawer } from './components/SandboxDrawer';
import { TitleScreen } from './components/TitleScreen';
import { LEVELS } from './physics/levels';
import { BoxType, LevelProgress } from './types';
import { sounds } from './audio/soundEffects';

const STORAGE_KEY = 'boxrob_progress_v1';

export default function App() {
  const canvasRef = useRef<GameCanvasHandle>(null);

  // Level & Progress State
  const [currentLevelId, setCurrentLevelId] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('boxrob_last_level');
      if (saved) {
        const id = parseInt(saved, 10);
        if (LEVELS.some((l) => l.id === id)) return id;
      }
    } catch {
      // ignore
    }
    return 1;
  });

  const [progressMap, setProgressMap] = useState<Record<number, LevelProgress>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  // HUD and Live State
  const [cargoLoaded, setCargoLoaded] = useState<number>(0);
  const [totalCargo, setTotalCargo] = useState<number>(1);
  const [starsCollected, setStarsCollected] = useState<number>(0);
  const [levelTimeSec, setLevelTimeSec] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  const [showJoystick, setShowJoystick] = useState<boolean>(() => {
    return (
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || window.innerWidth <= 840)
    );
  });

  // Modals
  const [titleScreenOpen, setTitleScreenOpen] = useState<boolean>(false);
  const [levelSelectOpen, setLevelSelectOpen] = useState<boolean>(false);
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const [sandboxOpen, setSandboxOpen] = useState<boolean>(false);
  const [victoryData, setVictoryData] = useState<{
    timeSec: number;
    starsEarned: number;
    allStarsFound: boolean;
  } | null>(null);

  // Touch & console controls input
  const [touchInput, setTouchInput] = useState<{
    left: boolean;
    right: boolean;
    jump: boolean;
    magnet: boolean;
    aimOffset?: { x: number; y: number } | null;
  }>({
    left: false,
    right: false,
    jump: false,
    magnet: false,
    aimOffset: null,
  });

  // Current Level Data
  const currentLevel = useMemo(() => {
    return LEVELS.find((l) => l.id === currentLevelId) || LEVELS[0];
  }, [currentLevelId]);

  // Total required cargo
  useEffect(() => {
    setTotalCargo(currentLevel.truck.slots.length);
    setCargoLoaded(0);
    setStarsCollected(0);
    setLevelTimeSec(0);
    setVictoryData(null);
  }, [currentLevel]);

  // Detect touch device
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth <= 840
      );
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);

    const onFirstTouch = () => {
      setIsTouchDevice(true);
    };
    window.addEventListener('touchstart', onFirstTouch, { passive: true });

    return () => {
      window.removeEventListener('resize', checkTouch);
      window.removeEventListener('touchstart', onFirstTouch);
    };
  }, []);

  // Save progress
  const saveProgress = useCallback((levelId: number, starsEarned: number, timeSec: number) => {
    setProgressMap((prev) => {
      const existing = prev[levelId] || { stars: 0, completed: false };
      const updated: LevelProgress = {
        completed: true,
        stars: Math.max(existing.stars, starsEarned),
        bestTimeSec: existing.bestTimeSec ? Math.min(existing.bestTimeSec, timeSec) : timeSec,
      };
      const nextMap = { ...prev, [levelId]: updated };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMap));
      } catch {
        // ignore
      }
      return nextMap;
    });
  }, []);

  // Handlers
  const handleLevelComplete = useCallback((timeSec: number, starsEarned: number, allStarsFound: boolean) => {
    saveProgress(currentLevelId, starsEarned, timeSec);
    setVictoryData({ timeSec, starsEarned, allStarsFound });
  }, [currentLevelId, saveProgress]);

  const handleStarCollected = useCallback((count: number) => {
    setStarsCollected(count);
  }, []);

  const handleSlotFilled = useCallback((filled: number, total: number) => {
    setCargoLoaded(filled);
    setTotalCargo(total);
  }, []);

  const handleRestart = useCallback(() => {
    setVictoryData(null);
    setCargoLoaded(0);
    setStarsCollected(0);
    setLevelTimeSec(0);
    if (canvasRef.current) {
      canvasRef.current.restart();
    }
  }, []);

  const handleSelectLevel = useCallback((id: number) => {
    setCurrentLevelId(id);
    try {
      localStorage.setItem('boxrob_last_level', id.toString());
    } catch {
      // ignore
    }
    setVictoryData(null);
    setCargoLoaded(0);
    setStarsCollected(0);
    setLevelTimeSec(0);
  }, []);

  const handleNextLevel = useCallback(() => {
    const nextId = currentLevelId + 1;
    if (LEVELS.some((l) => l.id === nextId)) {
      handleSelectLevel(nextId);
    } else {
      setLevelSelectOpen(true);
      setVictoryData(null);
    }
  }, [currentLevelId, handleSelectLevel]);

  const handleToggleMute = useCallback(() => {
    const muted = sounds.toggleMute();
    setIsMuted(!muted);
  }, []);

  const handleSpawnCrate = useCallback((type: BoxType) => {
    if (canvasRef.current) {
      canvasRef.current.spawnCrate(type);
    }
  }, []);

  const handleLeftSteer = useCallback((active: boolean) => {
    canvasRef.current?.setSteerLeft(active);
    setTouchInput((p) => (p.left === active ? p : { ...p, left: active }));
  }, []);

  const handleRightSteer = useCallback((active: boolean) => {
    canvasRef.current?.setSteerRight(active);
    setTouchInput((p) => (p.right === active ? p : { ...p, right: active }));
  }, []);

  const handleJump = useCallback((active: boolean) => {
    if (active) {
      canvasRef.current?.triggerJump();
    }
    setTouchInput((p) => (p.jump === active ? p : { ...p, jump: active }));
  }, []);

  const handleMagnetToggle = useCallback(() => {
    canvasRef.current?.toggleMagnet();
    const currentActive = canvasRef.current?.isMagnetActive() ?? false;
    setTouchInput((p) => ({ ...p, magnet: currentActive }));
  }, []);

  return (
    <main className="w-screen h-screen bg-[#0f1115] text-white flex flex-col overflow-hidden font-sans select-none">
      {/* Top Sector Assignment Bar (HUD) */}
      <HUD
        level={currentLevel}
        starsCollected={starsCollected}
        totalStars={currentLevel.stars?.length || 3}
        cargoLoaded={cargoLoaded}
        totalCargo={totalCargo}
        levelTimeSec={levelTimeSec}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onRestart={handleRestart}
        onOpenLevelSelect={() => {
          setIsPaused(true);
          setLevelSelectOpen(true);
        }}
        onOpenHelp={() => {
          setIsPaused(true);
          setHelpOpen(true);
        }}
        onOpenSandbox={() => setSandboxOpen(true)}
        onOpenTitleScreen={() => {
          setIsPaused(true);
          setTitleScreenOpen(true);
        }}
        showJoystick={showJoystick}
        onToggleJoystick={() => setShowJoystick((p) => !p)}
      />

      {/* Center Game Field with Industrial Dot-Grid & Structural Accents */}
      <div className="relative flex-1 bg-[#1a1d23] overflow-hidden flex flex-col">
        {/* Tactical dot-matrix overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none dot-grid" />

        {/* Industrial Support Beams */}
        <div className="absolute left-[-50px] top-40 w-8 h-[600px] bg-[#2d333b] rounded-full rotate-[-45deg] opacity-20 pointer-events-none" />
        <div className="absolute right-20 bottom-[-50px] w-12 h-[400px] bg-[#2d333b] rounded-full rotate-[15deg] opacity-20 pointer-events-none" />

        {/* Physics Game Canvas */}
        <GameCanvas
          key={`level-canvas-${currentLevelId}`}
          ref={canvasRef}
          level={currentLevel}
          onLevelComplete={handleLevelComplete}
          onStarCollected={handleStarCollected}
          onSlotFilled={handleSlotFilled}
          onTimeUpdate={(sec) => setLevelTimeSec(sec)}
          isPaused={isPaused || !!victoryData || levelSelectOpen || helpOpen || titleScreenOpen}
          onRestartRequest={handleRestart}
          touchInput={touchInput}
        />

        {/* Touch / Virtual Joystick Controls */}
        {(isTouchDevice || showJoystick) && !victoryData && !levelSelectOpen && !helpOpen && !titleScreenOpen && !sandboxOpen && (
          <TouchControls
            onLeftChange={handleLeftSteer}
            onRightChange={handleRightSteer}
            onJumpChange={handleJump}
            onMagnetToggle={handleMagnetToggle}
            isMagnetActive={touchInput.magnet}
            onAimChange={(offset) => {
              if (canvasRef.current) {
                canvasRef.current.setAimOffset(offset.x, offset.y);
              }
            }}
          />
        )}
      </div>

      {/* Bottom Operator Console Bar */}
      <OperatorConsole
        onLeftChange={handleLeftSteer}
        onRightChange={handleRightSteer}
        onJumpChange={handleJump}
        onMagnetToggle={handleMagnetToggle}
        onRestart={handleRestart}
        isMagnetActive={touchInput.magnet}
        cargoLoaded={cargoLoaded}
        totalCargo={totalCargo}
        hint={currentLevel.hint}
      />

      {/* Level Complete Victory Screen */}
      {victoryData && (
        <LevelCompleteModal
          level={currentLevel}
          timeSec={victoryData.timeSec}
          starsEarned={victoryData.starsEarned}
          allStarsFound={victoryData.allStarsFound}
          hasNextLevel={currentLevelId < LEVELS.length}
          onNextLevel={handleNextLevel}
          onReplay={handleRestart}
          onLevelSelect={() => {
            setVictoryData(null);
            setLevelSelectOpen(true);
          }}
        />
      )}

      {/* Level Select Dialog */}
      {levelSelectOpen && (
        <LevelSelectModal
          levels={LEVELS}
          currentLevelId={currentLevelId}
          progressMap={progressMap}
          onSelectLevel={handleSelectLevel}
          onClose={() => {
            setLevelSelectOpen(false);
            setIsPaused(false);
          }}
        />
      )}

      {/* Help Dialog */}
      {helpOpen && (
        <HelpModal
          onClose={() => {
            setHelpOpen(false);
            setIsPaused(false);
          }}
        />
      )}

      {/* Sandbox Spawner Drawer */}
      <SandboxDrawer
        isOpen={sandboxOpen}
        onClose={() => setSandboxOpen(false)}
        onSpawnCrate={handleSpawnCrate}
      />

      {/* Boxrob Cover / Title Screen Modal matching reference */}
      <TitleScreen
        isOpen={titleScreenOpen}
        onClose={() => {
          setTitleScreenOpen(false);
          setIsPaused(false);
        }}
        onStartGame={() => {
          setTitleScreenOpen(false);
          setIsPaused(false);
        }}
        onOpenLevelSelect={() => {
          setTitleScreenOpen(false);
          setLevelSelectOpen(true);
        }}
        onOpenHelp={() => {
          setTitleScreenOpen(false);
          setHelpOpen(true);
        }}
      />
    </main>
  );
}
