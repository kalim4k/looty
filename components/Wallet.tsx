import React, { useState } from 'react';
import { IconChevronLeft } from './Icons';

interface WalletProps {
  balance: number;
  limits: {
    balloonCount: number;
    trueWarCount: number;
    triumphSecondsRemaining: number;
    adClicks: { [index: number]: number };
  };
  onAdClick: (index: number) => boolean;
  updateBalance: (amount: number) => void;
}

const PAYMENT_METHODS = [
  { name: 'Moov Money', img: 'https://bienetrechien.com/wp-content/uploads/2025/08/Moov_Money_Flooz.png' },
  { name: 'Orange Money', img: 'https://bienetrechien.com/wp-content/uploads/2025/08/Orange-Money-recrute-pour-ce-poste-22-Mars-2023.png' },
  { name: 'MTN Money', img: 'https://bienetrechien.com/wp-content/uploads/2025/08/mtn-1.jpg' },
  { name: 'Wave', img: 'https://bienetrechien.com/wp-content/uploads/2025/08/wave.png' },
  { name: 'Mix by Yass', img: 'https://bienetrechien.com/wp-content/uploads/2025/08/mix-by-yass.jpg' },
];

const AD_LINKS = [
  "https://www.effectivegatecpm.com/hire0aka43?key=a56ce096b69a2233665aec2f9ad229b5",
  "https://www.effectivegatecpm.com/zwmhnn1sy?key=44e918780ddf4ad595c454d289c53a96",
  "https://www.effectivegatecpm.com/sw3sywkqm0?key=9c1e5bf89076f5091c1c1677715a55d2",
  "https://www.effectivegatecpm.com/mubwkz26?key=0604219cd9f1025d2fde4e475f7f38ea",
  "https://www.effectivegatecpm.com/t7bwwufze?key=a6ddcb1a7d4c7d75c656937f3e87c741",
  "https://www.effectivegatecpm.com/t9jb9smf?key=40443693c17abb2135e9b6e3738db2dd",
  "https://www.effectivegatecpm.com/jbk2360sj?key=7fc034a14e94a1e760dfc819dc5eb505",
  "https://www.effectivegatecpm.com/a5g3pzk5?key=13957d2a449284399821dbab142c2ec6",
  "https://www.effectivegatecpm.com/zd6q3225?key=c8d4677f36e39b6fab42a81040613a03",
  "https://www.effectivegatecpm.com/u561dm0rb?key=8ffe49bb9342d0127cd4bf43681ac0b9"
];

