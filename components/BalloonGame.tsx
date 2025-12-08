import React, { useEffect, useRef } from 'react';
import Balloon from './Balloon';
import ProfitDisplay from './ProfitDisplay';
import Controls from './Controls';
import { useBalloonCrash } from '../hooks/useBalloonCrash';
import { IconChevronLeft } from './Icons';
import { GameState } from '../types';

interface BalloonGameProps {
  onBack: () => void;
  balance: number;
  updateBalance: (amount: number) => void;
  onPlayRound: () => void;
}

const BalloonGame: React.FC<BalloonGameProps> = ({ onBack, balance, updateBalance, onPlayRound }) => {
  const { gameState, profit, scale, lastProfit, lastLoss, startGame, encash } = useBalloonCrash();
  
  // Ref to track if we have processed the financial result of the current round
  const processedResultRef = useRef(false);

  // Hook into startGame to update global limits
  const handleStart = (autoCashout: number | null) => {
    onPlayRound(); // Increment daily count
    startGame(autoCashout);
  };

  // Reset processed flag when game starts
  useEffect(() => {
    if (gameState === GameState.INFLATING) {
      processedResultRef.current = false;
    }
  }, [gameState]);

  // Handle Win/Loss updates
  useEffect(() => {
    if (processedResultRef.current) return;

    if (gameState === GameState.CASHED && lastProfit) {
      updateBalance(lastProfit);
      processedResultRef.current = true;
    } else if (gameState === GameState.CRASHED && lastLoss) {
      // Deduct loss (App logic handles not going below zero)
      updateBalance(-lastLoss);
      processedResultRef.current = true;
    }
  }, [gameState, lastProfit, lastLoss, updateBalance]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-between overflow-hidden touch-none select-none relative font-sans animate-pop-in">
      
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-purple-600 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="w-full p-4 z-20 flex justify-between items-center absolute top-0 left-0">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md active:scale-95 transition-transform"
        >
          <IconChevronLeft className="text-white" />
        </button>
        <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md text-white/80">
          Solde: {balance.toLocaleString()} FCFA
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full z-10 relative mt-16">
        <div className="relative h-80 w-full flex items-center justify-center">
          <Balloon scale={scale} gameState={gameState} earnedAmount={lastProfit} />
        </div>
        
        <ProfitDisplay 
          profit={profit} 
          gameState={gameState} 
          lastProfit={lastProfit}
        />
      </div>

      {/* Controls */}
      <Controls 
        gameState={gameState} 
        onStart={handleStart} 
        onEncash={encash} 
      />
    </div>
  );
};

export default BalloonGame;