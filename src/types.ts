export interface UserProfile {
  uid: string;
  lastWeight: number;
  currentStreak: number;
  lastActiveDate: string | null;
  longestStreak: number;
  totalXp?: number;
}

export interface WorkSet {
  id?: string;
  userId: string;
  weight: number;
  reps: number;
  timestamp: number; // stores Date.now()
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}
