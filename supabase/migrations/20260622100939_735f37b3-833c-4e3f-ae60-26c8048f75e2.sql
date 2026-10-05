
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'custom' CHECK (category IN ('engagement','success','announcement','custom','re_engagement','onboarding')),
  subject text NOT NULL,
  preheader text,
  body_html text NOT NULL,
  body_text text,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_system boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage templates" ON public.email_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.email_audiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('all_users','course_enrollment','custom_list')),
  course_id text,
  course_name text,
  filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  member_count integer NOT NULL DEFAULT 0,
  last_refreshed_at timestamptz,
  archived boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_audiences TO authenticated;
GRANT ALL ON public.email_audiences TO service_role;
ALTER TABLE public.email_audiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage audiences" ON public.email_audiences FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  audience_id uuid REFERENCES public.email_audiences(id) ON DELETE SET NULL,
  subject text NOT NULL,
  preheader text,
  body_html text NOT NULL,
  body_text text,
  from_name text,
  reply_to text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','paused','failed','cancelled')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  recipient_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  delivered_count integer NOT NULL DEFAULT 0,
  opened_count integer NOT NULL DEFAULT 0,
  clicked_count integer NOT NULL DEFAULT 0,
  bounced_count integer NOT NULL DEFAULT 0,
  complained_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_campaigns_scheduled ON public.email_campaigns(scheduled_for) WHERE status='scheduled';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_campaigns TO authenticated;
GRANT ALL ON public.email_campaigns TO service_role;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage campaigns" ON public.email_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.email_campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  email text NOT NULL,
  email_lower text GENERATED ALWAYS AS (lower(email)) STORED,
  name text,
  user_id text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','opened','clicked','bounced','complained','failed','unsubscribed')),
  resend_id text,
  error_message text,
  bounce_type text,
  open_count integer NOT NULL DEFAULT 0,
  click_count integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_recipients_campaign ON public.email_campaign_recipients(campaign_id);
