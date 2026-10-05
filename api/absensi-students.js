/*
==========================================================
SMANSASOO Academic Portal
API Route: /api/absensi-students
Version : 1.0.0
==========================================================
Dipakai oleh pages/absensi-admin.html untuk membuat QR code
per siswa. Membaca sheet "STUDENTS" di spreadsheet khusus
absensi (GOOGLE_SHEET_ID_ABSENSI), skema kolom (baris 1 =
header):

  A: NIS
  B: Nama
  C: Kelas

Hanya baca publik lewat gviz (sama seperti modul Nilai),
TIDAK butuh Service Account.
==========================================================
*/

const { fetchSheetRows, cleanNIS } = require("./_lib/gsheet");
const { verifyAdmin } = require("./admin-auth");

const SHEET_NAME = "STUDENTS";

module.exports = async (req, res) => {

    res.setHeader("Cache-Control", "no-store");

    // Dipakai untuk cetak kartu QR -- data NIS lengkap, jadi dibatasi
    // untuk sesi admin saja. Nonaktif otomatis kalau ADMIN_USERNAME/
    // ADMIN_PASSWORD belum diatur di Vercel.
    const auth = verifyAdmin(req);

    if (auth.configured && !auth.ok) {
        res.status(401).json({ success: false, configured: true, message: "Sesi admin tidak valid, silakan login ulang.", data: [] });
        return;
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID_ABSENSI;

    if (!spreadsheetId) {
        res.status(200).json({
            success: false,
            configured: false,
            message: "GOOGLE_SHEET_ID_ABSENSI belum diatur di Environment Variable Vercel.",
            data: []
        });
        return;
    }

    try {

        const rows = await fetchSheetRows(SHEET_NAME, spreadsheetId);

        const students = [];

        for (let i = 1; i < rows.length; i++) {

            const row = rows[i];

            const nis = cleanNIS(row[0]);
            const nama = String(row[1] || "").trim();
            const kelas = String(row[2] || "").trim();

            if (!nis || !nama) continue;

            students.push({ nis, nama, kelas });

        }

        res.status(200).json({
            success: true,
            configured: true,
            message: `Berhasil memuat ${students.length} siswa.`,
            data: students
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            configured: true,
            message: err.message || "Terjadi kesalahan pada server.",
            data: []
        });

    }

};
