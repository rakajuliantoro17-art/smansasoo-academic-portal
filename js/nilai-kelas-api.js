/*
==========================================================
SMANSASOO Academic Portal
Nilai Kelas API Service
Version : 1.0.0
==========================================================
Client untuk tab "Rata-Rata Kelas" di pages/nilai.html.
Sama seperti js/nilai-api.js, tidak pernah memanggil Apps
Script: hanya memanggil /api/kelas-list dan /api/kelas-summary,
dua Vercel Serverless Function di repo yang sama.
==========================================================
*/

async function fetchKelasJSON(url) {

    const controller = new AbortController();

    const timeout = setTimeout(
        () => controller.abort(),
        CONFIG.API_TIMEOUT
    );

    try {

        const response = await fetch(url, {
            cache: "no-store",
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();

    } finally {

        clearTimeout(timeout);

    }

}

/**
 * ==========================================
 * GET CLASS LIST
 * ==========================================
 */

async function getClassList() {

    const result = await fetchKelasJSON("/api/kelas-list");

    return result.success ? result.data : [];

}

/**
 * ==========================================
 * GET CLASS SUMMARY
 * ==========================================
 */

async function getClassSummary(kelas, mapel) {

    const params = new URLSearchParams({
        kelas: kelas || "SEMUA",
        mapel: mapel || "WAJIB"
    });

    const result = await fetchKelasJSON(`/api/kelas-summary?${params.toString()}`);

    if (!result.message) {

        result.message = result.success
            ? CONFIG.MESSAGE.SUCCESS
            : CONFIG.MESSAGE.SERVER_ERROR;

    }

    return result;

}

/**
 * ==========================================
 * EXPORT
 * ==========================================
 */

window.NilaiKelasAPI = {

    getClassList,

    getClassSummary

};
