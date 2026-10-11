import { db } from '@/lib/db';
import type { Conversation, Message, SendMessageInput } from '@/types/schemas/chat';
import type { ConversationId, MessageId, UserId } from '@/types/ids';

export const chatService = {
  async listConversations(_hackathonId?: string): Promise<Conversation[]> {
    return db.chat.getConversations();
  },

  async listMessages(conversationId: ConversationId): Promise<Message[]> {
    return db.chat.getMessages(conversationId);
  },

  async sendMessage(input: SendMessageInput, senderId: UserId): Promise<Message> {
    const now = new Date().toISOString();
    const newMessage: Message = {
      id: ('msg-' + Math.random().toString(36).substring(2, 9)) as MessageId,
      conversationId: input.conversationId as ConversationId,
      senderId,
      content: input.content,
      attachments: [],
      createdAt: now,
      updatedAt: now,
    };
    return db.chat.sendMessage(input.conversationId, newMessage);
  },

  subscribeToMessages(
    _conversationId: ConversationId,
    _onMessage: (message: Message) => void,
    _onError?: (err: Error) => void
  ) {
    return () => {};
  },
};
