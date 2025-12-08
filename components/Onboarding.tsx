import React, { useState } from 'react';
import { IconUser } from './Icons';

interface OnboardingProps {
  onComplete: (username: string) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) {
      setError('Le nom doit contenir au moins 3 caractères.');
      return;
    }
    onComplete(name.trim());
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6 animate-pop-in">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px] animate-pulse-fast" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse-fast" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Logo/Icon */}
        <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_40px_rgba(59,130,246,0.5)] flex items-center justify-center mb-8 rotate-3 animate-float">
          <span className="text-4xl">🚀</span>
        </div>

        <h1 className="text-4xl font-black text-white text-center mb-2">Bienvenue sur <br/><span className="text-blue-400">Looty</span></h1>
        <p className="text-slate-400 text-center mb-8 font-medium">Préparez-vous à gagner gros.</p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Nom d'utilisateur</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <IconUser className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="Votre pseudo..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                autoFocus
              />
            </div>
            {error && <p className="text-red-400 text-xs font-bold pl-1">{error}</p>}
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white font-black text-lg uppercase tracking-wider shadow-[0_10px_20px_rgba(37,99,235,0.3)] hover:brightness-110 active:scale-95 transition-all mt-4"
          >
            Commencer l'aventure
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;