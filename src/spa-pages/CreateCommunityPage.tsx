import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Lock, Globe, Star, MessageCircle, Calendar, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EnhancedCommunityForm from '@/components/community/EnhancedCommunityForm';
import { useAuth } from '@/providers/AuthProvider';

const CreateCommunityPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSuccess = () => {
    navigate('/community');
  };

  if (!user) {
    return (
      <div className='min-h-screen bg-white text-[#2B2B2B] flex items-center justify-center'>
        <div className='text-center max-w-md mx-auto px-4'>
          <Users className='h-16 w-16 text-gray-400 mx-auto mb-6' />
          <h1 className='text-2xl font-bold text-[#2B2B2B] mb-4'>Sign In Required</h1>
          <p className='text-gray-600 mb-8'>You need to be signed in to create a community.</p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button
              onClick={() => navigate('/auth')}
              className='bg-[#2B2B2B] hover:bg-gray-800 text-white'
            >
              Sign In
            </Button>
            <Button
              variant='outline'
              onClick={() => navigate('/community')}
              className='border-gray-300 text-[#2B2B2B] hover:bg-gray-50'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Communities
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white text-[#2B2B2B]'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='container mx-auto px-4 py-6'>
          <div className='flex items-center gap-4 mb-4'>
            <Button
              variant='ghost'
              onClick={() => navigate('/community')}
              className='text-gray-600 hover:text-[#2B2B2B] hover:bg-gray-50'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Communities
            </Button>
          </div>

          <div className='max-w-4xl'>
            <h1 className='text-3xl font-bold text-[#2B2B2B] mb-2'>Create Your Community</h1>
            <p className='text-gray-600'>
              Build a space where like-minded people can connect, share ideas, and grow together
            </p>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-8'>
        <div className='grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto'>
          {/* Main Form */}
          <div className='lg:col-span-2'>
            <Card className='border border-gray-200 bg-white'>
              <CardHeader>
                <CardTitle className='text-xl text-[#2B2B2B]'>Community Details</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedCommunityForm onSuccess={handleSuccess} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with Information */}
          <div className='space-y-6'>
            {/* Community Features */}
            <Card className='border border-gray-200 bg-white'>
              <CardHeader>
                <CardTitle className='text-lg text-[#2B2B2B] flex items-center gap-2'>
                  <Star className='h-5 w-5' />
                  Community Features
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-start gap-3'>
                  <MessageCircle className='h-5 w-5 text-[#2B2B2B] mt-0.5' />
                  <div>
                    <h4 className='font-medium text-[#2B2B2B]'>Discussions</h4>
                    <p className='text-sm text-gray-600'>
                      Create ongoing conversations and engage with members
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <Calendar className='h-5 w-5 text-[#2B2B2B] mt-0.5' />
                  <div>
                    <h4 className='font-medium text-[#2B2B2B]'>Events</h4>
                    <p className='text-sm text-gray-600'>
                      Host exclusive events for your community members
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <Users className='h-5 w-5 text-[#2B2B2B] mt-0.5' />
                  <div>
                    <h4 className='font-medium text-[#2B2B2B]'>Member Management</h4>
                    <p className='text-sm text-gray-600'>
                      Manage roles, permissions, and member interactions
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <Shield className='h-5 w-5 text-[#2B2B2B] mt-0.5' />
                  <div>
                    <h4 className='font-medium text-[#2B2B2B]'>Moderation Tools</h4>
                    <p className='text-sm text-gray-600'>
                      Keep your community safe with built-in moderation features
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <Zap className='h-5 w-5 text-[#2B2B2B] mt-0.5' />
                  <div>
                    <h4 className='font-medium text-[#2B2B2B]'>Real-time Updates</h4>
                    <p className='text-sm text-gray-600'>
                      Live notifications and real-time interactions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Information */}
            <Card className='border border-gray-200 bg-white'>
              <CardHeader>
                <CardTitle className='text-lg text-[#2B2B2B]'>Privacy Options</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-start gap-3'>
                  <Globe className='h-5 w-5 text-green-600 mt-0.5' />
                  <div>
                    <h4 className='font-medium text-[#2B2B2B]'>Public Community</h4>
                    <p className='text-sm text-gray-600'>
                      Anyone can discover and join your community. Great for building large, open
                      communities and increasing visibility.
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <Lock className='h-5 w-5 text-orange-600 mt-0.5' />
                  <div>
                    <h4 className='font-medium text-[#2B2B2B]'>Private Community</h4>
                    <p className='text-sm text-gray-600'>
                      Only invited members can see and join. Perfect for exclusive groups,
                      professional networks, and focused discussions.
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <Star className='h-5 w-5 text-purple-600 mt-0.5' />
                  <div>
                    <h4 className='font-medium text-[#2B2B2B]'>Premium Community</h4>
                    <p className='text-sm text-gray-600'>
                      Charge for access to create sustainable, high-value communities with
                      dedicated members.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Getting Started Tips */}
            <Card className='border border-gray-200 bg-white'>
              <CardHeader>
                <CardTitle className='text-lg text-[#2B2B2B]'>Tips for Success</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='text-sm space-y-2'>
                  <p className='font-medium text-[#2B2B2B]'>💡 Choose a clear name</p>
                  <p className='text-gray-600'>
                    Pick a name that clearly represents your community's purpose and is easy to remember.
                  </p>
                </div>
                <div className='text-sm space-y-2'>
                  <p className='font-medium text-[#2B2B2B]'>🎯 Define your niche</p>
                  <p className='text-gray-600'>
                    Be specific about your community's focus to attract the right members.
                  </p>
                </div>
                <div className='text-sm space-y-2'>
                  <p className='font-medium text-[#2B2B2B]'>📋 Set clear rules</p>
                  <p className='text-gray-600'>
                    Establish guidelines early to create a positive environment for all members.
                  </p>
                </div>
                <div className='text-sm space-y-2'>
                  <p className='font-medium text-[#2B2B2B]'>🏷️ Use relevant tags</p>
                  <p className='text-gray-600'>
                    Add descriptive tags to help people discover your community.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Help Information */}
            <Alert className='border-blue-200 bg-blue-50'>
              <AlertDescription className='text-blue-800'>
                <strong>Need help?</strong> Our community creation guide covers best practices,
                moderation tips, and growth strategies. You can always update your community
                settings after creation.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCommunityPage;