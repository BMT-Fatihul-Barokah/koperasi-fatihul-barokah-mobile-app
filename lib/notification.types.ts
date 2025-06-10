/**
 * Base notification interface with common properties
 */
export interface BaseNotification {
  id: string;
  judul: string;
  pesan: string;
  jenis: string;
  data?: any;
  created_at: string;
  updated_at?: string;
}

/**
 * Global notification from the global_notifikasi table
 */
export interface GlobalNotification extends BaseNotification {
  // No additional fields, just the base fields
}

/**
 * Global notification read status from global_notifikasi_read table
 */
export interface GlobalNotificationRead {
  id: string;
  global_notifikasi_id: string;
  anggota_id: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * Transaction notification from transaksi_notifikasi table
 */
export interface TransactionNotification extends BaseNotification {
  is_read: boolean;
  transaksi_id?: string;
}

/**
 * Combined notification interface for app usage
 */
export interface Notification extends BaseNotification {
  anggota_id?: string;
  anggota_ids?: string[]; // For batch notification creation to multiple members
  is_read: boolean;
  source: 'global' | 'transaction';
  transaksi_id?: string;
  global_notifikasi_id?: string;
}

/**
 * Data types for different notification types
 */
export interface TransactionNotificationData {
  transaksi_id?: string;
  transaction_id?: string; // Added for backwards compatibility
  jenis?: string;
  jumlah?: number;
  tanggal?: string;
}

export interface DueDateNotificationData {
  pembiayaan_id?: string;
  jumlah?: number;
  tanggal_jatuh_tempo?: string;
}

export interface SystemNotificationData {
  action_url?: string;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Information about notification types for UI
 */
export interface NotificationTypeInfo {
  name: string;
  icon: string;
  color: string;
  isPushEnabled: boolean;
  isGlobal: boolean;
}

export const NOTIFICATION_TYPES: Record<string, NotificationTypeInfo> = {
  transaksi: {
    name: 'Transaksi',
    icon: 'cash-outline',
    color: '#28a745',
    isPushEnabled: true,
    isGlobal: false
  },
  pengumuman: {
    name: 'Pengumuman',
    icon: 'megaphone-outline',
    color: '#0066CC',
    isPushEnabled: false,
    isGlobal: true
  },
  sistem: {
    name: 'Sistem',
    icon: 'settings-outline',
    color: '#6c757d',
    isPushEnabled: false,
    isGlobal: true
  },
  jatuh_tempo: {
    name: 'Jatuh Tempo',
    icon: 'calendar-outline',
    color: '#dc3545',
    isPushEnabled: true,
    isGlobal: false
  },
  // Default fallback for any unrecognized types
  info: {
    name: 'Info',
    icon: 'information-circle-outline',
    color: '#17a2b8',
    isPushEnabled: false,
    isGlobal: false
  }
};

/**
 * Type guard functions for notification data types
 */
export function isTransactionNotificationData(data: any): data is TransactionNotificationData {
  return data && 
    (typeof data.transaksi_id === 'string' || 
     typeof data.jenis === 'string' ||
     typeof data.jumlah === 'number');
}

export function isDueDateNotificationData(data: any): data is DueDateNotificationData {
  return data && 
    (typeof data.pembiayaan_id === 'string' || 
     typeof data.tanggal_jatuh_tempo === 'string');
}

export function isSystemNotificationData(data: any): data is SystemNotificationData {
  return data && 
    (typeof data.action_url === 'string' || 
     (typeof data.priority === 'string' && 
      ['low', 'medium', 'high'].includes(data.priority)));
}

/**
 * Helper function to parse notification data with type safety
 */
export function parseNotificationData<T>(data: string | object | null | undefined): T | undefined {
  if (!data) return undefined;
  
  try {
    if (typeof data === 'string') {
      return JSON.parse(data) as T;
    } else {
      return data as T;
    }
  } catch (error) {
    console.error('Error parsing notification data:', error);
    return undefined;
  }
}
