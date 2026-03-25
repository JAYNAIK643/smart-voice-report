-- Create digest preferences table
CREATE TABLE IF NOT EXISTS public.digest_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  frequency VARCHAR(20) DEFAULT 'daily' CHECK (frequency IN ('never', 'daily', 'weekly')),
  last_digest_sent TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_digest_preferences_user_id 
  ON public.digest_preferences (user_id);

CREATE INDEX IF NOT EXISTS idx_digest_preferences_frequency 
  ON public.digest_preferences (frequency);

CREATE INDEX IF NOT EXISTS idx_digest_preferences_active 
  ON public.digest_preferences (is_active);

-- Enable RLS
ALTER TABLE public.digest_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own digest preferences" 
  ON public.digest_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own digest preferences" 
  ON public.digest_preferences FOR ALL 
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_digest_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_digest_preferences_updated_at_trigger
  BEFORE UPDATE ON public.digest_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_digest_preferences_updated_at();

-- Add digested column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS digested BOOLEAN DEFAULT false;

-- Create index for digested notifications
CREATE INDEX IF NOT EXISTS idx_notifications_digested 
  ON public.notifications (user_id, digested, created_at);

-- Insert default digest preferences for existing users
INSERT INTO public.digest_preferences (user_id, frequency, is_active)
SELECT id, 'daily', true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.digest_preferences)
ON CONFLICT (user_id) DO NOTHING;