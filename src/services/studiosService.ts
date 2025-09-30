/**
 * Studios Service - Film and Television Production Management
 */
import { supabase } from '@/integrations/supabase/client';

export interface StudioProject {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  project_type:
    | 'scripted_series'
    | 'feature_film'
    | 'documentary'
    | 'reality_competition'
    | 'digital_original'
    | 'live_special';
  status: 'in_development' | 'in_production' | 'post_production' | 'completed' | 'cancelled';
  genre: string[];
  target_audience?: string | undefined;
  budget_range?: string | undefined;
  expected_duration?: number | undefined;
  production_start?: string | undefined;
  production_end?: string | undefined;
  release_date?: string | undefined;
  poster_url?: string | undefined;
  trailer_url?: string | undefined;
  attachments?: any | undefined;
  funding_goal?: number | undefined;
  current_funding: number;
  backers_count: number;
  featured: boolean;
  public_visibility: boolean;
  metadata?: any | undefined;
  created_at: string;
  updated_at: string;
  creator?: {
    name: string | undefined;
    display_name?: string | undefined;
    avatar_url?: string | undefined;
  };
  team_members?: StudioTeamMember[];
}

export interface StudioTeamMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  department?: string | undefined;
  is_lead: boolean;
  contact_info?: any | undefined;
  bio?: string | undefined;
  credits?: string[] | undefined;
  joined_at: string;
  status: 'active' | 'inactive' | 'completed';
  user?: {
    name: string | undefined;
    display_name?: string | undefined;
    avatar_url?: string | undefined;
  };
}

export interface StudioProjectUpdate {
  id: string;
  project_id: string;
  author_id: string;
  title: string;
  content: string;
  update_type: 'general' | 'production' | 'casting' | 'milestone' | 'behind_scenes';
  media_urls: string[];
  is_public: boolean;
  scheduled_publish?: string | undefined;
  published_at?: string | undefined;
  created_at: string;
  updated_at: string;
  author?: {
    name: string | undefined;
    display_name?: string | undefined;
    avatar_url?: string | undefined;
  };
}

export interface StudioContent {
  id: string;
  project_id: string;
  title: string;
  description?: string | undefined;
  content_type: 'episode' | 'season' | 'film' | 'trailer' | 'behind_scenes' | 'extra';
  episode_number?: number | undefined;
  season_number?: number | undefined;
  duration?: number | undefined;
  video_url?: string | undefined;
  thumbnail_url?: string | undefined;
  release_date?: string | undefined;
  is_premium: boolean;
  view_count: number;
  likes_count: number;
  comments_count: number;
  metadata?: any | undefined;
  created_at: string;
  updated_at: string;
}

export interface StudioPartnership {
  id: string;
  project_id: string;
  partner_name: string;
  partner_type: 'network' | 'streamer' | 'distributor' | 'financier' | 'co_producer' | 'sponsor';
  contact_email?: string | undefined;
  contract_details?: any | undefined;
  deal_points?: string[] | undefined;
  status: 'interested' | 'negotiating' | 'agreed' | 'signed' | 'cancelled';
  signed_date?: string | undefined;
  created_at: string;
  updated_at: string;
}

class StudiosService {
  /**
   * Get all public studio projects
   */
  async getPublicProjects(
    limit = 20,
    offset = 0
  ): Promise<{
    projects: StudioProject[];
    total: number;
  }> {
    const { data, error, count } = await supabase
      .from('studio_projects')
      .select(
        `
        *,
        creator:users!studio_projects_creator_id_fkey(name, display_name, avatar_url)
      `,
        { count: 'exact' }
      )
      .eq('public_visibility', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      projects: data as StudioProject[],
      total: count || 0,
    };
  }

