import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";
import {
	SafeAreaProvider,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function RegistrationCompleteScreen() {
	const handleGoToDashboard = () => {
		// Clear the entire navigation stack and navigate to dashboard
		router.dismissAll();
		router.replace("/");
	};

	return (
		<SafeAreaProvider style={styles.container}>
			<View style={styles.content}>
				<View style={styles.successIconContainer}>
					<Text style={styles.successIcon}>✓</Text>
				</View>

				<Text style={styles.title}>Pendaftaran Selesai!</Text>
				<Text style={styles.subtitle}>
					Akun Anda telah berhasil dibuat. Anda sekarang
					dapat mengakses informasi dan layanan keuangan
					Anda.
				</Text>

				<View style={styles.infoContainer}>
					<Text style={styles.infoTitle}>
						Informasi Penting
					</Text>
					<Text style={styles.infoText}>
						• Data akun Anda diperbarui setiap hari
						pukul 15.00
					</Text>
					<Text style={styles.infoText}>
						• Transaksi setelah pukul 15.00 akan
						tercermin pada hari berikutnya
					</Text>
					<Text style={styles.infoText}>
						• Jaga keamanan PIN Anda dan jangan bagikan
						dengan siapapun
					</Text>
				</View>
			</View>

			<TouchableOpacity
				style={styles.dashboardButton}
				onPress={handleGoToDashboard}
			>
				<Text style={styles.dashboardButtonText}>
					Ke Dashboard
				</Text>
			</TouchableOpacity>
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		padding: 20,
	},
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	successIconContainer: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: "#4CAF50",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 30,
	},
	successIcon: {
		fontSize: 60,
		color: "#fff",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 15,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		color: "#666",
		marginBottom: 30,
		textAlign: "center",
		lineHeight: 24,
	},
	infoContainer: {
		backgroundColor: "#f8f8f8",
		borderRadius: 8,
		padding: 20,
		width: "100%",
	},
	infoTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 15,
	},
	infoText: {
		fontSize: 14,
		color: "#333",
		marginBottom: 10,
		lineHeight: 20,
	},
	dashboardButton: {
		backgroundColor: "#007BFF",
		paddingVertical: 15,
		borderRadius: 8,
		alignItems: "center",
		marginTop: "auto",
	},
	dashboardButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
});
