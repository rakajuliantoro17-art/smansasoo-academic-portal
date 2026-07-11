/*
==========================================================
SMANSASOO Academic Portal
Configuration File
Version : 1.1.0
==========================================================
FIX (v1.1.0):
- Menghapus duplikat "const CONFIG" yang sebelumnya
  bentrok dengan window.CONFIG dan tidak pernah dipakai.
- API_BASE_URL sekarang diisi URL Apps Script yang sudah
  di-deploy (bukan placeholder lagi).
- Menambahkan API_ACTIONS agar nama action selalu konsisten
  dengan Api.gs (student, status, settings, announcement, version).
==========================================================
*/

window.CONFIG = {

    /* ==========================================
       APPLICATION
    ========================================== */

    APP_NAME: "SMANSASOO Academic Portal",

    VERSION: "1.1.0",

    SCHOOL_NAME: "SMAN 1 Sooko Mojokerto",

    ACADEMIC_YEAR: "2026/2027",

    /* ==========================================
       ENVIRONMENT
    ========================================== */

    ENVIRONMENT: "production",
    // development | production

    // Set true hanya untuk demo lokal tanpa koneksi API.
    // Untuk pemakaian sungguhan HARUS false.
    USE_SAMPLE_DATA: false,

    /* ==========================================
       API
    ========================================== */

    API_BASE_URL:
        "https://script.google.com/macros/s/AKfycbwAbjqiwBFp-xQAZVmcrybhC31FEDH054MS4_mSHgb2hjr15KnL4G-KGfiUhaB_52gsoA/exec",

    // Nama action HARUS sama persis dengan switch(action) di Api.gs
    API_ACTIONS: {
        STUDENT: "student",
        STATUS: "status",
        SETTINGS: "settings",
        ANNOUNCEMENT: "announcement",
        VERSION: "version"
    },

    SAMPLE_DATA_URL:
        "data/sample.json",

    API_TIMEOUT: 10000,

    /* ==========================================
       SEARCH
    ========================================== */

    SEARCH_MIN_LENGTH: 4,

    SEARCH_PLACEHOLDER:
        "Masukkan NIS atau NISN",

    // Substring (huruf besar) yang menandai status BELUM naik
    // kelas, dicek terhadap kolom STATUS di sheet STUDENTS.
    // Contoh yang cocok: "TIDAK NAIK", "Tidak Naik Kelas", dst.
    STATUS_NOT_PROMOTED_KEYWORD: "TIDAK",

    /* ==========================================
       CELEBRATION (status: NAIK)
    ========================================== */

    // Set false untuk mematikan musik tanpa ubah kode lain.
    ENABLE_CELEBRATION_AUDIO: true,

    // WAJIB diisi file audio milik sekolah / royalty-free.
    // Taruh file-nya di assets/audio/ lalu sesuaikan path ini.
    // Selama file belum ada, browser akan diam-diam gagal
    // memutar audio (tidak error ke pengguna).
    CELEBRATION_AUDIO_URL:
        "assets/audio/naik-kelas.mp3",

    /* ==========================================
       CACHE
    ========================================== */

    ENABLE_CACHE: false,

    CACHE_DURATION: 300000,

    /* ==========================================
       PWA
    ========================================== */

    ENABLE_PWA: true,

    ENABLE_OFFLINE: false,

    /* ==========================================
       UI
    ========================================== */

    ENABLE_ANIMATION: true,

    ENABLE_LOADING: true,

    ENABLE_CONSOLE_LOG: true,

    /* ==========================================
       MESSAGE
    ========================================== */

    MESSAGE: {

        EMPTY_KEYWORD:
            "Silakan masukkan NIS atau NISN.",

        NOT_FOUND:
            "Data siswa tidak ditemukan.",

        SERVER_ERROR:
            "Terjadi kesalahan pada server.",

        LOADING:
            "Memuat data...",

        SUCCESS:
            "Data berhasil ditemukan.",

        NOT_PROMOTED_NOTE:
            "Untuk informasi lebih lanjut mengenai hasil ini, " +
            "silakan hubungi wali kelas atau bagian Kurikulum " +
            "SMAN 1 Sooko."

    }

};

/* ==========================================
   READ ONLY
========================================== */

Object.freeze(window.CONFIG);
Object.freeze(window.CONFIG.API_ACTIONS);
Object.freeze(window.CONFIG.MESSAGE);
