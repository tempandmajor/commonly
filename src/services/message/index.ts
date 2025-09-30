/**
 * Message Service
 * Provides functions for messaging functionality throughout the application
 * Following the established consolidation pattern seen in other services
 */

import { supabaseService } from '../supabase';
import { toast } from 'sonner';
import type { Message, Conversation } from './types';
import { cache } from './cache';

/**
 * Send a message within a conversation
 * @param conversationId - ID of the conversation
 * @param senderId - ID of the message sender
 * @param content - Message content
 * @returns True if successful, false otherwise
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string
): Promise<boolean> => {
  try {
    // First validate the inputs
    if (!conversationId || !senderId || !content.trim()) {
      return false;
    }

    // Insert the message into the database
    const timestamp = new Date();
    const { data, error, status } = await supabaseService.insert<any>('messages', {
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      timestamp: timestamp.toISOString(),
      is_read: false, // Using is_read instead of read to match the schema
    });

    if (error || status === 'error') {
      toast.error('Failed to send message');
      return false;
    }

    // Update conversation timestamp
    await supabaseService.update('conversations', conversationId, {
      updated_at: timestamp,
    });

    // Clear relevant caches
    cache.invalidate(`conversation:${conversationId}:messages`);
    cache.invalidate(`conversation:${conversationId}`);

    // We also need to invalidate user conversation caches
    // Get the conversation to find participants
    const { data: convData } = await supabaseService.getById<any>('conversations', conversationId);
    if (convData?.participants) {
      convData.participants.forEach((userId: string) => {
        cache.invalidateByPrefix(`user:${userId}:`);
      });
    }

    return true;
  } catch (error) {
    toast.error('Failed to send message');
    return false;
  }
};

/**
 * Get all messages in a conversation
 * @param conversationId - ID of the conversation
 * @param limit - Maximum number of messages to retrieve (default 50)
 * @param before - Timestamp to get messages before (for pagination)
 * @returns Array of messages
 */
export const getMessages = async (
  conversationId: string,
  limit = 50,
  before?: Date
): Promise<Message[]> => {
  try {
    // Check cache first
    const cacheKey = `conversation:${conversationId}:messages`;
    const cachedMessages = cache.get<Message[]>(cacheKey);

    // Only use cache if we're getting the default limit and not paginating
    if (cachedMessages && limit === 50 && !before) {
      return cachedMessages;
    }

    // Build query parameters
    const filters: Array<{
      field: string;
      operator: 'eq' | 'lt' | 'neq' | 'gt' | 'gte' | 'lte' | 'in' | 'is';
      value: any;
    }> = [{ field: 'conversation_id', operator: 'eq', value: conversationId }];

    // Add timestamp filter for pagination if provided
    if (before) {
      // Convert Date to ISO string for compatibility
      filters.push({ field: 'timestamp', operator: 'lt', value: before.toISOString() });
    }

    // Query the messages
    const { data, error, status } = await supabaseService.getMany<any>('messages', {
      filters,
      orderBy: { column: 'timestamp', ascending: false },
      limit,
    });

    if (error || status === 'error' || !data) {
      return [];
    }

    // Format the response
    const messages: Message[] = data.map((msg: unknown) => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      read: msg.is_read,
    }));

    // Only cache if this is the initial load (not pagination)
    if (limit === 50 && !before) {
      cache.set(cacheKey, messages);
    }

    return messages;
  } catch (error) {
    return [];
  }
};

/**
 * Mark a message as read
 * @param messageId - ID of the message
 * @returns True if successful, false otherwise
 */
