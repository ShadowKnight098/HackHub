import { z } from 'zod';
import { Visibility } from '../enums';
import type { NoteId, HackathonId, TeamId, UserId } from '../ids';

export const NoteCommentSchema = z.object({
  id: z.string(),
  noteId: z.string().transform((val) => val as NoteId),
  authorId: z.string().transform((val) => val as UserId),
  content: z.string().min(1),
  author: z
    .object({
      id: z.string().transform((val) => val as UserId),
      fullName: z.string(),
      avatarUrl: z.string().nullable().optional(),
    })
    .optional(),
  createdAt: z.string(),
});

export type NoteComment = z.infer<typeof NoteCommentSchema>;

export const NoteSchema = z.object({
  id: z.string().transform((val) => val as NoteId),
  hackathonId: z.string().transform((val) => val as HackathonId),
  teamId: z.string().transform((val) => val as TeamId).nullable().optional(),
  authorId: z.string().transform((val) => val as UserId),
  title: z.string().min(1, 'Title is required'),
  content: z.string().default(''),
  visibility: z.nativeEnum(Visibility),
  isPinned: z.boolean().default(false),
  author: z
    .object({
      id: z.string().transform((val) => val as UserId),
      fullName: z.string(),
      avatarUrl: z.string().nullable().optional(),
    })
    .optional(),
  commentCount: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Note = z.infer<typeof NoteSchema>;

export const CreateNoteInputSchema = z.object({
  hackathonId: z.string(),
  teamId: z.string().optional(),
  title: z.string().min(1, 'Note title is required'),
  content: z.string().default(''),
  visibility: z.nativeEnum(Visibility).default(Visibility.TEAM),
  isPinned: z.boolean().default(false),
});

export type CreateNoteInput = z.infer<typeof CreateNoteInputSchema>;
