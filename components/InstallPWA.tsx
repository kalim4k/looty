import React, { useEffect, useState } from 'react';

const InstallPWA: React.FC = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      console.log('PWA installation triggered');
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
           console.log('User accepted the install prompt');
        } else {
           console.log('User dismissed the install prompt');
        }
        setSupportsPWA(false);
        setPromptInstall(null);
    });
  };

  const handleClose = () => {
     setSupportsPWA(false);
  };

  if (!supportsPWA) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 animate-bounce-up">
      <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <img 
              src="https://bienetrechien.com/wp-content/uploads/2025/12/ChatGPT-Image-8-dec.-2025-10_16_39.png" 
              alt="Looty Icon" 
              className="w-14 h-14 rounded-xl shadow-lg"
           />
           <div>
              <h3 className="text-white font-bold text-lg leading-tight">Installer Looty</h3>
              <p className="text-slate-400 text-xs">Ajouter à l'écran d'accueil</p>
           </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
             onClick={handleClose}
             className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-slate-400 hover:text-white"
           >
              ✕
           </button>
           <button 
             onClick={handleInstallClick}
             className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-lg shadow-lg active:scale-95 transition-transform"
           >
             Installer
           </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;