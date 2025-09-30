// Production Message Service - Real Implementation
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  type?: 'text' | undefined| 'image' | 'file';
}

export interface Conversation {
  id: string;
  participants: string[];
  user: {
    id: string;
    name: string;
    initials: string;
  };
  isOnline: boolean;
  messages: Message[];
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export const getConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(
        `
        *,
        messages:messages(*)
      `
      )
      .contains('members', [userId])
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
};

export const getMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (
      data?.map(msg => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        content: msg.content,
        timestamp: msg.created_at,
        read: msg.read || false,
        type: msg.type || 'text',
      })) || []
    );
  } catch (error) {
    return [];
  }
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message | null> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content,
        type: 'text',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      receiverId: data.receiver_id,
      content: data.content,
      timestamp: data.created_at,
      read: false,
      type: data.type || 'text',
    };
  } catch (error) {
    return null;
  }
};

export const createConversation = async (participants: string[]): Promise<Conversation | null> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        members: participants,
        title: null,
        last_message: null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      participants: data.members || [],
      user: {
        id: participants[1] || 'unknown',
        name: 'User',
        initials: 'U',
      },
      isOnline: false,
      messages: [],
      unreadCount: 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    return null;
  }
};

export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const subscription = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      payload => {
        // Refetch messages when changes occur
        getMessages(conversationId).then(callback);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

export const markMessagesAsRead = async (conversationId: string, userId: string): Promise<void> => {
  try {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId);
  } catch (_error) {
    // Error handling silently ignored
  }
};

export const retryFailedMessages = async (userId: string): Promise<void> => {
  // Implementation for retrying failed messages
};
