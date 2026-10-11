import { sql, isNeonConfigured } from '@/lib/neon';
import { db, DEFAULT_ACADEMIC_MILESTONES, DEFAULT_FACULTY_GUIDE } from '@/lib/db';
import { AppError, ErrorCode } from '@/types/errors';
import type { Team, CreateTeamInput, TeamMember, TeamMilestone } from '@/types/schemas/team';
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
  async listTeams(_hackathonId?: string): Promise<Team[]> {
    let neonTeams: Team[] = [];

    if (isNeonConfigured && sql) {
      try {
        const rows = await sql`
          SELECT
            t.id,
            t.hackathon_id,
            t.name,
            t.description,
            t.avatar_url,
            t.table_number,
            t.created_by,
            t.created_at,
            t.updated_at,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', tm.id,
                  'team_id', tm.team_id,
                  'user_id', tm.user_id,
                  'role', tm.role,
                  'joined_at', tm.joined_at,
                  'profile', json_build_object(
                    'id', p.id,
                    'full_name', p.full_name,
                    'email', p.email,
                    'avatar_url', p.avatar_url
                  )
                )
              ) FILTER (WHERE tm.id IS NOT NULL),
              '[]'
            ) AS team_members
          FROM teams t
          LEFT JOIN team_members tm ON tm.team_id = t.id
          LEFT JOIN profiles p ON p.id = tm.user_id
          GROUP BY t.id
          ORDER BY t.created_at DESC
        `;

        if (rows && rows.length > 0) {
          neonTeams = rows.map((row: any): Team => ({
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
            milestones: DEFAULT_ACADEMIC_MILESTONES,
            assignedFaculty: DEFAULT_FACULTY_GUIDE,
            facultyReviews: [],
            members: (row.team_members || []).map((m: any): TeamMember => ({
              id: m.id,
              teamId: m.team_id as TeamId,
              userId: m.user_id as UserId,
              role: (m.role === 'leader' || m.role === 'lead') ? TeamMemberRole.LEAD : TeamMemberRole.MEMBER,
              joinedAt: m.joined_at,
              user: m.profile ? {
                id: m.profile.id as UserId,
                fullName: m.profile.full_name,
                email: m.profile.email,
                avatarUrl: m.profile.avatar_url,
              } : undefined,
            })),
          }));

          neonTeams.forEach((t) => {
            const existing = db.teams.getById(t.id);
            if (!existing) {
              db.teams.insert(t);
            } else {
              db.teams.update(t.id, t);
            }
          });
        }
      } catch (err) {
        console.warn('Neon teams query notice:', err);
      }
    }

    const localTeams = db.teams.getAll();
    const mergedMap = new Map<string, Team>();
    localTeams.forEach((t) => mergedMap.set(t.id, t));
    neonTeams.forEach((t) => mergedMap.set(t.id, t));

    return Array.from(mergedMap.values());
  },

  async getTeamById(teamId: TeamId): Promise<Team> {
    if (isNeonConfigured && sql && UUID_REGEX.test(teamId)) {
      try {
        const rows = await sql`
          SELECT
            t.id,
            t.hackathon_id,
            t.name,
            t.description,
            t.avatar_url,
            t.table_number,
            t.created_by,
            t.created_at,
            t.updated_at,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', tm.id,
                  'team_id', tm.team_id,
                  'user_id', tm.user_id,
                  'role', tm.role,
                  'joined_at', tm.joined_at,
                  'profile', json_build_object(
                    'id', p.id,
                    'full_name', p.full_name,
                    'email', p.email,
                    'avatar_url', p.avatar_url
                  )
                )
              ) FILTER (WHERE tm.id IS NOT NULL),
              '[]'
            ) AS team_members
          FROM teams t
          LEFT JOIN team_members tm ON tm.team_id = t.id
          LEFT JOIN profiles p ON p.id = tm.user_id
          WHERE t.id = ${teamId}::uuid
          GROUP BY t.id
          LIMIT 1
        `;

        if (rows && rows.length > 0 && rows[0]) {
          const data = rows[0] as any;
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
            milestones: DEFAULT_ACADEMIC_MILESTONES,
            assignedFaculty: DEFAULT_FACULTY_GUIDE,
            facultyReviews: [],
            members: (data.team_members || []).map((m: any): TeamMember => ({
              id: m.id,
              teamId: m.team_id as TeamId,
              userId: m.user_id as UserId,
              role: (m.role === 'leader' || m.role === 'lead') ? TeamMemberRole.LEAD : TeamMemberRole.MEMBER,
              joinedAt: m.joined_at,
              user: m.profile ? {
                id: m.profile.id as UserId,
                fullName: m.profile.full_name,
                email: m.profile.email,
                avatarUrl: m.profile.avatar_url,
              } : undefined,
            })),
          };

          db.teams.update(team.id, team);
          return team;
        }
      } catch (err) {
        console.warn('Neon getTeamById exception:', err);
      }
    }

    const localTeam = db.teams.getById(teamId);
    if (localTeam) return localTeam;

    const all = await this.listTeams().catch(() => db.teams.getAll());
    const matched = all.find((t) => t.id === teamId || t.name.toLowerCase() === teamId.toLowerCase());
    if (matched) return matched;

    throw new AppError(ErrorCode.NOT_FOUND, 'Team not found');
  },

  async createTeam(input: CreateTeamInput, userId: UserId): Promise<Team> {
    const validHackathonId = toValidUuid(input.hackathonId, ACTIVE_HACKATHON_ID);
    const validUserId = toValidUuid(userId, DEFAULT_USER_ID);

    if (isNeonConfigured && sql) {
      try {
        const teamRows = await sql`
          INSERT INTO teams (name, description, table_number, hackathon_id, created_by)
          VALUES (
            ${input.name},
            ${input.description || null},
            ${input.tableNumber || null},
            ${validHackathonId}::uuid,
            ${validUserId}::uuid
          )
          RETURNING *
        `;

        if (teamRows && teamRows.length > 0 && teamRows[0]) {
          const teamData = teamRows[0] as any;
          await sql`
            INSERT INTO team_members (team_id, hackathon_id, user_id, role)
            VALUES (${teamData.id}::uuid, ${validHackathonId}::uuid, ${validUserId}::uuid, 'leader')
            ON CONFLICT DO NOTHING
          `;

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
            milestones: DEFAULT_ACADEMIC_MILESTONES,
            assignedFaculty: DEFAULT_FACULTY_GUIDE,
            facultyReviews: [],
            members: [
              {
                id: 'mem-' + String(teamData.id).slice(0, 8),
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
        console.warn('Neon createTeam notice:', err);
      }
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
      milestones: DEFAULT_ACADEMIC_MILESTONES,
      assignedFaculty: DEFAULT_FACULTY_GUIDE,
      facultyReviews: [],
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

    if (isNeonConfigured && sql && UUID_REGEX.test(teamId)) {
      try {
        await sql`
          INSERT INTO team_members (team_id, hackathon_id, user_id, role)
          VALUES (
            ${teamId}::uuid,
            ${ACTIVE_HACKATHON_ID}::uuid,
            ${validUserId}::uuid,
            'member'
          )
          ON CONFLICT DO NOTHING
        `;
      } catch (err) {
        console.warn('Neon joinTeam notice:', err);
      }
    }
  },

  async leaveTeam(teamId: TeamId, userId: UserId): Promise<void> {
    const validUserId = toValidUuid(userId, DEFAULT_USER_ID);
    db.teamMembers.delete(teamId, userId);
    db.teamMembers.delete(teamId, validUserId);

    const team = db.teams.getById(teamId);
    if (team) {
      team.members = team.members.filter((m) => m.userId !== userId && m.userId !== validUserId);
      db.teams.update(teamId, { members: team.members });
    }

    if (isNeonConfigured && sql && UUID_REGEX.test(teamId)) {
      try {
        await sql`
          DELETE FROM team_members
          WHERE team_id = ${teamId}::uuid AND user_id = ${validUserId}::uuid
        `;
      } catch (err) {
        console.warn('Neon leaveTeam notice:', err);
      }
    }
  },

  async updateMilestone(
    teamId: string | TeamId,
    milestoneId: string,
    updates: Partial<TeamMilestone>,
    reviewRemarks?: { facultyName: string; remarks: string; score?: number }
  ): Promise<TeamMilestone> {
    const validTeamId = teamId as TeamId;
    const team = await this.getTeamById(validTeamId);
    const msIndex = team.milestones.findIndex((m) => m.id === milestoneId);
    if (msIndex === -1) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Milestone not found');
    }

    const currentMilestone = team.milestones[msIndex]!;
    const updated: TeamMilestone = {
      ...currentMilestone,
      ...updates,
      status: updates.status || currentMilestone.status,
      facultyRemarks: reviewRemarks?.remarks || updates.facultyRemarks || currentMilestone.facultyRemarks,
      score: reviewRemarks?.score !== undefined ? reviewRemarks.score : (updates.score !== undefined ? updates.score : currentMilestone.score),
      reviewedBy: reviewRemarks?.facultyName || updates.reviewedBy || currentMilestone.reviewedBy,
    };
    team.milestones[msIndex] = updated;
    db.teams.update(validTeamId, { milestones: team.milestones });

    if (isNeonConfigured && sql && UUID_REGEX.test(validTeamId)) {
      try {
        await sql`
          UPDATE team_milestones
          SET
            status = COALESCE(${updated.status || null}, status),
            submission_url = COALESCE(${updated.submissionUrl || null}, submission_url),
            submission_notes = COALESCE(${updated.submissionNotes || null}, submission_notes),
            score = COALESCE(${updated.score || null}, score),
            faculty_remarks = COALESCE(${updated.facultyRemarks || null}, faculty_remarks)
          WHERE team_id = ${validTeamId}::uuid AND id = ${milestoneId}::uuid
        `;
      } catch (err) {
        console.warn('Neon milestone update notice:', err);
      }
    }

    return updated;
  },

  async submitMilestone(
    teamId: string | TeamId,
    milestoneId: string,
    submission: { submissionUrl: string; submissionNotes: string }
  ): Promise<TeamMilestone> {
    return this.updateMilestone(teamId as TeamId, milestoneId, {
      submissionUrl: submission.submissionUrl,
      submissionNotes: submission.submissionNotes,
      status: 'pending_review',
      submittedAt: new Date().toISOString(),
    });
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

    if (isNeonConfigured && sql) {
      try {
        const existingUsers = await sql`
          SELECT id, full_name, email FROM profiles WHERE LOWER(email) = LOWER(${email}) LIMIT 1
        `;

        if (existingUsers && existingUsers.length > 0 && existingUsers[0]) {
          userId = (existingUsers[0] as any).id;
        } else {
          const insertedUsers = await sql`
            INSERT INTO profiles (email, password_hash, full_name, role)
            VALUES (${email}, ${password}, ${fullName}, 'student')
            RETURNING id
          `;
          if (insertedUsers && insertedUsers.length > 0 && insertedUsers[0]) {
            userId = (insertedUsers[0] as any).id;
          }
        }

        let memData: any = null;
        if (userId) {
          const insertedMembers = await sql`
            INSERT INTO team_members (team_id, hackathon_id, user_id, role)
            VALUES (${input.teamId}::uuid, ${ACTIVE_HACKATHON_ID}::uuid, ${userId}::uuid, ${role === 'lead' ? 'leader' : 'member'})
            ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role
            RETURNING id, team_id, user_id, role, joined_at
          `;
          if (insertedMembers && insertedMembers.length > 0 && insertedMembers[0]) {
            memData = insertedMembers[0];
          }
        }

        const newMember: TeamMember = {
          id: memData?.id || ('mem-' + Math.random().toString(36).substring(2, 7)),
          teamId: input.teamId,
          userId: userId as UserId,
          role: role === 'lead' ? TeamMemberRole.LEAD : TeamMemberRole.MEMBER,
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
        console.warn('Neon addTeamMember notice:', err);
      }
    }

    const mockId = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : ('usr-' + Math.random().toString(36).substring(2, 7))) as UserId;
    const newMember: TeamMember = {
      id: 'mem-' + Math.random().toString(36).substring(2, 7),
      teamId: input.teamId,
      userId: mockId,
      role: role === 'lead' ? TeamMemberRole.LEAD : TeamMemberRole.MEMBER,
      joinedAt: new Date().toISOString(),
      user: {
        id: mockId,
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

  async updateTableNumber(teamId: TeamId, tableNumber: string): Promise<Team> {
    const team = await this.getTeamById(teamId);
    team.tableNumber = tableNumber;
    db.teams.update(teamId, { tableNumber });

    if (isNeonConfigured && sql && UUID_REGEX.test(teamId)) {
      try {
        await sql`
          UPDATE teams
          SET table_number = ${tableNumber}
          WHERE id = ${teamId}::uuid
        `;
      } catch (err) {
        console.warn('Neon table update notice:', err);
      }
    }

    return team;
  },

  async updateProject(
    teamId: TeamId,
    project: {
      name?: string;
      projectTitle?: string;
      projectDescription?: string;
      repoUrl?: string;
      demoUrl?: string;
    }
  ): Promise<Team> {
    const team = await this.getTeamById(teamId);
    if (project.name) team.name = project.name;
    db.teams.update(teamId, team);

    if (isNeonConfigured && sql && UUID_REGEX.test(teamId)) {
      try {
        await sql`
          UPDATE teams
          SET
            name = COALESCE(${project.name || null}, name),
            project_title = COALESCE(${project.projectTitle || null}, project_title),
            project_description = COALESCE(${project.projectDescription || null}, project_description),
            repo_url = COALESCE(${project.repoUrl || null}, repo_url),
            demo_url = COALESCE(${project.demoUrl || null}, demo_url),
            updated_at = now()
          WHERE id = ${teamId}::uuid
        `;
      } catch (err) {
        console.warn('Neon project update notice:', err);
      }
    }

    return team;
  },
};
