/*
==========================================================
SMANSASOO Academic Portal
Nilai - Pemilih Tahun Ajaran
Version : 1.0.0
==========================================================
Mengisi dropdown #nilaiYearSelect dari data/nilai-index.json
(daftar tahun yang punya Environment Variable
GOOGLE_SHEET_ID_<TAHUN> sendiri di Vercel -- lihat catatan
di file itu), lalu menyimpan tahun yang sedang dipilih supaya
bisa dibaca modul lain (nilai-search.js, nilai-kelas-search.js)
tiap kali mereka memanggil API.

Pola sama seperti js/rapor-data.js + js/rapor-app.js, cuma
disederhanakan jadi satu file karena di sini yang dimuat
ulang bukan file JSON per tahun, melainkan cukup query param
?tahun= ke endpoint yang sudah ada (/api/nilai, /api/kelas-list,
/api/kelas-summary).
==========================================================
*/

window.NilaiYear = (() => {

    const INDEX_URL = "/data/nilai-index.json";
    const SELECT_ID = "nilaiYearSelect";

    let currentYear = null;
    const listeners = [];

    async function loadIndex() {

        const response = await fetch(INDEX_URL, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`Gagal memuat ${INDEX_URL} (HTTP ${response.status}).`);
        }

        return response.json();

    }

    function renderSelect(years, defaultYear) {

        const select = document.getElementById(SELECT_ID);

        if (!select || !years.length) return;

        select.innerHTML = years
            .map((y) => `<option value="${y}">${y}/${y + 1}</option>`)
            .join("");

        select.value = String(defaultYear);
        currentYear = defaultYear;

        select.addEventListener("change", () => {

            currentYear = Number(select.value);

            listeners.forEach((fn) => fn(currentYear));

        });

    }

    /**
     * ==========================================
     * PUBLIC
     * ==========================================
     */

    function getYear() {

        return currentYear;

    }

    // Daftarkan callback yang dipanggil setiap kali tahun
    // ganti (dropdown diubah user). Dipakai untuk reset hasil
    // pencarian & daftar kelas tahun sebelumnya.
    function onChange(fn) {

        listeners.push(fn);

    }

    async function initialize() {

        try {

            const index = await loadIndex();

            const years = index.tahun_tersedia || [];
            const defaultYear = index.tahun_default || years[0];

            renderSelect(years, defaultYear);

        } catch (error) {

            Utils.log("Gagal memuat daftar tahun ajaran (Nilai):", error);

        }

    }

    return {

        initialize,

        getYear,

        onChange

    };

})();

document.addEventListener("DOMContentLoaded", () => {

    NilaiYear.initialize();

});
