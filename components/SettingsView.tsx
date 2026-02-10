
import React, { useState } from 'react';
import { ArrowLeft, Bell, Globe, Moon, HelpCircle, LogOut, ChevronRight, User, Check, X, Volume2, VolumeX } from 'lucide-react';
import { AppTab } from '../types';
import { useTranslation } from '../App';
import { Language } from '../translations';

interface SettingsViewProps {
  onBack: () => void;
  onNavigate: (tab: AppTab) => void;
  darkMode: boolean;
  onToggleDarkMode: (value: boolean) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  volume: number;
  setVolume: (v: number) => void;
  isMuted: boolean;
  setIsMuted: (m: boolean) => void;
  onLogout: () => void; // Ajout de la prop de déconnexion
}

const LANGUAGES: Language[] = [
  'Français (FR)',
  'English (US)',
  'Español (ES)',
  'Deutsch (DE)',
  'Italiano (IT)',
  'Português (PT)'
];

const SettingsView: React.FC<SettingsViewProps> = ({ 
  onBack, 
  onNavigate, 
  darkMode, 
  onToggleDarkMode,
  language,
  onLanguageChange,
  volume,
  setVolume,
  isMuted,
  setIsMuted,
  onLogout
}) => {
  const { t } = useTranslation();
  const [notifs, setNotifs] = useState(true);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 animate-in slide-in-from-right duration-300">
      <div className="p-6 flex items-center gap-4 border-b border-slate-50 dark:border-slate-900 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight dark:text-white">{t('settings.title')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Gérez vos préférences Aura</p>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-10">
        {/* Compte */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 px-2">{t('settings.account')}</h2>
          <div className="space-y-2">
            <div onClick={() => onNavigate('edit-profile')} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer active:scale-[0.98] transition-all">
              <div className="p-3 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-2xl">
                <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <span className="font-bold text-sm flex-1 dark:text-slate-200">{t('settings.edit_profile')}</span>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            </div>
            <div onClick={() => setIsLangModalOpen(true)} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer active:scale-[0.98] transition-all">
              <div className="p-3 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-2xl">
                <Globe className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-sm dark:text-slate-200">{t('settings.language')}</span>
                <p className="text-[10px] text-pink-500 font-bold">{language}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            </div>
          </div>
        </div>

        {/* Préférences Audio */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 px-2">{t('settings.audio')}</h2>
          <div className="p-5 bg-slate-50/50 dark:bg-slate-900/50 rounded-[2.5rem] space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                  {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-pink-500" />}
                </div>
                <span className="font-bold text-sm dark:text-slate-200">{t('settings.mute')}</span>
              </div>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`w-12 h-6 rounded-full relative transition-colors duration-300 flex items-center px-1 ${isMuted ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${isMuted ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                <span>{t('settings.volume')}</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={volume} 
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Autres Préférences */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 px-2">{t('settings.preferences')}</h2>
          <div className="space-y-2">
            <div onClick={() => setNotifs(!notifs)} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 transition-all">
              <div className="p-3 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-2xl">
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <span className="font-bold text-sm flex-1 dark:text-slate-200">{t('settings.notifs')}</span>
              <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 flex items-center px-1 ${notifs ? 'bg-pink-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${notifs ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </div>
            <div onClick={() => onToggleDarkMode(!darkMode)} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 transition-all">
              <div className="p-3 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-2xl">
                <Moon className={`w-5 h-5 ${darkMode ? 'text-amber-400 fill-amber-400' : 'text-slate-600 dark:text-slate-400'}`} />
              </div>
              <span className="font-bold text-sm flex-1 dark:text-slate-200">{t('settings.dark_mode')}</span>
              <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 flex items-center px-1 ${darkMode ? 'bg-pink-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full mt-10 p-5 rounded-3xl border-2 border-rose-50 dark:border-rose-950/30 text-rose-500 font-bold flex items-center justify-center gap-3 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors active:scale-95 group shadow-sm hover:shadow-rose-100 dark:hover:shadow-none"
        >
          <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          {t('settings.logout')}
        </button>
      </div>

      {isLangModalOpen && (
        <div className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200 p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="p-6 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
              <h2 className="text-xl font-bold dark:text-white">{t('settings.language')}</h2>
              <button onClick={() => setIsLangModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-4 space-y-1 max-h-[60vh] overflow-y-auto">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    onLanguageChange(lang);
                    setIsLangModalOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${language === lang ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                >
                  <span className="font-semibold text-sm">{lang}</span>
                  {language === lang && <Check className="w-5 h-5" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
