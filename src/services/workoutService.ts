import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  orderBy,
  limit,
  Timestamp,
  type DocumentData
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { WorkSet, UserProfile, OperationType } from '../types';
import { startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, isSameDay, format, parseISO } from 'date-fns';

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const workoutService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const path = `users/${userId}`;
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { uid: userId, ...userDoc.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async createUserProfile(userId: string): Promise<UserProfile> {
    const path = `users/${userId}`;
    const initialProfile: Omit<UserProfile, 'uid'> = {
      lastWeight: 80, // Default weight
      currentStreak: 0,
      lastActiveDate: null,
      longestStreak: 0,
      totalXp: 0
    };
    try {
      await setDoc(doc(db, 'users', userId), initialProfile);
      return { uid: userId, ...initialProfile };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async addSet(userId: string, weight: number, reps: number): Promise<void> {
    const path = 'sets';
    try {
      const now = new Date();
      await addDoc(collection(db, 'sets'), {
        userId,
        weight,
        reps,
        timestamp: now.getTime()
      });

      // Update user streak, last weight and XP
      const profile = await this.getUserProfile(userId) || await this.createUserProfile(userId);
      let { currentStreak, longestStreak, lastActiveDate, totalXp = 0 } = profile;
      const today = format(now, 'yyyy-MM-dd');
      
      // Leveling: each rep gives some XP. Heavier weight gives more? Let's stick to reps for now as requested.
      // 1 rep = 10 XP
      totalXp += reps * 10;

      if (!lastActiveDate) {
        currentStreak = 1;
      } else {
        const lastDate = parseISO(lastActiveDate);
        const yesterday = subDays(now, 1);
        
        if (isSameDay(lastDate, now)) {
          // Already worked out today
        } else if (isSameDay(lastDate, yesterday)) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      await updateDoc(doc(db, 'users', userId), {
        lastWeight: weight,
        currentStreak,
        longestStreak,
        lastActiveDate: today,
        totalXp: totalXp
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  calculateLevel(xp: number): { level: number; progress: number } {
    // Basic level logic: level = floor(sqrt(xp/100)) + 1
    // xp = 0 -> level 1
    // xp = 100 -> level 2
    // xp = 400 -> level 3
    // ...
    const level = Math.floor(Math.sqrt(xp / 100)) + 1;
    const currentLevelXp = Math.pow(level - 1, 2) * 100;
    const nextLevelXp = Math.pow(level, 2) * 100;
    const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    return { level, progress: Math.min(progress, 100) };
  },

  async getTodayTotalReps(userId: string, weight: number): Promise<number> {
    const path = 'sets';
    try {
      const todayStart = startOfDay(new Date()).getTime();
      const q = query(
        collection(db, 'sets'),
        where('userId', '==', userId),
        where('weight', '==', weight),
        where('timestamp', '>=', todayStart)
      );
      const snapshot = await getDocs(q);
      let total = 0;
      snapshot.forEach(doc => {
        total += (doc.data().reps || 0);
      });
      return total;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return 0;
    }
  },

  async getStats(userId: string) {
    const path = 'sets';
    try {
      const now = new Date();
      const todayStart = startOfDay(now).getTime();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).getTime();
      const monthStart = startOfMonth(now).getTime();

      const q = query(
        collection(db, 'sets'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      
      let stats = {
        todayWeight: 0,
        todayReps: 0,
        weekReps: 0,
        monthWeight: 0,
        totalWeight: 0,
        totalReps: 0
      };

      snapshot.forEach(doc => {
        const data = doc.data() as WorkSet;
        const setWeight = data.weight * data.reps;

        if (data.timestamp >= todayStart) {
          stats.todayWeight += setWeight;
          stats.todayReps += data.reps;
        }
        if (data.timestamp >= weekStart) {
          stats.weekReps += data.reps;
        }
        if (data.timestamp >= monthStart) {
          stats.monthWeight += setWeight;
        }
        stats.totalWeight += setWeight;
        stats.totalReps += data.reps;
      });

      return stats;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      throw error;
    }
  }
};
