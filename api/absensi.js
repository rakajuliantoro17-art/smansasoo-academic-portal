/*
==========================================================
SMANSASOO Academic Portal
API Route: /api/absensi
Version : 1.0.0
==========================================================
Dipanggil oleh pages/absensi-scan.html setiap kali kamera
berhasil membaca QR code seorang siswa. Mencatat satu baris
log kehadiran PER JAM PELAJARAN ke sheet "ABSENSI" di
spreadsheet khusus absensi (GOOGLE_SHEET_ID_ABSENSI).

Beda dengan endpoint lain di /api, endpoint ini MENULIS ke
Google Sheets (bukan cuma baca), jadi butuh Service Account
-- lihat komentar setup di api/_lib/gsheet-write.js.

Skema sheet "STUDENTS" (baca saja, baris 1 = header):
  A: NIS | B: Nama | C: Kelas

Skema sheet "ABSENSI" (ditulis otomatis, baris 1 = header
HARUS dibuat manual sekali oleh staf sebelum dipakai):
  A: Tanggal | B: Waktu | C: NIS | D: Nama | E: Kelas
  F: Mapel | G: Jam Ke | H: Status

Body request (POST, JSON):
  { "nis": "12345", "mapel": "Matematika", "jamKe": "3" }

Response:
  { success, status: "recorded" | "duplicate" | "not_found",
    message, data: { nama, kelas } }
==========================================================
*/

const { fetchSheetRows, cleanNIS } = require("./_lib/gsheet");
const { appendRow } = require("./_lib/gsheet-write");

const SHEET_STUDENTS = "STUDENTS";
const SHEET_ABSENSI = "ABSENSI";

function todayPartsJakarta() {

    const now = new Date();

    const tanggal = now.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }); // YYYY-MM-DD

    const waktu = now.toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    return { tanggal, waktu };

}

function readBody(req) {

    if (req.body && typeof req.body === "object") return req.body;

    if (typeof req.body === "string" && req.body.trim()) {

        try {
            return JSON.parse(req.body);
        } catch {
            return {};
        }

    }

    return {};

}

module.exports = async (req, res) => {

    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        res.status(405).json({ success: false, message: "Method tidak didukung, gunakan POST." });
        return;
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID_ABSENSI;

    if (!spreadsheetId) {
        res.status(200).json({
            success: false,
            status: "not_configured",
            message: "GOOGLE_SHEET_ID_ABSENSI belum diatur di Environment Variable Vercel."
        });
        return;
    }

    const body = readBody(req);

    const nis = cleanNIS(body.nis);
    const mapel = String(body.mapel || "").trim();
    const jamKe = String(body.jamKe || "").trim();

    if (!nis) {
        res.status(400).json({ success: false, status: "invalid", message: "QR tidak valid / NIS kosong." });
        return;
    }

    if (!mapel || !jamKe) {
        res.status(400).json({ success: false, status: "invalid", message: "Sesi (mapel & jam ke-) belum dipilih." });
        return;
    }

    try {

        // 1) Cari siswa dari sheet STUDENTS.
        const studentRows = await fetchSheetRows(SHEET_STUDENTS, spreadsheetId);

        let student = null;

        for (let i = 1; i < studentRows.length; i++) {

            const row = studentRows[i];

            if (cleanNIS(row[0]) === nis) {

                student = {
                    nis,
                    nama: String(row[1] || "").trim(),
                    kelas: String(row[2] || "").trim()
                };

                break;

            }

        }

        if (!student) {
            res.status(200).json({
                success: false,
                status: "not_found",
                message: "NIS tidak terdaftar di data siswa."
            });
            return;
        }

        const { tanggal, waktu } = todayPartsJakarta();

        // 2) Cek duplikat: NIS yang sama, tanggal + mapel + jam ke
        //    yang sama, supaya satu siswa tidak tercatat dobel
        //    dalam satu sesi jam pelajaran.
        const absensiRows = await fetchSheetRows(SHEET_ABSENSI, spreadsheetId);

        const isDuplicate = absensiRows.slice(1).some((row) => {

            const rowTanggal = String(row[0] || "").trim();
            const rowNIS = cleanNIS(row[2]);
            const rowMapel = String(row[5] || "").trim();
            const rowJamKe = String(row[6] || "").trim();

            return rowTanggal === tanggal
                && rowNIS === nis
                && rowMapel.toLowerCase() === mapel.toLowerCase()
                && rowJamKe === jamKe;

        });

        if (isDuplicate) {
            res.status(200).json({
                success: true,
                status: "duplicate",
                message: `${student.nama} sudah tercatat hadir untuk sesi ini.`,
                data: { nama: student.nama, kelas: student.kelas }
            });
            return;
        }

        // 3) Tulis baris baru.
        await appendRow(spreadsheetId, SHEET_ABSENSI, [
            tanggal,
            waktu,
            student.nis,
            student.nama,
            student.kelas,
            mapel,
            jamKe,
            "Hadir"
        ]);

        res.status(200).json({
            success: true,
            status: "recorded",
            message: `${student.nama} berhasil dicatat hadir.`,
            data: { nama: student.nama, kelas: student.kelas }
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            status: "error",
            message: err.message || "Terjadi kesalahan pada server."
        });

    }

};
