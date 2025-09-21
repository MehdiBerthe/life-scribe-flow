-- Enable RLS on llm_stats table and create appropriate policies
ALTER TABLE llm_stats ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view and insert their own stats
CREATE POLICY "Users can view their own llm stats" 
ON llm_stats 
FOR SELECT 
USING (user_id = auth.uid() OR user_id = ('single-user'::text)::uuid);

CREATE POLICY "Users can insert their own llm stats" 
ON llm_stats 
FOR INSERT 
WITH CHECK (user_id = auth.uid() OR user_id = ('single-user'::text)::uuid);