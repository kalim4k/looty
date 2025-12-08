import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconChevronLeft, IconTrophy } from './Icons';

// --- Types & Constants ---
type GameStatus = 'IDLE' | 'PLAYING' | 'GAMEOVER' | 'VICTORY' | 'CASHED_OUT';

const COLS = 3;
const VISIBLE_ROWS_COUNT = 4;
const ROW_HEIGHT = 90; // px height per row (80px tile + 10px gap)
const VIEWPORT_HEIGHT = VISIBLE_ROWS_COUNT * ROW_HEIGHT; // 360px

// Generate a multiplier curve: 1.44, 2.07, 2.98, etc.
const GET_MULTIPLIER = (rowIndex: number) => {
  let val = 1.0;
  for(let i=0; i<=rowIndex; i++) {
     val *= 1.44;
  }
  return val;
};

// Generate fresh rows helper
const generateRows = (count: number, startIndex: number = 0) => {
  return Array.from({ length: count }).map((_, i) => ({
      id: startIndex + i,
      bombIndex: Math.floor(Math.random() * COLS),
      selectedIndex: null,
      multiplier: parseFloat(GET_MULTIPLIER(startIndex + i).toFixed(2))
    }));
};

// Sound Synthesizer Helper
const playTone = (type: 'click' | 'success' | 'explode' | 'cashout' | 'start') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  
  if (type === 'click') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'start') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.2);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'success') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.linearRampToValueAtTime(1000, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'explode') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
    if (navigator.vibrate) navigator.vibrate(400);
  } else if (type === 'cashout') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  }
};

interface RowData {
  id: number;
  bombIndex: number; // 0, 1, or 2
  selectedIndex: number | null; // which col user clicked
  multiplier: number;
}

interface MinesweeperGameProps {
  onBack: () => void;
  balance: number;
  updateBalance: (amount: number) => void;
}

