import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/providers/AuthProvider';
import { AppUser } from '@/types/user';
import Footer from '@/components/layout/Footer';
import { LoadingSpinner } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  User as UserIcon,
  Globe,
  MapPin,
  Calendar,
  Settings,
  MessageSquare,
  UserPlus,
  UserMinus,
  Camera,
  Upload,
  AlertCircle,
  RefreshCw,
  Users,
  Star,
  Briefcase,
  Heart,
  Eye,
  Edit2,
  Headphones,
  Ticket,
} from 'lucide-react';
import { formatTimestamp } from '@/utils/dates';
import ProfileEditModal from '@/components/profile/ProfileEditModal';
import PostsTab from '@/components/profile/tabs/PostsTab';

interface ExtendedUser {
  id: string;
  email: string;
  name?: string | undefined;
  display_name?: string | undefined;
  username?: string | undefined;
  avatar_url?: string | undefined;
  cover_image_url?: string | undefined;
  bio?: string | undefined;
  created_at: string;
  updated_at?: string | undefined;
  user_metadata?: {
    bio?: string | undefined;
    location?: string | undefined;
    website?: string | undefined;
    profession?: string | undefined;
    company?: string | undefined;
    education?: string | undefined;
    skills?: string[] | undefined;
    interests?: string[] | undefined;
    username?: string | undefined;
    avatar_url?: string | undefined;
    cover_image_url?: string | undefined; // Added for cover image in metadata
  };
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  location: string | null;
  image_url: string | null;
  is_public: boolean | null;
  created_at: string;
}

interface Community {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  member_count: number | null;
  is_private: boolean | null;
  created_at: string;
}

interface Podcast {
  id: string;
  title: string;
  description: string | null;
  cover_image?: string | undefined| null;
  image_url?: string | undefined| null;
  duration?: number | undefined;
  created_at: string;
  creator_id?: string | undefined;
  audio_url?: string | undefined;
  video_url?: string | undefined;
  episode_number?: number | undefined;
  categories?: string[] | undefined;
}

