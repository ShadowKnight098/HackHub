# Architecture

Hackathon Collaboration Platform: a private hub where teams chat, share notes and files, pin resources on a map, and post announcements. Built by **two developers in parallel, page by page**. No AI features in the current scope.

## 1. Principles

1. **Database is the root of truth.** Postgres enums, tables and RLS define reality; TypeScript follows.
2. **One definition of everything.** Roles, visibility, IDs, entities and parameters are defined once in `src/types/` and imported everywhere.
3. **Security lives in the database.** RLS and Storage policies enforce access. Frontend filtering is only UX.
4. **Contract first, schema before UI.** A feature's contract is merged before code; its migration and RLS tests land before its screen.
5. **Hard module boundaries.** Features talk to each other only through public `index.ts` exports.

## 2. Stack

React, TypeScript (strict), Vite, Tailwind CSS, HeroUI, Motion, Lucide, TanStack Query, Zod, React Router, Supabase (Auth, Postgres, Storage, Realtime, RLS), PostGIS, MapLibre GL. **No shadcn/ui.**

## 3. Layers

```
UI components (features/*/components)
        |  call
Hooks (features/*/hooks)          TanStack Query, realtime subscriptions
        |  call
Services (src/services)           ONLY layer that touches Supabase
        |  use
Types (src/types)                 enums, ids, Zod schemas, mappers
        |  mirrors
Database (supabase/migrations)    tables, enums, RLS, storage policies
```

Rules:
- Components never import the Supabase client.
- Services return typed domain objects (camelCase) via mappers, or throw `AppError`.
- Hooks own caching, optimistic updates and realtime wiring.

## 4. Folder structure

```
src/
  types/        enums.ts, ids.ts, schemas/, mappers/, database.generated.ts
  lib/          supabase client, query client, env validation, error mapping
  services/     one file per domain: resources, teams, notes, chat, ...
  features/     auth | teams | resources | maps | notes | chat |
                notifications | announcements | admin
                (each: components/, hooks/, index.ts)
  components/ui/  shared HeroUI-based components
  routes/       route definitions, guards, lazy pages
supabase/
  migrations/   timestamped SQL, the only way the schema changes
  tests/        RLS / storage tests
docs/           this folder
```

Import rules (enforced by ESLint):
- `features/*` may import from `types`, `lib`, `services`, `components/ui`, and other features' `index.ts` only.
- `services/*` may import from `types` and `lib` only.
- `types/*` imports nothing from the app.

## 5. Data model (overview)

| Area | Tables |
|---|---|
| Identity | `profiles`, `departments` |
| Hackathon | `hackathons`, `hackathon_participants`, `teams`, `team_members` |
| Content | `resources`, `tags`, `resource_tags`, `notes`, `note_comments`, `reactions`, `bookmarks` |
| Communication | `conversations`, `conversation_participants`, `messages`, `announcements`, `announcement_targets`, `notifications` |
| Progress | `projects`, `project_updates`, `activities` |
| Ops | `audit_log` |

Details live in `DATABASE.md`.

## 6. Access model

- Global roles: `student`, `faculty`, `admin`. **Team lead is derived** from team membership, not stored globally.
- Visibility: `private | team | hackathon | public` (public = any authenticated user).
- `private`: uploader and that team's lead only. Faculty/admin cannot see rows, titles or files.
- All permission logic sits in `SECURITY DEFINER` helper functions (`is_team_member`, `is_team_lead`, `can_read_resource`, ...), reused by table policies, Storage policies, Realtime and activity feeds.
- Admin analytics expose counts only, never private content.

Full matrix in `PERMISSIONS.md`.

## 7. Files and Storage

- Private bucket. Path: `{hackathon_id}/{team_id}/{resource_id}/{filename}`.
- Only `storage_path` is stored in Postgres. No permanent public URLs.
- Signed URLs are generated after a permission check, expire in minutes, and are never persisted.
- Storage policies call the same `can_read_resource` logic.

## 8. Realtime

- Use `postgres_changes` (RLS applies) or authorized private channels.
- Used for: chat messages, notifications, announcements, activity feed.
- Hooks subscribe on mount and unsubscribe on unmount; cache is updated through TanStack Query.

## 9. Errors

Services map backend errors to `AppError` with codes `PERMISSION_DENIED`, `NOT_FOUND`, `NETWORK`, `SESSION_EXPIRED`, `VALIDATION`, `UNKNOWN`. UI shows friendly copy only; raw errors are logged, never displayed.

## 10. Performance

Route-level code splitting, lazy map, cursor pagination, query caching, debounced search, image compression and thumbnails, marker clustering, indexes on every column used in RLS or filters, no unbounded queries.

## 11. Ownership

| Developer 1 | Developer 2 |
|---|---|
| `supabase/`, `src/services/`, auth, RLS, Storage, resources backend, map data | App shell, `components/ui`, notes, chat, notifications, announcements UI, animations |

Shared (both approve): `src/types/`, `docs/`.

## 12. Build order (page by page)

Phase 0 Foundation, 1 Auth, 2 Teams, 3 Resources, 4 Map, 5 Notes, 6 Communication, 7 Progress and activity, 8 Admin, 9 Polish. Each page is a vertical slice: schema, RLS, service, hook, UI, tests, docs.

## 13. Deferred

AI assistant, embeddings, AI-suggested metadata. Services such as `searchResources` and `searchNotes` are built as plain functions so AI can call them later.