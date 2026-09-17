/*
==========================================================
SMANSASOO Academic Portal
Pengumuman - Data Loader
Version : 1.0.0
==========================================================
*/

window.PengumumanData = (() => {

    async function load() {

        const response = await fetch("/api/announcements", { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`Gagal memuat pengumuman (HTTP ${response.status}).`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || "Gagal memuat pengumuman.");
        }

        return result.data || [];

    }

    return { load };

})();
