-- Create complaint_feedback table for storing ratings and feedback
CREATE TABLE public.complaint_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(complaint_id, user_id)
);

-- Enable RLS
ALTER TABLE public.complaint_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Public read for transparency
CREATE POLICY "Anyone can view feedback"
ON public.complaint_feedback FOR SELECT
USING (true);

-- Users can create feedback for their own resolved complaints
CREATE POLICY "Users can create feedback for own complaints"
ON public.complaint_feedback FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.complaints c 
    WHERE c.id = complaint_feedback.complaint_id 
    AND c.user_id = auth.uid()
    AND c.status = 'resolved'
  )
);

-- Users can update their own feedback
CREATE POLICY "Users can update own feedback"
ON public.complaint_feedback FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_complaint_feedback_complaint ON public.complaint_feedback(complaint_id);
CREATE INDEX idx_complaint_feedback_user ON public.complaint_feedback(user_id);
CREATE INDEX idx_complaint_feedback_rating ON public.complaint_feedback(rating);

-- Add feedback tracking columns to complaints
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS feedback_submitted BOOLEAN DEFAULT false;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS feedback_skipped BOOLEAN DEFAULT false;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_complaint_feedback_updated_at
BEFORE UPDATE ON public.complaint_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_feedback_updated_at();

-- Enable realtime for feedback
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaint_feedback;