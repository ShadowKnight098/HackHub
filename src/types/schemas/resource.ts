import { z } from 'zod';
import { ResourceType, Visibility } from '../enums';
import type { ResourceId, HackathonId, TeamId, UserId } from '../ids';

export const ResourceSchema = z.object({
  id: z.string().transform((val) => val as ResourceId),
  hackathonId: z.string().transform((val) => val as HackathonId),
  teamId: z.string().transform((val) => val as TeamId).nullable().optional(),
  uploaderId: z.string().transform((val) => val as UserId),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  type: z.nativeEnum(ResourceType),
  storagePath: z.string().nullable().optional(),
  externalUrl: z.string().nullable().optional(),
  fileSizeBytes: z.number().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  visibility: z.nativeEnum(Visibility),
  tags: z.array(z.string()).default([]),
  uploader: z
    .object({
      id: z.string().transform((val) => val as UserId),
      fullName: z.string(),
      avatarUrl: z.string().nullable().optional(),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Resource = z.infer<typeof ResourceSchema>;

export const CreateResourceInputSchema = z.object({
  hackathonId: z.string(),
  teamId: z.string().optional(),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  type: z.nativeEnum(ResourceType),
  visibility: z.nativeEnum(Visibility),
  externalUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
});

export type CreateResourceInput = z.infer<typeof CreateResourceInputSchema>;
