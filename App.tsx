
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { AppTab, Profile, Conversation, Message } from './types';
import Discover from './components/Discover';
import BottomNav from './components/BottomNav';
import Matches from './components/Matches';
import Messages from './components/Messages';
import Notifications from './components/Notifications';
import ProfileView from './components/ProfileView';
import LikesView from './components/LikesView';
import SecurityPrivacyView from './components/SecurityPrivacyView';
import BlockedContactsView from './components/BlockedContactsView';
import ChangePasswordView from './components/ChangePasswordView';
import EditProfileView from './components/EditProfileView';
import SettingsView from './components/SettingsView';
import PaymentsView from './components/PaymentsView';
import AuthView from './components/AuthView';
import { Language, translations } from './translations';
import { Heart } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue, set, update, serverTimestamp, get } from 'firebase/database';

export type SoundType = 'sent' | 'received' | 'match' | 'notif';

const SOUNDS: Record<SoundType, string> = {
  sent: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
  received: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
  match: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  notif: 'https://assets.mixkit.co/active_storage/sfx/2361/2361-preview.mp3'
};

interface LanguageContextType {
  language: Language;
  t: (key: keyof typeof translations['Français (FR)']) => string;
  setLanguage: (lang: Language) => void;
  playSound: (type: SoundType) => void;
  volume: number;
  setVolume: (v: number) => void;
  isMuted: boolean;
  setIsMuted: (m: boolean) => void;
  startConversation: (profile: Profile) => void;
  user: any;
  profile: Profile | null;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used within LanguageProvider');
  return context;
};

