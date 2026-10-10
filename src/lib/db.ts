import type { Team } from '@/types/schemas/team';
import type { Note, NoteComment } from '@/types/schemas/note';
import type { Resource } from '@/types/schemas/resource';
import type { Conversation, Message } from '@/types/schemas/chat';
import type { Announcement } from '@/types/schemas/announcement';
import type { HackathonId, ConversationId } from '@/types/ids';

const DB_KEY = 'hackhub_db_v3_live';
const LOCATION_KEY = 'hackhub_cached_location';

export interface CachedLocation {
  coords: [number, number]; // [lng, lat]
  name?: string;
  timestamp: number;
}

export interface SharedPhoto {
  id: string;
  url: string;
  title: string;
  caption?: string;
  teamName?: string;
  tableNumber?: string;
  uploadedBy: {
    name: string;
    avatarUrl?: string;
  };
  tags: string[];
  likes: number;
  likedByMe?: boolean;
  createdAt: string;
}

interface DatabaseSchema {
  teams: Team[];
  notes: Note[];
  noteComments: Record<string, NoteComment[]>;
  resources: Resource[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  announcements: Announcement[];
  photos: SharedPhoto[];
}

// Clean, live database with zero hardcoded mock records
const INITIAL_TEAMS: Team[] = [];
const INITIAL_NOTES: Note[] = [];
const INITIAL_RESOURCES: Resource[] = [];
const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-general' as ConversationId,
    hackathonId: 'hack-1' as HackathonId,
    title: 'general',
    isDirect: false,
    unreadCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'conv-help' as ConversationId,
    hackathonId: 'hack-1' as HackathonId,
    title: 'help-desk',
    isDirect: false,
    unreadCount: 0,
    createdAt: new Date().toISOString(),
  },
];
const INITIAL_ANNOUNCEMENTS: Announcement[] = [];
const INITIAL_PHOTOS: SharedPhoto[] = [];

function loadDatabase(): DatabaseSchema {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const initial: DatabaseSchema = {
        teams: INITIAL_TEAMS,
        notes: INITIAL_NOTES,
        noteComments: {},
        resources: INITIAL_RESOURCES,
        conversations: INITIAL_CONVERSATIONS,
        messages: {},
        announcements: INITIAL_ANNOUNCEMENTS,
        photos: INITIAL_PHOTOS,
      };
      localStorage.setItem(DB_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.photos) parsed.photos = [];
    return parsed;
  } catch (err) {
    console.error('Failed to parse database from localStorage', err);
    return {
      teams: [],
      notes: [],
      noteComments: {},
      resources: [],
      conversations: INITIAL_CONVERSATIONS,
      messages: {},
      announcements: [],
      photos: [],
    };
  }
}

function saveDatabase(data: DatabaseSchema) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save database to localStorage', err);
  }
}

let dbInstance: DatabaseSchema = loadDatabase();

export const db = {
  // Teams
  teams: {
    getAll(): Team[] {
      return [...dbInstance.teams];
    },
    getById(id: string): Team | undefined {
      return dbInstance.teams.find((t) => t.id === id);
    },
    insert(team: Team): Team {
      dbInstance.teams.unshift(team);
      saveDatabase(dbInstance);
      return team;
    },
    update(id: string, updates: Partial<Team>): Team | undefined {
      const idx = dbInstance.teams.findIndex((t) => t.id === id);
      if (idx === -1) return undefined;
      const current = dbInstance.teams[idx]!;
      const updated: Team = {
        ...current,
        ...updates,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      };
      dbInstance.teams[idx] = updated;
      saveDatabase(dbInstance);
      return updated;
    },
  },

  // Notes
  notes: {
    getAll(): Note[] {
      return [...dbInstance.notes];
    },
    getById(id: string): Note | undefined {
      return dbInstance.notes.find((n) => n.id === id);
    },
    insert(note: Note): Note {
      dbInstance.notes.unshift(note);
      saveDatabase(dbInstance);
      return note;
    },
    getComments(noteId: string): NoteComment[] {
      return dbInstance.noteComments[noteId] || [];
    },
    addComment(noteId: string, comment: NoteComment): NoteComment {
      if (!dbInstance.noteComments[noteId]) {
        dbInstance.noteComments[noteId] = [];
      }
      dbInstance.noteComments[noteId].push(comment);
      // Increment comment count
      const note = dbInstance.notes.find((n) => n.id === noteId);
      if (note) {
        note.commentCount = (note.commentCount || 0) + 1;
      }
      saveDatabase(dbInstance);
      return comment;
    },
  },

  // Resources
  resources: {
    getAll(): Resource[] {
      return [...dbInstance.resources];
    },
    insert(res: Resource): Resource {
      dbInstance.resources.unshift(res);
      saveDatabase(dbInstance);
      return res;
    },
  },

  // Chat
  chat: {
    getConversations(): Conversation[] {
      return [...dbInstance.conversations];
    },
    getMessages(convId: string): Message[] {
      return dbInstance.messages[convId] || [];
    },
    sendMessage(convId: string, msg: Message): Message {
      if (!dbInstance.messages[convId]) {
        dbInstance.messages[convId] = [];
      }
      dbInstance.messages[convId].push(msg);
      saveDatabase(dbInstance);
      return msg;
    },
  },

  // Announcements
  announcements: {
    getAll(): Announcement[] {
      return [...dbInstance.announcements];
    },
  },

  // Shared Photos
  photos: {
    getAll(): SharedPhoto[] {
      return [...(dbInstance.photos || [])];
    },
    insert(photo: SharedPhoto): SharedPhoto {
      if (!dbInstance.photos) dbInstance.photos = [];
      dbInstance.photos.unshift(photo);
      saveDatabase(dbInstance);
      return photo;
    },
    toggleLike(id: string): SharedPhoto | undefined {
      if (!dbInstance.photos) dbInstance.photos = [];
      const item = dbInstance.photos.find((p) => p.id === id);
      if (!item) return undefined;
      if (item.likedByMe) {
        item.likes = Math.max(0, item.likes - 1);
        item.likedByMe = false;
      } else {
        item.likes += 1;
        item.likedByMe = true;
      }
      saveDatabase(dbInstance);
      return item;
    },
    delete(id: string): boolean {
      if (!dbInstance.photos) return false;
      const prev = dbInstance.photos.length;
      dbInstance.photos = dbInstance.photos.filter((p) => p.id !== id);
      saveDatabase(dbInstance);
      return dbInstance.photos.length < prev;
    },
  },

  // Location Cache
  location: {
    get(): CachedLocation | null {
      try {
        const stored = localStorage.getItem(LOCATION_KEY);
        if (!stored) return null;
        return JSON.parse(stored);
      } catch {
        return null;
      }
    },
    set(coords: [number, number], name?: string): CachedLocation {
      const loc: CachedLocation = {
        coords,
        name: name || 'Participant Venue Location',
        timestamp: Date.now(),
      };
      localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
      return loc;
    },
    clear() {
      localStorage.removeItem(LOCATION_KEY);
    },
  },
};
