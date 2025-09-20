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
  category?: string;
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

export interface EndOfDayReview {
  id: string;
  date: Date;
  wentWell: string;
  couldImprove: string;
  keyAccomplishments?: string;
  lessonsLearned?: string;
  tomorrowsFocus?: string;
  mood: 1 | 2 | 3 | 4 | 5;
  energyLevel: 1 | 2 | 3 | 4 | 5;
  gratitude?: string;
  createdAt: Date;
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

export interface WeeklyPlan {
  id: string;
  weekStart: Date;
  priorities: string[];
  createdAt: Date;
}

export interface EndOfWeekReview {
  id: string;
  weekStart: Date;
  accomplishments: string;
  challenges: string;
  lessonsLearned?: string;
  nextWeekFocus?: string;
  overallSatisfaction: 1 | 2 | 3 | 4 | 5;
  prioritiesCompleted: number;
  createdAt: Date;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  segment?: string;
  current_situation?: string;
  working_on?: string;
  how_to_add_value?: string;
  notes?: string;
  last_touch?: Date;
  next_touch?: Date;
  created_at: Date;
  updated_at: Date;
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

export const BOOK_CATEGORIES = [
  'Fiction',
  'Non-Fiction',
  'Biography',
  'Science',
  'Technology',
  'Business',
  'Self-Help',
  'Philosophy',
  'History',
  'Health',
  'Finance',
  'Psychology',
  'Education',
  'Other'
] as const;