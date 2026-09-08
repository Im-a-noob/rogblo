import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { GameEngine } from '../physics/gameEngine';
import { BoxType, LevelData, Particle } from '../types';

export interface GameCanvasHandle {
  spawnCrate: (type: BoxType) => void;
  restart: () => void;
  getTimeSec: () => number;
  setAimOffset: (x: number, y: number) => void;
  toggleMagnet: (forceState?: boolean) => void;
  triggerJump: () => void;
  setSteerLeft: (active: boolean) => void;
  setSteerRight: (active: boolean) => void;
  isMagnetActive: () => boolean;
}

interface GameCanvasProps {
  level: LevelData;
  onLevelComplete: (timeSec: number, starsEarned: number, allStarsFound: boolean) => void;
  onStarCollected: (count: number, total: number) => void;
  onSlotFilled: (filledCount: number, totalCount: number) => void;
  onTimeUpdate?: (sec: number) => void;
  isPaused: boolean;
  onRestartRequest?: () => void;
  touchInput?: {
    left: boolean;
    right: boolean;
    jump: boolean;
    magnet: boolean;
    aimOffset?: { x: number; y: number } | null;
  };
}

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function GameCanvas(
  {
    level,
    onLevelComplete,
    onStarCollected,
    onSlotFilled,
    onTimeUpdate,
    isPaused,
    onRestartRequest,
    touchInput,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [, setRerender] = useState(0);

  // Expose imperative methods to parent
  useImperativeHandle(ref, () => ({
    spawnCrate: (type: BoxType) => {
      if (!engineRef.current) return;
      const eng = engineRef.current;
      const spawnX = eng.robotChassis.position.x;
      const spawnY = eng.robotChassis.position.y - 70;
      eng.spawnCrate({
        id: `crate_spawn_${Date.now()}`,
        x: spawnX,
        y: spawnY,
        width: 44,
        height: 44,
        type,
        isCargo: type === 'wood',
      });
      eng.addDustParticles(spawnX, spawnY, 8);
    },
    restart: () => {
      if (engineRef.current) {
        engineRef.current.initLevel();
      }
    },
    getTimeSec: () => engineRef.current?.levelTimeSec || 0,
    setAimOffset: (x: number, y: number) => {
      if (engineRef.current) {
        engineRef.current.setAimOffset(x, y);
      }
    },
    toggleMagnet: (forceState?: boolean) => {
      if (engineRef.current) {
        engineRef.current.toggleMagnet(forceState);
      }
    },
    triggerJump: () => {
      if (engineRef.current) {
        engineRef.current.triggerJump();
      }
    },
    setSteerLeft: (active: boolean) => {
      if (engineRef.current) {
        engineRef.current.input.left = active;
      }
    },
    setSteerRight: (active: boolean) => {
      if (engineRef.current) {
        engineRef.current.input.right = active;
      }
    },
    isMagnetActive: () => engineRef.current?.isMagnetActive ?? false,
  }));

  // Conveyor animation step
  const conveyorOffsetRef = useRef<number>(0);

  // Initialize Game Engine
  useEffect(() => {
    const engine = new GameEngine(level, {
      onLevelComplete,
      onStarCollected,
      onSlotFilled,
    });
    engineRef.current = engine;
    engine.start();

    return () => {
      engine.stop();
    };
  }, [level, onLevelComplete, onStarCollected, onSlotFilled]);

  // Sync touch controls
  useEffect(() => {
    if (!engineRef.current || !touchInput) return;
    const eng = engineRef.current;
    eng.input.left = touchInput.left;
    eng.input.right = touchInput.right;
    if (touchInput.jump && !eng.input.jump) {
      eng.triggerJump();
    }
    eng.input.jump = touchInput.jump;
    if (touchInput.magnet !== eng.isMagnetActive) {
      eng.toggleMagnet(touchInput.magnet);
    }
    if (touchInput.aimOffset) {
      eng.setAimOffset(touchInput.aimOffset.x, touchInput.aimOffset.y);
    }
  }, [touchInput]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current || isPaused) return;
      const eng = engineRef.current;

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        eng.input.left = true;
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        eng.input.right = true;
      } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        if (!eng.input.jump) {
          eng.triggerJump();
        }
        eng.input.jump = true;
      } else if (e.code === 'Space' || e.code === 'KeyE') {
        e.preventDefault();
        eng.toggleMagnet();
      } else if (e.code === 'KeyR') {
        if (onRestartRequest) onRestartRequest();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      const eng = engineRef.current;

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        eng.input.left = false;
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        eng.input.right = false;
      } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        eng.input.jump = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPaused, onRestartRequest]);

  // Helper to convert screen pointer to aim offset anchored to the robot's current position
  const updateAimFromPointer = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current || !engineRef.current) return;
    const canvas = canvasRef.current;
    const eng = engineRef.current;
    if (!eng.robotChassis) return;

    const rect = canvas.getBoundingClientRect();
    const touchX = clientX - rect.left;
    const touchY = clientY - rect.top;
    const cssW = rect.width;
    const cssH = rect.height;
    const isMobile = cssW < 768;
    const zoom = isMobile ? Math.min(1.0, Math.max(0.65, cssW / 760)) : 1.0;

    // Robot shoulder pivot in world coordinates (centered on chassis to prevent glitching)
    const pivotX = eng.robotChassis.position.x;
    const pivotY = eng.robotChassis.position.y - 12;

    // Projected position of the robot shoulder pivot on screen
    const pivotScreenX = cssW / 2 + (pivotX - eng.camera.x) * zoom;
    const pivotScreenY = cssH / 2 + (pivotY - eng.camera.y) * zoom;

    // World offset from current robot shoulder position to tap location
    const offsetWorldX = (touchX - pivotScreenX) / zoom;
    const offsetWorldY = (touchY - pivotScreenY) / zoom;

    eng.setAimOffset(offsetWorldX, offsetWorldY);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || isPaused) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    updateAimFromPointer(e.clientX, e.clientY);

    // If mouse click (desktop), primary click toggles magnet
    if (e.pointerType === 'mouse' && e.button === 0) {
      engineRef.current.toggleMagnet();
    }
  }, [isPaused, updateAimFromPointer]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || isPaused) return;
    updateAimFromPointer(e.clientX, e.clientY);
  }, [isPaused, updateAimFromPointer]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || isPaused) return;
    if (e.touches.length > 0) {
      const touch = e.touches[e.touches.length - 1];
      updateAimFromPointer(touch.clientX, touch.clientY);
    }
  }, [isPaused, updateAimFromPointer]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || isPaused) return;
    if (e.touches.length > 0) {
      const touch = e.touches[e.touches.length - 1];
      updateAimFromPointer(touch.clientX, touch.clientY);
    }
  }, [isPaused, updateAimFromPointer]);

  // Main Render Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const eng = engineRef.current;
      if (canvas && container && eng) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const rect = container.getBoundingClientRect();
          const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
          const cssW = rect.width;
          const cssH = rect.height;
          const targetW = Math.round(cssW * dpr);
          const targetH = Math.round(cssH * dpr);

          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }

          // Complete reset of context transform matrix to prevent DPR compounding
          ctx.setTransform(1, 0, 0, 1, 0, 0);

          // Clear physical buffer
          ctx.clearRect(0, 0, targetW, targetH);

          // Scale for Retina/High-DPI displays so world coordinates map to CSS pixels
          ctx.scale(dpr, dpr);

          // Responsive zoom: keeps the robot and puzzle area nicely framed on both desktop & mobile
          const isMobile = cssW < 768;
          const zoom = isMobile ? Math.min(1.0, Math.max(0.65, cssW / 760)) : 1.0;

          ctx.save();

          // Center camera directly on the robot
          ctx.translate(cssW / 2, cssH / 2);
          ctx.scale(zoom, zoom);
          ctx.translate(-eng.camera.x, -eng.camera.y);

          const viewW = Math.max(1600, cssW / zoom);
          const viewH = Math.max(1200, cssH / zoom);

          // 1. Render Background Warehouse Environment
          drawWarehouseBackground(ctx, eng.camera.x, eng.camera.y, viewW, viewH);

          // 2. Render Platforms
          eng.platforms.forEach((p) => {
            drawPlatform(ctx, p);
          });

          // 3. Render Elevators & Conveyors
          eng.elevators.forEach((elev) => {
            drawElevator(ctx, elev);
          });

          conveyorOffsetRef.current += 1.5;
          eng.conveyors.forEach((cv) => {
            drawConveyor(ctx, cv, conveyorOffsetRef.current);
          });

          // 4. Render Switches & Doors
          eng.switches.forEach((sw) => {
            drawSwitch(ctx, sw);
          });

          eng.doors.forEach((d) => {
            drawDoor(ctx, d);
          });

          // 5. Render Destructible Walls
          eng.destructibleWalls.forEach((dw) => {
            drawDestructibleWall(ctx, dw);
          });

          // 6. Render Delivery Truck
          drawTruck(ctx, eng);

          // 7. Render Stars
          eng.stars.forEach((s) => {
            drawStar(ctx, s);
          });

          // 8. Render Crates
          eng.crateBodies.forEach((c) => {
            drawCrate(ctx, c);
          });

          // 9. Render Robot Forklift & Crane Arm
          drawRobot(ctx, eng);

          // 10. Render Particles
          drawParticles(ctx, eng.particles);

          // 11. Render Targeting Crosshair
          drawCrosshair(ctx, eng);

          ctx.restore();

          // 12. Off-screen Objective Radar Beacons (Points to boxes and truck)
          drawOffscreenIndicators(ctx, eng, cssW, cssH, zoom);

          if (onTimeUpdate && Math.floor(eng.levelTimeSec * 10) % 3 === 0) {
            onTimeUpdate(eng.levelTimeSec);
          }
        }
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [onTimeUpdate]);

  // ResizeObserver for canvas resolution
  useEffect(() => {
    const handleResize = () => {
      setRerender((v) => v + 1);
    };

    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      id="game-canvas-container"
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden bg-slate-950 cursor-crosshair touch-none"
    >
      <canvas
        id="game-canvas"
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handlePointerUp}
        onTouchCancel={handlePointerUp}
        className="w-full h-full block touch-none"
      />
    </div>
  );
});

