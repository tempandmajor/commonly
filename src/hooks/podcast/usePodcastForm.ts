import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { podcastFormSchema } from '@/components/podcast/form/types';
import { createPodcast } from '@/services/podcast/mutations';
import { useState } from 'react';
import { toast } from 'sonner';
import type { User } from '@/lib/types/user';
import { PodcastType } from '@/lib/types/podcast';
import { useNavigate } from 'react-router-dom';

export const usePodcastForm = (user: User | null) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<PodcastFormValues>({
    resolver: zodResolver(podcastFormSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'audio',
      fileUrl: '',
      thumbnailUrl: '',
      coverImage: '',
      categories: [],
    },
  });

  const onSubmit = async (values: PodcastFormValues) => {
    try {
      setIsSubmitting(true);

      if (!user) {
        toast.error('You must be logged in to create a podcast');
        return null;
      }

      if (!values.fileUrl) {
        toast.error('Podcast audio/video file is required');
        return null;
      }

      if (!values.coverImage) {
        toast.error('Cover image is required');
        return null;
      }

      const podcastData = {
        title: values.title,
        description: values.description,
        type: values.type as PodcastType,
        thumbnailUrl: values.thumbnailUrl || values.coverImage,
        fileUrl: values.fileUrl,
        duration: 0,
        creatorId: user.id,
        podcasterId: user.id, // Added to match the DTO
        creator: {
          id: user.id,
          name: user.name || '',
          username: user.email?.split('@')[0] || '',
          avatar: user.profilePicture || '',
        },
        likes: 0,
        comments: 0,
        coverImage: values.coverImage,
        categories: values.categories,
        isPublished: true,
      };

      const podcast = await createPodcast(podcastData);

      if (podcast) {
        toast.success('Podcast created successfully!');
        form.reset();
        navigate(`/podcast/${podcast.id}`);
        return podcast;
      } else {
        toast.error('Failed to create podcast');
        return null;
      }
    } catch (error) {
      toast.error('An error occurred while creating the podcast');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    onSubmit,
  };
};
