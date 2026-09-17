/*
==========================================================
SMANSASOO Academic Portal
Simulasi TKA - Embed Controller
Version : 1.0.0
==========================================================
Situs resmi Pusmendik (https://pusmendik.kemendikdasmen.go.id/tka/
simulasi_tka) butuh login per-sesi (ses_id) begitu jenjang & mapel
dipilih. Karena itu:

1. iframe SENGAJA tidak langsung dimuat saat halaman dibuka --
   baru diisi src-nya setelah tombol "Mulai Simulasi" diklik.
   Ini supaya tidak diam-diam membuat sesi ke situs Pusmendik
   cuma karena orang mampir ke halaman ini.
2. URL tujuan diarahkan ke halaman AWAL simulasi_tka (bukan hasil
   pilihan jenjang/mapel tertentu) -- pemilihan jenjang & mapel
   dilakukan langsung di situs resminya di dalam iframe, karena
   format URL untuk pra-isi pilihan itu tidak publik/tidak bisa
   dipastikan dari luar.
3. Tidak ada cara pasti dari JavaScript untuk mendeteksi apakah
   sebuah situs menolak di-iframe (X-Frame-Options / CSP
   frame-ancestors) -- browser tidak memberi event khusus untuk
   itu. Makanya link "Buka di tab baru" SELALU ditampilkan
   berdampingan, bukan cuma muncul kalau iframe gagal.
==========================================================
*/

(function () {

    const TKA_URL = "https://pusmendik.kemendikdasmen.go.id/tka/simulasi_tka";

    function initialize() {

        const startBtn = document.getElementById("tkaStartBtn");
        const placeholder = document.getElementById("tkaEmbedPlaceholder");
        const wrap = document.getElementById("tkaEmbedWrap");
        const frame = document.getElementById("tkaEmbedFrame");

        if (!startBtn || !placeholder || !wrap || !frame) return;

        startBtn.addEventListener("click", () => {

            frame.src = TKA_URL;

            placeholder.classList.add("hidden");
            wrap.classList.remove("hidden");

        });

    }

    document.addEventListener("DOMContentLoaded", initialize);

})();
