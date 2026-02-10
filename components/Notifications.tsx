
import React, { useEffect } from 'react';
import { Bell, Heart } from 'lucide-react';
import { AppTab } from '../types';
import { useTranslation } from '../App';

interface NotificationsProps {
  onNavigate: (tab: AppTab) => void;
  onNotifSound: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ onNavigate, onNotifSound }) => {
  const { t } = useTranslation();

  useEffect(() => {
    // Déclenche le son de notification à l'entrée pour simuler une nouvelle alerte
    onNotifSound();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6 tracking-tight dark:text-white">{t('notifs.title')}</h1>
      <div className="space-y-4">
        <div 
          onClick={() => onNavigate('likes')}
          className="flex items-start gap-4 p-4 bg-pink-50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/50 rounded-[2rem] cursor-pointer hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors animate-in slide-in-from-top duration-500"
        >
          <div className="p-3 bg-pink-200 dark:bg-pink-900 rounded-2xl">
            <Heart className="w-5 h-5 text-pink-600 dark:text-pink-300 fill-current" />
          </div>
          <div>
            <p className="text-sm font-bold text-pink-900 dark:text-pink-100 leading-none mb-1">{t('notifs.new_like')}</p>
            <p className="text-xs text-pink-700 dark:text-pink-400">{t('notifs.new_like_desc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
