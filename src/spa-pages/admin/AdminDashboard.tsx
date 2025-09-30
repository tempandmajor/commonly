import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Calendar,
  Building2,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Activity,
  ChefHat,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export default function AdminDashboard() {
  const { stats, activities, alerts, loading, refresh } = useDashboardStats();

  const statsConfig = [
    {
      title: 'Total Users',
      value: stats?.totalUsers.toLocaleString() || '0',
      change: '+12%',
      trend: 'up' as const,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Active Events',
      value: stats?.activeEvents.toString() || '0',
      change: '+8%',
      trend: 'up' as const,
      icon: Calendar,
      color: 'green',
    },
    {
      title: 'Venues Listed',
      value: stats?.venuesListed.toString() || '0',
      change: '+5%',
      trend: 'up' as const,
      icon: Building2,
      color: 'purple',
    },
    {
      title: 'Revenue',
      value: `$${stats?.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`,
      change: '-2%',
      trend: 'down' as const,
      icon: DollarSign,
      color: 'orange',
    },
    {
      title: 'Caterers',
      value: stats?.caterers.toString() || '0',
      change: '+15%',
      trend: 'up' as const,
      icon: ChefHat,
      color: 'pink',
    },
    {
      title: 'Conversion Rate',
      value: `${stats?.conversionRate.toFixed(1) || '0.0'}%`,
      change: '+0.5%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'indigo',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with your platform.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button>
            <Activity className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {alerts.map((alert, index) => (
            <Card key={index} className={`border-l-4 ${
              alert.type === 'error' ? 'border-l-destructive bg-destructive/10' :
              alert.type === 'warning' ? 'border-l-border bg-secondary' :
              'border-l-primary bg-primary/10'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`h-5 w-5 ${
                    alert.type === 'error' ? 'text-destructive' :
                    alert.type === 'warning' ? 'text-muted-foreground' :
                    'text-primary'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                  </div>
                  <Badge variant="secondary">{alert.count}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          statsConfig.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </CardTitle>
                <div className="p-2 rounded-lg bg-secondary">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className={`flex items-center text-sm ${
                    stat.trend === 'up' ? 'text-primary' : 'text-destructive'
                  }`}>
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {stat.change}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })
        )}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions across your platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))
              ) : activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 py-2">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'user' ? 'bg-blue-500' :
                      activity.type === 'event' ? 'bg-green-500' :
                      activity.type === 'venue' ? 'bg-purple-500' :
                      activity.type === 'payment' ? 'bg-orange-500' :
                      'bg-red-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {activity.user}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {activity.time}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full">
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button variant="outline" className="justify-start h-12">
                <Users className="mr-3 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Manage Users</div>
                  <div className="text-xs text-gray-500">View and edit user accounts</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-12">
                <Calendar className="mr-3 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Review Events</div>
                  <div className="text-xs text-gray-500">Approve pending events</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-12">
                <Building2 className="mr-3 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Venue Approvals</div>
                  <div className="text-xs text-gray-500">Review venue applications</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-12">
                <BarChart3 className="mr-3 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Generate Reports</div>
                  <div className="text-xs text-gray-500">Platform analytics and insights</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}