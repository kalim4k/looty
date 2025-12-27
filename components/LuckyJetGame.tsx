import React, { useState, useEffect } from 'react';
import { LuckyState, useLuckyJet } from '../hooks/useLuckyJet';
import { IconChevronLeft, IconTrophy } from './Icons';

interface LuckyJetGameProps {
  onBack: () => void;
  balance: number;
  updateBalance: (amount: number) => void;
  onPlayRound: () => void;
}

const RocketVisual = ({ isFlying, isCrashed }: { isFlying: boolean; isCrashed: boolean }) => {
  if (isCrashed) return <div className="text-8xl animate-bounce">💥</div>;

  return (
    <div className={`relative transition-all duration-500 ${isFlying ? 'scale-110' : 'scale-100'}`}>
      {/* Rocket Trailing Smoke/Light (Only when flying) */}
      {isFlying && (
        <div className="absolute top-1/2 left-0 -translate-x-full w-40 h-1 bg-gradient-to-r from-transparent to-blue-500/50 blur-md -rotate-12" />
      )}
      
      <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${isFlying ? 'animate-wiggle' : 'animate-float'}`}>
        {/* Flame */}
        {isFlying && (
          <path d="M7 17L3 21M7 17L5 19" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
        )}
        {/* Rocket Body */}
        <path d="M4.5 16.5C4.5 16.5 4 15.5 4 13.5C4 11.5 5 8 8 5C11 2 15 2 15 2C15 2 15 6 12 9C9 12 5.5 13 3.5 13C3.5 13 4.5 12.5 4.5 16.5Z" fill="url(#rocketGrad)" stroke="white" strokeWidth="0.5"/>
        {/* Fins */}
        <path d="M12 12L15 15L17 14L14 11L12 12Z" fill="#1e40af" stroke="white" strokeWidth="0.5"/>
        <path d="M8 8L5 5L4 7L7 10L8 8Z" fill="#1e40af" stroke="white" strokeWidth="0.5"/>
        {/* Window */}
        <circle cx="10" cy="7" r="1.5" fill="#60a5fa" />
        
        <defs>
          <linearGradient id="rocketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Engine Glow */}
      {isFlying && (
        <div className="absolute bottom-6 left-6 w-8 h-8 bg-blue-500 rounded-full blur-xl animate-pulse" />
      )}
    </div>
  );
};

const LuckyJetGame: React.FC<LuckyJetGameProps> = ({ onBack, balance, updateBalance, onPlayRound }) => {
  const { gameState, multiplier, lastWin, startGame, encash } = useLuckyJet();
  const [bet, setBet] = useState(100);
  const [autoStop, setAutoStop] = useState<string>('');
  const [processed, setProcessed] = useState(false);

  // Sync balance when win or loss happens
  useEffect(() => {
    if (gameState === LuckyState.FLYING) {
      setProcessed(false);
    }
    
    if (!processed) {
      if (gameState === LuckyState.CASHED && lastWin) {
        updateBalance(lastWin);
        setProcessed(true);
      } else if (gameState === LuckyState.CRASHED) {
        setProcessed(true);
      }
    }
  }, [gameState, lastWin, updateBalance, processed]);

  const handleStart = () => {
    if (gameState !== LuckyState.IDLE) return;
    if (balance < bet) return;
    
    updateBalance(-bet);
    onPlayRound();
    const target = autoStop && !isNaN(parseFloat(autoStop)) ? parseFloat(autoStop) : null;
    startGame(bet, target);
  };

  const isFlying = gameState === LuckyState.FLYING;
  const isCrashed = gameState === LuckyState.CRASHED;
  const isCashed = gameState === LuckyState.CASHED;
  const isWaiting = isCrashed || isCashed;

  // Trajectory calculation for the rocket
  const getRocketTransform = () => {
    if (!isFlying) return 'translate(0, 0)';
    // Rocket moves up and slightly right as multiplier grows
    const progress = Math.min(1, (multiplier - 1) / 10); // Max offset at 11x
    const tx = progress * 100;
    const ty = -progress * 150;
    return `translate(${tx}px, ${ty}px) rotate(${-progress * 15}deg)`;
  };

  return (
    <div className="fixed inset-0 bg-[#020617] text-white flex flex-col font-sans overflow-hidden select-none z-50">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1e3a8a33_0%,transparent_60%)]" />
        {/* Perspective Grid */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            perspective: '500px',
            transform: isFlying ? `translateY(${(Date.now() / 15) % 60}px) rotateX(45deg)` : 'rotateX(45deg)',
            transformOrigin: 'center bottom'
          }}
        />
        {/* Stars */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div 
              key={i} 
              className={`absolute w-1 h-1 bg-white rounded-full ${isFlying ? 'animate-pulse' : ''}`}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="w-full p-4 z-20 flex justify-between items-center relative bg-black/20 backdrop-blur-sm">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-95 transition-all">
          <IconChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-end">
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Votre Solde</div>
          <div className="text-2xl font-black tabular-nums tracking-tighter">
            {balance.toLocaleString()} <span className="text-blue-500 text-xs">FCFA</span>
          </div>
        </div>
      </div>

      {/* Game Stage */}
      <div className="flex-1 w-full relative flex flex-col items-center justify-center">
        {/* Multiplier Center */}
        <div className="relative z-20 text-center mb-20">
          <div className={`text-8xl font-black tabular-nums tracking-tighter transition-all duration-300 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)] ${isCrashed ? 'text-red-500 scale-90' : 'text-white scale-110'}`}>
            {multiplier.toFixed(2)}<span className="text-4xl">x</span>
          </div>
          {isCashed && (
            <div className="mt-2 text-green-400 font-bold uppercase tracking-widest animate-bounce">Gain Encaissé !</div>
          )}
        </div>

        {/* Rocket Container */}
        <div className="relative w-full h-80 flex items-center justify-center">
            <div 
              className="transition-transform duration-300 ease-linear"
              style={{ transform: getRocketTransform() }}
            >
              <RocketVisual isFlying={isFlying} isCrashed={isCrashed} />
            </div>
            
            {/* Win Popup */}
            {isCashed && lastWin && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-pop-in">
                 <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-10 py-5 rounded-[2.5rem] shadow-[0_0_60px_rgba(34,197,94,0.6)] border-4 border-white/20 flex flex-col items-center">
                    <div className="text-xs font-black text-white/80 uppercase tracking-[0.3em] mb-1">GAGNÉ !</div>
                    <div className="text-4xl font-black text-white">{lastWin.toLocaleString()} <span className="text-xl">FCFA</span></div>
                 </div>
              </div>
            )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full bg-[#0f172a]/95 backdrop-blur-2xl border-t border-white/10 p-6 pb-12 z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="max-w-md mx-auto space-y-5">
          
          <div className="grid grid-cols-2 gap-4">
             {/* Bet Setting */}
             <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-400/70 uppercase tracking-widest pl-2">Mise (FCFA)</label>
                <div className="flex items-center bg-black/40 rounded-2xl border border-white/10 p-1">
                   <button 
                     onClick={() => setBet(Math.max(10, bet - 50))} 
                     disabled={isFlying || isWaiting}
                     className="w-12 h-12 flex items-center justify-center font-black text-blue-500 disabled:opacity-20"
                   >–</button>
                   <input 
                     type="number" 
                     value={bet} 
                     onChange={(e) => setBet(Math.max(0, parseInt(e.target.value) || 0))}
                     disabled={isFlying || isWaiting}
                     className="bg-transparent text-center w-full font-black text-lg focus:outline-none disabled:text-slate-500"
                   />
                   <button 
                     onClick={() => setBet(bet + 50)} 
                     disabled={isFlying || isWaiting}
                     className="w-12 h-12 flex items-center justify-center font-black text-blue-500 disabled:opacity-20"
                   >+</button>
                </div>
             </div>
             {/* Auto Cashout */}
             <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-400/70 uppercase tracking-widest pl-2">Auto-Cashout</label>
                <div className="bg-black/40 rounded-2xl border border-white/10 p-4">
                   <input 
                     type="text" 
                     placeholder="Ex: 2.00"
                     value={autoStop}
                     onChange={(e) => setAutoStop(e.target.value)}
                     disabled={isFlying || isWaiting}
                     className="bg-transparent text-center w-full font-black text-lg focus:outline-none placeholder-slate-700 disabled:text-slate-500"
                   />
                </div>
             </div>
          </div>

          {!isFlying ? (
            <button 
              onClick={handleStart}
              disabled={isWaiting || balance < bet}
              className={`w-full py-5 rounded-3xl text-2xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 
                ${isWaiting || balance < bet 
                  ? 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/20 hover:brightness-110'}`}
            >
              {isWaiting ? 'Patientez...' : 'DÉCOLLER'}
            </button>
          ) : (
            <button 
              onClick={() => encash()}
              className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-3xl text-2xl font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(34,197,94,0.4)] animate-pulse-fast active:scale-95 transition-all"
            >
              ENCAISSER ({(bet * multiplier).toFixed(0)})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LuckyJetGame;