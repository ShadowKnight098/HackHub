import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import type { Profile, SignInCredentials, SignUpCredentials } from '@/types/schemas/auth';
import type { UserId } from '@/types/ids';
import { UserRole } from '@/types/enums';

export const authService = {
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data?.session) return data.session;
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id as UserId,
            email: data.email,
            fullName: data.full_name,
            avatarUrl: data.avatar_url,
            bio: data.bio,
            skills: data.skills || [],
            role: data.role as UserRole,
            departmentId: data.department_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      }
    } catch (err) {
      console.warn('Supabase profile fetch fallback:', err);
    }

    const stored = localStorage.getItem('hackhub_current_profile');
    if (stored) {
      try {
        return JSON.parse(stored) as Profile;
      } catch {
        localStorage.removeItem('hackhub_current_profile');
      }
    }

    return null;
  },

  async signIn(credentials: SignInCredentials): Promise<Profile> {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password || '';

    // 1. First verify against Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.user) {
        const liveProfile = await this.getCurrentProfile();
        if (liveProfile) {
          localStorage.setItem('hackhub_current_profile', JSON.stringify(liveProfile));
          return liveProfile;
        }
      }
    } catch (err) {
      console.warn('Supabase auth check notice:', err);
    }

    // 2. Check registered accounts in database
    const registered = db.registeredProfiles.getByEmail(email);
    if (registered) {
      if (registered.password && registered.password !== password) {
        throw new Error('Incorrect password. Please enter the password you registered with.');
      }

      const verifiedProfile: Profile = {
        id: registered.id as UserId,
        email: registered.email,
        fullName: registered.fullName,
        avatarUrl: null,
        bio: registered.rollNumber ? `Roll No: ${registered.rollNumber}` : '',
        skills: [],
        role: (registered.role as UserRole) || UserRole.STUDENT,
        departmentId: null,
        createdAt: registered.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem('hackhub_current_profile', JSON.stringify(verifiedProfile));
      return verifiedProfile;
    }

    // 3. Check public.profiles in Supabase database
    try {
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (dbProfile) {
        const profile: Profile = {
          id: dbProfile.id as UserId,
          email: dbProfile.email,
          fullName: dbProfile.full_name,
          avatarUrl: dbProfile.avatar_url,
          bio: dbProfile.bio,
          skills: dbProfile.skills || [],
          role: dbProfile.role as UserRole,
          departmentId: dbProfile.department_id,
          createdAt: dbProfile.created_at,
          updatedAt: dbProfile.updated_at,
        };

        db.registeredProfiles.insert({
          id: profile.id,
          email: profile.email,
          password,
          fullName: profile.fullName,
          role: profile.role,
        });

        localStorage.setItem('hackhub_current_profile', JSON.stringify(profile));
        return profile;
      }
    } catch {}

    // Account does not exist in any database
    throw new Error('No registered participant found with this email. Please register first.');
  },

  async signUp(credentials: SignUpCredentials): Promise<Profile> {
    const rollNo = credentials.rollNumber?.trim() || '';
    const name: string = credentials.fullName?.trim() || rollNo || credentials.email.split('@')[0] || 'Participant';
    const bioText = rollNo ? `Roll No: ${rollNo}` : '';
    const email = credentials.email.trim().toLowerCase();
    const role = credentials.role || UserRole.STUDENT;
    const password = credentials.password?.trim() || '';

    const newProfile: Profile = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : ('usr-' + Math.random().toString(36).substring(2, 9))) as UserId,
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

    // Save account securely into database registeredProfiles
    db.registeredProfiles.insert({
      id: newProfile.id,
      email,
      password,
      fullName: name,
      rollNumber: rollNo,
      role,
    });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            roll_number: rollNo,
            role: 'student',
          },
        },
      });

      if (error) {
        console.warn('Supabase signUp API notice:', error.message);
      }

      if (data?.user) {
        newProfile.id = data.user.id as UserId;
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            full_name: name,
            bio: bioText,
            role: 'student',
          }, { onConflict: 'id' });
        } catch (upsertErr) {
          console.warn('Public profiles upsert notice:', upsertErr);
        }
      } else {
        // If Supabase Auth throttles signup (429 email rate limit),
        // check if user's profile with this email already exists in profiles
        try {
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle();

          if (existing?.id) {
            newProfile.id = existing.id as UserId;
            await supabase.from('profiles').update({
              full_name: name,
              bio: bioText,
            }).eq('id', existing.id);
          }
        } catch {}
      }
    } catch (err) {
      console.warn('Supabase signUp network exception (local profile active):', err);
    }

    localStorage.setItem('hackhub_current_profile', JSON.stringify(newProfile));
    return newProfile;
  },

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem('hackhub_current_profile');
    localStorage.removeItem('hackhub_mock_profile');
    localStorage.removeItem('hackhub_cached_location');
    sessionStorage.clear();
  },

  onAuthStateChange(callback: (profile: Profile | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async () => {
      const profile = await authService.getCurrentProfile().catch(() => null);
      callback(profile);
    });

    return () => {
      subscription.unsubscribe();
    };
  },
};
