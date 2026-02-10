
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, MoreVertical, ShieldCheck, Paperclip, FileText, X, Loader2, Trash2 } from 'lucide-react';
import { Conversation, Message, FileData, Profile } from '../types';
import { db } from '../firebase';
import { ref, onValue, set, update, runTransaction, push, remove } from 'firebase/database';
import { useTranslation } from '../App';

interface ChatViewProps {
  conversation: Conversation;
  onBack: () => void;
  onSendSound: () => void;
  onReceiveSound: () => void;
  onViewProfile?: (profile: Profile) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ conversation, onBack, onSendSound, onReceiveSound, onViewProfile }) => {
  const { user } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Marquer comme lu
  useEffect(() => {
    if (!user || !conversation.id) return;
    const myChatMetaRef = ref(db, `user_chats/${user.uid}/${conversation.id}/unreadCount`);
    set(myChatMetaRef, 0);
  }, [conversation.id, user?.uid]);

  // Écoute des messages en temps réel
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

  // FONCTION DE SUPPRESSION AMÉLIORÉE
  const handleDeleteMessage = async (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Supprimer ce message définitivement ?")) return;
    
    setIsDeleting(messageId);
    console.log("Suppression du message:", messageId);

    try {
      // 1. Suppression optimiste : on l'enlève de l'écran tout de suite
      setMessages(prev => prev.filter(m => m.id !== messageId));

      // 2. Suppression dans la branche principale des messages
      const messagePath = `chats/${conversation.id}/messages/${messageId}`;
      await remove(ref(db, messagePath));

      // 3. Mise à jour des aperçus (lastMessage)
      const placeholder = "🚫 Message supprimé";
      const updates: any = {};
      
      // On essaie de mettre à jour pour les deux (si les règles le permettent)
      updates[`user_chats/${user?.uid}/${conversation.id}/lastMessage`] = placeholder;
      if (conversation.participant.id) {
          updates[`user_chats/${conversation.participant.id}/${conversation.id}/lastMessage`] = placeholder;
      }
      
      // On utilise update pour ne pas écraser le reste du dossier
      await update(ref(db), updates).catch(err => {
          console.warn("Note: L'aperçu du destinataire n'a pas pu être mis à jour (Normal selon les règles)");
      });

      console.log("Suppression réussie !");
    } catch (err: any) {
      console.error("Erreur fatale:", err);
      alert("Erreur de suppression : " + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && !selectedFile) || !user) return;

    setIsProcessing(true);
    let fileData: FileData | undefined;

    if (selectedFile) {
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        
        fileData = {
          url: base64,
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size
        };
      } catch (error) {
        setIsProcessing(false);
        return;
      }
    }

    const messagesRef = ref(db, `chats/${conversation.id}/messages`);
    const newMsgRef = push(messagesRef);
    const msgId = newMsgRef.key;
    if (!msgId) return;

    const now = Date.now();
    const newMessage = {
      id: msgId,
      text: inputValue.trim() || "",
      file: fileData || null,
      senderId: user.uid,
      timestamp: now
    };

    onSendSound();

    const updates: any = {};
    const lastText = newMessage.text || (fileData ? "📁 Fichier" : "Nouveau message");
    const otherUid = conversation.participant.id;
    
    updates[`chats/${conversation.id}/messages/${msgId}`] = newMessage;
    updates[`user_chats/${user.uid}/${conversation.id}/lastMessage`] = lastText;
    updates[`user_chats/${user.uid}/${conversation.id}/timestamp`] = now;
    updates[`user_chats/${user.uid}/${conversation.id}/unreadCount`] = 0;
    updates[`user_chats/${user.uid}/${conversation.id}/participantId`] = otherUid;

    updates[`user_chats/${otherUid}/${conversation.id}/lastMessage`] = lastText;
    updates[`user_chats/${otherUid}/${conversation.id}/timestamp`] = now;
    updates[`user_chats/${otherUid}/${conversation.id}/participantId`] = user.uid;
    
    try {
        await update(ref(db), updates);
        const otherUnreadRef = ref(db, `user_chats/${otherUid}/${conversation.id}/unreadCount`);
        runTransaction(otherUnreadRef, (current) => (current || 0) + 1);

        setInputValue('');
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: any) {
        console.error("Erreur d'envoi:", e);
    } finally {
        setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-[150] bg-white dark:bg-slate-950 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-sm z-10">
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
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors text-slate-400">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/20 dark:bg-slate-900/10">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          const isBeingDeleted = isDeleting === msg.id;

          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
              <div className={`max-w-[80%] flex items-center gap-2 group relative ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                
                <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm relative ${
                  isMe ? 'bg-pink-500 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                } ${isBeingDeleted ? 'opacity-30' : ''}`}>
                  {msg.file && (
                    <div className="mb-2">
                      {msg.file.type.startsWith('image/') ? (
                        <img src={msg.file.url} className="max-w-full rounded-xl" alt="Fichier" />
                      ) : (
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${isMe ? 'bg-white/10' : 'bg-slate-50 dark:bg-slate-900'}`}>
                          <FileText className="w-8 h-8 text-pink-500" />
                          <div className="overflow-hidden min-w-[120px]">
                            <p className="text-xs font-bold truncate">{msg.file.name}</p>
                            <p className="text-[10px] opacity-60">{formatFileSize(msg.file.size)}</p>
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

                {isMe && !isBeingDeleted && (
                  <button 
                    type="button"
                    onClick={(e) => handleDeleteMessage(e, msg.id)}
                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all opacity-0 group-hover:opacity-100 z-50 cursor-pointer shadow-sm active:scale-75"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {isBeingDeleted && <Loader2 className="w-4 h-4 text-pink-500 animate-spin shrink-0" />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 pb-8">
        <div className="flex items-center gap-3">
          <input type="file" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-pink-500 transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-[1.5rem] px-5 py-1 focus-within:ring-2 focus-within:ring-pink-500/50 transition-all">
            <input 
              type="text" 
              placeholder="Écrivez votre message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full bg-transparent border-none outline-none py-3 text-sm dark:text-white font-medium"
            />
          </div>

          <button 
            onClick={handleSend}
            disabled={(!inputValue.trim() && !selectedFile) || isProcessing}
            className="w-12 h-12 flex items-center justify-center bg-pink-500 text-white rounded-2xl shadow-lg active:scale-90 transition-all disabled:opacity-30"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
