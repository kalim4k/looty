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
    neonHockeyCount: number;
  };
}

const Home: React.FC<HomeProps> = ({ onPlayGame, balance, userName, limits }) => {
  const [popup, setPopup] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'info' } | null>(null);

  const games = [
    { id: 'truewar', name: 'True War', color: 'from-blue-500 to-cyan-400', icon: '🔫', status: 'LIVE', locked: false, limit: 1, current: limits.trueWarCount },
    { id: 'neonhockey', name: 'Neon Hockey', color: 'from-green-400 to-blue-500', icon: '🏒', status: 'LIVE', locked: false, limit: 5, current: limits.neonHockeyCount },
    { id: 'balloon', name: 'Balloon Pop', color: 'from-pink-500 to-red-500', icon: '🎈', status: 'LIVE', locked: false, limit: 15, current: limits.balloonCount },
    { id: 'triumph', name: 'Triumph', color: 'from-purple-500 to-indigo-600', icon: '⚔️', status: 'LIVE', locked: false, limitType: 'time', limit: 60, current: 60 - limits.triumphSecondsRemaining },
    
    // Locked Games
    { id: 'tradeboss', name: 'Trade Boss', color: 'from-blue-600 to-cyan-500', icon: '📈', status: 'LIVE', locked: true },
    { id: 'minesweeper', name: 'Minesweeper', color: 'from-emerald-400 to-emerald-600', icon: '💣', status: 'LIVE', locked: true },
    { id: 'mine', name: 'Mine', color: 'from-amber-400 to-orange-500', icon: '💎', status: 'SOON', locked: true },
  ];

  const handleGameClick = (game: typeof games[0]) => {
    const isKalim = userName.toLowerCase() === 'kalim';
    
    if (game.locked && !isKalim) {
      setPopup({
        show: true,
        title: "Jeu Bloqué 🔒",
        message: "Vous n'avez pas encore le niveau VIP requis pour accéder à ce jeu.",
        type: 'error'
      });
      return;
    }

    if (game.status === 'SOON') return;

    if (game.id === 'balloon' && limits.balloonCount >= 15) {
      setPopup({ show: true, title: "Limite Atteinte", message: "15 parties de Balloon Pop max aujourd'hui.", type: 'info' });
      return;
    }
    if (game.id === 'truewar' && limits.trueWarCount >= 1) {
      setPopup({ show: true, title: "Limite Atteinte", message: "Une seule partie de True War autorisée.", type: 'info' });
      return;
    }

    onPlayGame(game.id);
  };

  const widgets = [
    { 
      id: 1, title: "True War", desc: "Dominez le champ de bataille", icon: IconTarget, 
      colorFrom: "from-blue-600/20", colorTo: "to-indigo-600/20", borderColor: "border-blue-500/30",
      iconBg: "bg-blue-500/20", iconColor: "text-blue-400", titleColor: "text-blue-300"
    },
    { 
      id: 2, title: "Balloon Pop", desc: "Multipliez vos gains", icon: IconGamepad, 
      colorFrom: "from-pink-600/20", colorTo: "to-red-600/20", borderColor: "border-pink-500/30",
      iconBg: "bg-pink-500/20", iconColor: "text-pink-400", titleColor: "text-pink-300"
    }
  ];

  const loopingWidgets = [...widgets, ...widgets, ...widgets];

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 overflow-y-auto overflow-x-hidden relative">
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
        <button className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
          <IconBell className="text-slate-300 w-5 h-5" />
        </button>
      </div>

      <div className="relative w-full p-6 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl mb-8">
        <div className="relative z-10 flex flex-col items-center py-2">
          <div className="text-slate-400 text-sm font-medium mb-1 tracking-wider uppercase">Solde Total</div>
          <div className="text-4xl font-black text-white tracking-tight">
            {balance.toLocaleString()} <span className="text-xl text-slate-500 font-bold">FCFA</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden mb-8 -mx-4 px-4">
        <div className="flex gap-4 w-max animate-scroll">
          {loopingWidgets.map((widget, index) => {
            const Icon = widget.icon;
            return (
              <div 
                key={`${widget.id}-${index}`} 
                className={`shrink-0 w-64 p-4 rounded-2xl bg-gradient-to-r ${widget.colorFrom} ${widget.colorTo} border ${widget.borderColor} flex items-center gap-4`}
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

      <div className="mb-4 flex justify-between items-end">
        <h2 className="text-xl font-bold text-white">Nos Jeux</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4 pb-8">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => handleGameClick(game)}
            className={`
              relative group aspect-square rounded-[2rem] p-4 flex flex-col justify-between overflow-hidden transition-all duration-300
              ${game.status !== 'SOON' ? 'active:scale-95 cursor-pointer' : 'opacity-60 cursor-not-allowed'}
              bg-slate-800 border border-slate-700 hover:border-slate-600
            `}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
            
            <div className="self-end z-20">
              <span className={`px-2 py-1 rounded-full text-[10px] font-black tracking-wider ${
                game.status === 'LIVE' ? 'bg-green-500/20 text-green-400' : 
                game.status === 'NEW' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                'bg-slate-700 text-slate-400'
              }`}>
                {game.status}
              </span>
            </div>

            <div className="z-10 flex flex-col items-center justify-center flex-1">
              <div className="text-7xl mb-2 drop-shadow-2xl group-hover:scale-110 transition-transform">{game.icon}</div>
            </div>
            
            <div className="z-10 text-center">
              <div className="font-bold text-white text-lg leading-none">{game.name}</div>
            </div>
          </button>
        ))}
      </div>

      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-pop-in">
          <div className="bg-slate-800 border border-slate-600 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl relative">
            <button onClick={() => setPopup(null)} className="absolute top-4 right-4 text-slate-400">✕</button>
            <div className="text-5xl mb-4">{popup.type === 'error' ? '🚫' : '⏳'}</div>
            <h3 className="text-xl font-black text-white mb-2">{popup.title}</h3>
            <p className="text-slate-300 font-medium leading-relaxed mb-6">{popup.message}</p>
            <button onClick={() => setPopup(null)} className="w-full py-3 bg-white text-black rounded-xl font-bold">Compris</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;