import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Calendar,
  MessageSquare,
  Ticket,
  Bell,
  Users,
  Star,
  TrendingUp,
  ArrowRight,
  Shield,
  CheckCircle,
  AlertTriangle,
  Plus,
  Eye,
  Heart,
  Share2,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatTimestamp } from '@/utils/dates';

interface DashboardStats {
  eventsCreated: number;
  eventsAttended: number;
  messagesReceived: number;
  unreadNotifications: number;
  activeTickets: number;
  profileViews: number;
  followers: number;
  following: number;
}

interface RecentActivity {
  id: string;
  type: 'event' | 'message' | 'ticket' | 'profile';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ComponentType<{ className?: string } | undefined | undefined>;
  href?: string;
}

interface AccountHealth {
  profileComplete: number;
  securityScore: number;
  issues: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    action?: string | undefined;
    href?: string | undefined;
  }>;
}

const AccountDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    eventsCreated: 0,
    eventsAttended: 0,
    messagesReceived: 0,
    unreadNotifications: 0,
    activeTickets: 0,
    profileViews: 0,
    followers: 0,
    following: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [accountHealth, setAccountHealth] = useState<AccountHealth>({
    profileComplete: 0,
    securityScore: 0,
    issues: [],
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard statistics
      const [
        eventsData,
        ticketsData,
        notificationsData,
        messagesData
      ] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact' }).eq('creator_id', user?.id),
        supabase.from('tickets').select('id', { count: 'exact' }).eq('user_id', user?.id).eq('status', 'valid'),
        supabase.from('notifications').select('id', { count: 'exact' }).eq('user_id', user?.id).eq('read', false),
        supabase.from('conversations').select('id', { count: 'exact' }).contains('members', [user?.id])
      ]);

      setStats({
        eventsCreated: eventsData.count || 0,
        eventsAttended: 0, // TODO: Implement from event_attendees table
        messagesReceived: messagesData.count || 0,
        unreadNotifications: notificationsData.count || 0,
        activeTickets: ticketsData.count || 0,
        profileViews: 0, // TODO: Implement profile views tracking
        followers: 0, // TODO: Implement followers system
        following: 0, // TODO: Implement following system
      });

      // Generate recent activity
      const activities: RecentActivity[] = [
        {
          id: '1',
          type: 'event',
          title: 'Created new event',
          description: 'Summer Music Festival 2024',
          timestamp: new Date().toISOString(),
          icon: Calendar,
          href: '/events/create'
        },
        {
          id: '2',
          type: 'message',
          title: 'New message received',
          description: 'From Sarah about collaboration',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          icon: MessageSquare,
          href: '/account/messages'
        },
        {
          id: '3',
          type: 'ticket',
          title: 'Ticket purchased',
          description: 'Tech Conference 2024',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          icon: Ticket,
          href: '/account/tickets'
        }
      ];
      setRecentActivity(activities);

      // Calculate account health
      calculateAccountHealth();

    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAccountHealth = () => {
    const issues = [];
    let profileComplete = 0;
    let securityScore = 0;

    // Calculate profile completion
    const profileFields = [
      (user as any)?.display_name,
      user?.email,
      (user as any)?.bio,
      (user as any)?.avatar_url,
    ];
    const completedFields = profileFields.filter(Boolean).length;
    profileComplete = Math.round((completedFields / profileFields.length) * 100);

    // Calculate security score
    const securityFeatures = [
      user?.email_confirmed_at, // Email verified
      // TODO: Add 2FA check
      // TODO: Add recent password change
      true, // Strong password (placeholder)
    ];
    const enabledFeatures = securityFeatures.filter(Boolean).length;
    securityScore = Math.round((enabledFeatures / securityFeatures.length) * 100);

    // Check for issues
    if (profileComplete < 80) {
      issues.push({
        type: 'warning' as const,
        message: 'Complete your profile to help others discover you',
        action: 'Complete Profile',
        href: '/account/profile'
      });
    }

    if (securityScore < 75) {
      issues.push({
        type: 'error' as const,
        message: 'Improve your account security',
        action: 'Review Security',
        href: '/account/security'
      });
    }

    if (!user?.email_confirmed_at) {
      issues.push({
        type: 'error' as const,
        message: 'Please verify your email address',
        action: 'Verify Email',
      });
    }

    setAccountHealth({
      profileComplete,
      securityScore,
      issues
    });
  };

  const getUserDisplayName = () => {
    return (user as any)?.display_name ||
           (user as any)?.name ||
           user?.user_metadata?.display_name ||
           user?.user_metadata?.name ||
           'User';
  };

  const statCards = [
    {
      title: 'Events Created',
      value: stats.eventsCreated,
      icon: Calendar,
      href: '/events?filter=created',
      color: 'text-blue-600'
    },
    {
      title: 'Active Tickets',
      value: stats.activeTickets,
      icon: Ticket,
      href: '/account/tickets',
      color: 'text-green-600'
    },
    {
      title: 'Unread Messages',
      value: stats.messagesReceived,
      icon: MessageSquare,
      href: '/account/messages',
      color: 'text-purple-600'
    },
    {
      title: 'Notifications',
      value: stats.unreadNotifications,
      icon: Bell,
      href: '/account/notifications',
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {getUserDisplayName()}! Here's your account overview.
        </p>
      </div>

      {/* Account Health Alert */}
      {accountHealth.issues.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-800">Account Attention Needed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {accountHealth.issues.map((issue, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-amber-700">{issue.message}</span>
                {issue.action && issue.href && (
                  <Button size="sm" variant="outline" asChild>
                    <Link to={issue.href}>{issue.action}</Link>
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <Link
                  to={stat.href}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center mt-1"
                >
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Health
            </CardTitle>
            <CardDescription>
              Keep your account secure and complete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Profile Completion</span>
                <span className="text-sm text-muted-foreground">{accountHealth.profileComplete}%</span>
              </div>
              <Progress value={accountHealth.profileComplete} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Security Score</span>
                <span className="text-sm text-muted-foreground">{accountHealth.securityScore}%</span>
              </div>
              <Progress value={accountHealth.securityScore} className="h-2" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" asChild>
                <Link to="/account/profile">
                  <Eye className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/account/security">
                  <Shield className="mr-2 h-4 w-4" />
                  Security
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest actions and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-6">
                <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                        <Icon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Button variant="ghost" size="sm" className="w-full mt-3">
                  View All Activity
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts to get things done faster
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" asChild className="h-auto p-4">
              <Link to="/events/create" className="flex flex-col items-center gap-2">
                <Plus className="h-5 w-5" />
                <span className="font-medium">Create Event</span>
                <span className="text-xs text-muted-foreground">Start organizing</span>
              </Link>
            </Button>

            <Button variant="outline" asChild className="h-auto p-4">
              <Link to="/account/messages" className="flex flex-col items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <span className="font-medium">Send Message</span>
                <span className="text-xs text-muted-foreground">Connect with others</span>
              </Link>
            </Button>

            <Button variant="outline" asChild className="h-auto p-4">
              <Link to="/explore" className="flex flex-col items-center gap-2">
                <Star className="h-5 w-5" />
                <span className="font-medium">Explore Events</span>
                <span className="text-xs text-muted-foreground">Find new experiences</span>
              </Link>
            </Button>

            <Button variant="outline" asChild className="h-auto p-4">
              <Link to="/account/settings" className="flex flex-col items-center gap-2">
                <Settings className="h-5 w-5" />
                <span className="font-medium">Account Settings</span>
                <span className="text-xs text-muted-foreground">Customize your experience</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountDashboard;