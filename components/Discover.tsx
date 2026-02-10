
import React, { useState, useMemo, useEffect } from 'react';
// Added Heart icon to imports
import { Search, Filter, Loader2, X, Globe, Heart } from 'lucide-react';
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
  
  // Filtres par défaut au maximum pour montrer tout le monde
  const [filters, setFilters] = useState<FilterSettings>({
    minAge: 18,
    maxAge: 99,
    country: 'Tous',
    religion: 'Toutes'
  });

  // Charger les IDs des personnes déjà matchées et aimées pour les masquer
  useEffect(() => {
    if (!user) return;
    
    const userChatsRef = ref(db, `user_chats/${user.uid}`);
    const unsubMatches = onValue(userChatsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMatchedIds(Object.values(data).map((chat: any) => chat.participantId));
      } else {
        setMatchedIds([]);
      }
    });

    // Utilisation de users/${user.uid}/likes pour garantir les permissions
    const myLikesRef = ref(db, `users/${user.uid}/likes`);
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

  // Récupération de tous les utilisateurs
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

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      // 1. OBLIGATOIRE : Profil complet
      if (p.isComplete !== true) return false;

      // 2. CONFIDENTIALITÉ : Respecter le mode public/privé
      const isPublic = p.settings?.isPublic !== false;
      const isIncognito = p.settings?.incognitoMode === true;
      if (!isPublic || isIncognito) return false;

      // 3. NE PAS REVOIR : Masquer les gens déjà matchés ou likés
      if (matchedIds.includes(p.id)) return false;
      if (myLikes.includes(p.id)) return false;

      // 4. PRÉFÉRENCES (Le cœur de la demande)
      // On vérifie le choix de l'utilisateur stocké pendant l'inscription
      if (profile?.seeking === 'Hommes' && p.gender !== 'Homme') return false;
      if (profile?.seeking === 'Femmes' && p.gender !== 'Femme') return false;
      // Si profile.seeking === 'Tous', on ne filtre pas sur le genre.

      // 5. FILTRES DÉFAUT/UTILISATEUR (Recherche, Âge, Pays)
      const matchesSearch = searchQuery === '' || 
                           p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (p.interest && p.interest.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesAge = p.age >= filters.minAge && p.age <= filters.maxAge;
      const matchesCountry = filters.country === 'Tous' || p.country === filters.country;
      
      return matchesSearch && matchesAge && matchesCountry;
    });
  }, [searchQuery, profiles, matchedIds, myLikes, filters, profile]);

  const availableCountries = useMemo(() => {
    const countries = profiles
      .filter(p => p.isComplete)
      .map(p => p.country)
      .filter(Boolean);
    return ['Tous', ...Array.from(new Set(countries))].sort();
  }, [profiles]);

  const handleLike = (likedId: string) => {
    if (!user) return;
    onLikeSound();
    // Signalement à l'autre utilisateur (Inbox de likes)
    set(ref(db, `likes/${likedId}/${user.uid}`), {
      timestamp: serverTimestamp(),
      fromName: profile?.name || 'Quelqu\'un'
    });
    // Enregistrement de mon action dans mon propre espace utilisateur
    set(ref(db, `users/${user.uid}/likes/${likedId}`), true);
    setSelectedProfile(null);
  };

  const handlePass = (passedId: string) => {
    if (!user) return;
    set(ref(db, `users/${user.uid}/passes/${passedId}`), true);
    setSelectedProfile(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-4" />
          <Heart className="w-4 h-4 text-pink-500 absolute top-4 left-4 animate-pulse" />
        </div>
        <p className="text-slate-500 font-bold animate-pulse">Recherche des profils...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter dark:text-white">{t('discover.title')}</h1>
          <p className="text-[10px] font-bold text-pink-500 uppercase tracking-widest">Selon vos préférences</p>
        </div>
        <button 
          onClick={() => setIsFilterModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border dark:border-slate-800 rounded-2xl text-xs font-bold transition-all active:scale-95 bg-white dark:bg-slate-900 shadow-sm"
        >
          <Filter className="w-4 h-4 text-pink-500" />
          {t('discover.filters')}
          {filters.country !== 'Tous' && <span className="w-2 h-2 bg-pink-500 rounded-full animate-ping"></span>}
        </button>
      </div>

      <div className="relative mb-6 group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors">
          <Search className="w-5 h-5" />
        </div>
        <input 
          type="text"
          placeholder={t('discover.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-slate-100 dark:bg-slate-900 border-2 border-transparent focus:border-pink-500/20 rounded-[1.5rem] outline-none text-slate-700 dark:text-slate-200 transition-all font-bold text-sm"
        />
      </div>

      {filteredProfiles.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {filteredProfiles.map((p) => (
            <div key={p.id} onClick={() => setSelectedProfile(p)} className="animate-in zoom-in-95 duration-300">
              <ProfileCard profile={p} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] mt-4 border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center">
          <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-xl mb-6">
            <Globe className="w-10 h-10 text-slate-300 animate-pulse" />
          </div>
          <p className="text-slate-400 font-bold px-12 leading-relaxed">
            Plus de profils disponibles pour le moment.<br/>
            <span className="text-[10px] uppercase mt-2 block opacity-50">Essayez d'élargir vos filtres</span>
          </p>
          <button 
            onClick={() => setFilters({ minAge: 18, maxAge: 99, country: 'Tous', religion: 'Toutes' })}
            className="mt-6 px-6 py-3 bg-white dark:bg-slate-800 text-pink-500 rounded-2xl font-black text-xs shadow-md active:scale-95 transition-all"
          >
            Réinitialiser tout
          </button>
        </div>
      )}

      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[500] bg-slate-950/60 backdrop-blur-md flex items-end justify-center animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-t-[3.5rem] p-10 shadow-2xl animate-in slide-in-from-bottom duration-500 border-t border-white/5">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black dark:text-white tracking-tighter">Personnaliser l'affichage</h2>
              <button onClick={() => setIsFilterModalOpen(false)} className="p-3 bg-slate-100 dark:bg-slate-900 rounded-full hover:rotate-90 transition-transform">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <div className="space-y-10">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 block">Explorer par pays</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto no-scrollbar pb-2">
                  {availableCountries.map(c => (
                    <button 
                      key={c}
                      onClick={() => setFilters({ ...filters, country: c })}
                      className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all border ${filters.country === c ? 'bg-pink-500 text-white border-pink-500 shadow-xl shadow-pink-500/20' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-transparent'}`}
                    >
                      {c === 'Tous' ? '🌎 Monde entier' : c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-6">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">Tranche d'âge</label>
                   <span className="text-sm font-black text-pink-500 bg-pink-500/10 px-3 py-1 rounded-full">{filters.minAge} - {filters.maxAge} ans</span>
                </div>
                <div className="px-2">
                   <input 
                    type="range" min="18" max="99" value={filters.minAge} 
                    onChange={e => setFilters({ ...filters, minAge: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-lg appearance-none cursor-pointer accent-pink-500"
                   />
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsFilterModalOpen(false)}
              className="w-full mt-12 py-5 bg-pink-500 text-white rounded-[2rem] font-black text-lg transition-all active:scale-95 shadow-2xl shadow-pink-500/30"
            >
              Appliquer les réglages
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
