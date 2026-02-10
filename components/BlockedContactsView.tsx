
import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserX, ShieldAlert, Loader2 } from 'lucide-react';
import { Profile } from '../types';
import { db } from '../firebase';
import { ref, onValue, set } from 'firebase/database';
import { useTranslation } from '../App';

interface BlockedContactsViewProps {
  onBack: () => void;
}

const BlockedContactsView: React.FC<BlockedContactsViewProps> = ({ onBack }) => {
  const { user } = useTranslation();
  const [blockedList, setBlockedList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const blockedRef = ref(db, `blocked_users/${user.uid}`);
    const unsubscribe = onValue(blockedRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ids = Object.keys(data);
        const profiles: Profile[] = [];
        for (const id of ids) {
          const uRef = ref(db, `users/${id}`);
          const uSnap = await new Promise<any>(res => onValue(uRef, s => res(s.val()), {onlyOnce: true}));
          if (uSnap) profiles.push(uSnap);
        }
        setBlockedList(profiles);
      } else {
        setBlockedList([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleUnblock = (id: string) => {
    if (!user) return;
    set(ref(db, `blocked_users/${user.uid}/${id}`), null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 animate-in slide-in-from-right duration-300">
      <div className="p-6 flex items-center gap-4 border-b border-slate-50 dark:border-slate-900 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight dark:text-white">Contacts bloqués</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{blockedList.length} personnes réelles</p>
        </div>
      </div>

      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          </div>
        ) : blockedList.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-[2rem] flex items-center gap-3 mb-6">
              <ShieldAlert className="w-5 h-5 text-slate-400" />
              <p className="text-[11px] text-slate-500 font-medium">
                Les personnes bloquées ne peuvent plus voir votre profil réel, ni vous envoyer de messages.
              </p>
            </div>
            
            <div className="space-y-1">
              {blockedList.map((p) => (
                <div 
                  key={p.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl group"
                >
                  <div className="flex items-center gap-4">
                    <img 
                      src={p.imageUrl} 
                      alt={p.name} 
                      className="w-12 h-12 rounded-full object-cover grayscale opacity-60"
                    />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{p.location}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUnblock(p.id)}
                    className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold rounded-xl active:scale-95 transition-all"
                  >
                    Débloquer
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <UserX className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-slate-400 font-medium">Votre liste de contacts bloqués est vide.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockedContactsView;
