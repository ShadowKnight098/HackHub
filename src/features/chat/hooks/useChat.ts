import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat';
import type { Message, Conversation, SendMessageInput } from '@/types/schemas/chat';
import type { ConversationId, UserId } from '@/types/ids';

export function useConversations(hackathonId?: string) {
  return useQuery<Conversation[]>({
    queryKey: ['chat', 'conversations', hackathonId],
    queryFn: () => chatService.listConversations(hackathonId),
  });
}

export function useMessages(conversationId: ConversationId) {
  const queryClient = useQueryClient();
  const queryKey = ['chat', 'messages', conversationId];

  const {
    data: messages = [],
    isLoading,
    isError,
    error,
  } = useQuery<Message[]>({
    queryKey,
    queryFn: () => chatService.listMessages(conversationId),
    enabled: Boolean(conversationId),
  });

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = chatService.subscribeToMessages(conversationId, (newMsg) => {
      queryClient.setQueryData<Message[]>(queryKey, (old = []) => {
        if (old.some((m) => m.id === newMsg.id)) return old;
        return [...old, newMsg];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId, queryClient, queryKey]);

  const sendMutation = useMutation({
    mutationFn: ({ input, senderId }: { input: SendMessageInput; senderId: UserId }) =>
      chatService.sendMessage(input, senderId),
    onSuccess: (newMsg) => {
      queryClient.setQueryData<Message[]>(queryKey, (old = []) => [...old, newMsg]);
    },
  });

  return {
    messages,
    isLoading,
    isError,
    error,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
  };
}
