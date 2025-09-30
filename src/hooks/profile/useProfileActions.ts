import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export function useProfileActions(userId?: string) {
  const navigate = useNavigate();
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [showSubscriptionSetup, setShowSubscriptionSetup] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load privacy settings on mount
  useEffect(() => {
    const loadPrivacySettings = async () => {
      if (!userId) return;

      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('privacy_settings')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading privacy settings:', error);
          return;
        }

        if (profile?.privacy_settings) {
          const privacySettings = profile.privacy_settings as any;
          setIsPrivateProfile(privacySettings.isPrivate ?? false);
        }
      } catch (error) {
        console.error('Error loading privacy settings:', error);
      }
    };

    loadPrivacySettings();
  }, [userId]);

  const handleMessageClick = () => {
    if (userId) {
      navigate(`/messages?user=${userId}`);
    } else {
      navigate('/messages');
    }
  };

  const handleSubscribeClick = () => {
    toast.info('Subscription functionality will be implemented here');
  };

  const handlePrivacyToggle = async () => {
    if (!userId) return;

    try {
      setIsSaving(true);
      const newPrivacyStatus = !isPrivateProfile;

      // Update privacy settings in database
      const { error } = await supabase.from('user_profiles').upsert(
        {
          user_id: userId,
          privacy_settings: {
            isPrivate: newPrivacyStatus,
            updated_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

      if (error) throw error;

      setIsPrivateProfile(newPrivacyStatus);
      toast.success(`Profile is now ${newPrivacyStatus ? 'private' : 'public'}`);
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error('Failed to update privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isPrivateProfile,
    showSubscriptionSetup,
    isSubscribed,
    isSaving,
    handleMessageClick,
    handleSubscribeClick,
    handlePrivacyToggle,
    setShowSubscriptionSetup,
    setIsSubscribed,
  };
}
