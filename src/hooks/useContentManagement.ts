import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PageData, Location } from '@/types/admin';

export const useContentManagement = () => {
  const [pages, setPages] = useState<PageData[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('content_pages')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setPages((data || []).map(page => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        content: page.content,
        subtitle: page.subtitle,
        published: page.published || false,
        createdAt: new Date(page.created_at),
        updatedAt: new Date(page.updated_at),
      })));
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast.error('Failed to load pages');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('city');

      if (error) throw error;

      setLocations((data || []).map(loc => ({
        id: loc.id,
        city: loc.city,
        state: loc.state,
        country: loc.country,
        createdAt: new Date(loc.created_at),
        updatedAt: new Date(loc.updated_at),
      })));
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const savePage = async (page: Partial<PageData>) => {
    try {
      if (page.id) {
        const { error } = await supabase
          .from('content_pages')
          .update({
            title: page.title,
            slug: page.slug,
            content: page.content,
            subtitle: page.subtitle,
            published: page.published,
          })
          .eq('id', page.id);

        if (error) throw error;
        toast.success('Page updated successfully');
      } else {
        const { error } = await supabase
          .from('content_pages')
          .insert({
            title: page.title,
            slug: page.slug,
            content: page.content,
            subtitle: page.subtitle,
            published: page.published || false,
          });

        if (error) throw error;
        toast.success('Page created successfully');
      }

      await fetchPages();
    } catch (error: any) {
      console.error('Error saving page:', error);
      toast.error(error.message || 'Failed to save page');
    }
  };

  const deletePage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Page deleted successfully');
      await fetchPages();
    } catch (error: any) {
      console.error('Error deleting page:', error);
      toast.error('Failed to delete page');
    }
  };

  const saveLocation = async (location: Partial<Location>) => {
    try {
      if (location.id) {
        const { error } = await supabase
          .from('locations')
          .update({
            city: location.city,
            state: location.state,
            country: location.country,
          })
          .eq('id', location.id);

        if (error) throw error;
        toast.success('Location updated successfully');
      } else {
        const { error } = await supabase
          .from('locations')
          .insert({
            city: location.city,
            state: location.state,
            country: location.country,
          });

        if (error) throw error;
        toast.success('Location created successfully');
      }

      await fetchLocations();
    } catch (error: any) {
      console.error('Error saving location:', error);
      toast.error('Failed to save location');
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Location deleted successfully');
      await fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPages(), fetchCategories(), fetchLocations()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    pages,
    categories,
    locations,
    loading,
    savePage,
    deletePage,
    saveLocation,
    deleteLocation,
    refresh: async () => {
      await Promise.all([fetchPages(), fetchCategories(), fetchLocations()]);
    },
  };
};