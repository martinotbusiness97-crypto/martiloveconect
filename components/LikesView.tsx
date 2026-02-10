
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, ShieldCheck, MapPin, Loader2, MessageCircle, X } from 'lucide-react';
import { Profile } from '../types';
import ProfileDetail from './ProfileDetail';
import { db } from '../firebase';
import { ref, onValue, set, update, serverTimestamp } from 'firebase/database';
import { useTranslation } from '../App';

interface LikesViewProps {
  onBack: () => void;
  onMatchSound: () => void;
}

const LikesView: React.FC<LikesViewProps> = ({ onBack, onMatchSound }) => {
  const { user, profile: myProfile, startConversation } = useTranslation();
  const [likes, setLikes] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const likesRef = ref(db, `likes/${user.uid}`);
    const unsubscribe = onValue(likesRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const likersIds = Object.keys(data);
        const likersProfiles: Profile[] = [];
        
        for (const likerId of likersIds) {
          const userSnapRef = ref(db, `users/${likerId}`);
          const userSnap = await new Promise<any>((res) => onValue(userSnapRef, s => res(s.val()), {onlyOnce: true}));
          if (userSnap) likersProfiles.push(userSnap);
        }
        setLikes(likersProfiles);
      } else {
        setLikes([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLikeBack = (liker: Profile) => {
    if (!user) return;
    onMatchSound();
    
    const matchId = [user.uid, liker.id].sort().join('_');
    
    set(ref(db, `matches/${matchId}`), {
      users: [user.uid, liker.id],
      timestamp: serverTimestamp()
    });

    const placeholderMsg = "Discussion ouverte";
    const now = serverTimestamp();

    // Utilisation de update pour les chemins complexes
    const updates: any = {};
    updates[`user_chats/${user.uid}/${matchId}`] = {
      participantId: liker.id,
      lastMessage: placeholderMsg,
      timestamp: now
    };
    updates[`user_chats/${liker.id}/${matchId}`] = {
      participantId: user.uid,
      lastMessage: placeholderMsg,
      timestamp: now
    };

    update(ref(db), updates);

    set(ref(db, `likes/${user.uid}/${liker.id}`), null);
    setMatchedProfile(liker);
    setSelectedProfile(null);
  };

  const handleDecline = (likerId: string) => {
    if (!user) return;
    set(ref(db, `likes/${user.uid}/${likerId}`), null);
    setSelectedProfile(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 animate-in slide-in-from-right duration-300">
      <div className="p-6 flex items-center gap-4 border-b border-slate-50 dark:border-slate-900 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight dark:text-white">Ils vous ont aimé</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{likes.length} personnes réelles</p>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4 flex-1">
        {loading ? (
          <div className="col-span-2 flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          </div>
        ) : likes.length > 0 ? (
          likes.map((p) => (
            <div 
              key={p.id} 
              onClick={() => setSelectedProfile(p)}
              className="relative aspect-[3/4] rounded-[2rem] overflow-hidden cursor-pointer group shadow-sm hover:shadow-lg transition-all"
            >
              <img src={p.imageUrl} alt={p.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="font-bold flex items-center gap-1">
                  {p.name}, {p.age}
                  <ShieldCheck className="w-3 h-3 text-blue-400 fill-current" />
                </p>
                <div className="flex items-center gap-1 text-[10px] opacity-80">
                  <MapPin className="w-3 h-3" />
                  {p.location}
                </div>
              </div>
              <div className="absolute top-3 right-3 bg-pink-500 p-1.5 rounded-full shadow-lg">
                <Heart className="w-3 h-3 text-white fill-current" />
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 flex flex-col items-center justify-center py-20 text-center px-10">
            <Heart className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">Personne ne vous a encore liké. Complétez votre profil pour attirer l'attention !</p>
          </div>
        )}
      </div>

      {selectedProfile && (
        <ProfileDetail 
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onLike={() => handleLikeBack(selectedProfile)}
          onPass={() => handleDecline(selectedProfile.id)}
        />
      )}

      {matchedProfile && (
        <div className="fixed inset-0 z-[1000] bg-pink-500 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
          <div className="relative mb-12 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-2xl animate-in slide-in-from-left duration-700">
              <img src={myProfile?.imageUrl} className="w-full h-full object-cover" />
            </div>
            <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-2xl -ml-8 animate-in slide-in-from-right duration-700">
              <img src={matchedProfile.imageUrl} className="w-full h-full object-cover" />
            </div>
            <div className="absolute bg-white p-3 rounded-full shadow-xl animate-bounce">
              <Heart className="w-6 h-6 text-pink-500 fill-current" />
            </div>
          </div>
          
          <h2 className="text-5xl font-black text-white text-center mb-4 tracking-tighter">C'est un Match !</h2>
          <p className="text-white/90 text-center mb-12 font-medium">
            Vous et {matchedProfile.name} vous plaisez mutuellement.
          </p>
          
          <div className="w-full max-w-xs space-y-4">
            <button 
              onClick={() => {
                startConversation(matchedProfile);
                setMatchedProfile(null);
              }}
              className="w-full py-4 bg-white text-pink-500 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              Écrire un message
            </button>
            <button 
              onClick={() => setMatchedProfile(null)}
              className="w-full py-4 bg-pink-600/30 text-white rounded-2xl font-bold hover:bg-pink-600/50 transition-all active:scale-95"
            >
              Continuer à découvrir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LikesView;
