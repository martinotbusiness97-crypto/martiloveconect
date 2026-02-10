
import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, Loader2 } from 'lucide-react';
import { Conversation, Profile } from '../types';
import ChatView from './ChatView';
import ProfileDetail from './ProfileDetail';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { useTranslation } from '../App';

interface MessagesProps {
  onSendSound: () => void;
  onReceiveSound: () => void;
  initialActiveId?: string | null;
  onClearActiveId?: () => void;
}

const Messages: React.FC<MessagesProps> = ({ 
  onSendSound, 
  onReceiveSound, 
  initialActiveId,
  onClearActiveId
}) => {
  const { user } = useTranslation();
  const [conversations, setConversations] = useState<(Conversation & { unreadCount: number, lastMessage?: string })[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialActiveId || null);
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const userChatsRef = ref(db, `user_chats/${user.uid}`);
    const unsubscribe = onValue(userChatsRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const convIds = Object.keys(data);
      const convPromises = convIds.map(async (id) => {
        const meta = data[id];
        const participantRef = ref(db, `users/${meta.participantId}`);
        const participantSnap = await new Promise<any>((res) => onValue(participantRef, s => res(s.val()), {onlyOnce: true}));
        
        return {
          id,
          participant: participantSnap,
          messages: [],
          unreadCount: meta.unreadCount || 0,
          lastMessage: meta.lastMessage || ""
        };
      });

      const results = await Promise.all(convPromises);
      setConversations(results.filter(c => c.participant));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (initialActiveId) {
      setActiveConversationId(initialActiveId);
    }
  }, [initialActiveId]);

  const filteredConversations = conversations.filter(c => 
    c.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-slate-950">
      <div className="p-6 pb-2">
        <h1 className="text-3xl font-bold mb-6 dark:text-white">Messages</h1>
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Rechercher une discussion..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-900 rounded-2xl outline-none text-slate-700 dark:text-slate-200"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-24">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.sort((a, b) => b.id.localeCompare(a.id)).map(conv => (
            <div 
              key={conv.id} 
              onClick={() => setActiveConversationId(conv.id)} 
              className={`flex items-center gap-4 p-4 rounded-[2rem] cursor-pointer transition-all active:scale-[0.98] ${activeConversationId === conv.id ? 'bg-pink-50 dark:bg-pink-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <div className="relative">
                <img src={conv.participant.imageUrl} className="w-14 h-14 rounded-full object-cover shadow-sm border border-slate-100 dark:border-slate-800" />
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-0.5">
                  <p className="font-bold dark:text-white truncate">{conv.participant.name}</p>
                </div>
                <p className={`text-xs truncate font-medium ${conv.unreadCount > 0 ? 'text-slate-900 dark:text-white font-black' : 'text-slate-500'}`}>
                   {conv.lastMessage || "Cliquez pour discuter"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <MessageSquare className="w-12 h-12 mb-4" />
            <p className="font-medium text-sm">Aucune discussion encore.</p>
          </div>
        )}
      </div>

      {activeConversation && (
        <ChatView 
          conversation={activeConversation}
          onBack={() => {
            setActiveConversationId(null);
            if (onClearActiveId) onClearActiveId();
          }}
          onSendSound={onSendSound}
          onReceiveSound={onReceiveSound}
          onViewProfile={setViewingProfile}
        />
      )}

      {viewingProfile && <ProfileDetail profile={viewingProfile} onClose={() => setViewingProfile(null)} />}
    </div>
  );
};

export default Messages;