const FETCH_THROTTLE = 1000; // Reduced from 2000ms to 1000ms
const MAX_RETRY_ATTEMPTS = 2; // Reduced from 3 to 2
const LOADING_TIMEOUT = 10000; // Reduced from 15000ms to 10000ms

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, isLoading: authLoading, updateUserData } = useAuth();

  // State management
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState('about');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now()); // Add timestamp for cache invalidation

  // Tab data states
  const [events, setEvents] = useState<Event[]>([]);
  const [reservedEvents, setReservedEvents] = useState<Event[]>([]);
  const [ticketedEvents, setTicketedEvents] = useState<Event[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [postsCount, setPostsCount] = useState(0);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingReservedEvents, setLoadingReservedEvents] = useState(false);
  const [loadingTicketedEvents, setLoadingTicketedEvents] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [loadingPodcasts, setLoadingPodcasts] = useState(false);
  const [activeEventTab, setActiveEventTab] = useState('created');

  // Refs for better loading control
  const mounted = useRef(true);
  const isLoading = useRef(false);
  const lastFetch = useRef<number>(0);
  const retryCount = useRef<number>(0);
  const loadingTimeout = useRef<NodeJS.Timeout | null>(null);
  const authStateStable = useRef(false);

  // Improved fetch function with better error handling and auth state awareness
  const fetchUserProfile = async (forceRefresh = false): Promise<void> => {
    // Wait for auth state to stabilize if not forced
    if (!forceRefresh && (authLoading || !authStateStable.current)) {
      return;
    }

    // Prevent multiple simultaneous calls
    if (isLoading.current && !forceRefresh) {
      return;
    }

    // Throttle API calls
    const now = Date.now();
    if (!forceRefresh && now - lastFetch.current < FETCH_THROTTLE) {
      return;
    }

    // Check retry limit
    if (retryCount.current >= MAX_RETRY_ATTEMPTS && !forceRefresh) {
      setError('Unable to load profile after multiple attempts. Please refresh the page.');
      setLoading(false);
      return;
    }

    try {
      isLoading.current = true;
      lastFetch.current = now;

      if (!forceRefresh) {
        retryCount.current += 1;
      } else {
        retryCount.current = 0;
      }

      if (mounted.current) {
        setLoading(true);
        setError(null);
      }

      // Set loading timeout
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }

      loadingTimeout.current = setTimeout(() => {
        if (mounted.current && isLoading.current) {
          setLoading(false);
          setError('Request timed out. Please try again.');
          isLoading.current = false;
        }
      }, LOADING_TIMEOUT);

      if (!username) {
        // Handle own profile case - wait for auth to be ready
        if (!authLoading && isAuthenticated && currentUser) {
          // Fetch fresh user data including avatar and cover image from database
          let coverImageUrl = '';
          let profileData: any = {};
          let freshAvatarUrl = '';

          try {
            // Fetch fresh avatar URL from users table
            const { data: userData } = await supabase
              .from('users')
              .select('avatar_url')
              .eq('id', currentUser.id)
              .single();

            if (userData) {
              freshAvatarUrl = userData.avatar_url || '';
            }

            // Fetch profile data including cover image
            const { data: profileInfo } = await supabase
              .from('user_profiles')
              .select(
                'cover_image_url, bio, location, website, profession, company, education, skills, interests'
              )
              .eq('user_id', currentUser.id)
              .maybeSingle();

            if (profileInfo) {
              coverImageUrl = profileInfo.cover_image_url || '';
              profileData = profileInfo;
            }
          } catch (profileErr) {
            // Profile fetch error is non-critical, continue without profile data
          }

          // Convert AppUser to ExtendedUser format
          const extendedCurrentUser: ExtendedUser = {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name || currentUser.display_name || undefined,
            display_name: currentUser.display_name || currentUser.name || undefined,
            username:
              (currentUser as any).username || currentUser.display_name || currentUser.name || '',
            avatar_url:
              freshAvatarUrl || currentUser.avatar_url || (currentUser as any).profilePicture || '',
            cover_image_url: coverImageUrl, // Use fetched cover image
            created_at: currentUser.created_at || new Date().toISOString(),
            updated_at: currentUser.updated_at || undefined,
            bio: profileData.bio || (currentUser as any).bio || '',
            user_metadata: {
              bio: profileData.bio || (currentUser as any).bio || '',
              location: profileData.location || (currentUser as any).location || '',
              website: profileData.website || (currentUser as any).website || '',
              profession: profileData.profession || '',
              company: profileData.company || '',
              education: profileData.education || '',
              skills: profileData.skills || [],
              interests: profileData.interests || [],
              username:
                (currentUser as any).username || currentUser.display_name || currentUser.name,
              avatar_url:
                freshAvatarUrl || currentUser.avatar_url || (currentUser as any).profilePicture,
              cover_image_url: coverImageUrl, // Use fetched cover image
            },
          };

          if (mounted.current) {
            setUser(extendedCurrentUser);
            await loadFollowCounts(currentUser.id);
            retryCount.current = 0; // Reset on success
          }
        } else if (!authLoading && !isAuthenticated) {
          // Auth is stable and user is not authenticated
          if (mounted.current) {
            setError('Please log in to view your profile');
          }
        } else {
          // Still waiting for auth to stabilize
        }
        return;
      }

      // Handle other user's profile case
      let targetUser: any = null;

      // First, get basic user data
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, name, display_name, username, avatar_url, created_at, updated_at')
          .or(`username.eq.${username},display_name.eq.${username}`)
          .maybeSingle();

        if (userData && !userError) {
          targetUser = userData;
          // Then get profile data separately
          try {
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select(
                'cover_image_url, bio, location, website, profession, company, education, skills, interests'
              )
              .eq('user_id', userData.id)
              .maybeSingle();

            if (profileData) {
              targetUser.cover_image_url = profileData.cover_image_url;
              targetUser.user_metadata = {
                bio: profileData.bio,
                location: profileData.location,
                website: profileData.website,
                profession: profileData.profession,
                company: profileData.company,
                education: profileData.education,
                skills: profileData.skills,
                interests: profileData.interests,
                cover_image_url: profileData.cover_image_url,
              };
            }
          } catch (profileErr) {
            targetUser.user_metadata = {};
          }
        }
      } catch (err) {}

      if (targetUser) {
        // Merge auth user data with profile data
        const enrichedUser: ExtendedUser = {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name || undefined,
          display_name: targetUser.display_name || undefined,
          username: targetUser.username || targetUser.display_name || undefined,
          avatar_url: targetUser.avatar_url || undefined,
          created_at: targetUser.created_at,
          updated_at: targetUser.updated_at || undefined,
          bio: targetUser.user_metadata?.bio || '',
          user_metadata: {
            bio: targetUser.user_metadata?.bio || '',
            location: targetUser.user_metadata?.location || '',
            website: targetUser.user_metadata?.website || '',
            profession: targetUser.user_metadata?.profession || '',
            company: targetUser.user_metadata?.company || '',
            education: targetUser.user_metadata?.education || '',
            skills: targetUser.user_metadata?.skills || [],
            interests: targetUser.user_metadata?.interests || [],
            cover_image_url: targetUser.cover_image_url || undefined,
          },
        };

        if (mounted.current) {
          setUser(enrichedUser);
          await loadFollowCounts(targetUser.id);

          // Check if current user is following this user
          if (currentUser && currentUser.id !== targetUser.id) {
            await checkFollowingStatus(currentUser!.id, targetUser.id);
          }

          retryCount.current = 0; // Reset on success
        }
      } else {
        throw new Error('User not found');
      }
    } catch (error: unknown) {
      if (mounted.current) {
        // Handle specific error cases
        if (error instanceof Error) {
          if (error.message === 'User not found') {
            setError('User not found');
          } else if (error.message.includes('PGRST116')) {
            setError('User profile not found');
          } else {
            setError('Failed to load profile. Please try again.');
          }
        } else {
          setError('Failed to load profile. Please try again.');
        }
      }
    } finally {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
        loadingTimeout.current = null;
      }

      if (mounted.current) {
        setLoading(false);
      }
      isLoading.current = false;
    }
  };

  // Wait for authentication state to stabilize before fetching
  useEffect(() => {
    if (!authLoading) {
      // Auth state is now stable
      authStateStable.current = true;
      // Small delay to ensure all auth state has propagated
      const timer = setTimeout(() => {
        if (mounted.current && authStateStable.current) {
          fetchUserProfile(true);
        }
      }, 100);

      return () => clearTimeout(timer);
    } else {
      authStateStable.current = false;
    }
  }, [authLoading, isAuthenticated, currentUser.id]);

  // Re-fetch when username changes (but only if auth is stable)
  useEffect(() => {
    if (authStateStable.current && !authLoading) {
      retryCount.current = 0; // Reset retry count for new username
      fetchUserProfile(true);
    }
  }, [username, authLoading]);

  // Initialize component with stable dependencies
  useEffect(() => {
    mounted.current = true;
    retryCount.current = 0;

    return () => {
      mounted.current = false;
      isLoading.current = false;
      retryCount.current = 0;
      authStateStable.current = false;

      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  const loadFollowCounts = async (userId: string) => {
    try {
      // Get followers count
      const { count: followersCount, error: followersError } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      // Get following count
      const { count: followingCount, error: followingError } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (!followersError) setFollowersCount(followersCount || 0);
      if (!followingError) setFollowingCount(followingCount || 0);
    } catch (_error) {
      // Error handling silently ignored
    }
  };

  const checkFollowingStatus = async (currentUserId: string, targetUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .single();

      setIsFollowing(!!data);
    } catch (error) {
      setIsFollowing(false);
    }
  };

  const fetchUserEvents = useCallback(async (userId: string) => {
    if (!userId) return;

    try {
      setLoadingEvents(true);

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setEvents((data || []) as unknown as Event[]);
    } catch (error) {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  const fetchUserReservedEvents = useCallback(async (userId: string) => {
    if (!userId) return;

    try {
      setLoadingReservedEvents(true);

      // Query event_attendees table for events with pending/reserved status
      const { data: reservations, error } = await supabase
        .from('event_attendees')
        .select('id, event_id, status, payment_amount')
        .eq('user_id', userId)
        .eq('status', 'reserved')
        .limit(20);

      if (error) {
        setReservedEvents([]);
        return;
      }

      if (!reservations || reservations.length === 0) {
        setReservedEvents([]);
        return;
      }

      // Get event details separately to avoid complex joins
      const eventIds = reservations.map((r: any) => r.event_id).filter(Boolean);
      if (eventIds.length === 0) {
        setReservedEvents([]);
        return;
      }

      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, description, start_date, location, image_url, is_public, created_at')
        .in('id', eventIds);

      if (eventsError) {
        setReservedEvents([]);
        return;
      }

      // Combine reservation and event data safely
      const reservedEventsData = reservations
        .map((reservation: any) => {
          const event = events?.find(e => e.id === reservation.event_id);
          if (!event) return null;
          return {
          ...event,
            reservation_id: reservation.id,
            reservation_status: reservation.status,
            payment_amount: reservation.payment_amount,
          };
        })
        .filter(event => event !== null);

      setReservedEvents(reservedEventsData as Event[]);
    } catch (error) {
      setReservedEvents([]);
    } finally {
      setLoadingReservedEvents(false);
    }
  }, []);

  const fetchUserTicketedEvents = useCallback(async (userId: string) => {
    if (!userId) return;

    try {
      setLoadingTicketedEvents(true);

      // Query event_attendees table for events with confirmed status
      const { data: attendees, error } = await supabase
        .from('event_attendees')
        .select('id, event_id, status, payment_amount')
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .limit(20);

      if (error) {
        setTicketedEvents([]);
        return;
      }

      if (!attendees || attendees.length === 0) {
        setTicketedEvents([]);
        return;
      }

      // Get event details separately to avoid complex joins
      const eventIds = attendees.map((a: any) => a.event_id).filter(Boolean);
      if (eventIds.length === 0) {
        setTicketedEvents([]);
        return;
      }

      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, description, start_date, location, image_url, is_public, created_at')
        .in('id', eventIds);

      if (eventsError) {
        setTicketedEvents([]);
        return;
      }

      // Combine attendee and event data safely
      const ticketedEventsData = attendees
        .map((attendee: any) => {
          const event = events?.find(e => e.id === attendee.event_id);
          if (!event) return null;
          return {
          ...event,
            attendee_id: attendee.id,
            attendee_status: attendee.status,
            payment_amount: attendee.payment_amount,
          };
        })
        .filter(event => event !== null);

      setTicketedEvents(ticketedEventsData as Event[]);
    } catch (error) {
      setTicketedEvents([]);
    } finally {
      setLoadingTicketedEvents(false);
    }
  }, []);

  const fetchUserCommunities = useCallback(async (userId: string) => {
    if (!userId) return;

    try {
      setLoadingCommunities(true);

      // Fetch real community memberships and created communities
      const [membershipData, createdData] = await Promise.all([
        // Communities where user is a member
        supabase
          .from('community_members')
          .select(
            `
            community_id,
            communities(*)
          `
          )
          .eq('user_id', userId).then(result => result),

        // Communities created by user
        supabase.from('communities').select('*').eq('creator_id', userId).then(result => result),
      ]);

      const memberCommunities = membershipData.data?.map(m => m.communities).filter(Boolean) || [];
      const createdCommunities = createdData.data || [];

      // Combine and deduplicate
      const allCommunities = [...createdCommunities];
      memberCommunities.forEach((community: any) => {
        if (community && !allCommunities.find(c => c.id === community.id)) {
          allCommunities.push(community);
        }
      });

      setCommunities(allCommunities as Community[]);
    } catch (error) {
      console.error('Error fetching communities:', error);
      setCommunities([]);
    } finally {
      setLoadingCommunities(false);
    }
  }, []);

  const fetchUserPodcasts = useCallback(async (userId: string) => {
    if (!userId) return;

    try {
      setLoadingPodcasts(true);

      // Fetch real podcasts from database
      const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching podcasts:', error);
        setPodcasts([]);
      } else {
        // Transform the data to match our interface
        const transformedPodcasts: Podcast[] = (data || []).map((podcast: any) => ({
          id: podcast.id,
          title: podcast.title,
          description: podcast.description,
          image_url: podcast.cover_image || podcast.image_url,
          cover_image: podcast.cover_image,
          duration: podcast.duration,
          created_at: podcast.created_at || new Date().toISOString(),
          creator_id: podcast.creator_id,
          audio_url: podcast.audio_url,
          video_url: podcast.video_url,
          episode_number: podcast.episode_number,
          categories: podcast.categories,
        }));
        setPodcasts(transformedPodcasts);
      }
    } catch (error) {
      console.error('Error fetching podcasts:', error);
      setPodcasts([]);
    } finally {
      setLoadingPodcasts(false);
    }
  }, []);

  const fetchPostsCount = useCallback(async (userId: string) => {
    if (!userId) return;

    try {
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching posts count:', error);
        setPostsCount(0);
      } else {
        setPostsCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching posts count:', error);
      setPostsCount(0);
    }
  }, []);

  // Load tab data when active tab changes
  useEffect(() => {
    if (!user?.id) return;

    // Always load posts count
    fetchPostsCount(user.id);

    if (activeTab === 'events') {
      fetchUserEvents(user.id);
      fetchUserReservedEvents(user.id);
      fetchUserTicketedEvents(user.id);
    } else if (activeTab === 'communities') {
      fetchUserCommunities(user.id);
    } else if (activeTab === 'podcasts') {
      fetchUserPodcasts(user.id);
    }
  }, [activeTab, user?.id]); // Remove function dependencies to prevent infinite loops

  const isOwnProfile = currentUser && user && currentUser.id === user.id;

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleFollowToggle = async () => {
    if (!currentUser || !user || currentUser.id === user.id) return;

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', user.id);

        if (!error) {
          setIsFollowing(false);
          setFollowersCount(prev => Math.max(0, prev - 1));
          toast.success('Unfollowed successfully');
        }
      } else {
        // Follow
        const { error } = await supabase.from('followers').insert({
          follower_id: currentUser.id,
          following_id: user.id,
        });

        if (!error) {
          setIsFollowing(true);
          setFollowersCount(prev => prev + 1);
          toast.success('Following successfully');
        }
      }
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  const handleMessageClick = () => {
    if (!currentUser || !user) return;
    navigate(`/messages?user=${user.id}`);
  };

  const handleRetry = () => {
    retryCount.current = 0;
    setError(null);
    fetchUserProfile(true);
  };

  const handlePhotoUpload = async (file: File, type: 'avatar' | 'cover') => {
    if (!user || !isOwnProfile) return;

    try {
      setIsUploadingPhoto(true);

      // Validate file type - be more lenient with image types
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ];
      if (!allowedTypes.includes(file.type.toLowerCase()) && !file.type.startsWith('image/')) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP, or SVG)');
        return;
      }

      // Increase file size limit to 25MB for better user experience
      if (file.size > 25 * 1024 * 1024) {
        toast.error('Image file size must be less than 25MB');
        return;
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

      // Upload to Supabase storage (avatars bucket already exists)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        toast.error(`Failed to upload ${type} image: ${uploadError.message}`);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        // Update the database and user state
        await updateUserProfileImage(urlData.publicUrl, type);

        // Force refresh user data to ensure database sync and UI update
        await fetchUserProfile(true);

        toast.success(
          `${type === 'avatar' ? 'Profile picture' : 'Cover photo'} updated successfully!`
        );
      } else {
        throw new Error('Failed to get public URL for uploaded image');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error(`Failed to upload ${type} image. Please try again.`);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const updateUserProfileImage = async (imageUrl: string, type: 'avatar' | 'cover') => {
    try {
      if (type === 'avatar') {
        // Avatar goes to users table
        const { error } = await supabase
          .from('users')
          .update({ avatar_url: imageUrl })
          .eq('id', user!.id);

        if (error) {
          throw error;
        }

        // Also update auth user metadata for immediate header update
        const { error: authError } = await supabase.auth.updateUser({
          data: { avatar_url: imageUrl },
        });

        if (authError) {
          console.error('Error updating auth metadata:', authError);
          // Don't throw error for auth update, continue with local state update
        }

        // Update local user state immediately
        if (user) {
          setUser({
          ...user,
            avatar_url: imageUrl,
          });
        }

        // Also update auth context to sync with header
        if (updateUserData) {
          updateUserData({ avatar_url: imageUrl });
        }
      } else {
        // Cover image goes to user_profiles table
        // Use upsert operation to handle unique constraint properly
        const { error } = await supabase.from('user_profiles').upsert(
          {
            user_id: user!.id,
            cover_image_url: imageUrl,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id', // Specify the conflict resolution column
            ignoreDuplicates: false, // Update existing records
          }
        );

        if (error) {
          console.error('Error upserting user profile:', error);
          throw error;
        }

        // Update local user state immediately
        if (user) {
          setUser({
          ...user,
            cover_image_url: imageUrl,
          });
        }

        // Also update auth user metadata for consistency
        const { error: authError } = await supabase.auth.updateUser({
          data: { cover_image_url: imageUrl },
        });

        if (authError) {
          console.error('Error updating auth metadata for cover image:', authError);
          // Don't throw error for auth update, continue with local state update
        }
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      throw error;
    }
  };

  // Add missing profile update function
  const handleProfileUpdate = async (data: Partial<AppUser>) => {
    if (!user) return;

    try {
      setIsSavingProfile(true);

      // Update users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: data.name,
          display_name: data.name,
          avatar_url: data.profilePicture,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (userError) {
        console.error('Error updating users table:', userError);
        // Don't throw error for users table update, continue with profile update
      }

      // Get cover image URL from user_metadata if available
      const coverImageUrl = (data.user_metadata as any)?.cover_image_url || '';

      // Use upsert operation for user_profiles table to handle unique constraint properly
      const { error: profileError } = await supabase.from('user_profiles').upsert(
        {
          user_id: user.id,
          bio: data.bio,
          location: data.location,
          website: data.website,
          cover_image_url: coverImageUrl, // Add cover image update
          skills: (data as any).skills || [],
          interests: (data as any).interests || [],
          profession: (data as any).profession,
          company: (data as any).company,
          education: (data as any).education,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id', // Specify the conflict resolution column
          ignoreDuplicates: false, // Update existing records
        }
      );

      if (profileError) {
        console.error('Error upserting user_profiles table:', profileError);
        // Don't throw error for profile table update, continue with local state update
      }

      // Update local state
      setUser(prev =>
        prev
          ? {
          ...prev,
              name: data.name || prev.name,
              display_name: data.name || prev.display_name,
              avatar_url: data.profilePicture || prev.avatar_url,
              cover_image_url: coverImageUrl || prev.cover_image_url, // Add cover image update
              bio: data.bio || prev.bio,
              user_metadata: {
          ...prev.user_metadata,
                bio: data.bio,
                location: data.location,
                website: data.website,
                cover_image_url: coverImageUrl, // Add cover image to metadata
                skills: (data as any).skills,
                interests: (data as any).interests,
                profession: (data as any).profession,
                company: (data as any).company,
                education: (data as any).education,
              },
            }
          : null
      );

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      throw error;
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Format joined date properly
  const formatJoinedDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Unknown';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }) as string;
    } catch (error) {
      return 'Unknown';
    }
  };

  // Helper function to get the correct avatar URL
  const getAvatarUrl = (user: ExtendedUser): string => {
    // Priority: user.avatar_url (primary) -> user_metadata.avatar_url (fallback)
    return user.avatar_url || user.user_metadata?.avatar_url || '';
  };

  // Helper function to get the correct cover image URL
  const getCoverImageUrl = (user: ExtendedUser): string => {
    return user.cover_image_url || '';
  };

  // Convert User to AppUser for compatibility
  const appUser: AppUser | null = user
    ? {
        id: user.id,
        email: user.email,
        name: user.name || user.display_name || '',
        profilePicture: getAvatarUrl(user), // Use helper function
        bio: user.user_metadata?.bio || user.bio || '',
        username: user.user_metadata?.username || user.username || user.display_name || '',
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.updated_at || new Date().toISOString(),
        location: user.user_metadata?.location || '',
        website: user.user_metadata?.website || '',
        user_metadata: {
          ...user.user_metadata,
          cover_image_url: getCoverImageUrl(user), // Add cover image URL to metadata
        },
      }
    : null;

  if (loading) {
    return (
      <>
        <div className='flex min-h-screen flex-col bg-white text-gray-900'>
          <main className='flex-1 container mx-auto px-4 py-8'>
            <div className='flex justify-center items-center h-64'>
              <div className='text-center'>
                <LoadingSpinner className='mx-auto mb-4' />
                <p className='text-gray-600'>Loading profile...</p>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  if (error || !user) {
    return (
      <>
        <div className='flex min-h-screen flex-col bg-white text-gray-900'>
          <main className='flex-1 container mx-auto px-4 py-8'>
            <Alert className='max-w-md mx-auto border-destructive bg-destructive/10'>
              <AlertCircle className='h-4 w-4 text-destructive' />
              <AlertDescription className='text-destructive'>
                {error || 'User not found'}
                <Button
                  variant='link'
                  className='p-0 h-auto ml-2 text-destructive hover:text-destructive/80'
                  onClick={handleRetry}
                >
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <div className='flex min-h-screen flex-col bg-white text-gray-900'>
        <main className='flex-1'>
          {/* Cover Photo Section */}
          <div className='relative h-48 md:h-64 bg-gradient-to-r from-gray-100 to-gray-200'>
            {getCoverImageUrl(user) && (
              <img
                src={getCoverImageUrl(user)}
                alt='Cover'
                className='w-full h-full object-cover'
              />
            )}
            {isOwnProfile && (
              <div className='absolute top-4 right-4'>
                <input
                  type='file'
                  accept='image/*'
                  className='hidden'
                  id='cover-upload-input'
                  onChange={e => {

                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {

                      handlePhotoUpload(file, 'cover');

                    }

                  }}
                  disabled={isUploadingPhoto}

                />
                <Button
                  variant='secondary'
                  size='sm'
                  className='bg-white/90 hover:bg-white'
                  disabled={isUploadingPhoto}
                  onClick={() => {
                    const input = document.getElementById('cover-upload-input') as HTMLInputElement;
                    if (input) {
                      input.click();
                    } else {
                    }
                  }}
                >
                  <Camera className='h-4 w-4 mr-2' />
                  {isUploadingPhoto ? 'Uploading...' : 'Edit Cover'}
                </Button>
              </div>
            )}
          </div>

          {/* Profile Header */}
          <div className='container mx-auto px-4'>
            <div className='relative -mt-16 md:-mt-20'>
              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
                <div className='flex flex-col md:flex-row items-start gap-6'>
                  {/* Avatar */}
                  <div className='relative'>
                    <Avatar className='h-24 w-24 md:h-32 md:w-32 border-4 border-white shadow-lg'>
                      <AvatarImage
                        src={getAvatarUrl(user)}
                        alt={appUser?.name || 'User'}
                      />
                      <AvatarFallback className='text-lg md:text-xl bg-gray-100'>
                        {(appUser?.name || appUser?.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isOwnProfile && (
                      <div className='absolute bottom-0 right-0'>
                        <input
                          type='file'
                          accept='image/*'
                          className='hidden'
                          id='avatar-upload-input'
                          onChange={e => {

                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {

                              handlePhotoUpload(file, 'avatar');

                            }

                          }}
                          disabled={isUploadingPhoto}

                        />
                        <Button
                          size='icon'
                          className='h-8 w-8 rounded-full bg-black text-white hover:bg-gray-800 cursor-pointer'
                          disabled={isUploadingPhoto}
                          onClick={() => {
                            const input = document.getElementById(
                              'avatar-upload-input'
                            ) as HTMLInputElement;
                            if (input) {
                              input.click();
                            } else {
                            }
                          }}
                        >
                          <Camera className='h-4 w-4' />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className='flex-1 space-y-4'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                      <div>
                        <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>
                          {appUser?.name || appUser?.username || 'User'}
                        </h1>
                        {appUser?.username && <p className='text-gray-600'>@{appUser.username}</p>}
                        {user.user_metadata?.profession && (
                          <p className='text-gray-600 flex items-center gap-1 mt-1'>
                            <Briefcase className='h-4 w-4' />
                            {user.user_metadata.profession}
                          </p>
                        )}
                      </div>

                      <div className='flex gap-2'>
                        {isOwnProfile ? (
                          <Button
                            variant='outline'
                            onClick={handleEditProfile}
                            className='border-gray-300 text-gray-700 hover:bg-gray-50'
                          >
                            <Settings className='h-4 w-4 mr-2' />
                            Edit Profile
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant={isFollowing ? 'outline' : 'default'}
                              onClick={handleFollowToggle}
                              className={
                                isFollowing
                                  ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                  : 'bg-black text-white hover:bg-gray-800'
                              }
                            >
                              {isFollowing ? (
                                <>
                                  <UserMinus className='h-4 w-4 mr-2' />
                                  Unfollow
                                </>
                              ) : (
                                <>
                                  <UserPlus className='h-4 w-4 mr-2' />
                                  Follow
                                </>
                              )}
                            </Button>

                            <Button
                              variant='outline'
                              onClick={handleMessageClick}
                              className='border-gray-300 text-gray-700 hover:bg-gray-50'
                            >
                              <MessageSquare className='h-4 w-4 mr-2' />
                              Message
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {appUser?.bio && <p className='text-gray-700'>{appUser.bio}</p>}

                    <div className='flex flex-wrap gap-4 text-sm text-gray-600'>
                      <div className='flex items-center gap-1'>
                        <span className='font-medium text-gray-900'>{followersCount}</span>
                        <span>Followers</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <span className='font-medium text-gray-900'>{followingCount}</span>
                        <span>Following</span>
                      </div>
                      {appUser?.location && (
                        <div className='flex items-center gap-1'>
                          <MapPin className='h-4 w-4' />
                          <span>{appUser.location}</span>
                        </div>
                      )}
                      {appUser?.website && (
                        <div className='flex items-center gap-1'>
                          <Globe className='h-4 w-4' />
                          <a
                            href={appUser.website}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-primary hover:underline'
                          >
                            Website
                          </a>
                        </div>
                      )}
                      <div className='flex items-center gap-1'>
                        <Calendar className='h-4 w-4' />
                        <p className='text-muted-foreground'>
                          Joined {formatJoinedDate(user?.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Tabs */}
          <div className='container mx-auto px-4 py-8'>
            <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
              <TabsList className='grid w-full grid-cols-6 bg-gray-100'>
                <TabsTrigger value='about' className='data-[state=active]:bg-white'>
                  About
                </TabsTrigger>
                <TabsTrigger value='posts' className='data-[state=active]:bg-white'>
                  Posts
                  <Badge variant='secondary' className='ml-2 bg-gray-200 text-gray-700'>
                    {postsCount}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value='events' className='data-[state=active]:bg-white'>
                  Events
                  <Badge variant='secondary' className='ml-2 bg-gray-200 text-gray-700'>
                    {events.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value='communities' className='data-[state=active]:bg-white'>
                  Communities
                  <Badge variant='secondary' className='ml-2 bg-gray-200 text-gray-700'>
                    {communities.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value='podcasts' className='data-[state=active]:bg-white'>
                  Podcasts
                  <Badge variant='secondary' className='ml-2 bg-gray-200 text-gray-700'>
                    {podcasts.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value='store' className='data-[state=active]:bg-white'>
                  Store
                </TabsTrigger>
                <TabsTrigger value='activity' className='data-[state=active]:bg-white'>
                  Activity
                </TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value='about' className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {/* Basic Info */}
                  <Card className='border-gray-200'>
                    <CardContent className='p-6'>
                      <h3 className='font-semibold text-lg mb-4 text-gray-900'>About</h3>
                      <div className='space-y-3'>
                        {appUser?.bio ? (
                          <p className='text-gray-700'>{appUser.bio}</p>
                        ) : (
                          <p className='text-gray-500 italic'>No bio available</p>
                        )}

                        {user.user_metadata?.company && (
                          <div className='flex items-center gap-2 text-sm'>
                            <Briefcase className='h-4 w-4 text-gray-400' />
                            <span className='text-gray-700'>{user.user_metadata.company}</span>
                          </div>
                        )}

                        {user.user_metadata?.education && (
                          <div className='flex items-center gap-2 text-sm'>
                            <UserIcon className='h-4 w-4 text-gray-400' />
                            <span className='text-gray-700'>{user.user_metadata.education}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Skills */}
                  {user.user_metadata?.skills && user.user_metadata.skills.length > 0 && (
                    <Card className='border-gray-200'>
                      <CardContent className='p-6'>
                        <h3 className='font-semibold text-lg mb-4 text-gray-900'>Skills</h3>
                        <div className='flex flex-wrap gap-2'>
                          {user.user_metadata.skills.map((skill: string, index: number) => (
                            <Badge
                              key={index}
                              variant='secondary'
                              className='bg-gray-200 text-gray-700'
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Interests */}
                  {user.user_metadata?.interests && user.user_metadata.interests.length > 0 && (
                    <Card className='border-gray-200'>
                      <CardContent className='p-6'>
                        <h3 className='font-semibold text-lg mb-4 text-gray-900'>Interests</h3>
                        <div className='flex flex-wrap gap-2'>
                          {user.user_metadata.interests.map((interest: string, index: number) => (
                            <Badge
                              key={index}
                              variant='outline'
                              className='border-gray-300 text-gray-600'
                            >
                              <Heart className='h-3 w-3 mr-1' />
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Posts Tab */}
              <TabsContent value='posts' className='space-y-6'>
                <PostsTab
                  userId={user.id}
                  isOwnProfile={isOwnProfile}
                  username={user.username || user.display_name || 'User'}
                />
              </TabsContent>

              {/* Events Tab */}
              <TabsContent value='events' className='space-y-6'>
                <Tabs
                  value={activeEventTab}
                  onValueChange={setActiveEventTab}
                  className='space-y-4'
                >
                  <TabsList className='grid w-full grid-cols-3 bg-gray-100'>
                    <TabsTrigger value='created' className='data-[state=active]:bg-white'>
                      Created
                      <Badge variant='secondary' className='ml-2 bg-gray-200 text-gray-700'>
                        {events.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value='reserved' className='data-[state=active]:bg-white'>
                      Reserved
                      <Badge variant='secondary' className='ml-2 bg-gray-200 text-gray-700'>
                        {reservedEvents.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value='ticketed' className='data-[state=active]:bg-white'>
                      Tickets
                      <Badge variant='secondary' className='ml-2 bg-gray-200 text-gray-700'>
                        {ticketedEvents.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  {/* Created Events */}
                  <TabsContent value='created' className='space-y-4'>
                    {loadingEvents ? (
                      <div className='flex justify-center py-8'>
                        <LoadingSpinner />
                      </div>
                    ) : events.length > 0 ? (
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {events.map(event => (
                          <Card
                            key={event.id}
                            className='border-gray-200 hover:shadow-md transition-shadow cursor-pointer'
                            onClick={() => navigate(`/events/${event.id}`)}
                          >
                            <div className='aspect-video bg-gray-100 rounded-t-lg overflow-hidden'>
                              {event.image_url ? (
                                <img
                                  src={event.image_url}
                                  alt={event.title}
                                  className='w-full h-full object-cover'
                                />
                              ) : (
                                <div className='w-full h-full flex items-center justify-center'>
                                  <Calendar className='h-12 w-12 text-gray-400' />
                                </div>
                              )}
                            </div>
                            <CardContent className='p-4'>
                              <h3 className='font-semibold text-lg mb-2 text-gray-900 line-clamp-1'>
                                {event.title}
                              </h3>
                              {event.description && (
                                <p className='text-sm text-gray-600 mb-2 line-clamp-2'>
                                  {event.description}
                                </p>
                              )}
                              <div className='flex items-center justify-between text-xs text-gray-500'>
                                {event.location && (
                                  <div className='flex items-center gap-1'>
                                    <MapPin className='h-3 w-3' />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                                <span>{formatTimestamp(event.created_at)}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className='border-gray-200'>
                        <CardContent className='text-center py-12'>
                          <Calendar className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                          <h3 className='text-lg font-semibold mb-2 text-gray-900'>
                            No events created yet
                          </h3>
                          <p className='text-gray-600 mb-4'>
                            {isOwnProfile
                              ? "You haven't created any events yet."
                              : "This user hasn't created any events yet."}
                          </p>
                          {isOwnProfile && (
                            <Button
                              onClick={() => navigate('/create-event')}
                              className='bg-black text-white hover:bg-gray-800'
                            >
                              Create Your First Event
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Reserved Events */}
                  <TabsContent value='reserved' className='space-y-4'>
                    {loadingReservedEvents ? (
                      <div className='flex justify-center py-8'>
                        <LoadingSpinner />
                      </div>
                    ) : reservedEvents.length > 0 ? (
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {reservedEvents.map(event => (
                          <Card
                            key={event.id}
                            className='border-gray-200 hover:shadow-md transition-shadow cursor-pointer'
                            onClick={() => navigate(`/events/${event.id}`)}
                          >
                            <div className='aspect-video bg-gray-100 rounded-t-lg overflow-hidden relative'>
                              {event.image_url ? (
                                <img
                                  src={event.image_url}
                                  alt={event.title}
                                  className='w-full h-full object-cover'
                                />
                              ) : (
                                <div className='w-full h-full flex items-center justify-center'>
                                  <Calendar className='h-12 w-12 text-gray-400' />
                                </div>
                              )}
                              <Badge className='absolute top-2 right-2 bg-secondary text-foreground'>
                                Reserved
                              </Badge>
                            </div>
                            <CardContent className='p-4'>
                              <h3 className='font-semibold text-lg mb-2 text-gray-900 line-clamp-1'>
                                {event.title}
                              </h3>
                              {event.description && (
                                <p className='text-sm text-gray-600 mb-2 line-clamp-2'>
                                  {event.description}
                                </p>
                              )}
                              <div className='flex items-center justify-between text-xs text-gray-500'>
                                {event.location && (
                                  <div className='flex items-center gap-1'>
                                    <MapPin className='h-3 w-3' />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                                <span>{formatTimestamp(event.created_at)}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className='border-gray-200'>
                        <CardContent className='text-center py-12'>
                          <Calendar className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                          <h3 className='text-lg font-semibold mb-2 text-gray-900'>
                            No reserved events
                          </h3>
                          <p className='text-gray-600 mb-4'>
                            {isOwnProfile
                              ? "You don't have any event reservations."
                              : "This user doesn't have any event reservations."}
                          </p>
                          {isOwnProfile && (
                            <Button
                              onClick={() => navigate('/explore')}
                              className='bg-black text-white hover:bg-gray-800'
                            >
                              Explore Events
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Ticketed Events */}
                  <TabsContent value='ticketed' className='space-y-4'>
                    {loadingTicketedEvents ? (
                      <div className='flex justify-center py-8'>
                        <LoadingSpinner />
                      </div>
                    ) : ticketedEvents.length > 0 ? (
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {ticketedEvents.map(event => (
                          <Card
                            key={event.id}
                            className='border-gray-200 hover:shadow-md transition-shadow cursor-pointer'
                            onClick={() => navigate(`/events/${event.id}`)}
                          >
                            <div className='aspect-video bg-gray-100 rounded-t-lg overflow-hidden relative'>
                              {event.image_url ? (
                                <img
                                  src={event.image_url}
                                  alt={event.title}
                                  className='w-full h-full object-cover'
                                />
                              ) : (
                                <div className='w-full h-full flex items-center justify-center'>
                                  <Calendar className='h-12 w-12 text-gray-400' />
                                </div>
                              )}
                              <Badge className='absolute top-2 right-2 bg-primary text-primary-foreground'>
                                <Ticket className='h-3 w-3 mr-1' />
                                Ticketed
                              </Badge>
                            </div>
                            <CardContent className='p-4'>
                              <h3 className='font-semibold text-lg mb-2 text-gray-900 line-clamp-1'>
                                {event.title}
                              </h3>
                              {event.description && (
                                <p className='text-sm text-gray-600 mb-2 line-clamp-2'>
                                  {event.description}
                                </p>
                              )}
                              <div className='flex items-center justify-between text-xs text-gray-500'>
                                {event.location && (
                                  <div className='flex items-center gap-1'>
                                    <MapPin className='h-3 w-3' />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                                <span>{formatTimestamp(event.created_at)}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className='border-gray-200'>
                        <CardContent className='text-center py-12'>
                          <Ticket className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                          <h3 className='text-lg font-semibold mb-2 text-gray-900'>
                            No tickets yet
                          </h3>
                          <p className='text-gray-600 mb-4'>
                            {isOwnProfile
                              ? "You don't have tickets for any events yet."
                              : "This user doesn't have tickets for any events yet."}
                          </p>
                          {isOwnProfile && (
                            <Button
                              onClick={() => navigate('/explore')}
                              className='bg-black text-white hover:bg-gray-800'
                            >
                              Find Events
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Communities Tab */}
              <TabsContent value='communities' className='space-y-6'>
                {loadingCommunities ? (
                  <div className='flex justify-center py-8'>
                    <LoadingSpinner />
                  </div>
                ) : communities.length > 0 ? (
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {communities.map(community => (
                      <Card
                        key={community.id}
                        className='border-gray-200 hover:shadow-md transition-shadow cursor-pointer'
                        onClick={() => navigate(`/communities/${community.id}`)}
                      >
                        <CardContent className='p-4'>
                          <div className='flex items-start gap-3 mb-3'>
                            <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0'>
                              {community.image_url ? (
                                <img
                                  src={community.image_url}
                                  alt={community.name}
                                  className='w-full h-full object-cover rounded-full'
                                />
                              ) : (
                                <Users className='h-6 w-6 text-gray-400' />
                              )}
                            </div>
                            <div className='flex-1 min-w-0'>
                              <h3 className='font-semibold text-lg text-gray-900 truncate'>
                                {community.name}
                              </h3>
                              <div className='flex items-center gap-2 text-sm text-gray-600'>
                                <Users className='h-3 w-3' />
                                <span>{community.member_count || 0} members</span>
                                {community.is_private && (
                                  <Badge variant='secondary' className='bg-gray-200 text-gray-700'>
                                    Private
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {community.description && (
                            <p className='text-sm text-gray-600 line-clamp-2'>
                              {community.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className='border-gray-200'>
                    <CardContent className='text-center py-12'>
                      <Users className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                      <h3 className='text-lg font-semibold mb-2 text-gray-900'>
                        No communities yet
                      </h3>
                      <p className='text-gray-600 mb-4'>
                        {isOwnProfile
                          ? "You haven't joined any communities yet."
                          : "This user hasn't joined any communities yet."}
                      </p>
                      {isOwnProfile && (
                        <Button
                          onClick={() => navigate('/communities')}
                          className='bg-black text-white hover:bg-gray-800'
                        >
                          Explore Communities
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Podcasts Tab */}
              <TabsContent value='podcasts' className='space-y-6'>
                {loadingPodcasts ? (
                  <div className='flex justify-center py-8'>
                    <LoadingSpinner />
                  </div>
                ) : podcasts.length > 0 ? (
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {podcasts.map(podcast => (
                      <Card
                        key={podcast.id}
                        className='border-gray-200 hover:shadow-md transition-shadow cursor-pointer'
                        onClick={() => navigate(`/podcasts/${podcast.id}`)}
                      >
                        <CardContent className='p-4'>
                          <div className='flex items-start gap-3 mb-3'>
                            <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0'>
                              {podcast.image_url ? (
                                <img
                                  src={podcast.image_url}
                                  alt={podcast.title}
                                  className='w-full h-full object-cover rounded-full'
                                />
                              ) : (
                                <Headphones className='h-6 w-6 text-gray-400' />
                              )}
                            </div>
                            <div className='flex-1 min-w-0'>
                              <h3 className='font-semibold text-lg text-gray-900 truncate'>
                                {podcast.title}
                              </h3>
                              <div className='flex items-center gap-2 text-sm text-gray-600'>
                                <Headphones className='h-3 w-3' />
                                <span>
                                  {podcast.duration ? `${podcast.duration} minutes` : 'No duration'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {podcast.description && (
                            <p className='text-sm text-gray-600 line-clamp-2'>
                              {podcast.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className='border-gray-200'>
                    <CardContent className='text-center py-12'>
                      <Headphones className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                      <h3 className='text-lg font-semibold mb-2 text-gray-900'>No podcasts yet</h3>
                      <p className='text-gray-600'>
                        {isOwnProfile
                          ? "You haven't created any podcasts yet."
                          : "This user hasn't created any podcasts yet."}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Store Tab */}
              <TabsContent value='store' className='space-y-6'>
                <Card className='border-gray-200'>
                  <CardContent className='text-center py-12'>
                    <div className='h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                      <span className='text-2xl'>🏪</span>
                    </div>
                    <h3 className='text-lg font-semibold mb-2 text-gray-900'>No Store Yet</h3>
                    <p className='text-gray-600'>
                      {isOwnProfile
                        ? 'Set up your store to sell products to your community.'
                        : "This user hasn't set up their store yet."}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value='activity' className='space-y-6'>
                <Card className='border-gray-200'>
                  <CardContent className='text-center py-12'>
                    <Eye className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                    <h3 className='text-lg font-semibold mb-2 text-gray-900'>Recent Activity</h3>
                    <p className='text-gray-600'>
                      {isOwnProfile
                        ? 'Your recent activity will appear here.'
                        : "This user's recent activity will appear here."}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <Footer />

        {/* Profile Edit Modal */}
        {appUser && (
          <ProfileEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            profileData={appUser}
            onProfileUpdate={handleProfileUpdate}
            isSaving={isSavingProfile}
            isUploading={isUploadingPhoto}
          />
        )}
      </div>
    </>
  );
};

export default Profile;
