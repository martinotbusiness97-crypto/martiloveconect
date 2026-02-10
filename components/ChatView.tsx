
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, MoreVertical, ShieldCheck, Paperclip, FileText, X, Loader2, Trash2, Heart, Sparkles, User, UserX } from 'lucide-react';
import { Conversation, Message, FileData, Profile } from '../types';
import { db } from '../firebase';
import { ref, onValue, set, update, push, serverTimestamp, get, remove } from 'firebase/database';
import { useTranslation } from '../App';

interface ChatViewProps {
  conversation: Conversation;
  onBack: () => void;
  onSendSound: () => void;
  onReceiveSound: () => void;
  onViewProfile?: (profile: Profile) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ conversation, onBack, onSendSound, onReceiveSound, onViewProfile }) => {
  const { user, profile: myProfile, playSound } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasILikedBack, setHasILikedBack] = useState<boolean | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [showMatchOverlay, setShowMatchOverlay] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Vérifier si j'ai déjà liké cette personne
  useEffect(() => {
    if (!user || !conversation.participant.id) return;
    const myLikeRef = ref(db, `users/${user.uid}/likes/${conversation.participant.id}`);
    const unsub = onValue(myLikeRef, (snapshot) => {
      setHasILikedBack(snapshot.exists());
    });
    return () => unsub();
  }, [user, conversation.participant.id]);

  // Marquer comme lu
  useEffect(() => {
    if (!user || !conversation.id) return;
    const myChatMetaRef = ref(db, `user_chats/${user.uid}/${conversation.id}/unreadCount`);
    set(myChatMetaRef, 0);
  }, [conversation.id, user?.uid]);

  // Écoute des messages
  useEffect(() => {
    if (!conversation.id) return;
    const messagesRef = ref(db, `chats/${conversation.id}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data) as Message[];
        const sorted = list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        if (sorted.length > messages.length) {
            const last = sorted[sorted.length - 1];
            if (last.senderId !== user?.uid && messages.length > 0) {
                onReceiveSound();
                set(ref(db, `user_chats/${user?.uid}/${conversation.id}/unreadCount`), 0);
            }
        }
        setMessages(sorted);
      } else {
        setMessages([]);
      }
    });
    return () => unsubscribe();
  }, [conversation.id, user?.uid, messages.length]);

  const handleLikeBack = async () => {
    if (!user || !conversation.participant.id) return;
    setIsMatching(true);
    try {
      const otherId = conversation.participant.id;
      const convId = conversation.id;
      await set(ref(db, `likes/${otherId}/${user.uid}`), {
        timestamp: serverTimestamp(),
        fromName: myProfile?.name || 'Quelqu\'un'
      });
      await set(ref(db, `users/${user.uid}/likes/${otherId}`), true);
      await update(ref(db, `user_chats/${user.uid}/${convId}`), { isMatch: true });
      playSound('match');
      setShowMatchOverlay(true);
      setTimeout(() => {
        setShowMatchOverlay(false);
        setIsMatching(false);
      }, 3000);
    } catch (err) {
      console.error("Erreur lors du match:", err);
      setIsMatching(false);
    }
  };

  const handleBlockUser = async () => {
    if (!user || !conversation.participant.id) return;
    if (confirm(`Voulez-vous vraiment bloquer ${conversation.participant.name} ?`)) {
      await set(ref(db, `blocked_users/${user.uid}/${conversation.participant.id}`), true);
      onBack();
    }
  };

  const handleDeleteChat = async () => {
    if (!user || !conversation.id) return;
    if (confirm("Supprimer cette discussion de votre liste ? (L'autre personne pourra toujours voir les messages)")) {
      await remove(ref(db, `user_chats/${user.uid}/${conversation.id}`));
      onBack();
    }
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && !selectedFile) || !user) return;
    setIsProcessing(true);
    let fileData: FileData | undefined;
    if (selectedFile) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(selectedFile);
      });
      fileData = { url: base64, name: selectedFile.name, type: selectedFile.type, size: selectedFile.size };
    }
    const messagesRef = ref(db, `chats/${conversation.id}/messages`);
    const newMsgRef = push(messagesRef);
    const msgId = newMsgRef.key;
    if (!msgId) return;
    const now = Date.now();
    const newMessage = { id: msgId, text: inputValue.trim() || "", file: fileData || null, senderId: user.uid, timestamp: now };
    onSendSound();
    const updates: any = {};
    const lastText = newMessage.text || (fileData ? "📁 Fichier" : "Nouveau message");
    const otherUid = conversation.participant.id;
    updates[`chats/${conversation.id}/messages/${msgId}`] = newMessage;
    updates[`user_chats/${user.uid}/${conversation.id}/lastMessage`] = lastText;
    updates[`user_chats/${user.uid}/${conversation.id}/timestamp`] = now;
    updates[`user_chats/${user.uid}/${conversation.id}/unreadCount`] = 0;
    if (hasILikedBack === false) {
      updates[`users/${user.uid}/likes/${otherUid}`] = true;
      updates[`likes/${otherUid}/${user.uid}`] = { timestamp: now, fromName: myProfile?.name || 'Quelqu\'un' };
      const iWasLikedSnap = await get(ref(db, `likes/${user.uid}/${otherUid}`));
      if (iWasLikedSnap.exists()) {
        updates[`user_chats/${user.uid}/${conversation.id}/isMatch`] = true;
      }
    }
    try {
        await update(ref(db), updates);
        setInputValue('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
        console.error("Erreur d'envoi:", e);
    } finally {
        setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="fixed inset-0 z-[150] bg-white dark:bg-slate-950 flex flex-col animate-in slide-in-from-right duration-300">
      {showMatchOverlay && (
        <div className="fixed inset-0 z-[1000] bg-pink-500 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500 text-white">
          <Sparkles className="w-16 h-16 mb-4 animate-bounce" />
          <h2 className="text-4xl font-black text-center mb-2">C'est un Match !</h2>
          <p className="text-center opacity-90 font-medium">Vous pouvez maintenant retrouver {conversation.participant.name} dans vos matchs.</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-sm z-10 relative">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </button>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onViewProfile?.(conversation.participant)}>
            <img src={conversation.participant.imageUrl} className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-100 dark:border-slate-800" alt="User" />
            <div>
              <h3 className="font-bold text-sm dark:text-white flex items-center gap-1">
                {conversation.participant.name} <ShieldCheck className="w-3 h-3 text-blue-500 fill-current" />
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">En ligne</span>
            </div>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 rounded-full transition-all ${isMenuOpen ? 'bg-slate-100 dark:bg-slate-900 text-pink-500' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 py-2 z-[200] animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => { setIsMenuOpen(false); onViewProfile?.(conversation.participant); }}
                className="w-full px-4 py-3 flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <User className="w-4 h-4 text-pink-500" />
                Voir le profil
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-800 mx-2" />
              <button 
                onClick={() => { setIsMenuOpen(false); handleBlockUser(); }}
                className="w-full px-4 py-3 flex items-center gap-3 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
              >
                <UserX className="w-4 h-4" />
                Bloquer l'utilisateur
              </button>
              <button 
                onClick={() => { setIsMenuOpen(false); handleDeleteChat(); }}
                className="w-full px-4 py-3 flex items-center gap-3 text-sm font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer la discussion
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bannière "Like Back" */}
      {hasILikedBack === false && (
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 animate-in slide-in-from-top duration-500 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-tight">Match potentiel !</p>
              <p className="text-[10px] font-medium opacity-90">Liker {conversation.participant.name} pour valider le match.</p>
            </div>
          </div>
          <button 
            onClick={handleLikeBack}
            disabled={isMatching}
            className="bg-white text-pink-500 px-4 py-2 rounded-xl text-xs font-black shadow-xl active:scale-95 transition-all flex items-center gap-2"
          >
            {isMatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4 fill-current" />}
            Liker en retour
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/20 dark:bg-slate-900/10">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
              <div className={`max-w-[80%] flex items-center gap-2 group relative ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm relative ${
                  isMe ? 'bg-pink-500 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                }`}>
                  {msg.file && (
                    <div className="mb-2">
                      {msg.file.type.startsWith('image/') ? (
                        <img src={msg.file.url} className="max-w-full rounded-xl" alt="Fichier" />
                      ) : (
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${isMe ? 'bg-white/10' : 'bg-slate-50 dark:bg-slate-900'}`}>
                          <FileText className="w-8 h-8 text-pink-500" />
                          <div className="overflow-hidden min-w-[120px]">
                            <p className="text-xs font-bold truncate">{msg.file.name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {msg.text && <p className="leading-relaxed break-words font-medium">{msg.text}</p>}
                  <div className={`text-[9px] mt-1 font-bold text-right ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 pb-8">
        <div className="flex items-center gap-3">
          <input type="file" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-pink-500 transition-colors"><Paperclip className="w-5 h-5" /></button>
          <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-[1.5rem] px-5 py-1 focus-within:ring-2 focus-within:ring-pink-500/50 transition-all">
            <input 
              type="text" placeholder="Répondre..." value={inputValue} onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full bg-transparent border-none outline-none py-3 text-sm dark:text-white font-medium"
            />
          </div>
          <button onClick={handleSend} disabled={(!inputValue.trim() && !selectedFile) || isProcessing} className="w-12 h-12 flex items-center justify-center bg-pink-500 text-white rounded-2xl shadow-lg active:scale-90 transition-all disabled:opacity-30">
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
