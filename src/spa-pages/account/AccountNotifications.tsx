import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  CheckCircle,
  Search,
  Filter,
  Archive,
  Trash2,
  RefreshCw,
  MoreVertical,
  MessageSquare,
  Calendar,
  Users,
  Info,
  Heart,
  Reply,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatTimestamp } from '@/utils/dates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'event' | 'follow' | 'like' | 'comment' | 'system' | 'reminder';
  title: string;
  message: string;
  read: boolean;
  archived: boolean;
  created_at: string;
  metadata?: {
    action_url?: string | undefined;
    sender_id?: string | undefined;
    sender_name?: string | undefined;
    sender_avatar?: string | undefined;
    event_id?: string | undefined;
    event_title?: string | undefined;
  };
}

interface NotificationGroup {
  type: string;
  title: string;
  notifications: Notification[];
  count: number;
}

const AccountNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  // Fetch notifications with React Query
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      return data as Notification[];
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notificationIds);

      if (error) throw error;
    },
    onMutate: async (notificationIds) => {
      // Optimistic update
      const previousNotifications = queryClient.getQueryData(['notifications', user?.id]);
      queryClient.setQueryData(
        ['notifications', user?.id],
        (old: Notification[] | undefined) =>
          old?.map(notification =>
            notificationIds.includes(notification.id)
              ? { ...notification, read: true }
              : notification
          ) ?? []
      );
      return { previousNotifications };
    },
    onSuccess: () => {
      toast.success('Marked as read');
    },
    onError: (_err, _variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', user?.id], context.previousNotifications);
      }
      toast.error('Failed to mark as read');
    },
  });

  // Archive notifications mutation
  const archiveMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const { error } = await supabase
        .from('notifications')
        .update({ archived: true })
        .in('id', notificationIds);

      if (error) throw error;
    },
    onMutate: async (notificationIds) => {
      const previousNotifications = queryClient.getQueryData(['notifications', user?.id]);
      queryClient.setQueryData(
        ['notifications', user?.id],
        (old: Notification[] | undefined) =>
          old?.map(notification =>
            notificationIds.includes(notification.id)
              ? { ...notification, archived: true }
              : notification
          ) ?? []
      );
      return { previousNotifications };
    },
    onSuccess: () => {
      toast.success('Notifications archived');
      setSelectedNotifications(new Set());
    },
    onError: (_err, _variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', user?.id], context.previousNotifications);
      }
      toast.error('Failed to archive notifications');
    },
  });

  // Delete notifications mutation
  const deleteMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds);

      if (error) throw error;
    },
    onMutate: async (notificationIds) => {
      const previousNotifications = queryClient.getQueryData(['notifications', user?.id]);
      queryClient.setQueryData(
        ['notifications', user?.id],
        (old: Notification[] | undefined) =>
          old?.filter(notification => !notificationIds.includes(notification.id)) ?? []
      );
      return { previousNotifications };
    },
    onSuccess: () => {
      toast.success('Notifications deleted');
      setSelectedNotifications(new Set());
    },
    onError: (_err, _variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', user?.id], context.previousNotifications);
      }
      toast.error('Failed to delete notifications');
    },
  });

  // Filter notifications based on active tab and filters
  const filteredNotifications = notifications.filter(notification => {
    // Tab filter
    if (activeTab === 'unread' && notification.read) return false;
    if (activeTab === 'archived' && !notification.archived) return false;
    if (activeTab === 'all' && notification.archived) return false;

    // Type filter
    if (filterType !== 'all' && notification.type !== filterType) return false;

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Group notifications by type and date
  const groupNotifications = (notifications: Notification[]): NotificationGroup[] => {
    const groups: { [key: string]: Notification[] } = {};

    notifications.forEach(notification => {
      const key = notification.type;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notification);
    });

    return Object.entries(groups).map(([type, notifications]) => ({
      type,
      title: getTypeTitle(type),
      notifications: notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      count: notifications.length,
    }));
  };

  const getTypeTitle = (type: string): string => {
    const titles: { [key: string]: string } = {
      message: 'Messages',
      event: 'Events',
      follow: 'Followers',
      like: 'Likes',
      comment: 'Comments',
      system: 'System',
      reminder: 'Reminders',
    };
    return titles[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getNotificationIcon = (type: string) => {
    const icons: { [key: string]: React.ComponentType<{ className?: string }> } = {
      message: MessageSquare,
      event: Calendar,
      follow: Users,
      like: Heart,
      comment: Reply,
      system: Info,
      reminder: Bell,
    };
    return icons[type] || Bell;
  };

  const getNotificationColor = (type: string) => {
    const colors: { [key: string]: string } = {
      message: 'text-blue-600',
      event: 'text-green-600',
      follow: 'text-purple-600',
      like: 'text-red-600',
      comment: 'text-orange-600',
      system: 'text-gray-600',
      reminder: 'text-amber-600',
    };
    return colors[type] || 'text-gray-600';
  };

  const handleSelectNotification = (notificationId: string) => {
    const newSelection = new Set(selectedNotifications);
    if (newSelection.has(notificationId)) {
      newSelection.delete(notificationId);
    } else {
      newSelection.add(notificationId);
    }
    setSelectedNotifications(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const handleMarkSelectedAsRead = () => {
    if (selectedNotifications.size > 0) {
      markAsReadMutation.mutate(Array.from(selectedNotifications));
    }
  };

  const handleArchiveSelected = () => {
    if (selectedNotifications.size > 0) {
      archiveMutation.mutate(Array.from(selectedNotifications));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedNotifications.size > 0) {
      deleteMutation.mutate(Array.from(selectedNotifications));
    }
  };

  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;
  const archivedCount = notifications.filter(n => n.archived).length;
  const groupedNotifications = groupNotifications(filteredNotifications);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Stay updated with your activity and interactions
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search and Filter */}
            <div className="flex gap-2 flex-1 w-full sm:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[120px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="message">Messages</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                  <SelectItem value="follow">Follows</SelectItem>
                  <SelectItem value="like">Likes</SelectItem>
                  <SelectItem value="comment">Comments</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {selectedNotifications.size > 0 && (
                <>
                  <Button size="sm" variant="outline" onClick={handleMarkSelectedAsRead}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Read ({selectedNotifications.size})
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleArchiveSelected}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDeleteSelected}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread" className="relative">
            Unread
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({archivedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Bulk Actions */}
          {filteredNotifications.length > 0 && (
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedNotifications.size === filteredNotifications.length}
                  onChange={handleSelectAll}
                  className="rounded"
                />
                <span className="text-sm">
                  Select all ({filteredNotifications.length})
                </span>
              </label>
              {selectedNotifications.size > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedNotifications.size} selected
                </span>
              )}
            </div>
          )}

          {/* Notifications List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'unread'
                    ? "You're all caught up! No unread notifications."
                    : activeTab === 'archived'
                    ? "No archived notifications."
                    : "You don't have any notifications yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {groupedNotifications.map((group) => (
                <Card key={group.type}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {React.createElement(getNotificationIcon(group.type), {
                          className: `h-5 w-5 ${getNotificationColor(group.type)}`,
                        })}
                        {group.title}
                      </CardTitle>
                      <Badge variant="secondary">{group.count}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {group.notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                          !notification.read
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white border-gray-200'
                        } ${
                          selectedNotifications.has(notification.id)
                            ? 'ring-2 ring-primary'
                            : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedNotifications.has(notification.id)}
                          onChange={() => handleSelectNotification(notification.id)}
                          className="mt-1 rounded"
                        />

                        {notification.metadata?.sender_avatar ? (
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={notification.metadata.sender_avatar} />
                            <AvatarFallback>
                              {notification.metadata.sender_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center bg-gray-100`}>
                            {React.createElement(getNotificationIcon(notification.type), {
                              className: `h-5 w-5 ${getNotificationColor(notification.type)}`,
                            })}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatTimestamp(notification.created_at)}
                                </span>
                                {!notification.read && (
                                  <Badge variant="secondary" className="text-xs">
                                    New
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!notification.read && (
                                  <DropdownMenuItem
                                    onClick={() => markAsReadMutation.mutate([notification.id])}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as read
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => archiveMutation.mutate([notification.id])}
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archive
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => deleteMutation.mutate([notification.id])}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountNotifications;