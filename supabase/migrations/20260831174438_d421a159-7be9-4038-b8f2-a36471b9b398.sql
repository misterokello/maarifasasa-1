-- Daily org-wide Thinkific completion sync
select cron.unschedule('thinkific-completion-sync-daily')
where exists (select 1 from cron.job where jobname = 'thinkific-completion-sync-daily');

select cron.schedule(
  'thinkific-completion-sync-daily',
  '30 2 * * *',
  $$
  select net.http_post(
    url := 'https://arrmktdasakaqcxdducu.supabase.co/functions/v1/thinkific-completion-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', 'CGVHJjYv88PjBRqZLwnzumeBOjTrWCidftljL87qfGGai36V'
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);

-- Live updates for the admin completion feed (no PII columns on this table)
alter table public.enrollments replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'enrollments'
  ) then
    alter publication supabase_realtime add table public.enrollments;
  end if;
end $$;