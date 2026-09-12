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
KOLOM (sesuaikan angkanya kalau urutan sheet asli beda)
=====================================================
Baris 1 = header, data mulai baris 2. Indeks di bawah ini
0-based (kolom A = 0).

  0  No
  1  NIS
  2  NISN
  3  Nama
  4  Jenis Kelamin      (L / P)
  5  Status             (NAIK / TIDAK NAIK)
  6  Kelas Lama
  7  Kelas Baru
  8  Jurusan / Minat
  9  Wali Kelas Baru

Kalau urutan kolom di sheet kamu beda, tinggal ubah angka di
objek COL di bawah ini, tidak perlu ubah logic lain.
==========================================================
*/

const { cleanNIS, fetchRowsByGid } = require("./_lib/gsheet");

const SHEET_ID = process.env.GOOGLE_SHEET_ID_KENAIKAN;

const GID = "1777318860";

const COL = {
    NIS: 1,
    NISN: 2,
    NAMA: 3,
    GENDER: 4,
    STATUS: 5,
    KELAS_LAMA: 6,
    KELAS_BARU: 7,
    JURUSAN: 8,
    WALI: 9
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
