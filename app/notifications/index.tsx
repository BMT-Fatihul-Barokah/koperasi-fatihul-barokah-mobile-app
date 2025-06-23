import React, {
	useEffect,
	useCallback,
	useState,
	useMemo,
	useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
	Alert,
	useColorScheme,
	ScrollView,
	Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/auth-context";
import { useData } from "../../context/data-context";
// Import Notification type from our custom types file
import { Notification } from "../../lib/notification.types";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StandardHeader } from "../../components/header/standard-header";
import { NotificationService } from "../../services/notification.service";
import {
	NOTIFICATION_TYPES,
	TransactionNotificationData,
	parseNotificationData,
	isTransactionNotificationData,
} from "../../lib/notification.types";
import { BottomNavBar } from "../../components/navigation/BottomNavBar";
import { supabase } from "../../lib/supabase";
import { Logger, LogCategory } from "../../lib/logger";

// Filter type for notifications
type FilterType =
	| "all"
	| "unread"
	| "transaksi"
	| "pengumuman"
	| "sistem"
	| "jatuh_tempo";

export default function NotificationsScreen() {
	const { member } = useAuth();
	const {
		notifications,
		fetchNotifications,
		markNotificationAsRead,
		markAllNotificationsAsRead,
	} = useData();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [isProcessingNotification, setIsProcessingNotification] =
		useState(false);
	const [activeFilter, setActiveFilter] = useState<FilterType>("all");

	// Store filter preference when it changes
	const storeFilterPreference = async (filter: FilterType) => {
		try {
			await AsyncStorage.setItem(
				"notification_filter_preference",
				filter
			);
		} catch (error) {
			Logger.error(
				LogCategory.NOTIFICATIONS,
				"Error storing filter preference",
				error
			);
		}
	};

	// Set active filter and store preference
	const setAndStoreActiveFilter = (filter: FilterType) => {
		setActiveFilter(filter);
		storeFilterPreference(filter);
	};
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";

	// Using memo to avoid recreating styles on every render
	const styles = useMemo(() => createStyles(isDark), [isDark]);

	// Load notifications and restore filter preference when component mounts
	useEffect(() => {
		if (member?.id) {
			Logger.info(
				LogCategory.NOTIFICATIONS,
				"Fetching notifications on mount",
				{ memberId: member.id }
			);
			fetchNotifications(true); // Force refresh on mount

			// Direct check for notifications in Supabase
			checkNotificationsDirectly(member.id);

			// Restore filter preference
			const restoreFilterPreference = async () => {
				try {
					const storedFilter = await AsyncStorage.getItem(
						"notification_filter_preference"
					);
					if (
						storedFilter &&
						[
							"all",
							"unread",
							"transaksi",
							"pengumuman",
							"sistem",
							"jatuh_tempo",
						].includes(storedFilter)
					) {
						setActiveFilter(storedFilter as FilterType);
						Logger.debug(
							LogCategory.NOTIFICATIONS,
							"Restored filter preference",
							{ filter: storedFilter }
						);
					}
				} catch (error) {
					Logger.error(
						LogCategory.NOTIFICATIONS,
						"Error restoring filter preference",
						error
					);
				}
			};

			restoreFilterPreference();
		}
	}, [member?.id]); // Removed fetchNotifications from dependencies

	// Refresh notification list when screen comes into focus
	useFocusEffect(
		useCallback(() => {
			if (member?.id) {
				Logger.info(
					LogCategory.NOTIFICATIONS,
					"Screen focused, refreshing notifications"
				);

				// Force refresh notifications when the screen comes into focus
				// This ensures we have the latest read status for notifications
				const refreshData = async () => {
					try {
						// Force clear notification cache to ensure we get fresh data
						NotificationService.clearCache();

						// Use context method with force refresh flag
						await fetchNotifications(true);

						Logger.debug(
							LogCategory.NOTIFICATIONS,
							"Successfully refreshed notifications on focus"
						);
					} catch (error) {
						Logger.error(
							LogCategory.NOTIFICATIONS,
							"Error refreshing notifications on focus",
							error
						);
					}

					// Restore filter preference when returning to the screen
					try {
						const storedFilter =
							await AsyncStorage.getItem(
								"notification_filter_preference"
							);
						if (
							storedFilter &&
							[
								"all",
								"unread",
								"transaksi",
								"pengumuman",
								"sistem",
								"jatuh_tempo",
							].includes(storedFilter)
						) {
							setActiveFilter(
								storedFilter as FilterType
							);
							Logger.debug(
								LogCategory.NOTIFICATIONS,
								"Restored filter preference on focus",
								{ filter: storedFilter }
							);
						}
					} catch (error) {
						Logger.error(
							LogCategory.NOTIFICATIONS,
							"Error restoring filter preference on focus",
							error
						);
					}
				};

				refreshData();
			}

			// No cleanup needed for useFocusEffect
			return () => {};
		}, [member?.id, fetchNotifications, activeFilter])
	);

	// Handle transaction notification press
	const handleTransactionPress = useCallback((notification) => {
		// Check if this is a transaction notification
		if (
			notification.jenis === "transaksi" ||
			notification.source === "transaction"
		) {
			// Extract transaction ID from notification data using type-safe parsing
			let transactionId = null;

			if (notification.data) {
				// Parse the data with type safety
				const transactionData =
					parseNotificationData<TransactionNotificationData>(
						notification.data
					);

				if (transactionData) {
					// Try to get transaction ID from data
					if (transactionData.transaksi_id) {
						transactionId =
							transactionData.transaksi_id;
					} else if (transactionData.transaction_id) {
						transactionId =
							transactionData.transaction_id;
					}
				}
			}

			// If we found a transaction ID, navigate to transaction detail
			if (transactionId) {
				Logger.debug(
					LogCategory.NOTIFICATIONS,
					"Navigating to transaction detail",
					{ transactionId }
				);
				router.push(`/transactions/${transactionId}`);
				return true;
			}
		}

		return false;
	}, []);

	// Direct check for notifications using NotificationService
	const checkNotificationsDirectly = async (memberId: string) => {
		try {
			Logger.debug(
				LogCategory.NOTIFICATIONS,
				"Checking notifications directly using NotificationService",
				{ memberId }
			);

			// Test the global notification fetching
			if (__DEV__) {
				await NotificationService.testGlobalNotificationFetch(
					memberId
				);
			}

			// Fetch all notifications using NotificationService
			const allNotifications =
				await NotificationService.getNotifications(memberId);

			if (!allNotifications || allNotifications.length === 0) {
				Logger.info(
					LogCategory.NOTIFICATIONS,
					"No notifications found via NotificationService"
				);
				return;
			}

			// Log summary information about notifications
			Logger.info(
				LogCategory.NOTIFICATIONS,
				"Number of notifications found",
				{ count: allNotifications.length }
			);

			// Count by type and source for debugging
			const typeCount = {};
			const sourceCount = {};
			allNotifications.forEach((n) => {
				typeCount[n.jenis] = (typeCount[n.jenis] || 0) + 1;
				sourceCount[n.source] =
					(sourceCount[n.source] || 0) + 1;
			});

			Logger.debug(
				LogCategory.NOTIFICATIONS,
				"Notification breakdown",
				{
					types: typeCount,
					sources: sourceCount,
					hasSystemNotifications: typeCount["sistem"] > 0,
					hasPengumumanNotifications:
						typeCount["pengumuman"] > 0,
				}
			);

			// Check for jatuh_tempo notifications specifically
			const jatuhTempoNotifications =
				await NotificationService.getNotificationsByType(
					memberId,
					"jatuh_tempo"
				);
			Logger.info(
				LogCategory.NOTIFICATIONS,
				"Found due date notifications",
				{ count: jatuhTempoNotifications.length || 0 }
			);

			// Check for transaction notifications specifically
			const transactionNotifications =
				allNotifications.filter(
					(n) => n.jenis === "transaksi"
				) || [];
			Logger.debug(
				LogCategory.NOTIFICATIONS,
				"Transaction notifications found",
				{ count: transactionNotifications.length }
			);
		} catch (error) {
			Logger.error(
				LogCategory.NOTIFICATIONS,
				"Error in checkNotificationsDirectly",
				error
			);
		}
	};

	// Refresh notifications
	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		await fetchNotifications(true); // Force refresh
		setIsRefreshing(false);
	}, [fetchNotifications]);

	// Mark notification as read
	const handleMarkAsRead = useCallback(
		async (notificationId: string) => {
			await markNotificationAsRead(notificationId);
		},
		[markNotificationAsRead]
	);

	// Mark all notifications as read
	const handleMarkAllAsRead = useCallback(async () => {
		if (notifications.unreadCount === 0) return;

		const success = await markAllNotificationsAsRead();
		if (success) {
			Alert.alert("Success", "All notifications marked as read");
		} else {
			Alert.alert(
				"Error",
				"Failed to mark all notifications as read"
			);
		}
	}, [notifications.unreadCount, markAllNotificationsAsRead]);

	// Handle notification press
	const handleNotificationPress = useCallback(
		(notification: Notification) => {
			Logger.debug(
				LogCategory.NOTIFICATIONS,
				"Notification pressed",
				{
					id: notification.id,
					is_read: notification.is_read,
					source: notification.source || "unknown",
					type: notification.jenis,
				}
			);

			// For optimistic UI update, let's pre-fetch notifications after a short delay
			setTimeout(() => {
				if (member?.id) {
					// Clear cache before fetching to ensure we get latest data
					NotificationService.clearCache();
					fetchNotifications(true);
				}
			}, 500);

			// Navigate to notification detail
			router.push(`/notifications/${notification.id}`);
		},
		[member?.id, fetchNotifications, router]
	);

	// Format relative time
	const formatRelativeTime = useCallback((dateString: string) => {
		try {
			const date = parseISO(dateString);
			const now = new Date();

			// If less than 24 hours ago, show relative time
			if (now.getTime() - date.getTime() < 24 * 60 * 60 * 1000) {
				return formatDistanceToNow(date, {
					addSuffix: true,
					locale: idLocale,
				});
			}

			// Otherwise show formatted date
			return format(date, "dd MMM yyyy, HH:mm", {
				locale: idLocale,
			});
		} catch (error) {
			return "Invalid date";
		}
	}, []);

	// Get icon for notification type
	const getNotificationIcon = useCallback((type: string) => {
		// Default to info if the type doesn't exist in NOTIFICATION_TYPES
		const typeInfo =
			NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;

		return (
			<Ionicons
				name={
					(typeInfo?.icon ||
						"information-circle-outline") as any
				}
				size={24}
				color={typeInfo?.color || "#17a2b8"}
			/>
		);
	}, []);

	// Filter notifications based on active filter
	const filteredNotifications = useMemo(() => {
		// Apply filters to notifications data

		if (activeFilter === "all") {
			return notifications.data;
		} else if (activeFilter === "unread") {
			return notifications.data.filter((item) => !item.is_read);
		} else if (activeFilter === "transaksi") {
			// Filter by source field or transaction-related jenis
			const transactionTypes = [
				"transaksi",
				"tabungan_masuk",
				"tabungan_keluar",
				"pembiayaan_masuk",
			];
			const filtered = notifications.data.filter(
				(item) =>
					item.source === "transaction" || // Source field
					transactionTypes.includes(item.jenis) // Check against all transaction types
			);
			Logger.debug(
				LogCategory.NOTIFICATIONS,
				`Filtered ${filtered.length} transaction notifications`
			);
			return filtered;
		} else {
			const filtered = notifications.data.filter(
				(item) => item.jenis === activeFilter
			);
			Logger.debug(
				LogCategory.NOTIFICATIONS,
				`Filtered ${filtered.length} notifications for type ${activeFilter}`
			);
			return filtered;
		}
	}, [notifications.data, activeFilter]);

	// Render notification item
	const renderNotificationItem = useCallback(
		({ item }) => {
			const isRead = item.is_read === true; // Ensure boolean comparison

			return (
				<TouchableOpacity
					style={[
						styles.notificationItem,
						isRead
							? { backgroundColor: "#f9f9f9" }
							: styles.unreadNotification,
					]}
					onPress={() => handleNotificationPress(item)}
				>
					<View style={styles.notificationIconContainer}>
						{getNotificationIcon(item.jenis)}
					</View>

					<View style={styles.notificationContent}>
						<View style={styles.notificationHeader}>
							<Text
								style={styles.notificationTitle}
							>
								{item.judul}
							</Text>
							{!isRead && (
								<View
									style={styles.unreadDot}
								/>
							)}
						</View>

						<Text
							style={styles.notificationMessage}
							numberOfLines={2}
						>
							{item.pesan}
						</Text>

						<Text style={styles.notificationTime}>
							{formatRelativeTime(item.created_at)}
						</Text>

						{/* Debug read status in dev mode */}
						{__DEV__ && (
							<Text
								style={{
									fontSize: 10,
									color: "gray",
								}}
							>
								ID: {item.id.substring(0, 8)}...
								| Read: {String(isRead)} |
								Source:{" "}
								{item.source || "unknown"}
							</Text>
						)}
					</View>
				</TouchableOpacity>
			);
		},
		[handleNotificationPress, formatRelativeTime, getNotificationIcon]
	);

	// Menu state and handlers
	const [menuVisible, setMenuVisible] = useState(false);
	const toggleMenu = () => setMenuVisible(!menuVisible);

	return (
		<SafeAreaView style={styles.container} edges={["bottom"]}>
			<StandardHeader
				title="Notifikasi"
				showBackButton={false}
				rightIcon={{
					name: "ellipsis-vertical",
					onPress: toggleMenu,
				}}
			/>

			{/* Options Menu Modal */}
			<Modal
				visible={menuVisible}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setMenuVisible(false)}
			>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPress={() => setMenuVisible(false)}
				>
					<View
						style={[
							styles.menuContainer,
							isDark && styles.menuContainerDark,
						]}
					>
						{notifications.unreadCount > 0 && (
							<TouchableOpacity
								style={styles.menuItem}
								onPress={() => {
									handleMarkAllAsRead();
									setMenuVisible(false);
								}}
							>
								<Ionicons
									name="checkmark-done-outline"
									size={20}
									color={
										isDark
											? "#e0e0e0"
											: "#333333"
									}
									style={styles.menuIcon}
								/>
								<Text
									style={[
										styles.menuText,
										isDark &&
											styles.menuTextDark,
									]}
								>
									Tandai semua sudah dibaca
								</Text>
							</TouchableOpacity>
						)}

						{/* Debug option in development mode */}
						{__DEV__ && (
							<TouchableOpacity
								style={styles.menuItem}
								onPress={async () => {
									if (member?.id) {
										Logger.info(
											LogCategory.NOTIFICATIONS,
											"Manual debug test triggered"
										);
										await checkNotificationsDirectly(
											member.id
										);
										await fetchNotifications(
											true
										);
									}
									setMenuVisible(false);
								}}
							>
								<Ionicons
									name="bug-outline"
									size={20}
									color={
										isDark
											? "#e0e0e0"
											: "#ff6b6b"
									}
									style={styles.menuIcon}
								/>
								<Text
									style={[
										styles.menuText,
										isDark &&
											styles.menuTextDark,
									]}
								>
									Debug Notifications
								</Text>
							</TouchableOpacity>
						)}
					</View>
				</TouchableOpacity>
			</Modal>

			{/* Filter tabs */}
			<View style={styles.filterContainer}>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.filterContent}
				>
					<TouchableOpacity
						style={[
							styles.filterTab,
							activeFilter === "all" &&
								styles.activeFilterTab,
						]}
						onPress={() =>
							setAndStoreActiveFilter("all")
						}
					>
						<Text
							style={[
								styles.filterText,
								activeFilter === "all" &&
									styles.activeFilterText,
							]}
						>
							Semua
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.filterTab,
							activeFilter === "unread" &&
								styles.activeFilterTab,
						]}
						onPress={() =>
							setAndStoreActiveFilter("unread")
						}
					>
						<Text
							style={[
								styles.filterText,
								activeFilter === "unread" &&
									styles.activeFilterText,
							]}
						>
							Belum Dibaca{" "}
							{notifications.unreadCount > 0 &&
								`(${notifications.unreadCount})`}
						</Text>
					</TouchableOpacity>

					{/* Transaction filter - explicitly add this first */}
					<TouchableOpacity
						key="transaksi"
						style={[
							styles.filterTab,
							activeFilter === "transaksi" &&
								styles.activeFilterTab,
						]}
						onPress={() =>
							setAndStoreActiveFilter("transaksi")
						}
					>
						<Text
							style={[
								styles.filterText,
								activeFilter === "transaksi" &&
									styles.activeFilterText,
							]}
						>
							Transaksi
						</Text>
					</TouchableOpacity>

					{/* Jatuh Tempo filter - explicitly add this */}
					<TouchableOpacity
						key="jatuh_tempo"
						style={[
							styles.filterTab,
							activeFilter === "jatuh_tempo" &&
								styles.activeFilterTab,
						]}
						onPress={() =>
							setAndStoreActiveFilter("jatuh_tempo")
						}
					>
						<Text
							style={[
								styles.filterText,
								activeFilter ===
									"jatuh_tempo" &&
									styles.activeFilterText,
							]}
						>
							Jatuh Tempo
						</Text>
					</TouchableOpacity>

					{/* Other notification types */}
					{NOTIFICATION_TYPES &&
						Object.entries(NOTIFICATION_TYPES)
							.filter(
								([key]) =>
									key !== "transaksi" &&
									key !== "jatuh_tempo"
							) // Skip transaksi and jatuh_tempo since we added them explicitly
							.map(([key, value]) => (
								<TouchableOpacity
									key={key}
									style={[
										styles.filterTab,
										activeFilter ===
											key &&
											styles.activeFilterTab,
									]}
									onPress={() =>
										setAndStoreActiveFilter(
											key as FilterType
										)
									}
								>
									<Text
										style={[
											styles.filterText,
											activeFilter ===
												key &&
												styles.activeFilterText,
										]}
									>
										{value?.name || key}
									</Text>
								</TouchableOpacity>
							))}
				</ScrollView>
			</View>

			{/* Main content */}
			{notifications.isLoading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#007BFF" />
					<Text style={styles.loadingText}>
						Memuat notifikasi...
					</Text>
				</View>
			) : notifications.error ? (
				<View style={styles.errorContainer}>
					<Ionicons
						name="alert-circle-outline"
						size={48}
						color="#dc3545"
					/>
					<Text style={styles.errorText}>
						Gagal memuat notifikasi
					</Text>
					<Text style={styles.errorDetail}>
						{notifications.error.message}
					</Text>
					<TouchableOpacity
						style={styles.retryButton}
						onPress={handleRefresh}
					>
						<Text style={styles.retryText}>
							Coba Lagi
						</Text>
					</TouchableOpacity>
				</View>
			) : filteredNotifications.length === 0 ? (
				<View style={styles.emptyContainer}>
					<Ionicons
						name="notifications-off-outline"
						size={48}
						color="#6c757d"
					/>
					<Text style={styles.emptyText}>
						{activeFilter === "all"
							? "Tidak ada notifikasi"
							: activeFilter === "unread"
							? "Tidak ada notifikasi yang belum dibaca"
							: `Tidak ada notifikasi ${
									NOTIFICATION_TYPES[
										activeFilter
									]?.name || activeFilter
							  }`}
					</Text>
				</View>
			) : (
				<FlatList
					data={filteredNotifications}
					renderItem={renderNotificationItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContainer}
					refreshControl={
						<RefreshControl
							refreshing={isRefreshing}
							onRefresh={handleRefresh}
							colors={["#007BFF"]}
							tintColor={
								isDark ? "#ffffff" : "#007BFF"
							}
						/>
					}
				/>
			)}

			<BottomNavBar />
		</SafeAreaView>
	);
}