  /**
   * Get projects by type
   */
  async getProjectsByType(
    projectType: StudioProject['project_type'],
    limit = 10
  ): Promise<StudioProject[]> {
    const { data, error } = await supabase
      .from('studio_projects')
      .select(
        `
        *,
        creator:users!studio_projects_creator_id_fkey(name, display_name, avatar_url)
      `
      )
      .eq('project_type', projectType)
      .eq('public_visibility', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as StudioProject[];
  }

  /**
   * Get featured projects
   */
  async getFeaturedProjects(limit = 6): Promise<StudioProject[]> {
    const { data, error } = await supabase
      .from('studio_projects')
      .select(
        `
        *,
        creator:users!studio_projects_creator_id_fkey(name, display_name, avatar_url)
      `
      )
      .eq('featured', true)
      .eq('public_visibility', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as StudioProject[];
  }

  /**
   * Get projects by status
   */
  async getProjectsByStatus(status: StudioProject['status'], limit = 10): Promise<StudioProject[]> {
    const { data, error } = await supabase
      .from('studio_projects')
      .select(
        `
        *,
        creator:users!studio_projects_creator_id_fkey(name, display_name, avatar_url)
      `
      )
      .eq('status', status)
      .eq('public_visibility', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as StudioProject[];
  }

  /**
   * Create a new studio project
   */
  async createProject(projectData: Partial<StudioProject>): Promise<StudioProject> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('studio_projects')
      .insert({
          ...projectData,
        creator_id: user.id,
      })
      .select(
        `
        *,
        creator:users!studio_projects_creator_id_fkey(name, display_name, avatar_url)
      `
      )
      .single();

    if (error) throw error;
    return data as StudioProject;
  }

  /**
   * Update a studio project
   */
  async updateProject(projectId: string, updates: Partial<StudioProject>): Promise<StudioProject> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('studio_projects')
      .update(updates)
      .eq('id', projectId)
      .eq('creator_id', user.id)
      .select(
        `
        *,
        creator:users!studio_projects_creator_id_fkey(name, display_name, avatar_url)
      `
      )
      .single();

    if (error) throw error;
    return data as StudioProject;
  }

  /**
   * Get project details with team and updates
   */
  async getProjectDetails(projectId: string): Promise<{
    project: StudioProject;
    team_members: StudioTeamMember[];
    recent_updates: StudioProjectUpdate[];
    content: StudioContent[];
  }> {
    // Get project
    const { data: projectData, error: projectError } = await supabase
      .from('studio_projects')
      .select(
        `
        *,
        creator:users!studio_projects_creator_id_fkey(name, display_name, avatar_url)
      `
      )
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    // Get team members
    const { data: teamData, error: teamError } = await supabase
      .from('studio_team_members')
      .select(
        `
        *,
        user:users!studio_team_members_user_id_fkey(name, display_name, avatar_url)
      `
      )
      .eq('project_id', projectId)
      .eq('status', 'active')
      .order('is_lead', { ascending: false });

    if (teamError) throw teamError;

    // Get recent updates
    const { data: updatesData, error: updatesError } = await supabase
      .from('studio_project_updates')
      .select(
        `
        *,
        author:users!studio_project_updates_author_id_fkey(name, display_name, avatar_url)
      `
      )
      .eq('project_id', projectId)
      .eq('is_public', true)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(5);

    if (updatesError) throw updatesError;

    // Get content
    const { data: contentData, error: contentError } = await supabase
      .from('studio_content')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (contentError) throw contentError;

    return {
      project: projectData as StudioProject,
      team_members: teamData as StudioTeamMember[],
      recent_updates: updatesData as StudioProjectUpdate[],
      content: contentData as StudioContent[],
    };
  }

  /**
   * Add team member to project
   */
  async addTeamMember(
    projectId: string,
    userId: string,
    role: string,
    department?: string,
    isLead = false
  ): Promise<StudioTeamMember> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    // Verify user owns the project
    const { data: project } = await supabase
      .from('studio_projects')
      .select('creator_id')
      .eq('id', projectId)
      .eq('creator_id', user.id)
      .single();

    if (!project) throw new Error('Project not found or unauthorized');

    const { data, error } = await supabase
      .from('studio_team_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role,
        department,
        is_lead: isLead,
      })
      .select(
        `
        *,
        user:users!studio_team_members_user_id_fkey(name, display_name, avatar_url)
      `
      )
      .single();

