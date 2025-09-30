import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  title: string;
  description: string;
  type: string;
  year: string;
  image: string;
  trailerUrl?: string | undefined;
  featured: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  position: string;
  bio: string;
  image: string;
}

/**
 * Fetches featured projects from the projects table
 * @returns Array of Project objects
 */
export const fetchFeaturedProjects = async (): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('featured', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      type: item.type || 'Other',
      year: item.year || new Date().getFullYear().toString(),
      image: item.image_url,
      trailerUrl: item.trailer_url,
      featured: item.featured || false,
    }));
  } catch (error) {
    console.error('Error fetching featured projects:', error);
    return [];
  }
};

/**
 * Fetches team members from the ContentTest table
 * Uses the 'team_member' type in the body JSON field
 * @returns Array of TeamMember objects
 */
export const fetchTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    // Query ContentTest table for team member entries
    const { data, error } = await supabase
      .from('ContentTest')
      .select('*')
      .like('body', '%"type":"team_member"%')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Parse team member data from the body field
    const teamMembers: TeamMember[] = (data || [])
      .map(item => {
        try {
          const memberData = JSON.parse(item.body || '{}') as any;

          if (memberData.type === 'team_member') {
            return {
              id: item.id,
              name: item.title || memberData.name || '',
              position: memberData.position || '',
              bio: memberData.bio || '',
              image: memberData.image || null, // No default image - let components handle missing images
            };
          }
          return null;
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean) as TeamMember[];

    return teamMembers;
  } catch (error) {
    return [];
  }
};

export const submitContactForm = async (formData: {
  name: string;
  email: string;
  message: string;
  projectType?: string;
}) => {
  try {
    // Store contact form in contact_forms table
    const { data, error } = await supabase
      .from('contact_forms')
      .insert([
        {
          name: formData.name,
          email: formData.email,
          message: formData.message,
          project_type: formData.projectType,
          status: 'new',
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    return data[0];
  } catch (error) {
    console.error('Error submitting contact form:', error);
    throw error;
  }
};
