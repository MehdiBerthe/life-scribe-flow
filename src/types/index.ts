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

export interface Flashcard {
  id: string;
  noteId: string;
  itemId: string;
  question: string;
  answer: string;
  createdAt: Date;
  lastReviewed?: Date;
  timesReviewed: number;
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
  dailyChecklist?: Record<string, boolean>;
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
  sleep?: {
    hours?: number;
    quality?: number; // 1-5 scale
    notes?: string;
  };
  workout?: {
    type?: string;
    duration?: number; // minutes
    intensity?: number; // 1-5 scale
    exercises?: Array<{
      id: string;
      name: string;
      sets: Array<{
        reps: number;
        weight?: number; // optional weight in kg
      }>;
    }>;
    notes?: string;
  };
  weight?: {
    value: number; // in kg
    notes?: string;
  };
  energy?: {
    level: number; // 1-5 scale
    notes?: string;
  };
  caffeine?: {
    cups?: number;
    notes?: string;
  };
  meals?: Array<{
    id: string;
    time: string; // e.g., "08:30", "12:00", "19:30"
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    description: string;
    calories?: number;
  }>;
  totalCalories?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
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
  weeklyChecklist?: Record<string, boolean>;
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

export const DAILY_CHECKLIST_FULL = [
  'Did I define the 7 top priorities for my day and act on them ?',
  'Did I spend quality time with my son and or loved ones ?',
  'Did I express gratitude to 1 person ?',
  'Did I workout today ?',
  'Did I meditate today ?',
  'Did I spend 30 minutes reading or studying ?',
  'Did I Journal my thoughts or insights for at least 10 minutes ?',
  'Did I learning about AI or business strategy ?',
  'Did I make 3 offers  ?',
  'Did I work on refining my sales process  ?',
  'Did I track my finances ?',
  'Did I raise business and wealth building on my values ?',
  'Did I talk to at least 10 leads ?',
  'Did I review product delivery ?',
  'Did I Work on content for at least 30 minutes (script, recording, editing, or planning) ?',
  'Did I post 1 piece of content ?',
  'Did I respond to comments or engage with followers on social media ?',
  'Did I respect my standards today ?',
  'Did I equilibrate my perceptions on anything I felt was disturbing my centeredness ?',
  'Did I see how every challenge helps me with fulfilling my mission ?',
  'Did I own the traits of the greats today ?'
] as const;

export const DAILY_CHECKLIST_SIMPLIFIED = [
  'Did I define the top priorities for my day and act on them ?',
  'Did I express gratitude to 1 person ?',
  'Did I workout & meditate today ?',
  'Did I spend 30 minutes at least reading or studying ?',
  'Did I Journal my thoughts for at least 10 minutes ?',
  'Did I make 3 offers  ?',
  'Did I track my finances ?'
] as const;

export const WEEKLY_CHECKLIST = [
  'Did I progress in my fitness journey (muscle gain, stamina improvement, etc.) ?',
  'Did I grow on social media ?',
  'Did I follow up with leads and prospects to drive conversions ?',
  'Did I monitor client feedback for potential product improvements ?',
  'Did I review business performance and optimize ad campaigns or sales processes ?'
] as const;