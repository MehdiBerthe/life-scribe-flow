// LifeOS Data Models
export interface JournalEntry {
  id: string;
  createdAt: Date;
  area?: string;
  title?: string;
  content: string;
  tags?: string[];
}

export interface ReadingItem {
  id: string;
  title: string;
  author?: string;
  source: string;
  status: 'queued' | 'reading' | 'completed';
  progressPct: number;
  pdfUrl?: string;
}

export interface ReadingNote {
  id: string;
  itemId: string;
  createdAt: Date;
  content: string;
}

export interface WeeklyReview {
  id: string;
  weekStart: Date;
  summary: string;
  commitments?: Record<string, string>;
}

export interface DailyGoal {
  id: string;
  date: Date;
  title: string;
  done: boolean;
}

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  category?: string;
  note?: string;
}

export interface Envelope {
  id: string;
  name: string;
  goalAmount: number;
  balance: number;
}

export interface PhysicalLog {
  id: string;
  date: Date;
  kind: 'sleep' | 'workout' | 'weight' | 'energy' | 'caffeine';
  valueNum?: number;
  notes?: string;
}

export interface Contact {
  id: string;
  name: string;
  lastTouch?: Date;
  nextTouch?: Date;
  notes?: string;
}

export const JOURNAL_AREAS = [
  'Physical',
  'Mental', 
  'Emotional',
  'Spiritual',
  'Social',
  'Professional',
  'Financial'
] as const;