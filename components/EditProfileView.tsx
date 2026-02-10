
import React, { useState, useRef } from 'react';
import { ArrowLeft, Camera, Check, Loader2 } from 'lucide-react';
import { useTranslation } from '../App';
import { db } from '../firebase';
import { ref as dbRef, set } from 'firebase/database';

interface EditProfileViewProps {
  onBack: () => void;
}

const ALL_INTEREST_SUGGESTIONS = [
  "Photographie", "Voyages", "Cuisine", "Cinéma", "Sport", "Musique", 
  "Lecture", "Art", "Danse", "Gaming", "Nature", "Yoga", "Séries TV", 
  "Randonnée", "Animaux", "Technologie", "Mode", "Théâtre", "Vin", "Café"
];

const EditProfileView: React.FC<EditProfileViewProps> = ({ onBack }) => {
  const { user, profile } = useTranslation();
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [interests, setInterests] = useState<string[]>(profile?.interests || []);
  const [imageUrl, setImageUrl] = useState(profile?.imageUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await set(dbRef(db, `users/${user.uid}`), {
        ...profile,
        name,
        bio,
        interests,
        imageUrl,
        interest: interests[0] || profile?.interest || 'Général'
      });
      onBack();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      setImageUrl(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(prev => prev.filter(i => i !== interest));
    } else if (interests.length < 10) {
      setInterests(prev => [...prev, interest]);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 animate-in slide-in-from-right duration-300">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      <div className="p-6 flex items-center justify-between border-b border-slate-50 dark:border-slate-900 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight dark:text-white">Modifier le profil</h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-pink-500 text-white p-2.5 rounded-full shadow-lg hover:bg-pink-600 disabled:opacity-50 active:scale-95"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
        </button>
      </div>

      <div className="p-6 space-y-8 pb-32">
        <section className="flex flex-col items-center">
          <div className="relative group">
            <img src={imageUrl || "https://images.unsplash.com/photo-1535711761886-2522ada467ad?auto=format&fit=crop&q=80&w=400"} className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-xl" />
            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-3 bg-pink-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform">
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-2">Prénom réel</label>
            <input 
              type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none text-slate-800 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-2">Ma bio réelle</label>
            <textarea 
              rows={4} value={bio} onChange={e => setBio(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none text-slate-800 dark:text-white resize-none"
              placeholder="Dis quelque chose de vrai sur toi..."
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 px-2">Mes Intérêts ({interests.length}/10)</h2>
          <div className="flex flex-wrap gap-2">
            {ALL_INTEREST_SUGGESTIONS.map(s => (
              <button 
                key={s} onClick={() => toggleInterest(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${interests.includes(s) ? 'bg-pink-500 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default EditProfileView;
