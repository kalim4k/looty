import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconChevronLeft } from './Icons';

// --- Constants ---
const TICK_RATE_MS = 100;
const MAX_DATA_POINTS = 60;
const INITIAL_PRICE = 1000.00;
const LEVERAGE = 100;
const VOLATILITY = 1.5;

type PositionType = 'LONG' | 'SHORT' | null;

interface PricePoint {
  id: number;
  val: number;
}

interface TradeBossGameProps {
  onBack: () => void;
  balance: number;
  updateBalance: (amount: number) => void;
}

const TradeBossGame: React.FC<TradeBossGameProps> = ({ onBack, balance, updateBalance }) => {
  const [bet, setBet] = useState(100);
  
  // Market State
  const [data, setData] = useState<PricePoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState(INITIAL_PRICE);
  
  // Trade State
  const [position, setPosition] = useState<PositionType>(null);
  const [entryPrice, setEntryPrice] = useState<number | null>(null);
  const [pnl, setPnl] = useState(0); 
  
  const requestRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  const counterRef = useRef(0);

  // --- Game Loop ---
  useEffect(() => {
    const initialData = Array.from({ length: MAX_DATA_POINTS }).map((_, i) => ({
      id: i,
      val: INITIAL_PRICE
    }));
    setData(initialData);
    counterRef.current = MAX_DATA_POINTS;

    const animate = (time: number) => {
      if (time - lastUpdateRef.current > TICK_RATE_MS) {
        lastUpdateRef.current = time;
        setCurrentPrice((prev) => {
          const change = (Math.random() - 0.5) * VOLATILITY; 
          const trend = Math.sin(time / 2000) * 0.2; 
          let newPrice = prev + change + trend;
          return Math.max(0.01, parseFloat(newPrice.toFixed(2)));
        });
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  // --- Sync Data & PnL ---
  useEffect(() => {
    setData((prev) => {
      const newPoint = { id: counterRef.current++, val: currentPrice };
      const newData = [...prev, newPoint];
      if (newData.length > MAX_DATA_POINTS) newData.shift();
      return newData;
    });

    if (position && entryPrice) {
      const priceDiff = currentPrice - entryPrice;
      const rawPnl = (priceDiff / entryPrice) * bet * LEVERAGE;
      const calculatedPnl = position === 'LONG' ? rawPnl : -rawPnl;
      
      setPnl(calculatedPnl);

      if (calculatedPnl <= -bet) {
        handleClosePosition(true); // Liquidation
      }
    }
  }, [currentPrice]);

  const handleTrade = (type: PositionType) => {
    if (balance < bet) return alert("Solde insuffisant !");
    
    updateBalance(-bet); // Deduct margin
    setPosition(type);
    setEntryPrice(currentPrice);
    setPnl(0);
  };

  const handleClosePosition = (isLiquidation = false) => {
    if (!isLiquidation) {
      // Return initial bet + pnl
      updateBalance(bet + pnl);
    }
    // If liquidation, nothing is returned (bet already deducted)
    
    setPosition(null);
    setEntryPrice(null);
    setPnl(0);
  };

  const minVal = useMemo(() => Math.min(...data.map(d => d.val)), [data]);
  const maxVal = useMemo(() => Math.max(...data.map(d => d.val)), [data]);
  const range = maxVal - minVal || 1; 
  
  const getSvgPath = () => {
    const points = data.map((d, i) => {
      const x = (i / (MAX_DATA_POINTS - 1)) * 100;
      const normalizedY = (d.val - minVal) / range;
      const y = 200 - (normalizedY * 160 + 20);
      return `${x},${y}`;
    });
    
    const d = `M ${points[0]} L ${points.join(' L ')}`;
    const areaD = `${d} L 100,250 L 0,250 Z`;
    return { d, areaD };
  };

  const { d, areaD } = getSvgPath();
  const isProfit = pnl >= 0;
  
  let chartColor = '#3b82f6';
  if (position) {
    chartColor = isProfit ? '#10b981' : '#ef4444';
  } else {
    if (data.length > 1) {
       chartColor = data[data.length-1].val >= data[data.length-2].val ? '#10b981' : '#ef4444';
    }
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col font-sans relative overflow-hidden">
      
      {/* Header */}
      <div className="flex-none h-16 px-4 flex justify-between items-center z-30 bg-black/40 backdrop-blur-md border-b border-white/10">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-full active:scale-95 transition">
          <IconChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex flex-col items-end">
           <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Solde Disponible</span>
           <span className="text-lg font-mono font-bold">{Math.floor(balance).toLocaleString()} <span className="text-xs text-blue-500">FCFA</span></span>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 relative flex flex-col">
        <div className="flex-1 relative w-full overflow-hidden flex items-center bg-gradient-to-b from-slate-900/0 to-slate-900/50">
           <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-0 opacity-20">
              <div className="text-6xl font-black tracking-tighter tabular-nums">{currentPrice.toFixed(2)}</div>
              <div className="text-sm uppercase tracking-[0.5em] font-bold mt-2">ETH / USD</div>
           </div>
           <svg className="w-full h-[250px] overflow-visible z-10" preserveAspectRatio="none" viewBox="0 0 100 200">
             <defs>
               <linearGradient id="gradientDetails" x1="0" x2="0" y1="0" y2="1">
                 <stop offset="0%" stopColor={chartColor} stopOpacity="0.4" />
                 <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
               </linearGradient>
               <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                 <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                 <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
               </filter>
             </defs>
             <path d={areaD} fill="url(#gradientDetails)" className="transition-all duration-300 ease-linear" />
             <path d={d} fill="none" stroke={chartColor} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" filter="url(#glow)" className="transition-all duration-300 ease-linear" />
             {data.length > 0 && (
                <circle cx="100" cy={200 - ((data[data.length-1].val - minVal)/range * 160 + 20)} r="3" fill="white" className="animate-pulse"/>
             )}
           </svg>
           
           <AnimatePresence>
             {position && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute bottom-10 inset-x-0 flex flex-col items-center justify-center z-20">
                 <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Profit en cours</div>
                 <div className={`text-5xl font-black tabular-nums tracking-tight ${isProfit ? 'text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]' : 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]'}`}>
                   {pnl > 0 ? '+' : ''}{pnl.toFixed(0)}
                 </div>
                 <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded bg-white/10 text-gray-300 font-mono">Entrée: {entryPrice?.toFixed(2)}</span>
                    <span className={`text-xs px-2 py-1 rounded font-mono font-bold ${position === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                       {position} x{LEVERAGE}
                    </span>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        <div className="bg-[#111] border-t border-white/10 p-6 z-30 pb-safe">
           {!position && (
             <div className="flex justify-between items-center mb-6 bg-[#222] p-2 rounded-2xl border border-white/5">
                <button onClick={() => setBet(Math.max(10, bet - 50))} className="w-12 h-12 flex items-center justify-center bg-[#333] rounded-xl text-xl hover:bg-[#444] transition text-white font-bold">-</button>
                <div className="flex flex-col items-center">
                   <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Mise</span>
                   <span className="text-2xl font-mono font-bold text-white">{bet}</span>
                </div>
                <button onClick={() => setBet(Math.min(balance, bet + 50))} className="w-12 h-12 flex items-center justify-center bg-[#333] rounded-xl text-xl hover:bg-[#444] transition text-white font-bold">+</button>
             </div>
           )}

           <div className="flex gap-4 h-20">
              {!position ? (
                <>
                  <button onClick={() => handleTrade('LONG')} className="flex-1 bg-[#1a332a] border border-[#2d5c4b] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group active:scale-95 transition-all">
                     <div className="absolute inset-0 bg-green-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                     <span className="text-green-400 font-black text-xl tracking-wider">BUY</span>
                     <span className="text-[10px] text-green-500/60 font-bold uppercase mt-1">Monter</span>
                  </button>

                  <button onClick={() => handleTrade('SHORT')} className="flex-1 bg-[#331a1a] border border-[#5c2d2d] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group active:scale-95 transition-all">
                     <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                     <span className="text-red-400 font-black text-xl tracking-wider">SELL</span>
                     <span className="text-[10px] text-red-500/60 font-bold uppercase mt-1">Descendre</span>
                  </button>
                </>
              ) : (
                <button onClick={() => handleClosePosition()} className="flex-1 bg-white text-black rounded-2xl font-black text-2xl uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95 transition-all animate-pulse-fast">
                  Close Position
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default TradeBossGame;