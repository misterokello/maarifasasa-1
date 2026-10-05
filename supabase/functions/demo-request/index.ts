import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';
import { Resend } from 'npm:resend@4.0.0';

const BodySchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  work_email: z.string().trim().email().max(255),
  organisation: z.string().trim().min(2).max(120),
  role: z.string().trim().max(120).nullish(),
  phone: z.string().trim().max(30).nullish(),
  interest: z.string().trim().max(120).nullish(),
  message: z.string().trim().max(1000).nullish(),
  preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferred_time: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().trim().max(80).nullish(),
  source: z.string().trim().max(80).nullish(),
  experiments: z.record(z.string()).default({}),
});

const esc = (s: string) => s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');

/** Builds a 45-minute VEVENT for the requested slot, in the visitor's timezone. */
function buildIcs(input: {
  uid: string;
  name: string;
  email: string;
  organisation: string;
  date: string;
  time: string;
  timezone?: string | null;
}) {
  const [h, m] = input.time.split(':').map(Number);
  const start = `${input.date.replace(/-/g, '')}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
  const endMinutes = h * 60 + m + 45;
  const end = `${input.date.replace(/-/g, '')}T${String(Math.floor(endMinutes / 60) % 24)
    .padStart(2, '0')}${String(endMinutes % 60).padStart(2, '0')}00`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const tz = input.timezone && input.timezone.length > 0 ? input.timezone : null;
  const dt = (value: string) => (tz ? `;TZID=${tz}:${value}` : `:${value}`);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Maarifasasa//Demo Request//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${input.uid}@maarifasasa.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART${dt(start)}`,
    `DTEND${dt(end)}`,
    'SUMMARY:Maarifasasa enterprise demo',
    `DESCRIPTION:${esc(
      `Walkthrough of Maarifasasa's talent pipeline, cohort design and outcome reporting for ${input.organisation}. Our partnerships team will confirm and share the meeting link.`,
    )}`,
    'LOCATION:Online (link to follow)',
    'ORGANIZER;CN=Maarifasasa Partnerships:mailto:partnerships@maarifasasa.com',
    `ATTENDEE;CN=${esc(input.name)};RSVP=TRUE:mailto:${input.email}`,
    'STATUS:TENTATIVE',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Maarifasasa enterprise demo',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const body = parsed.data;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: inserted, error } = await supabase
      .from('demo_requests')
      .insert({
        full_name: body.full_name,
        work_email: body.work_email,
        organisation: body.organisation,
        role: body.role ?? null,
        phone: body.phone ?? null,
        interest: body.interest ?? null,
        message: body.message ?? null,
        audience: 'enterprise',
        preferred_date: body.preferred_date,
        preferred_time: body.preferred_time,
        timezone: body.timezone ?? null,
        source: body.source ?? null,
        experiments: body.experiments,
      })
      .select('id')
      .single();

    if (error) {
      console.error('demo_requests insert failed:', error.message);
      return new Response(JSON.stringify({ error: 'Could not save your request', details: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ics = buildIcs({
      uid: inserted.id,
      name: body.full_name,
      email: body.work_email,
      organisation: body.organisation,
      date: body.preferred_date,
      time: body.preferred_time,
      timezone: body.timezone,
    });

    const resendKey = Deno.env.get('RESEND_API_KEY');
    let emailed = false;
    if (resendKey) {
      const resend = new Resend(resendKey);
      const when = `${body.preferred_date} at ${body.preferred_time}${body.timezone ? ` (${body.timezone})` : ''}`;
      const html = `
        <div style="font-family:Inter,Arial,sans-serif;color:#1f2937;line-height:1.6">
          <h2 style="color:#4f46e5;margin:0 0 12px">Your demo request is in</h2>
          <p>Hi ${body.full_name.split(' ')[0]},</p>
          <p>Thank you for requesting a demo of the Maarifasasa workforce development platform.</p>
          <table style="border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:4px 12px 4px 0"><strong>Requested slot</strong></td><td>${when}</td></tr>
            <tr><td style="padding:4px 12px 4px 0"><strong>Organisation</strong></td><td>${body.organisation}</td></tr>
            ${body.interest ? `<tr><td style="padding:4px 12px 4px 0"><strong>Interest</strong></td><td>${body.interest}</td></tr>` : ''}
          </table>
          <p>A calendar invitation is attached — open <strong>maarifasasa-demo.ics</strong> to add it straight to your calendar.</p>
          <p>Our partnerships team will confirm the time and share the meeting link. Simply reply if you need a different slot.</p>
          <p style="margin-top:24px">Warm regards,<br/>Maarifasasa Partnerships</p>
        </div>`;

      const { error: emailError } = await resend.emails.send({
        from: 'Maarifasasa <noreply@maarifasasa.com>',
        to: [body.work_email],
        subject: 'Your Maarifasasa demo request — calendar invite attached',
        html,
        attachments: [
          {
            filename: 'maarifasasa-demo.ics',
            content: btoa(ics),
            contentType: 'text/calendar; charset=utf-8; method=REQUEST',
          },
        ],
      });

      if (emailError) {
        console.error('Demo confirmation email failed:', emailError);
      } else {
        emailed = true;
      }
    }

    return new Response(JSON.stringify({ id: inserted.id, emailed }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error('demo-request failed:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
