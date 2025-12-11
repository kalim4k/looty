import React, { useEffect, useRef, useState } from 'react';
import { IconChevronLeft, IconTrophy } from './Icons';

// --- Constants ---
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;
const PUCK_RADIUS = 15;
const PADDLE_RADIUS = 30;
const GOAL_WIDTH = 140;
const FRICTION = 0.992; 
const WALL_BOUNCE = 0.8;
const AI_SPEED = 6;
const MAX_PUCK_SPEED = 25;

type GameState = 'THEME_SELECT' | 'MENU' | 'PLAYING' | 'SCORED' | 'GAMEOVER';

interface Theme {
  id: 'neon' | 'ice' | 'soccer';
  name: string;
  bg: string;
  text: string;
  accent: string;
  wallLeft: string[];
  wallRight: string[];
  puck: { outer: string, inner: string };
  paddlePlayer: string;
  paddleAI: string;
  markings: string;
  particles: string[];
}

const THEMES: Record<string, Theme> = {
  neon: {
    id: 'neon',
    name: 'Néon Cyber',
    bg: '#0f172a', // Slate 900
    text: '#ffffff',
    accent: '#4ade80',
    wallLeft: ['#4ade80', '#3b82f6'], // Green to Blue
    wallRight: ['#ef4444', '#eab308'], // Red to Yellow
    puck: { outer: '#eab308', inner: '#ffffff' },
    paddlePlayer: '#ef4444',
    paddleAI: '#22c55e',
    markings: '#334155',
    particles: ['#4ade80', '#ef4444', '#eab308']
  },
  ice: {
    id: 'ice',
    name: 'Glace Arcade',
    bg: '#e0f2fe', // Sky 100
    text: '#1e293b',
    accent: '#0ea5e9',
    wallLeft: ['#3b82f6', '#2563eb'], // Solid Blueish
    wallRight: ['#3b82f6', '#2563eb'],
    puck: { outer: '#111827', inner: '#ef4444' },
    paddlePlayer: '#dc2626', // Deep Red
    paddleAI: '#1d4ed8', // Deep Blue
    markings: '#ef4444', // Red lines
    particles: ['#3b82f6', '#93c5fd', '#1e40af']
  },
  soccer: {
    id: 'soccer',
    name: 'Football Pro',
    bg: '#15803d', // Green 700
    text: '#ffffff',
    accent: '#ffffff',
    wallLeft: ['#ffffff', '#ffffff'],
    wallRight: ['#ffffff', '#ffffff'],
    puck: { outer: '#ffffff', inner: '#000000' }, // Soccer ball look
    paddlePlayer: '#dc2626', // Red Team
    paddleAI: '#2563eb', // Blue Team
    markings: 'rgba(255, 255, 255, 0.8)', // White lines
    particles: ['#ffffff', '#4ade80', '#fbbf24'] // Grass & confetti
  }
};

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; color: string; size: number;
}

interface FloatingText {
  x: number; y: number; text: string; life: number; color: string; vy: number; size: number; font: string;
}

interface NeonHockeyGameProps {
  onBack: () => void;
  balance: number;
  updateBalance: (amount: number) => void;
  onPlayRound: () => void;
}

