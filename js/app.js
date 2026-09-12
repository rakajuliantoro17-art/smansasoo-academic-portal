/*
==========================================================
SMANSASOO Academic Portal
Application Bootstrap (Kenaikan Kelas)
Version : 2.3.0
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

FIX (v2.3.0):
- BUG: path Service Worker sebelumnya "../sw.js" (ketiban dari
  js/kelulusan/app.js, yang benar untuk halaman di dalam
  /pages/). File ini dipanggil dari index.html di ROOT repo,
  jadi path yang benar adalah "sw.js" tanpa "../".
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
            // dengan seluruh halaman situs). File ini dipanggil
            // dari index.html di root, jadi pathnya "sw.js"
            // tanpa "../".
            if ("serviceWorker" in navigator) {

                window.addEventListener("load", () => {

                    navigator.serviceWorker
                        .register("sw.js")
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
