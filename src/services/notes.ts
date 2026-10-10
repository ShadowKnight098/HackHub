import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import { db } from '@/lib/db';
import { toAppError } from '@/types/errors';
import type { Note, CreateNoteInput, NoteComment } from '@/types/schemas/note';
import type { NoteId, HackathonId, TeamId, UserId } from '@/types/ids';
import { Visibility } from '@/types/enums';

const ACTIVE_HACKATHON_ID = '466eebd5-875f-423b-b1f1-10b93bebccf6';
const DEFAULT_USER_ID = '80bb5377-7cf9-49e2-b8d7-254193c7a16c';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toValidUuid(val: string | undefined | null, fallback: string): string {
  if (val && UUID_REGEX.test(val)) return val;
  return fallback;
}

export const notesService = {
  async listNotes(filters?: { hackathonId?: string; teamId?: string }): Promise<Note[]> {
    if (!env.isConfigured) {
      return db.notes.getAll();
    }

    try {
      let query = supabase
        .from('notes')
        .select(`
          id,
          hackathon_id,
          team_id,
          author_id,
          title,
          content,
          visibility,
          is_pinned,
          created_at,
          updated_at,
          profiles (
            id,
            full_name,
            avatar_url
          ),
          note_comments (count)
        `)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.hackathonId && UUID_REGEX.test(filters.hackathonId)) {
        query = query.eq('hackathon_id', filters.hackathonId);
      }
      if (filters?.teamId && UUID_REGEX.test(filters.teamId)) {
        query = query.eq('team_id', filters.teamId);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Supabase notes fetch warning, using local db:', error.message);
        return db.notes.getAll();
      }

      if (data && data.length > 0) {
        const notes = data.map((row: any): Note => ({
          id: row.id as NoteId,
          hackathonId: row.hackathon_id as HackathonId,
          teamId: row.team_id ? (row.team_id as TeamId) : null,
          authorId: row.author_id as UserId,
          title: row.title,
          content: row.content,
          visibility: row.visibility as Visibility,
          isPinned: row.is_pinned,
          author: row.profiles ? {
            id: row.profiles.id as UserId,
            fullName: row.profiles.full_name,
            avatarUrl: row.profiles.avatar_url,
          } : undefined,
          commentCount: row.note_comments?.[0]?.count || 0,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        notes.forEach((n) => {
          if (!db.notes.getById(n.id)) db.notes.insert(n);
        });
        return notes;
      }

      return db.notes.getAll();
    } catch (err) {
      console.warn('Supabase notes exception, using local db:', err);
      return db.notes.getAll();
    }
  },

  async createNote(input: CreateNoteInput, authorId: UserId): Promise<Note> {
    const validHackathonId = toValidUuid(input.hackathonId, ACTIVE_HACKATHON_ID);
    const validAuthorId = toValidUuid(authorId, DEFAULT_USER_ID);
    const validTeamId = input.teamId && UUID_REGEX.test(input.teamId) ? input.teamId : null;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          hackathon_id: validHackathonId,
          team_id: validTeamId,
          author_id: validAuthorId,
          title: input.title,
          content: input.content,
          visibility: input.visibility,
          is_pinned: input.isPinned,
        })
        .select(`
          id,
          hackathon_id,
          team_id,
          author_id,
          title,
          content,
          visibility,
          is_pinned,
          created_at,
          updated_at,
          profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (!error && data) {
        const createdNote: Note = {
          id: data.id as NoteId,
          hackathonId: data.hackathon_id as HackathonId,
          teamId: data.team_id ? (data.team_id as TeamId) : null,
          authorId: data.author_id as UserId,
          title: data.title,
          content: data.content,
          visibility: data.visibility as Visibility,
          isPinned: data.is_pinned,
          author: data.profiles ? {
            id: (data.profiles as any).id as UserId,
            fullName: (data.profiles as any).full_name,
            avatarUrl: (data.profiles as any).avatar_url,
          } : {
            id: validAuthorId as UserId,
            fullName: 'Participant',
            avatarUrl: null,
          },
          commentCount: 0,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        db.notes.insert(createdNote);
        return createdNote;
      }
    } catch (err) {
      console.warn('Supabase createNote error, synced to db:', err);
    }

    let activeAuthorName = 'Participant';
    try {
      const stored = localStorage.getItem('hackhub_current_profile');
      if (stored) activeAuthorName = JSON.parse(stored).fullName || 'Participant';
    } catch {}

    const fallbackNote: Note = {
      id: ('note-' + Math.random().toString(36).substring(2, 9)) as NoteId,
      hackathonId: validHackathonId as HackathonId,
      teamId: (input.teamId as TeamId) || null,
      authorId: validAuthorId as UserId,
      title: input.title,
      content: input.content,
      visibility: input.visibility,
      isPinned: input.isPinned,
      author: {
        id: validAuthorId as UserId,
        fullName: activeAuthorName,
        avatarUrl: null,
      },
      commentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return db.notes.insert(fallbackNote);
  },

  async listComments(noteId: NoteId): Promise<NoteComment[]> {
    if (!env.isConfigured) {
      return db.notes.getComments(noteId);
    }

    try {
      const { data, error } = await supabase
        .from('note_comments')
        .select(`
          id,
          note_id,
          author_id,
          content,
          created_at,
          profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('note_id', noteId)
        .order('created_at', { ascending: true });

      if (error) throw toAppError(error);

      return (data || []).map((row: any): NoteComment => ({
        id: row.id,
        noteId: row.note_id as NoteId,
        authorId: row.author_id as UserId,
        content: row.content,
        author: row.profiles ? {
          id: row.profiles.id as UserId,
          fullName: row.profiles.full_name,
          avatarUrl: row.profiles.avatar_url,
        } : undefined,
        createdAt: row.created_at,
      }));
    } catch (err) {
      throw toAppError(err);
    }
  },

  async addComment(noteId: NoteId, authorId: UserId, content: string): Promise<NoteComment> {
    if (!env.isConfigured) {
      const newComment: NoteComment = {
        id: 'comm-' + Math.random().toString(36).substring(2, 7),
        noteId,
        authorId,
        content,
        author: {
          id: authorId,
          fullName: 'You',
          avatarUrl: null,
        },
        createdAt: new Date().toISOString(),
      };
      return db.notes.addComment(noteId, newComment);
    }

    try {
      const { data, error } = await supabase
        .from('note_comments')
        .insert({
          note_id: noteId,
          author_id: authorId,
          content,
        })
        .select()
        .single();

      if (error) throw toAppError(error);

      return {
        id: data.id,
        noteId: data.note_id as NoteId,
        authorId: data.author_id as UserId,
        content: data.content,
        createdAt: data.created_at,
      };
    } catch (err) {
      throw toAppError(err);
    }
  },
};