// ----------------- DRAWING HELPERS ----------------- //

function drawWarehouseBackground(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number
) {
  // Olive-teal dark industrial warehouse background (authentic Boxrob palette)
  const bgGrad = ctx.createLinearGradient(camX, camY - 600, camX, camY + 600);
  bgGrad.addColorStop(0, '#1a2521');
  bgGrad.addColorStop(0.4, '#24332d');
  bgGrad.addColorStop(1, '#16201c');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(camX - viewW, camY - viewH, viewW * 2, viewH * 2);

  ctx.save();

  // 1. Metal Wall Panels with Seam Lines & Rivets
  ctx.strokeStyle = '#151e1a';
  ctx.lineWidth = 2.5;
  for (let y = -400; y < 1600; y += 140) {
    ctx.beginPath();
    ctx.moveTo(camX - viewW, y);
    ctx.lineTo(camX + viewW, y);
    ctx.stroke();

    // Rivet dots along horizontal seams
    ctx.fillStyle = '#2e3f38';
    for (let x = -400; x < 2400; x += 48) {
      ctx.beginPath();
      ctx.arc(x, y - 4, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Vertical panel seams
  for (let x = -300; x < 2400; x += 320) {
    ctx.strokeStyle = 'rgba(21, 30, 26, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, -600);
    ctx.lineTo(x, 1600);
    ctx.stroke();
  }

  // 2. Vertical Hazard Warning Columns (Left and Right warehouse pillars like in Boxrob cover)
  const drawHazardColumn = (colX: number) => {
    const colW = 34;
    ctx.save();
    ctx.fillStyle = '#18211d';
    ctx.fillRect(colX, -500, colW, 2000);
    ctx.strokeStyle = '#0e1411';
    ctx.lineWidth = 2;
    ctx.strokeRect(colX, -500, colW, 2000);

    // Diagonal hazard stripes on vertical pillar
    ctx.beginPath();
    ctx.rect(colX, -500, colW, 2000);
    ctx.clip();
    ctx.fillStyle = '#f59e0b';
    for (let y = -600; y < 1800; y += 36) {
      ctx.beginPath();
      ctx.moveTo(colX, y);
      ctx.lineTo(colX + colW, y + colW);
      ctx.lineTo(colX + colW, y + colW + 18);
      ctx.lineTo(colX, y + 18);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  drawHazardColumn(-160);
  drawHazardColumn(780);
  drawHazardColumn(1650);

  // 3. Wall Grunge / Oil Splatters
  const splatters = [
    { x: 120, y: 220, r: 24 },
    { x: 480, y: 340, r: 32 },
    { x: 920, y: 180, r: 20 },
    { x: 1300, y: 280, r: 28 },
  ];
  ctx.fillStyle = 'rgba(12, 18, 15, 0.45)';
  splatters.forEach((s) => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.arc(s.x + s.r * 0.5, s.y - s.r * 0.4, s.r * 0.4, 0, Math.PI * 2);
    ctx.arc(s.x - s.r * 0.6, s.y + s.r * 0.3, s.r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  });

  // 4. Overhead Warehouse Spotlight
  for (let lx = 200; lx < 1800; lx += 420) {
    // Lamp fixture
    ctx.fillStyle = '#1c2622';
    ctx.fillRect(lx - 12, 40, 24, 14);
    ctx.strokeStyle = '#0f1714';
    ctx.lineWidth = 2;
    ctx.strokeRect(lx - 12, 40, 24, 14);

    // Warm spotlight cone
    const spotGrad = ctx.createRadialGradient(lx, 54, 10, lx, 400, 280);
    spotGrad.addColorStop(0, 'rgba(254, 240, 138, 0.18)');
    spotGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.05)');
    spotGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.moveTo(lx - 8, 54);
    ctx.lineTo(lx - 200, 650);
    ctx.lineTo(lx + 200, 650);
    ctx.lineTo(lx + 8, 54);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawPlatform(ctx: CanvasRenderingContext2D, p: Matter.Body) {
  ctx.save();
  ctx.translate(p.position.x, p.position.y);
  ctx.rotate(p.angle);

  const bounds = p.bounds;
  const w = bounds.max.x - bounds.min.x;
  const h = bounds.max.y - bounds.min.y;

  // 1. Heavy industrial steel plate body
  ctx.fillStyle = '#21262d';
  ctx.strokeStyle = '#0d1117';
  ctx.lineWidth = 2.5;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  // Vertical corrugated steel ribs
  if (w > 40 && h > 20) {
    ctx.strokeStyle = '#161b22';
    ctx.lineWidth = 2;
    for (let x = -w / 2 + 18; x < w / 2 - 10; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, -h / 2 + 10);
      ctx.lineTo(x, h / 2 - 4);
      ctx.stroke();
    }
  }

  // 2. Authentic Boxrob Diagonal Hazard Caution Top Runner
  const hazardH = Math.min(10, Math.max(6, h * 0.35));
  ctx.save();
  ctx.beginPath();
  ctx.rect(-w / 2, -h / 2, w, hazardH);
  ctx.clip();

  // Black background
  ctx.fillStyle = '#111827';
  ctx.fillRect(-w / 2, -h / 2, w, hazardH);

  // Amber stripes angled at 45°
  ctx.fillStyle = '#f59e0b';
  const stripeW = 12;
  for (let x = -w / 2 - hazardH * 2; x < w / 2 + hazardH * 2; x += stripeW * 2) {
    ctx.beginPath();
    ctx.moveTo(x, -h / 2);
    ctx.lineTo(x + stripeW, -h / 2);
    ctx.lineTo(x + stripeW - hazardH, -h / 2 + hazardH);
    ctx.lineTo(x - hazardH, -h / 2 + hazardH);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Horizontal dividing border below hazard striping
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2 + hazardH);
  ctx.lineTo(w / 2, -h / 2 + hazardH);
  ctx.stroke();

  // Corner steel rivets
  ctx.fillStyle = '#6e7681';
  ctx.strokeStyle = '#21262d';
  ctx.lineWidth = 1;
  const rivetOffset = 8;
  const rY = h > 24 ? h / 2 - 7 : 0;
  [-w / 2 + rivetOffset, w / 2 - rivetOffset].forEach((rx) => {
    ctx.beginPath();
    ctx.arc(rx, rY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
}

function drawElevator(
  ctx: CanvasRenderingContext2D,
  elev: { body: Matter.Body; startY: number; targetY: number }
) {
  const p = elev.body.position;
  const bounds = elev.body.bounds;
  const w = bounds.max.x - bounds.min.x;
  const h = bounds.max.y - bounds.min.y;

  ctx.save();
  // Vertical guide rail behind elevator
  const minY = Math.min(elev.startY, elev.targetY) - 10;
  const maxY = Math.max(elev.startY, elev.targetY) + 10;
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(p.x - w / 2 + 10, minY);
  ctx.lineTo(p.x - w / 2 + 10, maxY);
  ctx.moveTo(p.x + w / 2 - 10, minY);
  ctx.lineTo(p.x + w / 2 - 10, maxY);
  ctx.stroke();

  // Scissor lift frame
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(p.x - w / 3, p.y);
  ctx.lineTo(p.x + w / 3, maxY);
  ctx.moveTo(p.x + w / 3, p.y);
  ctx.lineTo(p.x - w / 3, maxY);
  ctx.stroke();

  // Platform deck
  ctx.translate(p.x, p.y);
  ctx.fillStyle = '#0f766e'; // teal industrial elevator
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = '#14b8a6';
  ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  // Direction chevron indicator
  ctx.fillStyle = '#2dd4bf';
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(0, -6);
  ctx.lineTo(10, 0);
  ctx.lineTo(0, 4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawConveyor(
  ctx: CanvasRenderingContext2D,
  cv: { body: Matter.Body; direction: 1 | -1; speed: number },
  offset: number
) {
  const p = cv.body.position;
  const bounds = cv.body.bounds;
  const w = bounds.max.x - bounds.min.x;
  const h = bounds.max.y - bounds.min.y;

  ctx.save();
  ctx.translate(p.x, p.y);

  // Conveyor metal casing
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-w / 2, -h / 2, w, h);

  // Rollers on ends
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(-w / 2 + h / 2, 0, h / 2 - 2, 0, Math.PI * 2);
  ctx.arc(w / 2 - h / 2, 0, h / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // Moving belt treads
  ctx.save();
  ctx.beginPath();
  ctx.rect(-w / 2, -h / 2, w, 6);
  ctx.clip();
  ctx.fillStyle = '#0284c7';
  const shift = (offset * cv.direction) % 18;
  for (let x = -w / 2 - 20; x < w / 2 + 20; x += 18) {
    const curX = x + shift;
    ctx.beginPath();
    ctx.moveTo(curX, -h / 2);
    ctx.lineTo(curX + 6 * cv.direction, -h / 2 + 6);
    ctx.lineTo(curX + 2 * cv.direction, -h / 2 + 6);
    ctx.lineTo(curX - 4 * cv.direction, -h / 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}

function drawSwitch(
  ctx: CanvasRenderingContext2D,
  sw: { body: Matter.Body; pressed: boolean; baseHeight: number }
) {
  const p = sw.body.position;
  const bounds = sw.body.bounds;
  const w = bounds.max.x - bounds.min.x;
  const h = bounds.max.y - bounds.min.y;

  ctx.save();
  ctx.translate(p.x, p.y);

  // Industrial switch base
  ctx.fillStyle = '#334155';
  ctx.fillRect(-w / 2, -h / 2, w, h);

  // Button cap (lowers when pressed)
  const capHeight = sw.pressed ? 4 : 8;
  const capY = sw.pressed ? -h / 2 + 3 : -h / 2 - 3;

  ctx.fillStyle = sw.pressed ? '#22c55e' : '#eab308';
  ctx.fillRect(-w / 2 + 4, capY, w - 8, capHeight);

  // Glow if active
  if (sw.pressed) {
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 10;
  }
  ctx.strokeStyle = sw.pressed ? '#86efac' : '#fde047';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-w / 2 + 4, capY, w - 8, capHeight);

  ctx.restore();
}

function drawDoor(
  ctx: CanvasRenderingContext2D,
  door: { body: Matter.Body }
) {
  const p = door.body.position;
  const bounds = door.body.bounds;
  const w = bounds.max.x - bounds.min.x;
  const h = bounds.max.y - bounds.min.y;

  ctx.save();
  ctx.translate(p.x, p.y);

  // Heavy steel blast door
  ctx.fillStyle = '#475569';
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  // Horizontal reinforcing ridges
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  for (let y = -h / 2 + 15; y < h / 2; y += 20) {
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 2, y);
    ctx.lineTo(w / 2 - 2, y);
    ctx.stroke();
  }

  // Red/Orange hazard warning stripes
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, 6);
  ctx.fillRect(-w / 2 + 2, h / 2 - 8, w - 4, 6);

  ctx.restore();
}

function drawDestructibleWall(
  ctx: CanvasRenderingContext2D,
  dw: { body: Matter.Body; def: { width: number; height: number } }
) {
  const p = dw.body.position;
  const w = dw.def.width;
  const h = dw.def.height;

  ctx.save();
  ctx.translate(p.x, p.y);

  // Cracked stone / brick wall
  ctx.fillStyle = '#78716c';
  ctx.fillRect(-w / 2, -h / 2, w, h);

  // Brick rows
  ctx.strokeStyle = '#44403c';
  ctx.lineWidth = 2;
  for (let y = -h / 2 + 16; y < h / 2; y += 16) {
    ctx.beginPath();
    ctx.moveTo(-w / 2, y);
    ctx.lineTo(w / 2, y);
    ctx.stroke();
  }

  // Crack lightning lines
  ctx.strokeStyle = '#292524';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.lineTo(-6, -h / 6);
  ctx.lineTo(8, h / 6);
  ctx.lineTo(-4, h / 2);
  ctx.stroke();

  ctx.restore();
}

function drawTruck(ctx: CanvasRenderingContext2D, eng: GameEngine) {
  const t = eng.level.truck;
  const truckX = t.x + eng.truckDriveOffX;
  const truckY = t.y;

  ctx.save();
  ctx.translate(truckX, truckY);

  // 1. Truck Cargo Bed & Chassis
  ctx.fillStyle = '#1e232a';
  ctx.fillRect(-22, 4, 154, 16);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-22, 4, 154, 16);

  // Hazard stripe safety band along truck bed
  ctx.save();
  ctx.beginPath();
  ctx.rect(-22, 12, 154, 8);
  ctx.clip();
  ctx.fillStyle = '#111827';
  ctx.fillRect(-22, 12, 154, 8);
  ctx.fillStyle = '#f59e0b';
  for (let x = -30; x < 154; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 12);
    ctx.lineTo(x + 8, 12);
    ctx.lineTo(x, 20);
    ctx.lineTo(x - 8, 20);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 2. Cargo Bed Back Guard & Tailgate
  ctx.fillStyle = '#334155';
  ctx.fillRect(-26, -42, 8, 48);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(-26, -42, 8, 48);

  // Tailgate animation when completed
  if (eng.truckCompleted) {
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-26, -72, 8, 30);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(-26, -72, 8, 30);
  }

  // 3. Cabin (Right side) - Boxrob Heavy Industrial Hauler
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(115, -52, 58, 62);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(115, -52, 58, 62);

  // Cabin roof bevel
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(116, -51, 56, 6);

  // Tinted Windshield
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(145, -45, 23, 28);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(145, -45, 23, 28);
  // Glass glare
  ctx.fillStyle = '#e0f2fe';
  ctx.beginPath();
  ctx.moveTo(148, -43);
  ctx.lineTo(156, -43);
  ctx.lineTo(150, -22);
  ctx.lineTo(146, -22);
  ctx.closePath();
  ctx.fill();

  // Headlight beam
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(170, -14, 5, 12);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(170, -14, 5, 12);

  const beamGrad = ctx.createRadialGradient(175, -8, 2, 260, -8, 80);
  beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
  beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(175, -8);
  ctx.lineTo(270, -40);
  ctx.lineTo(270, 25);
  ctx.closePath();
  ctx.fill();

  // Exhaust pipe
  ctx.fillStyle = '#64748b';
  ctx.fillRect(117, -72, 6, 22);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(117, -72, 6, 22);

  if (eng.truckCompleted) {
    ctx.fillStyle = 'rgba(203, 213, 225, 0.8)';
    ctx.beginPath();
    ctx.arc(120, -78, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(114, -88, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Heavy Truck Wheels matching monster knobby design
  const drawTruckWheel = (wx: number, wy: number) => {
    ctx.save();
    ctx.translate(wx, wy);

    // Black tire with knobby outline
    ctx.fillStyle = '#181a1f';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Yellow hubcap
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center bolt
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  drawTruckWheel(0, 20);
  drawTruckWheel(60, 20);
  drawTruckWheel(142, 20);

  // 5. Cargo Bay Slot Targets (Dotted glowing outlines)
  eng.truckSlots.forEach((slot, idx) => {
    ctx.save();
    const sx = slot.xOffset;
    const sy = slot.yOffset;

    if (slot.isFilled) {
      ctx.strokeStyle = '#22c55e';
      ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
    } else {
      ctx.strokeStyle = '#f59e0b';
      ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
    }

    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(sx - slot.width / 2, sy - slot.height / 2, slot.width, slot.height);
    ctx.fillRect(sx - slot.width / 2, sy - slot.height / 2, slot.width, slot.height);

    // Box silhouette icon inside slot
    ctx.fillStyle = slot.isFilled ? '#86efac' : '#fbbf24';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(slot.isFilled ? '✓' : `📦 #${idx + 1}`, sx, sy);

    ctx.restore();
  });

  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  star: { x: number; y: number; collected: boolean; animOffset: number }
) {
  if (star.collected) return;
  const time = performance.now() * 0.003 + star.animOffset;
  const bobY = star.y + Math.sin(time * 1.5) * 5;

  ctx.save();
  ctx.translate(star.x, bobY);
  ctx.rotate(time * 0.8);

  // Outer golden glow
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 12;

  // Star shape (5 points)
  ctx.fillStyle = '#facc15';
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const rOuter = 15;
    const rInner = 7;
    const angleOuter = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const angleInner = angleOuter + Math.PI / 5;
    if (i === 0) {
      ctx.moveTo(Math.cos(angleOuter) * rOuter, Math.sin(angleOuter) * rOuter);
    } else {
      ctx.lineTo(Math.cos(angleOuter) * rOuter, Math.sin(angleOuter) * rOuter);
    }
    ctx.lineTo(Math.cos(angleInner) * rInner, Math.sin(angleInner) * rInner);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Center sparkle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCrate(
  ctx: CanvasRenderingContext2D,
  c: { body: Matter.Body; def: { width: number; height: number; type: string } }
) {
  const p = c.body.position;
  const w = c.def.width;
  const h = c.def.height;
  const type = c.def.type;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(c.body.angle);

  if (type === 'metal') {
    // Heavy Steel Crate
    ctx.fillStyle = '#27303f';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    // Hazard Stripes in center
    ctx.save();
    ctx.beginPath();
    ctx.rect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12);
    ctx.clip();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = '#111827';
    for (let x = -w * 1.5; x < w * 1.5; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, -h);
      ctx.lineTo(x + 7, -h);
      ctx.lineTo(x - 7, h);
      ctx.lineTo(x - 14, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 4 Corner Metal Brackets with Screws
    drawCornerBracketsAndScrews(ctx, w, h, '#64748b', '#cbd5e1');
  } else if (type === 'tnt') {
    // Red Explosive TNT Crate
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    // Stencil "TNT" text
    ctx.fillStyle = '#fef08a';
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TNT', 0, 0);

    // Fuse on top with spark
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.quadraticCurveTo(4, -h / 2 - 6, 2, -h / 2 - 9);
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(2, -h / 2 - 9, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 4 Corner Metal Brackets with Screws
    drawCornerBracketsAndScrews(ctx, w, h, '#7f1d1d', '#fecaca');
  } else if (type === 'bouncy') {
    // Lime Bouncy Rubber Crate
    ctx.fillStyle = '#15803d';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    // Spring icon
    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -6, 6, 0, Math.PI);
    ctx.arc(0, 0, 6, Math.PI, 0);
    ctx.arc(0, 6, 6, 0, Math.PI);
    ctx.stroke();

    // 4 Corner Metal Brackets with Screws
    drawCornerBracketsAndScrews(ctx, w, h, '#166534', '#bbf7d0');
  } else {
    // Standard Authentic Boxrob Wooden Crate (Exactly as in reference image)
    // 1. Vertical Wood Planks (3 planks)
    const plankW = w / 3;
    for (let i = 0; i < 3; i++) {
      const px = -w / 2 + i * plankW;
      // Plank base gradient
      const woodGrad = ctx.createLinearGradient(px, -h / 2, px + plankW, -h / 2);
      woodGrad.addColorStop(0, '#d97706');
      woodGrad.addColorStop(0.5, '#b45309');
      woodGrad.addColorStop(1, '#92400e');
      ctx.fillStyle = woodGrad;
      ctx.fillRect(px, -h / 2, plankW, h);

      // Fine vertical woodgrain lines
      ctx.strokeStyle = 'rgba(69, 26, 3, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + plankW * 0.35, -h / 2);
      ctx.lineTo(px + plankW * 0.35, h / 2);
      ctx.moveTo(px + plankW * 0.7, -h / 2);
      ctx.lineTo(px + plankW * 0.7, h / 2);
      ctx.stroke();

      // Dark seam between planks
      if (i > 0) {
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(px, -h / 2);
        ctx.lineTo(px, h / 2);
        ctx.stroke();
      }
    }

    // 2. Perimeter Steel Frame Plates (Grey metal border)
    const frameW = 4;
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-w / 2, -h / 2, w, frameW); // top
    ctx.fillRect(-w / 2, h / 2 - frameW, w, frameW); // bottom
    ctx.fillRect(-w / 2, -h / 2, frameW, h); // left
    ctx.fillRect(w / 2 - frameW, -h / 2, frameW, h); // right

    // Top metal highlight
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-w / 2, -h / 2, w, 1.5);

    // 3. Four Corner L-Brackets with 8 Screw Rivets (2 per corner)
    drawCornerBracketsAndScrews(ctx, w, h, '#71717a', '#cbd5e1');

    // 4. Heavy Black Outer Comic Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
  }

  ctx.restore();
}

// Helper to draw 4 corner brackets with 2 screw rivets in each corner (8 rivets total)
function drawCornerBracketsAndScrews(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bracketColor: string,
  screwColor: string
) {
  const bw = Math.min(13, w * 0.32);
  const bh = Math.min(13, h * 0.32);
  const armThick = 4.5;

  ctx.fillStyle = bracketColor;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;

  // Function for an L-bracket in a corner
  const drawLBracket = (cx: number, cy: number, sx: 1 | -1, sy: 1 | -1) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + sx * bw, cy);
    ctx.lineTo(cx + sx * bw, cy + sy * armThick);
    ctx.lineTo(cx + sx * armThick, cy + sy * armThick);
    ctx.lineTo(cx + sx * armThick, cy + sy * bh);
    ctx.lineTo(cx, cy + sy * bh);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2 Screws in each corner
    const drawScrew = (x: number, y: number) => {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = screwColor;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
      // Screw slot line
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x - 1.2, y);
      ctx.lineTo(x + 1.2, y);
      ctx.stroke();
    };

    drawScrew(cx + sx * (bw * 0.65), cy + sy * (armThick * 0.5));
    drawScrew(cx + sx * (armThick * 0.5), cy + sy * (bh * 0.65));
  };

  drawLBracket(-w / 2, -h / 2, 1, 1); // Top-left
  drawLBracket(w / 2, -h / 2, -1, 1); // Top-right
  drawLBracket(-w / 2, h / 2, 1, -1); // Bottom-left
  drawLBracket(w / 2, h / 2, -1, -1); // Bottom-right
}

function drawRobot(ctx: CanvasRenderingContext2D, eng: GameEngine) {
  const chassis = eng.robotChassis;
  const wheelL = eng.robotWheelLeft;
  const wheelR = eng.robotWheelRight;
  const facing = eng.robotFacing;

  ctx.save();

  // 1. Draw Crane Arm Base Column & Shoulder Pivot
  const centerX = chassis.position.x;
  const centerY = chassis.position.y;
  const mastW = 16;
  const mastH = 26;
  const shoulderPivotX = centerX;
  const shoulderPivotY = centerY - 18;

  // Mast Body (Industrial Yellow with Black Border)
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(chassis.angle);

  // Chassis Connecting Bar between wheels
  ctx.fillStyle = '#f59e0b';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-24, 6, 48, 10, 4);
  ctx.fill();
  ctx.stroke();

  // Center Hexagon Link (Trademark Boxrob central hexagon emblem!)
  const hexR = 10;
  const drawHex = (r: number) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const hx = Math.cos(a) * r;
      const hy = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
  };

  // Outer yellow hexagon with black outline
  ctx.save();
  ctx.translate(0, 11);
  ctx.fillStyle = '#f59e0b';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  drawHex(hexR);
  ctx.fill();
  ctx.stroke();

  // Inner black hexagon cutout
  ctx.fillStyle = '#000000';
  drawHex(hexR * 0.45);
  ctx.fill();
  ctx.restore();

  // Vertical Mast Column
  ctx.fillStyle = '#f59e0b';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-mastW / 2, -18, mastW, mastH, 3);
  ctx.fill();
  ctx.stroke();

  // 3 Diagonal Hazard Stripes/Cutouts on Mast (///)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-mastW / 2 + 1, -17, mastW - 2, mastH - 2, 2);
  ctx.clip();
  ctx.fillStyle = '#000000';
  for (let sy = -18; sy < 8; sy += 7) {
    ctx.beginPath();
    ctx.moveTo(-mastW / 2 - 2, sy);
    ctx.lineTo(mastW / 2 + 2, sy - 8);
    ctx.lineTo(mastW / 2 + 2, sy - 5);
    ctx.lineTo(-mastW / 2 - 2, sy + 3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Shoulder Joint Disc (Concentric yellow and black circles)
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(0, -18, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(0, -18, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Center shoulder rivet
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(0, -18, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 2. Articulated Hydraulic Crane Arm Boom
  const tipX = eng.craneTipPos.x;
  const tipY = eng.craneTipPos.y;
  const angle = eng.armAngle;
  const armLen = eng.armExtension;

  // Upper boom segment
  const midLen = armLen * 0.52;
  const midX = shoulderPivotX + Math.cos(angle) * midLen;
  const midY = shoulderPivotY + Math.sin(angle) * midLen;

  // Main yellow boom casing
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(shoulderPivotX, shoulderPivotY);
  ctx.lineTo(midX, midY);
  ctx.stroke();

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 7.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(shoulderPivotX, shoulderPivotY);
  ctx.lineTo(midX, midY);
  ctx.stroke();

  // Mid-joint elbow pin
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(midX, midY, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(midX, midY, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Telescoping chrome hydraulic ram
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(midX, midY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(midX, midY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  // 3. Robotic Grabber Head & Dual Claws / Pincers (Exact Boxrob Art)
  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(angle);

  // Orange curved dome/bell wrist head
  ctx.fillStyle = '#ea580c';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, 9, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(-4, 9);
  ctx.lineTo(-4, -9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner wrist highlight
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(-1, 0, 6, -Math.PI / 2, Math.PI / 2);
  ctx.fill();

  // Jaw articulation angle: closes when holding a crate, opens slightly when idle
  const isHolding = !!eng.heldCrate;
  const isMagActive = eng.isMagnetActive;
  const jawSpread = isHolding ? 0.22 : 0.48; // radians

  // Helper to draw an articulated metallic pincer jaw
  const drawJaw = (isUpper: boolean) => {
    ctx.save();
    const sign = isUpper ? -1 : 1;
    ctx.rotate(sign * jawSpread);

    // Pivot bolt
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(4, sign * 5, 3, 0, Math.PI * 2);
    ctx.fill();

    // Metallic claw arm
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, sign * 3);
    ctx.lineTo(16, sign * 7);
    ctx.lineTo(24, sign * 14); // angled elbow hook
    ctx.lineTo(28, sign * 5);  // sharp hooked tip inward
    ctx.lineTo(18, sign * 3);
    ctx.lineTo(4, sign * 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Claw metallic bevel highlight
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(6, sign * 2.5);
    ctx.lineTo(16, sign * 5);
    ctx.lineTo(22, sign * 11);
    ctx.lineTo(20, sign * 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  // Draw upper and lower claws
  drawJaw(true);
  drawJaw(false);

  // 4. Electric Blue Lightning Arcs & Glowing Aura (Authentic Boxrob Lightning Effect!)
  if (isMagActive) {
    ctx.save();

    // Bright cyan aura glow
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 18;

    // Electric lightning bolt crackling between the two claw tips
    const t = performance.now() * 0.01;
    const clawTipUpperX = 22;
    const clawTipUpperY = -Math.sin(jawSpread) * 18 - 4;
    const clawTipLowerX = 22;
    const clawTipLowerY = Math.sin(jawSpread) * 18 + 4;

    const drawLightningPath = (lineWidth: number, strokeColor: string) => {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(clawTipUpperX, clawTipUpperY);

      // 4-step randomized jagged lightning zigzags
      const steps = 4;
      for (let s = 1; s < steps; s++) {
        const frac = s / steps;
        const lx = clawTipUpperX + (clawTipLowerX - clawTipUpperX) * frac + (Math.sin(t * 7 + s * 3) * 6);
        const ly = clawTipUpperY + (clawTipLowerY - clawTipUpperY) * frac + (Math.cos(t * 8 + s * 4) * 4);
        ctx.lineTo(lx, ly);
      }
      ctx.lineTo(clawTipLowerX, clawTipLowerY);
      ctx.stroke();
    };

    // Cyan outer glow arc
    drawLightningPath(4.5, '#0284c7');
    drawLightningPath(2.8, '#38bdf8');
    // Hot white electric core
    drawLightningPath(1.2, '#ffffff');

    // Electric sparks jumping outward
    for (let sp = 0; sp < 4; sp++) {
      const sparkA = (sp * Math.PI) / 2 + Math.sin(t + sp) * 0.5;
      const sparkDist = 8 + (Math.sin(t * 12 + sp) * 6);
      ctx.fillStyle = sp % 2 === 0 ? '#67e8f9' : '#ffffff';
      ctx.beginPath();
      ctx.arc(22 + Math.cos(sparkA) * sparkDist, Math.sin(sparkA) * sparkDist, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  ctx.restore();

  // 5. Heavy Knobby Boxrob Monster Wheels
  const drawMonsterWheel = (w: Matter.Body) => {
    ctx.save();
    ctx.translate(w.position.x, w.position.y);
    ctx.rotate(w.angle);

    const outerR = 17;
    const hubR = 11;
    const toothCount = 16;
    const toothH = 4.2;

    // 1. Knobby Outer Tread Gear Teeth
    ctx.fillStyle = '#181a1f';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < toothCount; i++) {
      const a1 = (i * Math.PI * 2) / toothCount;
      const a2 = a1 + (Math.PI * 2) / (toothCount * 2.2);
      const a3 = a1 + (Math.PI * 2) / toothCount;

      // Base point
      const bx1 = Math.cos(a1) * outerR;
      const by1 = Math.sin(a1) * outerR;
      // Tooth tip
      const tx = Math.cos(a2) * (outerR + toothH);
      const ty = Math.sin(a2) * (outerR + toothH);
      // Next base point
      const bx2 = Math.cos(a3) * outerR;
      const by2 = Math.sin(a3) * outerR;

      if (i === 0) ctx.moveTo(bx1, by1);
      ctx.lineTo(tx, ty);
      ctx.lineTo(bx2, by2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Tire Rubber Sidewall Ring
    ctx.fillStyle = '#21252d';
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner tire groove
    ctx.strokeStyle = '#12151a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, outerR - 2.5, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Golden-Yellow Wheel Hubcap
    const hubGrad = ctx.createLinearGradient(-hubR, -hubR, hubR, hubR);
    hubGrad.addColorStop(0, '#fbbf24');
    hubGrad.addColorStop(0.5, '#f59e0b');
    hubGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = hubGrad;
    ctx.beginPath();
    ctx.arc(0, 0, hubR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // 4. Three Triangular Bolt Holes in Hub (at 120° intervals)
    for (let h = 0; h < 3; h++) {
      const ha = (h * Math.PI * 2) / 3;
      const hx = Math.cos(ha) * 6;
      const hy = Math.sin(ha) * 6;

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(hx, hy, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 5. Central Steel Axle Pin
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(-0.8, -0.8, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Draw left and right monster wheels
  drawMonsterWheel(wheelL);
  drawMonsterWheel(wheelR);

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach((p) => {
    const alpha = Math.max(0, 1 - p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;

    if (p.type === 'smoke' || p.type === 'dust' || p.type === 'fire') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'spark' || p.type === 'star') {
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    } else {
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.restore();
  });
}

function drawCrosshair(ctx: CanvasRenderingContext2D, eng: GameEngine) {
  const mx = eng.mousePos.x;
  const my = eng.mousePos.y;
  const isHeld = !!eng.heldCrate;
  const isMagnet = eng.isMagnetActive;

  ctx.save();
  ctx.translate(mx, my);

  ctx.strokeStyle = isHeld ? '#22c55e' : isMagnet ? '#38bdf8' : 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;

  // Aiming reticle ring
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.stroke();

  // Cross lines
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, -9);
  ctx.moveTo(0, 9);
  ctx.lineTo(0, 18);
  ctx.moveTo(-18, 0);
  ctx.lineTo(-9, 0);
  ctx.moveTo(9, 0);
  ctx.lineTo(18, 0);
  ctx.stroke();

  // Center dot
  ctx.fillStyle = isHeld ? '#22c55e' : isMagnet ? '#38bdf8' : '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawOffscreenIndicators(
  ctx: CanvasRenderingContext2D,
  eng: GameEngine,
  cssW: number,
  cssH: number,
  zoom: number
) {
  const marginX = 52;
  const marginY = 40;
  const bottomMargin = 95; // Room for on-screen controls

  // 1. Point to un-loaded Cargo Crates
  eng.crateBodies.forEach((c) => {
    if (!c.def.isCargo) return;

    const wx = c.body.position.x;
    const wy = c.body.position.y;
    const sx = cssW / 2 + (wx - eng.camera.x) * zoom;
    const sy = cssH / 2 + (wy - eng.camera.y) * zoom;

    const isOffscreen =
      sx < marginX || sx > cssW - marginX || sy < marginY || sy > cssH - bottomMargin;

    if (isOffscreen) {
      const dx = wx - eng.camera.x;
      const dy = wy - eng.camera.y;
      const distMeters = Math.max(1, Math.round(Math.hypot(dx, dy) / 30));

      const cx = Math.max(marginX, Math.min(cssW - marginX, sx));
      const cy = Math.max(marginY, Math.min(cssH - bottomMargin, sy));

      ctx.save();
      ctx.translate(cx, cy);

      // Radar Beacon Badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;

      const pillW = 86;
      const pillH = 26;
      ctx.beginPath();
      ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const arrow = dx >= 0 ? '▶' : '◀';
      ctx.fillText(dx >= 0 ? `📦 BOX ${distMeters}m ${arrow}` : `${arrow} 📦 BOX ${distMeters}m`, 0, 0);

      ctx.restore();
    }
  });

  // 2. Point to Delivery Truck
  const tx = eng.level.truck.x + 40;
  const ty = eng.level.truck.y;
  const sx = cssW / 2 + (tx - eng.camera.x) * zoom;
  const sy = cssH / 2 + (ty - eng.camera.y) * zoom;

  const isOffscreen =
    sx < marginX || sx > cssW - marginX || sy < marginY || sy > cssH - bottomMargin;

  if (isOffscreen && eng.heldCrate) {
    const dx = tx - eng.camera.x;
    const dy = ty - eng.camera.y;
    const distMeters = Math.max(1, Math.round(Math.hypot(dx, dy) / 30));

    const cx = Math.max(marginX, Math.min(cssW - marginX, sx));
    const cy = Math.max(marginY, Math.min(cssH - bottomMargin, sy));

    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 8;

    const pillW = 96;
    const pillH = 26;
    ctx.beginPath();
    ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#86efac';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const arrow = dx >= 0 ? '▶' : '◀';
    ctx.fillText(dx >= 0 ? `🚚 TRUCK ${distMeters}m ${arrow}` : `${arrow} 🚚 TRUCK ${distMeters}m`, 0, 0);

    ctx.restore();
  }
}
