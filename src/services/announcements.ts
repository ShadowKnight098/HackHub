import { db } from '@/lib/db';
import type { Announcement } from '@/types/schemas/announcement';

export const announcementsService = {
  async listAnnouncements(_hackathonId?: string): Promise<Announcement[]> {
    return db.announcements.getAll();
  },
};
