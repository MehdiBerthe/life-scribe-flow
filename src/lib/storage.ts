// Local Storage utilities for LifeOS
import { 
  JournalEntry, 
  ReadingItem, 
  ReadingNote, 
  WeeklyReview, 
  EndOfDayReview,
  DailyGoal, 
  Transaction, 
  Envelope, 
  PhysicalLog,
  Contact 
} from '@/types';

const STORAGE_KEYS = {
  JOURNAL: 'lifeos_journal',
  READING: 'lifeos_reading',
  READING_NOTES: 'lifeos_reading_notes',
  WEEKLY_REVIEWS: 'lifeos_weekly_reviews',
  END_OF_DAY_REVIEWS: 'lifeos_end_of_day_reviews',
  DAILY_GOALS: 'lifeos_daily_goals',
  TRANSACTIONS: 'lifeos_transactions',
  ENVELOPES: 'lifeos_envelopes',
  PHYSICAL_LOGS: 'lifeos_physical_logs',
  CONTACTS: 'lifeos_contacts',
} as const;

// Generic storage functions
export function getFromStorage<T>(key: string, defaultValue: T[] = []): T[] {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    const parsed = JSON.parse(stored);
    // Convert date strings back to Date objects
    return parsed.map((item: any) => ({
      ...item,
      ...(item.createdAt && { createdAt: new Date(item.createdAt) }),
      ...(item.date && { date: new Date(item.date) }),
      ...(item.weekStart && { weekStart: new Date(item.weekStart) }),
      ...(item.lastTouch && { lastTouch: new Date(item.lastTouch) }),
      ...(item.nextTouch && { nextTouch: new Date(item.nextTouch) }),
      ...(item.last_touch && { last_touch: new Date(item.last_touch) }),
      ...(item.next_touch && { next_touch: new Date(item.next_touch) }),
    }));
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
  }
}

// Specific storage functions
export const storage = {
  journal: {
    getAll: (): JournalEntry[] => getFromStorage(STORAGE_KEYS.JOURNAL),
    save: (entries: JournalEntry[]) => saveToStorage(STORAGE_KEYS.JOURNAL, entries),
  },
  reading: {
    getAll: (): ReadingItem[] => getFromStorage(STORAGE_KEYS.READING),
    save: (items: ReadingItem[]) => saveToStorage(STORAGE_KEYS.READING, items),
  },
  readingNotes: {
    getAll: (): ReadingNote[] => getFromStorage(STORAGE_KEYS.READING_NOTES),
    save: (notes: ReadingNote[]) => saveToStorage(STORAGE_KEYS.READING_NOTES, notes),
  },
  weeklyReviews: {
    getAll: (): WeeklyReview[] => getFromStorage(STORAGE_KEYS.WEEKLY_REVIEWS),
    save: (reviews: WeeklyReview[]) => saveToStorage(STORAGE_KEYS.WEEKLY_REVIEWS, reviews),
  },
  endOfDayReviews: {
    getAll: (): EndOfDayReview[] => getFromStorage(STORAGE_KEYS.END_OF_DAY_REVIEWS),
    save: (reviews: EndOfDayReview[]) => saveToStorage(STORAGE_KEYS.END_OF_DAY_REVIEWS, reviews),
  },
  dailyGoals: {
    getAll: (): DailyGoal[] => getFromStorage(STORAGE_KEYS.DAILY_GOALS),
    save: (goals: DailyGoal[]) => saveToStorage(STORAGE_KEYS.DAILY_GOALS, goals),
  },
  transactions: {
    getAll: (): Transaction[] => getFromStorage(STORAGE_KEYS.TRANSACTIONS),
    save: (transactions: Transaction[]) => saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions),
  },
  envelopes: {
    getAll: (): Envelope[] => getFromStorage(STORAGE_KEYS.ENVELOPES),
    save: (envelopes: Envelope[]) => saveToStorage(STORAGE_KEYS.ENVELOPES, envelopes),
  },
  physicalLogs: {
    getAll: (): PhysicalLog[] => getFromStorage(STORAGE_KEYS.PHYSICAL_LOGS),
    save: (logs: PhysicalLog[]) => saveToStorage(STORAGE_KEYS.PHYSICAL_LOGS, logs),
  },
  contacts: {
    getAll: (): Contact[] => getFromStorage(STORAGE_KEYS.CONTACTS),
    save: (contacts: Contact[]) => saveToStorage(STORAGE_KEYS.CONTACTS, contacts),
  },
};

// Helper functions
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}