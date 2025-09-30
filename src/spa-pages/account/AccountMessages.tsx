import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Image as ImageIcon,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Archive,
  Star,
  Check,
  CheckCheck,
  Reply,
  Edit2,
  Trash2,
  Plus,
  Users,
  Filter,
  Settings,
  Pin,
  Volume2,
  VolumeX,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'voice';
  created_at: string;
  is_read: boolean;
  is_edited: boolean;
  reply_to_id?: string | undefined;
  metadata?: {
    file_name?: string | undefined;
    file_size?: number | undefined;
    image_url?: string | undefined;
    file_url?: string | undefined;
    duration?: number | undefined;
  };
}

interface Conversation {
  id: string;
  title?: string | undefined;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  members: string[];
  last_message?: {
    content: string | undefined;
    sender_id: string;
    created_at: string;
  };
  unread_count: number;
  is_pinned: boolean;
  is_muted: boolean;
  is_archived: boolean;
}

interface ConversationMember {
  user_id: string;
  display_name: string;
  avatar_url?: string | undefined;
  is_online: boolean;
  last_seen?: string | undefined;
}

const AccountMessages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInMessages, setSearchInMessages] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations
  const {
    data: conversations = [],
    isLoading: conversationsLoading,
  } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          members,
          last_message,
          unread_count:messages(count)
        `)
        .contains('members', [user.id])
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Process conversations to add member info
      const processedConversations = await Promise.all(
        (data || []).map(async (conv) => {
          const otherMembers = conv.members.filter((id: string) => id !== user.id);

          // Get member info for 1-on-1 conversations
          if (!conv.is_group && otherMembers.length === 1) {
            const { data: memberData } = await supabase
              .from('users')
              .select('display_name, avatar_url')
              .eq('id', otherMembers[0])
              .single();

            return {
          ...conv,
              title: conv.title || memberData?.display_name || 'Unknown User',
            };
          }

          return conv;
        })
      );

      return processedConversations;
    },
    enabled: !!user?.id,
  });

  // Fetch messages for selected conversation
  const {
    data: messages = [],
    isLoading: messagesLoading,
  } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedConversation,
  });

  // Fetch conversation members
  const {
    data: conversationMembers = [],
  } = useQuery({
    queryKey: ['conversation-members', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];

      const conversation = conversations.find(c => c.id === selectedConversation);
      if (!conversation) return [];

      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, avatar_url')
        .in('id', conversation.members);

      if (error) throw error;
      return data.map(user => ({
        user_id: user.id,
        display_name: user.display_name || 'Unknown User',
        avatar_url: user.avatar_url,
        is_online: false, // TODO: Implement real-time presence
        })) as ConversationMember[];
    },
    enabled: !!selectedConversation && conversations.length > 0,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, type = 'text', replyTo }: {
      content: string;
      type?: string;
      replyTo?: string;
    }) => {
      if (!selectedConversation || !user?.id) throw new Error('No conversation selected');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user.id,
          content,
          message_type: type,
          reply_to_id: replyTo,
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation last_message
      await supabase
        .from('conversations')
        .update({
          last_message: {
            content,
            sender_id: user.id,
            created_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedConversation);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
      setNewMessage('');
      setReplyingTo(null);
      scrollToBottom();
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const { error } = await supabase
        .from('messages')
        .update({
          content,
          is_edited: true,
        })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      setEditingMessage(null);
      toast.success('Message updated');
    },
    onError: () => {
      toast.error('Failed to edit message');
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      toast.success('Message deleted');
    },
    onError: () => {
      toast.error('Failed to delete message');
    },
  });

  // Archive conversation mutation
  const archiveConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('conversations')
        .update({ is_archived: true })
        .eq('id', conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
      setSelectedConversation(null);
      toast.success('Conversation archived');
    },
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`messages:${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
          queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, queryClient, user?.id]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    sendMessageMutation.mutate({
      content: newMessage,
      ...(replyingTo && { replyTo: replyingTo.id }),
    });

  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEditMessage = (messageId: string, content: string) => {
    editMessageMutation.mutate({ messageId, content });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMessages = messages.filter(msg =>
    searchInMessages
      ? msg.content.toLowerCase().includes(searchInMessages.toLowerCase())
      : true
  );

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);
  const otherMembers = conversationMembers.filter(m => m.user_id !== user?.id);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">
            Connect and chat with your community
          </p>
        </div>
        <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Conversation</DialogTitle>
              <DialogDescription>
                Search for people to start a conversation with
              </DialogDescription>
            </DialogHeader>
            {/* TODO: Implement user search and conversation creation */}
            <div className="text-center py-8 text-muted-foreground">
              User search coming soon...
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Messages Interface */}
      <div className="grid lg:grid-cols-3 gap-6 h-[700px]">
        {/* Conversations Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>All Conversations</DropdownMenuItem>
                  <DropdownMenuItem>Unread Only</DropdownMenuItem>
                  <DropdownMenuItem>Pinned</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Archived</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {conversationsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation === conversation.id
                        ? 'bg-primary/10 border-r-2 border-primary'
                        : ''
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={otherMembers[0]?.avatar_url} />
                        <AvatarFallback>
                          {conversation.title?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.is_pinned && (
                        <Pin className="absolute -top-1 -right-1 h-3 w-3 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{conversation.title}</h3>
                        <div className="flex items-center gap-1">
                          {conversation.is_muted && (
                            <VolumeX className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {conversation.last_message?.created_at &&
                              formatTimestamp(conversation.last_message.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.last_message?.content || 'No messages yet'}
                        </p>
                        {conversation.unread_count > 0 && (
                          <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredConversations.length === 0 && (
                  <div className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-muted-foreground">No conversations found</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={otherMembers[0]?.avatar_url} />
                      <AvatarFallback>
                        {selectedConversationData?.title?.split(' ').map(n => n[0]).join('') || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{selectedConversationData?.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversationData?.is_group
                          ? `${conversationMembers.length} members`
                          : otherMembers[0]?.is_online ? 'Online' : 'Offline'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search messages..."
                        value={searchInMessages}
                        onChange={(e) => setSearchInMessages((e.target as HTMLInputElement).value)}
                        className="pl-10 w-40"
                        size="sm"
                      />
                    </div>
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Pin className="mr-2 h-4 w-4" />
                          Pin Conversation
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <VolumeX className="mr-2 h-4 w-4" />
                          Mute Notifications
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Star className="mr-2 h-4 w-4" />
                          Star Conversation
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => archiveConversationMutation.mutate(selectedConversation)}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <Separator />

              {/* Messages */}
              <CardContent className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {messagesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start space-x-3">
                          <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    filteredMessages.map((message) => {
                      const isOwn = message.sender_id === user?.id;
                      const sender = conversationMembers.find(m => m.user_id === message.sender_id);

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                            {!isOwn && (
                              <div className="flex items-center gap-2 mb-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={sender?.avatar_url} />
                                  <AvatarFallback className="text-xs">
                                    {sender?.display_name.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium">{sender?.display_name}</span>
                              </div>
                            )}

                            {message.reply_to_id && (
                              <div className="text-xs text-muted-foreground mb-1 pl-3 border-l-2 border-gray-200">
                                Replying to a message
                              </div>
                            )}

                            <div
                              className={`rounded-lg p-3 ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              {editingMessage === message.id ? (
                                <div className="space-y-2">
                                  <Input
                                    defaultValue={message.content}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        handleEditMessage(message.id, e.currentTarget.value);
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      onClick={() => setEditingMessage(null)}
                                      variant="ghost"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm">{message.content}</p>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs opacity-70">
                                      {formatTimestamp(message.created_at)}
                                      {message.is_edited && ' (edited)'}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {isOwn && (
                                        <>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                                              >
                                                <MoreVertical className="h-3 w-3" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                              <DropdownMenuItem
                                                onClick={() => setEditingMessage(message.id)}
                                              >
                                                <Edit2 className="mr-2 h-4 w-4" />
                                                Edit
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => setReplyingTo(message)}
                                              >
                                                <Reply className="mr-2 h-4 w-4" />
                                                Reply
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => deleteMessageMutation.mutate(message.id)}
                                                className="text-red-600"
                                              >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                          {message.is_read ? (
                                            <CheckCheck className="h-3 w-3 opacity-70" />
                                          ) : (
                                            <Check className="h-3 w-3 opacity-70" />
                                          )}
                                        </>
                                      )}
                                      {!isOwn && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                                          onClick={() => setReplyingTo(message)}
                                        >
                                          <Reply className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="max-w-[70%] rounded-lg p-3 bg-gray-100">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              <Separator />

              {/* Message Input */}
              <CardContent className="p-4">
                {replyingTo && (
                  <div className="mb-3 p-2 bg-gray-50 rounded-lg text-sm border-l-2 border-primary">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Replying to: {replyingTo.content.slice(0, 50)}...
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(null)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ImageIcon className="h-4 w-4" />
                  </Button>

                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage((e.target as HTMLInputElement).value)}
                      onKeyPress={handleKeyPress}
                      className="pr-12"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AccountMessages;