    if (error) throw error;
    return data as StudioTeamMember;
  }

  /**
   * Create project update
   */
  async createProjectUpdate(
    projectId: string,
    title: string,
    content: string,
    updateType: StudioProjectUpdate['update_type'] = 'general',
    mediaUrls: string[] = [],
    isPublic = true,
    scheduledPublish?: string
  ): Promise<StudioProjectUpdate> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('studio_project_updates')
      .insert({
        project_id: projectId,
        author_id: user.id,
        title,
        content,
        update_type: updateType,
        media_urls: mediaUrls,
        is_public: isPublic,
        scheduled_publish: scheduledPublish,
        published_at: scheduledPublish || new Date().toISOString(),
      })
      .select(
        `
        *,
        author:users!studio_project_updates_author_id_fkey(name, display_name, avatar_url)
      `
      )
      .single();

    if (error) throw error;
    return data as StudioProjectUpdate;
  }

  /**
   * Fund a studio project
   */
  async fundProject(
    projectId: string,
    amount: number,
    rewardTier?: string,
    backerMessage?: string
  ): Promise<any> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('studio_project_funding')
      .insert({
        project_id: projectId,
        backer_id: user.id,
        amount: amount * 100, // Convert to cents
        reward_tier: rewardTier,
        backer_message: backerMessage,
        status: 'confirmed', // Simplified - in real app would integrate with payment
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get studio analytics
   */
  async getStudioAnalytics(): Promise<{
    total_projects: number;
    active_projects: number;
    completed_projects: number;
    total_funding: number;
    total_backers: number;
    content_hours: number;
  }> {
    const { data: projects, error } = await supabase
      .from('studio_projects')
      .select('status, current_funding, backers_count, expected_duration')
      .eq('public_visibility', true);

    if (error) throw error;

    const analytics = {
      total_projects: projects.length,
      active_projects: projects.filter(p =>
        ['in_development', 'in_production', 'post_production'].includes(p.status)
      ).length,
      completed_projects: projects.filter(p => p.status === 'completed').length,
      total_funding: projects.reduce((sum, p) => sum + (p.current_funding || 0), 0) / 100, // Convert from cents
      total_backers: projects.reduce((sum, p) => sum + (p.backers_count || 0), 0),
      content_hours: projects.reduce((sum, p) => sum + (p.expected_duration || 0) / 60, 0), // Convert minutes to hours
    };

    return analytics;
  }

  /**
   * Search projects
   */
  async searchProjects(
    query: string,
    filters?: {
      project_type?: string;
      status?: string;
      genre?: string;
    }
  ): Promise<StudioProject[]> {
    let queryBuilder = supabase
      .from('studio_projects')
      .select(
        `
        *,
        creator:users!studio_projects_creator_id_fkey(name, display_name, avatar_url)
      `
      )
      .eq('public_visibility', true)
      .ilike('title', `%${query}%`);

    if (filters?.project_type) {
      queryBuilder = queryBuilder.eq('project_type', filters.project_type);
    }

    if (filters?.status) {
      queryBuilder = queryBuilder.eq('status', filters.status);
    }

    if (filters?.genre) {
      queryBuilder = queryBuilder.contains('genre', [filters.genre]);
    }

    const { data, error } = await queryBuilder.order('created_at', { ascending: false }).limit(20);

    if (error) throw error;
    return data as StudioProject[];
  }

  /**
   * Get user's projects (for creators)
   */
  async getUserProjects(): Promise<StudioProject[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('studio_projects')
      .select(
        `
        *,
        creator:users!studio_projects_creator_id_fkey(name, display_name, avatar_url)
      `
      )
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as StudioProject[];
  }
}

export const studiosService = new StudiosService();
export default studiosService;