const Wallet: React.FC<WalletProps> = ({ balance, limits, onAdClick, updateBalance }) => {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const handleWithdraw = () => {
    if (!selectedMethod) {
      setWithdrawError('Veuillez choisir une méthode de paiement.');
      return;
    }
    if (!withdrawAddress) {
      setWithdrawError('Veuillez entrer une adresse/numéro de retrait.');
      return;
    }
    if (balance < 150000) {
      setWithdrawError('Solde insuffisant. Minimum: 150,000 FCFA.');
      return;
    }
    // Simulate API call
    updateBalance(-150000);
    setWithdrawSuccess(true);
    setTimeout(() => {
        setShowWithdraw(false);
        setWithdrawSuccess(false);
        setWithdrawAddress('');
        setSelectedMethod(null);
    }, 2000);
  };

  const handleAdClick = (url: string, index: number) => {
    window.open(url, '_blank');
    onAdClick(index);
  };

  return (
    <div className="min-h-screen px-4 pt-8 pb-24 relative">
      <h1 className="text-3xl font-black text-white mb-8">Portefeuille</h1>

      {/* Main Balance Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="relative z-10">
          <div className="text-blue-100 font-medium mb-1">Solde Disponible</div>
          <div className="text-5xl font-black text-white mb-6">
            {balance.toLocaleString()} <span className="text-2xl opacity-70">FCFA</span>
          </div>
          
          <div className="flex gap-3">
             <button 
               onClick={() => setShowWithdraw(true)}
               className="flex-1 py-4 bg-white text-blue-800 rounded-xl font-black shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
             >
               <IconChevronLeft className="rotate-90 w-5 h-5" />
               RETIRER
             </button>
          </div>
        </div>
      </div>

      {/* Daily Limits Tracker */}
      <h2 className="text-xl font-bold text-white mb-4">Objectifs Quotidiens</h2>
      <div className="grid grid-cols-1 gap-3 mb-8">
         <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-xl">🎈</div>
               <div>
                  <div className="font-bold text-white">Balloon Pop</div>
                  <div className="text-xs text-slate-400">15 parties / jour</div>
               </div>
            </div>
            <div className={`font-mono font-bold ${limits.balloonCount >= 15 ? 'text-green-400' : 'text-yellow-400'}`}>
               {limits.balloonCount}/15 {limits.balloonCount >= 15 && '✅'}
            </div>
         </div>

         <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xl">⚔️</div>
               <div>
                  <div className="font-bold text-white">Triumph</div>
                  <div className="text-xs text-slate-400">60s / jour</div>
               </div>
            </div>
            <div className={`font-mono font-bold ${limits.triumphSecondsRemaining <= 0 ? 'text-green-400' : 'text-yellow-400'}`}>
               {60 - limits.triumphSecondsRemaining}/60s {limits.triumphSecondsRemaining <= 0 && '✅'}
            </div>
         </div>

         <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl">🔫</div>
               <div>
                  <div className="font-bold text-white">True War</div>
                  <div className="text-xs text-slate-400">1 partie / jour</div>
               </div>
            </div>
            <div className={`font-mono font-bold ${limits.trueWarCount >= 1 ? 'text-green-400' : 'text-yellow-400'}`}>
               {limits.trueWarCount}/1 {limits.trueWarCount >= 1 && '✅'}
            </div>
         </div>
      </div>

      {/* Ads Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-2">Zone Publicitaire</h2>
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
            <div className="flex justify-between items-center mb-4">
               <div className="text-sm text-slate-400">Gagnez <span className="text-green-400 font-bold">10 FCFA</span> par clic</div>
            </div>
            <div className="space-y-2">
                {AD_LINKS.map((link, idx) => {
                  const clicks = limits.adClicks[idx] || 0;
                  const isMaxed = clicks >= 3;
                  return (
                    <button 
                       key={idx}
                       onClick={() => handleAdClick(link, idx)}
                       disabled={isMaxed}
                       className={`w-full py-3 rounded-xl flex items-center justify-between px-4 transition-colors ${
                         isMaxed ? 'bg-slate-800 opacity-50 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600'
                       }`}
                    >
                        <span className="text-sm font-medium text-slate-200">Publicité Partenaire #{idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${isMaxed ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {clicks}/3 {isMaxed && '✅'}
                          </span>
                          {!isMaxed && <span className="text-xs text-blue-400">Voir →</span>}
                        </div>
                    </button>
                  );
                })}
            </div>
        </div>
      </div>

      {/* Withdrawal Popup */}
      {showWithdraw && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-pop-in p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto relative shadow-2xl">
                  <button 
                    onClick={() => { setShowWithdraw(false); setWithdrawError(''); setSelectedMethod(null); }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center"
                  >✕</button>
                  
                  <h2 className="text-2xl font-black text-white mb-6">Retrait</h2>
                  
                  {withdrawSuccess ? (
                      <div className="flex flex-col items-center py-10">
                          <div className="text-6xl mb-4">✅</div>
                          <div className="text-xl font-bold text-green-400 mb-2">Demande envoyée !</div>
                          <div className="text-slate-400 text-center text-sm">Votre retrait de 150,000 FCFA est en cours de traitement.</div>
                      </div>
                  ) : (
                      <>
                        <div className="mb-6">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Méthode de Paiement</label>
                            <div className="grid grid-cols-3 gap-2">
                                {PAYMENT_METHODS.map((method) => (
                                    <button
                                        key={method.name}
                                        onClick={() => setSelectedMethod(method.name)}
                                        className={`
                                            flex flex-col items-center justify-center p-2 rounded-xl border transition-all
                                            ${selectedMethod === method.name 
                                                ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500' 
                                                : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}
                                        `}
                                    >
                                        <img src={method.img} alt={method.name} className="w-8 h-8 object-contain mb-2 rounded-md" />
                                        <span className="text-[10px] font-bold text-center leading-tight">{method.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Adresse de Retrait</label>
                             <input 
                               type="text" 
                               value={withdrawAddress}
                               onChange={(e) => setWithdrawAddress(e.target.value)}
                               placeholder="Numéro de téléphone / ID"
                               className="w-full bg-slate-800 border border-slate-600 rounded-xl p-4 text-white font-mono placeholder-slate-500 focus:border-blue-500 outline-none"
                             />
                        </div>

                        <div className="bg-slate-800/50 p-4 rounded-xl mb-6 flex justify-between items-center">
                             <span className="text-sm text-slate-400">Montant (Min. 150k)</span>
                             <span className="font-black text-white">150,000 FCFA</span>
                        </div>

                        {withdrawError && (
                            <div className="text-red-400 text-sm font-bold text-center mb-4 bg-red-500/10 p-2 rounded-lg">
                                {withdrawError}
                            </div>
                        )}

                        <button 
                            onClick={handleWithdraw}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-xl shadow-lg active:scale-95 transition-all"
                        >
                            CONFIRMER LE RETRAIT
                        </button>
                      </>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Wallet;