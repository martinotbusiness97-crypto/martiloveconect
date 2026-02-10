
import React, { useState } from 'react';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { auth } from '../firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

interface ChangePasswordViewProps {
  onBack: () => void;
}

const ChangePasswordView: React.FC<ChangePasswordViewProps> = ({ onBack }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setErrorMessage('Les nouveaux mots de passe ne correspondent pas.');
      setStatus('error');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      setStatus('error');
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) return;

    setIsSubmitting(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      // 1. Re-authentification (nécessaire pour changer le MDP)
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Mise à jour du mot de passe
      await updatePassword(user, newPassword);
      
      setStatus('success');
      setTimeout(() => onBack(), 2000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      if (err.code === 'auth/wrong-password') {
        setErrorMessage('Le mot de passe actuel est incorrect.');
      } else {
        setErrorMessage('Erreur : ' + err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 animate-in slide-in-from-right duration-300">
      <div className="p-6 flex items-center gap-4 border-b border-slate-50 dark:border-slate-900 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight dark:text-white">Mot de passe</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sécurisez votre compte Aura</p>
        </div>
      </div>

      <div className="flex-1 p-6">
        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">Mot de passe modifié !</h2>
            <p className="text-slate-500 dark:text-slate-400 text-center">Votre compte est désormais encore plus sécurisé.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 max-w-md mx-auto mt-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Mot de passe actuel</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent rounded-[1.5rem] focus:bg-white dark:focus:bg-slate-800 focus:border-pink-500 transition-all outline-none text-slate-700 dark:text-white font-medium"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-900 mx-4" />

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Nouveau mot de passe</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent rounded-[1.5rem] focus:bg-white dark:focus:bg-slate-800 focus:border-pink-500 transition-all outline-none text-slate-700 dark:text-white font-medium"
                    placeholder="Minimum 6 caractères"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Confirmer le mot de passe</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent rounded-[1.5rem] focus:bg-white dark:focus:bg-slate-800 focus:border-pink-500 transition-all outline-none text-slate-700 dark:text-white font-medium"
                    placeholder="Répétez le nouveau"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {status === 'error' && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900 rounded-2xl flex items-center gap-3 animate-in shake duration-300">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <p className="text-xs font-bold text-rose-700 dark:text-rose-300">{errorMessage}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
              className="w-full py-4 bg-slate-900 dark:bg-pink-500 text-white rounded-[1.5rem] font-bold shadow-xl shadow-slate-200 dark:shadow-none hover:bg-slate-800 dark:hover:bg-pink-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Mettre à jour le mot de passe'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordView;
