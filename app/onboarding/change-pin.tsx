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
	useColorScheme,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DatabaseService } from "../../lib/database.service";
import { useAuth } from "../../context/auth-context";
import { BackHeader } from "../../components/header/back-header";
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
	const buttonSize = Math.min(width * 0.22, 70);
	const buttonMargin = 10;

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

type Step = "verify-old" | "create-new" | "confirm-new";

export default function ChangePinScreen() {
	const [step, setStep] = useState<Step>("verify-old");
	const [oldPin, setOldPin] = useState<string>("");
	const [newPin, setNewPin] = useState<string>("");
	const [confirmPin, setConfirmPin] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>("");
	const { account } = useAuth();
	const accountId = account?.id;
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";

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
		if (isLoading) return;

		let currentPin = "";
		let setCurrentPin: React.Dispatch<React.SetStateAction<string>>;

		// Determine which PIN we're working with based on step
		switch (step) {
			case "verify-old":
				currentPin = oldPin;
				setCurrentPin = setOldPin;
				break;
			case "create-new":
				currentPin = newPin;
				setCurrentPin = setNewPin;
				break;
			case "confirm-new":
				currentPin = confirmPin;
				setCurrentPin = setConfirmPin;
				break;
		}

		if (key === "del") {
			if (currentPin.length > 0) {
				setCurrentPin(currentPin.slice(0, -1));
			}
		} else {
			if (currentPin.length < 6) {
				const updatedPin = currentPin + key;
				setCurrentPin(updatedPin);

				// Auto-proceed when PIN is complete
				if (updatedPin.length === 6) {
					setTimeout(() => {
						handlePinComplete(updatedPin);
					}, 300);
				}
			}
		}
	};

	const handlePinComplete = async (pin: string) => {
		switch (step) {
			case "verify-old":
				await verifyOldPin(pin);
				break;
			case "create-new":
				setStep("confirm-new");
				break;
			case "confirm-new":
				await confirmNewPin(pin);
				break;
		}
	};

	const verifyOldPin = async (pin: string) => {
		if (!accountId) {
			setErrorMessage(
				"Tidak dapat menemukan data akun. Silakan coba lagi."
			);
			return;
		}

		setIsLoading(true);

		try {
			// Use existing AuthService verifyPin method
			const isValid = await AuthService.verifyPin(accountId, pin);

			if (isValid) {
				setStep("create-new");
				setErrorMessage("");
			} else {
				setErrorMessage(
					"PIN lama tidak sesuai. Silakan coba lagi."
				);
				setOldPin("");
			}
		} catch (error) {
			console.error("Error verifying old PIN:", error);
			setErrorMessage("Terjadi kesalahan saat memverifikasi PIN.");
			setOldPin("");
		} finally {
			setIsLoading(false);
		}
	};

	const confirmNewPin = async (pin: string) => {
		if (newPin !== pin) {
			setErrorMessage(
				"PIN konfirmasi tidak sesuai. Silakan coba lagi."
			);
			setConfirmPin("");
			setStep("create-new");
			setNewPin("");
			return;
		}

		if (oldPin === newPin) {
			setErrorMessage("PIN baru harus berbeda dari PIN lama.");
			setConfirmPin("");
			setStep("create-new");
			setNewPin("");
			return;
		}

		if (!accountId) {
			setErrorMessage(
				"Tidak dapat menemukan data akun. Silakan coba lagi."
			);
			return;
		}

		setIsLoading(true);

		try {
			const result = await DatabaseService.updateAccountPin(
				accountId,
				oldPin,
				newPin
			);

			if (result.success) {
				Alert.alert(
					"Berhasil",
					"PIN Anda berhasil diperbarui.",
					[
						{
							text: "OK",
							onPress: () => router.back(),
						},
					]
				);
			} else {
				setErrorMessage(result.message);
				// Reset to verify old PIN step
				setStep("verify-old");
				setOldPin("");
				setNewPin("");
				setConfirmPin("");
			}
		} catch (error) {
			console.error("Error updating PIN:", error);
			setErrorMessage("Terjadi kesalahan saat memperbarui PIN.");
			// Reset to verify old PIN step
			setStep("verify-old");
			setOldPin("");
			setNewPin("");
			setConfirmPin("");
		} finally {
			setIsLoading(false);
		}
	};

	const getCurrentPin = () => {
		switch (step) {
			case "verify-old":
				return oldPin;
			case "create-new":
				return newPin;
			case "confirm-new":
				return confirmPin;
			default:
				return "";
		}
	};

	const getTitle = () => {
		switch (step) {
			case "verify-old":
				return "Masukkan PIN Lama";
			case "create-new":
				return "Buat PIN Baru";
			case "confirm-new":
				return "Konfirmasi PIN Baru";
			default:
				return "";
		}
	};

	const getSubtitle = () => {
		switch (step) {
			case "verify-old":
				return "Masukkan PIN lama Anda untuk melanjutkan";
			case "create-new":
				return "Masukkan 6 digit PIN baru Anda";
			case "confirm-new":
				return "Masukkan kembali PIN baru untuk konfirmasi";
			default:
				return "";
		}
	};

	return (
		<SafeAreaProvider>
			<SafeAreaView
				style={[
					styles.container,
					{
						backgroundColor: isDark
							? "#121212"
							: "#FFFFFF",
					},
				]}
				edges={["bottom"]}
			>
				<StatusBar style={isDark ? "light" : "dark"} />
				<BackHeader title="Ubah PIN" />

				<View style={styles.content}>
					{isLoading ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator
								size="large"
								color="#007BFF"
							/>
							<Text
								style={[
									styles.loadingText,
									{
										color: isDark
											? "#FFFFFF"
											: "#666666",
									},
								]}
							>
								{step === "verify-old"
									? "Memverifikasi PIN..."
									: "Memperbarui PIN..."}
							</Text>
						</View>
					) : (
						<>
							<View style={styles.headerSection}>
								<Text
									style={[
										styles.title,
										{
											color: isDark
												? "#FFFFFF"
												: "#333333",
										},
									]}
								>
									{getTitle()}
								</Text>
								<Text
									style={[
										styles.subtitle,
										{
											color: isDark
												? "#AAAAAA"
												: "#666666",
										},
									]}
								>
									{getSubtitle()}
								</Text>

								{errorMessage ? (
									<Text
										style={
											styles.errorText
										}
									>
										{errorMessage}
									</Text>
								) : null}

								<View
									style={
										styles.pinContainer
									}
								>
									{Array(6)
										.fill(0)
										.map((_, index) => {
											const currentPin =
												getCurrentPin();
											const isFilled =
												index <
												currentPin.length;

											return (
												<View
													key={
														index
													}
													style={[
														styles.pinDot,
														isFilled &&
															styles.pinDotFilled,
														{
															borderColor:
																isDark
																	? "#444444"
																	: "#CCCCCC",
														},
													]}
												/>
											);
										})}
								</View>
							</View>

							<View style={styles.keypadSection}>
								<PinKeypad
									onKeyPress={
										handleKeyPress
									}
								/>
							</View>

							<View style={styles.footerSection}>
								<View
									style={
										styles.infoContainer
									}
								>
									<Text
										style={[
											styles.infoText,
											{
												color: isDark
													? "#AAAAAA"
													: "#666666",
											},
										]}
									>
										{step ===
											"verify-old" &&
											"Pastikan Anda memasukkan PIN yang benar untuk keamanan akun Anda."}
										{step ===
											"create-new" &&
											"PIN baru harus terdiri dari 6 digit angka dan berbeda dari PIN lama."}
										{step ===
											"confirm-new" &&
											"Pastikan PIN yang dimasukkan sama dengan PIN baru yang telah dibuat."}
									</Text>
								</View>
							</View>
						</>
					)}
				</View>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		marginTop: 20,
		fontSize: 16,
	},
	content: {
		flex: 1,
		paddingHorizontal: 24,
		justifyContent: "space-between",
	},
	headerSection: {
		alignItems: "center",
		paddingTop: 40,
	},
	keypadSection: {
		alignItems: "center",
		justifyContent: "center",
		flex: 1,
	},
	footerSection: {
		width: "100%",
		paddingBottom: Platform.OS === "ios" ? 10 : 20,
		alignItems: "center",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 10,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		marginBottom: 10,
		textAlign: "center",
	},
	errorText: {
		fontSize: 14,
		color: "#FF3B30",
		marginBottom: 20,
		textAlign: "center",
		minHeight: 20,
	},
	pinContainer: {
		flexDirection: "row",
		justifyContent: "center",
		marginBottom: 40,
	},
	pinDot: {
		width: 16,
		height: 16,
		borderRadius: 8,
		borderWidth: 1,
		backgroundColor: "transparent",
		margin: 10,
	},
	pinDotFilled: {
		backgroundColor: "#007BFF",
		borderColor: "#007BFF",
	},
	keypadContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		maxWidth: 340,
		paddingHorizontal: 10,
	},
	keyButton: {
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 50,
		backgroundColor: "#f8f8f8",
		marginVertical: 12,
		marginHorizontal: 12,
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
	infoContainer: {
		paddingHorizontal: 20,
	},
	infoText: {
		fontSize: 14,
		textAlign: "center",
		lineHeight: 20,
	},
});
