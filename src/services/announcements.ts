import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import { db } from '@/lib/db';
import type { Announcement } from '@/types/schemas/announcement';
import type { AnnouncementId, HackathonId, UserId } from '@/types/ids';
import { UserRole } from '@/types/enums';

export const announcementsService = {
  async listAnnouncements(hackathonId?: string): Promise<Announcement[]> {
    if (!env.isConfigured) {
      return db.announcements.getAll();
    }

    try {
      let query = supabase
        .from('announcements')
        .select(`
          id,
          hackathon_id,
          author_id,
          title,
          content,
          is_urgent,
          created_at,
          profiles (
            id,
            full_name,
            role
          )
        `)
        .order('is_urgent', { ascending: false })
        .order('created_at', { ascending: false });

      if (hackathonId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hackathonId)) {
        query = query.eq('hackathon_id', hackathonId);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Supabase announcements fetch warning, using local db:', error.message);
        return db.announcements.getAll();
      }

      if (!data || data.length === 0) {
        return db.announcements.getAll();
      }

      return (data || []).map((row: any): Announcement => ({
        id: row.id as AnnouncementId,
        hackathonId: row.hackathon_id as HackathonId,
        authorId: row.author_id as UserId,
        title: row.title,
        content: row.content,
        isUrgent: row.is_urgent,
        author: row.profiles ? {
          id: row.profiles.id as UserId,
          fullName: row.profiles.full_name,
          role: row.profiles.role as UserRole,
        } : undefined,
        createdAt: row.created_at,
      }));
    } catch (err) {
      console.warn('Supabase announcements exception, using local db:', err);
      return db.announcements.getAll();
    }
  },
};
