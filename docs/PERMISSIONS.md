# Permissions Matrix & Access Control

## Roles
- Global Roles: `student`, `faculty`, `admin`.
- Team Lead: Derived from `team_members.role = 'lead'` (not global).

## Visibility Levels
- `private`: Visible **only** to the uploader and that team's lead.
  - Faculty and Admin **cannot** see private rows, titles, or storage objects.
- `team`: Visible to all active members of the associated team.
- `hackathon`: Visible to any authenticated participant in the hackathon.
- `public`: Visible to any authenticated user on the platform.

## Matrix

| Resource Type | Visibility | Student (Member) | Student (Lead) | Faculty | Admin |
|---|---|---|---|---|---|
| **Private Resource** | `private` | Uploader only | Yes (if own team) | No | No |
| **Team Resource** | `team` | Yes (if team) | Yes (if team) | No | No |
| **Hackathon Resource** | `hackathon` | Yes | Yes | Yes | Yes |
| **Public Resource** | `public` | Yes | Yes | Yes | Yes |
| **Team Notes** | `team` | Yes (if team) | Yes (if team) | Read-only if public | Read-only if public |
| **Announcements** | Target-based | Read | Read | Create / Edit | Create / Edit / Delete |
| **Admin Audit Log** | Global | No | No | No | Read-only |
