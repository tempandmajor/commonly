import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  getConversations,
  sendMessage as sendMessageService,
  subscribeToMessages,
  markMessagesAsRead,
  retryFailedMessages,
} from '../services/messageService';
import { Message, Conversation } from '@/types/message';
import { toast } from 'sonner';

const useMessages = (retryAttempt: number = 0) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineMessages, setOfflineMessages] = useState<
    {
      conversationId: string;
      content: string;
    }[]
  >([]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process offline messages when back online
  useEffect(() => {
    const processPendingMessages = async () => {
      if (isOnline && offlineMessages.length > 0 && user?.id) {
        const messages = [...offlineMessages];
        setOfflineMessages([]);

        for (const msg of messages) {
          try {
            await sendMessageService(msg.conversationId, user.id, msg.content);
          } catch (err) {
            // Add back to queue if failed
            setOfflineMessages(prev => [...prev, msg]);
          }
        }

        // Try to retry any other failed messages
        await retryFailedMessages(user.id);
      }
    };

    processPendingMessages();
  }, [isOnline, offlineMessages, user?.id]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const fetchConversations = async () => {
      if (!user?.id) return;

      setLoading(true);
      setError(null);

      try {
        const fetchedConversations = await getConversations(user.id);
        setConversations(fetchedConversations);

        // If there are conversations, subscribe to messages for the active one
        if (fetchedConversations.length > 0) {
          unsubscribe = subscribeToMessages(
            fetchedConversations[activeConversation].id,
            messages => {
              setConversations(prev => {
                const updated = [...prev];
                updated[activeConversation] = {
          ...updated[activeConversation],
                  messages,
                };
                return updated;
              });

              // Mark messages as read when they come in
              if (user?.id && fetchedConversations[activeConversation].id) {
                markMessagesAsRead(fetchedConversations[activeConversation].id, user.id).catch(
                  err => {}
                );
              }
            }
          );
        }
      } catch (err) {
        setError('Failed to load conversations. Please try again.');
        toast.error('Error loading messages');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.id, activeConversation, retryAttempt]);

  // Handle active conversation change
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    if (conversations.length > 0 && user?.id) {
      // Mark all messages in this conversation as read when it becomes active
      markMessagesAsRead(conversations[activeConversation].id, user.id).catch(err => {});

      unsubscribe = subscribeToMessages(conversations[activeConversation].id, messages => {
        setConversations(prev => {
          const updated = [...prev];
          updated[activeConversation] = {
          ...updated[activeConversation],
            messages,
            unreadCount: 0, // This is the line causing the error, but now it's fixed
          };
          return updated;
        });
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [activeConversation, conversations.length, user?.id]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user?.id || conversations.length === 0) return false;

      try {
        const conversationId = conversations[activeConversation].id;

        // If offline, queue the message for later
        if (!isOnline) {
          setOfflineMessages(prev => [...prev, { conversationId, content }]);
          toast.info("You're offline. Message will be sent when you reconnect.");
          return true;
        }

        const success = await sendMessageService(conversationId, user.id, content);

        if (!success) {
          throw new Error('Failed to send message');
        }

        return true;
      } catch (err) {
        toast.error('Failed to send message');
        return false;
      }
    },
    [user?.id, conversations, activeConversation, isOnline]
  );

  const refreshConversations = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const fetchedConversations = await getConversations(user.id);
      setConversations(fetchedConversations);
    } catch (err) {
      setError('Failed to refresh conversations');
    } finally {
      setLoading(false);
    }
  };

  // Add retry function
  const retry = useCallback(() => {
    toast.info('Retrying to load conversations...');
    refreshConversations();
  }, []);

  return {
    conversations,
    activeConversation,
    setActiveConversation,
    loading,
    error,
    sendMessage,
    refreshConversations,
    isOnline,
    retry,
  };
};

export default useMessages;
