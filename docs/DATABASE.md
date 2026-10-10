# Database Schema & Data Dictionary

## Principles
- Postgres enums, tables, and RLS define reality.
- All IDs are UUID v4.
- Spatial data (points on venue map) stored via `PostGIS` `GEOMETRY(Point, 4326)`.
- Timestamps stored with time zone in UTC (`TIMESTAMPTZ`).

## Enums
- `user_role`: `'student' | 'faculty' | 'admin'`
- `visibility_level`: `'private' | 'team' | 'hackathon' | 'public'`
- `team_role`: `'lead' | 'member'`
- `resource_type`: `'file' | 'link' | 'doc' | 'snippet'`
- `notification_type`: `'announcement' | 'team_invite' | 'note_comment' | 'message' | 'system'`

## Tables
1. **`departments`**: Academic / organizational departments (`id`, `name`, `code`, `created_at`).
2. **`profiles`**: User profiles (`id`, `email`, `full_name`, `avatar_url`, `bio`, `skills`, `role`, `department_id`, timestamps).
3. **`hackathons`**: Hackathon events (`id`, `title`, `tagline`, `description`, `starts_at`, `ends_at`, `location_name`, `location_coordinates`, timestamps).
4. **`hackathon_participants`**: Registration linking (`hackathon_id`, `user_id`, `registered_at`).
5. **`teams`**: Project teams (`id`, `hackathon_id`, `name`, `description`, `avatar_url`, `table_number`, `map_location`, `created_by`, timestamps).
6. **`team_members`**: Membership & lead status (`id`, `team_id`, `user_id`, `role`, `joined_at`).
7. **`projects`**: Hackathon project submission (`id`, `team_id`, `hackathon_id`, `title`, `tagline`, `description`, `repo_url`, `demo_url`, timestamps).
8. **`project_updates`**: Progress logs (`id`, `project_id`, `user_id`, `title`, `content`, `created_at`).
9. **`resources`**: Uploaded or linked resources (`id`, `hackathon_id`, `team_id`, `uploader_id`, `title`, `description`, `type`, `storage_path`, `external_url`, `file_size_bytes`, `mime_type`, `visibility`, `location_coordinates`, timestamps).
10. **`tags`** & **`resource_tags`**: Tagging system.
11. **`notes`** & **`note_comments`**: Team/hackathon notes, markdown docs, comments.
12. **`reactions`**: Emoji reactions for notes, comments, messages.
13. **`bookmarks`**: User bookmarks for notes and resources.
14. **`conversations`**, **`conversation_participants`**, **`messages`**: Chat system.
15. **`announcements`** & **`announcement_targets`**: Official broadcast announcements.
16. **`notifications`**: Targeted user alerts.
17. **`activities`**: Activity audit feed.
18. **`audit_log`**: Administrative security audit log.
