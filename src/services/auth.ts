import { sql, isNeonConfigured } from '@/lib/neon';
import { db } from '@/lib/db';
import type { Profile, SignInCredentials, SignUpCredentials } from '@/types/schemas/auth';
import type { UserId } from '@/types/ids';
import { UserRole } from '@/types/enums';

const AUTH_STATE_LISTENERS: Array<(profile: Profile | null) => void> = [];

function notifyAuthListeners(profile: Profile | null) {
  AUTH_STATE_LISTENERS.forEach((listener) => {
    try {
      listener(profile);
    } catch (e) {
      console.warn('Auth listener notification warning:', e);
    }
  });
}

export const authService = {
  async getSession() {
    try {
      const stored = localStorage.getItem('hackhub_current_profile');
      if (stored) {
        const p = JSON.parse(stored);
        return { user: { id: p.id, email: p.email } };
      }
      return null;
    } catch {
      return null;
    }
  },

  async getCurrentProfile(): Promise<Profile | null> {
    const stored = localStorage.getItem('hackhub_current_profile');
    let localProfile: Profile | null = null;
    if (stored) {
      try {
        localProfile = JSON.parse(stored) as Profile;
      } catch {
        localStorage.removeItem('hackhub_current_profile');
      }
    }

    if (isNeonConfigured && sql && localProfile?.id && /^[0-9a-f-]{36}$/i.test(localProfile.id)) {
      try {
        const rows = await sql`
          SELECT id, email, full_name, avatar_url, bio, skills, role, department_id, created_at, updated_at
          FROM profiles
          WHERE id = ${localProfile.id}::uuid
          LIMIT 1
        `;

        if (rows && rows.length > 0 && rows[0]) {
          const row = rows[0] as any;
          const updatedProfile: Profile = {
            id: row.id as UserId,
            email: row.email,
            fullName: row.full_name,
            avatarUrl: row.avatar_url,
            bio: row.bio,
            skills: row.skills || [],
            role: (row.role as UserRole) || UserRole.STUDENT,
            departmentId: row.department_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
          localStorage.setItem('hackhub_current_profile', JSON.stringify(updatedProfile));
          return updatedProfile;
        }
      } catch (err) {
        console.warn('Neon profile fetch notice:', err);
      }
    }

    return localProfile;
  },

  async signIn(credentials: SignInCredentials): Promise<Profile> {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password?.trim() || '';

    // Query Neon PostgreSQL
    if (isNeonConfigured && sql) {
      try {
        const rows = await sql`
          SELECT id, email, full_name, avatar_url, bio, skills, role, department_id, created_at, updated_at, password_hash
          FROM profiles
          WHERE email = ${email}
          LIMIT 1
        `;

        if (rows && rows.length > 0 && rows[0]) {
          const row = rows[0] as any;
          const profile: Profile = {
            id: row.id as UserId,
            email: row.email,
            fullName: row.full_name,
            avatarUrl: row.avatar_url,
            bio: row.bio,
            skills: row.skills || [],
            role: (row.role as UserRole) || UserRole.STUDENT,
            departmentId: row.department_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };

          db.registeredProfiles.insert({
            id: profile.id,
            email: profile.email,
            password,
            fullName: profile.fullName,
            role: profile.role,
          });

          localStorage.setItem('hackhub_current_profile', JSON.stringify(profile));
          notifyAuthListeners(profile);
          return profile;
        }
      } catch (err) {
        console.warn('Neon signIn query notice:', err);
      }
    }

    // Local cached profiles
    const existing = db.registeredProfiles.getByEmail(email);
    if (existing) {
      if (existing.password && password && existing.password !== password) {
        throw new Error('Incorrect password. Please verify your credentials.');
      }

      const profile: Profile = {
        id: existing.id as UserId,
        email: existing.email,
        fullName: existing.fullName,
        avatarUrl: null,
        bio: existing.rollNumber ? `Roll No: ${existing.rollNumber}` : null,
        skills: [],
        role: existing.role as UserRole,
        departmentId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem('hackhub_current_profile', JSON.stringify(profile));
      notifyAuthListeners(profile);
      return profile;
    }

    throw new Error('No registered participant found with this email. Please register first.');
  },

  async signUp(credentials: SignUpCredentials): Promise<Profile> {
    const rollNo = credentials.rollNumber?.trim() || '';
    const name: string = credentials.fullName?.trim() || rollNo || credentials.email.split('@')[0] || 'Participant';
    const bioText = rollNo ? `Roll No: ${rollNo}` : '';
    const email = credentials.email.trim().toLowerCase();
    const role = credentials.role || UserRole.STUDENT;
    const password = credentials.password?.trim() || '';

    let generatedId = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : ('usr-' + Math.random().toString(36).substring(2, 9))) as UserId;

    if (isNeonConfigured && sql) {
      try {
        const rows = await sql`
          INSERT INTO profiles (email, password_hash, full_name, role, bio)
          VALUES (${email}, ${password}, ${name}, ${role}, ${bioText})
          ON CONFLICT (email) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            bio = EXCLUDED.bio,
            updated_at = now()
          RETURNING id, email, full_name, role, avatar_url, bio, skills, created_at, updated_at
        `;

        if (rows && rows.length > 0 && rows[0]) {
          generatedId = (rows[0] as any).id as UserId;
        }
      } catch (err) {
        console.warn('Neon DB user registration notice:', err);
      }
    }

    const newProfile: Profile = {
      id: generatedId,
      email,
      fullName: name,
      avatarUrl: null,
      bio: bioText,
      skills: [],
      role,
      departmentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.registeredProfiles.insert({
      id: newProfile.id,
      email,
      password,
      fullName: name,
      rollNumber: rollNo,
      role,
    });

    localStorage.setItem('hackhub_current_profile', JSON.stringify(newProfile));
    notifyAuthListeners(newProfile);
    return newProfile;
  },

  async signOut(): Promise<void> {
    localStorage.removeItem('hackhub_current_profile');
    localStorage.removeItem('hackhub_mock_profile');
    localStorage.removeItem('hackhub_cached_location');
    sessionStorage.clear();
    notifyAuthListeners(null);
  },

  onAuthStateChange(callback: (profile: Profile | null) => void) {
    AUTH_STATE_LISTENERS.push(callback);
    authService.getCurrentProfile().then(callback).catch(() => callback(null));

    return () => {
      const idx = AUTH_STATE_LISTENERS.indexOf(callback);
      if (idx !== -1) AUTH_STATE_LISTENERS.splice(idx, 1);
    };
  },
};
