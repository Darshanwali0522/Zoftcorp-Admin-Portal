export type ContentStatus = 'draft' | 'published';

export interface ClientReview {
  id: string;
  client_name: string;
  company_name?: string | null;
  rating: number; // 1 to 5 integer
  review_text: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface ReviewFormValues {
  client_name: string;
  company_name?: string;
  rating: number; // 1 to 5
  review_text: string;
  status: ContentStatus;
}
