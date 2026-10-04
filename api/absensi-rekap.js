/*
==========================================================
SMANSASOO Academic Portal
API Route: /api/absensi-rekap
Version : 1.0.0
==========================================================
Dipakai oleh pages/absensi-rekap.html untuk melihat rekap
kehadiran dari sheet "ABSENSI" (ditulis otomatis oleh
api/absensi.js) + daftar siswa dari sheet "STUDENTS", di
spreadsheet khusus absensi (GOOGLE_SHEET_ID_ABSENSI).

Query parameter (semua opsional, bisa dikombinasikan):
  tanggal = YYYY-MM-DD   (default: hari ini, zona Asia/Jakarta)
  kelas   = nama kelas persis seperti di STUDENTS, atau "SEMUA"
  mapel   = nama mapel (cocok sebagian, tidak case-sensitive)
  jamKe   = jam ke- (cocok persis)

Response:
  {
    success, message,
    data: {
      filters: { tanggal, kelas, mapel, jamKe },
      kelasList: [...],          -- untuk dropdown filter
      totalSiswaKelas: number|null,
      records: [{ tanggal, waktu, nis, nama, kelas, mapel, jamKe, status }],
      totalRecords: number,
      siswaBelumAbsen: [...]|null -- hanya terisi kalau kelas+mapel+jamKe diisi
    }
  }
==========================================================
*/

const { fetchSheetRows, cleanNIS } = require("./_lib/gsheet");

const SHEET_STUDENTS = "STUDENTS";
const SHEET_ABSENSI = "ABSENSI";

function todayJakarta() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

module.exports = async (req, res) => {

    res.setHeader("Cache-Control", "no-store");

    const spreadsheetId = process.env.GOOGLE_SHEET_ID_ABSENSI;

    if (!spreadsheetId) {
        res.status(200).json({
            success: false,
            configured: false,
            message: "GOOGLE_SHEET_ID_ABSENSI belum diatur di Environment Variable Vercel.",
            data: null
        });
        return;
    }

    const tanggal = (req.query.tanggal || "").toString().trim() || todayJakarta();
    const kelasFilter = (req.query.kelas || "SEMUA").toString().trim() || "SEMUA";
    const mapelFilter = (req.query.mapel || "").toString().trim();
    const jamKeFilter = (req.query.jamKe || "").toString().trim();

    try {

        const [studentRows, absensiRows] = await Promise.all([
            fetchSheetRows(SHEET_STUDENTS, spreadsheetId),
            fetchSheetRows(SHEET_ABSENSI, spreadsheetId)
        ]);

        // ---------- Daftar siswa (untuk dropdown kelas & cek "belum absen") ----------
        const students = [];
        const kelasSet = new Set();

        for (let i = 1; i < studentRows.length; i++) {

            const row = studentRows[i];
            const nis = cleanNIS(row[0]);
            const nama = String(row[1] || "").trim();
            const kelas = String(row[2] || "").trim();

            if (!nis || !nama) continue;

            students.push({ nis, nama, kelas });

            if (kelas) kelasSet.add(kelas);

        }

        const kelasList = Array.from(kelasSet).sort((a, b) => a.localeCompare(b, "id"));

        // ---------- Filter log ABSENSI ----------
        const records = [];

        for (let i = 1; i < absensiRows.length; i++) {

            const row = absensiRows[i];

            const rTanggal = String(row[0] || "").trim();
            const rWaktu = String(row[1] || "").trim();
            const rNIS = cleanNIS(row[2]);
            const rNama = String(row[3] || "").trim();
            const rKelas = String(row[4] || "").trim();
            const rMapel = String(row[5] || "").trim();
            const rJamKe = String(row[6] || "").trim();
            const rStatus = String(row[7] || "").trim();

            if (!rNIS) continue;

            if (tanggal && rTanggal !== tanggal) continue;
            if (kelasFilter !== "SEMUA" && rKelas !== kelasFilter) continue;
            if (mapelFilter && !rMapel.toLowerCase().includes(mapelFilter.toLowerCase())) continue;
            if (jamKeFilter && rJamKe !== jamKeFilter) continue;

            records.push({
                tanggal: rTanggal,
                waktu: rWaktu,
                nis: rNIS,
                nama: rNama,
                kelas: rKelas,
                mapel: rMapel,
                jamKe: rJamKe,
                status: rStatus
            });

        }

        // Terbaru dulu (urut dari waktu discan).
        records.sort((a, b) => (a.waktu < b.waktu ? 1 : -1));

        // ---------- Total siswa di kelas terpilih ----------
        let totalSiswaKelas = null;

        if (kelasFilter !== "SEMUA") {
            totalSiswaKelas = students.filter((s) => s.kelas === kelasFilter).length;
        }

        // ---------- Siswa yang belum absen (hanya kalau sesi spesifik dipilih) ----------
        let siswaBelumAbsen = null;

        if (kelasFilter !== "SEMUA" && mapelFilter && jamKeFilter) {

            const hadirSet = new Set(records.map((r) => r.nis));

            siswaBelumAbsen = students
                .filter((s) => s.kelas === kelasFilter && !hadirSet.has(s.nis))
                .map((s) => ({ nis: s.nis, nama: s.nama }));

        }

        res.status(200).json({
            success: true,
            configured: true,
            message: `Berhasil memuat ${records.length} data kehadiran.`,
            data: {
                filters: { tanggal, kelas: kelasFilter, mapel: mapelFilter, jamKe: jamKeFilter },
                kelasList,
                totalSiswaKelas,
                records,
                totalRecords: records.length,
                siswaBelumAbsen
            }
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            configured: true,
            message: err.message || "Terjadi kesalahan pada server.",
            data: null
        });

    }

};
