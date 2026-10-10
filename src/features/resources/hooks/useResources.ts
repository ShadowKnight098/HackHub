import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resourcesService } from '@/services/resources';
import type { Resource, CreateResourceInput } from '@/types/schemas/resource';
import type { UserId } from '@/types/ids';
import { Visibility } from '@/types/enums';

const RESOURCES_QUERY_KEY = ['resources', 'list'];

export function useResources(filters?: { hackathonId?: string; teamId?: string; visibility?: Visibility }) {
  const queryClient = useQueryClient();

  const {
    data: resources = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Resource[]>({
    queryKey: [...RESOURCES_QUERY_KEY, filters],
    queryFn: () => resourcesService.listResources(filters),
  });

  const uploadMutation = useMutation({
    mutationFn: ({
      input,
      uploaderId,
      file,
    }: {
      input: CreateResourceInput;
      uploaderId: UserId;
      file?: File;
    }) => resourcesService.createResource(input, uploaderId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESOURCES_QUERY_KEY });
    },
  });

  return {
    resources,
    isLoading,
    isError,
    error,
    refetch,
    createResource: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
  };
}
