import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	useWindowDimensions,
	Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { storage } from "../../lib/storage";
import { BackHeader } from "../../components/header/back-header";
import { useAuth } from "../../context/auth-context";
import { AuthService } from "../../services/auth.service";

interface PinKeypadProps {
	onKeyPress: (key: string) => void;
}

const PinKeypad = ({ onKeyPress }: PinKeypadProps) => {
	const { width } = useWindowDimensions();
	const keys = [
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"9",
		"",
		"0",
		"del",
	];

	// Calculate responsive button size based on screen width
	const buttonSize = Math.min(width * 0.22, 70); // Slightly smaller buttons (22% of width)
	const buttonMargin = 10; // Fixed margin to match design

	return (
		<View style={styles.keypadContainer}>
			{keys.map((key, index) => (
				<TouchableOpacity
					key={index}
					style={[
						styles.keyButton,
						key === "" && styles.emptyButton,
						{
							width: buttonSize,
							height: buttonSize,
							margin: buttonMargin,
						},
					]}
					onPress={() => key && onKeyPress(key)}
					disabled={key === ""}
				>
					{key === "del" ? (
						<Text style={styles.deleteButtonText}>
							⌫
						</Text>
					) : (
						<Text style={styles.keyButtonText}>
							{key}
						</Text>
					)}
				</TouchableOpacity>
			))}
		</View>
	);
};

