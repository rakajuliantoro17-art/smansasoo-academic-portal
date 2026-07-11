/*
==========================================================
SMANSASOO Academic Portal
Configuration File
Version : 1.0.0
==========================================================
*/

window.CONFIG = {

    /* ==========================================
       APPLICATION
    ========================================== */

    APP_NAME: "SMANSASOO Academic Portal",

    VERSION: "1.0.0",

    SCHOOL_NAME: "SMAN 1 Sooko Mojokerto",

    ACADEMIC_YEAR: "2026/2027",

    /* ==========================================
       ENVIRONMENT
    ========================================== */

    ENVIRONMENT: "development",
    // development | production

    USE_SAMPLE_DATA: true,

    /* ==========================================
       API
    ========================================== */

    API_BASE_URL:
        "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",

    SAMPLE_DATA_URL:
        "data/sample.json",

    API_TIMEOUT: 10000,

    /* ==========================================
       SEARCH
    ========================================== */

    SEARCH_MIN_LENGTH: 4,

    SEARCH_PLACEHOLDER:
        "Masukkan NIS atau NISN",

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
            "Data berhasil ditemukan."

    }

};

/* ==========================================
   READ ONLY
========================================== */

Object.freeze(window.CONFIG);

const CONFIG = {

  APP_NAME: "SMANSASOO Academic Portal",

  VERSION: "1.0.0",

  API_URL: "https://script.google.com/macros/s/AKfycbxMrsLUcgmHtuqUlTL3Z6h0vpHOYCHq3kLIv7YOXe4M8NIRdQbFNjvaIS2gKNNfavWP9g/exec",

  REQUEST_TIMEOUT: 10000,

  CACHE_TIME: 300000

};
