import { z } from 'zod';
import type { ConversationId, MessageId, HackathonId, TeamId, UserId } from '../ids';

export const MessageSchema = z.object({
  id: z.string().transform((val) => val as MessageId),
  conversationId: z.string().transform((val) => val as ConversationId),
  senderId: z.string().transform((val) => val as UserId),
  content: z.string().min(1),
  attachments: z.array(z.any()).default([]),
  sender: z
    .object({
      id: z.string().transform((val) => val as UserId),
      fullName: z.string(),
      avatarUrl: z.string().nullable().optional(),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = z.object({
  id: z.string().transform((val) => val as ConversationId),
  hackathonId: z.string().transform((val) => val as HackathonId),
  teamId: z.string().transform((val) => val as TeamId).nullable().optional(),
  title: z.string().nullable().optional(),
  isDirect: z.boolean().default(false),
  lastMessage: MessageSchema.nullable().optional(),
  unreadCount: z.number().default(0),
  createdAt: z.string(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

export const SendMessageInputSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1, 'Message cannot be empty'),
  attachments: z.array(z.any()).optional(),
});

export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;