// Create styles with dynamic values based on theme
const createStyles = (isDark: boolean) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: isDark ? "#121212" : "#f8f9fa",
		},

		filterContainer: {
			backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
			paddingVertical: 8,
			borderBottomWidth: 1,
			borderBottomColor: isDark ? "#333333" : "#e0e0e0",
		},
		filterContent: {
			paddingHorizontal: 16,
			flexDirection: "row",
			gap: 8,
		},
		filterTab: {
			paddingVertical: 6,
			paddingHorizontal: 12,
			borderRadius: 16,
			backgroundColor: isDark ? "#333333" : "#f0f0f0",
			marginRight: 8,
		},
		activeFilterTab: {
			backgroundColor: "#007BFF",
		},
		filterText: {
			fontSize: 14,
			color: isDark ? "#e0e0e0" : "#333333",
		},
		activeFilterText: {
			color: "#ffffff",
			fontWeight: "600",
		},
		header: {
			backgroundColor: "#007BFF",
			paddingTop: 20,
			paddingBottom: 20,
			paddingHorizontal: 20,
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
		},
		headerTitle: {
			fontSize: 20,
			fontWeight: "bold",
			color: "#fff",
		},
		backButton: {
			width: 40,
			height: 40,
			borderRadius: 20,
			backgroundColor: "rgba(255, 255, 255, 0.2)",
			justifyContent: "center",
			alignItems: "center",
		},
		markAllButton: {
			paddingHorizontal: 12,
			paddingVertical: 6,
			borderRadius: 16,
			backgroundColor: "rgba(255, 255, 255, 0.2)",
		},
		markAllText: {
			color: "#fff",
			fontSize: 14,
			fontWeight: "500",
		},

		modalOverlay: {
			flex: 1,
			backgroundColor: "rgba(0, 0, 0, 0.3)",
			justifyContent: "flex-start",
			alignItems: "flex-end",
		},
		menuContainer: {
			marginTop: 60, // Position below header
			marginRight: 10,
			backgroundColor: "#ffffff",
			borderRadius: 8,
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.25,
			shadowRadius: 3.84,
			elevation: 5,
			minWidth: 200,
			overflow: "hidden",
		},
		menuContainerDark: {
			backgroundColor: "#333333",
		},
		menuItem: {
			flexDirection: "row",
			alignItems: "center",
			paddingVertical: 12,
			paddingHorizontal: 16,
		},
		menuIcon: {
			marginRight: 12,
		},
		menuText: {
			fontSize: 15,
			color: "#333333",
		},
		menuTextDark: {
			color: "#e0e0e0",
		},

		spacer: {
			width: 40,
		},
		loadingContainer: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
		},
		loadingText: {
			marginTop: 10,
			fontSize: 16,
			color: isDark ? "#e0e0e0" : "#666",
		},
		errorContainer: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			padding: 20,
		},
		errorText: {
			fontSize: 16,
			color: isDark ? "#f8f9fa" : "#333333",
			marginTop: 10,
			textAlign: "center",
		},
		errorDetail: {
			fontSize: 14,
			color: isDark ? "#cccccc" : "#666666",
			marginTop: 5,
			textAlign: "center",
		},
		retryButton: {
			backgroundColor: "#007BFF",
			paddingHorizontal: 16,
			paddingVertical: 8,
			borderRadius: 8,
		},
		retryText: {
			color: "#fff",
			fontSize: 14,
			fontWeight: "500",
		},
		emptyContainer: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			padding: 20,
		},
		emptyText: {
			fontSize: 16,
			color: isDark ? "#e0e0e0" : "#666",
			marginTop: 16,
		},
		listContainer: {
			flexGrow: 1,
			paddingVertical: 10,
		},
		notificationItem: {
			backgroundColor: isDark ? "#1e1e1e" : "#fff",
			marginHorizontal: 16,
			marginVertical: 6,
			borderRadius: 12,
			padding: 16,
			flexDirection: "row",
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 1 },
			shadowOpacity: isDark ? 0.2 : 0.05,
			shadowRadius: 2,
			elevation: 2,
		},
		unreadNotification: {
			backgroundColor: isDark ? "#1a2a3a" : "#E6F2FF",
			borderLeftWidth: 4,
			borderLeftColor: "#007BFF",
		},
		notificationIconContainer: {
			width: 40,
			height: 40,
			borderRadius: 20,
			backgroundColor: isDark ? "#333333" : "#f0f0f0",
			justifyContent: "center",
			alignItems: "center",
			marginRight: 12,
		},
		notificationContent: {
			flex: 1,
		},
		notificationHeader: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			marginBottom: 4,
		},
		notificationTitle: {
			fontSize: 16,
			fontWeight: "600",
			color: isDark ? "#ffffff" : "#333333",
			flex: 1,
		},
		unreadDot: {
			width: 8,
			height: 8,
			borderRadius: 4,
			backgroundColor: "#007BFF",
			marginLeft: 8,
		},
		notificationMessage: {
			fontSize: 14,
			color: isDark ? "#cccccc" : "#666666",
			marginBottom: 8,
		},
		notificationTime: {
			fontSize: 12,
			color: isDark ? "#999999" : "#999999",
		},
	});
