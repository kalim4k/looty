import React, { useState } from 'react';
import { IconUser } from './Icons';

interface ProfileProps {
  user: { name: string; balance: number };
  onUpdateProfile: (name: string) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateProfile }) => {
  const [name, setName] = useState(user.name);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onUpdateProfile(name);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen px-4 pt-8 pb-24">
       <h1 className="text-3xl font-black text-white mb-8">Profil</h1>

       <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 mb-6 flex flex-col items-center">
           <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-4xl font-black text-white mb-4 shadow-xl">
              {user.name.charAt(0).toUpperCase()}
           </div>
           
           {!isEditing ? (
             <>
               <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
               <div className="text-slate-400 text-sm mb-6">Membre Pro</div>
               <button 
                 onClick={() => setIsEditing(true)}
                 className="px-6 py-2 bg-slate-700 rounded-full text-sm font-bold text-white hover:bg-slate-600 transition"
               >
                 Modifier
               </button>
             </>
           ) : (
             <div className="w-full">
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white text-center font-bold mb-4 focus:border-blue-500 outline-none"
                />
                <button 
                 onClick={handleSave}
                 className="w-full px-6 py-3 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-500 transition"
               >
                 Enregistrer
               </button>
             </div>
           )}
       </div>

       <div className="space-y-4">
           <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
               <span className="text-slate-400 font-medium">ID Utilisateur</span>
               <span className="text-white font-mono font-bold">#883921</span>
           </div>
           <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
               <span className="text-slate-400 font-medium">Niveau VIP</span>
               <span className="text-yellow-400 font-bold">Gold</span>
           </div>
           <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
               <span className="text-slate-400 font-medium">Langue</span>
               <span className="text-white font-bold">Français</span>
           </div>
       </div>

       <button className="w-full mt-8 py-4 border border-red-500/30 text-red-400 font-bold rounded-xl hover:bg-red-500/10 transition">
          Déconnexion
       </button>
    </div>
  );
};

export default Profile;