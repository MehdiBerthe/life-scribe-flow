import { Contact } from '@/lib/supabase';

// Demo contacts for development
export const demoContacts: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  {
    first_name: 'Sarah',
    last_name: 'Chen',
    preferred_name: 'Sarah',
    phone_e164: '+1234567890',
    email: 'sarah.chen@techcorp.com',
    linkedin_url: 'https://linkedin.com/in/sarahchen',
    company: 'TechCorp',
    role: 'VP of Engineering',
    city: 'San Francisco',
    timezone: 'America/Los_Angeles',
    segment: 'TOP5',
    importance_score: 95,
    closeness_score: 90,
    frequency_days: 3,
    last_contacted_at: '2024-01-15T10:00:00Z',
    next_due_at: '2024-01-18T10:00:00Z',
    current_situation: 'Leading AI initiative',
    working_on: 'Machine learning platform',
    how_i_can_add_value: 'Product strategy insights',
    goals: 'Scale engineering team to 200+',
    interests: 'AI, hiking, wine tasting',
    notes: 'Former colleague from StartupX. Very influential in tech community.',
    tags: 'tech,ai,leadership'
  },
  {
    first_name: 'Michael',
    last_name: 'Rodriguez',
    preferred_name: 'Mike',
    phone_e164: '+1234567891',
    email: 'mike@growthcorp.com',
    company: 'GrowthCorp',
    role: 'CMO',
    city: 'Austin',
    segment: 'TOP5',
    importance_score: 88,
    closeness_score: 85,
    frequency_days: 3,
    last_contacted_at: '2024-01-14T15:30:00Z',
    next_due_at: '2024-01-17T15:30:00Z',
    current_situation: 'Expanding to new markets',
    working_on: 'Q1 marketing campaign',
    how_i_can_add_value: 'Growth hacking strategies',
    goals: 'Double customer acquisition',
    interests: 'Marketing, basketball, podcasts',
    notes: 'Met at SaaStr conference. Great contact for partnerships.',
    tags: 'marketing,growth,saas'
  },
  {
    first_name: 'Emma',
    last_name: 'Thompson',
    preferred_name: 'Emma',
    email: 'emma@designstudio.com',
    company: 'Creative Design Studio',
    role: 'Creative Director',
    city: 'New York',
    segment: 'WEEKLY15',
    importance_score: 75,
    closeness_score: 80,
    frequency_days: 7,
    last_contacted_at: '2024-01-10T09:00:00Z',
    next_due_at: '2024-01-17T09:00:00Z',
    current_situation: 'Launching new brand identity',
    working_on: 'Rebranding project for Fortune 500',
    how_i_can_add_value: 'UX/UI feedback and connections',
    goals: 'Expand studio internationally',
    interests: 'Design, art exhibitions, yoga',
    notes: 'Incredible eye for design. Always delivers amazing work.',
    tags: 'design,creative,branding'
  },
  {
    first_name: 'James',
    last_name: 'Wilson',
    preferred_name: 'Jim',
    phone_e164: '+1234567893',
    email: 'james.wilson@fintech.com',
    company: 'FinTech Solutions',
    role: 'CEO',
    city: 'London',
    segment: 'TOP5',
    importance_score: 92,
    closeness_score: 75,
    frequency_days: 3,
    last_contacted_at: '2024-01-13T14:00:00Z',
    next_due_at: '2024-01-16T14:00:00Z',
    current_situation: 'Raising Series B',
    working_on: 'Expanding to European markets',
    how_i_can_add_value: 'Investor introductions',
    goals: 'Become leading fintech in Europe',
    interests: 'Fintech, sailing, chess',
    notes: 'Brilliant founder with strong vision. Potential for partnership.',
    tags: 'fintech,ceo,investment'
  }
];

export function generateDemoContactsWithTimestamps() {
  const now = new Date();
  
  return demoContacts.map((contact, index) => {
    // Create realistic timestamps - some contacts are due now, some soon
    const daysOffset = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1 days
    const nextDue = new Date(now);
    nextDue.setDate(nextDue.getDate() + daysOffset);
    
    const lastContact = new Date(nextDue);
    lastContact.setDate(lastContact.getDate() - contact.frequency_days);
    
    return {
      ...contact,
      last_contacted_at: lastContact.toISOString(),
      next_due_at: nextDue.toISOString()
    };
  });
}