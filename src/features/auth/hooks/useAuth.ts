import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import type { SignInCredentials, SignUpCredentials, Profile } from '@/types/schemas/auth';
import { useEffect } from 'react';

const AUTH_QUERY_KEY = ['auth', 'current-user'];

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, isError, error } = useQuery<Profile | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => authService.getCurrentProfile(),
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((updatedProfile) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, updatedProfile);
    });
    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  const signInMutation = useMutation({
    mutationFn: (creds: SignInCredentials) => authService.signIn(creds),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data);
    },
  });

  const signUpMutation = useMutation({
    mutationFn: (creds: SignUpCredentials) => authService.signUp(creds),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data);
    },
  });

  const signOutMutation = useMutation({
    mutationFn: () => authService.signOut(),
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.clear();
    },
  });

  return {
    profile,
    isAuthenticated: Boolean(profile),
    isLoading,
    isError,
    error,
    signIn: signInMutation.mutateAsync,
    signUp: signUpMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
  };
}
