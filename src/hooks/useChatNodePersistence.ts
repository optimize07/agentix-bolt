import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sections?: ParsedSection[];
}

interface ParsedSection {
  id: string;
  type: 'headline' | 'copy' | 'cta' | 'text';
  label: string;
  content: string;
}

interface UseChatNodePersistenceOptions {
  blockId: string;
  boardId: string;
}

export function useChatNodePersistence({ blockId, boardId }: UseChatNodePersistenceOptions) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Load or create chat session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoadingHistory(false);
          return;
        }

        // Try to find existing session for this block
        const { data: existingSession, error: findError } = await supabase
          .from('agent_chat_sessions')
          .select('id')
          .eq('canvas_block_id', blockId)
          .maybeSingle();

        if (findError) {
          console.error('Error finding chat session:', findError);
          setIsLoadingHistory(false);
          return;
        }

        let currentSessionId: string;

        if (existingSession) {
          currentSessionId = existingSession.id;
        } else {
          // Create new session
          const { data: newSession, error: createError } = await supabase
            .from('agent_chat_sessions')
            .insert({
              user_id: user.id,
              agent_board_id: boardId,
              canvas_block_id: blockId,
              title: 'Chat Session',
            })
            .select('id')
            .single();

          if (createError) {
            console.error('Error creating chat session:', createError);
            setIsLoadingHistory(false);
            return;
          }
          currentSessionId = newSession.id;
        }

        setSessionId(currentSessionId);

        // Load existing messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('agent_chat_messages')
          .select('*')
          .eq('session_id', currentSessionId)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Error loading messages:', messagesError);
        } else if (messagesData) {
          const loadedMessages: ChatMessage[] = messagesData.map((msg: any) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            sections: msg.metadata?.sections,
          }));
          setMessages(loadedMessages);
        }
      } catch (err) {
        console.error('Error initializing chat session:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (blockId && boardId) {
      initSession();
    } else {
      setIsLoadingHistory(false);
    }
  }, [blockId, boardId]);

  // Add a message to the database
  const addMessage = useCallback(async (message: ChatMessage) => {
    if (!sessionId) {
      // Just update local state if no session
      setMessages(prev => [...prev, message]);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessages(prev => [...prev, message]);
        return;
      }

      const { error } = await supabase
        .from('agent_chat_messages')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          role: message.role,
          content: message.content,
          metadata: message.sections ? { sections: message.sections } : {},
        } as any);
      if (error) {
        console.error('Error saving message:', error);
      }
    } catch (err) {
      console.error('Error saving message:', err);
    }

    setMessages(prev => [...prev, message]);
  }, [sessionId]);

  // Clear all messages
  const clearMessages = useCallback(async () => {
    if (sessionId) {
      try {
        const { error } = await supabase
          .from('agent_chat_messages')
          .delete()
          .eq('session_id', sessionId);

        if (error) {
          console.error('Error clearing messages:', error);
          toast.error('Failed to clear chat history');
          return;
        }
      } catch (err) {
        console.error('Error clearing messages:', err);
      }
    }

    setMessages([]);
    toast.success('Chat cleared');
  }, [sessionId]);

  // Update messages (for regeneration scenarios)
  const updateMessages = useCallback((
    updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])
  ) => {
    if (typeof updater === 'function') {
      setMessages(updater);
    } else {
      setMessages(updater);
    }
  }, []);

  return {
    messages,
    sessionId,
    isLoadingHistory,
    addMessage,
    clearMessages,
    setMessages: updateMessages,
  };
}
