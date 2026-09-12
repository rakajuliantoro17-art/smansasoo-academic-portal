/*
==========================================================
SMANSASOO Academic Portal
Configuration (Kenaikan Kelas)
Version : 2.3.0
==========================================================

Portal Pengumuman Kenaikan Kelas
SMAN 1 Sooko Mojokerto

FIX (v2.3.0):
- File ini sebelumnya ke-timpa (copy-paste) isi
  js/kelulusan/config.js secara tidak sengaja, sehingga
  index.html (kenaikan kelas) ikut memakai identitas dan
  status "LULUS/TIDAK LULUS" milik modul Kelulusan, dan ikut
  terjebak USE_SAMPLE_DATA:true dari perbaikan sementara di
  modul itu. Sudah dipisah lagi jadi dua file independen:
  file ini untuk Kenaikan Kelas, js/kelulusan/config.js
  untuk Kelulusan.
- API_BASE_URL dipindah dari Apps Script ke /api/kenaikan
  (Vercel Serverless Function, lihat api/kenaikan.js), yang
  membaca langsung dari Google Sheets, konsisten dengan
  modul Nilai dan Kelulusan.
- USE_SAMPLE_DATA dikembalikan ke false karena backend
  permanen sudah aktif.
- Path aset (logo, ikon, background, sample data) dibuat
  absolut ("/assets/...", "/data/...") supaya tetap benar
  dipanggil dari halaman mana pun, bukan cuma dari root.
==========================================================
*/

window.CONFIG = {

    /* ======================================================
       APPLICATION
    ====================================================== */

    APP_NAME: "SMANSASOO Academic Portal",

    VERSION: "2.3.0",

    SCHOOL_NAME: "SMAN 1 Sooko Mojokerto",

    ACADEMIC_YEAR: "2026/2027",

    ANNOUNCEMENT_TITLE:
        "Pengumuman Kenaikan Kelas",

    ANNOUNCEMENT_YEAR:
        "2026",

    /* ======================================================
       ENVIRONMENT
    ====================================================== */

    ENVIRONMENT: "production",

    // true = membaca data/sample.json
    // false = membaca /api/kenaikan (Vercel, baca Google Sheets)

    USE_SAMPLE_DATA: false,

    /* ======================================================
       API
    ====================================================== */

    API_BASE_URL:
        "/api/kenaikan",

    API_ACTIONS: {

        STUDENT: "student",

        STATUS: "status",

        SETTINGS: "settings",

        VERSION: "version"

    },

    SAMPLE_DATA_URL:
        "/data/sample.json",

    API_TIMEOUT: 10000,

    /* ======================================================
       SEARCH
    ====================================================== */

    SEARCH_MIN_LENGTH: 4,

    SEARCH_PLACEHOLDER:
        "Masukkan NIS atau NISN",

    /* ======================================================
       RESULT STATUS
    ====================================================== */

    STATUS_PASS: "NAIK",

    STATUS_NOT_PASS: "TIDAK NAIK",

    /* ======================================================
       VISUAL
    ====================================================== */

    BACKGROUND_IMAGE:
        "/assets/images/scc.jpg",

    LOGO:
        "/assets/logo/logo.png",

    ICON:
        "/assets/icons/icon.png",

    FAVICON:
        "/assets/favicon.ico",

    /* ======================================================
       CELEBRATION
    ====================================================== */

    ENABLE_CELEBRATION: true,

    ENABLE_CONFETTI: true,

    ENABLE_BALLOON: true,

    ENABLE_FLASH: true,

    ENABLE_AUDIO: true,

    AUDIO_URL:
        "/assets/audio/naik-kelas.mp3",

    CONFETTI_PARTICLE: 180,

    CONFETTI_SPREAD: 120,

    BALLOON_COUNT: 16,

    /* ======================================================
       LOADING
    ====================================================== */

    ENABLE_LOADING: true,

    LOADING_DELAY: 1800,

    /* ======================================================
       CACHE
    ====================================================== */

    ENABLE_CACHE: false,

    CACHE_DURATION: 300000,

    /* ======================================================
       PWA
    ====================================================== */

    ENABLE_PWA: true,

    ENABLE_OFFLINE: false,

    /* ======================================================
       DEBUG
    ====================================================== */

    ENABLE_CONSOLE_LOG: false,

    /* ======================================================
       MESSAGE
    ====================================================== */

    MESSAGE: {

        EMPTY_KEYWORD:
            "Silakan masukkan NIS atau NISN.",

        NOT_FOUND:
            "Data siswa tidak ditemukan.",

        SERVER_ERROR:
            "Terjadi kesalahan pada server.",

        LOADING:
            "Sedang memproses data...",

        SUCCESS:
            "Data berhasil ditemukan.",

        PASS_MESSAGE:
            "Selamat! Anda dinyatakan NAIK KELAS.",

        NOT_PASS_MESSAGE:
            "Silakan menghubungi wali kelas untuk informasi lebih lanjut."

    }

};

/* ======================================================
   READ ONLY
====================================================== */

Object.freeze(window.CONFIG);

Object.freeze(window.CONFIG.API_ACTIONS);

Object.freeze(window.CONFIG.MESSAGE);