const NeonHockeyGame: React.FC<NeonHockeyGameProps> = ({ onBack, balance, updateBalance, onPlayRound }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>('THEME_SELECT');
  
  // Settings
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES.neon);

  // Physics State
  const puckRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: 0, vy: 0 });
  const playerRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 100, vx: 0, vy: 0, targetX: CANVAS_WIDTH / 2, targetY: CANVAS_HEIGHT - 100 });
  const aiRef = useRef({ x: CANVAS_WIDTH / 2, y: 100, vx: 0, vy: 0 });
  
  // Game Logic State
  const scoresRef = useRef({ player: 0, ai: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const textsRef = useRef<FloatingText[]>([]);
  const shakeRef = useRef(0);
  const comboRef = useRef(0);
  const touchOffsetRef = useRef({ x: 0, y: 0 });
  const requestRef = useRef<number>(0);
  const sessionEarningsRef = useRef(0);

  // UI State
  const [uiState, setUiState] = useState<GameState>('THEME_SELECT');
  const [winner, setWinner] = useState<'PLAYER' | 'AI' | null>(null);
  const [payout, setPayout] = useState(0);
  const [displayBalance, setDisplayBalance] = useState(balance);

  // Balance Animation Loop
  useEffect(() => {
    let animationFrame: number;
    const animateBalance = () => {
        setDisplayBalance(prev => {
            const diff = balance - prev;
            if (Math.abs(diff) < 1) return balance;
            return prev + diff * 0.1;
        });
        animationFrame = requestAnimationFrame(animateBalance);
    };
    animateBalance();
    return () => cancelAnimationFrame(animationFrame);
  }, [balance]);

  const selectTheme = (themeId: 'neon' | 'ice' | 'soccer') => {
    setCurrentTheme(THEMES[themeId]);
    gameStateRef.current = 'MENU';
    setUiState('MENU');
  };

  const initGame = () => {
    scoresRef.current = { player: 0, ai: 0 };
    resetPuck();
    playerRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 100, vx: 0, vy: 0, targetX: CANVAS_WIDTH / 2, targetY: CANVAS_HEIGHT - 100 };
    aiRef.current = { x: CANVAS_WIDTH / 2, y: 100, vx: 0, vy: 0 };
    setWinner(null);
    setPayout(0);
    comboRef.current = 0;
    sessionEarningsRef.current = 0;
    textsRef.current = [];
    particlesRef.current = [];
    gameStateRef.current = 'PLAYING';
    setUiState('PLAYING');
    onPlayRound();
  };

  const resetPuck = (scorer?: 'PLAYER' | 'AI') => {
    puckRef.current.x = CANVAS_WIDTH / 2;
    puckRef.current.y = CANVAS_HEIGHT / 2;
    puckRef.current.vx = 0;
    puckRef.current.vy = 0;
    comboRef.current = 0;
    
    // Serve to the person who got scored on
    setTimeout(() => {
        if (gameStateRef.current === 'PLAYING') {
            const serveDir = scorer === 'AI' ? 1 : -1; // Towards player if AI scored
            puckRef.current.vy = serveDir * 5;
            puckRef.current.vx = (Math.random() - 0.5) * 6;
        }
    }, 1000);
  };

  const spawnParticles = (x: number, y: number, color: string, count: number, speed: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = Math.random() * speed;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        life: 1.0,
        color,
        size: 1 + Math.random() * 3
      });
    }
  };

  const spawnText = (x: number, y: number, text: string, color: string, size: number = 20) => {
     textsRef.current.push({
         x, y, text, color, life: 1.0, vy: -2, size, font: 'Inter, sans-serif'
     });
  };

  const addMoney = (amount: number, x: number, y: number, showText: boolean = true) => {
      updateBalance(amount);
      sessionEarningsRef.current += amount;
      if (showText) {
          spawnText(x, y, `+${amount}`, '#fbbf24', 24);
      }
  };

  const handleCollision = (p1: any, r1: number, p2: any, r2: number, isPaddle: boolean = false) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < r1 + r2) {
      // Collision detected
      const overlap = (r1 + r2 - dist) / 2;
      const nx = dx / dist;
      const ny = dy / dist;
      
      p1.x += nx * overlap;
      p1.y += ny * overlap;
      
      const dvx = p1.vx - p2.vx;
      const dvy = p1.vy - p2.vy;
      const velAlongNormal = dvx * nx + dvy * ny;

      if (velAlongNormal > 0) return;

      const restitution = 1.2; 
      const j = -(1 + restitution) * velAlongNormal;
      
      p1.vx += j * nx;
      p1.vy += j * ny;

      const speed = Math.sqrt(p1.vx**2 + p1.vy**2);
      if (speed > MAX_PUCK_SPEED) {
          p1.vx = (p1.vx / speed) * MAX_PUCK_SPEED;
          p1.vy = (p1.vy / speed) * MAX_PUCK_SPEED;
      }

      shakeRef.current = 5;
      const particleColor = currentTheme.id === 'neon' ? '#fff' : (currentTheme.id === 'soccer' ? '#fff' : '#9ca3af');
      spawnParticles((p1.x + p2.x)/2, (p1.y + p2.y)/2, particleColor, 10, 5);

      if (isPaddle) {
          comboRef.current++;
          if (comboRef.current > 1) {
              const comboText = comboRef.current > 5 ? `SUPER ${comboRef.current}x` : `${comboRef.current}x`;
              const comboColor = comboRef.current > 5 ? '#f472b6' : '#fff';
              spawnText((p1.x + p2.x)/2, (p1.y + p2.y)/2 - 30, comboText, comboColor, 16 + Math.min(20, comboRef.current * 2));
          }
      }
    }
  };

  const update = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (shakeRef.current > 0) {
        shakeRef.current *= 0.9;
        if (shakeRef.current < 0.5) shakeRef.current = 0;
    }

    // --- LOGIC ---
    if (gameStateRef.current === 'PLAYING') {
        const puck = puckRef.current;
        const player = playerRef.current;
        const ai = aiRef.current;

        // Player Constraint
        const pTargetX = Math.max(PADDLE_RADIUS, Math.min(CANVAS_WIDTH - PADDLE_RADIUS, player.targetX));
        const pTargetY = Math.max(CANVAS_HEIGHT / 2 + PADDLE_RADIUS, Math.min(CANVAS_HEIGHT - PADDLE_RADIUS, player.targetY));
        player.vx = (pTargetX - player.x) * 0.2;
        player.vy = (pTargetY - player.y) * 0.2;
        player.x += player.vx;
        player.y += player.vy;

        // AI Logic
        let aiTargetX = puck.x;
        let aiTargetY = 100;

        if (puck.y < CANVAS_HEIGHT / 2 || (puck.y < CANVAS_HEIGHT * 0.7 && puck.vy < 0)) {
            aiTargetY = Math.max(PADDLE_RADIUS, Math.min(CANVAS_HEIGHT/2 - PADDLE_RADIUS, puck.y - 40));
            aiTargetX += Math.sin(Date.now() / 200) * 20; 

            // --- ANTI-STICKING LOGIC ---
            if (puck.x < PUCK_RADIUS * 3) {
                aiTargetX = Math.max(aiTargetX, puck.x + 30);
            } else if (puck.x > CANVAS_WIDTH - PUCK_RADIUS * 3) {
                aiTargetX = Math.min(aiTargetX, puck.x - 30);
            }

            const distSq = (puck.x - ai.x)**2 + (puck.y - ai.y)**2;
            const speedSq = puck.vx**2 + puck.vy**2;
            if (distSq < (PADDLE_RADIUS + PUCK_RADIUS + 5)**2 && speedSq < 2.0) {
                 aiTargetY = 150; 
                 aiTargetX = CANVAS_WIDTH / 2;
            }
        } else {
            aiTargetX = CANVAS_WIDTH / 2;
            aiTargetY = 100;
        }
        
        aiTargetX = Math.max(PADDLE_RADIUS, Math.min(CANVAS_WIDTH - PADDLE_RADIUS, aiTargetX));
        ai.vx = (aiTargetX - ai.x) * 0.1;
        ai.vy = (aiTargetY - ai.y) * 0.1;
        const aiSpeed = Math.sqrt(ai.vx**2 + ai.vy**2);
        if (aiSpeed > AI_SPEED) {
            ai.vx = (ai.vx / aiSpeed) * AI_SPEED;
            ai.vy = (ai.vy / aiSpeed) * AI_SPEED;
        }
        ai.x += ai.vx;
        ai.y += ai.vy;

        // Puck Physics
        puck.x += puck.vx;
        puck.y += puck.vy;
        puck.vx *= FRICTION;
        puck.vy *= FRICTION;

        // Wall Collisions
        if (puck.x < PUCK_RADIUS) {
            puck.x = PUCK_RADIUS;
            puck.vx *= -WALL_BOUNCE;
            spawnParticles(puck.x, puck.y, currentTheme.wallLeft[0], 3, 2);
            comboRef.current++;
            addMoney(2, puck.x + 20, puck.y, false); // No text
            shakeRef.current = 3;
        } else if (puck.x > CANVAS_WIDTH - PUCK_RADIUS) {
            puck.x = CANVAS_WIDTH - PUCK_RADIUS;
            puck.vx *= -WALL_BOUNCE;
            spawnParticles(puck.x, puck.y, currentTheme.wallRight[0], 3, 2);
            comboRef.current++;
            addMoney(2, puck.x - 20, puck.y, false); // No text
            shakeRef.current = 3;
        }

        if (puck.y < PUCK_RADIUS) {
            if (Math.abs(puck.x - CANVAS_WIDTH/2) < GOAL_WIDTH / 2) {
                // PLAYER GOAL
                scoresRef.current.player++;
                spawnParticles(puck.x, puck.y, currentTheme.accent, 50, 10);
                addMoney(300, CANVAS_WIDTH/2, CANVAS_HEIGHT/2); // Show text (default)
                shakeRef.current = 20;
                spawnText(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50, "GOAL!", "#22c55e", 60);
                
                if (scoresRef.current.player >= 3) {
                    gameStateRef.current = 'GAMEOVER';
                    setWinner('PLAYER');
                    setPayout(50);
                    updateBalance(50); // Bonus win
                    setUiState('GAMEOVER');
                } else {
                    resetPuck('PLAYER');
                }
            } else {
                puck.y = PUCK_RADIUS;
                puck.vy *= -WALL_BOUNCE;
            }
        } else if (puck.y > CANVAS_HEIGHT - PUCK_RADIUS) {
            if (Math.abs(puck.x - CANVAS_WIDTH/2) < GOAL_WIDTH / 2) {
                // AI GOAL
                scoresRef.current.ai++;
                spawnParticles(puck.x, puck.y, '#ef4444', 30, 8);
                shakeRef.current = 15;
                spawnText(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50, "OUCH!", "#ef4444", 40);

                if (scoresRef.current.ai >= 3) {
                    gameStateRef.current = 'GAMEOVER';
                    setWinner('AI');
                    setUiState('GAMEOVER');
                } else {
                    resetPuck('AI');
                }
            } else {
                puck.y = CANVAS_HEIGHT - PUCK_RADIUS;
                puck.vy *= -WALL_BOUNCE;
            }
        }

        handleCollision(puck, PUCK_RADIUS, player, PADDLE_RADIUS, true);
        handleCollision(puck, PUCK_RADIUS, ai, PADDLE_RADIUS, true);
    }

    // --- RENDER ---
    const shakeX = (Math.random() - 0.5) * shakeRef.current;
    const shakeY = (Math.random() - 0.5) * shakeRef.current;
    
    ctx.save();
    ctx.translate(shakeX, shakeY);
    
    // 1. Background
    if (currentTheme.id === 'soccer') {
        // Striped Grass
        ctx.fillStyle = '#15803d'; // Base Green (Green 700)
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#166534'; // Darker Green (Green 800)
        const stripeHeight = 40;
        for (let i = 0; i < CANVAS_HEIGHT; i += stripeHeight) {
             if ((i / stripeHeight) % 2 === 0) {
                 ctx.fillRect(0, i, CANVAS_WIDTH, stripeHeight);
             }
        }
    } else {
        ctx.fillStyle = currentTheme.bg;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 2. Field Markings
    ctx.lineWidth = 4;
    
    // Walls
    const gradLeft = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradLeft.addColorStop(0, currentTheme.wallLeft[0]);
    gradLeft.addColorStop(1, currentTheme.wallLeft[1]);
    ctx.strokeStyle = gradLeft;
    ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(2, CANVAS_HEIGHT); ctx.stroke();
    
    const gradRight = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradRight.addColorStop(0, currentTheme.wallRight[0]);
    gradRight.addColorStop(1, currentTheme.wallRight[1]);
    ctx.strokeStyle = gradRight;
    ctx.beginPath(); ctx.moveTo(CANVAS_WIDTH-2, 0); ctx.lineTo(CANVAS_WIDTH-2, CANVAS_HEIGHT); ctx.stroke();

    // Center & Goals
    ctx.strokeStyle = currentTheme.markings;
    
    if (currentTheme.id === 'neon') {
        ctx.setLineDash([10, 10]);
        ctx.beginPath(); ctx.moveTo(0, CANVAS_HEIGHT/2); ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT/2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 50, 0, Math.PI*2); ctx.stroke();
        
        // Goals (Arcs)
        ctx.strokeStyle = '#333';
        ctx.beginPath(); ctx.arc(CANVAS_WIDTH/2, 0, 70, 0, Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT, 70, Math.PI, 0); ctx.stroke();

    } else if (currentTheme.id === 'soccer') {
        // Soccer Markings
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, CANVAS_HEIGHT/2); ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT/2); ctx.stroke();
        ctx.beginPath(); ctx.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 50, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 4, 0, Math.PI*2); ctx.fill(); // Center spot

        const boxWidth = 200;
        const boxHeight = 80;
        const goalBoxWidth = 100;
        const goalBoxHeight = 35;

        // Top Area
        ctx.strokeRect((CANVAS_WIDTH - boxWidth) / 2, 0, boxWidth, boxHeight);
        ctx.strokeRect((CANVAS_WIDTH - goalBoxWidth) / 2, 0, goalBoxWidth, goalBoxHeight);
        // Penalty Spot Top
        ctx.beginPath(); ctx.arc(CANVAS_WIDTH/2, 60, 3, 0, Math.PI*2); ctx.fill();

        // Bottom Area
        ctx.strokeRect((CANVAS_WIDTH - boxWidth) / 2, CANVAS_HEIGHT - boxHeight, boxWidth, boxHeight);
        ctx.strokeRect((CANVAS_WIDTH - goalBoxWidth) / 2, CANVAS_HEIGHT - goalBoxHeight, goalBoxWidth, goalBoxHeight);
        // Penalty Spot Bottom
        ctx.beginPath(); ctx.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT - 60, 3, 0, Math.PI*2); ctx.fill();

        // Corner Arcs
        const cornerR = 15;
        ctx.beginPath(); ctx.arc(0, 0, cornerR, 0, Math.PI/2); ctx.stroke();
        ctx.beginPath(); ctx.arc(CANVAS_WIDTH, 0, cornerR, Math.PI/2, Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(CANVAS_WIDTH, CANVAS_HEIGHT, cornerR, Math.PI, Math.PI*1.5); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, CANVAS_HEIGHT, cornerR, Math.PI*1.5, Math.PI*2); ctx.stroke();

    } else {
        // Ice Style
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, CANVAS_HEIGHT/2); ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT/2); ctx.stroke();
        ctx.beginPath(); ctx.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 50, 0, Math.PI*2); ctx.stroke();
        
        // Goals (Arcs)
        ctx.strokeStyle = '#cbd5e1';
        ctx.beginPath(); ctx.arc(CANVAS_WIDTH/2, 0, 70, 0, Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT, 70, Math.PI, 0); ctx.stroke();
    }

    // 3. Entities
    // AI Paddle
    ctx.shadowBlur = currentTheme.id === 'neon' ? 20 : 5; 
    ctx.shadowColor = currentTheme.paddleAI;
    ctx.fillStyle = currentTheme.id === 'ice' || currentTheme.id === 'soccer' ? '#fff' : '#000'; 
    ctx.strokeStyle = currentTheme.paddleAI; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(aiRef.current.x, aiRef.current.y, PADDLE_RADIUS, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = currentTheme.paddleAI; ctx.beginPath(); ctx.arc(aiRef.current.x, aiRef.current.y, PADDLE_RADIUS * 0.4, 0, Math.PI*2); ctx.fill();

    // Player Paddle
    ctx.shadowColor = currentTheme.paddlePlayer;
    ctx.fillStyle = currentTheme.id === 'ice' || currentTheme.id === 'soccer' ? '#fff' : '#000'; 
    ctx.strokeStyle = currentTheme.paddlePlayer;
    ctx.beginPath(); ctx.arc(playerRef.current.x, playerRef.current.y, PADDLE_RADIUS, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = currentTheme.paddlePlayer; ctx.beginPath(); ctx.arc(playerRef.current.x, playerRef.current.y, PADDLE_RADIUS * 0.4, 0, Math.PI*2); ctx.fill();

    // Puck
    ctx.shadowColor = currentTheme.puck.outer;
    ctx.shadowBlur = currentTheme.id === 'neon' ? 15 : 0;
    ctx.fillStyle = currentTheme.puck.outer;
    ctx.beginPath(); ctx.arc(puckRef.current.x, puckRef.current.y, PUCK_RADIUS, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = currentTheme.puck.inner; ctx.beginPath(); ctx.arc(puckRef.current.x, puckRef.current.y, PUCK_RADIUS * 0.6, 0, Math.PI*2); ctx.fill();

    // Particles
    particlesRef.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.05;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    // Floating Texts
    textsRef.current.forEach(t => {
        t.y += t.vy; t.life -= 0.02;
        ctx.globalAlpha = Math.max(0, t.life);
        ctx.save(); ctx.translate(t.x, t.y);
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color; ctx.shadowBlur = 10;
        ctx.font = `900 ${t.size}px ${t.font}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(t.text, 0, 0);
        ctx.restore();
        ctx.globalAlpha = 1;
    });
    textsRef.current = textsRef.current.filter(t => t.life > 0);

    // Score overlay
    if (gameStateRef.current !== 'THEME_SELECT' && gameStateRef.current !== 'MENU') {
        ctx.shadowBlur = 0;
        ctx.font = 'bold 80px sans-serif';
        // Dynamic opacity
        ctx.fillStyle = currentTheme.id === 'neon' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(scoresRef.current.ai.toString(), CANVAS_WIDTH/2 + 80, CANVAS_HEIGHT/2 - 40);
        ctx.fillText(scoresRef.current.player.toString(), CANVAS_WIDTH/2 + 80, CANVAS_HEIGHT/2 + 40);
        
        // Combo Display
        if (comboRef.current > 2) {
            ctx.font = `900 ${30 + Math.min(30, comboRef.current * 2)}px Inter, sans-serif`;
            const hue = (Date.now() / 10) % 360;
            ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
            ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
            ctx.shadowBlur = 20;
            ctx.fillText(`${comboRef.current}x`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        }
    }

    ctx.restore();
    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [currentTheme]);

  // Controls
  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (gameStateRef.current !== 'PLAYING') return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
        const x = (clientX - rect.left) * (CANVAS_WIDTH / rect.width);
        const y = (clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
        
        const dist = Math.sqrt((x - playerRef.current.x)**2 + (y - playerRef.current.y)**2);
        if (dist < PADDLE_RADIUS * 2) {
             touchOffsetRef.current = { x: playerRef.current.x - x, y: playerRef.current.y - y };
        } else {
             touchOffsetRef.current = { x: 0, y: 0 };
             playerRef.current.targetX = x;
             playerRef.current.targetY = y;
        }
    }
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (gameStateRef.current !== 'PLAYING') return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
        const x = (clientX - rect.left) * (CANVAS_WIDTH / rect.width);
        const y = (clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
        playerRef.current.targetX = x + touchOffsetRef.current.x;
        playerRef.current.targetY = y + touchOffsetRef.current.y;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center font-sans touch-none select-none overflow-hidden" style={{ backgroundColor: currentTheme.bg }}>
      
      {/* Header */}
      <div className="absolute top-0 left-0 w-full z-20 pointer-events-none p-4 flex justify-between items-center">
         <button onClick={onBack} className={`p-3 rounded-full pointer-events-auto active:scale-95 transition border ${currentTheme.id === 'neon' ? 'bg-white/10 border-white/10' : 'bg-black/5 border-black/10'}`}>
            <IconChevronLeft className={`w-6 h-6 ${currentTheme.id === 'neon' ? 'text-white' : 'text-white'}`} />
         </button>
         
         <div className="flex flex-col items-end pointer-events-none">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">SOLDE</div>
            <div className={`text-2xl font-black tabular-nums transition-colors duration-200 ${currentTheme.id === 'neon' ? 'text-white' : 'text-white drop-shadow-md'}`}>
               {Math.floor(displayBalance).toLocaleString()} <span className="text-sm">FCFA</span>
            </div>
         </div>
      </div>

      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        className="w-full h-full object-contain"
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
      />

      {/* Theme Selection */}
      {uiState === 'THEME_SELECT' && (
        <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-pop-in p-6">
            <h1 className="text-3xl font-black text-white mb-8 text-center uppercase tracking-widest">
              Choisis ton style
            </h1>
            
            <div className="grid grid-cols-1 gap-4 w-full max-w-sm h-[70vh] overflow-y-auto pb-8">
                <button 
                  onClick={() => selectTheme('neon')}
                  className="shrink-0 relative group w-full h-32 rounded-3xl border-2 border-blue-500 bg-slate-900 overflow-hidden active:scale-95 transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-purple-900/50 z-0"></div>
                    <div className="absolute inset-0 flex items-center justify-between px-8 z-10">
                        <span className="text-2xl font-black text-white italic tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">NÉON<br/><span className="text-blue-400">CYBER</span></span>
                        <div className="w-12 h-12 rounded-full border-2 border-blue-400 bg-black shadow-[0_0_15px_#3b82f6]"></div>
                    </div>
                </button>

                <button 
                  onClick={() => selectTheme('soccer')}
                  className="shrink-0 relative group w-full h-32 rounded-3xl border-2 border-green-500 bg-green-800 overflow-hidden active:scale-95 transition-all shadow-lg"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.1)_50%,transparent_50%)] bg-[length:100%_40px] z-0"></div>
                    <div className="absolute inset-0 flex items-center justify-between px-8 z-10">
                        <span className="text-2xl font-black text-white italic tracking-tighter drop-shadow-md">FOOT<br/><span className="text-green-300">BALL</span></span>
                        <div className="w-12 h-12 rounded-full border-2 border-white bg-black/20 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-white border-2 border-black"></div>
                        </div>
                    </div>
                </button>

                <button 
                  onClick={() => selectTheme('ice')}
                  className="shrink-0 relative group w-full h-32 rounded-3xl border-2 border-cyan-200 bg-white overflow-hidden active:scale-95 transition-all shadow-lg"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-50 to-blue-50 z-0"></div>
                    <div className="absolute inset-0 flex items-center justify-between px-8 z-10">
                        <span className="text-2xl font-black text-slate-800 italic tracking-tighter">GLACE<br/><span className="text-cyan-600">ARCADE</span></span>
                        <div className="w-12 h-12 rounded-full border-4 border-red-500 bg-white"></div>
                    </div>
                </button>
            </div>
        </div>
      )}

      {/* Main Menu */}
      {uiState === 'MENU' && (
        <div className={`absolute inset-0 z-30 backdrop-blur-sm flex flex-col items-center justify-center animate-pop-in ${currentTheme.id === 'neon' ? 'bg-black/80' : 'bg-black/40'}`}>
          <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mb-8 relative ${currentTheme.id === 'neon' ? 'border-white/20' : 'border-white bg-white/20 shadow-xl backdrop-blur-md'}`}>
             <div className={`absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 border-b-blue-500 animate-spin`}></div>
             <span className="text-6xl">⚽</span>
          </div>
          <h1 className={`text-5xl font-black mb-2 italic tracking-tighter text-center text-white drop-shadow-lg`}>
            {currentTheme.name}
          </h1>
          <p className={`mb-12 font-bold uppercase tracking-widest text-xs text-white/80 drop-shadow-md`}>Premier à 3 points gagne</p>
          <button 
            onClick={initGame} 
            className={`px-12 py-5 rounded-full font-black text-2xl active:scale-95 transition-all hover:scale-110 
              ${currentTheme.id === 'neon' 
                ? 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.3)]' 
                : 'bg-blue-600 text-white shadow-xl hover:bg-blue-500 border-2 border-white'}`}
          >
            JOUER
          </button>
          
          <button 
             onClick={() => setUiState('THEME_SELECT')} 
             className={`mt-6 text-sm font-bold underline text-white hover:text-blue-300 drop-shadow-md`}
          >
             Changer de thème
          </button>
        </div>
      )}

      {/* Game Over */}
      {uiState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-pop-in">
          {winner === 'PLAYER' ? (
             <>
               <IconTrophy className="w-32 h-32 text-yellow-400 mb-6 drop-shadow-[0_0_50px_#fbbf24]" />
               <div className="text-6xl font-black text-white mb-2 italic">VICTOIRE!</div>
               <div className="flex flex-col items-center bg-white/10 rounded-2xl p-6 border border-white/20 mb-8">
                   <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Gains Totaux</div>
                   <div className="text-green-400 font-black text-4xl drop-shadow-[0_0_20px_#4ade80]">{sessionEarningsRef.current} FCFA</div>
               </div>
             </>
          ) : (
             <>
               <div className="text-6xl mb-6">💀</div>
               <div className="text-6xl font-black text-red-500 mb-2 italic">DÉFAITE</div>
               <div className="flex flex-col items-center bg-white/10 rounded-2xl p-6 border border-white/20 mb-8">
                   <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Gains de session</div>
                   <div className="text-green-400 font-black text-2xl">{sessionEarningsRef.current} FCFA</div>
               </div>
             </>
          )}
          
          <button onClick={initGame} className="px-10 py-4 border-2 border-white text-white rounded-full font-black text-xl hover:bg-white hover:text-black transition-all active:scale-95 mb-4">
            REJOUER
          </button>
          <button onClick={onBack} className="text-slate-500 font-bold hover:text-white transition">
            Quitter
          </button>
        </div>
      )}
    </div>
  );
};

export default NeonHockeyGame;