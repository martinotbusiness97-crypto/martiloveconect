
import React, { useState } from 'react';
import { ArrowLeft, Check, Star, History, Crown, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../App';

interface PaymentsViewProps {
  onBack: () => void;
}

const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0€',
    features: ['10 likes / jour', 'Filtres de base', 'Accès limité'],
    color: 'bg-slate-100 text-slate-600',
    icon: Star
  },
  {
    id: 'gold',
    name: 'Marti Gold',
    price: '9,99€',
    features: ['Likes illimités', 'Qui vous a aimé', '5 Super Likes', 'Sans pubs'],
    color: 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white',
    icon: Crown,
    highlight: true
  },
  {
    id: 'platinum',
    name: 'Marti Platinum',
    price: '19,99€',
    features: ['Tout le Gold', 'Priorité messages', 'Mode invisible', 'Rewind'],
    color: 'bg-gradient-to-br from-slate-800 to-slate-950 text-white',
    icon: ShieldCheck
  }
];

const HISTORY = [
  { id: 'h1', date: '12 Mars 2024', amount: '9.99€', status: 'Payé', plan: 'Marti Gold' },
  { id: 'h2', date: '12 Fév 2024', amount: '9.99€', status: 'Payé', plan: 'Marti Gold' }
];

const PaymentsView: React.FC<PaymentsViewProps> = ({ onBack }) => {
  const { t, playSound } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUpgrade = (planId: string) => {
    if (planId === selectedPlan) return;
    
    setIsProcessing(true);
    // Simuler un appel API de paiement
    setTimeout(() => {
      setIsProcessing(false);
      setSelectedPlan(planId);
      setShowSuccess(true);
      playSound('match');
      setTimeout(() => setShowSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-6 flex items-center gap-4 border-b border-slate-50 dark:border-slate-900 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight dark:text-white">{t('payments.title')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Gérez votre expérience premium</p>
        </div>
      </div>

      <div className="p-6 space-y-8 pb-32 overflow-y-auto">
        {/* Current Plan Card */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 px-2">{t('payments.current')}</h2>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${PLANS.find(p => p.id === selectedPlan)?.color}`}>
                {React.createElement(PLANS.find(p => p.id === selectedPlan)?.icon || Star, { className: 'w-4 h-4' })}
              </div>
              <div>
                <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{PLANS.find(p => p.id === selectedPlan)?.name}</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400">Actif</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-pink-500">{PLANS.find(p => p.id === selectedPlan)?.price}</p>
            </div>
          </div>
        </section>

        {/* Plan Selection Carousel */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 px-2">Plans Premium</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x -mx-6 px-6 no-scrollbar">
            {PLANS.map((plan) => (
              <div 
                key={plan.id}
                onClick={() => handleUpgrade(plan.id)}
                className={`snap-center min-w-[170px] p-3 rounded-[1.5rem] flex flex-col justify-between transition-all cursor-pointer relative ${
                  plan.id === selectedPlan ? 'ring-2 ring-pink-500 ring-offset-2 dark:ring-offset-slate-950' : 'opacity-90 grayscale-[0.2] hover:grayscale-0'
                } ${plan.color} ${plan.highlight ? 'shadow-lg' : ''}`}
              >
                {plan.highlight && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white text-yellow-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase shadow-sm">TOP</span>
                )}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <plan.icon className="w-5 h-5 opacity-80" />
                    <p className="text-base font-black">{plan.price}</p>
                  </div>
                  <h3 className="text-xs font-bold mb-2">{plan.name}</h3>
                  <ul className="space-y-1 mb-4">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1 text-[9px] font-medium leading-tight">
                        <Check className="w-2.5 h-2.5 opacity-70 shrink-0" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button 
                  disabled={plan.id === selectedPlan || isProcessing}
                  className={`w-full py-2 rounded-lg text-[10px] font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    plan.id === 'free' ? 'bg-white text-slate-800' : 'bg-white/20 backdrop-blur-md text-white border border-white/30'
                  }`}
                >
                  {isProcessing && plan.id !== selectedPlan ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : plan.id === selectedPlan ? (
                    'Actif'
                  ) : (
                    'Choisir'
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* History */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <History className="w-3 h-3 text-slate-400" />
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">{t('payments.history')}</h2>
          </div>
          <div className="space-y-2">
            {HISTORY.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-700">
                    <Crown className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold dark:text-slate-200">{item.plan}</p>
                    <p className="text-[9px] text-slate-400">{item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black dark:text-white">{item.amount}</p>
                  <p className="text-[8px] font-bold text-green-500 uppercase tracking-tighter">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-6 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="w-12 h-12 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center mb-3">
               <CheckCircle2 className="w-8 h-8 text-green-500" />
             </div>
             <h2 className="text-lg font-black mb-1 dark:text-white">Bienvenue !</h2>
             <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed mb-5 px-4">
               Abonnement actif. Profitez des fonctionnalités premium !
             </p>
             <button 
               onClick={() => setShowSuccess(false)}
               className="w-full py-2.5 bg-slate-900 dark:bg-pink-500 text-white rounded-lg text-xs font-bold shadow-xl transition-all active:scale-95"
             >
               Génial !
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsView;
