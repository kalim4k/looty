import React, { useEffect, useState, useRef } from 'react';
import { GameState, Particle } from '../types';

interface BalloonProps {
  scale: number;
  gameState: GameState;
  earnedAmount?: number | null;
}

const Balloon: React.FC<BalloonProps> = ({ scale, gameState, earnedAmount }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [displayWinAmount, setDisplayWinAmount] = useState(0);

  // Handle Particles & Win Animation
  useEffect(() => {
    if (gameState === GameState.CRASHED) {
      // Explosion Particles
      const newParticles: Particle[] = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: 0,
          y: 0,
          color: Math.random() > 0.5 ? '#FF4D4D' : '#FFD700', // Red or Gold
          angle: Math.random() * 360,
          speed: 100 + Math.random() * 200,
        });
      }
      setParticles(newParticles);
    } else if (gameState === GameState.CASHED) {
      // Confetti Particles
      const confettiColors = ['#00ff00', '#00ffff', '#ffff00', '#ff00ff', '#ffffff'];
      const newParticles: Particle[] = [];
      for (let i = 0; i < 40; i++) {
        newParticles.push({
          id: i,
          x: (Math.random() - 0.5) * 100, // Spread out start
          y: (Math.random() - 0.5) * 100,
          color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
          angle: -90 + (Math.random() - 0.5) * 120, // Upwards cone
          speed: 150 + Math.random() * 250,
        });
      }
      setParticles(newParticles);

      // Count Up Animation
      if (earnedAmount) {
        let start = 0;
        const duration = 1000; // 1 second count up
        const startTime = performance.now();
        
        const animateCount = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease Out Quart
          const ease = 1 - Math.pow(1 - progress, 4);
          
          setDisplayWinAmount(Math.floor(start + (earnedAmount - start) * ease));
          
          if (progress < 1) {
             requestAnimationFrame(animateCount);
          }
        };
        requestAnimationFrame(animateCount);
      }

    } else if (gameState === GameState.IDLE) {
      setParticles([]);
      setDisplayWinAmount(0);
    }
  }, [gameState, earnedAmount]);

  // Visual style for the balloon wrapper
  const wrapperStyle: React.CSSProperties = {
    transform: `scale(${gameState === GameState.INFLATING ? scale : (gameState === GameState.IDLE ? 1 : scale)})`,
    transition: gameState === GameState.IDLE ? 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none', // Bouncy reset
  };

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Balloon Container */}
      {gameState !== GameState.CRASHED && (
        <div
          style={wrapperStyle}
          className={`relative w-40 h-44 transition-transform will-change-transform flex justify-center items-center`}
        >
          {/* String (Wiggles based on wind/movement) */}
          <div className="absolute top-[95%] left-1/2 w-0.5 h-20 bg-white/40 -translate-x-1/2 origin-top animate-wiggle z-0" />
          
          {/* Main Body - Organic Blob Shape */}
          <div className={`
             relative w-full h-full z-10
             bg-gradient-to-tr from-red-600 via-red-500 to-pink-400
             shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.2),inset_10px_10px_20px_rgba(255,255,255,0.4),0_0_30px_rgba(255,50,50,0.4)]
             ${gameState === GameState.INFLATING ? 'animate-blob-wobble' : 'animate-float'}
          `}
          style={{
             borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', // Initial slightly oval shape
          }}
          >
             {/* Dynamic lighting/sheen */}
             <div className="absolute top-[15%] left-[20%] w-[30%] h-[20%] bg-white/30 rounded-[50%] -rotate-12 blur-[4px]" />
          </div>
          
          {/* Knot */}
          <div className="absolute bottom-0 left-1/2 w-4 h-3 bg-red-700 -translate-x-1/2 rounded-md z-10" />
        </div>
      )}

      {/* Explosion/Confetti Particles */}
      {(gameState === GameState.CRASHED || gameState === GameState.CASHED) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {gameState === GameState.CRASHED && (
            <div className="absolute text-5xl font-black text-red-500 animate-pop-in drop-shadow-lg z-30" style={{textShadow: '0 0 20px red'}}>
              BOOM!
            </div>
          )}
          
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute w-4 h-4 rounded-full opacity-0 animate-particle-explode"
              style={{
                backgroundColor: p.color,
                boxShadow: `0 0 10px ${p.color}`,
                '--angle': `${p.angle}deg`,
                '--speed': `${p.speed}px`,
                // Make confetti square-ish
                borderRadius: gameState === GameState.CASHED ? '2px' : '50%',
                width: gameState === GameState.CASHED ? '8px' : '16px',
                height: gameState === GameState.CASHED ? '8px' : '16px',
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Success Text Overlay */}
      {gameState === GameState.CASHED && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 animate-pop-in">
          <div className="text-6xl font-black text-white drop-shadow-[0_4px_15px_rgba(0,0,0,0.8)]">
             WIN!
          </div>
          <div className="text-4xl font-mono font-bold text-green-400 drop-shadow-[0_4px_8px_rgba(0,0,0,1)] bg-black/60 px-6 py-2 rounded-full backdrop-blur-sm border border-green-500/30 mt-2">
            +{displayWinAmount} <span className="text-xl">FCFA</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Balloon;