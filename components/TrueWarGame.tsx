import React, { useEffect, useRef, useState } from 'react';
import { IconChevronLeft, IconTrophy, IconUser } from './Icons';

// --- Constants & Config ---
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;
const HERO_Y = 500;
const SPAWN_RATE = 45; 
const BASE_BULLET_SPEED = 18;
const ENEMY_SPEED = 4;
const WORLD_SPEED = 9; 
const BOSS_HP_PER_LEVEL = 2000;
const BRIDGE_WIDTH = 300; 
const BRIDGE_X = (CANVAS_WIDTH - BRIDGE_WIDTH) / 2;
const COL_BG = '#020617'; const COL_ASPHALT = '#1e293b'; const COL_MARKING = '#475569'; 
const COL_NEON_BLUE = '#3b82f6'; const COL_NEON_RED = '#ef4444'; const COL_GOLD = '#fbbf24'; const COL_PURPLE = '#a855f7'; const COL_ORANGE = '#f97316';

type GameState = 'MENU' | 'PLAYING' | 'BOSS' | 'GAMEOVER' | 'VICTORY';

interface Entity { id: number; x: number; y: number; radius: number; active: boolean; }
interface Soldier extends Entity { offsetAngle: number; offsetDist: number; }
interface Enemy extends Entity { hp: number; maxHp: number; isBoss: boolean; vx: number; vy: number; attackTimer?: number; }
interface Bullet extends Entity { vx: number; vy: number; isEnemy?: boolean; damage?: number; }
interface Gate { id: number; x: number; y: number; width: number; height: number; type: 'ADD' | 'MULT' | 'SUB' | 'DIV'; value: number; color: string; active: boolean; }
interface PowerUp { id: number; x: number; y: number; type: 'FIRE_RATE' | 'TRIPLE_SHOT' | 'DAMAGE' | 'REINFORCE'; active: boolean; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }
interface FloatingText { x: number; y: number; text: string; life: number; color: string; vy: number; scale: number; font: string; }

interface TrueWarGameProps {
  onBack: () => void;
  balance: number;
  updateBalance: (amount: number) => void;
  onPlayRound: () => void;
}

