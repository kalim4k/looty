import React, { useEffect, useRef, useState } from 'react';
import { IconChevronLeft, IconTrophy } from './Icons';

// --- Constants ---
const CANVAS_WIDTH = 360; 
const CANVAS_HEIGHT = 640;
const BALL_RADIUS = 5;
const BLOCK_PADDING = 4;
const COLS = 6; 
const BLOCK_WIDTH = (CANVAS_WIDTH - (BLOCK_PADDING * (COLS + 1))) / COLS;
const BLOCK_HEIGHT = BLOCK_WIDTH; 
const SPEED = 14; 
const FLOOR_OFFSET = 30; 
const FLOOR_Y = CANVAS_HEIGHT - FLOOR_OFFSET;
const LAUNCHER_Y = FLOOR_Y - BALL_RADIUS - 2;
const COLORS = ['#06b6d4', '#ef4444', '#d946ef', '#eab308'];

type GameState = 'AIMING' | 'SHOOTING' | 'GAMEOVER';

interface Ball {
  x: number; y: number; vx: number; vy: number; active: boolean;
}

interface Block {
  id: number; c: number; r: number; x: number; y: number; hp: number; maxHp: number; isBonus: boolean; color: string;
}

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; color: string;
}

interface FloatingText {
  x: number; y: number; text: string; life: number; color: string; vy: number;
}

interface TriumphGameProps {
  onBack: () => void;
  balance: number;
  updateBalance: (amount: number) => void;
  initialTime: number; // Seconds remaining today
  onTimeUpdate: (secondsUsed: number) => void;
}

