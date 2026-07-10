/*
==========================================================
SMANSASOO Academic Portal
API Service
Version : 1.0.0
==========================================================
*/

/**
 * ==========================================
 * CONFIGURATION
 * ==========================================
 */

// Ganti dengan URL Web App Google Apps Script setelah deploy
const API_BASE_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

// Gunakan sample.json jika API belum tersedia
const USE_SAMPLE_DATA = true;

// Lokasi file sample
const SAMPLE_DATA_URL = "data/sample.json";

/**
 * ==========================================
 * FETCH JSON
 * ==========================================
 */

async function fetchJSON(url) {

    const response = await fetch(url, {
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();

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
    // MODE SAMPLE
    // ===============================

    if (USE_SAMPLE_DATA) {

        const json = await fetchJSON(SAMPLE_DATA_URL);

        const student = json.students.find(item =>

            item.nis === keyword ||
            item.nisn === keyword

        );

        return {

            success: !!student,

            message: student
                ? "Data ditemukan."
                : "Data tidak ditemukan.",

            version: json.version,

            data: student || null

        };

    }

    // ===============================
    // MODE API
    // ===============================

    const params = new URLSearchParams();

    if (/^\d{10}$/.test(keyword)) {

        params.append("nisn", keyword);

    } else {

        params.append("nis", keyword);

    }

    return await fetchJSON(`${API_BASE_URL}?${params.toString()}`);

}

/**
 * ==========================================
 * HEALTH CHECK
 * ==========================================
 */

async function checkAPI() {

    if (USE_SAMPLE_DATA) {

        return {
            success: true,
            mode: "sample"
        };

    }

    try {

        await fetchJSON(API_BASE_URL);

        return {

            success: true,

            mode: "production"

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
