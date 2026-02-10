
import React, { useState, useRef, useMemo } from 'react';
import { 
  Heart, Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff, 
  Camera, MapPin, Target, Sparkles, Check, Chrome, Phone, Loader2, AlertCircle
} from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { ref as dbRef, set, get } from 'firebase/database';

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
    setError(null);
  };

  const isStepValid = useMemo(() => {
    switch(step) {
      case 1: 
        if (mode === 'login') return formData.email.includes('@') && formData.password.length >= 6;
        return true; // Étape de choix Google/Email
      case 2: return formData.name.trim().length >= 2 && parseInt(formData.age) >= 18 && parseInt(formData.age) <= 99;
      case 3: return !!formData.gender && !!formData.seeking;
      case 4: return formData.city.trim().length >= 2 && formData.country.trim().length >= 2;
      case 5: return !!formData.photo;
      case 6: return formData.interests.length >= 1;
      case 7: return !!formData.goal;
      case 8: return formData.bio.trim().length >= 10;
      default: return false;
    }
  }, [step, formData, mode]);

  const nextStep = () => {
    if (isStepValid) {
      setStep(s => s + 1);
    } else {
      setError("Veuillez remplir tous les champs obligatoires avant de continuer.");
    }
  };
  
  const prevStep = () => setStep(s => s - 1);

  const handleGoogleAction = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userSnap = await get(dbRef(db, `users/${user.uid}`));
      
      if (!userSnap.exists() || !userSnap.val().isComplete) {
        setMode('register');
        setStep(2);
        updateForm({ 
          email: user.email || '', 
          name: formData.name || user.displayName || '',
          photo: formData.photo || user.photoURL || ''
        });
        setIsLoading(false);
      } else {
        // Redirection gérée par App.tsx
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("L'image est trop lourde (max 2Mo)");
        return;
      }
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
    if (!isStepValid) {
      setError("Certains champs requis sont manquants.");
      return;
    }

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
        let user = auth.currentUser;
        
        if (!user) {
          const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
          user = userCredential.user;
        }

        if (user) {
          await set(dbRef(db, `users/${user.uid}`), {
            id: user.uid,
            name: formData.name,
            age: parseInt(formData.age),
            email: formData.email,
            gender: formData.gender,
            seeking: formData.seeking,
            location: formData.city,
            country: formData.country,
            imageUrl: formData.photo,
            interests: formData.interests,
            goal: formData.goal,
            bio: formData.bio,
            interest: formData.interests[0],
            religion: 'Non spécifié',
            isComplete: true,
            settings: {
              isPublic: true,
              incognitoMode: false,
              notifications: true
            }
          });
        }
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
              <h2 className="text-2xl font-black text-white">Prêt pour l'amour ?</h2>
              <p className="text-slate-400 text-sm">MartiLoveconect : l'inscription est obligatoire et gratuite.</p>
            </header>
            <div className="space-y-3">
              <button 
                type="button"
                onClick={handleGoogleAction}
                className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 rounded-2xl py-4 font-bold text-sm hover:bg-slate-100 transition-all active:scale-95 shadow-xl shadow-white/5"
              >
                <Chrome className="w-5 h-5 text-blue-500" />
                S'inscrire avec Google
              </button>
              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                <span className="relative bg-slate-950/50 backdrop-blur-xl px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ou Classique</span>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="email" required value={formData.email}
                    onChange={(e) => updateForm({ email: e.target.value })}
                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm text-white outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
                    placeholder="Votre adresse email"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type={showPassword ? 'text' : 'password'} required value={formData.password}
                    onChange={(e) => updateForm({ password: e.target.value })}
                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-sm text-white outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
                    placeholder="Choisir un mot de passe"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <header className="mb-8"><h2 className="text-2xl font-black text-white">Présentations</h2></header>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Prénom réel *</label>
                <input type="text" placeholder="Comment t'appelles-tu ?" value={formData.name} onChange={e => updateForm({name: e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-pink-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Âge (18-99) *</label>
                <input type="number" min="18" max="99" placeholder="Ton âge" value={formData.age} onChange={e => updateForm({age: e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-pink-500" />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8 animate-in slide-in-from-right duration-300">
            <header><h2 className="text-2xl font-black text-white">Identité</h2></header>
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase ml-2">Je suis un(e) : *</p>
                <div className="grid grid-cols-3 gap-2">
                  {['Homme', 'Femme', 'Autre'].map(g => (
                    <button key={g} type="button" onClick={() => updateForm({ gender: g })} className={`py-4 rounded-xl text-xs font-bold transition-all ${formData.gender === g ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'bg-slate-900 text-slate-400 border border-white/5'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase ml-2">Je cherche : *</p>
                <div className="grid grid-cols-3 gap-2">
                  {['Hommes', 'Femmes', 'Tous'].map(s => (
                    <button key={s} type="button" onClick={() => updateForm({ seeking: s })} className={`py-4 rounded-xl text-xs font-bold transition-all ${formData.seeking === s ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'bg-slate-900 text-slate-400 border border-white/5'}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <header><h2 className="text-2xl font-black text-white">Localisation</h2></header>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Ville *</label>
                <input type="text" placeholder="Où habites-tu ?" value={formData.city} onChange={e => updateForm({city: e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-pink-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Pays *</label>
                <input type="text" placeholder="Ton pays" value={formData.country} onChange={e => updateForm({country: e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-pink-500" />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <header className="text-center"><h2 className="text-2xl font-black text-white">Photo de profil</h2></header>
            <div 
              onClick={() => fileInputRef.current?.click()} 
              className={`w-56 h-72 mx-auto rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer relative overflow-hidden transition-all ${formData.photo ? 'border-pink-500' : 'border-white/10 bg-slate-900'}`}
            >
              {formData.photo ? (
                <img src={formData.photo} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Camera className="w-10 h-10 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Obligatoire</span>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
            </div>
            <p className="text-[10px] text-center text-slate-500 font-medium">Uploadez une photo réelle pour attirer plus de matchs.</p>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <header><h2 className="text-2xl font-black text-white">Passions (min. 1) *</h2></header>
            <div className="flex flex-wrap gap-2 max-h-[45vh] overflow-y-auto no-scrollbar pb-4">
              {INTEREST_OPTIONS.map(interest => (
                <button key={interest} type="button" onClick={() => toggleInterest(interest)} className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${formData.interests.includes(interest) ? 'bg-pink-500 text-white border-pink-500' : 'bg-slate-900 text-slate-400 border-white/5'}`}>{interest}</button>
              ))}
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <header><h2 className="text-2xl font-black text-white">Intention *</h2></header>
            <div className="space-y-3">
              {GOAL_OPTIONS.map(goal => (
                <button 
                  key={goal.id} 
                  type="button" 
                  onClick={() => updateForm({ goal: goal.id })} 
                  className={`w-full p-6 rounded-2xl flex items-center gap-4 border transition-all ${formData.goal === goal.id ? 'bg-pink-500/10 border-pink-500 scale-[1.02]' : 'bg-slate-900 border-white/5 text-slate-400'}`}
                >
                  <div className={`p-2 rounded-xl ${formData.goal === goal.id ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-500'}`}><goal.icon className="w-5 h-5" /></div>
                  <span className="font-bold text-sm">{goal.label}</span>
                  {formData.goal === goal.id && <Check className="w-5 h-5 text-pink-500 ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <header><h2 className="text-2xl font-black text-white">Ta Bio *</h2></header>
            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Parle-nous un peu de toi. Un minimum de 10 caractères est requis pour valider ton profil.</p>
              <textarea 
                value={formData.bio} 
                onChange={e => updateForm({bio: e.target.value})} 
                className={`w-full bg-slate-900/50 border rounded-[2rem] p-6 text-white outline-none min-h-[180px] resize-none transition-all focus:ring-2 focus:ring-pink-500 ${formData.bio.length >= 10 ? 'border-pink-500/50' : 'border-white/5'}`} 
                placeholder="Décris ta personnalité, ce que tu aimes..." 
              />
              <div className="text-right text-[10px] font-bold text-slate-500">{formData.bio.length} caractères</div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-pink-600/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[150px] rounded-full" />
      
      <div className="w-full max-w-md z-10">
        <div className="flex items-center justify-center mb-8 gap-2">
          <Heart className="w-8 h-8 text-pink-500 fill-current" />
          <h1 className="text-2xl font-black text-white tracking-tighter">MartiLoveconect</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-in shake duration-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {mode === 'login' ? (
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
            <div className="flex p-1 bg-slate-900/50 rounded-2xl mb-8">
              <button onClick={() => setMode('login')} className="flex-1 py-3 text-xs font-black rounded-xl bg-white text-slate-950 shadow-sm transition-all">Connexion</button>
              <button onClick={() => { setMode('register'); setStep(1); }} className="flex-1 py-3 text-xs font-black rounded-xl text-slate-500 hover:text-white transition-all">Inscription</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="email" required placeholder="Email" value={formData.email} onChange={e => updateForm({email:e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-pink-500/50" />
              <input type="password" required placeholder="Mot de passe" value={formData.password} onChange={e => updateForm({password:e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-pink-500/50" />
              <button type="submit" disabled={isLoading || !isStepValid} className="w-full bg-pink-500 text-white rounded-2xl py-4 font-black flex items-center justify-center shadow-lg shadow-pink-500/20 disabled:opacity-30 active:scale-95 transition-all">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Accéder à Marti'}
              </button>
              <button type="button" onClick={handleGoogleAction} className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 rounded-2xl py-4 font-black text-sm active:scale-95 transition-all"><Chrome className="w-5 h-5 text-blue-500" /> Google</button>
            </form>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[3rem] relative shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-900 rounded-t-[3rem] overflow-hidden">
              <div className="h-full bg-pink-500 transition-all duration-500" style={{ width: `${(step / 8) * 100}%` }} />
            </div>
            
            <div className="flex items-center justify-between mb-6">
              {step > 1 ? (
                <button onClick={prevStep} className="p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white transition-all"><ArrowLeft className="w-5 h-5" /></button>
              ) : (
                <button onClick={() => setMode('login')} className="text-xs font-black text-slate-500 uppercase tracking-widest">Retour</button>
              )}
              <span className="text-[10px] font-black text-pink-500 bg-pink-500/10 px-3 py-1 rounded-full uppercase tracking-tighter">Étape {step} / 8</span>
            </div>

            {renderStep()}

            <button 
              onClick={handleSubmit} 
              disabled={isLoading || !isStepValid} 
              className={`w-full mt-10 rounded-2xl py-5 font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl ${isStepValid ? 'bg-pink-500 text-white shadow-pink-500/20' : 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-50'}`}
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  {step === 8 ? 'Valider mon profil' : 'Continuer'} 
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthView;