const Splash: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-gradient-to-br from-pink-500 via-rose-500 to-violet-600 animate-in fade-in duration-500">
      <div className="relative mb-6 animate-bounce">
        <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white/30">
          <Heart className="w-12 h-12 text-white fill-current animate-pulse" />
        </div>
      </div>
      <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-2xl">
        MartiLoveconect
      </h1>
    </div>
  );
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('discover');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('aura-theme') === 'dark');
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('aura-language') as Language) || 'Français (FR)';
  });
  const [volume, setVolumeState] = useState(() => Number(localStorage.getItem('aura-volume') || '0.5'));
  const [isMuted, setIsMutedState] = useState(() => localStorage.getItem('aura-muted') === 'true');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profileRef = ref(db, `users/${firebaseUser.uid}`);
        onValue(profileRef, (snapshot) => {
          const data = snapshot.val();
          setProfile(data);
          setProfileLoaded(true);
        });

        const userChatsRef = ref(db, `user_chats/${firebaseUser.uid}`);
        onValue(userChatsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const total = Object.values(data).reduce((acc: number, chat: any) => acc + (chat.unreadCount || 0), 0);
            setUnreadMessages(total);
          } else {
            setUnreadMessages(0);
          }
        });

        const likesRef = ref(db, `likes/${firebaseUser.uid}`);
        onValue(likesRef, (snapshot) => {
          const data = snapshot.val();
          setUnreadNotifs(data ? Object.keys(data).length : 0);
        });

      } else {
        setProfile(null);
        setProfileLoaded(true);
        setUnreadMessages(0);
        setUnreadNotifs(0);
      }
      setShowSplash(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
      setProfileLoaded(false);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('aura-language', lang);
  };

  const setVolume = (v: number) => {
    setVolumeState(v);
    localStorage.setItem('aura-volume', v.toString());
  };

  const setIsMuted = (m: boolean) => {
    setIsMutedState(m);
    localStorage.setItem('aura-muted', m.toString());
  };

  const playSound = useCallback((type: SoundType) => {
    if (isMuted) return;
    const audio = new Audio(SOUNDS[type]);
    audio.volume = volume;
    audio.play().catch(() => {});
  }, [volume, isMuted]);

  const startConversation = async (profileToMessage: Profile) => {
    if (!user) return;
    const convId = [user.uid, profileToMessage.id].sort().join('_');
    
    // Vérifier si c'est un match officiel via mon Inbox (si l'autre m'a déjà liké)
    const iWasLikedSnap = await get(ref(db, `likes/${user.uid}/${profileToMessage.id}`));
    const isMatchDetected = iWasLikedSnap.exists();

    // On ne met à jour QUE mon propre nœud user_chats pour éviter les PERMISSION_DENIED
    const myChatUpdates: any = {};
    myChatUpdates[`user_chats/${user.uid}/${convId}/participantId`] = profileToMessage.id;
    myChatUpdates[`user_chats/${user.uid}/${convId}/timestamp`] = serverTimestamp();
    myChatUpdates[`user_chats/${user.uid}/${convId}/isMatch`] = isMatchDetected;

    await update(ref(db), myChatUpdates);
    setActiveChatId(convId);
    setActiveTab('messages');
  };

  const t = (key: keyof typeof translations['Français (FR)']): string => {
    return translations[language][key] || translations['Français (FR)'][key];
  };

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('aura-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const renderContent = () => {
    switch (activeTab) {
      case 'discover': return <Discover onLikeSound={() => playSound('match')} />;
      case 'matches': return <Matches />;
      case 'messages': 
        return (
          <Messages 
            onSendSound={() => playSound('sent')} 
            onReceiveSound={() => playSound('received')} 
            initialActiveId={activeChatId}
            onClearActiveId={() => setActiveChatId(null)}
          />
        );
      case 'notifs': return <Notifications onNavigate={setActiveTab} onNotifSound={() => playSound('notif')} />;
      case 'profile': return <ProfileView onNavigate={setActiveTab} />;
      case 'likes': return <LikesView onBack={() => setActiveTab('profile')} onMatchSound={() => playSound('match')} />;
      case 'security': return <SecurityPrivacyView onBack={() => setActiveTab('profile')} onNavigate={setActiveTab} />;
      case 'blocked': return <BlockedContactsView onBack={() => setActiveTab('security')} />;
      case 'change-password': return <ChangePasswordView onBack={() => setActiveTab('security')} />;
      case 'edit-profile': return <EditProfileView onBack={() => setActiveTab('profile')} />;
      case 'payments': return <PaymentsView onBack={() => setActiveTab('profile')} />;
      case 'settings':
        return (
          <SettingsView 
            onBack={() => setActiveTab('profile')} 
            onNavigate={setActiveTab} 
            darkMode={darkMode}
            onToggleDarkMode={setDarkMode}
            language={language}
            onLanguageChange={setLanguage}
            volume={volume}
            setVolume={setVolume}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            onLogout={handleLogout}
          />
        );
      default: return <Discover onLikeSound={() => playSound('match')} />;
    }
  };

  if (showSplash || !profileLoaded) return <Splash />;

  if (!user || (profileLoaded && (!profile || !profile.isComplete))) {
    return (
      <LanguageContext.Provider value={{ user, profile, language, t, setLanguage, playSound, volume, setVolume, isMuted, setIsMuted, startConversation }}>
        <AuthView onLogin={() => {}} />
      </LanguageContext.Provider>
    );
  }

  const isFullHeightTab = ['likes', 'security', 'blocked', 'change-password', 'edit-profile', 'settings', 'payments'].includes(activeTab);

  return (
    <LanguageContext.Provider value={{ user, profile, language, t, setLanguage, playSound, volume, setVolume, isMuted, setIsMuted, startConversation }}>
      <div className="flex flex-col min-h-screen max-w-2xl mx-auto bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-xl relative overflow-hidden transition-colors duration-300">
        <main className="flex-1 overflow-y-auto pb-20">
          {renderContent()}
        </main>
        
        {!isFullHeightTab && (
          <div className="fixed bottom-0 w-full max-w-2xl bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 px-2 py-3 z-50">
            <BottomNav 
              activeTab={isFullHeightTab && activeTab !== 'payments' ? 'profile' : activeTab} 
              setActiveTab={setActiveTab} 
              badges={{
                messages: unreadMessages,
                notifs: unreadNotifs
              }}
            />
          </div>
        )}
      </div>
    </LanguageContext.Provider>
  );
};

export default App;
