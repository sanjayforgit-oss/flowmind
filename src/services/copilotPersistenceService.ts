import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ChatMessage } from './aiService';

export interface CopilotConversationMeta {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const LOCAL_STORAGE_CONVOS = 'flowmind_copilot_conversations';
const LOCAL_STORAGE_MSGS = 'flowmind_copilot_messages';

/**
 * Fetch all conversations for the authenticated user
 */
export async function fetchUserConversations(userId: string): Promise<CopilotConversationMeta[]> {
  if (!isSupabaseConfigured()) {
    try {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_CONVOS}_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  try {
    const { data, error } = await supabase
      .from('copilot_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch conversations error, using local fallback:', error);
      const stored = localStorage.getItem(`${LOCAL_STORAGE_CONVOS}_${userId}`);
      return stored ? JSON.parse(stored) : [];
    }

    return (data as CopilotConversationMeta[]) || [];
  } catch (err) {
    console.error('Failed to fetch user conversations:', err);
    return [];
  }
}

/**
 * Create a new conversation record
 */
export async function createConversation(
  userId: string,
  title = 'New Automation Conversation'
): Promise<CopilotConversationMeta | null> {
  const newConvo: CopilotConversationMeta = {
    id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    try {
      const existing = await fetchUserConversations(userId);
      const updated = [newConvo, ...existing];
      localStorage.setItem(`${LOCAL_STORAGE_CONVOS}_${userId}`, JSON.stringify(updated));
      return newConvo;
    } catch {
      return newConvo;
    }
  }

  try {
    const { data, error } = await supabase
      .from('copilot_conversations')
      .insert({
        user_id: userId,
        title,
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase create conversation error, falling back locally:', error);
      const existing = await fetchUserConversations(userId);
      const updated = [newConvo, ...existing];
      localStorage.setItem(`${LOCAL_STORAGE_CONVOS}_${userId}`, JSON.stringify(updated));
      return newConvo;
    }

    return data as CopilotConversationMeta;
  } catch (err) {
    console.error('Failed to create conversation in Supabase:', err);
    return newConvo;
  }
}

/**
 * Fetch all messages for a specific conversation
 */
export async function fetchConversationMessages(
  conversationId: string,
  userId: string
): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured()) {
    try {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_MSGS}_${conversationId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  try {
    const { data, error } = await supabase
      .from('copilot_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase fetch messages error, using local fallback:', error);
      const stored = localStorage.getItem(`${LOCAL_STORAGE_MSGS}_${conversationId}`);
      return stored ? JSON.parse(stored) : [];
    }

    if (!data || data.length === 0) return [];

    return data.map((item: any) => ({
      id: item.id,
      role: item.role as 'user' | 'assistant',
      content: item.content,
      timestamp: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      proposal: item.metadata?.proposal,
      isWorkflowGenerated: item.metadata?.isWorkflowGenerated,
      generatedWorkflow: item.metadata?.generatedWorkflow,
      suggestedReplies: item.metadata?.suggestedReplies,
    }));
  } catch (err) {
    console.error('Failed to fetch conversation messages:', err);
    return [];
  }
}

/**
 * Save a message to Supabase
 */
export async function saveCopilotMessage(
  conversationId: string,
  userId: string,
  msg: ChatMessage
): Promise<void> {
  const metadata = {
    proposal: msg.proposal || null,
    isWorkflowGenerated: msg.isWorkflowGenerated || false,
    generatedWorkflow: msg.generatedWorkflow || null,
    suggestedReplies: msg.suggestedReplies || null,
  };

  // Always cache locally as resilience buffer
  try {
    const existingStr = localStorage.getItem(`${LOCAL_STORAGE_MSGS}_${conversationId}`);
    const existing: ChatMessage[] = existingStr ? JSON.parse(existingStr) : [];
    const updated = [...existing.filter((m) => m.id !== msg.id), msg];
    localStorage.setItem(`${LOCAL_STORAGE_MSGS}_${conversationId}`, JSON.stringify(updated));
  } catch {
    // ignore
  }

  if (!isSupabaseConfigured()) return;

  try {
    await supabase.from('copilot_messages').insert({
      conversation_id: conversationId,
      user_id: userId,
      role: msg.role,
      content: msg.content,
      metadata,
    });

    // Touch conversation updated_at
    await supabase
      .from('copilot_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .eq('user_id', userId);
  } catch (err) {
    console.warn('Could not persist message to Supabase in background:', err);
  }
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string,
  userId: string
): Promise<void> {
  try {
    const convos = await fetchUserConversations(userId);
    const updated = convos.map((c) => (c.id === conversationId ? { ...c, title } : c));
    localStorage.setItem(`${LOCAL_STORAGE_CONVOS}_${userId}`, JSON.stringify(updated));
  } catch {
    // ignore
  }

  if (!isSupabaseConfigured()) return;

  try {
    await supabase
      .from('copilot_conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .eq('user_id', userId);
  } catch (err) {
    console.warn('Failed to update conversation title in Supabase:', err);
  }
}

/**
 * Delete a conversation and its messages
 */
export async function deleteConversation(conversationId: string, userId: string): Promise<void> {
  try {
    const convos = await fetchUserConversations(userId);
    const updated = convos.filter((c) => c.id !== conversationId);
    localStorage.setItem(`${LOCAL_STORAGE_CONVOS}_${userId}`, JSON.stringify(updated));
    localStorage.removeItem(`${LOCAL_STORAGE_MSGS}_${conversationId}`);
  } catch {
    // ignore
  }

  if (!isSupabaseConfigured()) return;

  try {
    await supabase
      .from('copilot_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);
  } catch (err) {
    console.warn('Failed to delete conversation from Supabase:', err);
  }
}
