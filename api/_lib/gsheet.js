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
==========================================================
*/

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

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

async function fetchSheetRows(sheetName) {
    if (!SHEET_ID) {
        throw new Error("GOOGLE_SHEET_ID belum diatur di Environment Variable Vercel.");
    }

    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Gagal mengambil sheet "${sheetName}" (HTTP ${response.status}). Pastikan sheet sudah di-share "Anyone with the link".`);
    }

    const text = await response.text();

    return parseCSV(text);
}

module.exports = {
    SHEET_ID,
    SHEET_NAMES,
    cleanNIS,
    parseCSV,
    fetchSheetRows
};
