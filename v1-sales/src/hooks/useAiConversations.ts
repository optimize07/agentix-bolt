import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  tool_calls: any;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  organization_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  metadata: any;
  message_count?: number;
  last_message_preview?: string;
}

export const useAiConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, organization } = useOrganization();

  const fetchConversations = async () => {
    if (!user?.id || !organization?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ai_conversations")
        .select(`
          *,
          ai_conversation_messages(count)
        `)
        .eq("user_id", user.id)
        .eq("organization_id", organization.id)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get last message preview for each conversation
      const conversationsWithPreviews = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: lastMessage } = await supabase
            .from("ai_conversation_messages")
            .select("content")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            message_count: conv.ai_conversation_messages?.[0]?.count || 0,
            last_message_preview: lastMessage?.content?.substring(0, 60) || "",
          };
        })
      );

      setConversations(conversationsWithPreviews);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversation history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user?.id, organization?.id]);

  return { conversations, loading, refetch: fetchConversations };
};

export const useConversation = (conversationId: string | null) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

      const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("ai_conversation_messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        
        // Cast the data to ensure proper typing
        const typedMessages: ConversationMessage[] = (data || []).map(msg => ({
          id: msg.id,
          conversation_id: msg.conversation_id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          tool_calls: msg.tool_calls,
          created_at: msg.created_at,
        }));
        
        setMessages(typedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load conversation");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId]);

  return { messages, loading };
};

export const createConversation = async (
  userId: string,
  organizationId: string,
  title: string,
  metadata?: any
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({
        user_id: userId,
        organization_id: organizationId,
        title,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error("Error creating conversation:", error);
    toast.error("Failed to create conversation");
    return null;
  }
};

export const addMessage = async (
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  toolCalls?: any
): Promise<boolean> => {
  try {
    const { error } = await supabase.from("ai_conversation_messages").insert({
      conversation_id: conversationId,
      role,
      content,
      tool_calls: toolCalls || null,
    });

    if (error) throw error;

    // Update conversation's updated_at timestamp
    await supabase
      .from("ai_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return true;
  } catch (error) {
    console.error("Error adding message:", error);
    return false;
  }
};

export const deleteConversation = async (conversationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("ai_conversations")
      .delete()
      .eq("id", conversationId);

    if (error) throw error;
    toast.success("Conversation deleted");
    return true;
  } catch (error) {
    console.error("Error deleting conversation:", error);
    toast.error("Failed to delete conversation");
    return false;
  }
};

export const updateConversationTitle = async (
  conversationId: string,
  title: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("ai_conversations")
      .update({ title })
      .eq("id", conversationId);

    if (error) throw error;
    toast.success("Title updated");
    return true;
  } catch (error) {
    console.error("Error updating title:", error);
    toast.error("Failed to update title");
    return false;
  }
};

export const getConversationData = async (conversationId: string) => {
  try {
    const { data, error } = await supabase
      .from("ai_conversations")
      .select("metadata")
      .eq("id", conversationId)
      .single();

    if (error) throw error;
    return data?.metadata;
  } catch (error) {
    console.error("Error fetching conversation data:", error);
    return null;
  }
};

export const updateConversationData = async (
  conversationId: string,
  sheetData: any[][],
  sheetName: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("ai_conversations")
      .update({
        metadata: { sheetName, sheetData, hasSheetData: true },
      })
      .eq("id", conversationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating conversation data:", error);
    return false;
  }
};
