-- Fix the function with proper search_path setting
DROP FUNCTION IF EXISTS match_embeddings;

CREATE OR REPLACE FUNCTION match_embeddings (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  content_type text,
  content_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    embeddings.id,
    embeddings.content_type,
    embeddings.content_id,
    embeddings.content,
    embeddings.metadata,
    1 - (embeddings.embedding <=> query_embedding) as similarity
  FROM embeddings
  WHERE embeddings.user_id = ('single-user'::text)::uuid
    AND 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;