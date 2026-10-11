import { sql, isNeonConfigured } from '@/lib/neon';
import { db } from '@/lib/db';
import type { Note, CreateNoteInput, NoteComment } from '@/types/schemas/note';
import type { NoteId, HackathonId, TeamId, UserId } from '@/types/ids';
import { Visibility } from '@/types/enums';

const ACTIVE_HACKATHON_ID = '466eebd5-875f-423b-b1f1-10b93bebccf6';
const DEFAULT_USER_ID = '80bb5377-7cf9-49e2-b8d7-254193c7a16c';

export const notesService = {
  async listNotes(_filters?: { hackathonId?: string; teamId?: string }): Promise<Note[]> {
    if (isNeonConfigured && sql) {
      try {
        const rows = await sql`
          SELECT id, team_id, author_id, title, content, color, created_at, updated_at
          FROM notes
          ORDER BY updated_at DESC
        `;
        if (rows && rows.length > 0) {
          return rows.map((r: any): Note => ({
            id: r.id as NoteId,
            hackathonId: ACTIVE_HACKATHON_ID as HackathonId,
            teamId: r.team_id as TeamId | null,
            authorId: r.author_id as UserId,
            title: r.title,
            content: r.content,
            visibility: Visibility.TEAM,
            isPinned: false,
            author: {
              id: r.author_id as UserId,
              fullName: 'Team Member',
              avatarUrl: null,
            },
            commentCount: 0,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Neon notes query notice:', err);
      }
    }
    return db.notes.getAll();
  },

  async createNote(input: CreateNoteInput, authorId: UserId): Promise<Note> {
    const validAuthor = authorId && /^[0-9a-f-]{36}$/i.test(authorId) ? authorId : DEFAULT_USER_ID;
    const validTeam = input.teamId && /^[0-9a-f-]{36}$/i.test(input.teamId) ? input.teamId : null;

    if (isNeonConfigured && sql && validTeam) {
      try {
        const rows = await sql`
          INSERT INTO notes (team_id, author_id, title, content)
          VALUES (${validTeam}::uuid, ${validAuthor}::uuid, ${input.title}, ${input.content})
          RETURNING id, team_id, author_id, title, content, created_at, updated_at
        `;
        if (rows && rows.length > 0 && rows[0]) {
          const r = rows[0] as any;
          const newNote: Note = {
            id: r.id as NoteId,
            hackathonId: ACTIVE_HACKATHON_ID as HackathonId,
            teamId: r.team_id as TeamId | null,
            authorId: r.author_id as UserId,
            title: r.title,
            content: r.content,
            visibility: input.visibility,
            isPinned: input.isPinned,
            author: {
              id: r.author_id as UserId,
              fullName: 'You',
              avatarUrl: null,
            },
            commentCount: 0,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          };
          db.notes.insert(newNote);
          return newNote;
        }
      } catch (err) {
        console.warn('Neon createNote notice:', err);
      }
    }

    const fallbackNote: Note = {
      id: ('note-' + Math.random().toString(36).substring(2, 9)) as NoteId,
      hackathonId: ACTIVE_HACKATHON_ID as HackathonId,
      teamId: (input.teamId as TeamId) || null,
      authorId: authorId || (DEFAULT_USER_ID as UserId),
      title: input.title,
      content: input.content,
      visibility: input.visibility,
      isPinned: input.isPinned,
      author: {
        id: authorId || (DEFAULT_USER_ID as UserId),
        fullName: 'You',
        avatarUrl: null,
      },
      commentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return db.notes.insert(fallbackNote);
  },

  async listComments(noteId: NoteId): Promise<NoteComment[]> {
    return db.notes.getComments(noteId);
  },

  async addComment(noteId: NoteId, authorId: UserId, content: string): Promise<NoteComment> {
    const comment: NoteComment = {
      id: 'com-' + Math.random().toString(36).substring(2, 9),
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
    return db.notes.addComment(noteId, comment);
  },
};
