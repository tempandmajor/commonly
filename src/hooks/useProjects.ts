import { useDataFetch } from './useDataFetch';
import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  name: string;
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'completed' | 'draft';
  createdAt: string;
  updatedAt?: string | undefined;
  userId?: string | undefined;
  image?: string | undefined;
  tags?: string[] | undefined;
}

const fetchProjects = async (): Promise<Project[]> => {
  try {
    // Get all projects with their tags
    const { data, error } = await supabase
      .from('projects')
      .select(
        `
        id,
        name,
        title,
        description,
        status,
        created_at,
        updated_at,
        user_id,
        image_url,
        project_tags (tag)
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    // Transform data to match our Project interface
    return (data || []).map(project => ({
      id: project.id,
      name: project.name,
      title: project.title,
      description: project.description,
      status: project.status,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      userId: project.user_id,
      image: project.image_url,
      tags: project.project_tags?.map((pt: { tag: string }) => pt.tag) || [],
    }));
  } catch (error) {
    return [];
  }
};

export const useProjects = () => {
  const { data, isLoading, error } = useDataFetch(
    fetchProjects,
    [], // dependencies
    {
      errorMessage: 'Failed to load projects',
    }
  );

  return {
    projects: data || [],
    isLoading,
    error,
  };
};
