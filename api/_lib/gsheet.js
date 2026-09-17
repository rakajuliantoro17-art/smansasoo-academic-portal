/*
==========================================================
SMANSASOO Academic Portal
Shared Library: Google Sheets Reader
Version : 1.0.0
==========================================================
Dipakai bersama oleh semua endpoint di /api (nilai.js,
kelas-list.js, kelas-summary.js) supaya logic pengambilan
data dari Google Sheets dan parsing CSV tidak diduplikasi
di setiap file.

Cara kerja:
- Spreadsheet TIDAK perlu "Publish to web". Cukup di-share
  dengan opsi "Anyone with the link - Viewer".
- Server (function ini) mengambil tiap sheet lewat endpoint
  gviz/tq milik Google, yang mengembalikan CSV per nama sheet.
  ID spreadsheet dibaca dari Environment Variable Vercel
  (GOOGLE_SHEET_ID), tidak pernah ditulis di kode maupun
  dikirim ke browser.

CHANGELOG (v1.1.0):
- Tambah dukungan MULTI TAHUN AJARAN untuk modul Nilai.
  Tiap tahun ajaran boleh punya spreadsheet sendiri lewat
  Environment Variable GOOGLE_SHEET_ID_<TAHUN> (mis.
  GOOGLE_SHEET_ID_2026). resolveSheetId(tahun) mencari env
  var itu dulu; kalau tidak ada (atau tahun tidak dikirim),
  otomatis jatuh ke GOOGLE_SHEET_ID biasa supaya endpoint
  lama yang belum kirim ?tahun= tetap jalan seperti sebelumnya.
  fetchSheetRows() sekarang menerima sheetId opsional sebagai
  parameter kedua; kalau tidak diisi, pakai SHEET_ID default
  (perilaku lama, tidak breaking).
==========================================================
*/

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

/**
 * Cari ID spreadsheet untuk satu tahun ajaran tertentu.
 * Urutan pencarian:
 *  1. Environment Variable GOOGLE_SHEET_ID_<TAHUN> (spesifik tahun itu)
 *  2. GOOGLE_SHEET_ID (default / tahun berjalan)
 *
 * Dipakai supaya tahun ajaran lama & baru bisa disimpan di
 * spreadsheet yang berbeda tanpa mengubah kode -- cukup tambah
 * Environment Variable baru di Vercel Dashboard.
 */
function resolveSheetId(tahun) {

    const cleanTahun = (tahun === null || tahun === undefined)
        ? ""
        : String(tahun).trim();

    if (cleanTahun && /^[0-9]{4}$/.test(cleanTahun)) {

        const specific = process.env[`GOOGLE_SHEET_ID_${cleanTahun}`];

        if (specific) return specific;

    }

    return SHEET_ID;

}

const SHEET_NAMES = {
    wajib: "NIlai Math Wajib Kelas XI",
    lanjutan: "Nilai Math Lanjutan Kelas XI",
    raport: "Nilai Input Raport"
};

function cleanNIS(val) {
    if (val === null || val === undefined) return "";
    const str = String(val).trim();
    return str.includes(".") ? str.split(".")[0] : str;
}

/**
 * Parser CSV kecil, menangani field yang dibungkus tanda kutip
 * (termasuk koma dan baris baru di dalam kutip), karena Nama
 * atau catatan remedial bisa saja mengandung koma.
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

async function fetchSheetRows(sheetName, sheetId) {

    const targetSheetId = sheetId || SHEET_ID;

    if (!targetSheetId) {
        throw new Error("GOOGLE_SHEET_ID belum diatur di Environment Variable Vercel.");
    }

    const url = `https://docs.google.com/spreadsheets/d/${targetSheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Gagal mengambil sheet "${sheetName}" (HTTP ${response.status}). Pastikan sheet sudah di-share "Anyone with the link".`);
    }

    const text = await response.text();

    return parseCSV(text);
}

/**
 * Dipakai oleh modul lain (kenaikan.js, kelulusan.js) yang tiap
 * spreadsheet-nya cuma punya SATU tab relevan, jadi lebih praktis
 * dirujuk pakai gid (angka di URL setelah #gid=...) daripada nama
 * tab persis.
 */
async function fetchRowsByGid(sheetId, gid) {
    if (!sheetId) {
        throw new Error("ID spreadsheet belum diatur di Environment Variable Vercel.");
    }

    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Gagal mengambil sheet gid=${gid} (HTTP ${response.status}). Pastikan sheet sudah di-share "Anyone with the link".`);
    }

    const text = await response.text();

    return parseCSV(text);
}

module.exports = {
    SHEET_ID,
    SHEET_NAMES,
    cleanNIS,
    parseCSV,
    resolveSheetId,
    fetchSheetRows,
    fetchRowsByGid
};
