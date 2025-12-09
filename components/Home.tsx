import React, { useState } from 'react';
import { IconBell, IconGift, IconTarget, IconGamepad, IconTrophy, IconWallet } from './Icons';

interface HomeProps {
  onPlayGame: (gameId: string) => void;
  balance: number;
  userName: string;
  limits: {
    balloonCount: number;
    trueWarCount: number;
    triumphSecondsRemaining: number;
  };
}

const Home: React.FC<HomeProps> = ({ onPlayGame, balance, userName, limits }) => {
  const [popup, setPopup] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'info' } | null>(null);

  const games = [
    { id: 'truewar', name: 'True War', color: 'from-blue-500 to-cyan-400', icon: '🔫', status: 'NEW', locked: false, limit: 1, current: limits.trueWarCount },
    { id: 'balloon', name: 'Balloon Pop', color: 'from-pink-500 to-red-500', icon: '🎈', status: 'LIVE', locked: false, limit: 15, current: limits.balloonCount },
    { id: 'triumph', name: 'Triumph', color: 'from-purple-500 to-indigo-600', icon: '⚔️', status: 'LIVE', locked: false, limitType: 'time', limit: 60, current: 60 - limits.triumphSecondsRemaining },
    
    // Locked Games (Only Kalim can play)
    { id: 'tradeboss', name: 'Trade Boss', color: 'from-blue-600 to-cyan-500', icon: '📈', status: 'LIVE', locked: true },
    { id: 'minesweeper', name: 'Minesweeper', color: 'from-emerald-400 to-emerald-600', icon: '💣', status: 'LIVE', locked: true },
    { id: 'mine', name: 'Mine', color: 'from-amber-400 to-orange-500', icon: '💎', status: 'SOON', locked: true },
  ];

  const handleGameClick = (game: typeof games[0]) => {
    // 1. Check User Level Lock
    const isKalim = userName.toLowerCase() === 'kalim';
    
    if (game.locked && !isKalim) {
      setPopup({
        show: true,
        title: "Jeu Bloqué 🔒",
        message: "Vous n'avez pas encore le niveau VIP requis pour accéder à ce jeu. Continuez à jouer aux jeux disponibles pour monter en niveau !",
        type: 'error'
      });
      return;
    }

    if (game.status === 'SOON') return;

    // 2. Check Daily Limits
    if (game.id === 'balloon' && limits.balloonCount >= 15) {
      setPopup({ show: true, title: "Limite Atteinte", message: "Vous avez utilisé vos 15 parties de Balloon Pop aujourd'hui.", type: 'info' });
      return;
    }
    if (game.id === 'truewar' && limits.trueWarCount >= 1) {
      setPopup({ show: true, title: "Limite Atteinte", message: "Une seule partie de True War est autorisée par jour.", type: 'info' });
      return;
    }
    if (game.id === 'triumph' && limits.triumphSecondsRemaining <= 0) {
      setPopup({ show: true, title: "Temps Écoulé", message: "Vous avez épuisé vos 60 secondes de Triumph pour aujourd'hui.", type: 'info' });
      return;
    }

    // Access Granted
    onPlayGame(game.id);
  };

  const widgets = [
    { 
      id: 1,
      title: "Balloon Pop", 
      desc: "Jusqu'à x500 de Gain", 
      icon: IconTarget, 
      colorFrom: "from-pink-600/20", 
      colorTo: "to-red-600/20", 
      borderColor: "border-pink-500/30",
      iconBg: "bg-pink-500/20",
      iconColor: "text-pink-400",
      titleColor: "text-pink-300"
    },
    { 
      id: 2,
      title: "True War", 
      desc: "Battez le Boss Final", 
      icon: IconGamepad, 
      colorFrom: "from-blue-600/20", 
      colorTo: "to-cyan-600/20", 
      borderColor: "border-blue-500/30",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
      titleColor: "text-blue-300"
    },
    { 
      id: 3,
      title: "Retraits Mobiles", 
      desc: "Orange, MTN, Moov", 
      icon: IconWallet, 
      colorFrom: "from-emerald-600/20", 
      colorTo: "to-green-600/20", 
      borderColor: "border-emerald-500/30",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
      titleColor: "text-emerald-300"
    },
    { 
      id: 4,
      title: "Triumph", 
      desc: "Cassez les Briques", 
      icon: IconTrophy, 
      colorFrom: "from-purple-600/20", 
      colorTo: "to-indigo-600/20", 
      borderColor: "border-purple-500/30",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
      titleColor: "text-purple-300"
    }
  ];

  const loopingWidgets = [...widgets, ...widgets];

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 overflow-y-auto overflow-x-hidden relative">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 border-2 border-slate-700 shadow-lg flex items-center justify-center text-white font-bold text-lg">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Bonjour,</div>
            <div className="text-sm font-bold text-white">{userName}</div>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center active:scale-95 transition-transform">
          <IconBell className="text-slate-300 w-5 h-5" />
        </button>
      </div>

      {/* Balance Card */}
      <div className="relative w-full p-6 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="relative z-10 flex flex-col items-center py-2">
          <div className="text-slate-400 text-sm font-medium mb-1 tracking-wider uppercase">Solde Total</div>
          <div className="text-4xl font-black text-white tracking-tight">
            {balance.toLocaleString()} <span className="text-xl text-slate-500 font-bold">FCFA</span>
          </div>
        </div>
      </div>

      {/* Infinite Scroll Widgets */}
      <div className="relative w-full overflow-hidden mb-8 -mx-4 px-4">
        <div className="flex gap-4 w-max animate-scroll hover:pause">
          {loopingWidgets.map((widget, index) => {
            const Icon = widget.icon;
            return (
              <div 
                key={`${widget.id}-${index}`} 
                className={`shrink-0 w-64 p-4 rounded-2xl bg-gradient-to-r ${widget.colorFrom} ${widget.colorTo} border ${widget.borderColor} flex items-center gap-4 select-none cursor-pointer active:scale-95 transition-transform`}
              >
                <div className={`w-12 h-12 rounded-full ${widget.iconBg} flex items-center justify-center ${widget.iconColor} shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className={`text-xs ${widget.titleColor} font-bold uppercase`}>{widget.title}</div>
                  <div className="text-white font-bold text-sm whitespace-nowrap">{widget.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Games Grid */}
      <div className="mb-4 flex justify-between items-end">
        <h2 className="text-xl font-bold text-white">Nos Jeux</h2>
        <span className="text-xs text-blue-400 font-bold cursor-pointer">Voir tout</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 pb-8">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => handleGameClick(game)}
            className={`
              relative group aspect-square rounded-[2rem] p-4 flex flex-col justify-between overflow-hidden transition-all duration-300
              ${game.status !== 'SOON' ? 'active:scale-95 cursor-pointer' : 'opacity-60 cursor-not-allowed grayscale-[0.5]'}
              bg-slate-800 border border-slate-700 hover:border-slate-600
            `}
          >
            {/* Background Gradient Effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
            
            {/* Lock Overlay */}
            {game.locked && userName.toLowerCase() !== 'kalim' && (
               <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full p-1 z-30">
                  <span className="text-xs">🔒</span>
               </div>
            )}
            
            {/* Status Badge */}
            <div className="self-end z-20">
              <span className={`px-2 py-1 rounded-full text-[10px] font-black tracking-wider ${
                game.status === 'LIVE' ? 'bg-green-500/20 text-green-400' : 
                game.status === 'NEW' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                'bg-slate-700 text-slate-400'
              }`}>
                {game.status}
              </span>
            </div>

            {/* Content */}
            <div className="z-10 flex flex-col items-center justify-center flex-1">
              <div className="text-7xl mb-2 drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-300">{game.icon}</div>
            </div>
            
            <div className="z-10 text-center">
              <div className="font-bold text-white text-lg leading-none">{game.name}</div>
            </div>

            {/* Play Button Overlay */}
            {game.status !== 'SOON' && (
              <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg transform translate-y-2 group-hover:translate-y-0 z-20">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Popups */}
      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-pop-in">
          <div className="bg-slate-800 border border-slate-600 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl relative">
            <button 
              onClick={() => setPopup(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <div className={`text-5xl mb-4 ${popup.type === 'error' ? 'animate-bounce' : ''}`}>
               {popup.type === 'error' ? '🚫' : '⏳'}
            </div>
            <h3 className="text-xl font-black text-white mb-2">{popup.title}</h3>
            <p className="text-slate-300 font-medium leading-relaxed mb-6">
              {popup.message}
            </p>
            <button 
              onClick={() => setPopup(null)}
              className="w-full py-3 bg-white text-black rounded-xl font-bold active:scale-95 transition"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;