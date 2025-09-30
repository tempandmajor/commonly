/**
 * Real-time Messaging Service with Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealTimeMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file';
  metadata?: Record<string, any> | undefined;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface TypingIndicator {
  user_id: string;
  conversation_id: string;
  is_typing: boolean;
  timestamp: string;
}

export interface OnlineStatus {
  user_id: string;
  is_online: boolean;
  last_seen: string;
}

export class RealTimeMessageService {
  private static instance: RealTimeMessageService;
  private channels: Map<string, RealtimeChannel> = new Map();

  public static getInstance(): RealTimeMessageService {
    if (!RealTimeMessageService.instance) {
      RealTimeMessageService.instance = new RealTimeMessageService();
    }
    return RealTimeMessageService.instance;
  }

  // Subscribe to messages in a conversation
  subscribeToMessages(
    conversationId: string,
    callbacks: {
      onNewMessage?: (message: RealTimeMessage) => void;
      onMessageUpdate?: (message: RealTimeMessage) => void;
      onMessageDelete?: (messageId: string) => void;
    }
  ): () => void {
    const channelName = `messages:${conversationId}`;

    // Unsubscribe from existing channel if it exists
    this.unsubscribeFromChannel(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          callbacks.onNewMessage?.(payload.new as RealTimeMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          callbacks.onMessageUpdate?.(payload.new as RealTimeMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          callbacks.onMessageDelete?.(payload.old.id);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribeFromChannel(channelName);
  }

  // Subscribe to typing indicators
  subscribeToTyping(
    conversationId: string,
    onTypingChange: (typingData: TypingIndicator) => void
  ): () => void {
    const channelName = `typing:${conversationId}`;

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'typing' }, payload => {
        onTypingChange(payload.payload as TypingIndicator);
      })
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribeFromChannel(channelName);
  }

  // Subscribe to user online status
  subscribeToOnlineStatus(
    userIds: string[],
    onStatusChange: (status: OnlineStatus) => void
  ): () => void {
    const channelName = `presence:users`;

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'user_status' }, payload => {
        const status = payload.payload as OnlineStatus;
        if (userIds.includes(status.user_id)) {
          onStatusChange(status);
        }
      })
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribeFromChannel(channelName);
  }

  // Broadcast typing status
  async broadcastTyping(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    const channelName = `typing:${conversationId}`;
    const channel = this.channels.get(channelName);

    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: userId,
          conversation_id: conversationId,
          is_typing: isTyping,
          timestamp: new Date().toISOString(),
        } as TypingIndicator,
      });
    }
  }

  // Broadcast online status
  async broadcastOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const channelName = `presence:users`;
    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = supabase.channel(channelName).subscribe();
      this.channels.set(channelName, channel);
    }

    await channel.send({
      type: 'broadcast',
      event: 'user_status',
      payload: {
        user_id: userId,
        is_online: isOnline,
        last_seen: new Date().toISOString(),
      } as OnlineStatus,
    });
  }

  // Send a message
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    metadata?: Record<string, any>
  ): Promise<RealTimeMessage | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          message_type: messageType,
          metadata,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation's last message
      await supabase
        .from('conversations')
        .update({
          last_message: { content, sender_id: senderId },
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      return data as RealTimeMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Get conversation messages
  async getMessages(conversationId: string): Promise<RealTimeMessage[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as RealTimeMessage[];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  // Create a new conversation
  async createConversation(participants: string[], title?: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          members: participants,
          title: title || null,
          last_message: null,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  // Get user conversations
  async getUserConversations(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(
          `
          id,
          title,
          members,
          last_message,
          updated_at,
          created_at
        `
        )
        .contains('members', [userId])
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  // Unsubscribe from a specific channel
  private unsubscribeFromChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  // Clean up all subscriptions
  cleanup(): void {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

export default RealTimeMessageService;
