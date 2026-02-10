
import React, { useState, useEffect } from 'react';
import { Heart, Loader2, MessageCircle } from 'lucide-react';
import { useTranslation } from '../App';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Profile } from '../types';

const Matches: React.FC = () => {
  const { t, user, startConversation } = useTranslation();
  const [matches, setMatches] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const userChatsRef = ref(db, `user_chats/${user.uid}`);
    const unsubscribe = onValue(userChatsRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Filtrer uniquement ceux qui sont des matches officiels (réciprocité validée)
        const matchData = Object.values(data).filter((c: any) => c.isMatch === true);
        const matchIds = matchData.map((c: any) => c.participantId);
        
        const profiles: Profile[] = [];
        for (const mId of matchIds) {
          const uRef = ref(db, `users/${mId}`);
          const uSnap = await new Promise<any>(res => onValue(uRef, s => res(s.val()), {onlyOnce: true}));
          if (uSnap) profiles.push(uSnap);
        }
        setMatches(profiles);
      } else {
        setMatches([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 h-full">
      <h1 className="text-3xl font-black tracking-tighter mb-8 dark:text-white">{t('matches.title')}</h1>
      
      {matches.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {matches.map((p) => (
            <div key={p.id} className="relative group aspect-[3/4] rounded-3xl overflow-hidden shadow-md animate-in zoom-in-95 duration-300">
              <img src={p.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="text-white">
                  <p className="font-bold text-sm">{p.name}, {p.age}</p>
                </div>
                <button 
                  onClick={() => startConversation(p)}
                  className="p-2 bg-pink-500 rounded-full text-white shadow-lg active:scale-90 transition-transform"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-10">
          <div className="w-20 h-20 bg-pink-50 dark:bg-pink-950/20 rounded-full flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-pink-500 fill-current" />
          </div>
          <h2 className="text-2xl font-bold mb-2 dark:text-white">{t('matches.title')}</h2>
          <p className="text-slate-500 text-sm max-w-xs">{t('matches.empty')}</p>
        </div>
      )}
    </div>
  );
};

export default Matches;
