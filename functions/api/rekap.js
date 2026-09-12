/*
==========================================================
SMANSASOO Academic Portal
API Route: /api/rekap
Version : 1.0.0
==========================================================
Menggantikan Apps Script lama (Dashboard Rekap Nilai Math
Wajib & Lanjutan). Fungsi ini jalan sebagai Vercel Serverless
Function, dipanggil dari browser lewat fetch("/api/rekap?..."),
lalu SERVER (bukan browser) yang mengambil data dari Google
Sheets.

BEDA dengan /api/nilai (functions/api/nilai.js):
- /api/nilai  -> baca spreadsheet GOOGLE_SHEET_ID (nilai per
  siswa untuk keperluan pengumuman kenaikan kelas).
- /api/rekap  -> baca spreadsheet GOOGLE_SHEET_ID_REKAP,
  spreadsheet "Recap Nilai Matematika" yang terpisah, dipakai
  guru/wali kelas untuk rekap & analisis kelas.

Spreadsheet rekap HARUS di-share "Anyone with the link -
Viewer" (atau published to web), supaya bisa dibaca lewat
endpoint gviz tanpa OAuth. ID-nya disimpan di Environment
Variable Vercel (GOOGLE_SHEET_ID_REKAP), bukan di kode,
supaya tidak kelihatan di GitHub yang publik.

Logic pencocokan & perhitungan sengaja dibuat identik dengan
Code.gs lama (searchStudentByNIS, getClassList,
getClassSummary), supaya hasilnya konsisten dengan dashboard
Apps Script yang sudah jalan sebelumnya.

ACTIONS (query param "action"):
- student  : cek nilai satu siswa berdasarkan NIS (?keyword=)
- classes  : daftar kelas yang tersedia di semua sheet
- summary  : rekap rata-rata satu kelas / semua kelas untuk
             satu mapel (?kelas=&mapel=WAJIB|LANJUTAN)
==========================================================
*/

const SHEET_ID = process.env.GOOGLE_SHEET_ID_REKAP;

const SHEET_NAMES = {
    wajib: "NIlai Math Wajib Kelas XI",
    lanjutan: "Nilai Math Lanjutan Kelas XI",
    raport: "Nilai Input Raport"
};

// Index kolom (0-based) yang dianggap "komponen penilaian"
// dipakai untuk menghitung progress kelengkapan nilai per
// siswa di getClassSummary. Sama persis dengan urutan di
// Code.gs lama: BA1-4, FK1-4, BAUH, FKUH, UTS, SAS.
const ASSESSMENT_COLUMNS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 17];

function cleanNIS(val) {

    if (val === null || val === undefined) return "";

    const str = String(val).trim();

    return str.includes(".") ? str.split(".")[0] : str;

}

/**
 * Parser CSV kecil, menangani field yang dibungkus tanda kutip
 * (termasuk koma dan baris baru di dalam kutip).
 */
function parseCSV(text) {

    const rows = [];

    let row = [];

    let field = "";

    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {

        const char = text[i];

        const next = text[i + 1];

        if (inQuotes) {

            if (char === '"' && next === '"') {
                field += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                field += char;
            }

        } else {

            if (char === '"') {
                inQuotes = true;
            } else if (char === ",") {
                row.push(field);
                field = "";
            } else if (char === "\r") {
                // dilewati
            } else if (char === "\n") {
                row.push(field);
                rows.push(row);
                row = [];
                field = "";
            } else {
                field += char;
            }

        }

    }

    if (field.length || row.length) {
        row.push(field);
        rows.push(row);
    }

    return rows;

}

