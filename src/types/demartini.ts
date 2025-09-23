export interface DemartiniAnswer {
  index: number;
  text: string;
  who?: string;
  where?: string;
  when?: string;
  context?: string;
}

export interface CertaintyCheck {
  is_certain: boolean;
  note: string;
  timestamp: string;
}

export interface DemartiniColumn {
  column_number: number;
  answers: DemartiniAnswer[];
  certainty_check?: CertaintyCheck;
  target_count?: number;
  is_complete: boolean;
}

export interface DemartiniSession {
  id: string;
  title: string;
  selected_side: 'A' | 'B' | 'C';
  side_c_mode?: 'self' | 'relief' | 'grief';
  columns: { [key: string]: DemartiniColumn };
  progress: {
    current_column: number;
    completed_columns: number[];
  };
  created_at: string;
  updated_at: string;
}

export interface ColumnConfig {
  number: number;
  title: string;
  question: string;
  target_count?: number;
  requires_who_where_when: boolean;
  side: 'A' | 'B' | 'C';
  mode?: 'self' | 'relief' | 'grief';
}

export const DEMARTINI_COLUMNS: ColumnConfig[] = [
  // Side A - Admired Traits
  { number: 1, title: "Admired Trait", question: "Choose 1 specific trait, action, or inaction you admire most in this person. Write it in short form (3–5 words). Add where and when you observed it.", target_count: 1, requires_who_where_when: true, side: 'A' },
  { number: 2, title: "Times You Showed Same Traits", question: "List times YOU showed those same traits. For each, add who/where/when. Aim for 20–50 items.", target_count: 20, requires_who_where_when: true, side: 'A' },
  { number: 3, title: "Drawbacks to You", question: "Think of times they showed those admired traits. What were the drawbacks or downsides to YOU? Aim for 20–50.", target_count: 20, requires_who_where_when: false, side: 'A' },
  { number: 4, title: "Drawbacks to Others", question: "List the drawbacks to OTHERS when you showed the same admired traits. 20–50 items.", target_count: 20, requires_who_where_when: false, side: 'A' },
  { number: 5, title: "Opposite Traits They Displayed", question: "List evidence of the OPPOSITE traits they displayed, in the same situations. Be specific.", requires_who_where_when: false, side: 'A' },
  { number: 6, title: "Who Displayed Opposite", question: "When they showed those admired traits, who else (including you) displayed the OPPOSITE traits at the same time?", requires_who_where_when: true, side: 'A' },
  { number: 7, title: "Benefits If Opposite", question: "What would have been the BENEFITS to you if they had shown the OPPOSITE traits instead?", requires_who_where_when: false, side: 'A' },
  
  // Side B - Despised Traits  
  { number: 8, title: "Despised Trait", question: "Choose 1 specific trait, action, or inaction you dislike most in this person. Write it in short form (3–5 words). Add where and when you observed it.", target_count: 1, requires_who_where_when: true, side: 'B' },
  { number: 9, title: "Times You Showed Same Traits", question: "List times YOU displayed the same traits. For each, add who/where/when.", requires_who_where_when: true, side: 'B' },
  { number: 10, title: "Benefits to You", question: "Think of moments they showed those disliked traits. What were the BENEFITS or upsides to YOU? Provide 20–50.", target_count: 20, requires_who_where_when: false, side: 'B' },
  { number: 11, title: "Benefits to Others", question: "What were the BENEFITS to others when you displayed those same traits? Provide 20–50.", target_count: 20, requires_who_where_when: false, side: 'B' },
  { number: 12, title: "Opposite Traits They Displayed", question: "List evidence of the OPPOSITE traits they also displayed in those situations.", requires_who_where_when: false, side: 'B' },
  { number: 13, title: "Who Displayed Opposite", question: "When they showed those despised traits, who else (including you) showed the OPPOSITE at the same time?", requires_who_where_when: true, side: 'B' },
  { number: 14, title: "Drawbacks If Opposite", question: "What would have been the DRAWBACKS to you if they had shown the opposite traits instead?", requires_who_where_when: false, side: 'B' },
];

