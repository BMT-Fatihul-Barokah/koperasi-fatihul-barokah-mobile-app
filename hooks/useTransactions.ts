import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { Logger } from '../lib/logger';

// Define transaction interface
export interface Transaction {
  id: string;
  anggota_id: string;
  tipe_transaksi: 'masuk' | 'keluar';
  kategori: string;
  deskripsi: string;
  reference_number?: string;
  jumlah: number;
  created_at: string;
  recipient_name?: string;
  bank_name?: string;
}

// Add recipient data for transfer transactions
const addRecipientData = (transactions: any[]): Transaction[] => {
  return transactions.map(tx => {
    let recipientName, bankName;
    
    if (tx.kategori === 'transfer') {
      if (tx.deskripsi?.includes('BLU')) {
        recipientName = 'NOVANDRA ANUGRAH';
        bankName = 'BLU BY BCA DIGITAL';
      } else if (tx.deskripsi?.includes('SHOPEE')) {
        recipientName = 'SHOPEE - nXXXXXXXX9';
        bankName = 'BCA Virtual Account';
      } else if (tx.deskripsi?.includes('OVO')) {
        recipientName = 'NOVANDRA ANUGRAH';
        bankName = 'OVO';
      }
    }
    
    return {
      ...tx,
      recipient_name: recipientName,
      bank_name: bankName
    };
  });
};

// Fetch transactions from Supabase
const fetchTransactions = async (memberId: string): Promise<Transaction[]> => {
  Logger.info('Transactions', 'Fetching transactions', { memberId });
  
  const { data, error } = await supabase
    .from('transaksi')
    .select('*')
    .eq('anggota_id', memberId)
    .order('created_at', { ascending: false });

  if (error) {
    Logger.error('Transactions', 'Error fetching transactions', error);
    throw error;
  }
  
  Logger.debug('Transactions', `Found ${data?.length || 0} transactions`);
  return addRecipientData(data || []);
};

// Custom hook to use transactions with caching
export function useTransactions() {
  const { member, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // Query hook for transactions
  const query = useQuery({
    queryKey: ['transactions', member?.id],
    queryFn: () => fetchTransactions(member?.id || ''),
    enabled: !!isAuthenticated && !!member?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Manually refetch transactions
  const refetch = async () => {
    if (isAuthenticated && member?.id) {
      return query.refetch();
    }
  };
  
  // Invalidate transactions cache
  const invalidateTransactions = () => {
    if (member?.id) {
      queryClient.invalidateQueries({ queryKey: ['transactions', member.id] });
    }
  };
  
  return {
    transactions: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidateTransactions,
  };
}
