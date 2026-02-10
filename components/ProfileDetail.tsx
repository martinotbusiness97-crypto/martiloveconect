
import React, { useState } from 'react';
import { Profile } from '../types';
import { X, Heart, MapPin, Info, ArrowLeft, Globe, Star, MessageCircle, Send, Loader2, User } from 'lucide-react';
import { useTranslation } from '../App';

interface ProfileDetailProps {
  profile: Profile;
  onClose: () => void;
  onLike?: (id: string) => void;
  onPass?: (id: string) => void;
}

const ProfileDetail: React.FC<ProfileDetailProps> = ({ profile, onClose, onLike, onPass }) => {
  const { startConversation } = useTranslation();
  const [showQuickChat, setShowQuickChat] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [imageError, setImageError] = useState(false);

  const showActions = onLike && onPass;
  const defaultAvatar = "https://images.unsplash.com/photo-1535711761886-2522ada467ad?auto=format&fit=crop&q=80&w=400";

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    try {
      await startConversation(profile);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const name = profile.name || "Utilisateur";
  const age = profile.age || "";
  const location = profile.location || profile.city || "Quelque part";
  const country = profile.country || "Monde";
  const religion = profile.religion || "Non spécifié";
  const interest = profile.interest || "Les rencontres";
  const bio = profile.bio || `Passionné(e) par ${interest.toLowerCase()}, j'aime découvrir de nouveaux horizons et partager des moments authentiques.`;

  return (
    <div className="fixed inset-0 z-[300] bg-white dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Top Header/Action Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
        <button 
          onClick={onClose}
          className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors shadow-lg"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Image Section */}
        <div className="relative h-[65vh] w-full bg-slate-200 dark:bg-slate-900 flex items-center justify-center">
          {!imageError ? (
            <img 
              src={profile.imageUrl || defaultAvatar} 
              alt={name} 
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <User className="w-20 h-20 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest opacity-40">Photo non disponible</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <h1 className="text-4xl font-black tracking-tight">{name}{age ? `, ${age}` : ''}</h1>
            <div className="flex items-center gap-2 mt-2 opacity-90">
              <MapPin className="w-4 h-4 text-pink-500" />
              <span className="text-lg font-semibold">{location}, {country}</span>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-8 space-y-10">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-300 text-sm font-bold shadow-sm">
              <Globe className="w-4 h-4 text-pink-500" />
              {country}
            </div>
            <div className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-300 text-sm font-bold shadow-sm">
              <Star className="w-4 h-4 text-pink-500" />
              {religion}
            </div>
          </div>

          <section>
            <div className="flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
              <Info className="w-5 h-5 text-pink-500" />
              <h2 className="text-xl font-extrabold">À propos</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              {bio}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-4 text-slate-900 dark:text-white">Centres d'intérêt</h2>
            <div className="flex flex-wrap gap-3">
              <span className="px-5 py-2.5 bg-pink-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-pink-200 dark:shadow-none">
                {interest}
              </span>
              {(profile.interests || []).map(item => (
                item !== interest && (
                  <span key={item} className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl text-sm font-bold border border-slate-100 dark:border-slate-800">
                    {item}
                  </span>
                )
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Quick Chat Overlay */}
      {showQuickChat && (
        <div className="fixed inset-0 z-[310] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Message pour {name}</h3>
              <button onClick={() => setShowQuickChat(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <textarea 
              autoFocus
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border-none outline-none text-sm dark:text-white resize-none min-h-[120px] mb-6 font-medium"
              placeholder="Écrivez quelque chose d'inspirant..."
            />
            <button 
              onClick={handleSendMessage}
              disabled={!message.trim() || isSending}
              className="w-full py-5 bg-pink-500 text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-pink-200 dark:shadow-none disabled:opacity-50 active:scale-95 transition-all"
            >
              {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              Envoyer
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && !showQuickChat && (
        <div className="fixed bottom-10 left-0 right-0 flex items-center justify-center gap-6 px-6 z-20">
          <button 
            onClick={() => { onPass?.(profile.id); onClose(); }}
            className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-2xl border border-slate-100 dark:border-slate-800 text-rose-500 hover:scale-110 active:scale-90 transition-all"
          >
            <X className="w-8 h-8 stroke-[3px]" />
          </button>
          
          <button 
            onClick={() => setShowQuickChat(true)}
            className="w-20 h-20 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-2xl border border-slate-100 dark:border-slate-800 text-pink-500 hover:scale-110 active:scale-90 transition-all"
          >
            <MessageCircle className="w-10 h-10 fill-current" />
          </button>

          <button 
            onClick={() => { onLike?.(profile.id); onClose(); }}
            className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center shadow-2xl shadow-pink-200 dark:shadow-none text-white hover:scale-110 active:scale-90 transition-all"
          >
            <Heart className="w-8 h-8 fill-current" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDetail;
