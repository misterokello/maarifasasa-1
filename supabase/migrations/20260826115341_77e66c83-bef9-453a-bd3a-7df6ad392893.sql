INSERT INTO public.popups (title, popup_type, heading, tally_form_id, display_delay_seconds, show_once_per_session, is_active)
SELECT 'DigiFarmer Tally Form', 'tally_embed', 'Join DigiFarmer', 'wQgeqY', 10, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.popups WHERE tally_form_id = 'wQgeqY');