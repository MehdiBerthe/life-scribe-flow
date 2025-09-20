import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for our database
export type ContactSegment = 'TOP5' | 'WEEKLY15' | 'MONTHLY100'
export type EnergyLevel = 'low' | 'medium' | 'high'
export type InteractionChannel = 'whatsapp' | 'sms' | 'email' | 'linkedin'
export type InteractionDirection = 'out' | 'in'

export interface Contact {
  id: string
  user_id: string
  first_name: string
  last_name: string
  preferred_name?: string
  phone_e164?: string
  email?: string
  linkedin_url?: string
  twitter_url?: string
  company?: string
  role?: string
  city?: string
  timezone?: string
  segment: ContactSegment
  importance_score: number
  closeness_score: number
  frequency_days: number
  last_contacted_at?: string
  next_due_at?: string
  current_situation?: string
  working_on?: string
  how_i_can_add_value?: string
  goals?: string
  interests?: string
  notes?: string
  tags?: string
  created_at: string
  updated_at: string
}

export interface Interaction {
  id: string
  user_id: string
  contact_id: string
  date: string
  channel: InteractionChannel
  direction: InteractionDirection
  message_body?: string
  ai_summary?: string
  outcome?: string
  follow_up_due_at?: string
  created_at: string
}

export interface User {
  id: string
  name: string
  timezone: string
  daily_capacity: number
  created_at: string
  updated_at: string
}