export default function VerificationCodeScreen() {
	const params = useLocalSearchParams<{
		phoneNumber: string;
		method: string;
	}>();
	const { login } = useAuth();

	const [phoneNumber, setPhoneNumber] = useState(params.phoneNumber || "");
	const method = params.method || "sms";

	const [pin, setPin] = useState("");
	const [timeLeft, setTimeLeft] = useState(60);
	const [canResend, setCanResend] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [accountId, setAccountId] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string>("");

	// Load phone number and account ID from storage
	useEffect(() => {
		const loadData = async () => {
			try {
				const storedPhoneNumber = await storage.getItem(
					"temp_phone_number"
				);
				const storedAccountId = await storage.getItem(
					"temp_account_id"
				);

				if (storedPhoneNumber) {
					setPhoneNumber(storedPhoneNumber);
				}

				if (storedAccountId) {
					setAccountId(storedAccountId);
					console.log(
						"Loaded account ID:",
						storedAccountId
					);
				} else {
					console.error("No account ID found in storage");
					Alert.alert(
						"Error",
						"Tidak dapat menemukan data akun. Silakan coba lagi."
					);
					router.replace("/onboarding/phone-verification");
				}
			} catch (error) {
				console.error(
					"Error loading data from storage:",
					error
				);
				Alert.alert(
					"Error",
					"Terjadi kesalahan saat memuat data. Silakan coba lagi."
				);
			}
		};

		loadData();
	}, []);

	// Timer for resend code
	useEffect(() => {
		const timer = setInterval(() => {
			setTimeLeft((prevTime) => {
				if (prevTime <= 1) {
					clearInterval(timer);
					setCanResend(true);
					return 0;
				}
				return prevTime - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	// Clear error message after 5 seconds
	useEffect(() => {
		if (errorMessage) {
			const timer = setTimeout(() => {
				setErrorMessage("");
			}, 5000);

			return () => clearTimeout(timer);
		}
	}, [errorMessage]);

	const handleKeyPress = (key: string) => {
		if (key === "del") {
			// Delete the last digit
			if (pin.length > 0) {
				setPin(pin.slice(0, -1));
			}
		} else {
			// Add digit if we have less than 6 digits
			if (pin.length < 6) {
				const newPin = pin + key;
				setPin(newPin);

				// Auto-verify when PIN is complete
				if (newPin.length === 6) {
					setTimeout(() => {
						handleVerify(newPin);
					}, 300);
				}
			}
		}
	};

	const handleResendCode = () => {
		if (!canResend) return;

		// Reset timer
		setTimeLeft(60);
		setCanResend(false);

		// In a real app, we would resend the verification code here
		// For now, just show an alert
		Alert.alert(
			"Lupa PIN?",
			"Jika Anda lupa PIN, silakan hubungi customer service kami untuk mereset PIN Anda.",
			[
				{ text: "OK" },
				{
					text: "Hubungi CS",
					onPress: () => {
						// In a real app, this would open the phone app or WhatsApp
						Alert.alert(
							"Info",
							"Fitur ini akan tersedia segera."
						);
					},
				},
			]
		);
	};

	const handleVerify = async (inputPin: string = pin) => {
		if (inputPin.length !== 6) {
			setErrorMessage("Mohon masukkan kode 6 digit lengkap");
			return;
		}

		if (!accountId) {
			setErrorMessage(
				"Tidak dapat menemukan data akun. Silakan coba lagi."
			);
			return;
		}

		setIsVerifying(true);

		try {
			console.log(`Verifying PIN for account ID: ${accountId}`);

			// Get phone number from storage
			const storedPhoneNumber = await storage.getItem(
				"temp_phone_number"
			);

			if (!storedPhoneNumber) {
				console.log("No phone number found in storage");
				setErrorMessage(
					"Tidak dapat menemukan nomor telepon. Silakan coba lagi."
				);
				setIsVerifying(false);
				return;
			}

			// Login with phone and PIN using the auth service
			const {
				success,
				accountId: verifiedAccountId,
				message,
			} = await AuthService.loginWithPhone(
				storedPhoneNumber,
				inputPin
			);

			if (!success) {
				console.log("Login failed:", message);
				setErrorMessage(message);
				setPin(""); // Reset PIN input when incorrect
				setIsVerifying(false);
				return;
			}

			// Login the user with the auth context
			const loginSuccess = await login(
				verifiedAccountId || accountId
			);

			if (!loginSuccess) {
				console.log("Login failed after PIN verification");
				setErrorMessage(
					"Gagal masuk ke akun. Silakan coba lagi."
				);
				setIsVerifying(false);
				return;
			}

			// Clear the entire navigation stack and navigate to dashboard
			console.log("Login successful, navigating to dashboard");

			// Clear any temporary storage
			await storage.removeItem("temp_phone_number");
			await storage.removeItem("temp_account_id");

			// Use router.replace with reset to clear the entire stack
			router.dismissAll();
			router.replace("/");
		} catch (error) {
			console.error("Error verifying PIN:", error);
			setErrorMessage("Terjadi kesalahan. Silakan coba lagi.");
		} finally {
			setIsVerifying(false);
		}
	};

	const { height } = useWindowDimensions();

	return (
		<SafeAreaProvider>
			<SafeAreaView style={styles.container} edges={["bottom"]}>
				<BackHeader title="Masukkan PIN" />

				<View style={styles.content}>
					<View style={styles.headerSection}>
						<Text style={styles.title}>
							Masukkan PIN
						</Text>
						<Text style={styles.subtitle}>
							Masukkan 6 digit PIN kamu
						</Text>

						<Text
							style={[
								styles.errorText,
								!errorMessage &&
									styles.errorTextHidden,
							]}
						>
							{errorMessage ||
								"PIN yang Anda masukkan salah. Silakan coba lagi."}
						</Text>

						<View style={styles.pinContainer}>
							{Array(6)
								.fill(0)
								.map((_, index) => (
									<View
										key={index}
										style={[
											styles.pinDot,
											index <
												pin.length &&
												styles.pinDotFilled,
										]}
									/>
								))}
						</View>
					</View>

					<View style={styles.keypadSection}>
						<PinKeypad onKeyPress={handleKeyPress} />
					</View>

					<View style={styles.footerSection}>
						<View style={styles.optionsContainer}>
							<TouchableOpacity
								onPress={() => router.back()}
							>
								<Text
									style={
										styles.optionButton
									}
								>
									Gunakan Akun Lain
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={handleResendCode}
							>
								<Text
									style={
										styles.optionButton
									}
								>
									Lupa PIN?
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	content: {
		flex: 1,
		paddingHorizontal: 24,
		justifyContent: "space-between", // Distribute space between sections
	},
	headerSection: {
		alignItems: "center",
		paddingTop: 20,
	},
	keypadSection: {
		alignItems: "center",
		justifyContent: "center",
		flex: 1, // Take available space
	},
	footerSection: {
		width: "100%",
		paddingBottom: Platform.OS === "ios" ? 10 : 20, // Add padding at the bottom
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 10,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		color: "#666",
		marginBottom: 20,
		textAlign: "center",
	},
	errorText: {
		fontSize: 14,
		color: "#FF3B30",
		marginBottom: 20,
		textAlign: "center",
		height: 20,
		opacity: 1,
	},
	errorTextHidden: {
		opacity: 0,
	},
	pinContainer: {
		flexDirection: "row",
		justifyContent: "center",
		marginBottom: 20,
	},
	pinDot: {
		width: 16,
		height: 16,
		borderRadius: 8,
		backgroundColor: "#f0f0f0",
		margin: 10,
	},
	pinDotFilled: {
		backgroundColor: "#4CD2C8",
	},
	keypadContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		maxWidth: 340,
		paddingHorizontal: 10,
		marginTop: 20,
	},
	keyButton: {
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 50,
		backgroundColor: "#f8f8f8",
		marginVertical: 12, // Add vertical spacing between buttons
		marginHorizontal: 12, // Add horizontal spacing between buttons
		// Width and height are now set dynamically
	},
	emptyButton: {
		backgroundColor: "transparent",
	},
	keyButtonText: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#333",
	},
	deleteButtonText: {
		fontSize: 28,
		color: "#666",
	},
	optionsContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		width: "100%",
		paddingHorizontal: 20,
		paddingVertical: 15,
	},
	optionButton: {
		fontSize: 14,
		color: "#007BFF",
		fontWeight: "bold",
	},
});
