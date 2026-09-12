/*
==========================================================
SMANSASOO Graduation Portal
Application Bootstrap
Version : 2.2.0
==========================================================

Main Entry Point

Fungsi:
- Memulai aplikasi
- Memuat konfigurasi
- Mengisi badge tahun ajaran secara otomatis
- Registrasi Service Worker
- Melakukan Health Check API
- Menginisialisasi Search Module

Semua logika aplikasi berada pada module lain.

FIX (v2.2.0):
- Menambahkan pengisian otomatis #badgeYear dari
  CONFIG.ACADEMIC_YEAR saat halaman dimuat. Sebelumnya teks
  "Tahun Ajaran 2026/2027" hardcode di index.html — sekarang
  cukup ganti CONFIG.ACADEMIC_YEAR di config.js setiap tahun
  ajaran baru, index.html tidak perlu disentuh lagi.
==========================================================
*/

"use strict";

/* ==========================================
   APPLICATION
========================================== */

const App = {

    async initialize() {

        console.info("====================================");
        console.info(CONFIG.APP_NAME);
        console.info(`Version : ${CONFIG.VERSION}`);
        console.info("Initializing...");
        console.info("====================================");

        try {

            // Badge Tahun Ajaran (dinamis dari config.js)
            const badgeYear = document.getElementById("badgeYear");

            if (badgeYear) {

                badgeYear.textContent = `Tahun Ajaran ${CONFIG.ACADEMIC_YEAR}`;

            }

            // Service Worker (sw.js ada di root repo, di-share
            // dengan seluruh halaman situs, bukan cuma halaman
            // ini — path disesuaikan karena file ini dipanggil
            // dari pages/kelulusan.html, bukan dari root).
            if ("serviceWorker" in navigator) {

                window.addEventListener("load", () => {

                    navigator.serviceWorker
                        .register("../sw.js")
                        .then(() => {

                            console.info("Service Worker Registered");

                        })
                        .catch((error) => {

                            console.warn("Service Worker Failed", error);

                        });

                });

            }

            // API Health Check
            if (window.API) {

                API.checkAPI()
                    .then(result => {

                        if (CONFIG.ENABLE_CONSOLE_LOG) {

                            console.info("API Status :", result);

                        }

                    })
                    .catch(error => {

                        console.warn("API Error :", error);

                    });

            }

            // Search Module
            if (window.Search) {

                Search.initialize();

            }

            console.info("Application Ready");

        } catch (error) {

            console.error("Application Error :", error);

        }

    }

};

/* ==========================================
   START APPLICATION
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    App.initialize();

});

/* ==========================================
   EXPORT
========================================== */

window.App = App;
