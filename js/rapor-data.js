/*
==========================================================
SMANSASOO Academic Portal
Rapor Pendidikan - Data Loader
Version : 2.0.0
==========================================================
CHANGELOG (v2.0.0):
- Sebelumnya DATA_URL statis ke satu file (rapor-2025.json
  saja). Sekarang mendukung MULTI-TAHUN: load(tahun) mengambil
  data/rapor-<tahun>.json sesuai tahun yang diminta.
- Daftar tahun yang tersedia (buat mengisi dropdown) dibaca
  dari data/rapor-index.json -- bukan hardcode di JS -- supaya
  nambah tahun baru cukup 2 langkah: taruh file JSON baru +
  daftarkan tahunnya di rapor-index.json (lihat catatan di
  dalam file itu).

Kalau di masa depan sumber datanya pindah ke Google Drive
(bukan lagi file statis di /data), cukup ganti implementasi
loadIndex()/load() di file ini -- pemanggil (rapor-app.js)
tidak perlu berubah.

File ini HANYA mengambil data, tidak menyentuh DOM sama
sekali -- render-nya ada di js/rapor-ui.js.
==========================================================
*/

window.RaporData = (() => {

    const INDEX_URL = "/data/rapor-index.json";

    function dataUrl(tahun) {

        return `/data/rapor-${tahun}.json`;

    }

    async function fetchJSON(url) {

        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {

            throw new Error(`Gagal memuat ${url} (HTTP ${response.status}).`);

        }

        return response.json();

    }

    /**
     * Ambil daftar tahun yang tersedia + tahun default.
     * Dipakai rapor-app.js untuk mengisi dropdown SEBELUM
     * data tahun pertama dimuat.
     */
    async function loadIndex() {

        return fetchJSON(INDEX_URL);

    }

    /**
     * Ambil data satu tahun tertentu.
     */
    async function load(tahun) {

        return fetchJSON(dataUrl(tahun));

    }

    return {

        loadIndex,
        load

    };

})();
