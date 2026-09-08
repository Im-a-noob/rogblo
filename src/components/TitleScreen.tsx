import React, { useEffect, useRef } from 'react';
import { Play, Grid, HelpCircle, Sparkles, X } from 'lucide-react';

interface TitleScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: () => void;
  onOpenLevelSelect: () => void;
  onOpenHelp: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  isOpen,
  onClose,
  onStartGame,
  onOpenLevelSelect,
  onOpenHelp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = performance.now();

    const render = () => {
      const now = performance.now();
      const elapsed = (now - startTime) * 0.001;

      const w = canvas.width;
      const h = canvas.height;

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      // 1. Olive-teal dark industrial warehouse background (authentic Boxrob)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#1c2824');
      bgGrad.addColorStop(0.5, '#273630');
      bgGrad.addColorStop(1, '#18221e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Horizontal metal seams & rivets
      ctx.strokeStyle = '#141d19';
      ctx.lineWidth = 2;
      for (let y = 60; y < h; y += 90) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        ctx.fillStyle = '#2f4038';
        for (let x = 20; x < w; x += 36) {
          ctx.beginPath();
          ctx.arc(x, y - 3, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Vertical Hazard Columns on far sides
      const drawCol = (colX: number) => {
        const colW = 32;
        ctx.save();
        ctx.fillStyle = '#16201b';
        ctx.fillRect(colX, 0, colW, h);
        ctx.strokeStyle = '#0d1310';
        ctx.lineWidth = 2;
        ctx.strokeRect(colX, 0, colW, h);

        ctx.beginPath();
        ctx.rect(colX, 0, colW, h);
        ctx.clip();
        ctx.fillStyle = '#f59e0b';
        for (let y = -40; y < h + 40; y += 32) {
          ctx.beginPath();
          ctx.moveTo(colX, y);
          ctx.lineTo(colX + colW, y + colW);
          ctx.lineTo(colX + colW, y + colW + 16);
          ctx.lineTo(colX, y + 16);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      };
      drawCol(6);
      drawCol(w - 38);

      // Wall grunge splatters
      ctx.fillStyle = 'rgba(12, 18, 15, 0.4)';
      [
        { x: 140, y: 120, r: 24 },
        { x: w - 160, y: 160, r: 28 },
      ].forEach((s) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.arc(s.x + 12, s.y - 8, s.r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Overhead warm spotlight cone
      const spotGrad = ctx.createRadialGradient(w / 2, 20, 10, w / 2, h * 0.65, w * 0.45);
      spotGrad.addColorStop(0, 'rgba(254, 240, 138, 0.22)');
      spotGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.06)');
      spotGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 40, 0);
      ctx.lineTo(w / 2 - w * 0.4, h);
      ctx.lineTo(w / 2 + w * 0.4, h);
      ctx.lineTo(w / 2 + 40, 0);
      ctx.closePath();
      ctx.fill();

      // 2. Main Platform
      const platY = h * 0.72;
      const platH = h - platY;

      // Platform body
      ctx.fillStyle = '#21262d';
      ctx.strokeStyle = '#0d1117';
      ctx.lineWidth = 3;
      ctx.fillRect(0, platY, w, platH);
      ctx.strokeRect(0, platY, w, platH);

      // Corrugated vertical lines
      ctx.strokeStyle = '#161b22';
      ctx.lineWidth = 2;
      for (let x = 40; x < w - 40; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, platY + 16);
        ctx.lineTo(x, h - 10);
        ctx.stroke();
      }

      // Top Hazard Runner Band
      const hazardH = 14;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, platY, w, hazardH);
      ctx.clip();
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, platY, w, hazardH);
      ctx.fillStyle = '#f59e0b';
      for (let x = -40; x < w + 40; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, platY);
        ctx.lineTo(x + 14, platY);
        ctx.lineTo(x, platY + hazardH);
        ctx.lineTo(x - 14, platY + hazardH);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, platY + hazardH);
      ctx.lineTo(w, platY + hazardH);
      ctx.stroke();

      // 3. Render Authentic Boxrob Wooden Crate
      const crateX = w * 0.72;
      const crateY = platY - 32;
      const crateS = 64;

      ctx.save();
      ctx.translate(crateX, crateY);

      // 3 vertical wood planks
      const plankW = crateS / 3;
      for (let i = 0; i < 3; i++) {
        const px = -crateS / 2 + i * plankW;
        const woodGrad = ctx.createLinearGradient(px, -crateS / 2, px + plankW, -crateS / 2);
        woodGrad.addColorStop(0, '#d97706');
        woodGrad.addColorStop(0.5, '#b45309');
        woodGrad.addColorStop(1, '#92400e');
        ctx.fillStyle = woodGrad;
        ctx.fillRect(px, -crateS / 2, plankW, crateS);

        // Woodgrain lines
        ctx.strokeStyle = 'rgba(69, 26, 3, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + plankW * 0.4, -crateS / 2);
        ctx.lineTo(px + plankW * 0.4, crateS / 2);
        ctx.stroke();

        if (i > 0) {
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px, -crateS / 2);
          ctx.lineTo(px, crateS / 2);
          ctx.stroke();
        }
      }

      // Metal outer frame
      const frameW = 6;
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-crateS / 2, -crateS / 2, crateS, frameW);
      ctx.fillRect(-crateS / 2, crateS / 2 - frameW, crateS, frameW);
      ctx.fillRect(-crateS / 2, -crateS / 2, frameW, crateS);
      ctx.fillRect(crateS / 2 - frameW, -crateS / 2, frameW, crateS);

      // Corner L-brackets with 8 screw rivets
      const bw = 18;
      const bh = 18;
      const armThick = 6;
      const drawCornerBracket = (cx: number, cy: number, sx: 1 | -1, sy: 1 | -1) => {
        ctx.fillStyle = '#71717a';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
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

        // 2 Screws
        const drawScrew = (x: number, y: number) => {
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x - 1.5, y);
          ctx.lineTo(x + 1.5, y);
          ctx.stroke();
        };
        drawScrew(cx + sx * (bw * 0.65), cy + sy * (armThick * 0.5));
        drawScrew(cx + sx * (armThick * 0.5), cy + sy * (bh * 0.65));
      };

      drawCornerBracket(-crateS / 2, -crateS / 2, 1, 1);
      drawCornerBracket(crateS / 2, -crateS / 2, -1, 1);
      drawCornerBracket(-crateS / 2, crateS / 2, 1, -1);
      drawCornerBracket(crateS / 2, crateS / 2, -1, -1);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(-crateS / 2, -crateS / 2, crateS, crateS);

      ctx.restore();

      // 4. Render Authentic Boxrob Robot with Lightning Claws
      const botX = w * 0.35;
      const botY = platY - 24;

      ctx.save();
      ctx.translate(botX, botY);

      // Chassis Bar
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-36, -4, 72, 14, 5);
      ctx.fill();
      ctx.stroke();

      // Center Hexagon Link
      const hexR = 14;
      ctx.save();
      ctx.translate(0, 3);
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const hx = Math.cos(a) * hexR;
        const hy = Math.sin(a) * hexR;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const hx = Math.cos(a) * (hexR * 0.45);
        const hy = Math.sin(a) * (hexR * 0.45);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Vertical Arm Mast
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-10, -42, 20, 38, 4);
      ctx.fill();
      ctx.stroke();

      // 3 Diagonal Hazard Stripes on Mast
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-8, -40, 16, 34, 2);
      ctx.clip();
      ctx.fillStyle = '#000000';
      for (let sy = -42; sy < 0; sy += 10) {
        ctx.beginPath();
        ctx.moveTo(-12, sy);
        ctx.lineTo(12, sy - 10);
        ctx.lineTo(12, sy - 5);
        ctx.lineTo(-12, sy + 5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Shoulder Pivot Disc
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, -42, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -42, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, -42, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Crane Boom extending towards the wooden crate
      const armAngle = -0.3 + Math.sin(elapsed * 2) * 0.06;
      const armReach = 110 + Math.sin(elapsed * 1.5) * 8;
      const elbowLen = armReach * 0.52;
      const elbowX = Math.cos(armAngle) * elbowLen;
      const elbowY = -42 + Math.sin(armAngle) * elbowLen;
      const wristX = Math.cos(armAngle) * armReach;
      const wristY = -42 + Math.sin(armAngle) * armReach;

      // Boom casing
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -42);
      ctx.lineTo(elbowX, elbowY);
      ctx.stroke();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 9.5;
      ctx.beginPath();
      ctx.moveTo(0, -42);
      ctx.lineTo(elbowX, elbowY);
      ctx.stroke();

      // Elbow pin
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(elbowX, elbowY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(elbowX, elbowY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Piston
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(elbowX, elbowY);
      ctx.lineTo(wristX, wristY);
      ctx.stroke();

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(elbowX, elbowY);
      ctx.lineTo(wristX, wristY);
      ctx.stroke();

      // Wrist Dome Head & Robotic Claws
      ctx.save();
      ctx.translate(wristX, wristY);
      ctx.rotate(armAngle);

      // Orange bell head
      ctx.fillStyle = '#ea580c';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 12, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(-6, 12);
      ctx.lineTo(-6, -12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Claws
      const jawAngle = 0.35 + Math.sin(elapsed * 4) * 0.08;
      const drawClaw = (upper: boolean) => {
        ctx.save();
        const s = upper ? -1 : 1;
        ctx.rotate(s * jawAngle);

        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(6, s * 4);
        ctx.lineTo(20, s * 9);
        ctx.lineTo(32, s * 18);
        ctx.lineTo(36, s * 7);
        ctx.lineTo(22, s * 4);
        ctx.lineTo(6, s * 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(8, s * 3);
        ctx.lineTo(19, s * 7);
        ctx.lineTo(29, s * 14);
        ctx.lineTo(26, s * 5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      };
      drawClaw(true);
      drawClaw(false);

      // Electric Blue Lightning between claw tips!
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 20;

      const drawLightningArc = () => {
        const topY = -Math.sin(jawAngle) * 22 - 6;
        const botClawY = Math.sin(jawAngle) * 22 + 6;
        const topX = 28;
        const botClawX = 28;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(topX, topY);
        for (let step = 1; step <= 3; step++) {
          const frac = step / 4;
          const lx = topX + (Math.sin(elapsed * 18 + step * 4) * 8);
          const ly = topY + (botClawY - topY) * frac + (Math.cos(elapsed * 22 + step * 2) * 5);
          ctx.lineTo(lx, ly);
        }
        ctx.lineTo(botClawX, botClawY);
        ctx.stroke();

        // White core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      };
      drawLightningArc();

      ctx.restore();

      // Monster Wheels
      const drawWheel = (wx: number) => {
        ctx.save();
        ctx.translate(wx, 12);
        const wR = 24;
        const hubR = 14;

        // 16 Gear teeth
        ctx.fillStyle = '#181a1f';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
          const a1 = (i * Math.PI * 2) / 16;
          const a2 = a1 + (Math.PI * 2) / 32;
          const a3 = a1 + (Math.PI * 2) / 16;
          const bx1 = Math.cos(a1) * wR;
          const by1 = Math.sin(a1) * wR;
          const tx = Math.cos(a2) * (wR + 5.5);
          const ty = Math.sin(a2) * (wR + 5.5);
          const bx2 = Math.cos(a3) * wR;
          const by2 = Math.sin(a3) * wR;

          if (i === 0) ctx.moveTo(bx1, by1);
          ctx.lineTo(tx, ty);
          ctx.lineTo(bx2, by2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Rubber tire
        ctx.fillStyle = '#21252d';
        ctx.beginPath();
        ctx.arc(0, 0, wR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Yellow Hubcap
        const hGrad = ctx.createLinearGradient(-hubR, -hubR, hubR, hubR);
        hGrad.addColorStop(0, '#fbbf24');
        hGrad.addColorStop(0.5, '#f59e0b');
        hGrad.addColorStop(1, '#d97706');
        ctx.fillStyle = hGrad;
        ctx.beginPath();
        ctx.arc(0, 0, hubR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 3 Bolt Holes
        for (let h = 0; h < 3; h++) {
          const ha = (h * Math.PI * 2) / 3;
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(Math.cos(ha) * 7.5, Math.sin(ha) * 7.5, 2.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Center Axle
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(-1, -1, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      drawWheel(-32);
      drawWheel(32);

      ctx.restore();

      // 5. Huge 3D Metallic "BOXROB" Logo with Sparkle Glint
      const logoY = Math.min(100, h * 0.22);
      ctx.save();
      ctx.font = '900 64px "Chakra Petch", Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const logoText = 'BOXROB';
      const logoX = w / 2;

      // 3D Extrusion Shadow (deep dark layers downward)
      for (let shadow = 9; shadow >= 1; shadow--) {
        ctx.fillStyle = shadow > 5 ? '#090d10' : '#1e293b';
        ctx.fillText(logoText, logoX + shadow * 0.8, logoY + shadow * 1.4);
      }

      // Black Outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 10;
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 2;
      ctx.strokeText(logoText, logoX, logoY);

      // Silver / Chrome Metallic Face Gradient
      const textGrad = ctx.createLinearGradient(logoX, logoY - 32, logoX, logoY + 32);
      textGrad.addColorStop(0, '#ffffff');
      textGrad.addColorStop(0.3, '#f1f5f9');
      textGrad.addColorStop(0.55, '#cbd5e1');
      textGrad.addColorStop(1, '#64748b');
      ctx.fillStyle = textGrad;
      ctx.fillText(logoText, logoX, logoY);

      // Inner bevel hairline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.strokeText(logoText, logoX, logoY - 1);

      // Sparkle Star Glint ✦ on the 'X' / 'R'
      const sparkleX = logoX + 18;
      const sparkleY = logoY - 24;
      const spTime = elapsed * 3;
      const spScale = 1 + Math.sin(spTime) * 0.35;

      ctx.save();
      ctx.translate(sparkleX, sparkleY);
      ctx.rotate(spTime * 0.4);
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;

      // 4-pointed sparkle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        const aHalf = a + Math.PI / 4;
        const outerR = 14 * spScale;
        const innerR = 3 * spScale;
        if (i === 0) ctx.moveTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
        else ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
        ctx.lineTo(Math.cos(aHalf) * innerR, Math.sin(aHalf) * innerR);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.restore();

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="modal-title-screen"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl bg-[#161b22] border-4 border-[#2d333b] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header Bar with Hazard Border */}
        <div className="h-10 bg-[#0f1115] border-b-2 border-[#2d333b] flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-tactical uppercase tracking-wider text-amber-500 font-bold">
              BOXROB INDUSTRIAL LOADER SYSTEM
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-all cursor-pointer"
            title="Close / Return to Game"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Authentic Boxrob Scene Canvas */}
        <div className="relative w-full h-[320px] sm:h-[380px] bg-[#1a2521]">
          <canvas
            ref={canvasRef}
            width={768}
            height={380}
            className="w-full h-full object-cover select-none"
          />
        </div>

        {/* Action Controls Deck */}
        <div className="bg-[#12161c] p-6 border-t-2 border-[#2d333b] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col text-center sm:text-left">
            <span className="text-xs text-amber-400 font-tactical uppercase font-bold tracking-wider">
              Warehouse Shift Ready
            </span>
            <span className="text-sm text-gray-300">
              Operate crane arm • Magnetize cargo • Load the delivery truck
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id="btn-title-roster"
              onClick={() => {
                onClose();
                onOpenLevelSelect();
              }}
              className="flex-1 sm:flex-none px-4 py-3 bg-[#1e242c] hover:bg-[#28313c] border-2 border-[#374151] rounded-xl text-gray-200 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-md"
            >
              <Grid className="w-4 h-4 text-amber-400" />
              <span>ROSTER</span>
            </button>

            <button
              id="btn-title-manual"
              onClick={() => {
                onClose();
                onOpenHelp();
              }}
              className="flex-1 sm:flex-none px-4 py-3 bg-[#1e242c] hover:bg-[#28313c] border-2 border-[#374151] rounded-xl text-gray-200 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-md"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>MANUAL</span>
            </button>

            <button
              id="btn-title-start"
              onClick={() => {
                onClose();
                onStartGame();
              }}
              className="flex-1 sm:flex-none px-7 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.4)]"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>START SHIFT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
