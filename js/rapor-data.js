/*
==========================================================
SMANSASOO Academic Portal
Rapor Pendidikan - Data Loader
Version : 1.0.0
==========================================================
Beda dengan modul Nilai/Kenaikan/Kelulusan (yang bacanya
dari Google Sheets lewat /api), Rapor Pendidikan sumbernya
data resmi tahunan dari Kemendikdasmen yang jarang berubah
(setahun sekali) dan tidak berisi data pribadi siswa,
jadi cukup disimpan sebagai file statis di /data (mengikuti
pola data/sample.json yang sudah ada) -- tidak perlu
serverless function baru di /api.

Kalau di tahun depan datanya perlu diganti: tinggal timpa
file data/rapor-2025.json (atau tambah data/rapor-<tahun>.json
baru dan ganti DATA_URL di bawah).

File ini HANYA mengambil data, tidak menyentuh DOM sama
sekali -- render-nya ada di js/rapor-ui.js (lihat
docs/UI-SHELL.md bagian 6).
==========================================================
*/

window.RaporData = (() => {

    const DATA_URL = "/data/rapor-2025.json";

    async function load() {

        const response = await fetch(DATA_URL, { cache: "no-store" });

        if (!response.ok) {

            throw new Error(`Gagal memuat data Rapor Pendidikan (HTTP ${response.status}).`);

        }

        const json = await response.json();

        return json;

    }

    return {

        load

    };

})();