export const DEMARTINI_COLUMNS_SIDE_C: { [key: string]: ColumnConfig[] } = {
  self: [
    { number: 15, title: "New Trait You Display", question: "What new admired trait/action/inaction do you think you now display?", requires_who_where_when: false, side: 'C', mode: 'self' },
    { number: 16, title: "Old Forms", question: "In what OLD forms did you already display this trait (equal degree, maybe one/many, close/distant, male/female)?", requires_who_where_when: false, side: 'C', mode: 'self' },
    { number: 17, title: "Drawbacks of New Form", question: "What are the DRAWBACKS to you of this new form? Aim 20–50.", target_count: 20, requires_who_where_when: false, side: 'C', mode: 'self' },
    { number: 18, title: "Benefits of Old Form", question: "What were the BENEFITS to you of the old form? Aim 20–50.", target_count: 20, requires_who_where_when: false, side: 'C', mode: 'self' },
    { number: 19, title: "Old Trait You Lost", question: "What old admired trait/action/inaction do you feel you no longer display?", requires_who_where_when: false, side: 'C', mode: 'self' },
    { number: 20, title: "New Forms Still Exist", question: "In what NEW forms do you still display this trait (equal degree)?", requires_who_where_when: false, side: 'C', mode: 'self' },
    { number: 21, title: "Benefits of New Form", question: "What are the BENEFITS of the new form? Aim 20–50.", target_count: 20, requires_who_where_when: false, side: 'C', mode: 'self' },
    { number: 22, title: "Drawbacks of Old Form", question: "What were the DRAWBACKS of the old form? Aim 20–50.", target_count: 20, requires_who_where_when: false, side: 'C', mode: 'self' },
  ],
  relief: [
    { number: 15, title: "Traits You Admire in New Person", question: "What traits of the new person do you admire? List 4–26 items.", target_count: 4, requires_who_where_when: false, side: 'C', mode: 'relief' },
    { number: 16, title: "Previous People Same Traits", question: "Who were the previous people who showed the same traits? (Must match the count)", requires_who_where_when: true, side: 'C', mode: 'relief' },
    { number: 17, title: "Drawbacks of New Person", question: "What are the drawbacks of the new person showing those traits? 20–50 items.", target_count: 20, requires_who_where_when: false, side: 'C', mode: 'relief' },
    { number: 18, title: "Benefits of Previous People", question: "What were the benefits of the previous people showing them? 20–50 items.", target_count: 20, requires_who_where_when: false, side: 'C', mode: 'relief' },
  ],
  grief: [
    { number: 15, title: "Traits You Miss", question: "What traits of the departed person do you miss? List 4–26 items.", target_count: 4, requires_who_where_when: false, side: 'C', mode: 'grief' },
    { number: 16, title: "New People Same Traits", question: "Who are the new people who now show them? (Must match the count)", requires_who_where_when: true, side: 'C', mode: 'grief' },
    { number: 17, title: "Drawbacks of Departed Person", question: "What were the drawbacks of the departed person showing them? 20–50 items.", target_count: 20, requires_who_where_when: false, side: 'C', mode: 'grief' },
    { number: 18, title: "Benefits of New People", question: "What are the benefits of the new people showing them? 20–50 items.", target_count: 20, requires_who_where_when: false, side: 'C', mode: 'grief' },
    { number: 19, title: "Despised Traits from New Person", question: "What despised traits from a new challenging person? List 4–26 items.", target_count: 4, requires_who_where_when: false, side: 'C', mode: 'grief' },
    { number: 20, title: "Previous People Same Traits", question: "Who were the previous people who also showed them? (Must match count)", requires_who_where_when: true, side: 'C', mode: 'grief' },
    { number: 21, title: "Benefits of New Person", question: "What are the benefits of the new person showing them? 20–50 items.", target_count: 20, requires_who_where_when: false, side: 'C', mode: 'grief' },
    { number: 22, title: "Drawbacks of Previous People", question: "What were the drawbacks of the previous people showing them? 20–50 items.", target_count: 20, requires_who_where_when: false, side: 'C', mode: 'grief' },
  ],
};

export const BLOCKED_WORDS = ['nice', 'bad', 'felt', 'always', 'never', 'good', 'evil', 'awful', 'terrible', 'amazing', 'perfect'];

export const CRISIS_KEYWORDS = ['suicide', 'kill myself', 'end it all', 'hurt myself', 'self-harm', 'violence', 'harm others', 'kill someone'];