import React, { useEffect, useState } from 'react';

const ASSETS_TO_LOAD = [
  'https://bienetrechien.com/wp-content/uploads/2025/12/ChatGPT-Image-8-dec.-2025-10_16_39.png', // Main Icon
  'https://bienetrechien.com/wp-content/uploads/2025/08/Moov_Money_Flooz.png',
  'https://bienetrechien.com/wp-content/uploads/2025/08/Orange-Money-recrute-pour-ce-poste-22-Mars-2023.png',
  'https://bienetrechien.com/wp-content/uploads/2025/08/mtn-1.jpg',
  'https://bienetrechien.com/wp-content/uploads/2025/08/wave.png',
  'https://bienetrechien.com/wp-content/uploads/2025/08/mix-by-yass.jpg'
];

interface ResourceLoaderProps {
  onFinished: () => void;
}

const ResourceLoader: React.FC<ResourceLoaderProps> = ({ onFinished }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initialisation...');

  useEffect(() => {
    let loadedCount = 0;
    const total = ASSETS_TO_LOAD.length;
    
    // Function to update progress
    const updateProgress = () => {
      loadedCount++;
      const percent = Math.floor((loadedCount / total) * 100);
      setProgress(percent);
      
      if (percent < 30) setLoadingText('Connexion au serveur...');
      else if (percent < 60) setLoadingText('Téléchargement des graphismes...');
      else if (percent < 90) setLoadingText('Mise en cache des données...');
      else setLoadingText('Finalisation...');

      if (loadedCount === total) {
        setTimeout(() => {
          onFinished();
        }, 500); // Small delay at 100% for UX
      }
    };

    // Preload Images
    ASSETS_TO_LOAD.forEach(src => {
      const img = new Image();
      img.src = src;
      img.onload = updateProgress;
      img.onerror = updateProgress; // Proceed even if one fails
    });

    // Fallback in case loading is too fast or fails
    const timeout = setTimeout(() => {
       onFinished();
    }, 5000); // Max 5 seconds wait

    return () => clearTimeout(timeout);
  }, [onFinished]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-xs flex flex-col items-center">
        {/* Animated Icon */}
        <div className="mb-10 relative">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl animate-spin" style={{ animationDuration: '3s' }}></div>
          <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">⚡</div>
        </div>

        <h2 className="text-white font-bold text-xl mb-6">{loadingText}</h2>

        {/* Progress Bar Container */}
        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative shadow-inner">
          {/* Progress Fill */}
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          >
             <div className="absolute inset-0 bg-white/30 w-full h-full animate-air-flow" style={{ backgroundSize: '20px 20px', backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)' }}></div>
          </div>
        </div>
        
        <div className="w-full flex justify-between mt-2">
           <span className="text-xs text-slate-500 font-mono">STOCKAGE LOCAL</span>
           <span className="text-xs text-blue-400 font-bold font-mono">{progress}%</span>
        </div>
      </div>
    </div>
  );
};

export default ResourceLoader;