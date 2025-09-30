/**
 * Message service conversation management
 * Provides functions for managing conversations between users
 */

import { supabaseService } from '../supabase';
import { toast } from 'sonner';
import type { Conversation, Message } from './types';
import { cache } from './cache';

/**
 * Get all conversations for a user
 * @param userId - ID of the user
 * @returns Array of conversations
 */
export const getConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    // Check cache first
    const cacheKey = `user:${userId}:conversations`;
    const cachedConversations = cache.get<Conversation[]>(cacheKey);
    if (cachedConversations) {
      return cachedConversations;
    }

    // Use the supabase service to query conversations
    const { data, error, status } = await supabaseService.executeRawQuery<any[]>(async () => {
      // Find all conversations where the user is a participant
      const response = await supabaseService
        .getRawClient()
        .from('conversations')
        .select('*, messages(*)') // Join with messages to get the last message
        .contains('participants', [userId])
        .order('updated_at', { ascending: false });
      return response;
    });

    if (error || status === 'error' || !data) {
      return [];
    }

    // Format the response to match our interface
    const conversations: Conversation[] = data.map((conv: unknown) => {
      // Get the last message if available
      const lastMessage =
        conv.messages && conv.messages.length > 0
          ? {
              id: conv.messages[0].id,
              conversationId: conv.messages[0].conversation_id,
              senderId: conv.messages[0].sender_id,
              content: conv.messages[0].content,
              timestamp: new Date(conv.messages[0].timestamp),
              read: conv.messages[0].read,
            }
          : undefined;

      return {
        id: conv.id,
        participants: conv.participants,
        lastMessage,
        updatedAt: new Date(conv.updated_at),
        createdAt: new Date(conv.created_at),
      };
    });

    // Store in cache
    cache.set(cacheKey, conversations);

    return conversations;
  } catch (error) {
    return [];
  }
};

/**
 * Create a new conversation between users
 * @param participants - Array of user IDs participating in the conversation
 * @returns The created conversation
 */
export const createConversation = async (participants: string[]): Promise<Conversation> => {
  try {
    // Check for existing conversation with these participants
    const { data: existingConv, error: searchError } = await supabaseService.executeRawQuery<any>(
      async () => {
        const response = await supabaseService
          .getRawClient()
          .from('conversations')
          .select('*')
          .contains('participants', participants)
          .single();
        return response;
      }
    );

    // If conversation exists, return it
    if (existingConv && !searchError) {
      return {
        id: existingConv.id,
        participants: existingConv.participants,
        updatedAt: new Date(existingConv.updated_at),
        createdAt: new Date(existingConv.created_at),
      };
    }

    // Create new conversation with proper typing
    const { data, error, status } = await supabaseService.insert<any>('conversations', {
      participants,
      created_at: new Date(),
      updated_at: new Date(),
    });

    if (error || status === 'error' || !data) {
      toast.error('Failed to create conversation');
      // Return a fallback for compatibility, though this should be handled better in production
      return {

        id: Math.random().toString(36).substring(2, 9),
        participants,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
    }

    // Format the response
    const conversation: Conversation = {
      id: data.id,
      participants: data.participants,
      updatedAt: new Date(data.updated_at),
      createdAt: new Date(data.created_at),
    };

    // Clear user conversation caches
    participants.forEach(userId => {
      cache.invalidateByPrefix(`user:${userId}:`);
    });

    return conversation;

  } catch (error) {
    toast.error('Failed to create conversation');

    // Return a fallback for compatibility
    return {

      id: Math.random().toString(36).substring(2, 9),
      participants,
      updatedAt: new Date(),
      createdAt: new Date(),
    };
  }
};

/**
 * Get a conversation by ID
 * @param conversationId - The ID of the conversation to retrieve
 * @returns The conversation or null if not found
 */
export const getConversationById = async (conversationId: string): Promise<Conversation | null> => {
  try {
    // Check cache
    const cacheKey = `conversation:${conversationId}`;
    const cachedConversation = cache.get<Conversation>(cacheKey);
    if (cachedConversation) {
      return cachedConversation;
    }

    const { data, error, status } = await supabaseService.getById<any>(
      'conversations',
      conversationId
    );

    if (error || status === 'error' || !data) {
      return null;
    }

    // Format the response
    const conversation: Conversation = {
      id: data.id,
      participants: data.participants,
      updatedAt: new Date(data.updated_at),
      createdAt: new Date(data.created_at),
    };

    // Store in cache
    cache.set(cacheKey, conversation);

    return conversation;
  } catch (error) {
    return null;
  }
};

/**
 * Delete a conversation
 * @param conversationId - The ID of the conversation to delete
 * @returns True if successful, false otherwise
 */
export const deleteConversation = async (conversationId: string): Promise<boolean> => {
  try {
    // Get conversation first to clear participant caches later
    const conversation = await getConversationById(conversationId);

    // Delete the conversation
    const { error, status } = await supabaseService.delete<any>('conversations', conversationId);

    if (error || status === 'error') {
      toast.error('Failed to delete conversation');
      return false;
    }

    // Clear caches
    cache.invalidate(`conversation:${conversationId}`);
    if (conversation?.participants) {
      conversation.participants.forEach(userId => {
        cache.invalidateByPrefix(`user:${userId}:`);
      });
    }

    return true;
  } catch (error) {
    toast.error('Failed to delete conversation');
    return false;
  }
};
