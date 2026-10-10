import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesService } from '@/services/notes';
import type { Note, CreateNoteInput, NoteComment } from '@/types/schemas/note';
import type { NoteId, UserId } from '@/types/ids';

const NOTES_QUERY_KEY = ['notes', 'list'];

export function useNotes(filters?: { hackathonId?: string; teamId?: string }) {
  const queryClient = useQueryClient();

  const {
    data: notes = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Note[]>({
    queryKey: [...NOTES_QUERY_KEY, filters],
    queryFn: () => notesService.listNotes(filters),
  });

  const createNoteMutation = useMutation({
    mutationFn: ({ input, authorId }: { input: CreateNoteInput; authorId: UserId }) =>
      notesService.createNote(input, authorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });

  return {
    notes,
    isLoading,
    isError,
    error,
    refetch,
    createNote: createNoteMutation.mutateAsync,
    isCreating: createNoteMutation.isPending,
  };
}

export function useNoteComments(noteId: NoteId) {
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery<NoteComment[]>({
    queryKey: ['notes', 'comments', noteId],
    queryFn: () => notesService.listComments(noteId),
    enabled: Boolean(noteId),
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ authorId, content }: { authorId: UserId; content: string }) =>
      notesService.addComment(noteId, authorId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', 'comments', noteId] });
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });

  return {
    comments,
    isLoading,
    addComment: addCommentMutation.mutateAsync,
    isAdding: addCommentMutation.isPending,
  };
}
