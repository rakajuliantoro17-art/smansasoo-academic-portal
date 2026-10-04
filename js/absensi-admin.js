/*
==========================================================
SMANSASOO Academic Portal
Absensi Admin (Generate QR) Script
Version : 1.1.0
==========================================================
Ambil daftar siswa dari /api/absensi-students, lalu generate
QR code per siswa di browser memakai library "qrcode"
(window.QRCode.toCanvas). Isi QR adalah JSON kecil bertanda
khusus supaya QR acak lain tidak diterima oleh
pages/absensi-scan.html:

  {"t":"SMANSASOO-ABSEN","nis":"<NIS>"}

CHANGELOG (v1.1.0):
- Library QR dijamin tersedia: kalau window.QRCode.toCanvas
  tidak ada (CDN gagal dimuat, diblokir, atau library lain
  yang dimuat -- mis. "qrcodejs" yang tidak punya toCanvas),
  otomatis memuat salinan lokal /js/vendor/qrcode.min.js.
  Sebelumnya kegagalan ini DIAM-DIAM: kartu muncul tanpa QR.
- Semua kegagalan sekarang tampil jelas di #absensiAdminStatus
  (API bukan JSON, status HTTP salah, library QR gagal, dst.).
- Kartu dirender bertahap (per 40) supaya halaman tidak macet
  untuk ratusan siswa. Tombol cetak menunggu semua QR selesai.
- Pesan error tidak lagi disisipkan sebagai HTML (anti-XSS).
==========================================================
*/

