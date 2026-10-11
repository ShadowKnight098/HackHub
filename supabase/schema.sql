-- ============================================================================
-- HackHub - Complete PostgreSQL & Supabase Database Schema
-- Idempotent script for Supabase SQL Editor (Run this in Supabase SQL Editor)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Try postgis, if not available in project, ignore error
DO $$ BEGIN
    CREATE EXTENSION IF NOT EXISTS "postgis";
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PostGIS extension not enabled or available, continuing without spatial index...';
END $$;

-- 2. ENUMS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('student', 'faculty', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility_level') THEN
        CREATE TYPE visibility_level AS ENUM ('private', 'team', 'hackathon', 'public');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_role') THEN
        CREATE TYPE team_role AS ENUM ('lead', 'member');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_type') THEN
        CREATE TYPE resource_type AS ENUM ('file', 'link', 'doc', 'snippet');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('announcement', 'team_invite', 'note_comment', 'message', 'system');
    END IF;
END $$;

-- 3. CORE TABLES

-- Departments
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Profiles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    skills TEXT[] DEFAULT '{}',
    role user_role NOT NULL DEFAULT 'student',
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Hackathons
CREATE TABLE IF NOT EXISTS public.hackathons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    banner_url TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    location_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Hackathon Participants
CREATE TABLE IF NOT EXISTS public.hackathon_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(hackathon_id, user_id)
);

-- Teams
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    table_number TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(hackathon_id, name)
);

-- Team Members
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role team_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(team_id, user_id)
);

