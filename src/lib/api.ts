// Server proxy for Supabase Edge Functions with authentication
import { supabase } from '@/integrations/supabase/client';

const PROJECT_ID = 'gqwymmauiijshudgstva';
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;

// Helper function to get current user session
async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

// Helper function to call Supabase Edge Functions
async function callEdgeFunction(functionName: string, payload: any) {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: { userId, ...payload }
  });

  if (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }

  return data;
}

// API functions matching the requested routes
export const api = {
  tools: {
    calendar: {
      async create(eventData: {
        title: string;
        startIso: string;
        endIso: string;
        attendees?: string[];
        description?: string;
        location?: string;
      }) {
        return callEdgeFunction('tool-calendar-create', eventData);
      }
    },
    
    contacts: {
      async find(q?: string) {
        return callEdgeFunction('tool-contacts', { action: 'find', q });
      },
      
      async get(id: string) {
        return callEdgeFunction('tool-contacts', { action: 'get', id });
      },
      
      async upsert(contactData: {
        id?: string;
        name: string;
        phone?: string;
        email?: string;
        notes?: string;
      }) {
        return callEdgeFunction('tool-contacts', { action: 'upsert', ...contactData });
      }
    }
  }
};

// Example usage:
// import { api } from '@/lib/api';
//
// // Create calendar event
// const event = await api.tools.calendar.create({
//   title: "Deep work",
//   startIso: "2025-09-22T09:00:00+02:00",
//   endIso: "2025-09-22T09:30:00+02:00",
//   attendees: ["name@email.com"],
//   description: "Focus block",
//   location: "Home"
// });
//
// // Find contacts
// const contacts = await api.tools.contacts.find("john");
//
// // Get specific contact
// const contact = await api.tools.contacts.get("uuid-here");
//
// // Create or update contact
// const result = await api.tools.contacts.upsert({
//   name: "John Doe",
//   email: "john@example.com",
//   phone: "+1234567890"
// });