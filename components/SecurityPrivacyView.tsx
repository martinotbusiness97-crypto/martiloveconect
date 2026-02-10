
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, EyeOff, Lock, UserX, Trash2, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import { AppTab } from '../types';
import { useTranslation } from '../App';
import { db, auth } from '../firebase';
import { ref, update, remove } from 'firebase/database';
import { deleteUser } from 'firebase/auth';

interface SecurityPrivacyViewProps {
  onBack: () => void;
  onNavigate: (tab: AppTab) => void;
}

const SecurityPrivacyView: React.FC<SecurityPrivacyViewProps> = ({ onBack, onNavigate }) => {
  const { user, profile } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Synchronisation des réglages avec Firebase
  const updateSetting = async (key: string, value: any) => {
    if (!user) return;
    try {
      const updates: any = {};
      updates[`users/${user.uid}/settings/${key}`] = value;
      await update(ref(db), updates);
    } catch (err) {
      console.error("Erreur mise à jour réglage:", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser || !user) return;
    setIsDeleting(true);
    try {
      // 1. Supprimer les données de la base de données
      const paths = [
        `users/${user.uid}`,
        `user_chats/${user.uid}`,
        `likes/${user.uid}`,
        `user_actions/${user.uid}`
      ];
      
      for (const path of paths) {
        await remove(ref(db, path));
      }

      // 2. Supprimer l'utilisateur de Firebase Auth
      await deleteUser(auth.currentUser);
      window.location.reload(); // Rediriger vers l'accueil/auth
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        alert("Pour supprimer votre compte, vous devez vous reconnecter récemment. Veuillez vous déconnecter et vous reconnecter.");
      } else {
        alert("Erreur lors de la suppression : " + err.message);
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const isPublic = profile?.settings?.isPublic !== false; // Par défaut true
  const incognitoMode = profile?.settings?.incognitoMode === true; // Par défaut false

  const sections = [
    {
      title: 'Confidentialité',
      items: [
        {
          id: 'isPublic',
          icon: Shield,
          label: 'Profil Public',
          desc: 'Permettre aux autres de découvrir votre profil.',
          type: 'toggle',
          value: isPublic,
          onChange: (val: boolean) => updateSetting('isPublic', val)
        },
        {
          id: 'incognitoMode',
          icon: EyeOff,
          label: 'Mode Invisible',
          desc: 'Seulement les personnes que vous avez likées peuvent vous voir.',
          type: 'toggle',
          value: incognitoMode,
          onChange: (val: boolean) => updateSetting('incognitoMode', val),
          isPremium: true
        },
        {
          id: 'blocked',
          icon: UserX,
          label: 'Contacts bloqués',
          desc: 'Gérer la liste des personnes que vous avez bloquées.',
          type: 'link',
          onClick: () => onNavigate('blocked')
        }
      ]
    },
    {
      title: 'Sécurité du compte',
      items: [
        {
          id: 'password',
          icon: Lock,
          label: 'Changer le mot de passe',
          desc: 'Sécurisez votre accès avec un nouveau mot de passe.',
          type: 'link',
          onClick: () => onNavigate('change-password')
        },
        {
          id: 'delete',
          icon: Trash2,
          label: 'Supprimer mon compte',
          desc: 'Cette action est irréversible et supprimera toutes vos données.',
          type: 'action',
          color: 'text-rose-500',
          onClick: () => setShowDeleteModal(true)
        }
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 animate-in slide-in-from-right duration-300">
      <div className="p-6 flex items-center gap-4 border-b border-slate-50 dark:border-slate-900 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight dark:text-white">Sécurité</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Gérez votre compte et vos données</p>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-10">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 px-2">{section.title}</h2>
            <div className="space-y-2">
              {section.items.map((item) => (
                <div 
                  key={item.id}
                  onClick={item.type === 'toggle' ? () => item.onChange?.(!item.value) : item.onClick}
                  className={`flex items-start gap-4 p-4 rounded-3xl transition-all ${
                    item.type === 'toggle' ? 'bg-slate-50/50 dark:bg-slate-900/50' : 'hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <div className={`p-3 rounded-2xl ${item.color?.includes('rose') ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700'}`}>
                    <item.icon className={`w-5 h-5 ${item.color || 'text-slate-600 dark:text-slate-400'}`} />
                  </div>
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${item.color || 'text-slate-800 dark:text-slate-200'}`}>{item.label}</span>
                      {item.isPremium && (
                        <span className="text-[8px] font-black uppercase bg-gradient-to-r from-pink-500 to-rose-400 text-white px-1.5 py-0.5 rounded">Gold</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                  {item.type === 'toggle' && (
                    <div 
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 flex items-center px-1 ${
                        item.value ? 'bg-pink-500' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <div 
                        className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                          item.value ? 'translate-x-6' : 'translate-x-0'
                        }`} 
                      />
                    </div>
                  )}
                  {item.type === 'link' && <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 self-center" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-3">Supprimer le compte ?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm leading-relaxed mb-8">
              Toutes vos conversations, matches et photos seront définitivement supprimés. Cette action ne peut pas être annulée.
            </p>
            <div className="space-y-3">
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 dark:shadow-none hover:bg-rose-600 transition-colors flex items-center justify-center"
              >
                {isDeleting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Oui, supprimer'}
              </button>
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityPrivacyView;
