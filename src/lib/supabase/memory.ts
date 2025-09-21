import { supabase } from '@/integrations/supabase/client';

export interface LogConversationParams {
  userId: string;
  sessionId?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  text?: string;
  metadata?: Record<string, any>;
}

export interface RagUpsertParams {
  userId: string;
  kind: string;
  refId?: string;
  title?: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface MemoryUpsertParams {
  userId: string;
  key: string;
  value: string;
  confidence?: number;
}

/**
 * Log a conversation turn to the conversations_memory table
 */
export async function logConversation(params: LogConversationParams) {
  const { userId, sessionId, role, text, metadata = {} } = params;
  
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
}

/**
 * Upsert a document into the rag_docs table
 */
export async function ragUpsert(params: RagUpsertParams) {
  const { userId, kind, refId, title, content, metadata = {}, embedding } = params;
  
  // If refId is provided, try to update existing record first
  if (refId) {
    const { data: existing } = await supabase
      .from('rag_docs')
      .select('id')
      .eq('user_id', userId)
      .eq('kind', kind)
      .eq('ref_id', refId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('rag_docs')
        .update({
          title,
          content,
          metadata,
          embedding: embedding ? `[${embedding.join(',')}]` : undefined
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating rag doc:', error);
        throw error;
      }

      return data;
    }
  }

  // Insert new record
  const { data, error } = await supabase
    .from('rag_docs')
    .insert({
      user_id: userId,
      kind,
      ref_id: refId,
      title,
      content,
      metadata,
      embedding: embedding ? `[${embedding.join(',')}]` : undefined
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting rag doc:', error);
    throw error;
  }

  return data;
}

/**
 * Upsert a memory (key-value fact) into the memories table
 */
export async function memoryUpsert(params: MemoryUpsertParams) {
  const { userId, key, value, confidence = 0.8 } = params;
  
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
}

/**
 * Retrieve memories for a user, optionally filtered by key pattern
 */
export async function getMemories(userId: string, keyPattern?: string) {
  let query = supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .order('last_seen_at', { ascending: false });

  if (keyPattern) {
    query = query.ilike('key', `%${keyPattern}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error retrieving memories:', error);
    throw error;
  }

  return data;
}

/**
 * Search RAG documents by vector similarity
 */
export async function searchRagDocs(
  userId: string, 
  embedding: number[], 
  kind?: string, 
  limit = 10,
  threshold = 0.7
) {
  let query = supabase.rpc('match_embeddings', {
    query_embedding: `[${embedding.join(',')}]`,
    match_threshold: threshold,
    match_count: limit
  });

  const { data, error } = await query;

  if (error) {
    console.error('Error searching rag docs:', error);
    throw error;
  }

  // Filter by kind and userId if specified
  let results = data || [];
  if (kind) {
    results = results.filter((doc: any) => doc.metadata?.kind === kind);
  }
  
  return results.filter((doc: any) => doc.metadata?.user_id === userId);
}