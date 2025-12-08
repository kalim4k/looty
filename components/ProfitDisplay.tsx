import React from 'react';
import { GameState } from '../types';

interface ProfitDisplayProps {
  profit: number;
  gameState: GameState;
  lastProfit: number | null;
}

const ProfitDisplay: React.FC<ProfitDisplayProps> = ({ profit, gameState, lastProfit }) => {
  const displayValue = gameState === GameState.CASHED && lastProfit !== null ? lastProfit : profit;

  return (
    <div className="flex flex-col items-center justify-center h-24 mb-4 select-none">
      <div className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-1">
        Current Profit
      </div>
      <div
        className={`text-6xl font-black tracking-tighter tabular-nums transition-colors duration-200 ${
          gameState === GameState.CRASHED
            ? 'text-red-600'
            : gameState === GameState.CASHED
            ? 'text-green-400'
            : 'text-white'
        } ${gameState === GameState.INFLATING ? 'animate-profit-bounce' : ''}`}
      >
        {displayValue.toLocaleString()} <span className="text-2xl font-bold text-white/50">FCFA</span>
      </div>
    </div>
  );
};

export default ProfitDisplay;
