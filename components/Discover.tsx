
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Loader2, X, Globe } from 'lucide-react';
import { Profile, FilterSettings } from '../types';
import ProfileCard from './ProfileCard';
import ProfileDetail from './ProfileDetail';
import { useTranslation } from '../App';
import { db } from '../firebase';
import { ref, onValue, set, serverTimestamp } from 'firebase/database';

interface DiscoverProps {
  onLikeSound: () => void;
}

const Discover: React.FC<DiscoverProps> = ({ onLikeSound }) => {
  const { t, user, profile } = useTranslation();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [myLikes, setMyLikes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  const [filters, setFilters] = useState<FilterSettings>({
    minAge: 18,
    maxAge: 99,
    country: 'Tous',
    religion: 'Toutes'
  });

  // Charger les IDs des personnes déjà matchées et aimées
  useEffect(() => {
    if (!user) return;
    
    // Matches
    const userChatsRef = ref(db, `user_chats/${user.uid}`);
    const unsubMatches = onValue(userChatsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMatchedIds(Object.values(data).map((chat: any) => chat.participantId));
      } else {
        setMatchedIds([]);
      }
    });

    // Mes propres likes (pour le mode incognito)
    const myLikesRef = ref(db, `user_actions/${user.uid}/likes`);
    const unsubLikes = onValue(myLikesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMyLikes(Object.keys(data));
      } else {
        setMyLikes([]);
      }
    });

    return () => {
      unsubMatches();
      unsubLikes();
    };
  }, [user]);

  // Charger tous les profils
  useEffect(() => {
    if (!user) return;
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = Object.values(data) as any[];
        setProfiles(userList.filter(p => p.id !== user.uid));
      } else {
        setProfiles([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Filtrage avancé avec respect de la confidentialité
  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      // 1. CONFIDENTIALITÉ : Vérifier si le profil est public
      // @ts-ignore
      const isPublic = p.settings?.isPublic !== false;
      // @ts-ignore
      const isIncognito = p.settings?.incognitoMode === true;

      // Si le profil n'est pas public, on ne l'affiche jamais
      if (!isPublic) return false;

      // Si le profil est incognito, on ne l'affiche QUE si p a liké l'utilisateur actuel
      // (Mais ici, pour simplifier selon la logique Aura : si p est incognito, il n'apparaît 
      // que s'il a déjà initié un intérêt ou si l'utilisateur actuel fait partie de ses likes)
      // Note: On cache les incognitos par défaut pour respecter la règle "Seulement ceux que j'ai liké peuvent me voir"
      if (isIncognito) return false;

      // 2. Exclure les personnes déjà matchées
      if (matchedIds.includes(p.id)) return false;

      // 3. Filtre par préférence sexuelle
      if (profile?.seeking === 'Hommes' && p.gender !== 'Homme') return false;
      if (profile?.seeking === 'Femmes' && p.gender !== 'Femme') return false;
      
      // 4. Recherche textuelle
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (p.interest && p.interest.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // 5. Filtres d'âge et pays
      const matchesAge = p.age >= filters.minAge && p.age <= filters.maxAge;
      const matchesCountry = filters.country === 'Tous' || p.country === filters.country;
      
      return matchesSearch && matchesAge && matchesCountry;
    });
  }, [searchQuery, profiles, matchedIds, filters, profile]);

  const availableCountries = useMemo(() => {
    const countries = profiles.map(p => p.country).filter(Boolean);
    return ['Tous', ...Array.from(new Set(countries))].sort();
  }, [profiles]);

  const handleLike = (likedId: string) => {
    if (!user) return;
    onLikeSound();
    set(ref(db, `likes/${likedId}/${user.uid}`), {
      timestamp: serverTimestamp(),
      fromName: profile?.name || 'Quelqu\'un'
    });
    set(ref(db, `user_actions/${user.uid}/likes/${likedId}`), true);
    setSelectedProfile(null);
  };

  const handlePass = (passedId: string) => {
    if (!user) return;
    set(ref(db, `user_actions/${user.uid}/passes/${passedId}`), true);
    setSelectedProfile(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Synchronisation des profils...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">{t('discover.title')}</h1>
        <button 
          onClick={() => setIsFilterModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border rounded-xl dark:border-slate-800 text-sm font-medium transition-all active:scale-95 bg-white dark:bg-slate-900 shadow-sm"
        >
          <Filter className="w-4 h-4 text-pink-500" />
          {t('discover.filters')}
          {filters.country !== 'Tous' && <span className="w-2 h-2 bg-pink-500 rounded-full"></span>}
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text"
          placeholder={t('discover.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none text-slate-700 dark:text-slate-200 transition-all font-medium"
        />
      </div>

      {filteredProfiles.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {filteredProfiles.map((p) => (
            <div key={p.id} onClick={() => setSelectedProfile(p)}>
              <ProfileCard profile={p} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] mt-4 border border-dashed border-slate-200 dark:border-slate-800">
          <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 font-medium px-10">Aucun nouveau profil à découvrir avec vos réglages actuels.</p>
          <button 
            onClick={() => setFilters({ ...filters, country: 'Tous' })}
            className="mt-4 text-pink-500 font-bold text-sm"
          >
            Réinitialiser les pays
          </button>
        </div>
      )}

      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end justify-center p-0 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-t-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-400">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black dark:text-white">Filtres de recherche</h2>
              <button onClick={() => setIsFilterModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Pays inscrits</label>
                <div className="flex flex-wrap gap-2">
                  {availableCountries.map(c => (
                    <button 
                      key={c}
                      onClick={() => setFilters({ ...filters, country: c })}
                      className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${filters.country === c ? 'bg-pink-500 text-white shadow-lg shadow-pink-200' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800'}`}
                    >
                      {c === 'Tous' ? '🌐 Tous les pays' : c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Tranche d'âge : {filters.minAge} - {filters.maxAge} ans</label>
                <div className="px-4">
                   <input 
                    type="range" min="18" max="99" value={filters.minAge} 
                    onChange={e => setFilters({ ...filters, minAge: parseInt(e.target.value) })}
                    className="w-full accent-pink-500 mb-2"
                   />
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsFilterModalOpen(false)}
              className="w-full mt-10 py-4 bg-slate-900 dark:bg-white dark:text-slate-950 text-white rounded-3xl font-black transition-all active:scale-95 shadow-xl"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      )}

      {selectedProfile && (
        <ProfileDetail 
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onLike={handleLike}
          onPass={handlePass}
        />
      )}
    </div>
  );
};

export default Discover;
