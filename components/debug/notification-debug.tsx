import React, { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Alert,
	TextInput,
} from "react-native";
import { NotificationService } from "../../services/notification.service";
import { useAuth } from "../../context/auth-context";
import { Logger, LogCategory } from "../../lib/logger";

/**
 * Debug component for testing notification read status functionality
 * This should only be used in development mode
 */
export function NotificationDebug() {
	const { member } = useAuth();
	const [notificationId, setNotificationId] = useState("");
	const [testResults, setTestResults] = useState<string[]>([]);

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

			<View style={styles.resultsContainer}>
				<Text style={styles.resultsTitle}>Test Results:</Text>
				{testResults.map((result, index) => (
					<Text key={index} style={styles.resultText}>
						{result}
					</Text>
				))}
			</View>
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
});
