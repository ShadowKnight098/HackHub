import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsService } from '@/services/teams';
import type { Team, CreateTeamInput } from '@/types/schemas/team';
import type { TeamId, UserId } from '@/types/ids';

const TEAMS_QUERY_KEY = ['teams', 'list'];

export function useTeams(hackathonId?: string) {
  const queryClient = useQueryClient();

  const {
    data: teams = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Team[]>({
    queryKey: [...TEAMS_QUERY_KEY, hackathonId],
    queryFn: () => teamsService.listTeams(hackathonId),
  });

  const createTeamMutation = useMutation({
    mutationFn: ({ input, userId }: { input: CreateTeamInput; userId: UserId }) =>
      teamsService.createTeam(input, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
    },
  });

  const joinTeamMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: TeamId; userId: UserId }) =>
      teamsService.joinTeam(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
    },
  });

  const leaveTeamMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: TeamId; userId: UserId }) =>
      teamsService.leaveTeam(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
    },
  });

  const addTeamMemberMutation = useMutation({
    mutationFn: (input: {
      teamId: TeamId;
      fullName: string;
      email: string;
      password?: string;
      role: 'lead' | 'member';
    }) => teamsService.addTeamMember(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['teams', 'detail', variables.teamId] });
    },
  });

  return {
    teams,
    isLoading,
    isError,
    error,
    refetch,
    createTeam: createTeamMutation.mutateAsync,
    isCreating: createTeamMutation.isPending,
    joinTeam: joinTeamMutation.mutateAsync,
    isJoining: joinTeamMutation.isPending,
    leaveTeam: leaveTeamMutation.mutateAsync,
    isLeaving: leaveTeamMutation.isPending,
    addTeamMember: addTeamMemberMutation.mutateAsync,
    isAddingMember: addTeamMemberMutation.isPending,
  };
}

export function useTeamDetail(teamId: TeamId) {
  return useQuery<Team>({
    queryKey: ['teams', 'detail', teamId],
    queryFn: () => teamsService.getTeamById(teamId),
    enabled: Boolean(teamId),
  });
}
