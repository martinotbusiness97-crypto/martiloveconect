
import React from 'react';
import { Settings, Edit2, Shield, CreditCard, ChevronRight, MapPin } from 'lucide-react';
import { AppTab } from '../types';
import { useTranslation } from '../App';

interface ProfileViewProps {
  onNavigate: (tab: AppTab) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
  const { t, profile } = useTranslation();

  // Image par défaut si aucune photo n'est trouvée
  const defaultAvatar = "https://images.unsplash.com/photo-1535711761886-2522ada467ad?auto=format&fit=crop&q=80&w=400";

  return (
    <div className="flex flex-col">
      <div className="p-6 pb-2 relative bg-gradient-to-b from-pink-50 dark:from-pink-950/20 to-white dark:to-slate-950">
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => onNavigate('settings')}
            className="p-2 hover:bg-white/50 dark:hover:bg-slate-900/50 rounded-full transition-colors active:scale-90"
          >
            <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
        <div className="flex flex-col items-center">
          <div className="relative">
            <img 
              src={profile?.imageUrl || defaultAvatar} 
              className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-lg" 
              alt={profile?.name || "Profil"} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultAvatar;
              }}
            />
            <button 
              onClick={() => onNavigate('edit-profile')}
              className="absolute bottom-0 right-0 bg-pink-500 p-2.5 rounded-full border-2 border-white dark:border-slate-900 cursor-pointer shadow-md hover:bg-pink-600 transition-colors active:scale-95"
            >
              <Edit2 className="w-4 h-4 text-white" />
            </button>
          </div>
          <h2 className="mt-4 text-2xl font-bold dark:text-white">
            {profile?.name || 'Utilisateur'}, {profile?.age || '--'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {profile?.location || profile?.city || 'Non localisé'}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-3">
        <div 
          onClick={() => onNavigate('payments')}
          className="bg-gradient-to-r from-pink-500 to-rose-400 p-5 rounded-[2.5rem] text-white flex items-center justify-between shadow-lg cursor-pointer hover:scale-[1.02] transition-transform active:scale-95"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">{t('profile.gold_title')}</p>
            <p className="font-bold text-lg">{t('profile.gold_desc')}</p>
            <p className="text-xs opacity-90">Vivez l'expérience Marti sans limites</p>
          </div>
          <ChevronRight className="w-6 h-6" />
        </div>

        <div className="mt-8 space-y-1">
          <div onClick={() => onNavigate('security')} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl cursor-pointer">
            <div className="flex items-center gap-4">
              <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span className="font-medium dark:text-slate-200">{t('profile.security')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
          </div>
          <div onClick={() => onNavigate('payments')} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl cursor-pointer">
            <div className="flex items-center gap-4">
              <CreditCard className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span className="font-medium dark:text-slate-200">{t('profile.payments')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
