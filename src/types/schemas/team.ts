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

export const MilestoneStatus = {
  IN_PROGRESS: 'in_progress',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  NEEDS_REVISION: 'needs_revision',
} as const;
export type MilestoneStatus = (typeof MilestoneStatus)[keyof typeof MilestoneStatus];

export const TeamMilestoneSchema = z.object({
  id: z.string(),
  phase: z.number().default(1),
  title: z.string(),
  dueDate: z.string().optional(),
  status: z.enum(['in_progress', 'pending_review', 'approved', 'needs_revision']).default('in_progress'),
  submissionUrl: z.string().optional(),
  submissionNotes: z.string().optional(),
  submittedAt: z.string().optional(),
  reviewedAt: z.string().optional(),
  reviewedBy: z.string().optional(),
  facultyRemarks: z.string().optional(),
  score: z.number().optional(),
});
export type TeamMilestone = z.infer<typeof TeamMilestoneSchema>;

export const FacultyReviewSchema = z.object({
  id: z.string(),
  facultyId: z.string(),
  facultyName: z.string(),
  milestoneTitle: z.string(),
  status: z.enum(['in_progress', 'pending_review', 'approved', 'needs_revision']),
  remarks: z.string(),
  score: z.number().optional(),
  createdAt: z.string(),
});
export type FacultyReview = z.infer<typeof FacultyReviewSchema>;

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
  assignedFaculty: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      department: z.string().optional(),
    })
    .nullable()
    .optional(),
  milestones: z.array(TeamMilestoneSchema).optional().default([]),
  facultyReviews: z.array(FacultyReviewSchema).optional().default([]),
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
