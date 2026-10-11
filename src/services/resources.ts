import { sql, isNeonConfigured } from '@/lib/neon';
import { storageService } from '@/services/storage';
import { db } from '@/lib/db';
import type { Resource, CreateResourceInput } from '@/types/schemas/resource';
import type { ResourceId, HackathonId, TeamId, UserId } from '@/types/ids';
import { ResourceType, Visibility } from '@/types/enums';

const ACTIVE_HACKATHON_ID = '466eebd5-875f-423b-b1f1-10b93bebccf6';
const DEFAULT_USER_ID = '80bb5377-7cf9-49e2-b8d7-254193c7a16c';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toValidUuid(val: string | undefined | null, fallback: string): string {
  if (val && UUID_REGEX.test(val)) return val;
  return fallback;
}

export const resourcesService = {
  async listResources(_filters?: { hackathonId?: string; teamId?: string; visibility?: Visibility }): Promise<Resource[]> {
    if (isNeonConfigured && sql) {
      try {
        const rows = await sql`
          SELECT
            r.id,
            r.hackathon_id,
            r.team_id,
            r.uploader_id,
            r.title,
            r.description,
            r.type,
            r.url,
            r.created_at,
            json_build_object(
              'id', p.id,
              'full_name', p.full_name,
              'avatar_url', p.avatar_url
            ) AS profiles
          FROM resources r
          LEFT JOIN profiles p ON p.id = r.uploader_id
          ORDER BY r.created_at DESC
        `;

        if (rows && rows.length > 0) {
          return rows.map((row: any): Resource => ({
            id: row.id as ResourceId,
            hackathonId: row.hackathon_id as HackathonId,
            teamId: row.team_id as TeamId | null,
            uploaderId: row.uploader_id as UserId,
            title: row.title,
            description: row.description || '',
            type: (row.type as ResourceType) || ResourceType.LINK,
            storagePath: row.url || null,
            externalUrl: row.url || null,
            fileSizeBytes: null,
            mimeType: null,
            visibility: Visibility.PUBLIC,
            tags: [],
            uploader: {
              id: row.profiles?.id || row.uploader_id,
              fullName: row.profiles?.full_name || 'Contributor',
              avatarUrl: row.profiles?.avatar_url || null,
            },
            createdAt: row.created_at,
            updatedAt: row.created_at,
          }));
        }
      } catch (err) {
        console.warn('Neon resources fetch warning, using local db:', err);
      }
    }

    return db.resources.getAll();
  },

  async createResource(input: CreateResourceInput, uploaderId: UserId, file?: File): Promise<Resource> {
    const newResource: Resource = {
      id: ('res-' + Math.random().toString(36).substring(2, 9)) as ResourceId,
      hackathonId: (input.hackathonId || ACTIVE_HACKATHON_ID) as HackathonId,
      teamId: (input.teamId as TeamId) || null,
      uploaderId,
      title: input.title,
      description: input.description || null,
      type: file ? ResourceType.FILE : input.type,
      storagePath: null,
      externalUrl: input.externalUrl || null,
      fileSizeBytes: file ? file.size : null,
      mimeType: file ? file.type : null,
      visibility: input.visibility,
      tags: input.tags || [],
      uploader: {
        id: uploaderId,
        fullName: 'You',
        avatarUrl: null,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (file) {
        const uploadedUrl = await storageService.uploadImage(file, '/resources');
        input.externalUrl = uploadedUrl;
        newResource.storagePath = uploadedUrl;
        newResource.externalUrl = uploadedUrl;
      }

      const validHackathonId = toValidUuid(input.hackathonId, ACTIVE_HACKATHON_ID);
      const validUploaderId = toValidUuid(uploaderId, DEFAULT_USER_ID);
      const validTeamId = input.teamId && UUID_REGEX.test(input.teamId) ? input.teamId : null;

      if (isNeonConfigured && sql) {
        const rows = await sql`
          INSERT INTO resources (
            hackathon_id, team_id, uploader_id, title, description, type, url
          )
          VALUES (
            ${validHackathonId}::uuid,
            ${validTeamId ? sql`${validTeamId}::uuid` : null},
            ${validUploaderId ? sql`${validUploaderId}::uuid` : null},
            ${input.title},
            ${input.description || ''},
            ${file ? 'file' : input.type},
            ${input.externalUrl || ''}
          )
          RETURNING id
        `;

        if (rows && rows.length > 0 && rows[0]) {
          newResource.id = (rows[0] as any).id as ResourceId;
        }
      }
    } catch (err) {
      console.warn('Neon createResource notice, stored in local db:', err);
    }

    return db.resources.insert(newResource);
  },

  async getSignedUrl(storagePath: string): Promise<string> {
    if (!storagePath) return '#download-placeholder';
    return storagePath;
  },
};
