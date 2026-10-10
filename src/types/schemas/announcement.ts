import { z } from 'zod';
import { NotificationType, UserRole } from '../enums';
import type { AnnouncementId, NotificationId, HackathonId, UserId } from '../ids';

export const AnnouncementSchema = z.object({
  id: z.string().transform((val) => val as AnnouncementId),
  hackathonId: z.string().transform((val) => val as HackathonId),
  authorId: z.string().transform((val) => val as UserId),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  isUrgent: z.boolean().default(false),
  author: z
    .object({
      id: z.string().transform((val) => val as UserId),
      fullName: z.string(),
      role: z.nativeEnum(UserRole),
    })
    .optional(),
  createdAt: z.string(),
});

export type Announcement = z.infer<typeof AnnouncementSchema>;

export const NotificationSchema = z.object({
  id: z.string().transform((val) => val as NotificationId),
  userId: z.string().transform((val) => val as UserId),
  type: z.nativeEnum(NotificationType),
  title: z.string(),
  body: z.string(),
  linkUrl: z.string().nullable().optional(),
  isRead: z.boolean().default(false),
  createdAt: z.string(),
});

export type Notification = z.infer<typeof NotificationSchema>;
