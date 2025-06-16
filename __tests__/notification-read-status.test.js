import { NotificationService } from '../services/notification.service';

// Mock the cache clearing to verify it's called
jest.mock('../services/notification.service', () => {
  const originalModule = jest.requireActual('../services/notification.service');
  return {
    ...originalModule,
    NotificationService: {
      ...originalModule.NotificationService,
      clearCache: jest.fn(),
    },
  };
});

// Mock Supabase
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn(() => ({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      rpc: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation(callback => {
        callback({ data: [], error: null });
        return { catch: jest.fn() };
      }),
    })),
  };
});

describe('NotificationService Read Status Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('markAsRead should clear cache after successful update', async () => {
    // Setup mocks for a successful transaction notification update
    const mockSupabaseResponse = {
      data: [{ id: '123', transaksi_id: '456' }],
      error: null,
    };
    
    const mockUpdateResponse = {
      error: null,
    };
    
    // Mock the Supabase client methods
    const mockFrom = jest.fn().mockReturnThis();
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockReturnThis();
    const mockUpdate = jest.fn().mockReturnThis();
    
    // Mock the actual responses
    mockFrom.mockImplementation(() => ({
      select: mockSelect,
      update: mockUpdate,
    }));
    
    mockSelect.mockImplementation(() => ({
      eq: mockEq,
      limit: mockLimit,
    }));
    
    mockEq.mockImplementation(() => ({
      limit: mockLimit,
    }));
    
    mockLimit.mockResolvedValue(mockSupabaseResponse);
    mockUpdate.mockImplementation(() => ({
      eq: mockEq,
    }));
    
    mockEq.mockResolvedValue(mockUpdateResponse);
    
    // Test the markAsRead function
    const result = await NotificationService.markAsRead('123', 'transaction', 'user-123');
    
    // Verify the expected behavior
    expect(result).toBe(true);
    expect(NotificationService.clearCache).toHaveBeenCalled();
  });
  
  test('Global notification read status should be created if it does not exist', async () => {
    // Setup mocks for global notification check and insert
    const mockGlobalCheckResponse = {
      data: [], // No existing read status
      error: null,
    };
    
    const mockGlobalInsertResponse = {
      data: [{ id: 'new-read-status-id' }],
      error: null,
    };
    
    // Mock the Supabase client methods
    const mockFrom = jest.fn().mockReturnThis();
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockInsert = jest.fn().mockReturnThis();
    
    // Mock the actual responses
    mockFrom.mockImplementation(() => ({
      select: mockSelect,
      insert: mockInsert,
    }));
    
    mockSelect.mockImplementation(() => ({
      eq: mockEq,
    }));
    
    mockEq.mockResolvedValue(mockGlobalCheckResponse);
    mockInsert.mockResolvedValue(mockGlobalInsertResponse);
    
    // Test the markAsReadDirectly function with global notification
    const result = await NotificationService.markAsReadDirectly('global-notif-id', 'global', 'user-123');
    
    // Verify the expected behavior
    expect(result).toBe(true);
    expect(NotificationService.clearCache).toHaveBeenCalled();
  });
  
  test('Should handle notification not found in either table', async () => {
    // Setup mocks for failed checks in both tables
    const mockTransactionCheckResponse = {
      data: [], // No transaction notification found
      error: null,
    };
    
    const mockGlobalCheckResponse = {
      data: [], // No global notification found
      error: null,
    };
    
    // Mock the Supabase client methods
    const mockFrom = jest.fn().mockReturnThis();
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    
    // Mock the actual responses
    mockFrom.mockImplementation(() => ({
      select: mockSelect,
    }));
    
    mockSelect.mockImplementation(() => ({
      eq: mockEq,
    }));
    
    mockEq.mockResolvedValue(mockTransactionCheckResponse);
    mockEq.mockResolvedValueOnce(mockGlobalCheckResponse);
    
    // Test the markAsReadDirectly function with non-existent notification
    const result = await NotificationService.markAsReadDirectly('non-existent-id');
    
    // Verify the expected behavior
    expect(result).toBe(false);
  });
});
