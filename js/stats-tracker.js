/*
==========================================================
SMANSASOO Academic Portal
Stats Tracker
Version : 1.0.0
==========================================================
Mengirim SATU "hit" ke /api/stats setiap kali halaman
dimuat, memakai data-page dari <body> (sudah ada di semua
halaman, lihat js/shell.js).

SENGAJA fire-and-forget:
- Tidak menunggu response.
- Kalau gagal (mis. statistik belum diaktifkan di server,
  atau user sedang offline), diam-diam diabaikan -- tidak
  pernah menampilkan error ke pengguna maupun menghambat
  render halaman.
==========================================================
*/

(function () {

    if (!document.body) return;

    const page = document.body.dataset.page;

    if (!page) return;

    try {

        fetch(`/api/stats?page=${encodeURIComponent(page)}`, {
            method: "POST",
            cache: "no-store",
            keepalive: true
        }).catch(() => {});

    } catch (e) {

        // diam-diam diabaikan, lihat catatan di atas.

    }

})();
