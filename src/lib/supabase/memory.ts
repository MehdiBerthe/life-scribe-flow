import { supabase } from '@/integrations/supabase/client';

interface LogConversationParams {
  userId: string;
  sessionId?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  text?: string;
  metadata?: Record<string, any>;
}

interface RagUpsertParams {
  userId: string;
  kind: string;
  refId?: string;
  title?: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

interface MemoryUpsertParams {
  userId: string;
  key: string;
  value: string;
  confidence?: number;
}

export async function logConversation({
  userId,
  sessionId,
  role,
  text,
  metadata = {}
}: LogConversationParams) {
  try {
    const { data, error } = await supabase
      .from('conversations_memory')
      .insert({
        user_id: userId,
        session_id: sessionId || crypto.randomUUID(),
        role,
        text,
        metadata
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging conversation:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to log conversation:', error);
    throw error;
  }
}

export async function ragUpsert({
  userId,
  kind,
  refId,
  title,
  content,
  metadata = {},
  embedding
}: RagUpsertParams) {
  try {
    const insertData: any = {
      user_id: userId,
      kind,
      ref_id: refId,
      title,
      content,
      metadata
    };

    if (embedding) {
      insertData.embedding = JSON.stringify(embedding);
    }

    const { data, error } = await supabase
      .from('rag_docs')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error upserting rag doc:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to upsert rag doc:', error);
    throw error;
  }
}

export async function memoryUpsert({
  userId,
  key,
  value,
  confidence = 0.8
}: MemoryUpsertParams) {
  try {
    const { data, error } = await supabase
      .from('memories')
      .upsert({
        user_id: userId,
        key,
        value,
        confidence,
        last_seen_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,key'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting memory:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to upsert memory:', error);
    throw error;
  }
}

// Export all functions
export const memoryHelpers = {
  logConversation,
  ragUpsert,
  memoryUpsert
};