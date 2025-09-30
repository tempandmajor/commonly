import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  Upload,
  Save,
  Eye,
  Edit2,
  MapPin,
  Globe,
  Briefcase,
  Mail,
  Calendar,
  Star,
  Users,
  CheckCircle,
  AlertTriangle,
  X,
  Plus,
  Link as LinkIcon,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { updateUserProfile } from '@/services/user';

interface ProfileData {
  display_name: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  profession: string;
  company: string;
  skills: string[];
  interests: string[];
  avatar_url: string;
  cover_image_url: string;
}

const AccountProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    display_name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    profession: '',
    company: '',
    skills: [],
    interests: [],
    avatar_url: '',
    cover_image_url: '',
  });
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);

      // Load user profile data from preferences
      const { data: userData, error } = await supabase
        .from('users')
        .select('preferences, username, display_name, avatar_url')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      const preferences = userData?.preferences || {};
      const profile = preferences.profile || {};

      setProfileData({
        display_name: userData?.display_name || (user as any)?.display_name || '',
        username: userData?.username || (user as any)?.username || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        profession: profile.profession || '',
        company: profile.company || '',
        skills: profile.skills || [],
        interests: profile.interests || [],
        avatar_url: userData?.avatar_url || (user as any)?.avatar_url || '',
        cover_image_url: profile.cover_image_url || '',
      });

    } catch (error) {
      toast.error('Failed to load profile data');

    } finally {

      setLoading(false);
    }

  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Update user profile
      const updateData: any = {
        display_name: profileData.display_name,
        name: profileData.display_name,
      };

      if (profileData.avatar_url !== ((user as any)?.avatar_url || '')) {
        updateData.avatar_url = profileData.avatar_url;
      }

      // Update basic user fields
      const profileUpdateOk = await updateUserProfile(user?.id || '', updateData);
      if (!profileUpdateOk) throw new Error('Failed to update profile');

      // Update username separately if changed
      if (profileData.username !== ((user as any)?.username || '')) {
        const { error: usernameError } = await supabase
          .from('users')
          .update({ username: profileData.username })
          .eq('id', user?.id);

        if (usernameError) throw usernameError;
      }

      // Update preferences with profile data
      const { error: prefsError } = await supabase
        .from('users')
        .update({
          preferences: {
            profile: {
              bio: profileData.bio,
              location: profileData.location,
              website: profileData.website,
              profession: profileData.profession,
              company: profileData.company,
              skills: profileData.skills,
              interests: profileData.interests,
              cover_image_url: profileData.cover_image_url,
            }
          }
        })
        .eq('id', user?.id);

      if (prefsError) throw prefsError;

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'avatar' | 'cover') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      if (type === 'avatar') {
        setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));
      } else {
        setProfileData(prev => ({ ...prev, cover_image_url: publicUrl }));
      }

      toast.success(`${type === 'avatar' ? 'Avatar' : 'Cover image'} uploaded successfully`);
    } catch (error) {
      toast.error(`Failed to upload ${type === 'avatar' ? 'avatar' : 'cover image'}`);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData(prev => ({
          ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setProfileData(prev => ({
          ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !profileData.interests.includes(newInterest.trim())) {
      setProfileData(prev => ({
          ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setProfileData(prev => ({
          ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const getProfileCompleteness = () => {
    const fields = [
      profileData.display_name,
      profileData.bio,
      profileData.location,
      profileData.profession,
      profileData.avatar_url,
      profileData.skills.length > 0,
      profileData.interests.length > 0,
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completeness = getProfileCompleteness();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your public profile information and settings
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Completeness */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-800">Profile Completion</CardTitle>
            </div>
            <Badge variant="secondary">{completeness}%</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <p className="text-sm text-blue-700 mt-2">
            {completeness < 100
              ? `Complete your profile to help others discover and connect with you`
              : `Your profile is complete! Great job.`
            }
          </p>
        </CardContent>
      </Card>

      {/* Cover Image & Avatar Section */}
      <Card>
        <CardContent className="p-0">
          {/* Cover Image */}
          <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg overflow-hidden">
            {profileData.cover_image_url && (
              <img
                src={profileData.cover_image_url}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
            {isEditing && (
              <div className="absolute top-4 right-4">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {

                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleImageUpload(file, 'cover');

                  }}

                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => coverInputRef.current?.click()}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Change Cover
                </Button>
              </div>
            )}
          </div>

          {/* Avatar & Basic Info */}
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                  <AvatarImage src={profileData.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {profileData.display_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="absolute bottom-0 right-0">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {

                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleImageUpload(file, 'avatar');

                      }}

                    />
                    <Button
                      size="sm"
                      className="rounded-full h-8 w-8 p-0"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Name & Basic Info */}
              <div className="flex-1 min-w-0">
                <div className="sm:mt-16">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input
                          id="display_name"
                          value={profileData.display_name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, display_name: (e.target as HTMLInputElement).value }))}
                          placeholder="Your display name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={profileData.username}
                          onChange={(e) => setProfileData(prev => ({ ...prev, username: (e.target as HTMLInputElement).value }))}
                          placeholder="Your unique username"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold">{profileData.display_name || 'No name set'}</h2>
                      {profileData.username && (
                        <p className="text-muted-foreground">@{profileData.username}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Tell others about yourself and your interests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bio">Bio</Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell people about yourself..."
                  rows={3}
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  {profileData.bio || 'No bio added yet'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              {isEditing ? (
                <Input
                  id="location"
                  value={profileData.location}
                  onChange={(e) => setProfileData(prev => ({ ...prev, location: (e.target as HTMLInputElement).value }))}
                  placeholder="City, Country"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profileData.location || 'No location set'}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              {isEditing ? (
                <Input
                  id="website"
                  value={profileData.website}
                  onChange={(e) => setProfileData(prev => ({ ...prev, website: (e.target as HTMLInputElement).value }))}
                  placeholder="https://your-website.com"
                  type="url"
                />
              ) : profileData.website ? (
                <div className="flex items-center gap-2 mt-1">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={profileData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {profileData.website}
                  </a>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No website added</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>
              Share your professional background
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="profession">Profession</Label>
              {isEditing ? (
                <Input
                  id="profession"
                  value={profileData.profession}
                  onChange={(e) => setProfileData(prev => ({ ...prev, profession: (e.target as HTMLInputElement).value }))}
                  placeholder="Your job title or profession"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profileData.profession || 'No profession set'}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="company">Company</Label>
              {isEditing ? (
                <Input
                  id="company"
                  value={profileData.company}
                  onChange={(e) => setProfileData(prev => ({ ...prev, company: (e.target as HTMLInputElement).value }))}
                  placeholder="Your company or organization"
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  {profileData.company || 'No company set'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills & Interests */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>
              Add skills that represent your expertise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing && (
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill((e.target as HTMLInputElement).value)}
                  placeholder="Add a skill..."
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button size="sm" onClick={addSkill} disabled={!newSkill.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {profileData.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="relative">
                  {skill}
                  {isEditing && (
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {profileData.skills.length === 0 && (
                <p className="text-sm text-muted-foreground">No skills added yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardHeader>
            <CardTitle>Interests</CardTitle>
            <CardDescription>
              Share what you're passionate about
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing && (
              <div className="flex gap-2">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest((e.target as HTMLInputElement).value)}
                  placeholder="Add an interest..."
                  onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                />
                <Button size="sm" onClick={addInterest} disabled={!newInterest.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {profileData.interests.map((interest, index) => (
                <Badge key={index} variant="outline" className="relative">
                  {interest}
                  {isEditing && (
                    <button
                      onClick={() => removeInterest(interest)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {profileData.interests.length === 0 && (
                <p className="text-sm text-muted-foreground">No interests added yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Preview */}
      {!isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Public Profile Preview
            </CardTitle>
            <CardDescription>
              This is how your profile appears to other users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <a href={`/profile/${profileData.username}`} target="_blank" rel="noopener noreferrer">
                <Eye className="mr-2 h-4 w-4" />
                View Public Profile
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

};

export default AccountProfile;