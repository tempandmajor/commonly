export interface JobListing {
  id?: string | undefined;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
  description: string;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}
