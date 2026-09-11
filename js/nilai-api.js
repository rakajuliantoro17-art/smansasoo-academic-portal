/*
==========================================================
SMANSASOO Academic Portal
Nilai API Service
Version : 2.0.0
==========================================================
CHANGELOG (v2.0.0):
- Tidak lagi memanggil Apps Script eksternal. Sekarang
  memanggil /api/nilai, Vercel Serverless Function di repo
  yang sama, yang membaca data langsung dari Google Sheets
  di sisi server. Browser tidak pernah tahu URL atau ID
  spreadsheet-nya.
==========================================================
*/

async function fetchNilaiJSON(url) {

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
 * SEARCH NILAI BY NIS
 * ==========================================
 */

async function searchNilai(keyword) {

    if (!keyword) {
        throw new Error("Keyword tidak boleh kosong.");
    }

    const params = new URLSearchParams({ keyword });

    // Path absolut ("/api/nilai") supaya tetap benar dipanggil
    // dari halaman mana pun, termasuk dari dalam /pages/.
    const result = await fetchNilaiJSON(`/api/nilai?${params.toString()}`);

    if (!result.message) {

        result.message = result.success
            ? CONFIG.MESSAGE.SUCCESS
            : CONFIG.MESSAGE.NOT_FOUND;

    }

    return result;

}

/**
 * ==========================================
 * EXPORT
 * ==========================================
 */

window.NilaiAPI = {

    searchNilai

};
