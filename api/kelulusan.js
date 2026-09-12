/*
==========================================================
SMANSASOO Academic Portal
API Route: /api/kelulusan
Version : 1.0.0
==========================================================
Menggantikan Apps Script lama untuk data Kelulusan (yang
sudah tidak merespons, makanya kelulusan sempat dipaksa ke
USE_SAMPLE_DATA:true). Dipanggil dari js/kelulusan/api.js:
  fetch(`${CONFIG.API_BASE_URL}?action=student&keyword=...`)
  fetch(`${CONFIG.API_BASE_URL}?action=status`)
Bentuk request/response dibuat identik dengan kontrak lama
supaya js/kelulusan/api.js dan js/kelulusan/ui.js TIDAK
perlu diubah.

Spreadsheet HARUS di-share "Anyone with the link - Viewer".
ID-nya disimpan di Environment Variable Vercel
(GOOGLE_SHEET_ID_KELULUSAN), bukan di kode.

=====================================================
KOLOM (sesuaikan angkanya kalau urutan sheet asli beda)
=====================================================
Baris 1 = header, data mulai baris 2. Indeks 0-based.

  0  No
  1  NIS
  2  NISN
  3  Nama
  4  Jenis Kelamin      (L / P)
  5  Status             (LULUS / TIDAK LULUS)
  6  Nomor Ijazah
  7  Tanggal Kelulusan
  8  Catatan
==========================================================
*/

const { cleanNIS, fetchRowsByGid } = require("./_lib/gsheet");

const SHEET_ID = process.env.GOOGLE_SHEET_ID_KELULUSAN;

const GID = "217620338";

const COL = {
    NIS: 1,
    NISN: 2,
    NAMA: 3,
    GENDER: 4,
    STATUS: 5,
    NOMOR_IJAZAH: 6,
    TANGGAL: 7,
    CATATAN: 8
};

function findStudent(rows, keyword) {

    const target = cleanNIS(keyword);

    for (let i = 1; i < rows.length; i++) {

        const row = rows[i];

        const nis = cleanNIS(row[COL.NIS]);
        const nisn = cleanNIS(row[COL.NISN]);

        if (nis === target || nisn === target) {

            return {
                nis,
                nisn,
                name: String(row[COL.NAMA] || "").trim(),
                gender: String(row[COL.GENDER] || "").trim(),
                status: String(row[COL.STATUS] || "").trim(),
                graduation_number: String(row[COL.NOMOR_IJAZAH] || "").trim(),
                graduation_date: String(row[COL.TANGGAL] || "").trim(),
                note: String(row[COL.CATATAN] || "").trim()
            };

        }

    }

    return null;

}

module.exports = async (req, res) => {

    res.setHeader("Cache-Control", "no-store");

    const action = (req.query.action || "student").toString();

    if (!SHEET_ID) {
        res.status(500).json({ success: false, message: "GOOGLE_SHEET_ID_KELULUSAN belum diatur di Environment Variable Vercel." });
        return;
    }

    if (action === "status") {
        res.status(200).json({ success: true, data: { mode: "kelulusan-api", version: "1.0.0" } });
        return;
    }

    if (action !== "student") {
        res.status(400).json({ success: false, message: `Action tidak dikenali: ${action}` });
        return;
    }

    const keyword = (req.query.keyword || "").toString().trim();

    if (!keyword) {
        res.status(400).json({ success: false, message: "Keyword (NIS/NISN) tidak boleh kosong." });
        return;
    }

    try {

        const rows = await fetchRowsByGid(SHEET_ID, GID);

        const student = findStudent(rows, keyword);

        if (!student) {
            res.status(200).json({ success: false, message: `Siswa dengan NIS/NISN "${keyword}" tidak ditemukan.`, data: null });
            return;
        }

        res.status(200).json({ success: true, message: "Data ditemukan.", data: student });

    } catch (err) {

        res.status(500).json({ success: false, message: err.message || "Terjadi kesalahan pada server." });

    }

};
