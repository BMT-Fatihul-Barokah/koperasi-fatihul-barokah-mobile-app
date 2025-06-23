import React, { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Alert,
	TextInput,
	ScrollView,
} from "react-native";
import { NotificationService } from "../../services/notification.service";
import { useAuth } from "../../context/auth-context";
import { Logger, LogCategory } from "../../lib/logger";
import { Notification } from "../../lib/notification.types";

/**
 * Debug component for testing notification read status functionality
 * This should only be used in development mode
 */
export function NotificationDebug() {
	const { member } = useAuth();
	const [notificationId, setNotificationId] = useState("");
	const [testResults, setTestResults] = useState<string[]>([]);
	const [debugResults, setDebugResults] = useState<string>("");
	const [loading, setLoading] = useState(false);

	// Only show in development mode
	if (!__DEV__) {
		return null;
	}

	const addTestResult = (message: string) => {
		setTestResults((prev) => [
			...prev.slice(-4),
			`${new Date().toLocaleTimeString()}: ${message}`,
		]);
	};

	const testMarkAsRead = async (source?: "global" | "transaction") => {
		if (!notificationId.trim()) {
			Alert.alert("Error", "Please enter a notification ID");
			return;
		}

		if (!member?.id) {
			Alert.alert("Error", "No member ID available");
			return;
		}

		try {
			addTestResult(
				`Testing markAsRead with source: ${
					source || "auto-detect"
				}`
			);

			const success = await NotificationService.markAsRead(
				notificationId.trim(),
				source,
				member.id
			);

			if (success) {
				addTestResult(
					`✅ Successfully marked ${notificationId} as read`
				);
				Alert.alert("Success", "Notification marked as read!");
			} else {
				addTestResult(
					`❌ Failed to mark ${notificationId} as read`
				);
				Alert.alert(
					"Failed",
					"Could not mark notification as read"
				);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Unknown error";
			addTestResult(`💥 Error: ${errorMessage}`);
			Alert.alert("Error", errorMessage);
		}
	};

	const clearCache = () => {
		NotificationService.clearCache();
		addTestResult("🗑️ Cleared notification cache");
	};

	const getRecentNotifications = async () => {
		if (!member?.id) {
			Alert.alert("Error", "No member ID available");
			return;
		}

		try {
			addTestResult("📄 Fetching recent notifications...");
			const notifications =
				await NotificationService.getNotifications(
					member.id,
					5,
					true
				);

			console.log("Recent notifications:", notifications);
			addTestResult(
				`📄 Found ${notifications.length} notifications (check console)`
			);

			if (notifications.length > 0) {
				const firstNotif = notifications[0];
				setNotificationId(firstNotif.id);
				addTestResult(
					`🎯 Auto-filled with: ${firstNotif.id.substring(
						0,
						8
					)}...`
				);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Unknown error";
			addTestResult(`💥 Error fetching: ${errorMessage}`);
		}
	};

	const testJatuhTempoNotifications = async () => {
		if (!member?.id) {
			setDebugResults("No member ID available");
			return;
		}

		setLoading(true);
		try {
			console.log(
				"[NotificationDebug] Testing jatuh tempo notifications for member:",
				member.id
			);

			// Test fetching jatuh_tempo notifications specifically
			const jatuhTempoNotifications =
				await NotificationService.getNotificationsByType(
					member.id,
					"jatuh_tempo"
				);

			const result = {
				memberID: member.id,
				jatuhTempoCount: jatuhTempoNotifications.length,
				notifications: jatuhTempoNotifications.map((n) => ({
					id: n.id,
					judul: n.judul,
					jenis: n.jenis,
					is_read: n.is_read,
					created_at: n.created_at,
					source: n.source,
				})),
			};

			setDebugResults(JSON.stringify(result, null, 2));
			console.log(
				"[NotificationDebug] Jatuh tempo test results:",
				result
			);
		} catch (error) {
			console.error(
				"[NotificationDebug] Error testing jatuh tempo notifications:",
				error
			);
			setDebugResults(`Error: ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	const testAllNotifications = async () => {
		if (!member?.id) {
			setDebugResults("No member ID available");
			return;
		}

		setLoading(true);
		try {
			console.log(
				"[NotificationDebug] Testing all notifications for member:",
				member.id
			);

			// Test fetching all notifications
			const allNotifications =
				await NotificationService.getNotifications(member.id);

			const notificationsByType = allNotifications.reduce(
				(acc, notification) => {
					acc[notification.jenis] =
						(acc[notification.jenis] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>
			);

			const result = {
				memberID: member.id,
				totalCount: allNotifications.length,
				byType: notificationsByType,
				jatuhTempoNotifications: allNotifications
					.filter((n) => n.jenis === "jatuh_tempo")
					.map((n) => ({
						id: n.id,
						judul: n.judul,
						jenis: n.jenis,
						is_read: n.is_read,
						created_at: n.created_at,
						source: n.source,
					})),
			};

			setDebugResults(JSON.stringify(result, null, 2));
			console.log(
				"[NotificationDebug] All notifications test results:",
				result
			);
		} catch (error) {
			console.error(
				"[NotificationDebug] Error testing all notifications:",
				error
			);
			setDebugResults(`Error: ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>🐛 Notification Debug Tool</Text>
			<Text style={styles.subtitle}>Development Mode Only</Text>

			<View style={styles.inputContainer}>
				<Text style={styles.label}>Notification ID:</Text>
				<TextInput
					style={styles.input}
					value={notificationId}
					onChangeText={setNotificationId}
					placeholder="Enter notification ID to test"
					multiline={false}
				/>
			</View>

			<View style={styles.buttonContainer}>
				<TouchableOpacity
					style={styles.button}
					onPress={() => testMarkAsRead("transaction")}
				>
					<Text style={styles.buttonText}>
						Test Transaction
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.button}
					onPress={() => testMarkAsRead("global")}
				>
					<Text style={styles.buttonText}>Test Global</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.button}
					onPress={() => testMarkAsRead()}
				>
					<Text style={styles.buttonText}>
						Test Auto-detect
					</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.buttonContainer}>
				<TouchableOpacity
					style={[styles.button, styles.utilityButton]}
					onPress={getRecentNotifications}
				>
					<Text style={styles.buttonText}>Get Recent</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.button, styles.utilityButton]}
					onPress={clearCache}
				>
					<Text style={styles.buttonText}>Clear Cache</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.buttonContainer}>
				<TouchableOpacity
					style={[styles.button, styles.primaryButton]}
					onPress={testJatuhTempoNotifications}
					disabled={loading}
				>
					<Text style={styles.buttonText}>
						Test Jatuh Tempo Notifications
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.button, styles.secondaryButton]}
					onPress={testAllNotifications}
					disabled={loading}
				>
					<Text style={styles.buttonText}>
						Test All Notifications
					</Text>
				</TouchableOpacity>
			</View>

			{loading && <Text style={styles.loading}>Testing...</Text>}

			<View style={styles.resultsContainer}>
				<Text style={styles.resultsTitle}>Test Results:</Text>
				{testResults.map((result, index) => (
					<Text key={index} style={styles.resultText}>
						{result}
					</Text>
				))}
			</View>

			<ScrollView style={styles.resultsContainer}>
				<Text style={styles.resultsTitle}>Results:</Text>
				<Text style={styles.resultsText}>{debugResults}</Text>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#f0f0f0",
		padding: 16,
		margin: 16,
		borderRadius: 8,
		borderWidth: 2,
		borderColor: "#ff6b6b",
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#ff6b6b",
		textAlign: "center",
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 12,
		color: "#666",
		textAlign: "center",
		marginBottom: 16,
	},
	inputContainer: {
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		fontWeight: "500",
		marginBottom: 4,
		color: "#333",
	},
	input: {
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 4,
		padding: 8,
		backgroundColor: "white",
		fontSize: 12,
	},
	buttonContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 12,
	},
	button: {
		backgroundColor: "#007bff",
		padding: 8,
		borderRadius: 4,
		flex: 1,
		marginHorizontal: 2,
	},
	utilityButton: {
		backgroundColor: "#6c757d",
	},
	buttonText: {
		color: "white",
		textAlign: "center",
		fontSize: 12,
		fontWeight: "500",
	},
	primaryButton: {
		backgroundColor: "#007bff",
	},
	secondaryButton: {
		backgroundColor: "#6c757d",
	},
	loading: {
		textAlign: "center",
		fontStyle: "italic",
		marginVertical: 8,
	},
	resultsContainer: {
		marginTop: 16,
		padding: 8,
		backgroundColor: "white",
		borderRadius: 4,
		minHeight: 80,
	},
	resultsTitle: {
		fontSize: 14,
		fontWeight: "500",
		marginBottom: 8,
		color: "#333",
	},
	resultText: {
		fontSize: 11,
		color: "#666",
		marginBottom: 2,
	},
	resultsText: {
		fontFamily: "monospace",
		fontSize: 12,
		lineHeight: 16,
	},
});
