export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: 'certificate' | 'bootcamp' | 'program';
  program_type?: 'talent_accelerator' | 'partner_program' | null;
  price_ugx: number;
  price_usd: number;
  duration: string | null;
  start_date: string | null;
  end_date: string | null;
  stripe_price_id: string | null;
  thinkific_course_id: string | null;
  thinkific_course_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ProductCategory = 'certificate' | 'bootcamp' | 'program';

export type ProgramType = 'talent_accelerator' | 'partner_program';

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  talent_accelerator: 'Talent Accelerator',
  partner_program: 'Partner Program',
};
