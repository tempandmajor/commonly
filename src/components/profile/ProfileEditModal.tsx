import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AppUser } from '@/types/user';
import { toast } from 'sonner';
import {
  FormField,
  FormSection,
  DatePicker,
  RichTextEditor,
  SearchSelect,
  SearchSelectOption,
} from '@/components/forms/shared';
import {
  profileUpdateSchema,
  ProfileUpdateValues,
  AccountType,
  ProfileVisibility,
} from '@/lib/validations/profileValidation';
import {
  User,
  Globe,
  MapPin,
  Calendar,
  Briefcase,
  Shield,
  Bell,
  X,
  Loader2,
  Camera,
  Upload,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: AppUser;
  onProfileUpdate: (data: Partial<AppUser>) => Promise<void>;
  isSaving: boolean;
  isUploading: boolean;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  profileData,
  onProfileUpdate,
  isSaving,
  isUploading,
}) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'basic' | 'professional' | 'settings'>('basic');
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isAddingInterest, setIsAddingInterest] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Memoize default values to prevent unnecessary re-renders
  const defaultValues = useMemo(
    (): Partial<ProfileUpdateValues> => ({
      name: profileData.name || '',
      username: profileData.username || '',
      email: profileData.email || '',
      bio: profileData.bio || '',
      location: profileData.location || '',
      website: profileData.website || '',
      avatar: profileData.profilePicture || profileData.avatar || profileData.avatar_url || '',
      coverImage: (profileData as any).coverImage || (profileData as any).cover_image_url || '',
      skills: (profileData as any).skills || [],
      interests: (profileData as any).interests || [],
      socialLinks: (profileData as any).socialLinks || [],
      profession: (profileData as any).profession || '',
      company: (profileData as any).company || '',
      education: (profileData as any).education || '',
      phone: profileData.phoneNumber || '',
      accountType: (profileData as any).accountType || AccountType.Personal,
      privacySettings: {
        profileVisibility: ProfileVisibility.Public,
        showEmail: false,
        showLocation: true,
        showBirthdate: false,
        allowMessagesFrom: 'friends' as const,
        showActivityStatus: true,
      },
      notificationPreferences: {
        email: {
          newsletter: true,
          eventReminders: true,
          productUpdates: true,
          communityActivity: true,
          messages: true,
        },
        push: {
          eventReminders: true,
          messages: true,
          mentions: true,
          likes: false,
          comments: true,
        },
      },
    }),
    [profileData]
  );

  const form = useForm<ProfileUpdateValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Reset form when modal opens or profileData changes
  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
      setActiveTab('basic');
      setSkillInput('');
      setInterestInput('');
    }
  }, [isOpen, defaultValues, form]);

  // Handle avatar upload
  const handleAvatarUpload = async (file: File) => {
    if (!currentUser) {
      toast.error('You must be logged in to upload images');
      return;
    }

    try {
      setIsUploadingAvatar(true);

      // Validate file type
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

      // Validate file size (5MB for avatar)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Avatar image file size must be less than 5MB');
        return;
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${currentUser.id}/avatar_${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        toast.error(`Failed to upload avatar: ${uploadError.message}`);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        form.setValue('avatar', urlData.publicUrl);
        toast.success('Avatar uploaded successfully');
      } else {
        throw new Error('Failed to get public URL for uploaded image');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle cover image upload
  const handleCoverUpload = async (file: File) => {
    if (!currentUser) {
      toast.error('You must be logged in to upload images');
      return;
    }

    try {
      setIsUploadingCover(true);

      // Validate file type
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

      // Validate file size (10MB for cover)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Cover image file size must be less than 10MB');
        return;
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${currentUser.id}/cover_${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        toast.error(`Failed to upload cover image: ${uploadError.message}`);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        form.setValue('coverImage', urlData.publicUrl);
        toast.success('Cover image uploaded successfully');
      } else {
        throw new Error('Failed to get public URL for uploaded image');
      }
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast.error('Failed to upload cover image. Please try again.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Enhanced submit handler with better error handling
  const handleSubmit = useCallback(
    async (values: ProfileUpdateValues) => {
      try {
        // Transform ProfileUpdateValues back to AppUser format
        const appUserData: Partial<AppUser> = {
          name: values.name,
          username: values.username,
          email: values.email,
          bio: values.bio,
          location: values.location,
          website: values.website,
          profilePicture: values.avatar,
          phoneNumber: values.phone,
          // Store additional fields in user_metadata for now
          user_metadata: {
          ...profileData.user_metadata,
            profession: values.profession,
            company: values.company,
            education: values.education,
            skills: values.skills,
            interests: values.interests,
            accountType: values.accountType,
            privacySettings: values.privacySettings,
            notificationPreferences: values.notificationPreferences,
            cover_image_url: values.coverImage, // Add cover image to metadata
          },
        };

        await onProfileUpdate(appUserData);
        toast.success('Profile updated successfully!');
        onClose();
      } catch (error) {
        if (error instanceof Error) {
          // Handle specific error types
          if (error.message.includes('username')) {
            toast.error('Username is already taken. Please choose a different one.');
          } else if (error.message.includes('email')) {
            toast.error('Email is already in use. Please use a different email.');
          } else if (error.message.includes('network')) {
            toast.error('Network error. Please check your connection and try again.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.error('Failed to update profile. Please try again.');
        }
      }
    },
    [onProfileUpdate, onClose, profileData.user_metadata]
  );

  // Enhanced skill management with validation
  const addSkill = useCallback(async () => {
    const trimmedSkill = skillInput.trim();

    if (!trimmedSkill) {
      toast.error('Skill cannot be empty');
      return;
    }

    if (trimmedSkill.length > 30) {
      toast.error('Skill must be less than 30 characters');
      return;
    }

    const currentSkills = form.getValues('skills') || [];

    if (currentSkills.includes(trimmedSkill)) {
      toast.error('Skill already exists');
      return;
    }

    if (currentSkills.length >= 20) {
      toast.error('Maximum 20 skills allowed');
      return;
    }

    setIsAddingSkill(true);
    try {
      form.setValue('skills', [...currentSkills, trimmedSkill]);
      setSkillInput('');
    } finally {
      setIsAddingSkill(false);
    }
  }, [skillInput, form]);

  const removeSkill = useCallback(
    (skillToRemove: string) => {
      const currentSkills = form.getValues('skills') || [];
      form.setValue(
        'skills',
        currentSkills.filter(skill => skill !== skillToRemove)
      );
    },
    [form]
  );

  // Enhanced interest management with validation
  const addInterest = useCallback(async () => {
    const trimmedInterest = interestInput.trim();

    if (!trimmedInterest) {
      toast.error('Interest cannot be empty');
      return;
    }

    if (trimmedInterest.length > 30) {
      toast.error('Interest must be less than 30 characters');
      return;
    }

    const currentInterests = form.getValues('interests') || [];

    if (currentInterests.includes(trimmedInterest)) {
      toast.error('Interest already exists');
      return;
    }

    if (currentInterests.length >= 20) {
      toast.error('Maximum 20 interests allowed');
      return;
    }

    setIsAddingInterest(true);
    try {
      form.setValue('interests', [...currentInterests, trimmedInterest]);
      setInterestInput('');
    } finally {
      setIsAddingInterest(false);
    }
  }, [interestInput, form]);

  const removeInterest = useCallback(
    (interestToRemove: string) => {
      const currentInterests = form.getValues('interests') || [];
      form.setValue(
        'interests',
        currentInterests.filter(interest => interest !== interestToRemove)
      );
    },
    [form]
  );

  // Handle Enter key for skills and interests
  const handleSkillKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSkill();
      }
    },
    [addSkill]
  );

  const handleInterestKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addInterest();
      }
    },
    [addInterest]
  );

  // Memoize options to prevent unnecessary re-renders
  const accountTypeOptions: SearchSelectOption[] = useMemo(
    () =>
      Object.entries(AccountType).map(([key, value]) => ({
        label: key,
        value,
        description: `${key} account type`,
      })),
    []
  );

  const visibilityOptions: SearchSelectOption[] = useMemo(
    () =>
      Object.entries(ProfileVisibility).map(([key, value]) => ({
        label: key,
        value,
        icon:
          value === ProfileVisibility.Public ? (
            <Globe className='h-4 w-4' />
          ) : value === ProfileVisibility.Private ? (
            <Shield className='h-4 w-4' />
          ) : null,
      })),
    []
  );

  const tabs = useMemo(
    () => [
      { id: 'basic', label: 'Basic Info', icon: User },
      { id: 'professional', label: 'Professional', icon: Briefcase },
      { id: 'settings', label: 'Settings', icon: Shield },
    ],
    []
  );

  // Watch form values with memoization to prevent excessive re-renders
  const watchedSkills = form.watch('skills');
  const watchedInterests = form.watch('interests');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        {/* Tab Navigation with proper ARIA attributes */}
        <div className='flex gap-4 border-b mb-6' role='tablist' aria-label='Profile edit sections'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              type='button'
              role='tab'
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id as 'basic' | 'professional' | 'settings')}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className='h-4 w-4' />
              {tab.label}
            </button>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
            {activeTab === 'basic' && (
              <div id='panel-basic' role='tabpanel' aria-labelledby='tab-basic'>
                <FormSection title='Profile Images' description='Your avatar and cover image'>
                  <div className='space-y-4'>
                    <div>
                      <label className='text-sm font-medium mb-2 block'>Avatar</label>
                      <div className='relative'>
                        {form.watch('avatar') ? (
                          <div className='relative group'>
                            <img
                              src={form.watch('avatar')}
                              alt='Avatar'
                              className='h-32 w-32 rounded-full object-cover border-2 border-gray-200'
                              onError={() => form.setValue('avatar', '')}
                            />
                            <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center'>
                              <Button
                                type='button'
                                variant='destructive'
                                size='icon'
                                onClick={() => form.setValue('avatar', '')}
                                className='h-8 w-8'
                                disabled={isUploadingAvatar}
                              >
                                <X className='h-4 w-4' />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className='h-32 w-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors'>
                            <label className='cursor-pointer w-full h-full flex flex-col items-center justify-center'>
                              <input
                                type='file'
                                accept='image/*'
                                onChange={e => {

                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (file) {

                                    handleAvatarUpload(file);

                                  }

                                }}
                                disabled={isUploadingAvatar}
                                className='hidden'

                              />
                              {isUploadingAvatar ? (
                                <Loader2 className='h-8 w-8 text-gray-400 animate-spin' />
                              ) : (
                                <Camera className='h-8 w-8 text-gray-400' />
                              )}
                              <span className='text-xs text-gray-500 mt-1 text-center'>
                                {isUploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className='text-sm font-medium mb-2 block'>Cover Image</label>
                      <div className='relative'>
                        {form.watch('coverImage') ? (
                          <div className='relative group'>
                            <img
                              src={form.watch('coverImage')}
                              alt='Cover'
                              className='h-48 w-full object-cover rounded-lg border-2 border-gray-200'
                              onError={() => form.setValue('coverImage', '')}
                            />
                            <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center'>
                              <Button
                                type='button'
                                variant='destructive'
                                size='icon'
                                onClick={() => form.setValue('coverImage', '')}
                                className='h-8 w-8'
                                disabled={isUploadingCover}
                              >
                                <X className='h-4 w-4' />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className='h-48 w-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors'>
                            <label className='cursor-pointer w-full h-full flex flex-col items-center justify-center'>
                              <input
                                type='file'
                                accept='image/*'
                                onChange={e => {

                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (file) {

                                    handleCoverUpload(file);

                                  }

                                }}
                                disabled={isUploadingCover}
                                className='hidden'

                              />
                              {isUploadingCover ? (
                                <Loader2 className='h-8 w-8 text-gray-400 animate-spin' />
                              ) : (
                                <Upload className='h-8 w-8 text-gray-400' />
                              )}
                              <span className='text-sm text-gray-500 mt-2 text-center'>
                                {isUploadingCover ? 'Uploading...' : 'Upload Cover Image'}
                              </span>
                              <span className='text-xs text-gray-400 mt-1'>
                                Max 10MB • JPEG, PNG, GIF, WebP
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title='Basic Information'
                  description='Your public profile information'
                >
                  <div className='space-y-4'>
                    <FormField
                      form={form}
                      name='name'
                      label='Display Name'
                      placeholder='Your name'
                      required
                    />

                    <FormField
                      form={form}
                      name='username'
                      label='Username'
                      placeholder='Your unique username'
                      description='This will be your profile URL'
                      required
                    />

                    <FormField
                      form={form}
                      name='email'
                      label='Email'
                      type='email'
                      placeholder='your@email.com'
                      required
                    />

                    <div>
                      <label className='text-sm font-medium mb-2 block'>Bio</label>
                      <RichTextEditor
                        value={form.watch('bio') || ''}
                        onChange={value => form.setValue('bio', value)}
                        placeholder='Tell us about yourself'
                        maxHeight='200px'
                        showToolbar={false}
                      />
                    </div>

                    <FormField
                      form={form}
                      name='location'
                      label='Location'
                      placeholder='City, Country'
                      icon={<MapPin className='h-4 w-4' />}
                    />

                    <FormField
                      form={form}
                      name='website'
                      label='Website'
                      placeholder='https://yourwebsite.com'
                      icon={<Globe className='h-4 w-4' />}
                    />

                    <div>
                      <label className='text-sm font-medium mb-2 block'>Birthdate</label>
                      <DatePicker
                        value={form.watch('birthdate')}
                        onChange={date => form.setValue('birthdate', date || undefined)}
                        placeholder='Select your birthdate'
                        maxDate={new Date()}
                      />
                    </div>

                    <FormField
                      form={form}
                      name='phone'
                      label='Phone Number'
                      placeholder='+1 (555) 123-4567'
                      description='Only visible to you'
                    />
                  </div>
                </FormSection>
              </div>
            )}

            {activeTab === 'professional' && (
              <div id='panel-professional' role='tabpanel' aria-labelledby='tab-professional'>
                <FormSection
                  title='Professional Information'
                  description='Your work and education details'
                >
                  <div className='space-y-4'>
                    <div>
                      <label className='text-sm font-medium mb-2 block'>Account Type</label>
                      <SearchSelect
                        options={accountTypeOptions}
                        value={form.watch('accountType')}
                        onChange={value => form.setValue('accountType', value as AccountType)}
                        placeholder='Select account type'
                      />
                    </div>

                    <FormField
                      form={form}
                      name='profession'
                      label='Profession'
                      placeholder='What do you do?'
                      icon={<Briefcase className='h-4 w-4' />}
                    />

                    <FormField
                      form={form}
                      name='company'
                      label='Company'
                      placeholder='Where do you work?'
                    />

                    <FormField
                      form={form}
                      name='education'
                      label='Education'
                      placeholder='Your educational background'
                      type='textarea'
                      rows={2}
                    />
                  </div>
                </FormSection>

                <FormSection
                  title='Skills & Expertise'
                  description='Add your professional skills (max 20)'
                >
                  <div>
                    <div className='flex gap-2 mb-2 flex-wrap'>
                      {watchedSkills?.map(skill => (
                        <Badge key={skill} variant='secondary'>
                          {skill}
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            className='h-4 w-4 ml-1'
                            onClick={() => removeSkill(skill)}
                            aria-label={`Remove skill: ${skill}`}
                          >
                            <X className='h-3 w-3' />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className='flex gap-2'>
                      <Input
                        value={skillInput}
                        onChange={e => setSkillInput((e.target as HTMLInputElement).value)}
                        placeholder='Add a skill'
                        onKeyPress={handleSkillKeyPress}
                        maxLength={30}
                        disabled={isAddingSkill}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        onClick={addSkill}
                        disabled={
                          !skillInput.trim() || (watchedSkills?.length || 0) >= 20 || isAddingSkill
                        }
                      >
                        {isAddingSkill ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Add'}
                      </Button>
                    </div>
                    <p className='text-xs text-muted-foreground mt-1'>
                      {watchedSkills?.length || 0}/20 skills
                    </p>
                  </div>
                </FormSection>

                <FormSection title='Interests' description='What are you interested in? (max 20)'>
                  <div>
                    <div className='flex gap-2 mb-2 flex-wrap'>
                      {watchedInterests?.map(interest => (
                        <Badge key={interest} variant='outline'>
                          {interest}
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            className='h-4 w-4 ml-1'
                            onClick={() => removeInterest(interest)}
                            aria-label={`Remove interest: ${interest}`}
                          >
                            <X className='h-3 w-3' />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className='flex gap-2'>
                      <Input
                        value={interestInput}
                        onChange={e => setInterestInput((e.target as HTMLInputElement).value)}
                        placeholder='Add an interest'
                        onKeyPress={handleInterestKeyPress}
                        maxLength={30}
                        disabled={isAddingInterest}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        onClick={addInterest}
                        disabled={
                          !interestInput.trim() ||
                          (watchedInterests?.length || 0) >= 20 ||
                          isAddingInterest
                        }
                      >
                        {isAddingInterest ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Add'}
                      </Button>
                    </div>
                    <p className='text-xs text-muted-foreground mt-1'>
                      {watchedInterests?.length || 0}/20 interests
                    </p>
                  </div>
                </FormSection>
              </div>
            )}

            {activeTab === 'settings' && (
              <div id='panel-settings' role='tabpanel' aria-labelledby='tab-settings'>
                <FormSection
                  title='Privacy Settings'
                  description='Control who can see your information'
                  icon={<Shield className='h-5 w-5' />}
                >
                  <div className='space-y-4'>
                    <div>
                      <label className='text-sm font-medium mb-2 block'>Profile Visibility</label>
                      <SearchSelect
                        options={visibilityOptions}
                        value={form.watch('privacySettings.profileVisibility')}
                        onChange={value =>
                          form.setValue(
                            'privacySettings.profileVisibility',
                            value as ProfileVisibility
                          )
                        }
                        placeholder='Select visibility'
                      />
                    </div>

                    <FormField
                      form={form}
                      name='privacySettings.showEmail'
                      label='Show Email'
                      type='switch'
                      description='Display your email on your profile'
                    />

                    <FormField
                      form={form}
                      name='privacySettings.showLocation'
                      label='Show Location'
                      type='switch'
                      description='Display your location on your profile'
                    />

                    <FormField
                      form={form}
                      name='privacySettings.showBirthdate'
                      label='Show Birthdate'
                      type='switch'
                      description='Display your birthdate on your profile'
                    />

                    <FormField
                      form={form}
                      name='privacySettings.allowMessagesFrom'
                      label='Allow Messages From'
                      type='select'
                      options={[
                        { value: 'anyone', label: 'Anyone' },
                        { value: 'friends', label: 'Friends Only' },
                        { value: 'none', label: 'No One' },
                      ]}
                    />

                    <FormField
                      form={form}
                      name='privacySettings.showActivityStatus'
                      label='Show Activity Status'
                      type='switch'
                      description="Let others see when you're online"
                    />
                  </div>
                </FormSection>

                <FormSection
                  title='Email Notifications'
                  description='Choose what emails you receive'
                  icon={<Bell className='h-5 w-5' />}
                  collapsible
                  defaultOpen={false}
                >
                  <div className='space-y-4'>
                    <FormField
                      form={form}
                      name='notificationPreferences.email.newsletter'
                      label='Newsletter'
                      type='switch'
                      description='Receive our monthly newsletter'
                    />

                    <FormField
                      form={form}
                      name='notificationPreferences.email.eventReminders'
                      label='Event Reminders'
                      type='switch'
                      description='Get reminded about upcoming events'
                    />

                    <FormField
                      form={form}
                      name='notificationPreferences.email.productUpdates'
                      label='Product Updates'
                      type='switch'
                      description='Updates about products you follow'
                    />

                    <FormField
                      form={form}
                      name='notificationPreferences.email.communityActivity'
                      label='Community Activity'
                      type='switch'
                      description='Updates from your communities'
                    />

                    <FormField
                      form={form}
                      name='notificationPreferences.email.messages'
                      label='Direct Messages'
                      type='switch'
                      description='Email notifications for new messages'
                    />
                  </div>
                </FormSection>

                <FormSection
                  title='Push Notifications'
                  description='In-app and browser notifications'
                  icon={<Bell className='h-5 w-5' />}
                  collapsible
                  defaultOpen={false}
                >
                  <div className='space-y-4'>
                    <FormField
                      form={form}
                      name='notificationPreferences.push.eventReminders'
                      label='Event Reminders'
                      type='switch'
                    />

                    <FormField
                      form={form}
                      name='notificationPreferences.push.messages'
                      label='Messages'
                      type='switch'
                    />

                    <FormField
                      form={form}
                      name='notificationPreferences.push.mentions'
                      label='Mentions'
                      type='switch'
                    />

                    <FormField
                      form={form}
                      name='notificationPreferences.push.likes'
                      label='Likes'
                      type='switch'
                    />

                    <FormField
                      form={form}
                      name='notificationPreferences.push.comments'
                      label='Comments'
                      type='switch'
                    />
                  </div>
                </FormSection>
              </div>
            )}

            <div className='flex justify-end gap-2 pt-4 border-t'>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                disabled={isSaving || isUploading}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isSaving || isUploading || !form.formState.isValid}
                className='bg-primary text-primary-foreground hover:bg-primary/90'
              >
                {isSaving || isUploading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    {isUploading ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditModal;
