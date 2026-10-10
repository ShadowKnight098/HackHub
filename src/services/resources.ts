import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import { db } from '@/lib/db';
import { toAppError } from '@/types/errors';
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
  async listResources(filters?: { hackathonId?: string; teamId?: string; visibility?: Visibility }): Promise<Resource[]> {
    if (!env.isConfigured) {
      return db.resources.getAll();
    }

    try {
      let query = supabase
        .from('resources')
        .select(`
          id,
          hackathon_id,
          team_id,
          uploader_id,
          title,
          description,
          type,
          storage_path,
          external_url,
          file_size_bytes,
          mime_type,
          visibility,
          created_at,
          updated_at,
          profiles (
            id,
            full_name,
            avatar_url
          ),
          resource_tags (
            tags (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.hackathonId && UUID_REGEX.test(filters.hackathonId)) {
        query = query.eq('hackathon_id', filters.hackathonId);
      }
      if (filters?.teamId && UUID_REGEX.test(filters.teamId)) {
        query = query.eq('team_id', filters.teamId);
      }
      if (filters?.visibility) {
        query = query.eq('visibility', filters.visibility);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Supabase resources fetch warning, using local db:', error.message);
        return db.resources.getAll();
      }

      if (!data || data.length === 0) {
        return db.resources.getAll();
      }

      return (data || []).map((row: any): Resource => ({
        id: row.id as ResourceId,
        hackathonId: row.hackathon_id as HackathonId,
        teamId: row.team_id ? (row.team_id as TeamId) : null,
        uploaderId: row.uploader_id as UserId,
        title: row.title,
        description: row.description,
        type: row.type as ResourceType,
        storagePath: row.storage_path,
        externalUrl: row.external_url,
        fileSizeBytes: row.file_size_bytes,
        mimeType: row.mime_type,
        visibility: row.visibility as Visibility,
        tags: (row.resource_tags || []).map((rt: any) => rt.tags?.name).filter(Boolean),
        uploader: row.profiles ? {
          id: row.profiles.id as UserId,
          fullName: row.profiles.full_name,
          avatarUrl: row.profiles.avatar_url,
        } : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (err) {
      console.warn('Supabase resources exception, using local db:', err);
      return db.resources.getAll();
    }
  },

  async createResource(input: CreateResourceInput, uploaderId: UserId, file?: File): Promise<Resource> {
    const newResource: Resource = {
      id: ('res-' + Math.random().toString(36).substring(2, 9)) as ResourceId,
      hackathonId: (input.hackathonId || 'hack-1') as HackathonId,
      teamId: (input.teamId as TeamId) || null,
      uploaderId,
      title: input.title,
      description: input.description || null,
      type: file ? ResourceType.FILE : input.type,
      storagePath: file ? `uploads/${file.name}` : null,
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
      let storagePath: string | null = null;
      let fileSize: number | null = null;
      let mimeType: string | null = null;

      if (file) {
        const resId = crypto.randomUUID();
        storagePath = `${input.hackathonId || 'hack-1'}/${input.teamId || 'global'}/${resId}/${file.name}`;
        fileSize = file.size;
        mimeType = file.type;

        await supabase.storage
          .from('resources')
          .upload(storagePath, file, {
            upsert: false,
            contentType: file.type,
          });
      }

      const validHackathonId = toValidUuid(input.hackathonId, ACTIVE_HACKATHON_ID);
      const validUploaderId = toValidUuid(uploaderId, DEFAULT_USER_ID);
      const validTeamId = input.teamId && UUID_REGEX.test(input.teamId) ? input.teamId : null;

      const { data, error } = await supabase
        .from('resources')
        .insert({
          hackathon_id: validHackathonId,
          team_id: validTeamId,
          uploader_id: validUploaderId,
          title: input.title,
          description: input.description,
          type: file ? 'file' : input.type,
          storage_path: storagePath,
          external_url: input.externalUrl,
          file_size_bytes: fileSize,
          mime_type: mimeType,
          visibility: input.visibility,
        })
        .select()
        .single();

      if (!error && data) {
        newResource.id = data.id as ResourceId;
      }
    } catch (err) {
      console.warn('Supabase createResource error, synced to db:', err);
    }

    return db.resources.insert(newResource);
  },

  async getSignedUrl(storagePath: string): Promise<string> {
    if (!env.isConfigured) {
      return '#download-placeholder';
    }

    try {
      // Short lived 5-minute signed URL
      const { data, error } = await supabase.storage
        .from('resources')
        .createSignedUrl(storagePath, 300);

      if (error) throw toAppError(error);
      return data.signedUrl;
    } catch (err) {
      throw toAppError(err);
    }
  },
};
