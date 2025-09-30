import { Post } from '@/lib/types/post';
import { supabase } from '@/integrations/supabase/client';

export const getUserPosts = async (userId: string): Promise<Post[]> => {
  try {
    // Query posts from ContentTest table since Posts table doesn't exist
    const { data: posts, error } = await supabase
      .from('ContentTest')
      .select('*')
      .like('body', `%"authorId":"${userId}"%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Debug each document in detail
    posts?.forEach((post, index) => {
      try {
        const postBody = JSON.parse(post.body || '{}') as any;
      } catch (_e) {
        // Error handling silently ignored
      }
    });

    if (!posts || posts.length === 0) {
      return [];
    }

    const processedPosts = posts.map(post => {
      try {
        // Parse the JSON body to get post data
        const postBody = JSON.parse(post.body || '{}') as any;

        // Convert ISO strings to JavaScript Date objects
        const createdAt = post.created_at ? new Date(post.created_at) : new Date();
        const updatedAt = post.updated_at ? new Date(post.updated_at) : new Date();

        let endDate = null;
        if (postBody.endDate) {
          endDate = new Date(postBody.endDate);
        }

        const processedPost = {
          id: post.id,
          content: postBody.content || '',
          authorId: postBody.authorId || userId,
          createdAt,
          updatedAt,
          likes: postBody.likes || 0,
          comments: postBody.comments || 0,
          // Include any event-related fields if they exist
          title: postBody.title,
          endDate,
          location: postBody.location,
          eventDetails: postBody.eventDetails,
        } as Post;

        return processedPost;
      } catch (parseError) {
        // Fallback to basic post structure
        const createdAt = post.created_at ? new Date(post.created_at) : new Date();
        const updatedAt = post.updated_at ? new Date(post.updated_at) : new Date();

        return {
          id: post.id,
          content: post.title || '',
          authorId: userId,
          createdAt,
          updatedAt,
          likes: 0,
          comments: 0,
        } as Post;
      }
    });

    return processedPosts;
  } catch (error) {
    throw error;
  }
};
