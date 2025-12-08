import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import BalloonGame from './components/BalloonGame';
import MinesweeperGame from './components/MinesweeperGame';
import TradeBossGame from './components/TradeBossGame';
import TriumphGame from './components/TriumphGame';
import TrueWarGame from './components/TrueWarGame';
import Wallet from './components/Wallet';
import Profile from './components/Profile';
import BottomNav from './components/BottomNav';
import InstallPWA from './components/InstallPWA';
import Onboarding from './components/Onboarding';
import ResourceLoader from './components/ResourceLoader';

type View = 'home' | 'wallet' | 'profile' | 'balloon' | 'triumph' | 'minesweeper' | 'mine' | 'quizzy' | 'tradeboss' | 'truewar';

interface UserData {
  name: string;
  balance: number;
  setupComplete: boolean; // Flag to check if user has finished onboarding
}

interface GameLimits {
  date: string;
  balloonCount: number; // Max 15
  trueWarCount: number; // Max 1
  triumphSecondsRemaining: number; // Max 60
  adClicks: { [index: number]: number }; // Max 3 per index
}

const INITIAL_LIMITS: GameLimits = {
  date: new Date().toDateString(),
  balloonCount: 0,
  trueWarCount: 0,
  triumphSecondsRemaining: 60,
  adClicks: {}
};

const App: React.FC = () => {
  // --- Global State with Persistence ---
  const [user, setUser] = useState<UserData>(() => {
    const saved = localStorage.getItem('user_data');
    return saved ? JSON.parse(saved) : { name: '', balance: 0, setupComplete: false };
  });

  const [limits, setLimits] = useState<GameLimits>(() => {
    const saved = localStorage.getItem('game_limits');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check for day reset
      if (parsed.date !== new Date().toDateString()) {
        return INITIAL_LIMITS;
      }
      // Migration: Handle old number type for adClicks
      if (typeof parsed.adClicks === 'number') {
        return { ...parsed, adClicks: {} };
      }
      return parsed;
    }
    return INITIAL_LIMITS;
  });

  const [currentTab, setCurrentTab] = useState('home');
  const [currentView, setCurrentView] = useState<View>('home');
  
  // Loading State for Resources
  // If setup is complete, we assume resources are loaded for this session, 
  // but we can force a "fake" load on refresh if we want that effect. 
  // Here, we trigger it only if we just finished onboarding OR if it's a fresh load.
  const [resourcesLoaded, setResourcesLoaded] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('user_data', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('game_limits', JSON.stringify(limits));
  }, [limits]);

  // --- Actions ---
  const updateBalance = (amount: number) => {
    setUser(prev => ({ ...prev, balance: Math.max(0, prev.balance + amount) }));
  };

  const updateProfile = (name: string) => {
    setUser(prev => ({ ...prev, name }));
  };

  const handleOnboardingComplete = (username: string) => {
    setUser(prev => ({ ...prev, name: username, setupComplete: true }));
    // Resources will start loading immediately after this state change because of the render logic
  };

  const handleResourcesLoaded = () => {
    setResourcesLoaded(true);
  };

  // --- Limit Updaters ---
  const incrementBalloon = () => {
    setLimits(prev => ({ ...prev, balloonCount: prev.balloonCount + 1 }));
  };

  const incrementTrueWar = () => {
    setLimits(prev => ({ ...prev, trueWarCount: prev.trueWarCount + 1 }));
  };

  const updateTriumphTime = (secondsUsed: number) => {
    setLimits(prev => ({ 
      ...prev, 
      triumphSecondsRemaining: Math.max(0, prev.triumphSecondsRemaining - secondsUsed) 
    }));
  };

  const incrementAdClick = (index: number) => {
    const currentClicks = limits.adClicks[index] || 0;
    if (currentClicks < 3) {
      setLimits(prev => ({ 
        ...prev, 
        adClicks: {
          ...prev.adClicks,
          [index]: currentClicks + 1
        }
      }));
      updateBalance(10);
      return true;
    }
    return false;
  };

  // --- Navigation Handlers ---
  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId);
    if (tabId === 'home') setCurrentView('home');
    if (tabId === 'wallet') setCurrentView('wallet');
    if (tabId === 'profile') setCurrentView('profile');
  };

  const handlePlayGame = (gameId: string) => {
    setCurrentView(gameId as View);
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setCurrentTab('home');
  };

  // --- Render Content ---
  const renderContent = () => {
    switch (currentView) {
      // Pages
      case 'home':
        return <Home 
          onPlayGame={handlePlayGame} 
          balance={user.balance} 
          userName={user.name} 
          limits={limits}
        />;
      case 'wallet':
        return <Wallet 
          balance={user.balance} 
          limits={limits}
          onAdClick={incrementAdClick}
          updateBalance={updateBalance}
        />;
      case 'profile':
        return <Profile user={user} onUpdateProfile={updateProfile} />;

      // Games
      case 'balloon':
        return <BalloonGame 
          onBack={handleBackToHome} 
          balance={user.balance} 
          updateBalance={updateBalance} 
          onPlayRound={incrementBalloon}
        />;
      case 'triumph':
        return <TriumphGame 
          onBack={handleBackToHome} 
          balance={user.balance} 
          updateBalance={updateBalance}
          initialTime={limits.triumphSecondsRemaining}
          onTimeUpdate={updateTriumphTime}
        />;
      case 'truewar':
        return <TrueWarGame 
          onBack={handleBackToHome} 
          balance={user.balance} 
          updateBalance={updateBalance}
          onPlayRound={incrementTrueWar}
        />;
      
      // Locked Games
      case 'minesweeper':
      case 'tradeboss':
        return <Home onPlayGame={handlePlayGame} balance={user.balance} userName={user.name} limits={limits} />;
      
      default:
        return <Home onPlayGame={handlePlayGame} balance={user.balance} userName={user.name} limits={limits} />;
    }
  };

  // --- MAIN FLOW CONTROL ---

  // 1. If Setup not complete (No username), show Onboarding
  if (!user.setupComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // 2. If Setup complete but Resources not loaded (Simulated download/cache), show Loader
  if (!resourcesLoaded) {
    return <ResourceLoader onFinished={handleResourcesLoaded} />;
  }

  // 3. Main Application
  const isGameView = ['balloon', 'minesweeper', 'tradeboss', 'triumph', 'truewar'].includes(currentView);

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans max-w-md mx-auto relative shadow-2xl overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-safe">
        {renderContent()}
      </div>

      {/* Only show BottomNav if NOT in a game */}
      {!isGameView && (
        <BottomNav currentTab={currentTab} onTabChange={handleTabChange} />
      )}
      
      {/* PWA Install Prompt */}
      <InstallPWA />
    </div>
  );
};

export default App;