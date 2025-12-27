import { useState, useRef, useCallback, useEffect } from 'react';

export enum LuckyState {
  IDLE = 'idle',
  FLYING = 'flying',
  CRASHED = 'crashed',
  CASHED = 'cashed',
}

export const useLuckyJet = () => {
  const [gameState, setGameState] = useState<LuckyState>(LuckyState.IDLE);
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [lastWin, setLastWin] = useState<number | null>(null);

  const startTimeRef = useRef<number>(0);
  const crashTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const autoCashoutTargetRef = useRef<number | null>(null);
  const betAmountRef = useRef<number>(0);

  const calculateMultiplier = (elapsedSeconds: number) => {
    // Progressive exponential growth
    return Math.max(1, parseFloat(Math.exp(0.075 * elapsedSeconds).toFixed(2)));
  };

  const resetGame = useCallback(() => {
    setGameState(LuckyState.IDLE);
    setMultiplier(1.00);
  }, []);

  const crash = useCallback(() => {
    setGameState(LuckyState.CRASHED);
    cancelAnimationFrame(animationFrameRef.current);
    setTimeout(resetGame, 4000);
  }, [resetGame]);

  const encash = useCallback(() => {
    // Atomic state check to prevent double cashout
    let finalWin = 0;
    setGameState(currentState => {
      if (currentState !== LuckyState.FLYING) return currentState;
      
      cancelAnimationFrame(animationFrameRef.current);
      finalWin = Math.floor(betAmountRef.current * multiplier);
      setLastWin(finalWin);
      setTimeout(resetGame, 3000);
      return LuckyState.CASHED;
    });
    return finalWin;
  }, [multiplier, resetGame]);

  const updateLoop = useCallback(() => {
    const now = Date.now();
    const elapsedMs = now - startTimeRef.current;
    
    // Check for crash
    if (elapsedMs >= crashTimeRef.current) {
      crash();
      return;
    }

    const elapsedSeconds = elapsedMs / 1000;
    const newMult = calculateMultiplier(elapsedSeconds);
    
    // Auto cashout check
    if (autoCashoutTargetRef.current && newMult >= autoCashoutTargetRef.current) {
      setMultiplier(autoCashoutTargetRef.current);
      encash();
      return;
    }

    setMultiplier(newMult);
    animationFrameRef.current = requestAnimationFrame(updateLoop);
  }, [crash, encash]);

  const startGame = useCallback((bet: number, autoCashout: number | null) => {
    // Algorithmic crash point
    const r = Math.random();
    // 97% RTP logic simulation
    const crashAt = 0.97 / (1 - r);
    // Limit extreme values for mobile gameplay feel
    const clampedCrash = Math.min(crashAt, 50);
    const maxSeconds = Math.log(clampedCrash) / 0.075;
    
    crashTimeRef.current = Math.max(100, maxSeconds * 1000);
    startTimeRef.current = Date.now();
    autoCashoutTargetRef.current = autoCashout;
    betAmountRef.current = bet;
    
    setGameState(LuckyState.FLYING);
    setMultiplier(1.00);
    setLastWin(null);

    animationFrameRef.current = requestAnimationFrame(updateLoop);
  }, [updateLoop]);

  useEffect(() => {
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, []);

  return { gameState, multiplier, lastWin, startGame, encash };
};