CREATE INDEX idx_recipients_campaign_status ON public.email_campaign_recipients(campaign_id, status);
CREATE INDEX idx_recipients_email_lower ON public.email_campaign_recipients(email_lower);
CREATE INDEX idx_recipients_resend ON public.email_campaign_recipients(resend_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_campaign_recipients TO authenticated;
GRANT ALL ON public.email_campaign_recipients TO service_role;
ALTER TABLE public.email_campaign_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage recipients" ON public.email_campaign_recipients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
ALTER TABLE public.email_campaign_recipients REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_campaign_recipients;

CREATE TABLE public.email_campaign_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES public.email_campaign_recipients(id) ON DELETE CASCADE,
  recipient_email text,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_campaign ON public.email_campaign_events(campaign_id);
CREATE INDEX idx_events_type ON public.email_campaign_events(event_type);
GRANT SELECT, INSERT ON public.email_campaign_events TO authenticated;
GRANT ALL ON public.email_campaign_events TO service_role;
ALTER TABLE public.email_campaign_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins view events" ON public.email_campaign_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins insert events" ON public.email_campaign_events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
ALTER TABLE public.email_campaign_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_campaign_events;

CREATE TRIGGER trg_email_templates_updated BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_email_audiences_updated BEFORE UPDATE ON public.email_audiences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_email_campaigns_updated BEFORE UPDATE ON public.email_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_email_recipients_updated BEFORE UPDATE ON public.email_campaign_recipients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.email_templates (name, description, category, subject, preheader, body_html, body_text, variables, is_system) VALUES
('Welcome to Maarifasasa Academy','Sent right after a learner joins.','onboarding','Welcome to Maarifasasa, {{first_name}} 👋','Your learning journey starts now.',
 '<div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;color:#0f172a"><h1 style="font-size:24px;margin:0 0 16px">Welcome, {{first_name}}!</h1><p style="font-size:16px;line-height:1.6">We are thrilled to have you in the Academy. You now have everything you need to learn the most in-demand digital skills and start earning.</p><p><a href="{{cta_url}}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Open your dashboard</a></p><p style="color:#64748b;font-size:14px">Knowledge Now. Opportunity Everywhere.</p></div>',
 'Welcome, {{first_name}}! Open your dashboard: {{cta_url}}',
 '["first_name","cta_url"]'::jsonb, true),
('Complete your first lesson','Gentle nudge to start the first lesson.','engagement','Ready for lesson 1, {{first_name}}?','Just 10 minutes to your first win.',
 '<div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;color:#0f172a"><h1 style="font-size:22px;margin:0 0 16px">Your first lesson is waiting</h1><p style="font-size:16px;line-height:1.6">Hey {{first_name}}, the first lesson of <strong>{{course_name}}</strong> takes about 10 minutes. Tap in now.</p><p><a href="{{cta_url}}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Start lesson 1</a></p></div>',
 'Hey {{first_name}}, your first lesson of {{course_name}} is waiting: {{cta_url}}',
 '["first_name","course_name","cta_url"]'::jsonb, true),
('You are halfway there','Milestone email when learner hits 50%.','success','You are halfway through {{course_name}}!','Keep the momentum going.',
 '<div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;color:#0f172a"><h1 style="font-size:22px;margin:0 0 16px">Halfway, {{first_name}}!</h1><p style="font-size:16px;line-height:1.6">You have completed 50% of <strong>{{course_name}}</strong>. Finish strong.</p><p><a href="{{cta_url}}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Continue learning</a></p></div>',
 'Halfway through {{course_name}}! Continue: {{cta_url}}',
 '["first_name","course_name","cta_url"]'::jsonb, true),
('Congrats on completing the course','Course completion celebration.','success','You completed {{course_name}}!','Your certificate is ready.',
 '<div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;color:#0f172a"><h1 style="font-size:24px;margin:0 0 16px">Congratulations, {{first_name}}!</h1><p style="font-size:16px;line-height:1.6">You completed <strong>{{course_name}}</strong>. Your certificate is ready to share with employers.</p><p><a href="{{cta_url}}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Get my certificate</a></p></div>',
 'Congrats {{first_name}}! You completed {{course_name}}. Get your certificate: {{cta_url}}',
 '["first_name","course_name","cta_url"]'::jsonb, true),
('We miss you, come back','Re-engagement for inactive learners.','re_engagement','{{first_name}}, your seat in {{course_name}} is still open','Pick up right where you left off.',
 '<div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;color:#0f172a"><h1 style="font-size:22px;margin:0 0 16px">We have missed you</h1><p style="font-size:16px;line-height:1.6">Hey {{first_name}}, your progress in <strong>{{course_name}}</strong> is saved.</p><p><a href="{{cta_url}}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Resume my course</a></p></div>',
 'Hey {{first_name}}, resume {{course_name}}: {{cta_url}}',
 '["first_name","course_name","cta_url"]'::jsonb, true),
('New cohort starting soon','Announcement for upcoming cohorts.','announcement','New cohort: {{course_name}} starts {{start_date}}','Reserve your spot today.',
 '<div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;color:#0f172a"><h1 style="font-size:22px;margin:0 0 16px">A new cohort is opening</h1><p style="font-size:16px;line-height:1.6">{{first_name}}, the next cohort of <strong>{{course_name}}</strong> kicks off on <strong>{{start_date}}</strong>. Seats are limited.</p><p><a href="{{cta_url}}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Reserve my seat</a></p></div>',
 'A new cohort of {{course_name}} starts {{start_date}}. Reserve: {{cta_url}}',
 '["first_name","course_name","start_date","cta_url"]'::jsonb, true),
('Your certificate is ready','Certificate-ready notification.','success','{{first_name}}, your certificate is ready','Download and share.',
 '<div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;color:#0f172a"><h1 style="font-size:22px;margin:0 0 16px">Your certificate is ready</h1><p style="font-size:16px;line-height:1.6">{{first_name}}, your certificate for <strong>{{course_name}}</strong> is ready. Add it to LinkedIn.</p><p><a href="{{cta_url}}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Download certificate</a></p></div>',
 '{{first_name}}, your certificate for {{course_name}} is ready: {{cta_url}}',
 '["first_name","course_name","cta_url"]'::jsonb, true);
