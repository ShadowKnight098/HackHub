-- ============================================================================
-- HackHub - Complete PostgreSQL & Supabase Database Schema
-- Idempotent script for Supabase SQL Editor
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

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
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Profiles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    skills TEXT[] DEFAULT '{}',
    role user_role NOT NULL DEFAULT 'student',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Hackathons
CREATE TABLE IF NOT EXISTS hackathons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    banner_url TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    location_name TEXT,
    location_coordinates GEOMETRY(Point, 4326),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Hackathon Participants
CREATE TABLE IF NOT EXISTS hackathon_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(hackathon_id, user_id)
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    table_number TEXT,
    map_location GEOMETRY(Point, 4326),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(hackathon_id, name)
);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role team_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(team_id, user_id)
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    repo_url TEXT,
    demo_url TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(team_id)
);

-- Project Updates
CREATE TABLE IF NOT EXISTS project_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Resources
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type resource_type NOT NULL DEFAULT 'file',
    storage_path TEXT,
    external_url TEXT,
    file_size_bytes BIGINT,
    mime_type TEXT,
    visibility visibility_level NOT NULL DEFAULT 'team',
    location_coordinates GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE
);

-- Resource Tags
CREATE TABLE IF NOT EXISTS resource_tags (
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY(resource_id, tag_id)
);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    visibility visibility_level NOT NULL DEFAULT 'team',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Note Comments
CREATE TABLE IF NOT EXISTS note_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Reactions
CREATE TABLE IF NOT EXISTS reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(user_id, entity_type, entity_id, emoji)
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(user_id, entity_type, entity_id)
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    title TEXT,
    is_direct BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Conversation Participants
CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    PRIMARY KEY(conversation_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Shared Gallery Photos
CREATE TABLE IF NOT EXISTS shared_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID REFERENCES hackathons(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    uploader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    title TEXT,
    table_number TEXT,
    likes_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_photos ENABLE ROW LEVEL SECURITY;

-- Profiles: Allow public read, user self-management & insert
DROP POLICY IF EXISTS "Public profiles read" ON profiles;
CREATE POLICY "Public profiles read" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profiles insert" ON profiles;
CREATE POLICY "Profiles insert" ON profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Profiles update" ON profiles;
CREATE POLICY "Profiles update" ON profiles FOR UPDATE USING (true);

-- Hackathons: Public read & authenticated insert
DROP POLICY IF EXISTS "Hackathons read" ON hackathons;
CREATE POLICY "Hackathons read" ON hackathons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Hackathons insert" ON hackathons;
CREATE POLICY "Hackathons insert" ON hackathons FOR INSERT WITH CHECK (true);

-- Teams: Public read, insert, update
DROP POLICY IF EXISTS "Teams read" ON teams;
CREATE POLICY "Teams read" ON teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teams insert" ON teams;
CREATE POLICY "Teams insert" ON teams FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Teams update" ON teams;
CREATE POLICY "Teams update" ON teams FOR UPDATE USING (true);

-- Team Members: Full read, insert, update, delete
DROP POLICY IF EXISTS "Team members read" ON team_members;
CREATE POLICY "Team members read" ON team_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Team members insert" ON team_members;
CREATE POLICY "Team members insert" ON team_members FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Team members update" ON team_members;
CREATE POLICY "Team members update" ON team_members FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Team members delete" ON team_members;
CREATE POLICY "Team members delete" ON team_members FOR DELETE USING (true);

-- Notes: Full read, insert, update
DROP POLICY IF EXISTS "Notes read" ON notes;
CREATE POLICY "Notes read" ON notes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Notes insert" ON notes;
CREATE POLICY "Notes insert" ON notes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Notes update" ON notes;
CREATE POLICY "Notes update" ON notes FOR UPDATE USING (true);

-- Resources: Full read, insert, update
DROP POLICY IF EXISTS "Resources read" ON resources;
CREATE POLICY "Resources read" ON resources FOR SELECT USING (true);

DROP POLICY IF EXISTS "Resources insert" ON resources;
CREATE POLICY "Resources insert" ON resources FOR INSERT WITH CHECK (true);

-- Conversations & Messages
DROP POLICY IF EXISTS "Conversations read" ON conversations;
CREATE POLICY "Conversations read" ON conversations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Conversations insert" ON conversations;
CREATE POLICY "Conversations insert" ON conversations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Messages read" ON messages;
CREATE POLICY "Messages read" ON messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Messages insert" ON messages;
CREATE POLICY "Messages insert" ON messages FOR INSERT WITH CHECK (true);

-- Announcements
DROP POLICY IF EXISTS "Announcements read" ON announcements;
CREATE POLICY "Announcements read" ON announcements FOR SELECT USING (true);

-- Shared Photos
DROP POLICY IF EXISTS "Photos read" ON shared_photos;
CREATE POLICY "Photos read" ON shared_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Photos insert" ON shared_photos;
CREATE POLICY "Photos insert" ON shared_photos FOR INSERT WITH CHECK (true);

-- 5. INITIAL SEED DATA

-- Active Default Hackathon
INSERT INTO hackathons (
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

-- Default Hacker Profile
INSERT INTO profiles (
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

-- Seed Sample Team
INSERT INTO teams (
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

-- Seed Lead Member for NeuralCraft Pioneers
INSERT INTO team_members (
    team_id,
    user_id,
    role
) VALUES (
    'f75b401d-c2ce-43cc-8917-8e86b605ee4b',
    '80bb5377-7cf9-49e2-b8d7-254193c7a16c',
    'lead'
) ON CONFLICT (team_id, user_id) DO NOTHING;
