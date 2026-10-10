// Core domain enums matching database and architecture definitions

export const UserRole = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  ADMIN: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const Visibility = {
  PRIVATE: 'private',
  TEAM: 'team',
  HACKATHON: 'hackathon',
  PUBLIC: 'public',
} as const;
export type Visibility = (typeof Visibility)[keyof typeof Visibility];

export const TeamMemberRole = {
  LEAD: 'lead',
  MEMBER: 'member',
} as const;
export type TeamMemberRole = (typeof TeamMemberRole)[keyof typeof TeamMemberRole];

export const ErrorCode = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NOT_FOUND: 'NOT_FOUND',
  NETWORK: 'NETWORK',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  VALIDATION: 'VALIDATION',
  UNKNOWN: 'UNKNOWN',
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ResourceType = {
  FILE: 'file',
  LINK: 'link',
  DOC: 'doc',
  SNIPPET: 'snippet',
} as const;
export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

export const NotificationType = {
  ANNOUNCEMENT: 'announcement',
  TEAM_INVITE: 'team_invite',
  NOTE_COMMENT: 'note_comment',
  MESSAGE: 'message',
  SYSTEM: 'system',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
