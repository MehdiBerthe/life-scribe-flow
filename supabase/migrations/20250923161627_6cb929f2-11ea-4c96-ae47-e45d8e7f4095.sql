-- Add selected_side column to demartini_docs table to track which side (A, B, or C) the user is working on
ALTER TABLE public.demartini_docs 
ADD COLUMN selected_side text DEFAULT 'A' CHECK (selected_side IN ('A', 'B', 'C'));