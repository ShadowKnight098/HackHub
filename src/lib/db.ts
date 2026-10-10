import type { Team, TeamMember, TeamMilestone, FacultyReview } from '@/types/schemas/team';
import type { Note, NoteComment } from '@/types/schemas/note';
import type { Resource } from '@/types/schemas/resource';
import type { Conversation, Message } from '@/types/schemas/chat';
import type { Announcement } from '@/types/schemas/announcement';
import type { HackathonId, ConversationId } from '@/types/ids';

const DB_KEY = 'hackhub_db_v3_live';
const LOCATION_KEY = 'hackhub_cached_location';

export const DEFAULT_FACULTY_GUIDE = {
  id: 'fac-1',
  name: 'Dr. Aris Thorne',
  email: 'aris.thorne@faculty.edu',
  department: 'Dept. of Computer Science & Engineering',
};

export const DEFAULT_ACADEMIC_MILESTONES: TeamMilestone[] = [
  {
    id: 'm-phase-1',
    phase: 1,
    title: 'Phase 1: Synopsis & Architecture Spec',
    dueDate: '2026-10-15',
    status: 'approved',
    submissionUrl: 'https://github.com/project-synopsis',
    submissionNotes: 'System architecture diagram, requirements spec, and ERD uploaded.',
    submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    reviewedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    reviewedBy: 'Dr. Aris Thorne (Faculty Guide)',
    facultyRemarks: 'Problem statement is well-scoped and architectural separation looks solid. Approved for prototype phase.',
    score: 9.0,
  },
  {
    id: 'm-phase-2',
    phase: 2,
    title: 'Phase 2: Midterm Prototype & Core APIs',
    dueDate: '2026-10-25',
    status: 'pending_review',
    submissionUrl: 'https://github.com/team-repo',
    submissionNotes: 'Backend CRUD APIs complete and Supabase auth integrated. Ready for mid-term review.',
    submittedAt: new Date().toISOString(),
  },
  {
    id: 'm-phase-3',
    phase: 3,
    title: 'Phase 3: Final Demo, Evaluation & Documentation',
    dueDate: '2026-11-10',
    status: 'in_progress',
  },
];

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
  teamMembers: TeamMember[]; // Stored as distinct records per member
  notes: Note[];
  noteComments: Record<string, NoteComment[]>;
  resources: Resource[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  announcements: Announcement[];
  photos: SharedPhoto[];
  facultyReviews?: FacultyReview[];
  registeredProfiles?: Array<{
    id: string;
    email: string;
    password?: string;
    fullName: string;
    rollNumber?: string;
    role: string;
    createdAt: string;
  }>;
}

