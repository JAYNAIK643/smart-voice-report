-- Create emergency broadcasts table
CREATE TABLE IF NOT EXISTS public.emergency_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'high' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  target_roles TEXT[], -- Array of roles to target
  target_wards TEXT[], -- Array of wards to target
  exclude_users UUID[], -- Array of user IDs to exclude
  channels TEXT[] DEFAULT ARRAY['email', 'sms'], -- Channels to use
  bypass_preferences BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed', 'cancelled')),
  total_recipients INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Create broadcast deliveries table for tracking
CREATE TABLE IF NOT EXISTS public.broadcast_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES public.emergency_broadcasts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  channel VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  failure_reason TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emergency_broadcasts_status 
  ON public.emergency_broadcasts (status);

CREATE INDEX IF NOT EXISTS idx_emergency_broadcasts_created_at 
  ON public.emergency_broadcasts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emergency_broadcasts_severity 
  ON public.emergency_broadcasts (severity);

CREATE INDEX IF NOT EXISTS idx_broadcast_deliveries_broadcast_id 
  ON public.broadcast_deliveries (broadcast_id);

CREATE INDEX IF NOT EXISTS idx_broadcast_deliveries_user_id 
  ON public.broadcast_deliveries (user_id);

CREATE INDEX IF NOT EXISTS idx_broadcast_deliveries_status 
  ON public.broadcast_deliveries (status);

CREATE INDEX IF NOT EXISTS idx_broadcast_deliveries_channel 
  ON public.broadcast_deliveries (channel);

-- Enable RLS
ALTER TABLE public.emergency_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_deliveries ENABLE ROW LEVEL SECURITY;

-- Create policies for emergency broadcasts
CREATE POLICY "Admins can manage emergency broadcasts" 
  ON public.emergency_broadcasts FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  ));

CREATE POLICY "Authenticated users can view emergency broadcasts" 
  ON public.emergency_broadcasts FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Create policies for broadcast deliveries
CREATE POLICY "Admins can view broadcast deliveries" 
  ON public.broadcast_deliveries FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  ));

CREATE POLICY "Users can view their own delivery records" 
  ON public.broadcast_deliveries FOR SELECT 
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_emergency_broadcasts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_emergency_broadcasts_updated_at_trigger
  BEFORE UPDATE ON public.emergency_broadcasts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_emergency_broadcasts_updated_at();

-- Insert emergency broadcast templates
INSERT INTO public.notification_templates (name, channel, type, language, subject, content, variables) VALUES
-- Emergency Email Template
('emergency_broadcast', 'email', 'emergency_broadcast', 'en',
 '🚨 EMERGENCY: {{title}}',
 '<div style="border-left: 4px solid #dc2626; padding: 20px; background-color: #fef2f2;">
  <h2 style="color: #dc2626; margin-top: 0;">🚨 EMERGENCY ANNOUNCEMENT</h2>
  <h3>{{title}}</h3>
  <p style="font-size: 16px; line-height: 1.6;">{{message}}</p>
  <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
    <strong>Severity:</strong> {{severity}}
  </p>
  <p style="font-size: 12px; color: #9ca3af;">
    This is an official emergency communication. Please take appropriate action immediately.
  </p>
</div>',
'{"required": ["title", "message", "severity"]}'),

-- Emergency SMS Template
('emergency_broadcast_sms', 'sms', 'emergency_broadcast', 'en',
 null,
 '🚨 EMERGENCY: {{title}} - {{message}} Severity: {{severity}}',
'{"required": ["title", "message", "severity"]}'),

-- Emergency Push Template
('emergency_broadcast_push', 'push', 'emergency_broadcast', 'en',
 null,
 '🚨 EMERGENCY: {{title}}',
'{"required": ["title"]}'),

-- Critical Alert Template (highest priority)
('critical_alert', 'email', 'critical_alert', 'en',
 '🔴 CRITICAL SYSTEM ALERT',
 '<div style="border-left: 4px solid #b91c1c; padding: 20px; background-color: #fee2e2;">
  <h2 style="color: #b91c1c; margin-top: 0;">🔴 CRITICAL ALERT</h2>
  <h3>{{title}}</h3>
  <p style="font-size: 16px; line-height: 1.6;">{{message}}</p>
  <div style="background-color: #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; font-weight: bold;">IMMEDIATE ACTION REQUIRED</p>
    <p style="margin: 5px 0 0 0;">Please respond to this alert as soon as possible.</p>
  </div>
</div>',
'{"required": ["title", "message"]}'),

('critical_alert_sms', 'sms', 'critical_alert', 'en',
 null,
 '🔴 CRITICAL: {{title}} - {{message}} ACTION REQUIRED',
'{"required": ["title", "message"]}'),

('critical_alert_push', 'push', 'critical_alert', 'en',
 null,
 '🔴 CRITICAL ALERT: {{title}}',
'{"required": ["title"]}'),

-- Digest Notification Template
('digest_notification', 'email', 'digest', 'en',
 'Your {{frequency}} Notification Digest',
 '<div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
  <div style="background-color: #f8fafc; padding: 30px; border-radius: 12px;">
    <h2 style="color: #1e293b; margin-top: 0;">Hello {{userName}}!</h2>
    <p style="color: #64748b; font-size: 16px;">Here''s your {{frequency}} notification digest:</p>
    <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      {{{content}}}
    </div>
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{siteUrl}}/notifications" 
         style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        View All Notifications
      </a>
    </div>
    <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;">
      You can adjust your digest preferences in your account settings.
    </p>
  </div>
</div>',
'{"required": ["userName", "content", "frequency"]}')
ON CONFLICT DO NOTHING;