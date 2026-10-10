import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import { db } from '@/lib/db';
import { AppError, ErrorCode } from '@/types/errors';
import type { Team, CreateTeamInput, TeamMember } from '@/types/schemas/team';
import type { TeamId, HackathonId, UserId } from '@/types/ids';
import { TeamMemberRole } from '@/types/enums';

export const ACTIVE_HACKATHON_ID = '466eebd5-875f-423b-b1f1-10b93bebccf6';
export const DEFAULT_USER_ID = '80bb5377-7cf9-49e2-b8d7-254193c7a16c';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function toValidUuid(val: string | undefined | null, fallback: string): string {
  if (val && UUID_REGEX.test(val)) return val;
  return fallback;
}

export const teamsService = {
  async listTeams(hackathonId?: string): Promise<Team[]> {
    let supabaseTeams: Team[] = [];

    if (env.isConfigured) {
      try {
        let query = supabase
          .from('teams')
          .select(`
            id,
            hackathon_id,
            name,
            description,
            avatar_url,
            table_number,
            created_by,
            created_at,
            updated_at,
            team_members (
              id,
              team_id,
              user_id,
              role,
              joined_at,
              profiles (
                id,
                full_name,
                email,
                avatar_url
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (hackathonId && UUID_REGEX.test(hackathonId)) {
          query = query.eq('hackathon_id', hackathonId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          supabaseTeams = data.map((row: any): Team => ({
            id: row.id as TeamId,
            hackathonId: row.hackathon_id as HackathonId,
            name: row.name,
            description: row.description,
            avatarUrl: row.avatar_url,
            tableNumber: row.table_number,
            locationCoordinates: null,
            createdBy: row.created_by as UserId,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            members: (row.team_members || []).map((m: any): TeamMember => ({
              id: m.id,
              teamId: m.team_id as TeamId,
              userId: m.user_id as UserId,
              role: m.role as TeamMemberRole,
              joinedAt: m.joined_at,
              user: m.profiles ? {
                id: m.profiles.id as UserId,
                fullName: m.profiles.full_name,
                email: m.profiles.email,
                avatarUrl: m.profiles.avatar_url,
              } : undefined,
            })),
          }));

          supabaseTeams.forEach((t) => {
            const existing = db.teams.getById(t.id);
            if (!existing) {
              db.teams.insert(t);
            } else {
              db.teams.update(t.id, t);
            }
          });
        }
      } catch (err) {
        console.warn('Supabase teams exception, falling back to local db:', err);
      }
    }

    // Merge Supabase teams with any locally registered teams
    const localTeams = db.teams.getAll();
    const mergedMap = new Map<string, Team>();

    localTeams.forEach((t) => mergedMap.set(t.id, t));
    supabaseTeams.forEach((t) => mergedMap.set(t.id, t));

    return Array.from(mergedMap.values());
  },

  async getTeamById(teamId: TeamId): Promise<Team> {
    // 1. If valid UUID and Supabase is configured, fetch live from Supabase
    if (env.isConfigured && UUID_REGEX.test(teamId)) {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select(`
            id,
            hackathon_id,
            name,
            description,
            avatar_url,
            table_number,
            created_by,
            created_at,
            updated_at,
            team_members (
              id,
              team_id,
              user_id,
              role,
              joined_at,
              profiles (
                id,
                full_name,
                email,
                avatar_url
              )
            )
          `)
          .eq('id', teamId)
          .single();

        if (!error && data) {
          const team: Team = {
            id: data.id as TeamId,
            hackathonId: data.hackathon_id as HackathonId,
            name: data.name,
            description: data.description,
            avatarUrl: data.avatar_url,
            tableNumber: data.table_number,
            locationCoordinates: null,
            createdBy: data.created_by as UserId,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            members: (data.team_members || []).map((m: any): TeamMember => ({
              id: m.id,
              teamId: m.team_id as TeamId,
              userId: m.user_id as UserId,
              role: m.role as TeamMemberRole,
              joinedAt: m.joined_at,
              user: m.profiles ? {
                id: m.profiles.id as UserId,
                fullName: m.profiles.full_name,
                email: m.profiles.email,
                avatarUrl: m.profiles.avatar_url,
              } : undefined,
            })),
          };

          db.teams.update(team.id, team);
          return team;
        }
      } catch (err) {
        console.warn('Supabase getTeamById exception, falling back to local search:', err);
      }
    }

    // 2. Check local db
    const localTeam = db.teams.getById(teamId);
    if (localTeam) return localTeam;

    // 3. Fallback search across all known teams
    const all = await this.listTeams().catch(() => db.teams.getAll());
    const matched = all.find((t) => t.id === teamId || t.name.toLowerCase() === teamId.toLowerCase());
    if (matched) return matched;

    throw new AppError(ErrorCode.NOT_FOUND, 'Team not found');
  },

  async createTeam(input: CreateTeamInput, userId: UserId): Promise<Team> {
    const validHackathonId = toValidUuid(input.hackathonId, ACTIVE_HACKATHON_ID);
    const validUserId = toValidUuid(userId, DEFAULT_USER_ID);

    try {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: input.name,
          description: input.description || null,
          table_number: input.tableNumber || null,
          hackathon_id: validHackathonId,
          created_by: validUserId,
        })
        .select()
        .single();

      if (teamError) {
        console.error('Supabase createTeam error:', teamError);
      }

      if (teamData) {
        await supabase
          .from('team_members')
          .insert({
            team_id: teamData.id,
            user_id: validUserId,
            role: 'lead',
          });

        let creatorProfile: any = null;
        try {
          const s = localStorage.getItem('hackhub_current_profile');
          if (s) creatorProfile = JSON.parse(s);
        } catch {}

        const createdTeam: Team = {
          id: teamData.id as TeamId,
          hackathonId: teamData.hackathon_id as HackathonId,
          name: teamData.name,
          description: teamData.description,
          avatarUrl: teamData.avatar_url,
          tableNumber: teamData.table_number,
          locationCoordinates: null,
          createdBy: teamData.created_by as UserId,
          createdAt: teamData.created_at,
          updatedAt: teamData.updated_at,
          members: [
            {
              id: 'mem-' + teamData.id.slice(0, 8),
              teamId: teamData.id as TeamId,
              userId: validUserId as UserId,
              role: TeamMemberRole.LEAD,
              joinedAt: new Date().toISOString(),
              user: {
                id: validUserId as UserId,
                fullName: creatorProfile?.fullName || 'Team Lead',
                email: creatorProfile?.email || '',
              },
            },
          ],
        };

        db.teams.insert(createdTeam);
        return createdTeam;
      }
    } catch (err) {
      console.warn('Supabase createTeam exception, synced to local db:', err);
    }

    let creatorProfile: any = null;
    try {
      const s = localStorage.getItem('hackhub_current_profile');
      if (s) creatorProfile = JSON.parse(s);
    } catch {}

    const fallbackTeam: Team = {
      id: ('team-' + Math.random().toString(36).substring(2, 9)) as TeamId,
      hackathonId: validHackathonId as HackathonId,
      name: input.name,
      description: input.description || null,
      avatarUrl: null,
      tableNumber: input.tableNumber || null,
      locationCoordinates: null,
      createdBy: validUserId as UserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: [
        {
          id: 'mem-' + Math.random().toString(36).substring(2, 7),
          teamId: '' as TeamId,
          userId: validUserId as UserId,
          role: TeamMemberRole.LEAD,
          joinedAt: new Date().toISOString(),
          user: {
            id: validUserId as UserId,
            fullName: creatorProfile?.fullName || 'Team Lead',
            email: creatorProfile?.email || '',
          },
        },
      ],
    };
    fallbackTeam.members[0]!.teamId = fallbackTeam.id;
    return db.teams.insert(fallbackTeam);
  },

  async joinTeam(teamId: TeamId, userId: UserId): Promise<void> {
    const validUserId = toValidUuid(userId, DEFAULT_USER_ID);

    // 1. Immediately update local database state so user sees joined status
    const team = db.teams.getById(teamId);
    let currentUserProfile: any = null;
    try {
      const stored = localStorage.getItem('hackhub_current_profile');
      if (stored) currentUserProfile = JSON.parse(stored);
    } catch {}

    const memberName = currentUserProfile?.fullName || 'Hacker Member';
    const memberEmail = currentUserProfile?.email || 'hacker@hackhub.dev';

    if (team) {
      if (!team.members.some((m) => m.userId === userId || m.userId === validUserId)) {
        const memberRecord: TeamMember = {
          id: 'mem-' + Math.random().toString(36).substring(2, 7),
          teamId,
          userId: (team.id.includes('-') && team.id.length === 36 ? validUserId : userId) as UserId,
          role: TeamMemberRole.MEMBER,
          joinedAt: new Date().toISOString(),
          user: {
            id: validUserId as UserId,
            fullName: memberName,
            email: memberEmail,
          },
        };
        db.teamMembers.insert(memberRecord);
        team.members.push(memberRecord);
        db.teams.update(teamId, { members: team.members });
      }
    }

    // 2. If it is a Supabase team, sync with Supabase team_members
    if (env.isConfigured && UUID_REGEX.test(teamId)) {
      try {
        await supabase
          .from('team_members')
          .insert({
            team_id: teamId,
            user_id: validUserId,
            role: 'member',
          });
      } catch (err) {
        console.warn('Supabase joinTeam warning (local membership preserved):', err);
      }
    }
  },

  async leaveTeam(teamId: TeamId, userId: UserId): Promise<void> {
    const validUserId = toValidUuid(userId, DEFAULT_USER_ID);
    // Remove from local individual teamMembers table
    db.teamMembers.delete(teamId, userId);
    db.teamMembers.delete(teamId, validUserId);

    const team = db.teams.getById(teamId);
    if (team) {
      team.members = team.members.filter((m) => m.userId !== userId && m.userId !== validUserId);
      db.teams.update(teamId, { members: team.members });
    }

    if (env.isConfigured && UUID_REGEX.test(teamId)) {
      try {
        const { error } = await supabase
          .from('team_members')
          .delete()
          .eq('team_id', teamId)
          .eq('user_id', validUserId);

        if (error) console.warn('Supabase leaveTeam warning:', error);
      } catch (err) {
        console.warn('Supabase leaveTeam exception:', err);
      }
    }
  },

  async addTeamMember(input: {
    teamId: TeamId;
    fullName: string;
    email: string;
    password?: string;
    role: 'lead' | 'member';
  }): Promise<TeamMember> {
    const role = input.role || 'member';
    const email = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim();
    const password = input.password?.trim() || 'HackHub@2026';

    let userId: string = '';

    if (env.isConfigured) {
      try {
        // 1. Check if user already exists in profiles
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .eq('email', email)
          .maybeSingle();

        if (existingProfile) {
          userId = existingProfile.id;
        } else {
          // 2. Create user with admin createUser
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName, role: 'student' },
          });

          if (!authError && authUser?.user) {
            userId = authUser.user.id;
          } else {
            const { data: userList } = await supabase.auth.admin.listUsers();
            const matched = userList?.users?.find((u) => u.email?.toLowerCase() === email);
            userId = matched?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : DEFAULT_USER_ID);
          }

          // 3. Upsert into profiles
          await supabase.from('profiles').upsert({
            id: userId,
            email,
            full_name: fullName,
            role: 'student',
          });
        }

        // 4. Insert into team_members
        const { data: memData, error: memError } = await supabase
          .from('team_members')
          .insert({
            team_id: input.teamId,
            user_id: userId,
            role,
          })
          .select()
          .single();

        if (memError) {
          console.warn('team_members insert error:', memError.message);
        }

        const newMember: TeamMember = {
          id: memData?.id || ('mem-' + Math.random().toString(36).substring(2, 7)),
          teamId: input.teamId,
          userId: userId as UserId,
          role: role as TeamMemberRole,
          joinedAt: memData?.joined_at || new Date().toISOString(),
          user: {
            id: userId as UserId,
            fullName,
            email,
          },
        };

        const localTeam = db.teams.getById(input.teamId);
        if (localTeam && !localTeam.members.some((m) => m.userId === userId)) {
          localTeam.members.push(newMember);
          db.teams.update(input.teamId, { members: localTeam.members });
        }

        return newMember;
      } catch (err) {
        console.warn('Supabase addTeamMember exception, falling back to local:', err);
      }
    }

    userId = 'usr-' + Math.random().toString(36).substring(2, 9);
    const newMember: TeamMember = {
      id: 'mem-' + Math.random().toString(36).substring(2, 7),
      teamId: input.teamId,
      userId: userId as UserId,
      role: role as TeamMemberRole,
      joinedAt: new Date().toISOString(),
      user: {
        id: userId as UserId,
        fullName,
        email,
      },
    };

    const localTeam = db.teams.getById(input.teamId);
    if (localTeam) {
      localTeam.members.push(newMember);
      db.teams.update(input.teamId, { members: localTeam.members });
    }

    return newMember;
  },
};
