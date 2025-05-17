import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TabunganService } from '../services/tabungan.service';
import { useAuth } from '../context/auth-context';
import { TabunganWithJenis } from '../lib/database.types';
import { Logger } from '../lib/logger';

// Custom hook to use tabungan data with caching
export function useTabungan() {
  const { member, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // Query hook for tabungan data
  const query = useQuery({
    queryKey: ['tabungan', member?.id],
    queryFn: () => TabunganService.getTabunganByAnggota(member?.id || ''),
    enabled: !!isAuthenticated && !!member?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Manually refetch tabungan data
  const refetch = async () => {
    if (isAuthenticated && member?.id) {
      return query.refetch();
    }
  };
  
  // Invalidate tabungan cache
  const invalidateTabungan = () => {
    if (member?.id) {
      queryClient.invalidateQueries({ queryKey: ['tabungan', member.id] });
    }
  };
  
  return {
    tabunganList: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidateTabungan,
  };
}
