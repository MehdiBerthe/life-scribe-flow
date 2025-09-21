import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { userId, action, ...params } = body;

    console.log('Contact action:', action, 'for user:', userId);

    let result;

    switch (action) {
      case 'find': {
        const { q } = params;
        const query = supabase
          .from('contacts')
          .select('id, name, phone, email')
          .eq('user_id', userId);

        if (q) {
          query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
        }

        const { data: contacts, error } = await query;
        
        if (error) {
          throw error;
        }

        result = { contacts: contacts || [] };
        break;
      }

      case 'get': {
        const { id } = params;
        const { data: contact, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', userId)
          .eq('id', id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!contact) {
          return new Response(JSON.stringify({ 
            error: 'Contact not found' 
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        result = contact;
        break;
      }

      case 'upsert': {
        const { id, name, phone, email, notes } = params;
        
        const contactData = {
          user_id: userId,
          name,
          ...(phone && { phone }),
          ...(email && { email }),
          ...(notes && { notes }),
          updated_at: new Date().toISOString(),
        };

        let query;
        if (id) {
          // Update existing contact
          query = supabase
            .from('contacts')
            .update(contactData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();
        } else {
          // Insert new contact
          query = supabase
            .from('contacts')
            .insert({
              ...contactData,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();
        }

        const { data: contact, error } = await query;
        
        if (error) {
          throw error;
        }

        // Log to conversations table
        const { error: logError } = await supabase
          .from('conversations')
          .insert({
            user_id: userId,
            title: id ? 'Contact Updated' : 'Contact Created',
            messages: [{
              role: 'tool',
              text: `${id ? 'Updated' : 'Created'} contact: ${name}`,
              metadata: {
                kind: 'contact_action',
                action: id ? 'update' : 'create',
                contactId: contact.id,
                name,
              },
              timestamp: new Date().toISOString(),
            }],
          });

        if (logError) {
          console.error('Failed to log to conversations:', logError);
        }

        result = { id: contact.id };
        break;
      }

      default:
        return new Response(JSON.stringify({ 
          error: 'Invalid action. Use find, get, or upsert.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in tool-contacts:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});