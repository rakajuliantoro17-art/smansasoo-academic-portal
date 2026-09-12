/*
==========================================================
SMANSASOO Academic Portal
API Route: /api/nilai
Version : 1.1.0
==========================================================
Menggantikan Apps Script (Code.gs -> searchStudentByNIS).
Dipanggil dari browser lewat fetch("/api/nilai?keyword=...").
Server (bukan browser) yang mengambil data dari Google Sheets.

Spreadsheet HARUS di-share "Anyone with the link - Viewer".
ID spreadsheet-nya disimpan di Environment Variable Vercel
(GOOGLE_SHEET_ID), bukan di kode, supaya tidak kelihatan di
GitHub yang publik.

CHANGELOG (v1.1.0):
- File dipindah dari functions/api/nilai.js ke api/nilai.js.
  Vercel HANYA membaca serverless function dari folder /api
  di root project; folder functions/api/ tidak pernah
  ke-deploy sehingga endpoint lama ini sebenarnya 404 di
  production. Logic-nya tidak berubah.
- Logic fetch & parse CSV dipindah ke api/_lib/gsheet.js
  supaya dipakai bareng dengan /api/kelas-list dan
  /api/kelas-summary (menggantikan getClassList &
  getClassSummary di Code.gs).
==========================================================
*/

const { SHEET_NAMES, cleanNIS, fetchSheetRows, SHEET_ID } = require("./_lib/gsheet");

function parseSubjectData(mapelTitle, kelas, nis, nama, assessments, nilaiRaport) {
    let completedCount = 0;
    const missingList = [];
    const details = [];

    assessments.forEach((item) => {
        const score = item.val;
        const isDone = score !== "" && score !== null && score !== undefined && Number(score) > 0;

        if (isDone) {
            completedCount++;
            details.push({ code: item.code, name: item.name, score, remed: item.remed || "-", status: "Selesai" });
        } else {
            missingList.push(item.name);
            details.push({ code: item.code, name: item.name, score: 0, remed: item.remed || "-", status: "Belum Ada Nilai" });
        }
    });

    return {
        mapel: mapelTitle,
        kelas,
        nis,
        nama,
        nilaiRaport,
        progress: Math.round((completedCount / assessments.length) * 100),
        completedCount,
        totalAssessments: assessments.length,
        missingList,
        details
    };
}

module.exports = async (req, res) => {
    res.setHeader("Cache-Control", "no-store");

    if (!SHEET_ID) {
        res.status(500).json({ success: false, message: "GOOGLE_SHEET_ID belum diatur di Environment Variable Vercel." });
        return;
    }

    const keyword = (req.query.keyword || "").toString().trim();

    if (!keyword) {
        res.status(400).json({ success: false, message: "Keyword (NIS) tidak boleh kosong." });
        return;
    }

    const targetNIS = cleanNIS(keyword);

    try {
        const [wajibRows, lanjutanRows, raportRows] = await Promise.all([
            fetchSheetRows(SHEET_NAMES.wajib).catch(() => []),
            fetchSheetRows(SHEET_NAMES.lanjutan).catch(() => []),
            fetchSheetRows(SHEET_NAMES.raport).catch(() => [])
        ]);

        let nilaiRaport = "-";

        for (let j = 1; j < raportRows.length; j++) {
            if (cleanNIS(raportRows[j][2]) === targetNIS) {
                const val = raportRows[j][4];
                nilaiRaport = val !== undefined && val !== "" ? val : "-";
                break;
            }
        }

        const subjects = [];

        for (let i = 1; i < wajibRows.length; i++) {
            const row = wajibRows[i];

            if (cleanNIS(row[2]) === targetNIS) {
                const list = [
                    { code: "BA1", name: "Tugas 1 - Bunga & Anuitas", val: row[4] },
                    { code: "BA2", name: "Tugas 2 - Bunga & Anuitas", val: row[5] },
                    { code: "BA3", name: "Tugas 3 - Bunga & Anuitas", val: row[6] },
                    { code: "BA4", name: "Tugas 4 - Bunga & Anuitas", val: row[7] },
                    { code: "FK1", name: "Tugas 1 - Fungsi Komposisi", val: row[8] },
                    { code: "FK2", name: "Tugas 2 - Fungsi Komposisi", val: row[9] },
                    { code: "FK3", name: "Tugas 3 - Fungsi Komposisi", val: row[10] },
                    { code: "FK4", name: "Tugas 4 - Fungsi Komposisi", val: row[11] },
                    { code: "BAUH", name: "UH - Bunga & Anuitas", val: row[12], remed: row[13] },
                    { code: "FKUH", name: "UH - Fungsi Komposisi", val: row[14], remed: row[15] },
                    { code: "UTS", name: "UTS", val: row[16] },
                    { code: "SAS", name: "SAS", val: row[17], remed: row[18] }
                ];

                subjects.push(parseSubjectData("Matematika Wajib", row[1], row[2], row[3], list, nilaiRaport));
                break;
            }
        }

        for (let i = 1; i < lanjutanRows.length; i++) {
            const row = lanjutanRows[i];

            if (cleanNIS(row[2]) === targetNIS) {
                const list = [
                    { code: "P1", name: "Tugas 1 - Polinomial", val: row[4] },
                    { code: "P2", name: "Tugas 2 - Polinomial", val: row[5] },
                    { code: "P3", name: "Tugas 3 - Polinomial", val: row[6] },
                    { code: "P4", name: "Tugas 4 - Polinomial", val: row[7] },
                    { code: "M1", name: "Tugas 1 - Matriks", val: row[8] },
                    { code: "M2", name: "Tugas 2 - Matriks", val: row[9] },
                    { code: "M3", name: "Tugas 3 - Matriks", val: row[10] },
                    { code: "M4", name: "Tugas 4 - Matriks", val: row[11] },
                    { code: "PUH", name: "UH - Polinomial", val: row[12], remed: row[13] },
                    { code: "MUH", name: "UH - Matriks", val: row[14], remed: row[15] },
                    { code: "UTS", name: "UTS", val: row[16] },
                    { code: "SAS", name: "SAS", val: row[17], remed: row[18] }
                ];

                subjects.push(parseSubjectData("Matematika Lanjutan", row[1], row[2], row[3], list, nilaiRaport));
                break;
            }
        }

        if (subjects.length === 0) {
            res.status(200).json({ success: false, message: `Siswa dengan NIS "${targetNIS}" tidak ditemukan.` });
            return;
        }

        res.status(200).json({ success: true, message: "Data berhasil ditemukan.", data: subjects });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || "Terjadi kesalahan pada server." });
    }
};