const TrueWarGame: React.FC<TrueWarGameProps> = ({ onBack, balance, updateBalance, onPlayRound }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>('MENU');
  const levelRef = useRef(1);
  const progressRef = useRef(0);
  const maxProgressRef = useRef(1000);
  const runMoneyRef = useRef(0); 
  const balanceAddedRef = useRef(false); // Security flag to prevent double payment
  const playerXRef = useRef(CANVAS_WIDTH / 2);
  const fireRateModRef = useRef(1.0); const spreadShotRef = useRef(false); const damageModRef = useRef(1);
  const soldiersRef = useRef<Soldier[]>([]); const bulletsRef = useRef<Bullet[]>([]); const enemiesRef = useRef<Enemy[]>([]);
  const gatesRef = useRef<Gate[]>([]); const powerUpsRef = useRef<PowerUp[]>([]); const particlesRef = useRef<Particle[]>([]); const textsRef = useRef<FloatingText[]>([]);
  const frameCountRef = useRef(0); const requestRef = useRef<number>(); const shakeRef = useRef(0); 
  const isDraggingRef = useRef(false); const lastXRef = useRef(0);

  const [soldierCount, setSoldierCount] = useState(1);
  const [levelProgress, setLevelProgress] = useState(0);
  const [bossHp, setBossHp] = useState(100);
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [displayMoney, setDisplayMoney] = useState(0);
  const [hudMoney, setHudMoney] = useState(0);

  const drawNeonSphere = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) => {
    ctx.shadowBlur = 10; ctx.shadowColor = color; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, r * 0.4, 0, Math.PI * 2); ctx.fill();
  };

  const initGame = () => {
    // Increment daily usage only on initial start, not needed here as we use onBack to exit
    // onPlayRound is called by the MENU button below
    
    stateRef.current = 'PLAYING'; setGameState('PLAYING');
    fireRateModRef.current = 1.0; spreadShotRef.current = false; damageModRef.current = 1; runMoneyRef.current = 0; shakeRef.current = 0;
    balanceAddedRef.current = false;
    playerXRef.current = CANVAS_WIDTH / 2;
    soldiersRef.current = [{ id: 0, x: CANVAS_WIDTH / 2, y: HERO_Y, radius: 14, active: true, offsetAngle: 0, offsetDist: 0 }];
    bulletsRef.current = []; enemiesRef.current = []; gatesRef.current = []; powerUpsRef.current = []; particlesRef.current = []; textsRef.current = [];
    progressRef.current = 0; maxProgressRef.current = 6000; frameCountRef.current = 0;
    setSoldierCount(1); setLevelProgress(0); setDisplayMoney(0); setHudMoney(0);
  };

  const handleMenuStart = () => {
    onPlayRound();
    initGame();
  }

  const spawnBoss = () => {
    stateRef.current = 'BOSS'; setGameState('BOSS'); enemiesRef.current = []; 
    enemiesRef.current.push({ id: 9999, x: CANVAS_WIDTH / 2, y: -150, radius: 90, active: true, hp: levelRef.current * BOSS_HP_PER_LEVEL, maxHp: levelRef.current * BOSS_HP_PER_LEVEL, isBoss: true, vx: 0, vy: 2, attackTimer: 0 });
  };

  const spawnGateRow = () => {
    const y = -100; const gateW = BRIDGE_WIDTH / 2 - 8;
    const typeL = Math.random() > 0.4 ? 'ADD' : 'MULT'; const valL = typeL === 'ADD' ? Math.floor(Math.random() * 20) + 10 : 2;
    const typeR = Math.random() > 0.7 ? 'SUB' : 'ADD'; const valR = typeR === 'SUB' ? Math.floor(Math.random() * 20) + 5 : Math.floor(Math.random() * 10) + 5;
    gatesRef.current.push({ id: Math.random(), x: BRIDGE_X, y: y, width: gateW, height: 10, type: typeL, value: valL, color: COL_NEON_BLUE, active: true });
    gatesRef.current.push({ id: Math.random(), x: BRIDGE_X + gateW + 16, y: y, width: gateW, height: 10, type: typeR, value: valR, color: typeR === 'SUB' ? COL_NEON_RED : COL_NEON_BLUE, active: true });
  };

  const spawnPowerUp = () => {
    const typeRoll = Math.random(); let type: PowerUp['type'] = 'FIRE_RATE';
    if (typeRoll < 0.3) type = 'FIRE_RATE'; else if (typeRoll < 0.55) type = 'DAMAGE'; else if (typeRoll < 0.8) type = 'REINFORCE'; else type = 'TRIPLE_SHOT';
    powerUpsRef.current.push({ id: Math.random(), x: BRIDGE_X + 40 + Math.random() * (BRIDGE_WIDTH - 80), y: -50, type, active: true });
  };

  const updateSwarmFormation = () => {
    const count = soldiersRef.current.length; if (count === 0) return;
    soldiersRef.current[0].offsetDist = 0; soldiersRef.current[0].radius = 16; 
    let index = 1; let circle = 1; const spacing = 20;
    while (index < count) {
      const capacity = circle * 8; const angleStep = (Math.PI * 2) / capacity;
      for (let i = 0; i < capacity && index < count; i++) {
        soldiersRef.current[index].offsetDist = circle * spacing + 12;
        soldiersRef.current[index].offsetAngle = (i * angleStep) + (frameCountRef.current * 0.02 * (circle % 2 === 0 ? 1 : -1)); 
        soldiersRef.current[index].radius = 8; index++;
      }
      circle++;
    }
    const px = playerXRef.current;
    soldiersRef.current.forEach(s => { s.x += (px + Math.cos(s.offsetAngle) * s.offsetDist - s.x) * 0.2; s.y += (HERO_Y + Math.sin(s.offsetAngle) * s.offsetDist - s.y) * 0.2; });
  };

  const spawnParticles = (x: number, y: number, color: string, count: number, speed = 1) => {
    for(let i=0; i<count; i++) { const angle = Math.random() * Math.PI * 2; const vel = (2 + Math.random() * 6) * speed; particlesRef.current.push({ x, y, vx: Math.cos(angle) * vel, vy: Math.sin(angle) * vel, life: 1.0, color, size: 2 + Math.random() * 4 }); }
  };

  const addMoney = (amount: number, x: number, y: number) => {
      runMoneyRef.current += amount;
      setHudMoney(runMoneyRef.current);
      textsRef.current.push({ x, y, text: `+${amount}`, life: 0.8, color: COL_GOLD, vy: -4, scale: 1.0, font: "bold 20px" });
  };

  const finishGame = (status: 'VICTORY' | 'GAMEOVER') => {
     if (stateRef.current === 'VICTORY' || stateRef.current === 'GAMEOVER') return; // Prevent double call
     
     setGameState(status);
     stateRef.current = status;
     
     // Only add money once
     if (!balanceAddedRef.current) {
        updateBalance(runMoneyRef.current);
        balanceAddedRef.current = true;
     }
  };

  const update = () => {
    if (!canvasRef.current) return; const ctx = canvasRef.current.getContext('2d'); if (!ctx) return;
    frameCountRef.current++;
    if (shakeRef.current > 0) shakeRef.current *= 0.9; if (shakeRef.current < 0.5) shakeRef.current = 0;

    if (stateRef.current === 'PLAYING' || stateRef.current === 'BOSS') {
      if (stateRef.current === 'PLAYING') {
        progressRef.current += WORLD_SPEED;
        if (progressRef.current >= maxProgressRef.current) spawnBoss();
        if (frameCountRef.current % 120 === 0 && progressRef.current < maxProgressRef.current - 600) spawnGateRow();
        if (frameCountRef.current % 250 === 0 && progressRef.current < maxProgressRef.current - 600) spawnPowerUp();
        if (frameCountRef.current % SPAWN_RATE === 0 && progressRef.current < maxProgressRef.current - 400) {
           const count = 3 + Math.floor(levelRef.current * 0.5) + Math.floor(progressRef.current / 1500);
           for(let i=0; i<count; i++) enemiesRef.current.push({ id: Math.random(), x: BRIDGE_X + 20 + Math.random() * (BRIDGE_WIDTH - 40), y: -50 - (Math.random() * 150), radius: 14, active: true, hp: 20 + (levelRef.current * 5), maxHp: 20 + (levelRef.current * 5), isBoss: false, vx: 0, vy: ENEMY_SPEED });
        }
      }
      updateSwarmFormation();
      
      const fireInterval = Math.max(3, Math.floor(10 / fireRateModRef.current));
      if (frameCountRef.current % fireInterval === 0 && soldiersRef.current.length > 0) {
         soldiersRef.current.forEach((s, idx) => {
            if (idx > 40 && Math.random() > 0.3) return; 
            if (Math.random() > 0.2) {
               bulletsRef.current.push({ id: Math.random(), x: s.x, y: s.y - 10, radius: 3 + (damageModRef.current > 1 ? 2 : 0), active: true, vx: 0, vy: -BASE_BULLET_SPEED, damage: damageModRef.current });
               if (spreadShotRef.current && idx === 0) { bulletsRef.current.push({ id: Math.random(), x: s.x, y: s.y, radius: 3, active: true, vx: -4, vy: -BASE_BULLET_SPEED * 0.9, damage: damageModRef.current }); bulletsRef.current.push({ id: Math.random(), x: s.x, y: s.y, radius: 3, active: true, vx: 4, vy: -BASE_BULLET_SPEED * 0.9, damage: damageModRef.current }); }
            }
         });
      }

      enemiesRef.current.forEach(e => {
        if (e.isBoss) {
            if (e.y < 150) e.y += e.vy;
            else {
                e.x = CANVAS_WIDTH/2 + Math.sin(frameCountRef.current / 50) * 100;
                if (!e.attackTimer) e.attackTimer = 0; e.attackTimer++;
                if (e.attackTimer % 30 === 0) {
                    const angles = [Math.PI/2 - 0.3, Math.PI/2, Math.PI/2 + 0.3];
                    angles.forEach(angle => bulletsRef.current.push({ id: Math.random(), x: e.x, y: e.y + e.radius, radius: 10, active: true, vx: Math.cos(angle) * 9 * (playerXRef.current < e.x ? -1 : 1), vy: 9, isEnemy: true, damage: 10 }));
                }
            }
            setBossHp(e.hp);
        } else e.y += e.vy;
        if (e.y > CANVAS_HEIGHT + 50) e.active = false;
      });

      bulletsRef.current.forEach(b => {
         b.x += b.vx; b.y += b.vy;
         if (b.y < -50 || b.y > CANVAS_HEIGHT + 50) { b.active = false; return; }
         if (b.isEnemy) {
             for(let i=0; i<soldiersRef.current.length; i++) {
                 const s = soldiersRef.current[i]; if ((b.x - s.x)**2 + (b.y - s.y)**2 < (b.radius + s.radius)**2) { b.active = false; soldiersRef.current.splice(i, 1); spawnParticles(s.x, s.y, COL_NEON_BLUE, 5); shakeRef.current = 5; break; }
             }
         } else {
             for (const e of enemiesRef.current) {
                if (!e.active) continue;
                if ((b.x - e.x)**2 + (b.y - e.y)**2 < (b.radius + e.radius + 10)**2) {
                   b.active = false; e.hp -= (b.damage || 1); spawnParticles(b.x, b.y, '#fff', 1, 0.5);
                   if (e.hp <= 0) { 
                       e.active = false; 
                       spawnParticles(e.x, e.y, COL_NEON_RED, 12, 1.5); 
                       shakeRef.current = 8; 
                       if (e.isBoss) { 
                           addMoney(500, e.x, e.y); // REDUCED BY 3 (1500 -> 500)
                           finishGame('VICTORY'); 
                       } else addMoney(5, e.x, e.y); // REDUCED BY 3 (15 -> 5)
                   }
                   break;
                }
             }
         }
      });
      bulletsRef.current = bulletsRef.current.filter(b => b.active);

      enemiesRef.current = enemiesRef.current.filter(e => {
          if (!e.active) return false;
          if (Math.abs(e.y - HERO_Y) < 80) {
              for (let i = soldiersRef.current.length - 1; i >= 0; i--) {
                 const s = soldiersRef.current[i];
                 if ((s.x - e.x)**2 + (s.y - e.y)**2 < (s.radius + e.radius)**2) {
                     soldiersRef.current.splice(i, 1); e.hp -= 30; spawnParticles(s.x, s.y, COL_NEON_BLUE, 8); shakeRef.current = 5;
                     if (e.hp <= 0) { spawnParticles(e.x, e.y, COL_NEON_RED, 15); addMoney(5, e.x, e.y); return false; } // REDUCED BY 3 (15 -> 5)
                 }
              }
          }
          return true;
      });

      gatesRef.current.forEach(g => {
         g.y += WORLD_SPEED; if (g.y > CANVAS_HEIGHT) g.active = false;
         if (g.active && g.y > HERO_Y - 20 && g.y < HERO_Y + 20) {
             const px = playerXRef.current;
             if (px > g.x && px < g.x + g.width) {
                 g.active = false; let count = soldiersRef.current.length; const prevCount = count;
                 if (g.type === 'ADD') count += g.value; if (g.type === 'MULT') count = Math.floor(count * g.value); if (g.type === 'SUB') count = Math.max(1, count - g.value); if (g.type === 'DIV') count = Math.max(1, Math.floor(count / g.value));
                 const diff = count - prevCount;
                 if (diff > 0) { textsRef.current.push({ x: px, y: HERO_Y - 50, text: `+${diff}`, color: '#4ade80', life: 0.8, vy: -4, scale: 2.0, font: "900 30px" }); for(let k=0; k<diff; k++) soldiersRef.current.push({ id: Math.random(), x: px, y: HERO_Y, radius: 7, active: true, offsetAngle:0, offsetDist:0 }); }
                 else { textsRef.current.push({ x: px, y: HERO_Y - 50, text: `${diff}`, color: '#ef4444', life: 0.8, vy: -4, scale: 2.0, font: "900 30px" }); soldiersRef.current.splice(count); shakeRef.current = 5; }
             }
         }
      });
      gatesRef.current = gatesRef.current.filter(g => g.active);

      powerUpsRef.current.forEach(p => {
          p.y += WORLD_SPEED; if (p.y > CANVAS_HEIGHT) p.active = false;
          if (p.active && Math.abs(p.y - HERO_Y) < 30 && Math.abs(p.x - playerXRef.current) < 30) {
              p.active = false;
              if (p.type === 'FIRE_RATE') { fireRateModRef.current += 0.5; textsRef.current.push({ x: p.x, y: p.y, text: 'SPEED UP!', color: COL_GOLD, life: 1.5, vy: -1, scale: 1.5, font: "900 20px" }); }
              else if (p.type === 'TRIPLE_SHOT') { spreadShotRef.current = true; textsRef.current.push({ x: p.x, y: p.y, text: 'SPREAD!', color: COL_PURPLE, life: 1.5, vy: -1, scale: 1.5, font: "900 20px" }); }
              else if (p.type === 'DAMAGE') { damageModRef.current += 1; textsRef.current.push({ x: p.x, y: p.y, text: 'POWER UP!', color: COL_ORANGE, life: 1.5, vy: -1, scale: 1.5, font: "900 20px" }); }
              else if (p.type === 'REINFORCE') { for(let k=0; k<5; k++) soldiersRef.current.push({ id: Math.random(), x: playerXRef.current, y: HERO_Y, radius: 7, active: true, offsetAngle:0, offsetDist:0 }); textsRef.current.push({ x: p.x, y: p.y, text: '+5 UNIT', color: COL_NEON_BLUE, life: 1.5, vy: -1, scale: 1.5, font: "900 20px" }); }
              spawnParticles(p.x, p.y, COL_GOLD, 15, 2);
          }
      });
      powerUpsRef.current = powerUpsRef.current.filter(p => p.active);

      if (soldiersRef.current.length === 0) finishGame('GAMEOVER');
      else { setSoldierCount(soldiersRef.current.length); if (stateRef.current === 'PLAYING') setLevelProgress(Math.min(100, (progressRef.current / maxProgressRef.current) * 100)); }
    }

    const shakeX = (Math.random() - 0.5) * shakeRef.current; const shakeY = (Math.random() - 0.5) * shakeRef.current;
    ctx.save(); ctx.translate(shakeX, shakeY);
    ctx.fillStyle = COL_BG; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = COL_ASPHALT; ctx.fillRect(BRIDGE_X, 0, BRIDGE_WIDTH, CANVAS_HEIGHT);
    ctx.strokeStyle = COL_MARKING; ctx.lineWidth = 4; ctx.setLineDash([30, 30]); ctx.lineDashOffset = -(progressRef.current % 60); ctx.beginPath(); ctx.moveTo(CANVAS_WIDTH / 2, 0); ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT); ctx.stroke(); ctx.setLineDash([]);
    ctx.shadowBlur = 10; ctx.shadowColor = COL_NEON_BLUE; ctx.strokeStyle = COL_NEON_BLUE; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(BRIDGE_X, 0); ctx.lineTo(BRIDGE_X, CANVAS_HEIGHT); ctx.moveTo(BRIDGE_X + BRIDGE_WIDTH, 0); ctx.lineTo(BRIDGE_X + BRIDGE_WIDTH, CANVAS_HEIGHT); ctx.stroke(); ctx.shadowBlur = 0;

    gatesRef.current.forEach(g => {
        ctx.save(); ctx.translate(g.x, g.y); ctx.shadowBlur = 20; ctx.shadowColor = g.color;
        ctx.fillStyle = g.color === COL_NEON_BLUE ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)'; ctx.fillRect(0, 0, g.width, 10); ctx.fillRect(0, 0, 4, 120); ctx.fillRect(g.width - 4, 0, 4, 120);
        ctx.fillStyle = g.color === COL_NEON_BLUE ? 'rgba(59, 130, 246, 0.05)' : 'rgba(239, 68, 68, 0.05)'; ctx.fillRect(0, 0, g.width, 120);
        ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '900 40px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        let txt = ''; if (g.type === 'ADD') txt = `+${g.value}`; if (g.type === 'MULT') txt = `x${g.value}`; if (g.type === 'SUB') txt = `-${g.value}`; if (g.type === 'DIV') txt = `÷${g.value}`;
        ctx.fillText(txt, g.width/2, 60); ctx.restore();
    });

    powerUpsRef.current.forEach(p => {
        const hoverY = Math.sin(frameCountRef.current * 0.1) * 5; ctx.save(); ctx.translate(p.x, p.y + hoverY);
        let color = COL_GOLD; let symbol = '⚡'; if (p.type === 'TRIPLE_SHOT') { color = COL_PURPLE; symbol = '✨'; } if (p.type === 'DAMAGE') { color = COL_ORANGE; symbol = '💪'; } if (p.type === 'REINFORCE') { color = COL_NEON_BLUE; symbol = '👤'; }
        ctx.shadowBlur = 20; ctx.shadowColor = color; ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 0); ctx.lineTo(0, 15); ctx.lineTo(-15, 0); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(symbol, 0, 0); ctx.restore();
    });

    enemiesRef.current.forEach(e => {
        if (e.isBoss) { drawNeonSphere(ctx, e.x, e.y, e.radius, COL_NEON_RED); ctx.fillStyle = '#1a0505'; ctx.beginPath(); ctx.arc(e.x - 25, e.y - 15, 12, 0, Math.PI*2); ctx.arc(e.x + 25, e.y - 15, 12, 0, Math.PI*2); ctx.fill(); ctx.fillRect(e.x - 30, e.y + 20, 60, 10); ctx.fillStyle = '#000'; ctx.fillRect(e.x - 60, e.y - 120, 120, 16); ctx.fillStyle = COL_NEON_RED; ctx.fillRect(e.x - 58, e.y - 118, 116 * (e.hp / e.maxHp), 12); } 
        else drawNeonSphere(ctx, e.x, e.y, e.radius, COL_NEON_RED);
    });

    soldiersRef.current.forEach(s => { const col = s.id === 0 ? '#60a5fa' : COL_NEON_BLUE; drawNeonSphere(ctx, s.x, s.y, s.radius, col); });

    ctx.shadowBlur = 10;
    bulletsRef.current.forEach(b => {
       let bulletColor = b.isEnemy ? COL_NEON_RED : '#dbeafe'; if (!b.isEnemy && damageModRef.current > 1) bulletColor = COL_ORANGE;
       ctx.shadowColor = b.isEnemy ? COL_NEON_RED : COL_NEON_BLUE; ctx.fillStyle = b.isEnemy ? '#fee2e2' : bulletColor; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();
       ctx.beginPath(); ctx.strokeStyle = b.isEnemy ? COL_NEON_RED : bulletColor; ctx.lineWidth = b.radius; ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.8, b.y - b.vy * 0.8); ctx.stroke();
    });
    ctx.shadowBlur = 0;

    particlesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.04; ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1; });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    textsRef.current.forEach(t => { t.y += t.vy; t.life -= 0.02; ctx.globalAlpha = Math.max(0, t.life); ctx.save(); ctx.translate(t.x, t.y); ctx.scale(t.scale, t.scale); ctx.font = `${t.font} Inter, sans-serif`; ctx.fillStyle = t.color; ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.strokeText(t.text, 0, 0); ctx.fillText(t.text, 0, 0); ctx.restore(); ctx.globalAlpha = 1; });
    textsRef.current = textsRef.current.filter(t => t.life > 0);
    ctx.restore(); requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    if (gameState === 'VICTORY') {
      const target = runMoneyRef.current; let start = 0; const duration = 2000; const startTime = performance.now();
      const animateMoney = (currentTime: number) => { const elapsed = currentTime - startTime; const progress = Math.min(elapsed / duration, 1); const ease = 1 - Math.pow(1 - progress, 4); setDisplayMoney(Math.floor(start + (target - start) * ease)); if (progress < 1) requestAnimationFrame(animateMoney); };
      requestAnimationFrame(animateMoney);
    }
  }, [gameState]);

  const handleStart = (e: any) => { isDraggingRef.current = true; const clientX = e.touches ? e.touches[0].clientX : e.clientX; lastXRef.current = clientX; };
  const handleMove = (e: any) => { if (!isDraggingRef.current) return; const clientX = e.touches ? e.touches[0].clientX : e.clientX; const dx = clientX - lastXRef.current; const minX = BRIDGE_X + 20; const maxX = BRIDGE_X + BRIDGE_WIDTH - 20; playerXRef.current = Math.max(minX, Math.min(maxX, playerXRef.current + dx)); lastXRef.current = clientX; };
  const handleEnd = () => { isDraggingRef.current = false; };
  useEffect(() => { requestRef.current = requestAnimationFrame(update); return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); }; }, []);

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center font-sans touch-none select-none overflow-hidden">
      <div className="absolute top-0 left-0 w-full z-20 pointer-events-none p-4">
         <div className="flex justify-between items-start">
             <button onClick={onBack} className="p-3 bg-black/40 backdrop-blur-md rounded-full pointer-events-auto active:scale-95 transition border border-white/10 shadow-lg"><IconChevronLeft className="w-6 h-6 text-white" /></button>
             <div className="flex flex-col items-center flex-1 mx-4">
                 {gameState === 'BOSS' ? ( <div className="w-full max-w-[200px] h-8 bg-black/80 rounded-full border-2 border-red-500 relative overflow-hidden shadow-[0_0_20px_#ef4444] animate-pulse"><div className="absolute top-0 left-0 h-full bg-red-600 transition-all duration-200" style={{ width: `${(bossHp / (levelRef.current * BOSS_HP_PER_LEVEL))*100}%` }} /><div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white uppercase tracking-widest drop-shadow-md">BOSS</div></div> ) 
                 : ( <div className="w-full max-w-[200px] h-3 bg-slate-800 rounded-full overflow-hidden border border-white/10 relative shadow-lg"><div className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" style={{ width: `${levelProgress}%` }} /></div> )}
                 <div className="text-white font-black text-3xl mt-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight italic flex items-center gap-2">{hudMoney} <span className="text-2xl font-black text-white not-italic">FCFA</span></div>
             </div>
             <div className="bg-blue-600/80 backdrop-blur rounded-2xl p-2 px-3 border border-blue-400/30 flex items-center gap-2 shadow-[0_0_15px_#3b82f6]"><IconUser className="w-5 h-5 text-white" /><div className="font-mono font-bold text-white">{soldierCount}</div></div>
         </div>
      </div>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full object-cover bg-slate-900" onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd} onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd} />
      {gameState === 'MENU' && ( <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-pop-in"><div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center shadow-[0_0_60px_#3b82f6] mb-8 rotate-6 border-4 border-blue-400"><div className="text-6xl animate-pulse">⚔️</div></div><h1 className="text-7xl font-black text-white mb-2 italic tracking-tighter drop-shadow-[0_0_20px_#3b82f6] text-center">TRUE<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">WAR</span></h1><p className="text-slate-400 mb-12 font-bold uppercase tracking-[0.3em] text-xs">Dominez la route</p><button onClick={handleMenuStart} className="px-12 py-5 bg-white text-black rounded-full font-black text-2xl shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95 transition-all hover:scale-110 hover:shadow-[0_0_60px_#3b82f6]">COMBATTRE</button></div> )}
      {gameState === 'GAMEOVER' && ( <div className="absolute inset-0 z-30 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center animate-pop-in"><div className="text-7xl font-black text-red-500 mb-4 drop-shadow-[0_0_30px_#ef4444] tracking-tighter italic">ÉCHEC</div><div className="text-white/60 font-bold text-lg mb-8 uppercase tracking-widest">Armée détruite</div><button onClick={onBack} className="px-10 py-4 border-2 border-white text-white rounded-full font-black text-xl hover:bg-white hover:text-black transition-all active:scale-95">RETOURNER</button></div> )}
      {gameState === 'VICTORY' && ( <div className="absolute inset-0 z-30 bg-blue-950/90 backdrop-blur-md flex flex-col items-center justify-center animate-pop-in"><IconTrophy className="w-32 h-32 text-yellow-400 mb-6 drop-shadow-[0_0_50px_#fbbf24]" /><div className="text-6xl font-black text-white mb-2 drop-shadow-lg italic">VICTOIRE!</div><div className="flex flex-col items-center my-8 p-6 bg-white/5 rounded-3xl border border-white/10 w-64"><div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Gains Totaux</div><div className="text-5xl font-mono font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">{displayMoney} <span className="text-3xl">FCFA</span></div></div><button onClick={onBack} className="px-12 py-5 bg-blue-500 text-white rounded-full font-black text-xl shadow-[0_0_30px_#3b82f6] active:scale-95 transition-transform hover:bg-blue-400">RETOURNER</button></div> )}
      {gameState === 'PLAYING' && frameCountRef.current < 120 && ( <div className="absolute bottom-32 left-0 right-0 flex justify-center pointer-events-none animate-pulse"><div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-full text-white font-bold tracking-wider border border-white/20 shadow-[0_0_20px_#3b82f6]">↔️ GLISSER POUR BOUGER</div></div> )}
    </div>
  );
};

export default TrueWarGame;