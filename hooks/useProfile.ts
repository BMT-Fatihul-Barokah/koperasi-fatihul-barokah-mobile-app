import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { Logger } from '../lib/logger';

// Define profile interface
export interface ProfileData {
  id: string;
  nama: string;
  email: string;
  nomor_telepon: string;
  alamat: string;
  tanggal_lahir: string;
  nomor_ktp: string;
  foto_url?: string;
  created_at: string;
  updated_at: string;
}

// Fetch profile data from Supabase
const fetchProfileData = async (userId: string): Promise<ProfileData | null> => {
  Logger.info('Profile', 'Fetching profile data', { userId });
  
  const { data, error } = await supabase
    .from('anggota')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    Logger.error('Profile', 'Error fetching profile data', error);
    throw error;
  }
  
  Logger.debug('Profile', 'Profile data fetched successfully');
  return data;
};

// Custom hook to use profile data with caching
export function useProfile() {
  const { member, account, isAuthenticated } = useAuth();
  
  // Query hook for profile data
  const query = useQuery({
    queryKey: ['profile', member?.id],
    queryFn: () => fetchProfileData(member?.id || ''),
    enabled: !!isAuthenticated && !!member?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Manually refetch profile data
  const refetchProfile = async () => {
    if (isAuthenticated && member?.id) {
      return query.refetch();
    }
  };
  
  return {
    profileData: query.data,
    member,
    account,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetchProfile,
  };
}
