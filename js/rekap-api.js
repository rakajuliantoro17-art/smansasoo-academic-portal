/*
==========================================================
SMANSASOO Academic Portal
Rekap API Service
Version : 1.0.0
==========================================================
Memanggil /api/rekap, Vercel Serverless Function di repo ini
sendiri (lihat functions/api/rekap.js), yang membaca Google
Sheets langsung di sisi server. Spreadsheet-nya BEDA dengan
yang dipakai fitur Nilai (js/nilai-api.js) -- browser tidak
pernah tahu URL atau ID spreadsheet-nya.
==========================================================
*/

async function fetchRekapJSON(url) {

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

        if (!response.ok && response.status !== 400) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();

    } finally {

        clearTimeout(timeout);

    }

}

/**
 * ==========================================
 * CEK NILAI SISWA (per NIS)
 * ==========================================
 */

async function searchRekapStudent(keyword) {

    if (!keyword) {
        throw new Error("Keyword tidak boleh kosong.");
    }

    const params = new URLSearchParams({ action: "student", keyword });

    return fetchRekapJSON(`/api/rekap?${params.toString()}`);

}

/**
 * ==========================================
 * DAFTAR KELAS
 * ==========================================
 */

async function getRekapClassList() {

    const params = new URLSearchParams({ action: "classes" });

    return fetchRekapJSON(`/api/rekap?${params.toString()}`);

}

/**
 * ==========================================
 * REKAP RATA-RATA KELAS
 * ==========================================
 */

async function getRekapClassSummary(kelas, mapel) {

    const params = new URLSearchParams({
        action: "summary",
        kelas: kelas || "SEMUA",
        mapel: mapel || "WAJIB"
    });

    return fetchRekapJSON(`/api/rekap?${params.toString()}`);

}

/**
 * ==========================================
 * EXPORT
 * ==========================================
 */

window.RekapAPI = {

    searchRekapStudent,

    getRekapClassList,

    getRekapClassSummary

};