async function fetchSheetRows(sheetName) {

    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Gagal mengambil sheet "${sheetName}" (HTTP ${response.status}). Pastikan spreadsheet rekap sudah di-share "Anyone with the link".`);
    }

    const text = await response.text();

    return parseCSV(text);

}

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

/* ==========================================================
   ACTION: student
   Setara Code.gs -> searchStudentByNIS()
========================================================== */

async function actionStudent(keyword) {

    const targetNIS = cleanNIS(keyword);

    if (!targetNIS) {
        return { success: false, message: "Keyword (NIS) tidak boleh kosong." };
    }

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
        return { success: false, message: `Siswa dengan NIS "${targetNIS}" tidak ditemukan.` };
    }

    return { success: true, message: "Data berhasil ditemukan.", data: subjects };

}

/* ==========================================================
   ACTION: classes
   Setara Code.gs -> getClassList()
========================================================== */

async function actionClasses() {

    const sheetNameList = [SHEET_NAMES.wajib, SHEET_NAMES.lanjutan, SHEET_NAMES.raport];

    const rowsList = await Promise.all(
        sheetNameList.map((name) => fetchSheetRows(name).catch(() => []))
    );

    const classes = [];

    rowsList.forEach((rows) => {

        for (let i = 1; i < rows.length; i++) {

            const kelas = String(rows[i][1] || "").trim();

            if (kelas && kelas !== "Kelas" && !classes.includes(kelas)) {
                classes.push(kelas);
            }

        }

    });

    classes.sort();

    return { success: true, data: classes };

}

/* ==========================================================
   ACTION: summary
   Setara Code.gs -> getClassSummary()
========================================================== */

async function actionSummary(kelasInput, mapelInput) {

    const targetKelas = (kelasInput || "SEMUA").toString().trim() || "SEMUA";

    const targetMapel = (mapelInput || "WAJIB").toString().trim().toUpperCase();

    const sheetName = targetMapel === "LANJUTAN" ? SHEET_NAMES.lanjutan : SHEET_NAMES.wajib;

    const [dataRows, raportRows] = await Promise.all([
        fetchSheetRows(sheetName).catch(() => []),
        fetchSheetRows(SHEET_NAMES.raport).catch(() => [])
    ]);

    if (dataRows.length === 0) {
        return { success: false, message: `Sheet "${sheetName}" tidak ditemukan atau kosong.` };
    }

    const raportMap = {};

    for (let j = 1; j < raportRows.length; j++) {

        const nis = cleanNIS(raportRows[j][2]);

        const val = raportRows[j][4];

        if (nis && val !== "" && val !== null && val !== undefined) {
            raportMap[nis] = val;
        }

    }

    const studentList = [];

    let totalRaport = 0, countRaport = 0;
    let totalUTS = 0, countUTS = 0;
    let totalSAS = 0, countSAS = 0;
    let totalProgress = 0;

    for (let i = 1; i < dataRows.length; i++) {

        const row = dataRows[i];

        const kelas = String(row[1] || "").trim();

        if (targetKelas !== "SEMUA" && kelas !== targetKelas) continue;

        const nis = cleanNIS(row[2]);

        const nama = row[3];

        const uts = Number(row[16]) || 0;

        const sas = Number(row[17]) || 0;

        const rVal = raportMap[nis] !== undefined && raportMap[nis] !== null ? raportMap[nis] : "-";

        const numRaport = parseFloat(rVal);

        let doneCount = 0;

        ASSESSMENT_COLUMNS.forEach((idx) => {
            if (row[idx] !== "" && row[idx] !== null && row[idx] !== undefined && Number(row[idx]) > 0) {
                doneCount++;
            }
        });

        const progress = Math.round((doneCount / ASSESSMENT_COLUMNS.length) * 100);

        if (!isNaN(numRaport) && numRaport > 0) {
            totalRaport += numRaport;
            countRaport++;
        }

        if (uts > 0) { totalUTS += uts; countUTS++; }

        if (sas > 0) { totalSAS += sas; countSAS++; }

        totalProgress += progress;

        studentList.push({
            nis,
            nama,
            kelas,
            raport: rVal,
            uts: uts > 0 ? uts : "-",
            sas: sas > 0 ? sas : "-",
            progress
        });

    }

    return {
        success: true,
        data: {
            kelas: targetKelas,
            mapel: targetMapel === "LANJUTAN" ? "Matematika Lanjutan" : "Matematika Wajib",
            totalSiswa: studentList.length,
            avgRaport: countRaport > 0 ? (totalRaport / countRaport).toFixed(1) : "-",
            avgUTS: countUTS > 0 ? (totalUTS / countUTS).toFixed(1) : "-",
            avgSAS: countSAS > 0 ? (totalSAS / countSAS).toFixed(1) : "-",
            avgProgress: studentList.length > 0 ? Math.round(totalProgress / studentList.length) : 0,
            students: studentList
        }
    };

}

/* ==========================================================
   HANDLER
========================================================== */

module.exports = async (req, res) => {

    res.setHeader("Cache-Control", "no-store");

    if (!SHEET_ID) {
        res.status(500).json({ success: false, message: "GOOGLE_SHEET_ID_REKAP belum diatur di Environment Variable Vercel." });
        return;
    }

    const action = (req.query.action || "student").toString().trim().toLowerCase();

    try {

        let result;

        if (action === "student") {

            result = await actionStudent(req.query.keyword);

        } else if (action === "classes") {

            result = await actionClasses();

        } else if (action === "summary") {

            result = await actionSummary(req.query.kelas, req.query.mapel);

        } else {

            res.status(400).json({ success: false, message: `Action "${action}" tidak dikenali.` });

            return;

        }

        const status = result.success ? 200 : (action === "student" ? 200 : 400);

        res.status(status).json(result);

    } catch (err) {

        res.status(500).json({ success: false, message: err.message || "Terjadi kesalahan pada server." });

    }

};
