UPDATE public.products SET category = 'program' WHERE lower(category) IN ('accelerator','programme','program','training');
UPDATE public.products SET category = 'bootcamp' WHERE lower(category) = 'bootcamp';
UPDATE public.products SET category = 'certificate' WHERE lower(category) = 'certificate';