const MinesweeperGame: React.FC<MinesweeperGameProps> = ({ onBack, balance, updateBalance }) => {
  const [bet, setBet] = useState(100);
  const [status, setStatus] = useState<GameStatus>('IDLE');
  
  // Game State
  const [rows, setRows] = useState<RowData[]>([]);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);

  // Initialize grid on mount so it's not empty
  useEffect(() => {
    setRows(generateRows(20));
  }, []);

  // Initialize new game
  const startGame = () => {
    if (balance < bet) {
        alert("Solde insuffisant !");
        return;
    }
    playTone('start');
    
    // Deduct Bet
    updateBalance(-bet);

    setStatus('PLAYING');
    setCurrentRowIndex(0);
    
    // Create new batch of rows
    setRows(generateRows(20));
  };

  const handleTileClick = async (rowIndex: number, colIndex: number) => {
    if (status !== 'PLAYING') return;
    if (rowIndex !== currentRowIndex) return; // Only allow clicking active row

    playTone('click');
    
    // Update State
    const row = rows[rowIndex];
    const isBomb = row.bombIndex === colIndex;

    // Update the row with the user's selection
    const updatedRows = [...rows];
    updatedRows[rowIndex] = { ...row, selectedIndex: colIndex };
    setRows(updatedRows);

    if (isBomb) {
      // --- GAME OVER ---
      playTone('explode');
      setStatus('GAMEOVER');
    } else {
      // --- SAFE ---
      playTone('success');
      
      // Delay slightly for visual effect before moving active state
      setTimeout(() => {
         // Check if we need to add more rows for infinite scroll
         if (currentRowIndex + 5 > rows.length) {
            const nextId = rows.length;
            const newRows = generateRows(10, nextId);
            setRows(prev => [...prev, ...newRows]);
         }
         setCurrentRowIndex(prev => prev + 1);
      }, 150);
    }
  };

  const handleCashout = () => {
    if (status !== 'PLAYING' || currentRowIndex === 0) return;
    
    playTone('cashout');
    
    // Calculate win based on PREVIOUS cleared row
    const lastClearedRow = rows[currentRowIndex - 1];
    const winAmount = Math.floor(bet * lastClearedRow.multiplier);
    
    updateBalance(winAmount);
    setStatus('CASHED_OUT');
  };

  // --- Scroll Logic ---
  const scrollOffset = useMemo(() => {
    if (currentRowIndex < 2) return 0;
    return (currentRowIndex - 1) * ROW_HEIGHT;
  }, [currentRowIndex]);

  const currentMultiplier = currentRowIndex > 0 ? rows[currentRowIndex - 1].multiplier : 1.0;
  const currentProfit = Math.floor(bet * currentMultiplier);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col font-sans overflow-hidden relative select-none">
      
      {/* Header */}
      <div className="flex-none h-16 px-4 flex justify-between items-center bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-700 z-30">
        <button onClick={onBack} className="p-2 bg-slate-700/50 rounded-full active:scale-95 transition hover:bg-slate-700">
          <IconChevronLeft className="w-5 h-5 text-slate-300" />
        </button>
        <div className="flex flex-col items-end">
           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Solde</span>
           <span className="text-lg font-black text-white font-mono tracking-tight">
             {balance.toLocaleString()} <span className="text-blue-500 text-xs">FCFA</span>
           </span>
        </div>
      </div>

      {/* Game Area (Viewport) - Centered and Constrained */}
      <div className="flex-1 relative bg-slate-900 w-full flex flex-col items-center justify-center">
        
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '100% 90px' }}>
        </div>

        {/* The Constrained Game Board Window */}
        <div 
           className="relative w-full max-w-md overflow-hidden z-10 border-y border-slate-800 bg-slate-900/50 backdrop-blur-sm"
           style={{ height: VIEWPORT_HEIGHT }}
        >
             <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-slate-900 via-slate-900/60 to-transparent z-20 pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-20 pointer-events-none" />

            <motion.div 
               className="w-full px-6 flex flex-col-reverse justify-start items-center absolute bottom-0 left-0 right-0 gap-[10px]"
               animate={{ y: scrollOffset }}
               transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
               {rows.map((row) => {
                  if (Math.abs(row.id - currentRowIndex) > 6) return null;

                  const isActive = status === 'PLAYING' && row.id === currentRowIndex;
                  const isIdle = status === 'IDLE';
                  const isPast = row.id < currentRowIndex || (status !== 'PLAYING' && !isIdle);
                  
                  return (
                     <GameRow 
                        key={row.id}
                        data={row}
                        isActive={isActive}
                        isPast={isPast}
                        status={status}
                        onClick={(colIdx) => handleTileClick(row.id, colIdx)}
                     />
                  );
               })}
               <div className="absolute bottom-0 w-full h-0.5 bg-blue-500/30 shadow-[0_0_10px_#3b82f6]" />
            </motion.div>

            <AnimatePresence>
                {status === 'GAMEOVER' && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
                >
                    <div className="bg-red-500 text-white px-10 py-6 rounded-3xl font-black text-4xl shadow-[0_0_60px_rgba(239,68,68,0.6)] rotate-[-6deg] border-4 border-white/20 pointer-events-auto">
                        BOOM!
                    </div>
                </motion.div>
                )}
                
                {status === 'CASHED_OUT' && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
                >
                    <div className="flex flex-col items-center pointer-events-auto">
                        <IconTrophy className="w-20 h-20 text-yellow-400 mb-4 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)] animate-bounce" />
                        <div className="bg-green-600 text-white px-8 py-4 rounded-3xl font-black text-3xl shadow-[0_0_50px_rgba(22,163,74,0.6)] border-4 border-white/20 mb-2">
                            GAGNÉ!
                        </div>
                        <div className="bg-slate-900/90 text-green-400 px-6 py-2 rounded-full font-mono font-bold text-xl border border-green-500/30">
                            +{Math.floor(bet * (rows[currentRowIndex - 1]?.multiplier || 0))} FCFA
                        </div>
                    </div>
                </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-none bg-[#1e293b] border-t border-slate-700 p-4 pb-8 z-30 shadow-2xl relative">
         {status === 'IDLE' || status === 'GAMEOVER' || status === 'VICTORY' || status === 'CASHED_OUT' ? (
           <div className="space-y-4 max-w-md mx-auto">
              <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-700">
                 <button 
                   onClick={() => setBet(Math.max(10, bet - 100))} 
                   className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-xl font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition"
                 >-</button>
                 <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Mise</span>
                    <input 
                      type="number" 
                      value={bet}
                      onChange={(e) => setBet(Number(e.target.value))}
                      className="bg-transparent text-center text-2xl font-black text-white font-mono w-32 focus:outline-none"
                    />
                 </div>
                 <button 
                   onClick={() => setBet(Math.min(balance, bet + 100))} 
                   className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-xl font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition"
                 >+</button>
              </div>
              <button 
                onClick={startGame}
                className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-xl font-black uppercase tracking-widest shadow-lg shadow-blue-900/40 active:scale-[0.98] transition-all text-white"
              >
                {status === 'IDLE' ? 'Démarrer' : 'Rejouer'}
              </button>
           </div>
         ) : (
           <div className="space-y-3 max-w-md mx-auto">
              <div className="flex justify-between items-center px-2">
                 <div className="text-xs font-bold text-slate-400">Gain actuel</div>
                 <div className="text-xl font-mono font-bold text-green-400">
                    {currentProfit} FCFA <span className="text-xs text-slate-500">({currentMultiplier}x)</span>
                 </div>
              </div>
              <button 
                onClick={handleCashout}
                disabled={currentRowIndex === 0}
                className={`
                  w-full py-5 rounded-2xl text-xl font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2
                  ${currentRowIndex === 0 
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-900/40 animate-pulse-fast active:scale-[0.98]'}
                `}
              >
                {currentRowIndex === 0 ? 'Choisis une case' : 'Encaisser'}
              </button>
           </div>
         )}
      </div>
    </div>
  );
};

