/*
==========================================================
SMANSASOO Academic Portal
API Route: /api/announcements
Version : 1.0.0
==========================================================
Baca sheet "ANNOUNCEMENTS" di spreadsheet yang sama dengan
Nilai/Rekap (GOOGLE_SHEET_ID). Skema kolom (baris 1 = header):

  A: Judul      -- judul pengumuman
  B: Isi        -- isi lengkap
  C: Tanggal    -- tanggal (bebas format, ditampilkan apa
                   adanya; dicoba di-parse untuk pengurutan,
                   kalau gagal parse jatuh ke urutan baris)
  D: Prioritas  -- "Penting" atau kosong/"Normal"
  E: Aktif      -- "Y" supaya tampil, apa pun selain itu
                   (termasuk kosong) disembunyikan tanpa
                   perlu hapus barisnya

Hanya baris dengan Judul terisi DAN Aktif="Y" (tidak
case-sensitive) yang dikembalikan, diurutkan tanggal
terbaru dulu.
==========================================================
*/

const { SHEET_ID, fetchSheetRows } = require("./_lib/gsheet");

const SHEET_NAME = "ANNOUNCEMENTS";

function parseDateSafe(value) {

    const d = new Date(value);

    return isNaN(d.getTime()) ? null : d;

}

module.exports = async (req, res) => {

    res.setHeader("Cache-Control", "no-store");

    if (!SHEET_ID) {
        res.status(500).json({ success: false, message: "GOOGLE_SHEET_ID belum diatur di Environment Variable Vercel.", data: [] });
        return;
    }

    try {

        const rows = await fetchSheetRows(SHEET_NAME);

        const announcements = [];

        for (let i = 1; i < rows.length; i++) {

            const row = rows[i];

            const judul = String(row[0] || "").trim();
            const isi = String(row[1] || "").trim();
            const tanggal = String(row[2] || "").trim();
            const prioritas = String(row[3] || "").trim() || "Normal";
            const aktif = String(row[4] || "").trim().toUpperCase();

            if (!judul || aktif !== "Y") continue;

            announcements.push({

                judul,
                isi,
                tanggal,
                prioritas,
                _sortDate: parseDateSafe(tanggal),
                _sortIndex: i

            });

        }

        announcements.sort((a, b) => {

            // Yang punya tanggal valid diurutkan terbaru dulu;
            // yang tanggalnya tidak bisa di-parse ditaruh di
            // bawah, diurutkan sesuai urutan baris di sheet.
            if (a._sortDate && b._sortDate) {
                return b._sortDate - a._sortDate;
            }

            if (a._sortDate && !b._sortDate) return -1;
            if (!a._sortDate && b._sortDate) return 1;

            return a._sortIndex - b._sortIndex;

        });

        const data = announcements.map(({ judul, isi, tanggal, prioritas }) => ({
            judul, isi, tanggal, prioritas
        }));

        res.status(200).json({ success: true, message: "Pengumuman berhasil diambil.", data });

    } catch (err) {

        res.status(500).json({ success: false, message: err.message || "Terjadi kesalahan pada server.", data: [] });

    }

};
