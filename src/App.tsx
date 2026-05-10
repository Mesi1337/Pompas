/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, 
  Flame, 
  TrendingUp, 
  Plus, 
  History, 
  ChevronRight, 
  LogOut,
  BarChart3,
  Calendar,
  Activity,
  Trophy
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
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
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
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#050505] overflow-hidden relative">
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

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative flex flex-col">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto w-full px-6 lg:px-8 py-8 lg:py-12 flex-1 flex flex-col relative z-10">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 uppercase leading-none">
              BPress Tracker
            </h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.25em] mt-1">Immersive Training Engine</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-slate-900/50 border border-slate-800 px-5 py-2.5 rounded-2xl backdrop-blur-md flex items-center gap-4 shadow-xl">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">Dzienna Passa</span>
                <span className="text-xl font-black text-orange-500 leading-none">{profile?.currentStreak || 0} DNI</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Flame className={cn("w-5 h-5", profile?.currentStreak ? "text-orange-500 fill-orange-500" : "text-slate-700")} />
              </div>
            </div>
            
            <button 
              onClick={() => signOut(auth)}
              className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-900/50 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content Grid */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Controls */}
          <section className="lg:col-span-5 bg-slate-900/30 border border-slate-800 rounded-[3rem] p-8 lg:p-10 flex flex-col items-center justify-center backdrop-blur-xl relative shadow-2xl">
            <div className="text-center mb-12">
              <span className="text-slate-500 uppercase text-[10px] font-bold tracking-[0.3em] mb-3 block">Aktualny Ciężar</span>
              <div className="flex items-center justify-center gap-4 group">
                {isChangingWeight ? (
                  <input 
                    autoFocus
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    onBlur={() => setIsChangingWeight(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsChangingWeight(false)}
                    className="text-7xl font-black text-white tracking-tighter bg-transparent w-48 text-center outline-none border-b-2 border-cyan-500"
                  />
                ) : (
                  <span 
                    onClick={() => setIsChangingWeight(true)}
                    className="text-8xl font-black text-white tracking-tighter cursor-pointer hover:text-cyan-400 transition-colors"
                  >
                    {weight}
                  </span>
                )}
                <span className="text-2xl font-bold text-cyan-500 uppercase font-display">kg</span>
              </div>
              <button 
                onClick={() => setIsChangingWeight(!isChangingWeight)}
                className="mt-6 text-[10px] font-bold text-slate-500 hover:text-white border border-slate-800 px-5 py-2 rounded-full uppercase tracking-widest transition-all"
              >
                {isChangingWeight ? 'Zatwierdź' : 'Zmień obciążenie'}
              </button>
            </div>

            <div className="flex flex-col gap-5 w-full">
              <div className="grid grid-cols-3 gap-4">
                {[1, 5, 10].map((num) => (
                  <button
                    key={num}
                    disabled={isAdding}
                    onClick={() => handleAddSet(num)}
                    className={cn(
                      "aspect-square rounded-3xl flex flex-col items-center justify-center transition-all active:scale-90",
                      num === 5 
                        ? "bg-cyan-500 border border-cyan-400 text-black shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:bg-cyan-400" 
                        : "bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 text-white"
                    )}
                  >
                    <span className={cn("font-black", num === 5 ? "text-4xl" : "text-2xl")}>+{num}</span>
                    <span className={cn("text-[9px] font-bold uppercase tracking-widest", num === 5 ? "text-black" : "text-slate-500")}>reps</span>
                  </button>
                ))}
              </div>
              
              <div className="relative mt-2">
                <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-3xl p-2 pl-6">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">Custom:</span>
                  <input 
                    type="number"
                    value={reps || ''}
                    placeholder="0"
                    onChange={(e) => setReps(Number(e.target.value))}
                    className="flex-1 bg-transparent py-4 text-xl font-bold text-white outline-none"
                  />
                  <button 
                    onClick={() => handleAddSet()}
                    disabled={isAdding || reps <= 0}
                    className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center transition-all active:scale-95",
                      isAdding || reps <= 0
                        ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                        : "bg-white text-black shadow-xl"
                    )}
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: Stats View */}
          <section className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Today's Hero Stat */}
            <div className="bg-gradient-to-br from-blue-600/10 to-cyan-600/10 border border-cyan-500/10 rounded-[3rem] p-8 lg:p-10 flex flex-col md:flex-row justify-between md:items-end relative overflow-hidden backdrop-blur-sm group">
               <div className="absolute top-0 right-0 p-4 opacity-5 transition-transform group-hover:scale-110 duration-1000">
                 <Dumbbell className="w-64 h-64 rotate-12" />
               </div>
               <div className="relative z-10 mb-6 md:mb-0">
                  <span className="text-cyan-400 font-bold text-[10px] uppercase tracking-[0.3em] block mb-2">Dzisiejszy wynik</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-8xl font-black tracking-tighter">{todayReps}</span>
                    <span className="text-xl text-slate-500 font-medium font-display">powtórzeń</span>
                  </div>
               </div>
               <div className="text-right relative z-10">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Tonaż Sesji</span>
                  <span className="text-5xl font-black text-white tracking-tight">{(todayReps * weight).toLocaleString()} <span className="text-lg text-cyan-500 font-black">kg</span></span>
               </div>
            </div>

            {/* Periodic Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-6 flex-1">
              <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] p-6 lg:p-8 flex flex-col justify-between backdrop-blur-md hover:border-slate-700 transition-colors shadow-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-4">Ten Tydzień</span>
                <div className="space-y-1">
                  <div className="text-4xl font-black text-white">{stats?.weekReps || 0} <span className="text-xs font-medium text-slate-500 uppercase tracking-widest font-sans ml-1">Reps</span></div>
                </div>
                <div className="w-full h-1 bg-slate-800/50 rounded-full mt-6 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stats?.weekReps || 0) / 10, 100)}%` }}
                    className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                  />
                </div>
              </div>

              <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] p-6 lg:p-8 flex flex-col justify-between backdrop-blur-md hover:border-slate-700 transition-colors shadow-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-4">Ten Miesiąc</span>
                <div className="space-y-1">
                  <div className="text-4xl font-black text-white">{(stats?.monthWeight || 0).toLocaleString()} <span className="text-xs font-medium text-slate-500 uppercase tracking-widest font-sans ml-1">kg</span></div>
                </div>
                <div className="w-full h-1 bg-slate-800/50 rounded-full mt-6 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stats?.monthWeight || 0) / 1000, 100)}%` }}
                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                  />
                </div>
              </div>

              <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] p-6 lg:p-8 flex flex-col justify-between backdrop-blur-md shadow-xl border-orange-500/10">
                <span className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.2em] mb-4">Rekordowa Passa</span>
                <div>
                  <div className="text-5xl font-black text-orange-500 tracking-tighter mb-1">{profile?.longestStreak || 0} <span className="text-lg font-bold text-slate-600 italic">dni</span></div>
                  <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                    <Trophy className="w-3 h-3" /> All-Time Peak
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] p-6 lg:p-8 flex flex-col justify-between backdrop-blur-md shadow-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-4">Łącznie (Total)</span>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-black text-white">{(stats?.totalReps || 0).toLocaleString()} <span className="text-[10px] text-slate-500 uppercase tracking-widest">powt</span></div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-emerald-500 font-mono tracking-tighter">{(stats?.totalWeight || 0).toLocaleString()} <span className="text-[10px] text-slate-500 uppercase tracking-widest">kg</span></div>
                  </div>
                </div>
              </div>
            </div>

          </section>
        </main>

        {/* Footer info */}
        <footer className="mt-12 flex flex-col md:flex-row items-center justify-between border-t border-slate-800/50 pt-8 gap-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <motion.div 
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
              ></motion.div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Engine</span>
            </div>
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              Ostatnia aktywność: {profile?.lastActiveDate || 'Brak'}
            </div>
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            Built for <span className="text-white italic">Elite Performance</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
