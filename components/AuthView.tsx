
import React, { useState, useRef } from 'react';
import { 
  Heart, Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff, 
  Camera, MapPin, Target, Sparkles, Check, Chrome, Phone
} from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { ref as dbRef, set } from 'firebase/database';

interface AuthViewProps {
  onLogin: (userData: any) => void;
}

const INTEREST_OPTIONS = [
  "Photographie", "Voyages", "Cuisine", "Cinéma", "Sport", "Musique", 
  "Lecture", "Art", "Danse", "Gaming", "Nature", "Yoga", "Séries TV", 
  "Randonnée", "Animaux", "Technologie", "Mode", "Théâtre", "Vin", "Café"
];

const GOAL_OPTIONS = [
  { id: 'long_term', label: 'Relation sérieuse', icon: Heart },
  { id: 'casual', label: 'On verra bien', icon: Sparkles },
  { id: 'friends', label: 'Se faire des amis', icon: User },
];

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    gender: '',
    seeking: '',
    city: '',
    country: '',
    photo: '',
    interests: [] as string[],
    goal: '',
    bio: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateForm = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleGoogleAction = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => updateForm({ photo: event.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const toggleInterest = (interest: string) => {
    const current = [...formData.interests];
    if (current.includes(interest)) {
      updateForm({ interests: current.filter(i => i !== interest) });
    } else if (current.length < 5) {
      updateForm({ interests: [...current, interest] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && step < 8) {
      nextStep();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        await set(dbRef(db, `users/${user.uid}`), {
          id: user.uid,
          name: formData.name,
          age: parseInt(formData.age),
          email: formData.email,
          gender: formData.gender,
          seeking: formData.seeking,
          location: formData.city,
          country: formData.country,
          imageUrl: formData.photo || 'https://images.unsplash.com/photo-1535711761886-2522ada467ad?auto=format&fit=crop&q=80&w=400',
          interests: formData.interests,
          goal: formData.goal,
          bio: formData.bio,
          interest: formData.interests[0] || 'Général',
          religion: 'Non spécifié'
        });
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <header className="mb-6">
              <h2 className="text-2xl font-black text-white">Rejoins l'aventure</h2>
              <p className="text-slate-400 text-sm">Choisis ta méthode préférée</p>
            </header>
            <div className="space-y-3">
              <button 
                type="button"
                onClick={handleGoogleAction}
                className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 rounded-2xl py-4 font-bold text-sm hover:bg-slate-100 transition-all active:scale-95 shadow-xl shadow-white/5"
              >
                <Chrome className="w-5 h-5 text-blue-500" />
                Continuer avec Google
              </button>
              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                <span className="relative bg-slate-950/50 backdrop-blur-xl px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ou Email</span>
              </div>
              <div className="space-y-4">
                <input 
                  type="email" required value={formData.email}
                  onChange={(e) => updateForm({ email: e.target.value })}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white outline-none focus:ring-2 focus:ring-pink-500/50"
                  placeholder="ton@email.com"
                />
                <input 
                  type={showPassword ? 'text' : 'password'} required value={formData.password}
                  onChange={(e) => updateForm({ password: e.target.value })}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white outline-none focus:ring-2 focus:ring-pink-500/50"
                  placeholder="Mot de passe"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <header className="mb-8"><h2 className="text-2xl font-black text-white">Qui es-tu ?</h2></header>
            <div className="space-y-4">
              <input type="text" placeholder="Prénom" value={formData.name} onChange={e => updateForm({name: e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none" />
              <input type="number" placeholder="Âge" value={formData.age} onChange={e => updateForm({age: e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none" />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8 animate-in slide-in-from-right duration-300">
            <header><h2 className="text-2xl font-black text-white">Identité</h2></header>
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-2">
                {['Homme', 'Femme', 'Autre'].map(g => (
                  <button key={g} type="button" onClick={() => updateForm({ gender: g })} className={`py-3 rounded-xl text-xs font-bold ${formData.gender === g ? 'bg-pink-500 text-white' : 'bg-slate-900 text-slate-400'}`}>{g}</button>
                ))}
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase">Je recherche :</p>
              <div className="grid grid-cols-3 gap-2">
                {['Hommes', 'Femmes', 'Tous'].map(s => (
                  <button key={s} type="button" onClick={() => updateForm({ seeking: s })} className={`py-3 rounded-xl text-xs font-bold ${formData.seeking === s ? 'bg-violet-500 text-white' : 'bg-slate-900 text-slate-400'}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <header><h2 className="text-2xl font-black text-white">Où es-tu ?</h2></header>
            <input type="text" placeholder="Ville" value={formData.city} onChange={e => updateForm({city: e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none mb-4" />
            <input type="text" placeholder="Pays" value={formData.country} onChange={e => updateForm({country: e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none" />
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <header className="text-center"><h2 className="text-2xl font-black text-white">Ta photo</h2></header>
            <div onClick={() => fileInputRef.current?.click()} className="w-56 h-72 mx-auto bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden shadow-2xl shadow-pink-500/5">
              {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-slate-400" />}
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <header><h2 className="text-2xl font-black text-white">Centres d'intérêt</h2></header>
            <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto no-scrollbar">
              {INTEREST_OPTIONS.map(interest => (
                <button key={interest} type="button" onClick={() => toggleInterest(interest)} className={`px-4 py-2 rounded-full text-xs font-bold ${formData.interests.includes(interest) ? 'bg-pink-500 text-white' : 'bg-slate-900 text-slate-400 border border-white/5'}`}>{interest}</button>
              ))}
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <header><h2 className="text-2xl font-black text-white">Ton intention ?</h2></header>
            <div className="space-y-3">
              {GOAL_OPTIONS.map(goal => (
                <button key={goal.id} type="button" onClick={() => updateForm({ goal: goal.id })} className={`w-full p-5 rounded-2xl flex items-center gap-4 border ${formData.goal === goal.id ? 'bg-pink-500/10 border-pink-500' : 'bg-slate-900 border-white/5 text-slate-400'}`}>
                  <goal.icon className="w-5 h-5" /> <span className="font-bold text-sm">{goal.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <header><h2 className="text-2xl font-black text-white">Ta bio</h2></header>
            <textarea value={formData.bio} onChange={e => updateForm({bio: e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 text-white outline-none min-h-[150px] resize-none" placeholder="Décris-toi..." />
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-600/10 blur-[120px] rounded-full animate-pulse" />
      <div className="w-full max-w-md z-10">
        {error && <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/50 rounded-2xl text-rose-500 text-xs font-bold">{error}</div>}
        {mode === 'login' ? (
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
            <div className="flex p-1 bg-slate-900/50 rounded-2xl mb-8">
              <button onClick={() => setMode('login')} className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-white text-slate-950">Connexion</button>
              <button onClick={() => setMode('register')} className="flex-1 py-2.5 text-xs font-bold rounded-xl text-slate-400">Inscription</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="email" required placeholder="Email" value={formData.email} onChange={e => updateForm({email:e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none" />
              <input type="password" required placeholder="Mot de passe" value={formData.password} onChange={e => updateForm({password:e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none" />
              <button type="submit" disabled={isLoading} className="w-full bg-pink-500 text-white rounded-2xl py-4 font-bold flex items-center justify-center">{isLoading ? 'Chargement...' : 'Se connecter'}</button>
              <button type="button" onClick={handleGoogleAction} className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 rounded-2xl py-4 font-bold text-sm"><Chrome className="w-5 h-5 text-blue-500" /> Google</button>
            </form>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[3rem] relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-900 rounded-t-[3rem] overflow-hidden">
              <div className="h-full bg-pink-500 transition-all" style={{ width: `${(step / 8) * 100}%` }} />
            </div>
            {step > 1 && <button onClick={prevStep} className="mb-4 text-slate-400"><ArrowLeft className="w-5 h-5" /></button>}
            {renderStep()}
            <button onClick={handleSubmit} disabled={isLoading} className="w-full mt-10 bg-pink-500 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2">
              {isLoading ? '...' : (step === 8 ? 'Terminer' : 'Continuer')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthView;
