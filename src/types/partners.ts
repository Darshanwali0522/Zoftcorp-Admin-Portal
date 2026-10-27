export type ContentStatus = 'draft' | 'published';

export interface Partner {
  id: string;
  name: string;
  slug: string;
  description: string;
  details?: string | null;
  logo_url: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface PartnerFormValues {
  name: string;
  slug?: string;
  description: string;
  details?: string;
  logo_url: string;
  status: ContentStatus;
}