(function () {

    const QR_FALLBACK_SRC = "/js/vendor/qrcode.min.js";
    const BATCH_SIZE = 40;

    const grid = document.getElementById("absensiAdminGrid");
    const status = document.getElementById("absensiAdminStatus");
    const countLabel = document.getElementById("absensiAdminCount");
    const searchInput = document.getElementById("absensiAdminSearch");
    const printBtn = document.getElementById("absensiAdminPrintBtn");

    let allStudents = [];
    let renderToken = 0;
    let rendering = false;

    function setStatus(message, type) {

        if (!status) return;

        status.textContent = "";

        if (!message) {
            status.style.display = "none";
            return;
        }

        const card = document.createElement("div");
        card.className = "error-card";
        card.textContent = message;

        status.appendChild(card);
        status.style.display = type === "error" ? "block" : "none";

    }

    function setCount(text) {

        if (countLabel) countLabel.textContent = text;

    }

    function qrPayload(nis) {

        return JSON.stringify({ t: "SMANSASOO-ABSEN", nis: String(nis) });

    }

    /* ==========================================
       LIBRARY QR
    ========================================== */

    function hasQr() {

        return !!(window.QRCode && typeof window.QRCode.toCanvas === "function");

    }

    function loadScript(src) {

        return new Promise((resolve, reject) => {

            const s = document.createElement("script");
            s.src = src;
            s.onload = resolve;
            s.onerror = () => reject(new Error("Gagal memuat " + src));
            document.head.appendChild(s);

        });

    }

    async function ensureQr() {

        if (hasQr()) return;

        console.warn("QRCode.toCanvas tidak tersedia dari CDN -- memakai salinan lokal.");

        await loadScript(QR_FALLBACK_SRC);

        if (!hasQr()) {
            throw new Error("Library QR tidak bisa dipakai (QRCode.toCanvas tidak ditemukan).");
        }

    }

    function drawQr(canvas, nis) {

        return new Promise((resolve, reject) => {

            window.QRCode.toCanvas(canvas, qrPayload(nis), { width: 220, margin: 1 }, (err) => {

                if (err) reject(err);
                else resolve();

            });

        });

    }

    /* ==========================================
       RENDER
    ========================================== */

    function buildCard(student) {

        const card = document.createElement("div");
        card.className = "absensi-qr-card";

        const canvas = document.createElement("canvas");
        card.appendChild(canvas);

        const nama = document.createElement("h4");
        nama.textContent = student.nama;
        card.appendChild(nama);

        const kelas = document.createElement("p");
        kelas.textContent = student.kelas || "-";
        card.appendChild(kelas);

        const nis = document.createElement("p");
        nis.className = "absensi-qr-nis";
        nis.textContent = "NIS: " + student.nis;
        card.appendChild(nis);

        return { card, canvas };

    }

    function nextFrame() {

        return new Promise((resolve) => requestAnimationFrame(() => resolve()));

    }

    async function renderGrid(students) {

        if (!grid) return;

        const token = ++renderToken;

        grid.innerHTML = "";

        if (!students.length) {

            const p = document.createElement("p");
            p.style.cssText = "grid-column:1/-1;text-align:center;color:var(--text-muted);";
            p.textContent = "Tidak ada siswa yang cocok.";
            grid.appendChild(p);

            return;

        }

        rendering = true;

        if (printBtn) printBtn.disabled = true;

        let failed = 0;

        for (let i = 0; i < students.length; i += BATCH_SIZE) {

            // pencarian baru dimulai -> hentikan render lama
            if (token !== renderToken) return;

            const batch = students.slice(i, i + BATCH_SIZE);
            const jobs = [];

            batch.forEach((student) => {

                const { card, canvas } = buildCard(student);

                grid.appendChild(card);

                jobs.push(
                    drawQr(canvas, student.nis).catch((err) => {

                        failed++;
                        console.warn("Gagal generate QR untuk", student.nis, err);

                    })
                );

            });

            await Promise.all(jobs);
            await nextFrame();

        }

        if (token !== renderToken) return;

        rendering = false;

        if (printBtn) printBtn.disabled = false;

        if (failed) {
            setStatus(failed + " QR gagal dibuat. Buka Console (F12) untuk detailnya.", "error");
        }

    }

    function applyFilter() {

        const keyword = (searchInput && searchInput.value || "").trim().toLowerCase();

        const filtered = !keyword
            ? allStudents
            : allStudents.filter((s) =>
                s.nama.toLowerCase().includes(keyword)
                || s.nis.toLowerCase().includes(keyword)
                || s.kelas.toLowerCase().includes(keyword)
            );

        setCount(filtered.length + " dari " + allStudents.length + " siswa");

        return renderGrid(filtered);

    }

    /* ==========================================
       DATA
    ========================================== */

    async function fetchStudents() {

        const response = await fetch("/api/absensi-students", { cache: "no-store" });
        const raw = await response.text();

        let result;

        try {

            result = JSON.parse(raw);

        } catch (e) {

            throw new Error(
                "Server tidak mengembalikan JSON (HTTP " + response.status + "). "
                + "Cek /api/absensi-students di tab Network."
            );

        }

        return result;

    }

    function normalize(list) {

        return (Array.isArray(list) ? list : []).map((s) => ({
            nis: String(s.nis == null ? "" : s.nis),
            nama: String(s.nama == null ? "" : s.nama),
            kelas: String(s.kelas == null ? "" : s.kelas)
        })).filter((s) => s.nis);

    }

    /* ==========================================
       INIT
    ========================================== */

    async function init() {

        setStatus("");

        try {

            const [result] = await Promise.all([
                fetchStudents(),
                ensureQr()
            ]);

            if (!result.configured) {

                setStatus(result.message || "GOOGLE_SHEET_ID_ABSENSI belum diatur.", "error");
                setCount("Belum dikonfigurasi");
                return;

            }

            if (!result.success) {

                setStatus(result.message || "Gagal memuat data siswa.", "error");
                setCount("Gagal memuat");
                return;

            }

            allStudents = normalize(result.data);

            await applyFilter();

        } catch (err) {

            setStatus("Gagal memuat data siswa: " + err.message, "error");
            setCount("Gagal memuat");

        }

    }

    if (searchInput) {
        searchInput.addEventListener("input", () => { applyFilter(); });
    }

    if (printBtn) {

        printBtn.addEventListener("click", () => {

            if (rendering) return;

            window.print();

        });

    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
