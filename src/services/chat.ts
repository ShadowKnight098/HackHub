import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import { db } from '@/lib/db';
import { toAppError } from '@/types/errors';
import type { Conversation, Message, SendMessageInput } from '@/types/schemas/chat';
import type { ConversationId, MessageId, HackathonId, TeamId, UserId } from '@/types/ids';

export const chatService = {
  async listConversations(hackathonId?: string): Promise<Conversation[]> {
    if (!env.isConfigured) {
      return db.chat.getConversations();
    }

    try {
      let query = supabase
        .from('conversations')
        .select(`
          id,
          hackathon_id,
          team_id,
          title,
          is_direct,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (hackathonId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hackathonId)) {
        query = query.eq('hackathon_id', hackathonId);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Supabase chat fetch warning, using local db:', error.message);
        return db.chat.getConversations();
      }

      if (!data || data.length === 0) {
        return db.chat.getConversations();
      }

      return (data || []).map((row: any): Conversation => ({
        id: row.id as ConversationId,
        hackathonId: row.hackathon_id as HackathonId,
        teamId: row.team_id ? (row.team_id as TeamId) : null,
        title: row.title,
        isDirect: row.is_direct,
        lastMessage: null,
        unreadCount: 0,
        createdAt: row.created_at,
      }));
    } catch (err) {
      console.warn('Supabase chat exception, using local db:', err);
      return db.chat.getConversations();
    }
  },

  async listMessages(conversationId: ConversationId): Promise<Message[]> {
    if (!env.isConfigured) {
      return db.chat.getMessages(conversationId);
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          attachments,
          created_at,
          updated_at,
          profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw toAppError(error);

      return (data || []).map((row: any): Message => ({
        id: row.id as MessageId,
        conversationId: row.conversation_id as ConversationId,
        senderId: row.sender_id as UserId,
        content: row.content,
        attachments: row.attachments || [],
        sender: row.profiles ? {
          id: row.profiles.id as UserId,
          fullName: row.profiles.full_name,
          avatarUrl: row.profiles.avatar_url,
        } : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (err) {
      throw toAppError(err);
    }
  },

  async sendMessage(input: SendMessageInput, senderId: UserId): Promise<Message> {
    if (!env.isConfigured) {
      const newMsg: Message = {
        id: ('msg-' + Math.random().toString(36).substring(2, 9)) as MessageId,
        conversationId: input.conversationId as ConversationId,
        senderId,
        content: input.content,
        attachments: input.attachments || [],
        sender: {
          id: senderId,
          fullName: 'You',
          avatarUrl: null,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return db.chat.sendMessage(input.conversationId, newMsg);
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: input.conversationId,
          sender_id: senderId,
          content: input.content,
          attachments: input.attachments || [],
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          attachments,
          created_at,
          updated_at,
          profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw toAppError(error);

      return {
        id: data.id as MessageId,
        conversationId: data.conversation_id as ConversationId,
        senderId: data.sender_id as UserId,
        content: data.content,
        attachments: data.attachments || [],
        sender: (data as any).profiles ? {
          id: (data as any).profiles.id as UserId,
          fullName: (data as any).profiles.full_name,
          avatarUrl: (data as any).profiles.avatar_url,
        } : undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (err) {
      throw toAppError(err);
    }
  },

  subscribeToMessages(conversationId: ConversationId, onNewMessage: (msg: Message) => void) {
    if (!env.isConfigured) {
      return () => {};
    }

    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch sender profile for complete message display
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', payload.new.sender_id)
            .maybeSingle();

          const profileData = profile as { id: string; full_name: string; avatar_url: string | null } | null;

          const message: Message = {
            id: payload.new.id as MessageId,
            conversationId: payload.new.conversation_id as ConversationId,
            senderId: payload.new.sender_id as UserId,
            content: payload.new.content,
            attachments: payload.new.attachments || [],
            sender: profileData ? {
              id: profileData.id as UserId,
              fullName: profileData.full_name,
              avatarUrl: profileData.avatar_url,
            } : undefined,
            createdAt: payload.new.created_at,
            updatedAt: payload.new.updated_at,
          };
          onNewMessage(message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
