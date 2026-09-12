/*
==========================================================
SMANSASOO Academic Portal
API Route: /api/kenaikan
Version : 1.0.0
==========================================================
Menggantikan Apps Script lama untuk data Kenaikan Kelas.
Dipanggil dari browser lewat js/api.js:
  fetch(`${CONFIG.API_BASE_URL}?action=student&keyword=...`)
  fetch(`${CONFIG.API_BASE_URL}?action=status`)
Bentuk request/response SENGAJA dibuat identik dengan kontrak
Api.gs yang lama (action=student/status, {success,message,data})
supaya js/api.js dan js/ui.js TIDAK perlu diubah sama sekali.

Spreadsheet HARUS di-share "Anyone with the link - Viewer".
ID-nya disimpan di Environment Variable Vercel
(GOOGLE_SHEET_ID_KENAIKAN), bukan di kode.

=====================================================
KOLOM (dikonfirmasi dari header sheet asli)
=====================================================
Baris 1 = header, data mulai baris 2. Indeks 0-based.
Header asli: NIS | NISN | NAMA | JENIS_KELAMIN | KELAS_LAMA |
             STATUS | KELAS_BARU | KELOMPOK_MINAT | WALI_KELAS | CATATAN

  0  NIS
  1  NISN
  2  NAMA
  3  JENIS_KELAMIN      (laki / perempuan)
  4  KELAS_LAMA
  5  STATUS             (Naik / Tidak Naik)
  6  KELAS_BARU
  7  KELOMPOK_MINAT
  8  WALI_KELAS
  9  CATATAN
==========================================================
*/

const { cleanNIS, fetchRowsByGid } = require("./_lib/gsheet");

const SHEET_ID = process.env.GOOGLE_SHEET_ID_KENAIKAN;

const GID = "1777318860";

const COL = {
    NIS: 0,
    NISN: 1,
    NAMA: 2,
    GENDER: 3,
    KELAS_LAMA: 4,
    STATUS: 5,
    KELAS_BARU: 6,
    JURUSAN: 7,
    WALI: 8,
    CATATAN: 9
};

const ACADEMIC_YEAR = "2026/2027";

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
                previous_class: String(row[COL.KELAS_LAMA] || "-").trim(),
                new_class: String(row[COL.KELAS_BARU] || "-").trim(),
                major: String(row[COL.JURUSAN] || "-").trim(),
                homeroom_teacher: String(row[COL.WALI] || "-").trim(),
                note: String(row[COL.CATATAN] || "").trim(),
                academic_year: ACADEMIC_YEAR
            };

        }

    }

    return null;

}

module.exports = async (req, res) => {

    res.setHeader("Cache-Control", "no-store");

    const action = (req.query.action || "student").toString();

    if (!SHEET_ID) {
        res.status(500).json({ success: false, message: "GOOGLE_SHEET_ID_KENAIKAN belum diatur di Environment Variable Vercel." });
        return;
    }

    if (action === "status") {
        res.status(200).json({ success: true, data: { mode: "kenaikan-api", version: "1.0.0" } });
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
