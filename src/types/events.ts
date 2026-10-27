export type ContentStatus = 'draft' | 'published';

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  event_date: string; // ISO date string e.g. '2026-11-15T15:00:00Z'
  location?: string | null;
  event_type?: string | null;
  registration_url?: string | null;
  recording_url?: string | null;
  photos: string[];
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface EventFormValues {
  title: string;
  slug?: string;
  description: string;
  event_date: string;
  location?: string;
  event_type?: string;
  registration_url?: string;
  recording_url?: string;
  photos: string[];
  status: ContentStatus;
}