// ... Row and Tile components remain same structure but inlined ...
interface GameRowProps {
  data: RowData;
  isActive: boolean;
  isPast: boolean;
  status: GameStatus;
  onClick: (colIdx: number) => void;
}

const GameRow: React.FC<GameRowProps> = ({ data, isActive, isPast, status, onClick }) => {
  let opacityClass = 'opacity-30 scale-90'; 
  if (isActive) opacityClass = 'opacity-100 scale-100';
  else if (status === 'IDLE' && data.id < 4) opacityClass = 'opacity-100 scale-100'; 
  else if (isPast) opacityClass = 'opacity-40 scale-95 blur-[1px]';

  return (
    <div className={`w-full flex items-center justify-between h-[80px] shrink-0 transition-all duration-500 ${opacityClass}`}>
      <div className={`absolute left-0 -ml-2 transform -translate-x-full w-12 text-right pr-3 flex items-center justify-end ${isActive ? 'text-white' : 'text-slate-600'}`}>
         <span className={`font-mono font-bold text-sm bg-slate-800 px-1.5 py-0.5 rounded ${isActive ? 'text-blue-400 ring-1 ring-blue-500/50' : ''}`}>
            x{data.multiplier}
         </span>
      </div>
      <div className="flex gap-3 w-full justify-between">
        {[0, 1, 2].map((colIdx) => {
           const isSelected = data.selectedIndex === colIdx;
           const isBomb = data.bombIndex === colIdx;
           let state: 'hidden' | 'safe' | 'bomb' | 'missed' = 'hidden';
           if (status === 'GAMEOVER' || status === 'CASHED_OUT') {
              if (isBomb && isSelected) state = 'bomb'; 
              else if (isBomb) state = 'bomb'; 
              else if (isSelected) state = 'safe';
              else state = 'hidden';
           } else {
              if (isSelected && isBomb) state = 'bomb';
              else if (isSelected) state = 'safe';
              else state = 'hidden';
           }
           return <GameTile key={colIdx} state={state} active={isActive} onClick={() => onClick(colIdx)} />;
        })}
      </div>
    </div>
  );
};

interface GameTileProps {
  state: 'hidden' | 'safe' | 'bomb' | 'missed';
  active: boolean;
  onClick: () => void;
}

const GameTile: React.FC<GameTileProps> = ({ state, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={!active || state !== 'hidden'}
      className={`
        relative w-full aspect-square rounded-[20px] flex items-center justify-center transition-all duration-300
        ${state === 'hidden' ? 'bg-[#262f45] shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)]' : ''}
        ${active && state === 'hidden' ? 'cursor-pointer hover:bg-[#2f3b54] hover:-translate-y-1 active:scale-95 ring-2 ring-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : ''}
        ${!active && state === 'hidden' ? 'cursor-not-allowed' : ''}
        ${state === 'safe' ? 'bg-[#1a2333] shadow-none ring-2 ring-[#00ff88] shadow-[0_0_20px_#00ff8840]' : ''}
        ${state === 'bomb' ? 'bg-[#2a1515] shadow-none ring-2 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : ''}
      `}
    >
      {state === 'safe' && <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} className="w-16 h-16 rounded-full border-[6px] border-[#00ff88] shadow-[0_0_15px_#00ff88,inset_0_0_15px_#00ff88]" />}
      {state === 'bomb' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-4xl filter drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">💣</motion.div>}
      {state === 'hidden' && <div className="w-8 h-8 rounded-full bg-slate-700/30" />}
    </button>
  );
};

export default MinesweeperGame;