/*
==========================================================
SMANSASOO Academic Portal
E-Learning (pages/elearning.html)
Version : 1.0.0
==========================================================
Halaman ini sengaja minim JS -- iframe & tombol "buka di tab
baru" sudah jalan lewat markup HTML biasa (lihat
pages/elearning.html). Status berhasil/gagalnya iframe memuat
konten dari server lain (cross-origin) tidak bisa dibaca lewat
JavaScript, jadi tidak ada deteksi "iframe gagal dimuat" di
sini -- itu sebabnya tombol "buka di tab baru" di halaman
selalu ditampilkan, bukan cuma sebagai fallback kondisional.
==========================================================
*/

(function () {
    "use strict";

    function init() {

        var frame = document.getElementById("elFrame");

        if (!frame) return;

        // Catatan: event "load" pada iframe tetap terpicu walau
        // kontennya diblokir browser (mixed content) atau ditolak
        // server (X-Frame-Options/CSP) -- jadi tidak dipakai untuk
        // menyembunyikan/menampilkan peringatan, cukup untuk log
        // ringan di konsol bila dibutuhkan saat development.
        frame.addEventListener("load", function () {

            if (window.CONFIG && CONFIG.ENABLE_CONSOLE_LOG) {

                console.log("[elearning] iframe load event terpicu");

            }

        });

    }

    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", init);

    } else {

        init();

    }

})();
