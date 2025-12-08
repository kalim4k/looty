import React, { useState } from 'react';
import { GameState } from '../types';

interface ControlsProps {
  gameState: GameState;
  onStart: (autoCashout: number | null) => void;
  onEncash: () => void;
}

const Controls: React.FC<ControlsProps> = ({ gameState, onStart, onEncash }) => {
  const isPlaying = gameState === GameState.INFLATING;
  const isDisabled = gameState === GameState.CRASHED || gameState === GameState.CASHED;
  
  const [autoTarget, setAutoTarget] = useState<string>('');

  const handleStart = () => {
    const target = autoTarget ? parseInt(autoTarget, 10) : null;
    onStart(target);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Only allow numbers
    if (val === '' || /^\d+$/.test(val)) {
      setAutoTarget(val);
    }
  };

  return (
    <div className="w-full max-w-sm px-4 pb-8 z-10 flex flex-col gap-4">
      
      {/* Auto Cashout Input */}
      <div className={`transition-opacity duration-300 ${isPlaying ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between backdrop-blur-md">
          <label className="text-sm text-gray-400 font-bold uppercase tracking-wider mr-2">
            Objectif (Auto-Stop)
          </label>
          <div className="relative w-32">
             <input
              type="text"
              inputMode="numeric"
              placeholder="Ex: 500"
              value={autoTarget}
              onChange={handleInputChange}
              disabled={isPlaying}
              className="w-full bg-slate-900 text-white font-mono font-bold text-right px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none placeholder-gray-600"
            />
            <span className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none hidden">FCFA</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      {!isPlaying ? (
        <button
          onClick={handleStart}
          onTouchStart={handleStart}
          disabled={isDisabled}
          className={`
            w-full py-6 rounded-2xl text-2xl font-black uppercase tracking-wider shadow-[0_10px_0_rgb(30,58,138)] transform transition-all active:scale-95 active:shadow-none active:translate-y-[10px]
            bg-gradient-to-b from-blue-500 to-blue-700 text-white
            ${isDisabled ? 'opacity-50 cursor-not-allowed filter grayscale' : 'hover:brightness-110'}
          `}
        >
          {gameState === GameState.IDLE ? 'GONFLER !' : 'Wait...'}
        </button>
      ) : (
        <button
          onClick={onEncash}
          onTouchStart={onEncash}
          className={`
            w-full py-6 rounded-2xl text-2xl font-black uppercase tracking-wider shadow-[0_10px_0_rgb(20,83,45)] transform transition-all active:scale-95 active:shadow-none active:translate-y-[10px]
            bg-gradient-to-b from-green-500 to-green-700 text-white
            hover:brightness-110 animate-pulse-fast
          `}
        >
          STOP ({autoTarget ? `Objectif: ${autoTarget}` : 'MANUEL'})
        </button>
      )}
    </div>
  );
};

export default Controls;