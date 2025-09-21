import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const GOOGLE_REFRESH_TOKEN = Deno.env.get('GOOGLE_REFRESH_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

async function getAccessToken(): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token: GOOGLE_REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  console.log('OAuth response:', data);
  
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${data.error}`);
  }
  
  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, title, startIso, endIso, attendees, description, location } = await req.json();
    
    console.log('Creating calendar event:', { userId, title, startIso, endIso });

    // Get Google access token
    const accessToken = await getAccessToken();

    // Create calendar event
    const event = {
      summary: title,
      description: description || '',
      location: location || '',
      start: {
        dateTime: startIso,
      },
      end: {
        dateTime: endIso,
      },
      attendees: attendees?.map((email: string) => ({ email })) || [],
    };

    const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const calendarData = await calendarResponse.json();
    console.log('Calendar API response:', calendarData);

    if (!calendarResponse.ok) {
      throw new Error(`Calendar API error: ${calendarData.error?.message || 'Unknown error'}`);
    }

    // Log to conversations table
    const { error: logError } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title: 'Calendar Event Created',
        messages: [{
          role: 'tool',
          text: `Created calendar event: ${title}`,
          metadata: {
            kind: 'calendar_event',
            eventId: calendarData.id,
            title,
            startIso,
            endIso,
          },
          timestamp: new Date().toISOString(),
        }],
      });

    if (logError) {
      console.error('Failed to log to conversations:', logError);
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      id: calendarData.id,
      htmlLink: calendarData.htmlLink,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in tool-calendar-create:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      ok: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});