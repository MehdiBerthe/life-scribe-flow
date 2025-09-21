-- Create RPC function for RAG document search with hybrid scoring
CREATE OR REPLACE FUNCTION public.match_rag_docs(
  query_embedding vector,
  user_id uuid,
  kinds text[] DEFAULT NULL,
  start_ts timestamptz DEFAULT NULL,
  end_ts timestamptz DEFAULT NULL,
  k int DEFAULT 12
)
RETURNS TABLE(
  id bigint,
  kind text,
  title text,
  content text,
  metadata jsonb,
  score double precision,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.kind,
    r.title,
    r.content,
    r.metadata,
    -- Hybrid score: 75% cosine similarity + 25% recency decay
    (0.75 * (1 - (r.embedding <=> query_embedding))) + 
    (0.25 * exp(-EXTRACT(EPOCH FROM (now() - r.created_at)) / (90 * 24 * 3600))) as score,
    r.created_at
  FROM rag_docs r
  WHERE r.user_id = match_rag_docs.user_id
    AND (kinds IS NULL OR r.kind = ANY(kinds))
    AND (start_ts IS NULL OR r.created_at >= start_ts)
    AND (end_ts IS NULL OR r.created_at <= end_ts)
    AND r.embedding IS NOT NULL
  ORDER BY score DESC
  LIMIT k;
END;
$$;