-- Team Milestones (Phase 1, Phase 2, Phase 3 Supervision)
CREATE TABLE IF NOT EXISTS public.team_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    phase INT NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'in_progress',
    submission_url TEXT,
    submission_notes TEXT,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    faculty_remarks TEXT,
    score NUMERIC(4, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Faculty Reviews (Rubric scoring & remarks)
CREATE TABLE IF NOT EXISTS public.faculty_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES public.team_milestones(id) ON DELETE SET NULL,
    faculty_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    faculty_name TEXT NOT NULL,
    milestone_title TEXT NOT NULL,
    status TEXT NOT NULL,
    remarks TEXT NOT NULL,
    score NUMERIC(4, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Resources
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type resource_type NOT NULL DEFAULT 'file',
    url TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    tags TEXT[] DEFAULT '{}',
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Notes
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    visibility visibility_level NOT NULL DEFAULT 'team',
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Note Comments
CREATE TABLE IF NOT EXISTS public.note_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    title TEXT,
    is_direct BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Shared Gallery Photos
CREATE TABLE IF NOT EXISTS public.shared_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    uploader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    title TEXT,
    table_number TEXT,
    likes_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. AUTOMATIC AUTH USER TRIGGER & BACKFILL (CRITICAL: Fixes 406 Error)
-- Whenever a user signs up/in via Supabase Auth, auto-insert their profile in public.profiles!
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'student'::public.user_role)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing users in auth.users that don't have a profile yet:
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'student'::public.user_role
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES (PERMISSIVE & SAFE)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_photos ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Profiles insert" ON public.profiles;
CREATE POLICY "Profiles insert" ON public.profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Profiles update" ON public.profiles;
CREATE POLICY "Profiles update" ON public.profiles FOR UPDATE USING (true);

-- Hackathons
DROP POLICY IF EXISTS "Hackathons read" ON public.hackathons;
CREATE POLICY "Hackathons read" ON public.hackathons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Hackathons insert" ON public.hackathons;
CREATE POLICY "Hackathons insert" ON public.hackathons FOR INSERT WITH CHECK (true);

-- Teams
DROP POLICY IF EXISTS "Teams read" ON public.teams;
CREATE POLICY "Teams read" ON public.teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Teams insert" ON public.teams;
CREATE POLICY "Teams insert" ON public.teams FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Teams update" ON public.teams;
CREATE POLICY "Teams update" ON public.teams FOR UPDATE USING (true);

-- Team Members
DROP POLICY IF EXISTS "Team members read" ON public.team_members;
CREATE POLICY "Team members read" ON public.team_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Team members insert" ON public.team_members;
CREATE POLICY "Team members insert" ON public.team_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Team members update" ON public.team_members;
CREATE POLICY "Team members update" ON public.team_members FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Team members delete" ON public.team_members;
CREATE POLICY "Team members delete" ON public.team_members FOR DELETE USING (true);

-- Milestones & Reviews
DROP POLICY IF EXISTS "Team milestones read" ON public.team_milestones;
CREATE POLICY "Team milestones read" ON public.team_milestones FOR SELECT USING (true);
DROP POLICY IF EXISTS "Team milestones insert" ON public.team_milestones;
CREATE POLICY "Team milestones insert" ON public.team_milestones FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Team milestones update" ON public.team_milestones;
CREATE POLICY "Team milestones update" ON public.team_milestones FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Faculty reviews read" ON public.faculty_reviews;
CREATE POLICY "Faculty reviews read" ON public.faculty_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Faculty reviews insert" ON public.faculty_reviews;
CREATE POLICY "Faculty reviews insert" ON public.faculty_reviews FOR INSERT WITH CHECK (true);

-- Notes & Resources
DROP POLICY IF EXISTS "Notes read" ON public.notes;
CREATE POLICY "Notes read" ON public.notes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Notes insert" ON public.notes;
CREATE POLICY "Notes insert" ON public.notes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Notes update" ON public.notes;
CREATE POLICY "Notes update" ON public.notes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Resources read" ON public.resources;
CREATE POLICY "Resources read" ON public.resources FOR SELECT USING (true);
DROP POLICY IF EXISTS "Resources insert" ON public.resources;
CREATE POLICY "Resources insert" ON public.resources FOR INSERT WITH CHECK (true);

-- Conversations & Messages
DROP POLICY IF EXISTS "Conversations read" ON public.conversations;
CREATE POLICY "Conversations read" ON public.conversations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Conversations insert" ON public.conversations;
CREATE POLICY "Conversations insert" ON public.conversations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Messages read" ON public.messages;
CREATE POLICY "Messages read" ON public.messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Messages insert" ON public.messages;
CREATE POLICY "Messages insert" ON public.messages FOR INSERT WITH CHECK (true);

-- Announcements & Photos
DROP POLICY IF EXISTS "Announcements read" ON public.announcements;
CREATE POLICY "Announcements read" ON public.announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Photos read" ON public.shared_photos;
CREATE POLICY "Photos read" ON public.shared_photos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Photos insert" ON public.shared_photos;
CREATE POLICY "Photos insert" ON public.shared_photos FOR INSERT WITH CHECK (true);

-- 6. STORAGE BUCKETS SETUP (For Gallery Photos & Resources)
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage public policies
DROP POLICY IF EXISTS "Public Gallery Select" ON storage.objects;
CREATE POLICY "Public Gallery Select" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Public Gallery Insert" ON storage.objects;
CREATE POLICY "Public Gallery Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Public Resources Select" ON storage.objects;
CREATE POLICY "Public Resources Select" ON storage.objects FOR SELECT USING (bucket_id = 'resources');

DROP POLICY IF EXISTS "Public Resources Insert" ON storage.objects;
CREATE POLICY "Public Resources Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resources');

-- 7. INITIAL SEED DATA (Default Hackathon, Profiles & Teams)
INSERT INTO public.hackathons (
    id,
    title,
    tagline,
    description,
    banner_url,
    starts_at,
    ends_at,
    location_name,
    is_active
) VALUES (
    '466eebd5-875f-423b-b1f1-10b93bebccf6',
    'HackHub Global 2026',
    'Collaborative Intelligence & Decentralized Systems',
    'The premier university hackathon cohort exploring autonomous robotics, AI agents, and web infrastructure.',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200',
    timezone('utc', now()),
    timezone('utc', now() + interval '7 days'),
    'Main Engineering Complex - Hall A',
    true
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    is_active = true;

INSERT INTO public.profiles (
    id,
    email,
    full_name,
    bio,
    skills,
    role
) VALUES (
    '80bb5377-7cf9-49e2-b8d7-254193c7a16c',
    'hacker@hackhub.dev',
    'Alex Rivera',
    'Full-stack builder focusing on distributed perception & AI systems.',
    ARRAY['TypeScript', 'React', 'Python', 'Supabase'],
    'student'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

INSERT INTO public.teams (
    id,
    hackathon_id,
    name,
    description,
    table_number,
    created_by
) VALUES (
    'f75b401d-c2ce-43cc-8917-8e86b605ee4b',
    '466eebd5-875f-423b-b1f1-10b93bebccf6',
    'NeuralCraft Pioneers',
    'Autonomous robotics perception system with distributed edge sensor fusion.',
    'Table A-12',
    '80bb5377-7cf9-49e2-b8d7-254193c7a16c'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

INSERT INTO public.team_members (
    team_id,
    user_id,
    role
) VALUES (
    'f75b401d-c2ce-43cc-8917-8e86b605ee4b',
    '80bb5377-7cf9-49e2-b8d7-254193c7a16c',
    'lead'
) ON CONFLICT (team_id, user_id) DO NOTHING;