// Clean, live database with zero hardcoded mock records
const INITIAL_TEAMS: Team[] = [];
const INITIAL_TEAM_MEMBERS: TeamMember[] = [];
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
        teamMembers: INITIAL_TEAM_MEMBERS,
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
    if (!parsed.teamMembers) {
      parsed.teamMembers = [];
      // Migrate embedded members into separate individual records
      if (Array.isArray(parsed.teams)) {
        parsed.teams.forEach((t: any) => {
          if (Array.isArray(t.members)) {
            t.members.forEach((m: any) => {
              const already = parsed.teamMembers.some((existing: any) => existing.id === m.id);
              if (!already) {
                parsed.teamMembers.push({
                  ...m,
                  teamId: t.id,
                });
              }
            });
          }
        });
      }
    }
    return parsed;
  } catch (err) {
    console.error('Failed to parse database from localStorage', err);
    return {
      teams: [],
      teamMembers: [],
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
  // Teams Collection (Each team stored as a distinct record)
  teams: {
    getAll(): Team[] {
      return dbInstance.teams.map((t) => {
        // Hydrate from distinct teamMembers records
        const members = dbInstance.teamMembers.filter((m) => m.teamId === t.id);
        return {
          ...t,
          members: members.length > 0 ? members : t.members || [],
          milestones: t.milestones && t.milestones.length > 0 ? t.milestones : DEFAULT_ACADEMIC_MILESTONES,
          assignedFaculty: t.assignedFaculty || DEFAULT_FACULTY_GUIDE,
          facultyReviews: t.facultyReviews || [],
        };
      });
    },
    getById(id: string): Team | undefined {
      const team = dbInstance.teams.find((t) => t.id === id);
      if (!team) return undefined;
      const members = dbInstance.teamMembers.filter((m) => m.teamId === team.id);
      return {
        ...team,
        members: members.length > 0 ? members : team.members || [],
        milestones: team.milestones && team.milestones.length > 0 ? team.milestones : DEFAULT_ACADEMIC_MILESTONES,
        assignedFaculty: team.assignedFaculty || DEFAULT_FACULTY_GUIDE,
        facultyReviews: team.facultyReviews || [],
      };
    },
    insert(team: Team): Team {
      // 1. Insert team record
      const teamRecord = {
        ...team,
        milestones: team.milestones && team.milestones.length > 0 ? team.milestones : DEFAULT_ACADEMIC_MILESTONES,
        assignedFaculty: team.assignedFaculty || DEFAULT_FACULTY_GUIDE,
        facultyReviews: team.facultyReviews || [],
      };
      dbInstance.teams.unshift(teamRecord);

      // 2. Insert member records as separate distinct records
      if (Array.isArray(team.members)) {
        team.members.forEach((m) => {
          const exists = dbInstance.teamMembers.some((tm) => tm.id === m.id || (tm.teamId === team.id && tm.userId === m.userId));
          if (!exists) {
            dbInstance.teamMembers.push({
              ...m,
              teamId: team.id,
            });
          }
        });
      }

      saveDatabase(dbInstance);
      return team;
    },
    update(id: string, updates: Partial<Team>): Team | undefined {
      const idx = dbInstance.teams.findIndex((t) => t.id === id);
      if (idx === -1) return undefined;
      const current = dbInstance.teams[idx]!;

      // If members are updated, also sync them into distinct teamMembers records
      if (Array.isArray(updates.members)) {
        updates.members.forEach((m) => {
          const mIdx = dbInstance.teamMembers.findIndex((tm) => tm.id === m.id || (tm.teamId === id && tm.userId === m.userId));
          if (mIdx !== -1) {
            dbInstance.teamMembers[mIdx] = { ...dbInstance.teamMembers[mIdx], ...m, teamId: id as any };
          } else {
            dbInstance.teamMembers.push({ ...m, teamId: id as any });
          }
        });
      }

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
    updateMilestone(
      teamId: string,
      milestoneId: string,
      updates: Partial<TeamMilestone>,
      reviewRemarks?: { facultyName: string; remarks: string; score?: number }
    ): Team | undefined {
      const idx = dbInstance.teams.findIndex((t) => t.id === teamId);
      if (idx === -1) return undefined;
      const current = dbInstance.teams[idx]!;
      const currentMilestones = current.milestones && current.milestones.length > 0 ? [...current.milestones] : [...DEFAULT_ACADEMIC_MILESTONES];

      const mIdx = currentMilestones.findIndex((m) => m.id === milestoneId);
      if (mIdx !== -1) {
        const prev = currentMilestones[mIdx]!;
        const updatedStatus = updates.status || prev.status;
        const updatedScore = reviewRemarks?.score !== undefined ? reviewRemarks.score : (updates.score !== undefined ? updates.score : prev.score);
        const updatedRemarks = reviewRemarks?.remarks !== undefined ? reviewRemarks.remarks : (updates.facultyRemarks !== undefined ? updates.facultyRemarks : prev.facultyRemarks);
        const updatedReviewedBy = reviewRemarks?.facultyName || updates.reviewedBy || prev.reviewedBy;
        const updatedReviewedAt = updatedStatus === 'approved' || updatedStatus === 'needs_revision' ? new Date().toISOString() : prev.reviewedAt;

        currentMilestones[mIdx] = {
          ...prev,
          ...updates,
          status: updatedStatus,
          score: updatedScore,
          facultyRemarks: updatedRemarks,
          reviewedBy: updatedReviewedBy,
          reviewedAt: updatedReviewedAt,
        };
      }

      const reviews = current.facultyReviews ? [...current.facultyReviews] : [];
      if (reviewRemarks && reviewRemarks.remarks.trim()) {
        reviews.unshift({
          id: `rev-${Date.now()}`,
          facultyId: 'fac-1',
          facultyName: reviewRemarks.facultyName,
          milestoneTitle: currentMilestones[mIdx]?.title || 'Milestone Evaluation',
          status: updates.status || 'in_progress',
          remarks: reviewRemarks.remarks,
          score: reviewRemarks.score,
          createdAt: new Date().toISOString(),
        });
      }

      const updated: Team = {
        ...current,
        milestones: currentMilestones,
        facultyReviews: reviews,
        updatedAt: new Date().toISOString(),
      };
      dbInstance.teams[idx] = updated;
      saveDatabase(dbInstance);
      return updated;
    },
    submitMilestone(
      teamId: string,
      milestoneId: string,
      submission: { submissionUrl: string; submissionNotes: string }
    ): Team | undefined {
      const idx = dbInstance.teams.findIndex((t) => t.id === teamId);
      if (idx === -1) return undefined;
      const current = dbInstance.teams[idx]!;
      const currentMilestones = current.milestones && current.milestones.length > 0 ? [...current.milestones] : [...DEFAULT_ACADEMIC_MILESTONES];

      const mIdx = currentMilestones.findIndex((m) => m.id === milestoneId);
      if (mIdx !== -1) {
        const prev = currentMilestones[mIdx]!;
        currentMilestones[mIdx] = {
          ...prev,
          submissionUrl: submission.submissionUrl,
          submissionNotes: submission.submissionNotes,
          submittedAt: new Date().toISOString(),
          status: 'pending_review',
        };
      }

      const updated: Team = {
        ...current,
        milestones: currentMilestones,
        updatedAt: new Date().toISOString(),
      };
      dbInstance.teams[idx] = updated;
      saveDatabase(dbInstance);
      return updated;
    },
  },

  // Team Members Collection (Each member is stored as a separate individual record)
  teamMembers: {
    getAll(): TeamMember[] {
      return [...dbInstance.teamMembers];
    },
    getByTeamId(teamId: string): TeamMember[] {
      return dbInstance.teamMembers.filter((m) => m.teamId === teamId);
    },
    getByUserId(userId: string): TeamMember[] {
      return dbInstance.teamMembers.filter((m) => m.userId === userId);
    },
    insert(member: TeamMember): TeamMember {
      const exists = dbInstance.teamMembers.some(
        (m) => m.teamId === member.teamId && m.userId === member.userId
      );
      if (!exists) {
        dbInstance.teamMembers.push(member);
        saveDatabase(dbInstance);
      }
      return member;
    },
    delete(teamId: string, userId: string): void {
      dbInstance.teamMembers = dbInstance.teamMembers.filter(
        (m) => !(m.teamId === teamId && m.userId === userId)
      );
      saveDatabase(dbInstance);
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
    insert(announcement: Announcement): Announcement {
      if (!dbInstance.announcements) dbInstance.announcements = [];
      dbInstance.announcements.unshift(announcement);
      saveDatabase(dbInstance);
      return announcement;
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

  // Registered Accounts & Profiles
  registeredProfiles: {
    getAll() {
      return [...(dbInstance.registeredProfiles || [])];
    },
    getByEmail(email: string) {
      const normalized = email.trim().toLowerCase();
      return (dbInstance.registeredProfiles || []).find((p) => p.email.toLowerCase() === normalized);
    },
    insert(profile: { id: string; email: string; password?: string; fullName: string; rollNumber?: string; role: string }) {
      if (!dbInstance.registeredProfiles) dbInstance.registeredProfiles = [];
      const normalized = profile.email.trim().toLowerCase();
      const existingIdx = dbInstance.registeredProfiles.findIndex((p) => p.email.toLowerCase() === normalized);
      const record = {
        ...profile,
        email: normalized,
        createdAt: new Date().toISOString(),
      };
      if (existingIdx !== -1) {
        dbInstance.registeredProfiles[existingIdx] = {
          ...dbInstance.registeredProfiles[existingIdx],
          ...record,
        };
      } else {
        dbInstance.registeredProfiles.push(record);
      }
      saveDatabase(dbInstance);
      return record;
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
