/**
 * Test file for notification read status functionality
 */

// Mock Supabase
const mockSupabase = {
	from: jest.fn(() => ({
		select: jest.fn(() => ({
			eq: jest.fn(() => ({
				single: jest.fn(() =>
					Promise.resolve({
						data: { id: "test-id", is_read: false },
						error: null,
					})
				),
				limit: jest.fn(() =>
					Promise.resolve({
						data: [{ id: "test-id", is_read: false }],
						error: null,
					})
				),
			})),
		})),
		update: jest.fn(() => ({
			eq: jest.fn(() => Promise.resolve({ error: null })),
		})),
		insert: jest.fn(() => Promise.resolve({ error: null })),
	})),
};

// Mock the supabase import
jest.mock("../lib/supabase", () => ({
	supabase: mockSupabase,
}));

// Mock logger
jest.mock("../lib/logger", () => ({
	Logger: {
		info: jest.fn(),
		debug: jest.fn(),
		error: jest.fn(),
		warn: jest.fn(),
	},
}));

const { NotificationService } = require("../services/notification.service");

describe("NotificationService - markAsRead functionality", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		NotificationService.clearCache();
	});

	describe("markAsRead for transaction notifications", () => {
		it("should successfully mark a transaction notification as read", async () => {
			// Mock transaction notification exists
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn(() => ({
					eq: jest.fn(() => ({
						single: jest.fn(() =>
							Promise.resolve({
								data: {
									id: "test-notif-id",
									transaksi_id:
										"test-trans-id",
									is_read: false,
								},
								error: null,
							})
						),
					})),
				})),
			});

			// Mock successful update
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn(() => ({
					eq: jest.fn(() =>
						Promise.resolve({ error: null })
					),
				})),
			});

			const result = await NotificationService.markAsRead(
				"test-notif-id",
				"transaction",
				"test-member-id"
			);

			expect(result).toBe(true);
			expect(mockSupabase.from).toHaveBeenCalledWith(
				"transaksi_notifikasi"
			);
		});

		it("should fail gracefully when transaction notification does not exist", async () => {
			// Mock notification not found
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn(() => ({
					eq: jest.fn(() => ({
						single: jest.fn(() =>
							Promise.resolve({
								data: null,
								error: { code: "PGRST116" },
							})
						),
					})),
				})),
			});

			const result = await NotificationService.markAsRead(
				"non-existent-id",
				"transaction",
				"test-member-id"
			);

			expect(result).toBe(false);
		});
	});

	describe("markAsRead for global notifications", () => {
		it("should successfully mark a global notification as read by updating existing record", async () => {
			// Mock global notification exists
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn(() => ({
					eq: jest.fn(() => ({
						single: jest.fn(() =>
							Promise.resolve({
								data: { id: "test-global-id" },
								error: null,
							})
						),
					})),
				})),
			});

			// Mock read status exists
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn(() => ({
					eq: jest.fn(() => ({
						single: jest.fn(() =>
							Promise.resolve({
								data: {
									id: "read-status-id",
									is_read: false,
								},
								error: null,
							})
						),
					})),
				})),
			});

			// Mock successful update
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn(() => ({
					eq: jest.fn(() =>
						Promise.resolve({ error: null })
					),
				})),
			});

			const result = await NotificationService.markAsRead(
				"test-global-id",
				"global",
				"test-member-id"
			);

			expect(result).toBe(true);
		});

		it("should successfully mark a global notification as read by creating new record", async () => {
			// Mock global notification exists
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn(() => ({
					eq: jest.fn(() => ({
						single: jest.fn(() =>
							Promise.resolve({
								data: { id: "test-global-id" },
								error: null,
							})
						),
					})),
				})),
			});

			// Mock read status does not exist
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn(() => ({
					eq: jest.fn(() => ({
						single: jest.fn(() =>
							Promise.resolve({
								data: null,
								error: { code: "PGRST116" },
							})
						),
					})),
				})),
			});

			// Mock successful insert
			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn(() => Promise.resolve({ error: null })),
			});

			const result = await NotificationService.markAsRead(
				"test-global-id",
				"global",
				"test-member-id"
			);

			expect(result).toBe(true);
		});
	});

	describe("markAsRead auto-detection", () => {
		it("should auto-detect transaction notification when source is not specified", async () => {
			// Mock transaction notification exists
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn(() => ({
					eq: jest.fn(() => ({
						single: jest.fn(() =>
							Promise.resolve({
								data: {
									id: "test-notif-id",
									transaksi_id:
										"test-trans-id",
									is_read: false,
								},
								error: null,
							})
						),
					})),
				})),
			});

			// Mock successful update
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn(() => ({
					eq: jest.fn(() =>
						Promise.resolve({ error: null })
					),
				})),
			});

			const result = await NotificationService.markAsRead(
				"test-notif-id",
				undefined,
				"test-member-id"
			);

			expect(result).toBe(true);
		});

		it("should fall back to global when transaction notification not found", async () => {
			// Mock transaction notification not found
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn(() => ({
					eq: jest.fn(() => ({
						single: jest.fn(() =>
							Promise.resolve({
								data: null,
								error: { code: "PGRST116" },
							})
						),
					})),
				})),
			});

			// Mock global notification exists
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn(() => ({
					eq: jest.fn(() => ({
						single: jest.fn(() =>
							Promise.resolve({
								data: { id: "test-global-id" },
								error: null,
							})
						),
					})),
				})),
			});

			// Mock read status exists
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn(() => ({
					eq: jest.fn(() => ({
						single: jest.fn(() =>
							Promise.resolve({
								data: {
									id: "read-status-id",
									is_read: false,
								},
								error: null,
							})
						),
					})),
				})),
			});

			// Mock successful update
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn(() => ({
					eq: jest.fn(() =>
						Promise.resolve({ error: null })
					),
				})),
			});

			const result = await NotificationService.markAsRead(
				"test-global-id",
				undefined,
				"test-member-id"
			);

			expect(result).toBe(true);
		});
	});

	describe("error handling", () => {
		it("should return false when anggotaId is not provided", async () => {
			const result = await NotificationService.markAsRead(
				"test-id",
				"transaction",
				""
			);
			expect(result).toBe(false);
		});

		it("should handle database errors gracefully", async () => {
			// Mock database error
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn(() => ({
					eq: jest.fn(() => ({
						single: jest.fn(() =>
							Promise.resolve({
								data: null,
								error: {
									message: "Database connection error",
								},
							})
						),
					})),
				})),
			});

			const result = await NotificationService.markAsRead(
				"test-id",
				"transaction",
				"test-member-id"
			);
			expect(result).toBe(false);
		});
	});
});
