/**
 * =====================================================
 * SMANSASOO Academic Portal
 * Service Worker
 * Version : 1.0.0
 * Status  : Placeholder
 * =====================================================
 *
 * Phase 1:
 * - Belum menggunakan cache
 * - Belum menggunakan offline mode
 * - Belum menggunakan PWA
 *
 * Phase 1.5:
 * - Cache Asset
 * - Offline Page
 * - Install PWA
 * - Background Update
 *
 */

const APP_NAME = "SMANSASOO Academic Portal";
const VERSION = "1.0.0";

self.addEventListener("install", (event) => {
    console.log(`${APP_NAME} Service Worker Installed (${VERSION})`);

    // Aktifkan service worker langsung
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log(`${APP_NAME} Service Worker Activated`);

    // Mengambil alih semua client
    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
    // Phase 1:
    // Semua request langsung diteruskan ke jaringan.
    // Cache akan ditambahkan pada Phase 1.5.
    return;
});
