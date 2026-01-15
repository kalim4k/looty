
import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import BalloonGame from './components/BalloonGame';
import MinesweeperGame from './components/MinesweeperGame';
import TradeBossGame from './components/TradeBossGame';
import TriumphGame from './components/TriumphGame';
import TrueWarGame from './components/TrueWarGame';
import NeonHockeyGame from './components/NeonHockeyGame';
import Wallet from './components/Wallet';
import Profile from './components/Profile';
import BottomNav from './components/BottomNav';
import InstallPWA from './components/InstallPWA';
import Onboarding from './components/Onboarding';
import ResourceLoader from './components/ResourceLoader';

type View = 'home' | 'wallet' | 'profile' | 'balloon' | 'triumph' | 'minesweeper' | 'mine' | 'quizzy' | 'tradeboss' | 'truewar' | 'neonhockey';

interface UserData {
  name: string;
  balance: number;
  setupComplete: boolean;
}

interface GameLimits {
  date: string;
  balloonCount: number;
  trueWarCount: number;
  triumphSecondsRemaining: number;
  neonHockeyCount: number;
  adClicks: { [index: number]: number };
}

const INITIAL_LIMITS: GameLimits = {
  date: new Date().toDateString(),
  balloonCount: 0,
  trueWarCount: 0,
  triumphSecondsRemaining: 60,
  neonHockeyCount: 0,
  adClicks: {}
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserData>(() => {
    const saved = localStorage.getItem('user_data');
    return saved ? JSON.parse(saved) : { name: '', balance: 0, setupComplete: false };
  });

  const [limits, setLimits] = useState<GameLimits>(() => {
    const saved = localStorage.getItem('game_limits');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date !== new Date().toDateString()) return INITIAL_LIMITS;
      return parsed;
    }
    return INITIAL_LIMITS;
  });

  const [currentTab, setCurrentTab] = useState('home');
  const [currentView, setCurrentView] = useState<View>('home');
  const [resourcesLoaded, setResourcesLoaded] = useState(false);

  useEffect(() => { localStorage.setItem('user_data', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('game_limits', JSON.stringify(limits)); }, [limits]);

  const updateBalance = (amount: number) => {
    setUser(prev => ({ ...prev, balance: Math.max(0, prev.balance + amount) }));
  };

  const handleOnboardingComplete = (username: string) => {
    setUser(prev => ({ ...prev, name: username, setupComplete: true }));
  };

  const renderContent = () => {
    switch (currentView) {
      // Fix: Wrapped setCurrentView and added type assertion to match (gameId: string) => void expected by Home component
      case 'home': return <Home onPlayGame={(gameId) => setCurrentView(gameId as View)} balance={user.balance} userName={user.name} limits={limits} />;
      case 'wallet': return <Wallet balance={user.balance} limits={limits} onAdClick={(idx) => { updateBalance(10); return true; }} updateBalance={updateBalance} />;
      case 'profile': return <Profile user={user} onUpdateProfile={(name) => setUser(p => ({...p, name}))} />;
      case 'balloon': return <BalloonGame onBack={() => setCurrentView('home')} balance={user.balance} updateBalance={updateBalance} onPlayRound={() => setLimits(p => ({...p, balloonCount: p.balloonCount+1}))} />;
      case 'triumph': return <TriumphGame onBack={() => setCurrentView('home')} balance={user.balance} updateBalance={updateBalance} initialTime={limits.triumphSecondsRemaining} onTimeUpdate={(s) => setLimits(p => ({...p, triumphSecondsRemaining: p.triumphSecondsRemaining - s}))} />;
      case 'truewar': return <TrueWarGame onBack={() => setCurrentView('home')} balance={user.balance} updateBalance={updateBalance} onPlayRound={() => setLimits(p => ({...p, trueWarCount: p.trueWarCount+1}))} />;
      case 'neonhockey': return <NeonHockeyGame onBack={() => setCurrentView('home')} balance={user.balance} updateBalance={updateBalance} onPlayRound={() => setLimits(p => ({...p, neonHockeyCount: p.neonHockeyCount+1}))} />;
      case 'minesweeper': return <MinesweeperGame onBack={() => setCurrentView('home')} balance={user.balance} updateBalance={updateBalance} />;
      case 'tradeboss': return <TradeBossGame onBack={() => setCurrentView('home')} balance={user.balance} updateBalance={updateBalance} />;
      // Fix: Wrapped setCurrentView and added type assertion to match (gameId: string) => void expected by Home component
      default: return <Home onPlayGame={(gameId) => setCurrentView(gameId as View)} balance={user.balance} userName={user.name} limits={limits} />;
    }
  };

  if (!user.setupComplete) return <Onboarding onComplete={handleOnboardingComplete} />;
  if (!resourcesLoaded) return <ResourceLoader onFinished={() => setResourcesLoaded(true)} />;

  const isGameView = ['balloon', 'minesweeper', 'tradeboss', 'triumph', 'truewar', 'neonhockey'].includes(currentView);

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans max-w-md mx-auto relative shadow-2xl overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-safe">
        {renderContent()}
      </div>
      {!isGameView && (
        <BottomNav currentTab={currentTab} onTabChange={(id) => { setCurrentTab(id); setCurrentView(id as View); }} />
      )}
      <InstallPWA />
    </div>
  );
};

export default App;
