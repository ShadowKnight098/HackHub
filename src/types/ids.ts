// Strongly typed branded IDs to prevent mixing ID parameters across domains

declare const brand: unique symbol;
export type Brand<T, B> = T & { readonly [brand]: B };

export type UserId = Brand<string, 'UserId'>;
export type HackathonId = Brand<string, 'HackathonId'>;
export type TeamId = Brand<string, 'TeamId'>;
export type ResourceId = Brand<string, 'ResourceId'>;
export type TagId = Brand<string, 'TagId'>;
export type NoteId = Brand<string, 'NoteId'>;
export type NoteCommentId = Brand<string, 'NoteCommentId'>;
export type ConversationId = Brand<string, 'ConversationId'>;
export type MessageId = Brand<string, 'MessageId'>;
export type AnnouncementId = Brand<string, 'AnnouncementId'>;
export type NotificationId = Brand<string, 'NotificationId'>;
export type ProjectId = Brand<string, 'ProjectId'>;
export type ProjectUpdateId = Brand<string, 'ProjectUpdateId'>;
export type ActivityId = Brand<string, 'ActivityId'>;

// Cast helpers for convenience when hydrating from DB / params
export const asUserId = (id: string): UserId => id as UserId;
export const asHackathonId = (id: string): HackathonId => id as HackathonId;
export const asTeamId = (id: string): TeamId => id as TeamId;
export const asResourceId = (id: string): ResourceId => id as ResourceId;
export const asNoteId = (id: string): NoteId => id as NoteId;
export const asConversationId = (id: string): ConversationId => id as ConversationId;
export const asMessageId = (id: string): MessageId => id as MessageId;
export const asAnnouncementId = (id: string): AnnouncementId => id as AnnouncementId;
export const asNotificationId = (id: string): NotificationId => id as NotificationId;
export const asProjectId = (id: string): ProjectId => id as ProjectId;
