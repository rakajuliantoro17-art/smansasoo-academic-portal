/*
==========================================================
SMANSASOO Academic Portal
API Route: /api/kelas-list
Version : 1.0.0
==========================================================
Menggantikan Apps Script (Code.gs -> getClassList).
Dipanggil dari browser lewat fetch("/api/kelas-list").
Mengembalikan daftar nama kelas unik yang muncul di ketiga
sheet (Wajib, Lanjutan, Raport), diurutkan A-Z.
==========================================================
*/

const { SHEET_NAMES, fetchSheetRows, SHEET_ID } = require("./_lib/gsheet");

module.exports = async (req, res) => {
    res.setHeader("Cache-Control", "no-store");

    if (!SHEET_ID) {
        res.status(500).json({ success: false, message: "GOOGLE_SHEET_ID belum diatur di Environment Variable Vercel.", data: [] });
        return;
    }

    try {
        const sheetKeys = [SHEET_NAMES.wajib, SHEET_NAMES.lanjutan, SHEET_NAMES.raport];

        const results = await Promise.all(
            sheetKeys.map((name) => fetchSheetRows(name).catch(() => []))
        );

        const classes = [];

        results.forEach((rows) => {
            for (let i = 1; i < rows.length; i++) {
                const kelas = String(rows[i][1] || "").trim();

                if (kelas && kelas !== "Kelas" && classes.indexOf(kelas) === -1) {
                    classes.push(kelas);
                }
            }
        });

        classes.sort();

        res.status(200).json({ success: true, message: "Daftar kelas berhasil diambil.", data: classes });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || "Terjadi kesalahan pada server.", data: [] });
    }
};
