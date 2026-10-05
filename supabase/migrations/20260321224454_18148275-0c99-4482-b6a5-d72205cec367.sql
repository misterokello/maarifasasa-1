ALTER TABLE public.popups DROP CONSTRAINT popups_popup_type_check;
ALTER TABLE public.popups ADD CONSTRAINT popups_popup_type_check CHECK (popup_type IN ('promotional', 'banner', 'tally_embed'));