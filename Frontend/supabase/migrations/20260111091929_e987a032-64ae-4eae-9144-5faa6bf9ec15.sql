-- Update the check_and_award_badges function to include upvote badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  badge RECORD;
  user_complaint_count INTEGER;
  user_resolved_count INTEGER;
  user_upvotes_received INTEGER;
  user_upvotes_given INTEGER;
  target_user_id UUID;
BEGIN
  -- Determine which user to check badges for
  IF TG_TABLE_NAME = 'complaints' THEN
    target_user_id := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'complaint_upvotes' THEN
    target_user_id := NEW.user_id;
  ELSE
    RETURN NEW;
  END IF;
  
  -- Get user's complaint counts
  SELECT COUNT(*) INTO user_complaint_count
  FROM public.complaints
  WHERE user_id = target_user_id;
  
  SELECT COUNT(*) INTO user_resolved_count
  FROM public.complaints
  WHERE user_id = target_user_id AND status = 'resolved';
  
  -- Get upvotes received (sum of upvote_count on user's complaints)
  SELECT COALESCE(SUM(upvote_count), 0) INTO user_upvotes_received
  FROM public.complaints
  WHERE user_id = target_user_id;
  
  -- Get upvotes given by user
  SELECT COUNT(*) INTO user_upvotes_given
  FROM public.complaint_upvotes
  WHERE user_id = target_user_id;
  
  -- Check each badge
  FOR badge IN SELECT * FROM public.available_badges LOOP
    -- Skip if user already has this badge
    IF EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = target_user_id AND badge_id = badge.id) THEN
      CONTINUE;
    END IF;
    
    -- Check if user qualifies for badge
    IF badge.requirement_type = 'complaints_submitted' AND user_complaint_count >= badge.requirement_value THEN
      INSERT INTO public.user_badges (user_id, badge_id) VALUES (target_user_id, badge.id);
    ELSIF badge.requirement_type = 'complaints_resolved' AND user_resolved_count >= badge.requirement_value THEN
      INSERT INTO public.user_badges (user_id, badge_id) VALUES (target_user_id, badge.id);
    ELSIF badge.requirement_type = 'upvotes_received' AND user_upvotes_received >= badge.requirement_value THEN
      INSERT INTO public.user_badges (user_id, badge_id) VALUES (target_user_id, badge.id);
    ELSIF badge.requirement_type = 'upvotes_given' AND user_upvotes_given >= badge.requirement_value THEN
      INSERT INTO public.user_badges (user_id, badge_id) VALUES (target_user_id, badge.id);
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for checking badges on upvote insert
DROP TRIGGER IF EXISTS on_upvote_check_badges ON public.complaint_upvotes;
CREATE TRIGGER on_upvote_check_badges
AFTER INSERT ON public.complaint_upvotes
FOR EACH ROW
EXECUTE FUNCTION public.check_and_award_badges();

-- Also check badges when upvote count changes on complaints
DROP TRIGGER IF EXISTS on_complaint_upvote_count_change ON public.complaints;
CREATE TRIGGER on_complaint_upvote_count_change
AFTER UPDATE OF upvote_count ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.check_and_award_badges();