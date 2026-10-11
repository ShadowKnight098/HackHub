import React, { useState } from 'react';
import { Avatar } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Star } from 'lucide-react';
import type { Note } from '@/types/schemas/note';
import { Visibility } from '@/types/enums';
import { useAuth } from '@/features/auth';
import { useNoteComments } from '../hooks/useNotes';

interface NoteCardProps {
  note: Note;
  index?: number;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, index = 0 }) => {
  const { profile } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const { comments, addComment, isAdding } = useNoteComments(note.id);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !commentText.trim()) return;

    try {
      await addComment({ authorId: profile.id, content: commentText.trim() });
      setCommentText('');
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  };

  const tintClass = index % 3 === 0 ? 'note-tint-1' : index % 3 === 1 ? 'note-tint-2' : 'note-tint-3';

  return (
    <motion.div whileHover={{ y: -3, transition: { duration: 0.2 } }} className="h-full">
      {/* Sticky note: straight (no rotation), 6px radius, 3px --sun top border, soft shadow, tinted */}
      <div className={`h-full commons-sticky-note ${tintClass} flex flex-col justify-between overflow-hidden`}>
        <div className="p-5 pb-3">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <Avatar
                src={note.author?.avatarUrl || undefined}
                name={note.author?.fullName?.slice(0, 1) || 'U'}
                className="w-7 h-7 text-[10px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]"
              />
              <div>
                <h3 className="font-heading text-base text-[var(--ink)] leading-snug">{note.title}</h3>
                <div className="flex items-center gap-2 text-[11px] text-[var(--muted)] mt-0.5">
                  <span>{note.author?.fullName || 'Collaborator'}</span>
                  <span>&bull;</span>
                  <span className="font-mono">{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {note.isPinned && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-200 text-amber-700 bg-amber-50">
                  <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                  Pinned
                </span>
              )}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                note.visibility === Visibility.PRIVATE ? 'badge-visibility-private' :
                note.visibility === Visibility.TEAM ? 'badge-visibility-team' :
                note.visibility === Visibility.HACKATHON ? 'badge-visibility-hackathon' : 'badge-visibility-public'
              }`}>
                {note.visibility}
              </span>
            </div>
          </div>

          {/* Content snippet */}
          <p className="text-xs text-[var(--ink)] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto font-body">
            {note.content}
          </p>
        </div>

        {/* Footer / Comments Toggle */}
        <div className="flex flex-col px-5 py-3 border-t border-[color-mix(in_srgb,var(--line)_60%,transparent)] gap-2 bg-[color-mix(in_srgb,var(--surface)_30%,transparent)]">
          <div className="w-full flex justify-between items-center">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors font-medium"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>
                {note.commentCount || comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
              </span>
            </button>
          </div>

          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full flex flex-col gap-2 pt-2 border-t border-[color-mix(in_srgb,var(--line)_60%,transparent)]"
              >
                <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="font-accent italic text-xs text-[var(--muted)] py-1">No comments recorded yet.</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="text-xs bg-[var(--surface)] p-2 rounded border border-[var(--line)]">
                        <div className="flex justify-between items-center text-[10px] text-[var(--muted)] mb-0.5">
                          <span className="font-semibold text-[var(--ink)]">{comment.author?.fullName || 'Participant'}</span>
                          <span className="font-mono">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-[var(--ink)]">{comment.content}</div>
                      </div>
                    ))
                  )}
                </div>

                {profile && (
                  <form onSubmit={handleAddComment} className="flex gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="Annotate remark..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors shadow-2xs"
                    />
                    <button
                      type="submit"
                      disabled={isAdding || !commentText.trim()}
                      className="commons-btn-primary py-1 px-3 text-xs"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
