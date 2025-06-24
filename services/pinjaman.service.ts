import { supabase } from "../lib/supabase";

export interface Pembiayaan {
	id: string;
	anggota_id: string;
	jenis_pembiayaan: string;
	status: string;
	jumlah: number;
	jatuh_tempo: string;
	total_pembayaran: number;
	sisa_pembayaran: number;
	created_at: string;
	updated_at: string;
	deskripsi?: string;
	durasi_bulan?: number;
}

// For backward compatibility
export type Pinjaman = Pembiayaan;

export const PEMBIAYAAN_STATUS = {
	diajukan: { label: "Diajukan", color: "#FFC107" },
	disetujui: { label: "Disetujui", color: "#2196F3" },
	ditolak: { label: "Ditolak", color: "#F44336" },
	aktif: { label: "Aktif", color: "#4CAF50" },
	lunas: { label: "Lunas", color: "#9E9E9E" },
};

// For backward compatibility
export const PINJAMAN_STATUS = PEMBIAYAAN_STATUS;

export const PembiayaanService = {
	/**
	 * Get all financing for a member
	 */
	async getPembiayaanByAnggota(anggotaId: string): Promise<Pembiayaan[]> {
		try {
			console.log(
				`Fetching pembiayaan for anggota ID: ${anggotaId}`
			);

			const { data, error } = await supabase
				.from("pembiayaan")
				.select(
					`
				*,
				jenis_pembiayaan!inner(nama)
			`
				)
				.eq("anggota_id", anggotaId)
				.order("created_at", { ascending: false });

			if (error) {
				console.error(
					`Error fetching pembiayaan: ${error.message}`
				);
				throw error;
			}

			// Transform the results to include jenis_pembiayaan as a string
			const pembiayaanList =
				data?.map((item) => ({
					...item,
					jenis_pembiayaan:
						item.jenis_pembiayaan?.nama ||
						"Pembiayaan Umum",
				})) || [];

			console.log(
				`Successfully fetched ${pembiayaanList.length} pembiayaan records`
			);
			return pembiayaanList as Pembiayaan[];
		} catch (error) {
			console.error("Error in getPembiayaanByAnggota:", error);
			throw error;
		}
	},

	/**
	 * Get a specific financing by ID
	 */
	async getPembiayaanById(
		pembiayaanId: string
	): Promise<Pembiayaan | null> {
		try {
			console.log(`Fetching pembiayaan with ID: ${pembiayaanId}`);

			// Validate that pembiayaanId is a valid UUID
			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			if (!uuidRegex.test(pembiayaanId)) {
				console.error(
					`Invalid pembiayaan ID format: ${pembiayaanId}. Expected a UUID.`
				);
				return null;
			}

			const { data, error } = await supabase
				.from("pembiayaan")
				.select(
					`
          *,
          jenis_pembiayaan!inner(nama)
        `
				)
				.eq("id", pembiayaanId)
				.single();

			if (error) {
				console.error(
					`Error fetching pembiayaan with ID ${pembiayaanId}:`,
					error
				);
				return null;
			}

			// Transform the result to include jenis_pembiayaan as a string
			const pembiayaan = {
				...data,
				jenis_pembiayaan:
					data.jenis_pembiayaan?.nama || "Pembiayaan Umum",
			};

			console.log("Successfully fetched pembiayaan details");
			return pembiayaan as Pembiayaan;
		} catch (error) {
			console.error("Error in getPembiayaanById:", error);
			return null;
		}
	},

	/**
	 * Get financing history for a member
	 */
	async getPembiayaanHistory(anggotaId: string): Promise<Pembiayaan[]> {
		try {
			console.log(
				`Fetching pembiayaan history for anggota ID: ${anggotaId}`
			);

			const { data, error } = await supabase
				.from("pembiayaan")
				.select(
					`
				*,
				jenis_pembiayaan!inner(nama)
			`
				)
				.eq("anggota_id", anggotaId)
				.in("status", ["lunas", "ditolak"])
				.order("updated_at", { ascending: false });

			if (error) {
				console.error(
					`Error fetching pembiayaan history: ${error.message}`
				);
				throw error;
			}

			// Transform the results to include jenis_pembiayaan as a string
			const pembiayaanHistory =
				data?.map((item) => ({
					...item,
					jenis_pembiayaan:
						item.jenis_pembiayaan?.nama ||
						"Pembiayaan Umum",
				})) || [];

			console.log(
				`Successfully fetched ${pembiayaanHistory.length} pembiayaan history records`
			);
			return pembiayaanHistory as Pembiayaan[];
		} catch (error) {
			console.error("Error in getPembiayaanHistory:", error);
			throw error;
		}
	},

	/**
	 * Calculate progress percentage for a financing
	 */
	calculateProgress(pembiayaan: Pembiayaan): number {
		if (pembiayaan.status === "lunas") return 100;
		if (pembiayaan.jumlah === 0) return 0;

		// total_pembayaran = amount paid so far
		// jumlah = original loan amount
		// Progress = (amount paid / original loan amount) * 100
		const progressPercentage = Math.round(
			(pembiayaan.total_pembayaran / pembiayaan.jumlah) * 100
		);

		// Ensure progress doesn't exceed 100%
		return Math.min(progressPercentage, 100);
	},

	/**
	 * Get formatted status label
	 */
	getStatusLabel(status: string): string {
		return PEMBIAYAAN_STATUS[status]?.label || status;
	},

	/**
	 * Get status color
	 */
	getStatusColor(status: string): string {
		return PEMBIAYAAN_STATUS[status]?.color || "#999999";
	},
};

// For backward compatibility
export const PinjamanService = {
	getPinjamanByAnggota: PembiayaanService.getPembiayaanByAnggota,
	getPinjamanById: PembiayaanService.getPembiayaanById,
	getPinjamanHistory: PembiayaanService.getPembiayaanHistory,
	calculateProgress: PembiayaanService.calculateProgress,
	getStatusLabel: PembiayaanService.getStatusLabel,
	getStatusColor: PembiayaanService.getStatusColor,
};
