-- Add upvote_count column to complaints table
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS upvote_count integer NOT NULL DEFAULT 0;

-- Create complaint_upvotes table for tracking who upvoted what
CREATE TABLE public.complaint_upvotes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, complaint_id)
);

-- Enable RLS on complaint_upvotes
ALTER TABLE public.complaint_upvotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for complaint_upvotes
CREATE POLICY "Users can view all upvotes"
ON public.complaint_upvotes
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert their own upvotes"
ON public.complaint_upvotes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own upvotes"
ON public.complaint_upvotes
FOR DELETE
USING (auth.uid() = user_id);

-- Function to increment upvote count
CREATE OR REPLACE FUNCTION public.increment_upvote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.complaints
    SET upvote_count = upvote_count + 1
    WHERE id = NEW.complaint_id;
    RETURN NEW;
END;
$$;

-- Function to decrement upvote count
CREATE OR REPLACE FUNCTION public.decrement_upvote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.complaints
    SET upvote_count = GREATEST(upvote_count - 1, 0)
    WHERE id = OLD.complaint_id;
    RETURN OLD;
END;
$$;

-- Trigger to auto-increment upvote count on insert
CREATE TRIGGER on_upvote_insert
AFTER INSERT ON public.complaint_upvotes
FOR EACH ROW
EXECUTE FUNCTION public.increment_upvote_count();

-- Trigger to auto-decrement upvote count on delete
CREATE TRIGGER on_upvote_delete
AFTER DELETE ON public.complaint_upvotes
FOR EACH ROW
EXECUTE FUNCTION public.decrement_upvote_count();

-- Add a policy to allow viewing complaints that are public (upvoted or trending)
CREATE POLICY "Anyone can view complaints for trending"
ON public.complaints
FOR SELECT
USING (true);

-- Create index for faster upvote queries
CREATE INDEX idx_complaint_upvotes_complaint_id ON public.complaint_upvotes(complaint_id);
CREATE INDEX idx_complaint_upvotes_user_id ON public.complaint_upvotes(user_id);
CREATE INDEX idx_complaints_upvote_count ON public.complaints(upvote_count DESC);

-- Add upvote milestone badges to available_badges
INSERT INTO public.available_badges (name, description, icon, category, requirement_type, requirement_value)
VALUES 
    ('Rising Voice', 'Received 5 upvotes on your complaints', 'trending-up', 'engagement', 'upvotes_received', 5),
    ('Community Champion', 'Received 25 upvotes on your complaints', 'award', 'engagement', 'upvotes_received', 25),
    ('Civic Hero', 'Received 100 upvotes on your complaints', 'crown', 'engagement', 'upvotes_received', 100),
    ('Active Voter', 'Upvoted 10 complaints', 'heart', 'engagement', 'upvotes_given', 10),
    ('Community Supporter', 'Upvoted 50 complaints', 'hand-heart', 'engagement', 'upvotes_given', 50)
ON CONFLICT DO NOTHING;

-- Enable realtime for upvotes
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaint_upvotes;