export const markMessageAsRead = async (messageId: string): Promise<boolean> => {
  try {
    // Get the message first to know which caches to invalidate
    const { data: msgData, error: getError } = await supabaseService.getById<any>(
      'messages',
      messageId
    );

    if (getError || !msgData) {
      return false;
    }

    // Update the message as read
    const { error, status } = await supabaseService.update('messages', messageId, {
      is_read: true,
    });

    if (error || status === 'error') {
      return false;
    }

    // Invalidate relevant caches
    const conversationId = msgData.conversation_id;
    cache.invalidate(`conversation:${conversationId}:messages`);
    cache.invalidate(`message:${messageId}`);

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Mark all messages in a conversation as read for a specific user
 * @param conversationId - ID of the conversation
 * @param userId - ID of the user marking messages as read
 * @returns True if successful, false otherwise
 */
export const markAllMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<boolean> => {
  try {
    // Update all unread messages not sent by this user
    const { error, status } = await supabaseService.executeRawQuery(async () => {
      const response = await supabaseService
        .getRawClient()
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('is_read', false)
        .neq('sender_id', userId);
      return response;
    });

    if (error || status === 'error') {
      return false;
    }

    // Invalidate relevant caches
    cache.invalidate(`conversation:${conversationId}:messages`);
    cache.invalidateByPrefix(`user:${userId}:`);

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Delete a message
 * @param messageId - ID of the message to delete
 * @returns True if successful, false otherwise
 */
export const deleteMessage = async (messageId: string): Promise<boolean> => {
  try {
    // Get the message first to know which caches to invalidate
    const { data: msgData, error: getError } = await supabaseService.getById<any>(
      'messages',
      messageId
    );

    if (getError || !msgData) {
      return false;
    }

    // Delete the message
    const { error, status } = await supabaseService.delete('messages', messageId);

    if (error || status === 'error') {
      toast.error('Failed to delete message');
      return false;
    }

    // Invalidate relevant caches
    const conversationId = msgData.conversation_id;
    cache.invalidate(`conversation:${conversationId}:messages`);

    // Update the conversation's lastMessage if needed
    await supabaseService.executeRawQuery<any>(async () => {
      // Get latest message in the conversation
      const { data: latestMsg } = await supabaseService.getMany<any>('messages', {
        filters: [{ field: 'conversation_id', operator: 'eq', value: conversationId }],
        orderBy: { column: 'timestamp', ascending: false },
        limit: 1,
      });

      // Update conversation with latest message time if available
      if (latestMsg && latestMsg.length > 0) {
        await supabaseService.update('conversations', conversationId, {
          updated_at: latestMsg[0].timestamp,
        });
      }

      return { data: null, error: null };
    });

    return true;
  } catch (error) {
    toast.error('Failed to delete message');
    return false;
  }
};

/**
 * Subscribe to real-time message updates for a conversation
 * @param conversationId - ID of the conversation to subscribe to
 * @param callback - Function to call when new messages are received
 * @returns Unsubscribe function
 */
export const subscribeToConversation = (
  conversationId: string,
  callback: (message: Message) => void
) => {
  // Get the raw client to access the real-time functionality
  const client = supabaseService.getRawClient();

  // Create the subscription
  const subscription = client
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      payload => {
        // Format the message to match our interface
        if (payload.new) {
          const newMessage: Message = {
            id: payload.new.id,
            conversationId: payload.new.conversation_id,
            senderId: payload.new.sender_id,
            content: payload.new.content,
            timestamp: new Date(payload.new.timestamp),
            read: payload.new.is_read,
          };

          // Invalidate the message cache
          cache.invalidate(`conversation:${conversationId}:messages`);

          // Call the callback with the new message
          callback(newMessage);
        }
      }
    )
    .subscribe();

  // Return a function to unsubscribe
  return () => {
    subscription.unsubscribe();
  };
};

/**
 * Subscribe to all conversations for a user
 * @param userId - ID of the user to subscribe for
 * @param callback - Function to call when conversations are updated
 * @returns Unsubscribe function
 */
export const subscribeToUserConversations = (
  userId: string,
  callback: (conversation: Conversation) => void
) => {
  const client = supabaseService.getRawClient();

  // Subscribe to conversation updates
  const subscription = client
    .channel(`user:${userId}:conversations`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen for all changes (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'conversations',
        filter: `participants=cs.{${userId}}`, // cs operator for contains
      },
      async payload => {
        // Invalidate the cache
        cache.invalidateByPrefix(`user:${userId}:`);

        // For inserts and updates, format and return the conversation
        if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
          const conversation: Conversation = {
            id: payload.new.id,
            participants: payload.new.participants,
            updatedAt: new Date(payload.new.updated_at),
            createdAt: new Date(payload.new.created_at),
          };

          // Get the last message if there is one
          const { data } = await supabaseService.getMany<any>('messages', {
            filters: [{ field: 'conversation_id', operator: 'eq', value: payload.new.id }],
            orderBy: { column: 'timestamp', ascending: false },
            limit: 1,
          });

          if (data && data.length > 0) {
            conversation.lastMessage = {
              id: data[0].id,
              conversationId: data[0].conversation_id,
              senderId: data[0].sender_id,
              content: data[0].content,
              timestamp: new Date(data[0].timestamp),
              read: data[0].is_read,
            };
          }

          callback(conversation);
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

/**
 * Subscribe to read status changes for messages in a conversation
 * @param conversationId - ID of the conversation to monitor
 * @param callback - Function to call when messages are read
 * @returns Unsubscribe function
 */
export const subscribeToReadStatus = (
  conversationId: string,
  callback: (messageId: string) => void
) => {
  const client = supabaseService.getRawClient();

  const subscription = client
    .channel(`conversation:${conversationId}:read`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId} AND is_read=eq.true`,
      },
      payload => {
        if (payload.new && payload.new.is_read && !payload.old.is_read) {
          // Invalidate the cache
          cache.invalidate(`conversation:${conversationId}:messages`);
          callback(payload.new.id);
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

// Re-export everything from conversation module and types
export * from './types';
export * from './conversation';

// Create a backward compatibility layer
// Import conversation functions directly to avoid name conflicts
import {
  getConversations as getConvs,
  createConversation as createConv,
  getConversationById as getConvById,
  deleteConversation as deleteConv,
} from './conversation';

export const messageService = {
  getMessages,
  sendMessage,
  markMessageAsRead,
  markAllMessagesAsRead,
  deleteMessage,
  getConversations: (userId: string) => getConvs(userId),
  createConversation: (participants: string[]) => createConv(participants),
  getConversationById: (id: string) => getConvById(id),
  deleteConversation: (id: string) => deleteConv(id),
  subscribeToConversation,
  subscribeToUserConversations,
  subscribeToReadStatus,
};
