/*
==========================================================
SMANSASOO Academic Portal
API Route: /api/kelas-summary
Version : 1.0.0
==========================================================
Menggantikan Apps Script (Code.gs -> getClassSummary).
Dipanggil dari browser lewat:
  fetch("/api/kelas-summary?kelas=SEMUA&mapel=WAJIB")
  fetch("/api/kelas-summary?kelas=XI-1&mapel=LANJUTAN")

Parameter:
- kelas : nama kelas persis seperti di sheet, atau "SEMUA"
- mapel : "WAJIB" (default) atau "LANJUTAN"

Kolom index (0-based) di sheet Wajib/Lanjutan mengikuti
struktur yang sama dengan Code.gs:
  1  = Kelas
  2  = NIS
  3  = Nama
  4-11  = 8 tugas
  12 = UH pertama
  14 = UH kedua
  16 = UTS
  17 = SAS
Total 12 komponen dipakai untuk progress (index 4-12,14,16,17).
==========================================================
*/

const { SHEET_NAMES, cleanNIS, fetchSheetRows, SHEET_ID } = require("./_lib/gsheet");

const PROGRESS_COLUMNS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 17];

module.exports = async (req, res) => {
    res.setHeader("Cache-Control", "no-store");

    if (!SHEET_ID) {
        res.status(500).json({ success: false, message: "GOOGLE_SHEET_ID belum diatur di Environment Variable Vercel." });
        return;
    }

    const targetKelas = (req.query.kelas || "SEMUA").toString().trim() || "SEMUA";
    const targetMapel = (req.query.mapel || "WAJIB").toString().trim().toUpperCase();

    const sheetName = targetMapel === "LANJUTAN" ? SHEET_NAMES.lanjutan : SHEET_NAMES.wajib;

    try {
        const [dataRows, raportRows] = await Promise.all([
            fetchSheetRows(sheetName),
            fetchSheetRows(SHEET_NAMES.raport).catch(() => [])
        ]);

        const raportMap = {};

        for (let j = 1; j < raportRows.length; j++) {
            const nR = cleanNIS(raportRows[j][2]);
            const valR = raportRows[j][4];

            if (nR && valR !== "" && valR !== null && valR !== undefined) {
                raportMap[nR] = valR;
            }
        }

        const students = [];
        let totalR = 0, countR = 0;
        let totalUTS = 0, countUTS = 0;
        let totalSAS = 0, countSAS = 0;
        let totalProg = 0;

        for (let i = 1; i < dataRows.length; i++) {
            const row = dataRows[i];
            const kelas = String(row[1] || "").trim();

            if (!kelas || kelas === "Kelas") continue;

            if (targetKelas === "SEMUA" || kelas === targetKelas) {
                const nis = cleanNIS(row[2]);
                const nama = row[3];
                const uts = Number(row[16]) || 0;
                const sas = Number(row[17]) || 0;

                const rVal = raportMap[nis] !== undefined && raportMap[nis] !== null ? raportMap[nis] : "-";
                const numR = parseFloat(rVal);

                let doneCount = 0;
                PROGRESS_COLUMNS.forEach((idx) => {
                    if (row[idx] !== "" && row[idx] !== null && row[idx] !== undefined && Number(row[idx]) > 0) {
                        doneCount++;
                    }
                });
                const prog = Math.round((doneCount / PROGRESS_COLUMNS.length) * 100);

                if (!isNaN(numR) && numR > 0) {
                    totalR += numR;
                    countR++;
                }
                if (uts > 0) { totalUTS += uts; countUTS++; }
                if (sas > 0) { totalSAS += sas; countSAS++; }
                totalProg += prog;

                students.push({
                    nis,
                    nama,
                    kelas,
                    raport: rVal,
                    uts: uts > 0 ? uts : "-",
                    sas: sas > 0 ? sas : "-",
                    progress: prog
                });
            }
        }

        res.status(200).json({
            success: true,
            message: "Rekap kelas berhasil diambil.",
            data: {
                totalSiswa: students.length,
                avgRaport: countR > 0 ? (totalR / countR).toFixed(1) : "-",
                avgUTS: countUTS > 0 ? (totalUTS / countUTS).toFixed(1) : "-",
                avgSAS: countSAS > 0 ? (totalSAS / countSAS).toFixed(1) : "-",
                avgProgress: students.length > 0 ? Math.round(totalProg / students.length) : 0,
                students
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || "Terjadi kesalahan pada server." });
    }
};
