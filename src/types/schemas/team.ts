import { z } from 'zod';
import { TeamMemberRole } from '../enums';
import type { TeamId, HackathonId, UserId } from '../ids';

export const TeamMemberSchema = z.object({
  id: z.string(),
  teamId: z.string().transform((val) => val as TeamId),
  userId: z.string().transform((val) => val as UserId),
  role: z.nativeEnum(TeamMemberRole),
  joinedAt: z.string(),
  user: z
    .object({
      id: z.string().transform((val) => val as UserId),
      fullName: z.string(),
      email: z.string(),
      avatarUrl: z.string().nullable().optional(),
    })
    .optional(),
});

export type TeamMember = z.infer<typeof TeamMemberSchema>;

export const TeamSchema = z.object({
  id: z.string().transform((val) => val as TeamId),
  hackathonId: z.string().transform((val) => val as HackathonId),
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  description: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  tableNumber: z.string().nullable().optional(),
  locationCoordinates: z.tuple([z.number(), z.number()]).nullable().optional(),
  createdBy: z.string().transform((val) => val as UserId),
  members: z.array(TeamMemberSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Team = z.infer<typeof TeamSchema>;

export const CreateTeamInputSchema = z.object({
  hackathonId: z.string(),
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  description: z.string().optional(),
  tableNumber: z.string().optional(),
});

export type CreateTeamInput = z.infer<typeof CreateTeamInputSchema>;
