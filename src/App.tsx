/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, 
  Flame, 
  Plus, 
  LogOut,
  BarChart3,
  Calendar,
  Activity,
  Trophy,
  Zap
} from 'lucide-react';
import { auth, signInWithGoogle } from './lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { workoutService } from './services/workoutService';
import { UserProfile } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayReps, setTodayReps] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [weight, setWeight] = useState<number>(0);
  const [reps, setReps] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);
  const [isChangingWeight, setIsChangingWeight] = useState(false);
  const [activeTab, setActiveTab] = useState<'track' | 'stats'>('track');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const p = await workoutService.getUserProfile(u.uid);
        if (p) {
          setProfile(p);
          setWeight(p.lastWeight);
          refreshStats(u.uid, p.lastWeight);
        } else {
          const newP = await workoutService.createUserProfile(u.uid);
          setProfile(newP);
          setWeight(newP.lastWeight);
          refreshStats(u.uid, newP.lastWeight);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user && weight > 0) {
      workoutService.getTodayTotalReps(user.uid, weight).then(setTodayReps);
    }
  }, [weight, user]);

  const refreshStats = async (uid: string, currentWeight: number) => {
    const [tReps, s] = await Promise.all([
      workoutService.getTodayTotalReps(uid, currentWeight),
      workoutService.getStats(uid)
    ]);
    setTodayReps(tReps);
    setStats(s);
  };

  const handleAddSet = async (repCount?: number) => {
    const finalReps = repCount || reps;
    if (!user || finalReps <= 0 || weight <= 0) return;
    setIsAdding(true);
    try {
      await workoutService.addSet(user.uid, weight, finalReps);
      const p = await workoutService.getUserProfile(user.uid);
      setProfile(p);
      await refreshStats(user.uid, weight);
      if (!repCount) setReps(0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050505]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Dumbbell className="w-8 h-8 text-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="h-screen flex flex-col items-center justify-center p-6 bg-[#050505] overflow-hidden relative">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm space-y-12 text-center relative z-10"
        >
          <div className="space-y-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-cyan-500/20 ring-1 ring-white/10">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 uppercase italic">
                BPress Pro
              </h1>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.3em]">Hardware for Bench</p>
            </div>
          </div>
          
          <button 
            onClick={signInWithGoogle}
            className="w-full py-5 bg-white text-black rounded-[2rem] flex items-center justify-center gap-3 font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
            Login with Google
          </button>
        </motion.div>
      </main>
    );
  }

  const levelInfo = workoutService.calculateLevel(profile?.totalXp || 0);

  return (
    <div className="h-screen bg-[#050505] text-slate-100 font-sans selection:bg-cyan-500/30 overflow-hidden relative flex flex-col">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header with Leveling */}
      <header className="px-6 pt-8 pb-4 relative z-10 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
               <span className="text-white font-black text-sm">{levelInfo.level}</span>
             </div>
             <div>
               <h1 className="text-lg font-black tracking-tight text-white leading-none uppercase italic">Level {levelInfo.level}</h1>
               <div className="flex items-center gap-2 mt-1">
                 <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)]" 
                    style={{ width: `${levelInfo.progress}%` }}
                   />
                 </div>
                 <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{Math.round(profile?.totalXp || 0)} XP</span>
               </div>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-slate-900/50 border border-slate-800 px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2">
              <Flame className={cn("w-3 h-3 transition-colors", profile?.currentStreak ? "text-orange-500 fill-orange-500" : "text-slate-700")} />
              <span className="text-xs font-black text-orange-500">{profile?.currentStreak || 0}</span>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800 shadow-inner max-w-sm mx-auto w-full">
          <button 
            onClick={() => setActiveTab('track')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === 'track' ? "bg-white text-black shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Activity className="w-4 h-4" /> Trening
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === 'stats' ? "bg-white text-black shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <BarChart3 className="w-4 h-4" /> Statystyki
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative z-10 flex flex-col justify-center items-center px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'track' ? (
            <motion.div 
              key="track"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm flex flex-col items-center gap-10"
            >
              {/* Today's Display */}
              <div className="text-center">
                <span className="text-cyan-400 font-bold text-[10px] uppercase tracking-[0.4em] block mb-2">Today Total</span>
                <div className="flex items-baseline justify-center gap-4">
                  <span className="text-9xl font-black tracking-tighter leading-none">{todayReps}</span>
                  <div className="flex flex-col items-start translate-y-[-10px]">
                    <span className="text-2xl text-slate-500 font-black uppercase">Reps</span>
                    <span className="text-sm font-bold text-cyan-500/80">{(todayReps * weight).toLocaleString()} KG</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="w-full space-y-8">
                <div className="text-center group">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-slate-500 uppercase text-[10px] font-bold tracking-widest">Weight:</span>
                    {isChangingWeight ? (
                      <input 
                        autoFocus
                        type="number"
                        value={weight || ''}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        onBlur={() => setIsChangingWeight(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsChangingWeight(false)}
                        className="text-4xl font-black text-white bg-transparent w-24 text-center outline-none border-b border-cyan-500"
                      />
                    ) : (
                      <span 
                        onClick={() => setIsChangingWeight(true)}
                        className="text-4xl font-black text-white cursor-pointer hover:text-cyan-400 transition-colors"
                      >
                        {weight} <span className="text-lg font-bold text-cyan-500">KG</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[1, 5, 10].map((num) => (
                    <button
                      key={num}
                      disabled={isAdding}
                      onClick={() => handleAddSet(num)}
                      className={cn(
                        "aspect-square rounded-[2rem] flex flex-col items-center justify-center transition-all active:scale-90 border",
                        num === 5 
                          ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.15)] border-white" 
                          : "bg-slate-900/50 border-slate-800 text-white hover:border-slate-600"
                      )}
                    >
                      <span className={cn("font-black", num === 5 ? "text-4xl" : "text-2xl")}>+{num}</span>
                      <span className={cn("text-[9px] font-bold uppercase tracking-widest", num === 5 ? "text-slate-600" : "text-slate-500")}>reps</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-3xl p-2 pl-6">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">Custom:</span>
                  <input 
                    type="number"
                    value={reps || ''}
                    placeholder="0"
                    onChange={(e) => setReps(Number(e.target.value))}
                    className="flex-1 bg-transparent py-3 text-xl font-bold text-white outline-none"
                  />
                  <button 
                    onClick={() => handleAddSet()}
                    disabled={isAdding || reps <= 0}
                    className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center transition-all active:scale-95",
                      isAdding || reps <= 0 ? "bg-slate-800 text-slate-600" : "bg-cyan-500 text-black shadow-lg"
                    )}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-sm flex flex-col gap-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 shadow-xl backdrop-blur-md">
                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-4">Tydzień</span>
                   <div className="text-3xl font-black text-white leading-none">{stats?.weekReps || 0}</div>
                   <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Powtórzeń</span>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 shadow-xl backdrop-blur-md">
                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-4">Miesiąc</span>
                   <div className="text-3xl font-black text-white leading-none">{(stats?.monthWeight || 0).toLocaleString()}</div>
                   <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">KG Total</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-cyan-500/20 rounded-[2rem] p-8 relative overflow-hidden backdrop-blur-md">
                 <div className="relative z-10 flex flex-col gap-1">
                   <span className="text-cyan-400 font-bold text-[10px] uppercase tracking-widest mb-2">Life-time stats</span>
                   <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-400">Total Weight:</span>
                     <span className="text-xl font-black italic">{(stats?.totalWeight || 0).toLocaleString()} KG</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-400">Total Reps:</span>
                     <span className="text-xl font-black italic">{(stats?.totalReps || 0).toLocaleString()}</span>
                   </div>
                 </div>
                 <Trophy className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 rotate-12" />
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 space-y-4">
                 <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Personal Records</h4>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-bold text-slate-300">Rekordowa passa</span>
                    </div>
                    <span className="text-sm font-black text-white">{profile?.longestStreak || 0} dni</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-bold text-slate-300">Max Ciężar</span>
                    </div>
                    <span className="text-sm font-black text-white">{profile?.lastWeight || 0} KG</span>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info (Hidden/Minimal) */}
      <footer className="p-6 text-center opacity-30 select-none flex flex-col gap-1">
        <span className="text-[8px] font-bold uppercase tracking-[0.5em] text-slate-500">Elite Performance Tracker</span>
        <span className="text-[6px] font-bold text-slate-600 uppercase tracking-widest">Version 2.2 • Updated: May 12</span>
      </footer>
    </div>
  );
}
