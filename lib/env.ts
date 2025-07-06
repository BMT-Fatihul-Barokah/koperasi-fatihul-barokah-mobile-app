import Constants from "expo-constants";

/**
 * Environment variables utility
 * Safely access environment variables with fallbacks
 */

interface Env {
	NEXT_PUBLIC_SUPABASE_URL: string;
	NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
	SUPABASE_SERVICE_ROLE_KEY: string;
	WEBSITE_URL: string;
	SUPPORT_EMAIL: string;
}

// Get environment variables from Expo Constants
// These are loaded from app.config.js/app.json which can reference process.env
const expoConstants = Constants.expoConfig?.extra;

// Create environment object with fallbacks
export const env: Env = {
	// Use environment variables from Expo Constants
	NEXT_PUBLIC_SUPABASE_URL:
		process.env.EXPO_PUBLIC_SUPABASE_URL ||
		expoConstants?.SUPABASE_URL ||
		"",

	NEXT_PUBLIC_SUPABASE_ANON_KEY:
		process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
		expoConstants?.SUPABASE_ANON_KEY ||
		"",

	SUPABASE_SERVICE_ROLE_KEY:
		process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
		expoConstants?.SUPABASE_SERVICE_ROLE_KEY ||
		"",

	// Website and contact information
	WEBSITE_URL:
		process.env.EXPO_PUBLIC_WEBSITE_URL ||
		expoConstants?.WEBSITE_URL ||
		"https://koperasifatihulbarokah.id",

	SUPPORT_EMAIL:
		process.env.EXPO_PUBLIC_SUPPORT_EMAIL ||
		expoConstants?.SUPPORT_EMAIL ||
		"support@koperasifatihulbarokah.id",
};

// Validate environment variables
if (!env.NEXT_PUBLIC_SUPABASE_URL) {
	console.error("Missing Supabase URL environment variable");
}

if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
	console.error("Missing Supabase Anon Key environment variable");
}

// Log environment variables for debugging (only show partial key for security)
console.log("Supabase URL:", env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Website URL:", env.WEBSITE_URL);
console.log("Support Email:", env.SUPPORT_EMAIL);
if (env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
	console.log(
		"Supabase Anon Key:",
		env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + "..."
	);
}
if (env.SUPABASE_SERVICE_ROLE_KEY) {
	console.log(
		"Supabase Service Key:",
		env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + "..."
	);
}
