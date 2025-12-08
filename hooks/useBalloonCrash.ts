import { useState, useRef, useCallback, useEffect } from 'react';
import { GameState } from '../types';
import {
  MIN_CRASH_TIME_MS,
  MAX_CRASH_TIME_MS,
  RESET_DELAY_MS,
  BASE_PROFIT,
  PROFIT_MULTIPLIER,
  SCALE_GROWTH_RATE,
  INITIAL_SCALE,
} from '../constants';

export const useBalloonCrash = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [profit, setProfit] = useState<number>(0);
  const [scale, setScale] = useState<number>(INITIAL_SCALE);
  const [lastProfit, setLastProfit] = useState<number | null>(null);
  const [lastLoss, setLastLoss] = useState<number | null>(null);

  const startTimeRef = useRef<number>(0);
  const crashTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const autoCashoutTargetRef = useRef<number | null>(null);

  const calculateProfit = (elapsedSeconds: number) => {
    return Math.floor(BASE_PROFIT * Math.pow(PROFIT_MULTIPLIER, elapsedSeconds));
  };

  const resetGame = useCallback(() => {
    setGameState(GameState.IDLE);
    setProfit(0);
    setScale(INITIAL_SCALE);
  }, []);

  const crash = useCallback(() => {
    setGameState(GameState.CRASHED);
    cancelAnimationFrame(animationFrameRef.current);
    
    // Calculate final crash value based on the predetermined crash time
    const crashSeconds = crashTimeRef.current / 1000;
    const finalValue = Math.floor(BASE_PROFIT * Math.pow(PROFIT_MULTIPLIER, crashSeconds));
    
    setProfit(finalValue); // Update UI to show exactly what it crashed at
    setLastLoss(finalValue); // Register the loss

    setTimeout(resetGame, RESET_DELAY_MS);
  }, [resetGame]);

  const encash = useCallback(() => {
    // Prevent encashing if already crashed or cashed
    setGameState(currentState => {
      if (currentState !== GameState.INFLATING) return currentState;
      
      cancelAnimationFrame(animationFrameRef.current);
      
      // We need to capture the current profit at the moment of encash
      setProfit(currentProfit => {
        setLastProfit(currentProfit);
        return currentProfit;
      });

      setTimeout(resetGame, RESET_DELAY_MS);
      return GameState.CASHED;
    });
  }, [resetGame]);

  const updateLoop = useCallback(() => {
    const now = Date.now();
    const elapsedMs = now - startTimeRef.current;
    
    // 1. Check for Crash
    if (elapsedMs >= crashTimeRef.current) {
      crash();
      return;
    }

    const elapsedSeconds = elapsedMs / 1000;
    
    // 2. Calculate new state
    const currentCalculatedProfit = calculateProfit(elapsedSeconds);
    const newScale = INITIAL_SCALE + (elapsedSeconds * SCALE_GROWTH_RATE);
    
    // 3. Check for Auto-Cashout
    // We check this BEFORE updating state to ensure instant trigger
    if (
      autoCashoutTargetRef.current !== null && 
      autoCashoutTargetRef.current > 0 && 
      currentCalculatedProfit >= autoCashoutTargetRef.current
    ) {
      // Force profit to match target exactly for visual clarity
      setProfit(currentCalculatedProfit);
      encash(); 
      return; 
    }

    // 4. Update UI
    setScale(newScale);
    setProfit(currentCalculatedProfit);

    animationFrameRef.current = requestAnimationFrame(updateLoop);
  }, [crash, encash]);

  const startGame = useCallback((autoCashoutValue: number | null) => {
    // Random crash time
    const randomCrashTime = Math.floor(
      Math.random() * (MAX_CRASH_TIME_MS - MIN_CRASH_TIME_MS + 1)
    ) + MIN_CRASH_TIME_MS;

    crashTimeRef.current = randomCrashTime;
    startTimeRef.current = Date.now();
    autoCashoutTargetRef.current = autoCashoutValue;
    
    setGameState(GameState.INFLATING);
    setProfit(BASE_PROFIT);
    setScale(INITIAL_SCALE);
    setLastProfit(null);
    setLastLoss(null);

    animationFrameRef.current = requestAnimationFrame(updateLoop);
  }, [updateLoop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, []);

  return {
    gameState,
    profit,
    scale,
    lastProfit,
    lastLoss,
    startGame,
    encash,
  };
};