const TriumphGame: React.FC<TriumphGameProps> = ({ onBack, balance, updateBalance, initialTime, onTimeUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>('AIMING');
  const ballsRef = useRef<Ball[]>([]);
  const blocksRef = useRef<Block[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const launcherPosRef = useRef({ x: CANVAS_WIDTH / 2 }); 
  const scoreRef = useRef(1); 
  const ballsReturnedRef = useRef(0); 
  const comboRef = useRef(0);
  const shakeIntensityRef = useRef(0);
  const firstBallLandedXRef = useRef<number | null>(null); 
  const requestRef = useRef<number>();
  const shootingIntervalRef = useRef<any>();
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  const aimAngleRef = useRef<number | null>(null);
  const roundEarningsRef = useRef(0);
  
  // Timer Refs
  const lastTimeRef = useRef<number>(Date.now());
  const accumulatedTimeRef = useRef<number>(0);
  const timeLeftRef = useRef<number>(initialTime);

  const [uiScore, setUiScore] = useState(1);
  const [uiTime, setUiTime] = useState(initialTime);
  const [gameOver, setGameOver] = useState(false);
  const [timeUp, setTimeUp] = useState(false);

  // --- Init ---
  const initGame = () => {
    scoreRef.current = 1;
    ballsReturnedRef.current = 0;
    launcherPosRef.current = { x: CANVAS_WIDTH / 2 };
    roundEarningsRef.current = 0;
    comboRef.current = 0;
    ballsRef.current = [];
    blocksRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    gameStateRef.current = 'AIMING';
    
    // Timer Reset
    timeLeftRef.current = initialTime;
    setUiTime(initialTime);
    lastTimeRef.current = Date.now();
    accumulatedTimeRef.current = 0;

    setGameOver(false);
    setTimeUp(false);
    setUiScore(1);
    generateRow();
  };

  const generateRow = () => {
    blocksRef.current.forEach(b => {
      b.r++;
      b.y = b.r * (BLOCK_HEIGHT + BLOCK_PADDING) + BLOCK_PADDING + 80; 
    });

    if (blocksRef.current.some(b => !b.isBonus && b.y + BLOCK_HEIGHT > LAUNCHER_Y - 40)) {
      gameStateRef.current = 'GAMEOVER';
      setGameOver(true);
      return;
    }

    const level = scoreRef.current;
    let hasBlock = false;
    const bonusIndex = Math.floor(Math.random() * COLS);

    for (let c = 0; c < COLS; c++) {
      if (c !== bonusIndex && Math.random() < 0.5) continue;
      const isBonus = c === bonusIndex;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      blocksRef.current.push({
        id: Math.random(), c, r: 0,
        x: c * (BLOCK_WIDTH + BLOCK_PADDING) + BLOCK_PADDING,
        y: 80 + BLOCK_PADDING,
        hp: isBonus ? 1 : level,
        maxHp: isBonus ? 1 : level,
        isBonus, color
      });
      if (!isBonus) hasBlock = true;
    }
    
    if (!hasBlock) {
       const c = (bonusIndex + 1) % COLS;
       blocksRef.current.push({
          id: Math.random(), c, r: 0,
          x: c * (BLOCK_WIDTH + BLOCK_PADDING) + BLOCK_PADDING,
          y: 80 + BLOCK_PADDING,
          hp: level, maxHp: level, isBonus: false, color: COLORS[0]
       });
    }
  };

  const shootBalls = () => {
    if (gameStateRef.current !== 'AIMING' || aimAngleRef.current === null) return;
    gameStateRef.current = 'SHOOTING';
    ballsReturnedRef.current = 0;
    comboRef.current = 0; 
    firstBallLandedXRef.current = null;
    roundEarningsRef.current = 0; 
    
    const angle = aimAngleRef.current;
    // Always fire 50 balls for intensity in time mode, or based on level? Let's do fixed 30 for chaos
    let ballsToFire = 30; 
    let firedCount = 0;
    const vx = Math.cos(angle) * SPEED;
    const vy = Math.sin(angle) * SPEED;

    shootingIntervalRef.current = setInterval(() => {
      if (firedCount >= ballsToFire) {
        clearInterval(shootingIntervalRef.current);
        return;
      }
      ballsRef.current.push({ x: launcherPosRef.current.x, y: LAUNCHER_Y, vx, vy, active: true });
      firedCount++;
    }, 50); 
  };

  const update = () => {
    if (!canvasRef.current || gameOver || timeUp) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // --- Timer Logic ---
    const now = Date.now();
    const dt = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;
    
    if (gameStateRef.current === 'SHOOTING' || gameStateRef.current === 'AIMING') {
       timeLeftRef.current -= dt;
       accumulatedTimeRef.current += dt;

       // Sync with global store every 1 second of accumulation
       if (accumulatedTimeRef.current >= 1) {
          onTimeUpdate(1);
          accumulatedTimeRef.current -= 1;
       }

       if (timeLeftRef.current <= 0) {
          timeLeftRef.current = 0;
          setUiTime(0);
          setTimeUp(true);
          setGameOver(true);
          return;
       }
       setUiTime(Math.ceil(timeLeftRef.current));
    }

    // --- Shake Logic ---
    let shakeX = 0, shakeY = 0;
    if (shakeIntensityRef.current > 0) {
        shakeX = (Math.random() - 0.5) * shakeIntensityRef.current;
        shakeY = (Math.random() - 0.5) * shakeIntensityRef.current;
        shakeIntensityRef.current *= 0.9;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.fillStyle = '#000000';
    ctx.fillRect(-shakeX, -shakeY, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Combo Text
    if (comboRef.current > 5 && gameStateRef.current === 'SHOOTING') {
        const comboSize = Math.min(100, 40 + comboRef.current * 1.5);
        ctx.font = `900 ${comboSize}px Inter, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#334155'; ctx.globalAlpha = 0.3;
        ctx.fillText(`${comboRef.current}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, FLOOR_Y); ctx.lineTo(CANVAS_WIDTH, FLOOR_Y); ctx.stroke();

    particlesRef.current.forEach((p) => {
       p.x += p.vx; p.y += p.vy; p.life -= 0.05;
       ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color;
       ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
       ctx.globalAlpha = 1;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    blocksRef.current.forEach(b => {
      if (b.isBonus) {
        // Bonus adds time in this mode? Or just money? Let's do pure money
        const pulse = (Math.sin(Date.now() / 150) + 1) * 2;
        ctx.shadowColor = '#22c55e'; ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3; ctx.beginPath();
        ctx.arc(b.x + BLOCK_WIDTH/2, b.y + BLOCK_HEIGHT/2, 10 + pulse, 0, Math.PI * 2);
        ctx.stroke(); ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 20px monospace'; ctx.fillText("$", b.x + BLOCK_WIDTH/2, b.y + BLOCK_HEIGHT/2 + 1);
      } else {
        ctx.shadowColor = b.color; ctx.strokeStyle = b.color;
        ctx.lineWidth = 4; ctx.strokeRect(b.x + 4, b.y + 4, BLOCK_WIDTH - 8, BLOCK_HEIGHT - 8);
        ctx.fillStyle = '#000000'; ctx.fillRect(b.x + 6, b.y + 6, BLOCK_WIDTH - 12, BLOCK_HEIGHT - 12);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px sans-serif'; 
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(b.hp.toString(), b.x + BLOCK_WIDTH/2, b.y + BLOCK_HEIGHT/2);
      }
    });

    let frameEarnings = 0;

    ballsRef.current.forEach(ball => {
      if (!ball.active) return;
      let nextX = ball.x + ball.vx; let nextY = ball.y + ball.vy;

      if (nextX < BALL_RADIUS || nextX > CANVAS_WIDTH - BALL_RADIUS) { ball.vx = -ball.vx; nextX = ball.x + ball.vx; }
      if (nextY < BALL_RADIUS) { ball.vy = -ball.vy; nextY = ball.y + ball.vy; }
      
      if (nextY > FLOOR_Y - BALL_RADIUS) {
        ball.active = false; ball.vx = 0; ball.vy = 0;
        ballsReturnedRef.current++;
        if (firstBallLandedXRef.current === null) {
           firstBallLandedXRef.current = Math.max(20, Math.min(CANVAS_WIDTH - 20, ball.x));
           launcherPosRef.current.x = firstBallLandedXRef.current;
        }
        return; 
      }

      for (let i = blocksRef.current.length - 1; i >= 0; i--) {
        const b = blocksRef.current[i];
        const closestX = Math.max(b.x, Math.min(ball.x, b.x + BLOCK_WIDTH));
        const closestY = Math.max(b.y, Math.min(ball.y, b.y + BLOCK_HEIGHT));
        const distSq = (ball.x - closestX)**2 + (ball.y - closestY)**2;

        if (distSq < BALL_RADIUS * BALL_RADIUS) {
          if (b.isBonus) {
             frameEarnings += 50; // Bonus block is worth more
             blocksRef.current.splice(i, 1);
             floatingTextsRef.current.push({ x: b.x + BLOCK_WIDTH/2, y: b.y, text: "+50", life: 1.0, color: '#4ade80', vy: -1 });
          } else {
             const prevBallX = ball.x - ball.vx;
             if (prevBallX >= b.x && prevBallX <= b.x + BLOCK_WIDTH) ball.vy = -ball.vy; else ball.vx = -ball.vx;
             b.hp--;
             
             // --- MONEY LOGIC ---
             frameEarnings += 2; 
             comboRef.current++; 
             if (comboRef.current % 10 === 0) shakeIntensityRef.current = Math.min(10, comboRef.current / 5);

             floatingTextsRef.current.push({ x: ball.x, y: ball.y - 15, text: "+2", life: 0.8, color: '#fbbf24', vy: -1.5 });
             if (b.hp <= 0) {
                for(let k=0; k<8; k++) particlesRef.current.push({ x: b.x + BLOCK_WIDTH/2, y: b.y + BLOCK_HEIGHT/2, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, life: 1.0, color: b.color });
                blocksRef.current.splice(i, 1);
             }
          }
          break; 
        }
      }
      ball.x += ball.vx; ball.y += ball.vy;
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2); ctx.fill();
    });

    if (frameEarnings > 0) {
       updateBalance(frameEarnings);
       roundEarningsRef.current += frameEarnings;
    }

    floatingTextsRef.current.forEach(ft => {
        ft.y += ft.vy; ft.life -= 0.03;
        ctx.globalAlpha = Math.max(0, ft.life); ctx.fillStyle = ft.color; ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center"; ctx.fillText(ft.text, ft.x, ft.y); ctx.globalAlpha = 1.0;
    });
    floatingTextsRef.current = floatingTextsRef.current.filter(ft => ft.life > 0);

    if (gameStateRef.current === 'AIMING') {
       ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(launcherPosRef.current.x, LAUNCHER_Y, 6, 0, Math.PI * 2); ctx.fill();
       ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(launcherPosRef.current.x, LAUNCHER_Y, 10 + Math.sin(Date.now()/300)*2, 0, Math.PI * 2); ctx.stroke();
       if (dragStartRef.current && aimAngleRef.current !== null) {
          ctx.beginPath(); ctx.moveTo(launcherPosRef.current.x, LAUNCHER_Y);
          ctx.lineTo(launcherPosRef.current.x + Math.cos(aimAngleRef.current) * 800, LAUNCHER_Y + Math.sin(aimAngleRef.current) * 800);
          ctx.strokeStyle = '#ffffff'; ctx.setLineDash([10, 10]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
       }
    }
    ctx.restore();

    // Check end of turn
    if (gameStateRef.current === 'SHOOTING' && ballsRef.current.filter(b => b.active).length === 0) {
       gameStateRef.current = 'AIMING';
       scoreRef.current++;
       setUiScore(scoreRef.current);
       ballsRef.current = [];
       generateRow();
    }
    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => { initGame(); requestRef.current = requestAnimationFrame(update); return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); if (shootingIntervalRef.current) clearInterval(shootingIntervalRef.current); }; }, []);

  const handleStart = (e: any) => { if (gameStateRef.current !== 'AIMING') return; const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; dragStartRef.current = { x: clientX, y: clientY }; };
  const handleMove = (e: any) => { if (gameStateRef.current !== 'AIMING' || !dragStartRef.current) return; const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; const dx = clientX - dragStartRef.current.x; const dy = clientY - dragStartRef.current.y; if (dy > 0) { const angle = Math.atan2(-dy, -dx); const deg = angle * (180/Math.PI); if (deg > -175 && deg < -5) aimAngleRef.current = angle; } };
  const handleEnd = () => { if (gameStateRef.current !== 'AIMING' || !aimAngleRef.current) { dragStartRef.current = null; aimAngleRef.current = null; return; } shootBalls(); dragStartRef.current = null; aimAngleRef.current = null; };

  return (
    <div className="fixed inset-0 bg-[#000000] text-white flex flex-col font-sans touch-none select-none z-50">
      <div className="flex-none h-24 px-4 flex items-center justify-between z-30 pointer-events-none relative">
        <div className="flex items-center gap-3 pointer-events-auto">
            <button onClick={onBack} className="p-3 bg-white/10 rounded-full backdrop-blur-md border border-white/10 active:scale-95 transition"><IconChevronLeft className="w-6 h-6 text-white" /></button>
            <div className="flex flex-col"><div className="text-2xl font-black text-white leading-none">{uiScore}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Niveau</div></div>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
             <div className="text-4xl font-black text-white tracking-tighter drop-shadow-2xl flex items-baseline gap-2">{balance.toLocaleString()}<span className="text-xl text-white/80 font-bold">FCFA</span></div>
        </div>
        <div className="flex flex-col items-end">
            <div className={`text-2xl font-black leading-none flex items-center gap-1 ${uiTime < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {uiTime}s
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temps</div>
        </div>
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center">
         <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full object-contain" onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd} onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} />
         {uiScore === 1 && gameStateRef.current === 'AIMING' && !dragStartRef.current && (<div className="absolute bottom-1/4 left-0 right-0 text-center pointer-events-none animate-pulse opacity-60 z-20"><div className="text-sm font-bold text-white mb-2 tracking-widest uppercase">Glisser pour viser</div><div className="w-1 h-16 bg-gradient-to-b from-white to-transparent mx-auto"></div></div>)}
         {(gameOver || timeUp) && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-pop-in">
               <IconTrophy className="w-20 h-20 text-yellow-400 mb-6" />
               <div className="text-6xl font-black text-white mb-4 tracking-tighter drop-shadow-sm uppercase">
                   {timeUp ? "Temps Écoulé" : "ÉCHEC"}
               </div>
               <div className="flex gap-8 mb-10 text-center">
                   <div><div className="text-gray-400 text-xs font-bold uppercase">Niveau</div><div className="text-3xl font-black text-white">{uiScore}</div></div>
                   <div><div className="text-gray-400 text-xs font-bold uppercase">Gains</div><div className="text-3xl font-black text-yellow-400">{roundEarningsRef.current} <span className="text-sm">FCFA</span></div></div>
               </div>
               <button onClick={onBack} className="px-12 py-5 bg-white text-black font-black text-xl rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">Retour</button>
            </div>
         )}
      </div>
    </div>
  );
};

export default TriumphGame;