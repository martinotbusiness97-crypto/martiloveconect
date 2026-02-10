
import React from 'react';
import { Compass, Heart, MessageCircle, Bell, User } from 'lucide-react';
import { AppTab } from '../types';
import { useTranslation } from '../App';

interface BottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  badges?: {
    messages?: number;
    notifs?: number;
  };
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, badges }) => {
  const { t } = useTranslation();
  
  const tabs = [
    { id: 'discover', label: t('tab.discover'), icon: Compass },
    { id: 'matches', label: t('tab.matches'), icon: Heart },
    { id: 'messages', label: t('tab.messages'), icon: MessageCircle, badge: badges?.messages },
    { id: 'notifs', label: t('tab.notifs'), icon: Bell, badge: badges?.notifs },
    { id: 'profile', label: t('tab.profile'), icon: User },
  ];

  return (
    <nav className="flex items-center justify-around w-full">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const badgeCount = tab.badge || 0;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AppTab)}
            className={`flex flex-col items-center gap-1 px-3 py-1 transition-all duration-300 relative ${
              isActive ? 'text-pink-500' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
            }`}
          >
            <div className={`relative transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
               <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
               
               {/* Badge de notification */}
               {badgeCount > 0 && (
                 <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-pink-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-slate-950 animate-in zoom-in duration-300">
                   {badgeCount > 99 ? '99+' : badgeCount}
                 </span>
               )}

               {isActive && !badgeCount && (
                 <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-pink-500 rounded-full" />
               )}
            </div>
            <span className="text-[10px] font-semibold tracking-wide">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
