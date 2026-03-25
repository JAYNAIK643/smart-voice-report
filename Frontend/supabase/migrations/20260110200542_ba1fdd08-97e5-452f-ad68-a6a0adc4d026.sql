-- Create available_badges table to define all possible badges
CREATE TABLE public.available_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'achievement',
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_badges table to track earned badges
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.available_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS on both tables
ALTER TABLE public.available_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Available badges are viewable by everyone (public catalog)
CREATE POLICY "Anyone can view available badges"
ON public.available_badges
FOR SELECT
USING (true);

-- Users can view their own earned badges
CREATE POLICY "Users can view their own badges"
ON public.user_badges
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert badges for users (via triggers/functions)
CREATE POLICY "Allow badge inserts for authenticated users"
ON public.user_badges
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert the predefined badge types
INSERT INTO public.available_badges (name, description, icon, category, requirement_type, requirement_value) VALUES
('First Reporter', 'Submit your first complaint to the system', 'flag', 'milestone', 'complaints_submitted', 1),
('Active Citizen', 'Submit 5 complaints to help improve our community', 'users', 'engagement', 'complaints_submitted', 5),
('Community Helper', 'Have 3 of your complaints resolved successfully', 'heart-handshake', 'impact', 'complaints_resolved', 3),
('Resolution Star', 'Have 10 complaints resolved - you are making a real difference!', 'star', 'impact', 'complaints_resolved', 10),
('Feedback Champion', 'Provide feedback on 5 resolved complaints', 'message-circle', 'engagement', 'feedback_given', 5),
('Early Adopter', 'Be among the first users of the platform', 'rocket', 'special', 'early_adopter', 1);

-- Create function to check and award badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
  badge RECORD;
  user_complaint_count INTEGER;
  user_resolved_count INTEGER;
BEGIN
  -- Get user's complaint counts
  SELECT COUNT(*) INTO user_complaint_count
  FROM public.complaints
  WHERE user_id = NEW.user_id;
  
  SELECT COUNT(*) INTO user_resolved_count
  FROM public.complaints
  WHERE user_id = NEW.user_id AND status = 'resolved';
  
  -- Check each badge
  FOR badge IN SELECT * FROM public.available_badges LOOP
    -- Skip if user already has this badge
    IF EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = NEW.user_id AND badge_id = badge.id) THEN
      CONTINUE;
    END IF;
    
    -- Check if user qualifies for badge
    IF badge.requirement_type = 'complaints_submitted' AND user_complaint_count >= badge.requirement_value THEN
      INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.user_id, badge.id);
    ELSIF badge.requirement_type = 'complaints_resolved' AND user_resolved_count >= badge.requirement_value THEN
      INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.user_id, badge.id);
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to check badges on complaint insert/update
CREATE TRIGGER check_badges_on_complaint
AFTER INSERT OR UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.check_and_award_badges();

-- Enable realtime for user_badges
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_badges;