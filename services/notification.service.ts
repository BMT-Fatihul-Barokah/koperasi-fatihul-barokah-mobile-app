import { supabase } from "../lib/supabase";
import {
	Notification,
	GlobalNotification,
	GlobalNotificationRead,
	TransactionNotification,
	parseNotificationData,
	NotificationTypeInfo,
	NOTIFICATION_TYPES,
	TransactionNotificationData,
} from "../lib/notification.types";

// Logger for better debugging
const log = (message: string, data?: any) => {
	console.log(`[NotificationService] ${message}`, data || "");
};

const logError = (message: string, error: any) => {
	console.error(`[NotificationService] ${message}`, error);
};

/**
 * Service for handling notifications
 */
// Cache for notifications to prevent excessive database queries
let notificationCache: Record<string, any> = {};

export const NotificationService = {
	/**
	 * Clear the notification cache to ensure fresh data on next fetch
	 */
	clearCache(): void {
		notificationCache = {};
		log("Notification cache cleared");
	},

	/**
	 * Create a notification
	 * @param notification The notification to create
	 * @returns Promise<{success: boolean, id?: string}> indicating success or failure and the created notification ID
	 */
	async createNotification(
		notification: Omit<Notification, "id" | "created_at" | "updated_at">
	): Promise<{ success: boolean; id?: string }> {
		try {
			log("Creating notification", notification);

			// Determine if this is a global notification or transaction notification
			const isGlobal =
				notification.source === "global" ||
				["pengumuman", "sistem"].includes(notification.jenis);

			const timestamp = new Date().toISOString();

			if (isGlobal) {
				// Create global notification
				const { data: globalData, error: globalError } =
					await supabase
						.from("global_notifikasi")
						.insert({
							judul: notification.judul,
							pesan: notification.pesan,
							jenis: notification.jenis,
							data: notification.data || {},
							created_at: timestamp,
							updated_at: timestamp,
						})
						.select("id")
						.single();

				if (globalError || !globalData) {
					logError(
						"Error creating global notification",
						globalError
					);
					return { success: false };
				}

				log(
					`Created global notification with ID: ${globalData.id}`
				);

				// If anggota_id is provided, create read status for that member
				if (notification.anggota_id) {
					// Create read status for a single member
					const { error: readError } = await supabase
						.from("global_notifikasi_read")
						.insert({
							global_notifikasi_id: globalData.id,
							anggota_id: notification.anggota_id,
							is_read:
								notification.is_read ?? false,
							created_at: timestamp,
							updated_at: timestamp,
						});

					if (readError) {
						logError(
							"Error creating notification read status",
							readError
						);
						// Continue despite error, the notification was still created
					} else {
						log(
							`Created read status for member ${notification.anggota_id}`
						);
					}
				} else if (
					notification.anggota_ids &&
					Array.isArray(notification.anggota_ids)
				) {
					// Create read status for multiple members if anggota_ids array is provided
					const readStatusEntries =
						notification.anggota_ids.map(
							(anggotaId) => ({
								global_notifikasi_id:
									globalData.id,
								anggota_id: anggotaId,
								is_read:
									notification.is_read ??
									false,
								created_at: timestamp,
								updated_at: timestamp,
							})
						);

					const { error: batchReadError } = await supabase
						.from("global_notifikasi_read")
						.insert(readStatusEntries);

					if (batchReadError) {
						logError(
							"Error creating batch notification read statuses",
							batchReadError
						);
						// Continue despite error, the notification was still created
					} else {
						log(
							`Created read status for ${readStatusEntries.length} members`
						);
					}
				}

				return { success: true, id: globalData.id };
			} else {
				// Create transaction notification
				let transaksiId = notification.transaksi_id;

				// If transaksi_id is in the data object, extract it
				if (!transaksiId && notification.data) {
					const data =
						typeof notification.data === "string"
							? parseNotificationData<TransactionNotificationData>(
									notification.data
							  )
							: (notification.data as TransactionNotificationData);

					transaksiId = data?.transaksi_id;
				}

				if (!transaksiId) {
					logError(
						"Transaction ID is required for transaction notifications",
						{ notification }
					);
					return { success: false };
				}

				const { data: transactionData, error } = await supabase
					.from("transaksi_notifikasi")
					.insert({
						judul: notification.judul,
						pesan: notification.pesan,
						jenis: notification.jenis,
						data: notification.data || {},
						is_read: notification.is_read ?? false,
						transaksi_id: transaksiId,
						created_at: timestamp,
						updated_at: timestamp,
					})
					.select("id")
					.single();

				if (error) {
					logError(
						"Error creating transaction notification",
						error
					);
					return { success: false };
				}

				log(
					`Created transaction notification with ID: ${transactionData?.id}`
				);
				return { success: true, id: transactionData?.id };
			}
		} catch (error) {
			logError("Error in createNotification", error);
			return { success: false };
		}
	},

	/**
	 * Get all notifications for a member
	 * @param anggotaId ID of the member
	 * @param limit Maximum number of notifications to fetch
	 * @param forceRefresh Force refresh the cache
	 * @returns Array of notifications
	 */
	async getNotifications(
		anggotaId: string,
		limit: number = 50,
		forceRefresh: boolean = false
	): Promise<Notification[]> {
		// Use cache if available and not forcing refresh
		const cacheKey = `notifications-${anggotaId}-${limit}`;
		if (!forceRefresh && notificationCache[cacheKey]) {
			log(`Returning cached notifications for member ${anggotaId}`);
			return notificationCache[cacheKey];
		}
		try {
			let transactionNotifications = [];

			// First attempt to use RPC function
			log(
				`Attempting to fetch transaction notifications for member ${anggotaId} using RPC`
			);
			const { data: rpcNotifications, error: tnError } =
				await supabase
					.rpc("get_member_transaction_notifications", {
						member_id: anggotaId,
					})
					.limit(limit);

			if (tnError) {
				logError(
					"Error fetching transaction notifications via RPC",
					tnError
				);

				// Fallback: Fetch member's transactions first, then get notifications for those transactions
				log(
					"Falling back to manual query for transaction notifications"
				);
				const { data: memberTransactions, error: mtError } =
					await supabase
						.from("transaksi")
						.select("id")
						.eq("anggota_id", anggotaId);

				if (mtError) {
					logError(
						"Error fetching member transactions",
						mtError
					);
				} else if (
					memberTransactions &&
					memberTransactions.length > 0
				) {
					const transactionIds = memberTransactions.map(
						(t) => t.id
					);
					log(
						`Found ${transactionIds.length} transactions for member ${anggotaId}`
					);

					// Fetch transaction notifications filtered by transaction IDs
					const {
						data: tNotifications,
						error: tNotifError,
					} = await supabase
						.from("transaksi_notifikasi")
						.select("*")
						.in("transaksi_id", transactionIds)
						.order("created_at", { ascending: false })
						.limit(limit);

					if (tNotifError) {
						logError(
							"Error fetching transaction notifications",
							tNotifError
						);
					} else {
						transactionNotifications =
							tNotifications || [];
					}
				} else {
					log(
						`No transactions found for member ${anggotaId}`
					);
				}
			} else {
				transactionNotifications = rpcNotifications || [];
			}

			log(
				`Found ${transactionNotifications.length} transaction notifications`
			);

			// Fetch global notifications
			const { data: globalNotifications, error: gnError } =
				await supabase
					.from("global_notifikasi")
					.select("*")
					.order("created_at", { ascending: false });

			if (gnError) {
				logError(
					"Error fetching global notifications",
					gnError
				);
			}

			log(
				`Found ${
					globalNotifications?.length || 0
				} global notifications`
			);

			// Get read status for global notifications
			const { data: readStatusData, error: rsError } =
				await supabase
					.from("global_notifikasi_read")
					.select("global_notifikasi_id, is_read")
					.eq("anggota_id", anggotaId);

			if (rsError) {
				logError(
					"Error fetching notification read status",
					rsError
				);
			}

			// Create read status map for quick lookup
			const readStatusMap = new Map<string, boolean>();
			if (readStatusData && readStatusData.length > 0) {
				readStatusData.forEach((item) => {
					readStatusMap.set(
						item.global_notifikasi_id,
						item.is_read
					);
				});
			}

			// Format transaction notifications
			const formattedTransactionNotifications =
				transactionNotifications.map((item) => ({
					id: item.id,
					judul: item.judul,
					pesan: item.pesan,
					jenis: item.jenis,
					data: item.data || {},
					is_read: item.is_read ?? false,
					created_at: item.created_at,
					updated_at: item.updated_at || item.created_at,
					source: "transaction" as const,
					transaksi_id: item.transaksi_id,
					anggota_id: anggotaId,
				}));

			// Format global notifications
			const formattedGlobalNotifications = (
				globalNotifications || []
			).map((item) => {
				// Log the jenis value for debugging
				log(
					`Global notification ${item.id} has jenis: ${
						item.jenis || "undefined"
					}`
				);

				return {
					id: item.id,
					judul: item.judul,
					pesan: item.pesan,
					// Keep the original jenis value without defaulting to 'pengumuman'
					jenis: item.jenis,
					data: item.data || {},
					is_read: readStatusMap.get(item.id) ?? false,
					created_at: item.created_at,
					updated_at: item.updated_at || item.created_at,
					source: "global" as const,
					global_notifikasi_id: item.id,
					anggota_id: anggotaId,
				};
			});

			// Combine, sort by date (newest first), and limit the results
			const allNotifications = [
				...formattedTransactionNotifications,
				...formattedGlobalNotifications,
			]
				.sort(
					(a, b) =>
						new Date(b.created_at).getTime() -
						new Date(a.created_at).getTime()
				)
				.slice(0, limit);

			// Store in cache
			notificationCache[cacheKey] = allNotifications;
			log(
				`Cached ${allNotifications.length} notifications for member ${anggotaId}`
			);

			log(
				`Returning ${allNotifications.length} total notifications (${formattedTransactionNotifications.length} transaction, ${formattedGlobalNotifications.length} global)`
			);
			return allNotifications;
		} catch (error) {
			logError("Error in getNotifications", error);
			return [];
		}
	},

	/**
	 * Get notifications by type
	 * @param anggotaId The ID of the member to get notifications for
	 * @param type The notification type to filter by
	 * @param limit Maximum number of notifications to return
	 * @returns Promise<Notification[]> Array of notifications of the specified type
	 */
	async getNotificationsByType(
		anggotaId: string,
		type: string,
		limit = 20
	): Promise<Notification[]> {
		try {
			const isGlobalType = ["pengumuman", "sistem"].includes(type);

			if (isGlobalType) {
				// Get global notifications of this type
				const { data, error } = await supabase
					.from("global_notifikasi")
					.select(
						`
            id,
            judul,
            pesan,
            jenis,
            data,
            created_at,
            updated_at,
            global_notifikasi_read!left(id, anggota_id, is_read)
          `
					)
					.eq("jenis", type)
					.order("created_at", { ascending: false })
					.limit(limit);

				if (error) {
					logError(
						`Error fetching ${type} notifications`,
						error
					);
					return [];
				}

				// Transform to match the Notification interface
				return (data || []).map((item) => {
					// Find read status for this member
					const readStatus =
						item.global_notifikasi_read.find(
							(r) => r.anggota_id === anggotaId
						);

					return {
						id: item.id,
						judul: item.judul,
						pesan: item.pesan,
						jenis: item.jenis,
						data: item.data || {},
						created_at: item.created_at,
						updated_at:
							item.updated_at || item.created_at,
						is_read: readStatus?.is_read ?? false,
						source: "global",
						global_notifikasi_id: item.id,
						anggota_id: anggotaId,
					};
				});
			} else {
				// Get transaction notifications of this type
				const { data, error } = await supabase
					.from("transaksi_notifikasi")
					.select("*")
					.eq("jenis", type)
					.order("created_at", { ascending: false })
					.limit(limit);

				if (error) {
					logError(
						`Error fetching ${type} notifications`,
						error
					);
					return [];
				}

				// Transform to match the Notification interface
				return (data || []).map((item) => ({
					id: item.id,
					judul: item.judul,
					pesan: item.pesan,
					jenis: item.jenis,
					data: item.data || {},
					created_at: item.created_at,
					updated_at: item.updated_at || item.created_at,
					is_read: item.is_read ?? false,
					source: "transaction",
					transaksi_id: item.transaksi_id,
					anggota_id: anggotaId,
				}));
			}
		} catch (error) {
			logError(`Error in getNotificationsByType (${type})`, error);
			return [];
		}
	},

	/**
	 * Get notification types info
	 */
	getNotificationTypeInfo(type: string): NotificationTypeInfo {
		return (
			NOTIFICATION_TYPES[type] || {
				name: "Lainnya",
				icon: "notifications-outline",
				color: "#6c757d",
				isPushEnabled: false,
				isGlobal: false,
			}
		);
	},

	/**
	 * Get unread notification count
	 * @param anggotaId The ID of the member to get unread count for
	 * @returns Promise<number> The count of unread notifications
	 */
	async getUnreadCount(anggotaId: string): Promise<number> {
		try {
			log(
				`Getting unread notification count for anggota ID: ${anggotaId}`
			);

			// Count unread transaction notifications
			const { count: transactionCount, error: transactionError } =
				await supabase
					.from("transaksi_notifikasi")
					.select("*", { count: "exact", head: true })
					.eq("is_read", false);

			if (transactionError) {
				logError(
					"Error counting unread transaction notifications",
					transactionError
				);
				return 0;
			}

			// Count unread global notifications
			const { count: globalCount, error: globalError } =
				await supabase
					.from("global_notifikasi_read")
					.select("*", { count: "exact", head: true })
					.eq("anggota_id", anggotaId)
					.eq("is_read", false);

			if (globalError) {
				logError(
					"Error counting unread global notifications",
					globalError
				);
				return transactionCount || 0;
			}

			const totalCount =
				(transactionCount || 0) + (globalCount || 0);
			log(
				`Found ${totalCount} unread notifications for anggota ID: ${anggotaId}`
			);
			return totalCount;
		} catch (error) {
			logError("Error in getUnreadCount", error);
			return 0;
		}
	},

	/**
	 * Mark a notification as read
	 * @param notificationId The ID of the notification to mark as read
	 * @param source Optional source type to specify which table to update
	 * @param anggotaId Optional member ID required for creating global notification read status
	 * @returns Promise<boolean> Whether the operation was successful
	 */
	async markAsRead(
		notificationId: string,
		source?: "global" | "transaction",
		anggotaId?: string
	): Promise<boolean> {
		try {
			log(
				`Marking notification as read: ${notificationId}, source: ${
					source || "auto-detect"
				}, anggotaId: ${anggotaId || "not provided"}`
			);

			if (!anggotaId) {
				log(
					"Cannot mark notification as read: missing anggotaId"
				);
				return false;
			}

			// First try the direct table access method
			const directSuccess = await this.markAsReadDirect(
				notificationId,
				source,
				anggotaId
			);
			if (directSuccess) {
				log(
					`Successfully marked notification ${notificationId} as read using direct method`
				);
				this.clearCache();
				return true;
			}

			// If direct method fails (likely due to RLS), try the database function fallback
			log(
				`Direct method failed, trying database function fallback for notification ${notificationId}`
			);
			const functionSuccess = await this.markAsReadUsingFunction(
				notificationId,
				source,
				anggotaId
			);
			if (functionSuccess) {
				log(
					`Successfully marked notification ${notificationId} as read using database function`
				);
				this.clearCache();
				return true;
			}

			log(
				`Failed to mark notification ${notificationId} as read with all methods`
			);
			return false;
		} catch (error) {
			logError("Error in markAsRead", error);
			return false;
		}
	},

	/**
	 * Mark notification as read using the database function (bypasses RLS)
	 * @param notificationId The ID of the notification to mark as read
	 * @param source Optional source type
	 * @param anggotaId Member ID
	 * @returns Promise<boolean> Whether the operation was successful
	 */
	async markAsReadUsingFunction(
		notificationId: string,
		source: "global" | "transaction" | undefined,
		anggotaId: string
	): Promise<boolean> {
		try {
			log(
				`Using database function to mark notification ${notificationId} as read`
			);

			const sourceParam = source || "auto";

			const { data, error } = await supabase.rpc(
				"mark_notification_as_read",
				{
					notification_id: notificationId,
					member_id: anggotaId,
					notification_source: sourceParam,
				}
			);

			if (error) {
				logError(
					"Error calling mark_notification_as_read function",
					error
				);
				return false;
			}

			if (data && data.success) {
				log(
					`Database function successfully marked notification ${notificationId} as read: ${data.message}`
				);
				return true;
			} else {
				log(
					`Database function failed to mark notification ${notificationId} as read: ${
						data?.message || "Unknown error"
					}`
				);
				return false;
			}
		} catch (error) {
			logError("Error in markAsReadUsingFunction", error);
			return false;
		}
	},

	/**
	 * Direct method to mark a notification as read (original implementation)
	 * @param notificationId The ID of the notification to mark as read
	 * @param source Optional source type to specify which table to update
	 * @param anggotaId Member ID required for creating global notification read status
	 * @returns Promise<boolean> Whether the operation was successful
	 */
	async markAsReadDirect(
		notificationId: string,
		source?: "global" | "transaction",
		anggotaId?: string
	): Promise<boolean> {
		try {
			if (!anggotaId) {
				return false;
			}

			// If source is specified, try that source directly
			if (source) {
				const success = await this.markAsReadDirectly(
					notificationId,
					source,
					anggotaId
				);
				return success;
			}

			// Auto-detect source: try transaction first (more common), then global
			const transactionSuccess = await this.markAsReadDirectly(
				notificationId,
				"transaction",
				anggotaId
			);
			if (transactionSuccess) {
				return true;
			}

			const globalSuccess = await this.markAsReadDirectly(
				notificationId,
				"global",
				anggotaId
			);
			return globalSuccess;
		} catch (error) {
			logError("Error in markAsReadDirect", error);
			return false;
		}
	},

	/**
	 * Direct method to mark a notification as read
	 * @param notificationId The ID of the notification to mark as read
	 * @param source Source type to specify which table to update
	 * @param anggotaId Member ID required for creating global notification read status
	 * @returns Promise<boolean> Whether the operation was successful
	 */
	async markAsReadDirectly(
		notificationId: string,
		source: "global" | "transaction",
		anggotaId: string
	): Promise<boolean> {
		try {
			log(
				`Attempting to mark ${source} notification ${notificationId} as read for member ${anggotaId}`
			);

			if (source === "transaction") {
				// Check if notification exists in transaction notifications table
				const { data: checkData, error: checkError } =
					await supabase
						.from("transaksi_notifikasi")
						.select("id, transaksi_id, is_read")
						.eq("id", notificationId)
						.single();

				if (checkError) {
					if (checkError.code === "PGRST116") {
						log(
							`Transaction notification ${notificationId} not found (PGRST116 - no rows)`
						);
						return false;
					}
					logError(
						"Error checking transaction notification existence",
						checkError
					);
					return false;
				}

				if (!checkData) {
					log(
						`Transaction notification ${notificationId} not found`
					);
					return false;
				}

				// Log current state
				log(
					`Found transaction notification ${notificationId}, current is_read: ${checkData.is_read}`
				);

				// Update the notification to mark as read
				const { error: updateError } = await supabase
					.from("transaksi_notifikasi")
					.update({
						is_read: true,
						updated_at: new Date().toISOString(),
					})
					.eq("id", notificationId);

				if (updateError) {
					logError(
						"Error updating transaction notification",
						updateError
					);
					return false;
				}

				log(
					`Successfully marked transaction notification ${notificationId} as read`
				);
				return true;
			}

			if (source === "global") {
				// Check if notification exists in global notifications table
				const { data: checkData, error: checkError } =
					await supabase
						.from("global_notifikasi")
						.select("id")
						.eq("id", notificationId)
						.single();

				if (checkError) {
					if (checkError.code === "PGRST116") {
						log(
							`Global notification ${notificationId} not found (PGRST116 - no rows)`
						);
						return false;
					}
					logError(
						"Error checking global notification existence",
						checkError
					);
					return false;
				}

				if (!checkData) {
					log(
						`Global notification ${notificationId} not found`
					);
					return false;
				}

				log(`Found global notification ${notificationId}`);

				// Check if read status record exists for this member
				const { data: readStatusData, error: readStatusError } =
					await supabase
						.from("global_notifikasi_read")
						.select("id, is_read")
						.eq("global_notifikasi_id", notificationId)
						.eq("anggota_id", anggotaId)
						.single();

				if (
					readStatusError &&
					readStatusError.code !== "PGRST116"
				) {
					logError(
						"Error checking global notification read status",
						readStatusError
					);
					return false;
				}

				if (readStatusData) {
					// Update existing read status record
					log(
						`Updating existing read status for global notification ${notificationId}`
					);
					const { error: updateError } = await supabase
						.from("global_notifikasi_read")
						.update({
							is_read: true,
							updated_at: new Date().toISOString(),
						})
						.eq("global_notifikasi_id", notificationId)
						.eq("anggota_id", anggotaId);

					if (updateError) {
						logError(
							"Error updating global notification read status",
							updateError
						);
						return false;
					}

					log(
						`Successfully updated read status for global notification ${notificationId}`
					);
				} else {
					// Create new read status record
					log(
						`Creating new read status record for global notification ${notificationId}`
					);
					const { error: insertError } = await supabase
						.from("global_notifikasi_read")
						.insert({
							global_notifikasi_id: notificationId,
							anggota_id: anggotaId,
							is_read: true,
							created_at: new Date().toISOString(),
							updated_at: new Date().toISOString(),
						});

					if (insertError) {
						logError(
							"Error creating global notification read status",
							insertError
						);
						return false;
					}

					log(
						`Successfully created read status for global notification ${notificationId}`
					);
				}

				return true;
			}

			logError("Invalid source specified", { source });
			return false;
		} catch (error) {
			logError("Error in markAsReadDirectly", error);
			return false;
		}
	},

	/**
	 * Mark all notifications as read for a member
	 * @param anggotaId The ID of the member to mark all notifications as read for
	 * @returns Promise<boolean> Whether the operation was successful
	 */
	async markAllAsRead(anggotaId: string): Promise<boolean> {
		try {
			log(
				`Marking all notifications as read for anggota ID: ${anggotaId}`
			);

			let success = true;

			// Mark all transaction notifications as read for this member
			// First get all transactions for this member
			const { data: transactions, error: transQueryError } =
				await supabase
					.from("transaksi")
					.select("id")
					.eq("anggota_id", anggotaId);

			if (transQueryError) {
				logError(
					"Error getting transactions for member",
					transQueryError
				);
				success = false;
			} else if (transactions && transactions.length > 0) {
				// Get the transaction IDs for this member
				const transactionIds = transactions.map((t) => t.id);
				log(
					`Found ${transactionIds.length} transactions for member ${anggotaId}`
				);

				// Mark notifications for these transactions as read
				const { error: transactionError } = await supabase
					.from("transaksi_notifikasi")
					.update({
						is_read: true,
						updated_at: new Date().toISOString(),
					})
					.eq("is_read", false)
					.in("transaksi_id", transactionIds);

				if (transactionError) {
					logError(
						"Error marking transaction notifications as read",
						transactionError
					);
					success = false;
				} else {
					log(
						`Successfully marked transaction notifications as read for member ${anggotaId}`
					);
				}
			} else {
				log(`No transactions found for member ${anggotaId}`);
			}

			// Note: Transaction notification error handling is now done inside the conditional block above

			// Mark all global notifications as read for this member
			const { error: globalError } = await supabase
				.from("global_notifikasi_read")
				.update({
					is_read: true,
					updated_at: new Date().toISOString(),
				})
				.eq("anggota_id", anggotaId)
				.eq("is_read", false);

			if (globalError) {
				logError(
					"Error marking all global notifications as read",
					globalError
				);
				success = false;
			} else {
				log(
					`Successfully marked all global notifications as read for anggota ID: ${anggotaId}`
				);
			}

			return success;
		} catch (error) {
			log(`Error in markAllAsRead: ${error.message || error}`);
			return false;
		}
	},
};
