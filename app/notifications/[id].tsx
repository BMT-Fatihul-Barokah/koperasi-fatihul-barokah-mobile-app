import React, { useEffect, useState, useRef } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	ActivityIndicator,
	TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StandardHeader } from "../../components/header/standard-header";
import { useAuth } from "../../context/auth-context";
import { useData } from "../../context/data-context";
import { NotificationService } from "../../services/notification.service";
import { Logger, LogCategory } from "../../lib/logger";

export default function NotificationDetailScreen() {
	const { id } = useLocalSearchParams();
	const notificationId = id ? String(id) : "";
	const { member } = useAuth();
	const { fetchNotifications } = useData();
	const [notification, setNotification] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [markedAsRead, setMarkedAsRead] = useState(false);
	const didAttemptMarkAsRead = useRef(false);

	// Log when component mounts and handle cleanup
	useEffect(() => {
		Logger.debug(
			LogCategory.NOTIFICATIONS,
			"Notification detail screen loaded",
			{ notificationId }
		);

		// Cleanup when unmounting
		return () => {
			// Always refresh notifications when leaving the notification detail screen
			// Clean up and refresh notifications list when component unmounts
			Logger.debug(
				LogCategory.NOTIFICATIONS,
				"Notification detail screen unmounting, refreshing notifications"
			);
			NotificationService.clearCache();
			fetchNotifications(true);
		};
	}, [fetchNotifications, notificationId]);

	// Fetch notification details
	useEffect(() => {
		if (!notificationId || !member?.id) return;

		async function fetchNotificationDetails() {
			try {
				setIsLoading(true);
				setError(null);

				Logger.debug(
					LogCategory.NOTIFICATIONS,
					`Fetching notification details for ID: ${notificationId}`
				);

				const notifications =
					await NotificationService.getNotifications(
						member.id
					);
				const found = notifications.find(
					(n) => n.id === notificationId
				);

				if (found) {
					setNotification(found);
				} else {
					// Try to fetch specifically by type if not found in general notifications
					try {
						const typedNotifications =
							await NotificationService.getNotificationsByType(
								member.id,
								"jatuh_tempo"
							);
						const foundInTyped =
							typedNotifications.find(
								(n) => n.id === notificationId
							);

						if (foundInTyped) {
							setNotification(foundInTyped);
						} else {
							Logger.debug(
								LogCategory.NOTIFICATIONS,
								`Notification ${notificationId} not found in any collection`
							);
							setError("Notification not found");
						}
					} catch (typeErr) {
						Logger.error(
							LogCategory.NOTIFICATIONS,
							"Error fetching typed notifications:",
							typeErr
						);
						setError("Notification not found");
					}
				}
			} catch (err) {
				Logger.error(
					LogCategory.NOTIFICATIONS,
					"Failed to load notification:",
					err
				);
				setError("Failed to load notification");
			} finally {
				setIsLoading(false);
			}
		}

		fetchNotificationDetails();
	}, [notificationId, member?.id]);

	// Mark notification as read when component mounts
	useEffect(() => {
		if (didAttemptMarkAsRead.current || !notification || isLoading)
			return;

		const markAsRead = async () => {
			try {
				Logger.debug(
					LogCategory.NOTIFICATIONS,
					`Attempting to mark notification ${notificationId} as read`,
					{
						notificationSource: notification.source,
						notificationJenis: notification.jenis,
						hasTransaksiId: !!notification.transaksi_id,
						hasGlobalNotifikasiId:
							!!notification.global_notifikasi_id,
					}
				);
				didAttemptMarkAsRead.current = true;

				// Make sure we have anggotaId
				if (!member?.id) {
					Logger.warn(
						LogCategory.NOTIFICATIONS,
						"Cannot mark notification as read: missing member ID"
					);
					return;
				}

				// Force clear notification cache first to ensure the most up-to-date data
				NotificationService.clearCache();

				// Determine notification source more intelligently
				let detectedSource:
					| "global"
					| "transaction"
					| undefined = notification.source;

				if (!detectedSource) {
					// Auto-detect based on notification properties
					if (
						notification.transaksi_id ||
						[
							"transaksi",
							"tabungan_masuk",
							"tabungan_keluar",
							"pembiayaan_masuk",
						].includes(notification.jenis)
					) {
						detectedSource = "transaction";
						Logger.debug(
							LogCategory.NOTIFICATIONS,
							`Auto-detected transaction source for notification ${notificationId}`
						);
					} else if (
						notification.global_notifikasi_id ||
						["pengumuman", "sistem"].includes(
							notification.jenis
						)
					) {
						detectedSource = "global";
						Logger.debug(
							LogCategory.NOTIFICATIONS,
							`Auto-detected global source for notification ${notificationId}`
						);
					}
				}

				// Try marking as read with detected source first
				let success = false;
				if (detectedSource) {
					Logger.debug(
						LogCategory.NOTIFICATIONS,
						`Attempting to mark notification ${notificationId} as read with source: ${detectedSource}`
					);
					success = await NotificationService.markAsRead(
						notificationId,
						detectedSource,
						member.id
					);
				}

				// If that failed or no source was detected, try auto-detection
				if (!success) {
					Logger.debug(
						LogCategory.NOTIFICATIONS,
						`First attempt failed, trying auto-detection for notification ${notificationId}`
					);
					success = await NotificationService.markAsRead(
						notificationId,
						undefined,
						member.id
					);
				}

				if (success) {
					Logger.debug(
						LogCategory.NOTIFICATIONS,
						`Successfully marked ${notificationId} as read`
					);
					setMarkedAsRead(true);
					setNotification((prev) =>
						prev ? { ...prev, is_read: true } : prev
					);

					// Ensure notifications list is updated immediately
					fetchNotifications(true);
				} else {
					Logger.error(
						LogCategory.NOTIFICATIONS,
						`Failed to mark notification ${notificationId} as read with all methods`
					);

					// Show a warning in development mode
					if (__DEV__) {
						console.warn(
							`Failed to mark notification ${notificationId} as read. Check logs for details.`
						);
					}
				}
			} catch (error) {
				Logger.error(
					LogCategory.NOTIFICATIONS,
					"Error marking notification as read:",
					error
				);
			}
		};

		markAsRead();
	}, [
		notification,
		isLoading,
		notificationId,
		member?.id,
		fetchNotifications,
	]);

	if (isLoading) {
		return (
			<SafeAreaView style={styles.container}>
				<StandardHeader
					title="Detail Notifikasi"
					showBackButton
				/>
				<View style={styles.centerContainer}>
					<ActivityIndicator size="large" color="#007BFF" />
					<Text style={styles.loadingText}>Loading...</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (error || !notification) {
		return (
			<SafeAreaView style={styles.container}>
				<StandardHeader
					title="Detail Notifikasi"
					showBackButton
				/>
				<View style={styles.centerContainer}>
					<Ionicons
						name="alert-circle-outline"
						size={64}
						color="#dc3545"
					/>
					<Text style={styles.errorText}>
						{error || "Notification not found"}
					</Text>
					<TouchableOpacity
						style={styles.button}
						onPress={() => router.back()}
					>
						<Text style={styles.buttonText}>Back</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<StandardHeader title="Detail Notifikasi" showBackButton />
			<ScrollView style={styles.scrollView}>
				<View style={styles.card}>
					<Text style={styles.title}>
						{notification.title || notification.judul}
					</Text>
					<Text style={styles.date}>
						{new Date(
							notification.created_at
						).toLocaleDateString("id-ID")}
					</Text>
					<View style={styles.divider} />
					<Text style={styles.message}>
						{notification.message || notification.pesan}
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	centerContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	scrollView: {
		flex: 1,
	},
	card: {
		margin: 16,
		padding: 16,
		backgroundColor: "white",
		borderRadius: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 8,
	},
	date: {
		fontSize: 14,
		color: "#666",
		marginBottom: 12,
	},
	divider: {
		height: 1,
		backgroundColor: "#eee",
		marginVertical: 12,
	},
	message: {
		fontSize: 16,
		lineHeight: 24,
	},
	loadingText: {
		marginTop: 12,
		fontSize: 16,
		color: "#666",
	},
	errorText: {
		marginTop: 16,
		marginBottom: 24,
		fontSize: 16,
		color: "#dc3545",
		textAlign: "center",
	},
	button: {
		backgroundColor: "#007BFF",
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "500",
	},
});
