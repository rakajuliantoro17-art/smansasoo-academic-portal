/*
==========================================================
SMANSASOO Academic Portal
API Service
Version : 1.1.0
==========================================================
FIX (v1.1.0):
- Tidak lagi punya API_BASE_URL/USE_SAMPLE_DATA sendiri;
  sekarang membaca dari window.CONFIG (satu sumber kebenaran).
- Query diubah dari ?nis=/?nisn= menjadi ?action=student&keyword=
  agar cocok dengan Api.gs (searchStudent membaca e.parameter.keyword).
- checkAPI() sekarang memanggil ?action=status, bukan URL kosong.
- Menambahkan timeout via AbortController (CONFIG.API_TIMEOUT).
==========================================================
*/

/**
 * ==========================================
 * FETCH JSON (dengan timeout)
 * ==========================================
 */

async function fetchJSON(url) {

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
 * SEARCH STUDENT
 * ==========================================
 */

async function searchStudent(keyword) {

    if (!keyword) {
        throw new Error("Keyword tidak boleh kosong.");
    }

    // ===============================
    // MODE SAMPLE (offline/demo)
    // ===============================

    if (CONFIG.USE_SAMPLE_DATA) {

        const json = await fetchJSON(CONFIG.SAMPLE_DATA_URL);

        const student = json.students.find(item =>

            item.nis === keyword ||
            item.nisn === keyword

        );

        return {

            success: !!student,

            message: student
                ? CONFIG.MESSAGE.SUCCESS
                : CONFIG.MESSAGE.NOT_FOUND,

            data: student || null

        };

    }

    // ===============================
    // MODE API (Apps Script)
    // ===============================

    const params = new URLSearchParams({

        action: CONFIG.API_ACTIONS.STUDENT,

        keyword: keyword

    });

    const result = await fetchJSON(`${CONFIG.API_BASE_URL}?${params.toString()}`);

    // Api.gs mengembalikan { success, data } saat sukses
    // dan { success:false, message } saat gagal.
    // Kita tambahkan fallback message supaya UI selalu punya teks.
    if (!result.message) {

        result.message = result.success
            ? CONFIG.MESSAGE.SUCCESS
            : CONFIG.MESSAGE.NOT_FOUND;

    }

    return result;

}

/**
 * ==========================================
 * HEALTH CHECK
 * ==========================================
 */

async function checkAPI() {

    if (CONFIG.USE_SAMPLE_DATA) {

        return {
            success: true,
            mode: "sample"
        };

    }

    try {

        const params = new URLSearchParams({
            action: CONFIG.API_ACTIONS.STATUS
        });

        const result = await fetchJSON(`${CONFIG.API_BASE_URL}?${params.toString()}`);

        return {

            success: !!result.success,

            mode: "production",

            status: result.data || null

        };

    } catch {

        return {

            success: false,

            mode: "offline"

        };

    }

}

/**
 * ==========================================
 * EXPORT
 * ==========================================
 */

window.API = {

    searchStudent,

    checkAPI

};
