import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Calendar,
  Globe,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  Link as LinkIcon,
  Users,
  Star,
  Edit,
} from 'lucide-react';
import { AppUser } from '@/types/user';
import { calculateTimeAgo } from '@/lib/utils';

interface AboutTabProps {
  user: AppUser;
  isOwnProfile: boolean;
  onEditProfile?: () => void | undefined;
}

const AboutTab: React.FC<AboutTabProps> = ({ user, isOwnProfile, onEditProfile }) => {
  const joinDate = user.created_at ? calculateTimeAgo(new Date(user.created_at)) : 'Unknown';

  return (
    <div className='space-y-6'>
      {/* Basic Information */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>About</CardTitle>
          {isOwnProfile && onEditProfile && (
            <Button variant='outline' size='sm' onClick={onEditProfile} className='gap-2'>
              <Edit className='h-4 w-4' />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className='space-y-4'>
          {user.bio && (
            <div>
              <h4 className='font-medium mb-2'>Bio</h4>
              <p className='text-muted-foreground'>{user.bio}</p>
            </div>
          )}

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {user.location && (
              <div className='flex items-center gap-2'>
                <MapPin className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm'>{user.location}</span>
              </div>
            )}

            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>Joined {joinDate}</span>
            </div>

            {user.website && (
              <div className='flex items-center gap-2'>
                <Globe className='h-4 w-4 text-muted-foreground' />
                <a
                  href={user.website}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-sm text-primary hover:underline'
                >
                  {user.website}
                </a>
              </div>
            )}

            {user.email && (user as unknown).privacySettings?.showEmail && (
              <div className='flex items-center gap-2'>
                <Mail className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm'>{user.email}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      {((user as any).profession ||
        (user as any).company ||
        (user as any).education) && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Briefcase className='h-5 w-5' />
              Professional
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {(user as any).profession && (
              <div>
                <h4 className='font-medium mb-1'>Profession</h4>
                <p className='text-muted-foreground'>{(user as any).profession}</p>
              </div>
            )}

            {(user as any).company && (
              <div>
                <h4 className='font-medium mb-1'>Company</h4>
                <p className='text-muted-foreground'>{(user as any).company}</p>
              </div>
            )}

            {(user as any).education && (
              <div>
                <h4 className='font-medium mb-1'>Education</h4>
                <p className='text-muted-foreground'>{(user as any).education}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {(user as any).skills && (user as any).skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Skills & Expertise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-2'>
              {(user as any).skills.map((skill: string, index: number) => (
                <Badge key={index} variant='secondary'>
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interests */}
      {(user as any).interests && (user as any).interests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-2'>
              {(user as any).interests.map((interest: string, index: number) => (
                <Badge key={index} variant='outline'>
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Links */}
      {(user as any).socialLinks && (user as any).socialLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {(user as any).socialLinks.map((link: any, index: number) => (
                <div key={index} className='flex items-center gap-2'>
                  <LinkIcon className='h-4 w-4 text-muted-foreground' />
                  <a
                    href={link.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-sm text-primary hover:underline'
                  >
                    {link.platform}: {link.username || link.url}
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            {user.isVerified && (
              <Badge variant='default' className='gap-1'>
                <Star className='h-3 w-3' />
                Verified
              </Badge>
            )}

            {user.isEligibleForSubscription && (
              <Badge variant='secondary' className='gap-1'>
                <Users className='h-3 w-3' />
                Creator
              </Badge>
            )}

            {user.hasStore && (
              <Badge variant='outline' className='gap-1'>
                <Briefcase className='h-3 w-3' />
                Store Owner
              </Badge>
            )}

            {(user as any).accountType && (
              <Badge variant='outline'>{(user as any).accountType}</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutTab;
