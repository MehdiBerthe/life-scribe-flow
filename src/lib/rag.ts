// RAG indexing helper
import { supabase } from '@/integrations/supabase/client';

interface IndexForRagParams {
  userId: string;
  kind: 'journal' | 'reading_note' | 'reflection' | 'goal_digest' | 'contact_note';
  refId: string;
  title?: string;
  content: string;
  metadata?: {
    area?: string;
    tags?: string[];
    [key: string]: any;
  };
}

export async function indexForRag({
  userId,
  kind,
  refId,
  title,
  content,
  metadata = {}
}: IndexForRagParams) {
  try {
    // Strip HTML and build compact content string
    const compactContent = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (!compactContent) {
      console.log('Skipping RAG indexing: empty content');
      return;
    }

    const { error } = await supabase.functions.invoke('rag-index', {
      body: {
        userId,
        kind,
        refId,
        title: title || null,
        content: compactContent,
        metadata
      }
    });

    if (error) {
      console.error('RAG indexing error:', error);
    } else {
      console.log(`Successfully indexed ${kind} content for user ${userId}`);
    }
  } catch (error) {
    console.error('Error calling RAG index function:', error);
  }
}