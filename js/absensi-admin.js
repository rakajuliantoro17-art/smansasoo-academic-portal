/*
==========================================================
SMANSASOO Academic Portal
Absensi Admin (Generate QR) Script
Version : 1.2.0
==========================================================
Ambil daftar siswa dari /api/absensi-students, lalu generate
QR code per siswa di browser memakai library "qrcode"
(window.QRCode). Isi QR adalah JSON kecil bertanda khusus
supaya QR acak lain tidak diterima oleh
pages/absensi-scan.html:

  {"t":"SMANSASOO-ABSEN","nis":"<NIS>"}

CHANGELOG (v1.2.0):
- Tombol Cetak sekarang TIDAK mencetak tampilan layar. Yang
  dicetak adalah lembar kartu absen (format kartu pelajar,
  54 x 85,6 mm, 9 kartu per lembar A4) berisi: header
  "KARTU ABSEN SISWA", nama siswa, dan QR code. Hanya siswa
  yang sedang tampil (hasil pencarian) yang dicetak, jadi
  ketik mis. "X 1" di kolom cari untuk mencetak satu kelas.
- QR untuk cetak dibuat beresolusi tinggi (512 px) agar tajam
  di kertas; QR di layar tetap kecil supaya ringan.
- Lembar cetak dibuat sesaat sebelum print dan dihapus lagi
  setelahnya (tidak membebani halaman).

CHANGELOG (v1.1.0):
- Library QR dijamin tersedia: kalau window.QRCode.toCanvas
  tidak ada (CDN gagal / library lain yang dimuat), otomatis
  memuat salinan lokal /js/vendor/qrcode.min.js.
- Semua kegagalan tampil jelas di #absensiAdminStatus.
- Kartu di layar dirender bertahap (per 40).
==========================================================
*/

(function () {

    const QR_FALLBACK_SRC = "/js/vendor/qrcode.min.js";
    const LOGO_SRC = "/assets/logo/logo.png";
    const BATCH_SIZE = 40;
    const CARDS_PER_PAGE = 9;           // 3 x 3 di A4
    const PRINT_QR_SIZE = 512;          // px, tajam untuk cetak

    const grid = document.getElementById("absensiAdminGrid");
    const status = document.getElementById("absensiAdminStatus");
    const countLabel = document.getElementById("absensiAdminCount");
    const searchInput = document.getElementById("absensiAdminSearch");
    const printBtn = document.getElementById("absensiAdminPrintBtn");
    const printBtnLabel = printBtn ? printBtn.textContent : "";

    let allStudents = [];
    let visibleStudents = [];
    let renderToken = 0;
    let rendering = false;
    let preparingPrint = false;

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
       RENDER DI LAYAR
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

        if (printBtn && !preparingPrint) printBtn.disabled = false;

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

        visibleStudents = filtered;

        setCount(filtered.length + " dari " + allStudents.length + " siswa");

        return renderGrid(filtered);

    }

    /* ==========================================
       CETAK: LEMBAR KARTU ABSEN
       Ukuran kartu 54 x 85,6 mm (CR80 portrait), 3 x 3
       per lembar A4. Hanya nama + QR (tanpa NIS/kelas).
    ========================================== */

    const PRINT_STYLE_ID = "absensiPrintStyle";
    const PRINT_SHEET_ID = "absensiPrintSheet";

    const PRINT_CSS = `
        @page { size: A4 portrait; margin: 0; }

        #${PRINT_SHEET_ID} { display: none; }

        @media print {

            html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }

            body.printing-kartu > *:not(#${PRINT_SHEET_ID}) { display: none !important; }

            body.printing-kartu #${PRINT_SHEET_ID} { display: block; }

            #${PRINT_SHEET_ID},
            #${PRINT_SHEET_ID} * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                box-sizing: border-box;
            }

            #${PRINT_SHEET_ID} {
                --k-ungu: #3b1a8c;
                --k-ungu2: #6d2fc4;
                --k-pink: #e0338a;
                --k-ink: #2b1466;
                font-family: "Plus Jakarta Sans", "Segoe UI", Roboto, Arial, sans-serif;
            }

            #${PRINT_SHEET_ID} .k-page {
                width: 210mm;
                height: 297mm;
                padding: 16mm 20mm 0;
                display: grid;
                grid-template-columns: repeat(3, 54mm);
                grid-auto-rows: 85.6mm;
                gap: 4mm;
                align-content: start;
                break-after: page;
                page-break-after: always;
                overflow: hidden;
            }

            #${PRINT_SHEET_ID} .k-page:last-child {
                break-after: auto;
                page-break-after: auto;
            }

            #${PRINT_SHEET_ID} .k-card {
                position: relative;
                width: 54mm;
                height: 85.6mm;
                overflow: hidden;
                background: #fff;
                border: 0.2mm solid #b9b3c9;
                border-radius: 3mm;
            }

            #${PRINT_SHEET_ID} .k-head {
                position: relative;
                height: 20mm;
                background: linear-gradient(135deg, var(--k-ungu) 0%, var(--k-ungu2) 100%);
                border-radius: 0 0 50% 50% / 0 0 7mm 7mm;
                box-shadow: 0 0.9mm 0 var(--k-pink);
                color: #fff;
                text-align: center;
            }

            #${PRINT_SHEET_ID} .k-logo {
                display: block;
                width: 8.5mm;
                height: 8.5mm;
                margin: 0 auto;
                padding-top: 2.4mm;
                object-fit: contain;
            }

            #${PRINT_SHEET_ID} .k-title {
                margin: 1.2mm 0 0;
                font-size: 7.4pt;
                font-weight: 800;
                letter-spacing: 0.15mm;
                line-height: 1.1;
            }

            #${PRINT_SHEET_ID} .k-nama {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 11mm;
                margin: 2.6mm 3mm 0;
                color: var(--k-ink);
                font-size: 10.5pt;
                font-weight: 800;
                line-height: 1.15;
                text-align: center;
                text-transform: uppercase;
                overflow-wrap: anywhere;
            }

            #${PRINT_SHEET_ID} .k-nama.sm { font-size: 8.6pt; }
            #${PRINT_SHEET_ID} .k-nama.xs { font-size: 7.2pt; }

            #${PRINT_SHEET_ID} .k-qr {
                width: 36mm;
                height: 36mm;
                margin: 1.4mm auto 0;
                padding: 1.4mm;
                background: #fff;
                border: 0.7mm solid var(--k-pink);
                border-radius: 2.5mm;
            }

            #${PRINT_SHEET_ID} .k-qr img {
                display: block;
                width: 100%;
                height: 100%;
            }

            #${PRINT_SHEET_ID} .k-foot {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                height: 11mm;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 1.6mm;
                background: linear-gradient(135deg, var(--k-ungu) 0%, var(--k-ungu2) 100%);
                border-radius: 50% 50% 0 0 / 4.5mm 4.5mm 0 0;
                color: #fff;
                font-size: 6.2pt;
                font-weight: 700;
                line-height: 1.15;
                padding-top: 1.6mm;
            }

            #${PRINT_SHEET_ID} .k-foot svg {
                width: 4.6mm;
                height: 4.6mm;
                flex: none;
            }
        }
    `;

    const SCAN_ICON = `
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/>
            <rect x="9" y="9" width="6" height="6" rx="1"/>
        </svg>`;

    function cleanupPrint() {

        document.body.classList.remove("printing-kartu");

        const sheet = document.getElementById(PRINT_SHEET_ID);
        const style = document.getElementById(PRINT_STYLE_ID);

        if (sheet) sheet.remove();
        if (style) style.remove();

        preparingPrint = false;

        if (printBtn) {
            printBtn.textContent = printBtnLabel;
            printBtn.disabled = rendering;
        }

    }

    function preloadLogo() {

        return new Promise((resolve) => {

            const img = new Image();

            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);   // tanpa logo pun kartu tetap tercetak
            img.src = LOGO_SRC;

        });

    }

    function namaClass(nama) {

        if (nama.length > 30) return "xs";
        if (nama.length > 20) return "sm";

        return "";

    }

    function buildPrintCard(student, dataUrl, hasLogo) {

        const card = document.createElement("div");
        card.className = "k-card";

        const head = document.createElement("div");
        head.className = "k-head";

        if (hasLogo) {

            const logo = document.createElement("img");
            logo.className = "k-logo";
            logo.src = LOGO_SRC;
            logo.alt = "";
            head.appendChild(logo);

        }

        const title = document.createElement("p");
        title.className = "k-title";
        title.textContent = "KARTU ABSEN SISWA";

        if (!hasLogo) title.style.marginTop = "6mm";

        head.appendChild(title);
        card.appendChild(head);

        const nama = document.createElement("div");
        nama.className = ("k-nama " + namaClass(student.nama)).trim();
        nama.textContent = student.nama;
        card.appendChild(nama);

        const qr = document.createElement("div");
        qr.className = "k-qr";

        const img = document.createElement("img");
        img.src = dataUrl;
        img.alt = "QR " + student.nama;
        qr.appendChild(img);
        card.appendChild(qr);

        const foot = document.createElement("div");
        foot.className = "k-foot";
        foot.innerHTML = SCAN_ICON;

        const txt = document.createElement("span");
        txt.textContent = "Scan untuk absensi siswa";
        foot.appendChild(txt);

        card.appendChild(foot);

        return card;

    }

    function imagesReady(root) {

        const imgs = Array.from(root.querySelectorAll("img"));

        return Promise.all(imgs.map((img) => {

            if (img.complete) return Promise.resolve();

            return new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });

        }));

    }

    async function printCards() {

        if (rendering || preparingPrint) return;

        const list = visibleStudents.slice();

        if (!list.length) {
            setStatus("Tidak ada siswa untuk dicetak. Kosongkan kolom cari atau ubah kata kuncinya.", "error");
            return;
        }

        cleanupPrint();
        setStatus("");

        preparingPrint = true;

        if (printBtn) printBtn.disabled = true;

        try {

            await ensureQr();

            const hasLogo = await preloadLogo();

            const sheet = document.createElement("div");
            sheet.id = PRINT_SHEET_ID;

            let page = null;

            for (let i = 0; i < list.length; i++) {

                if (i % CARDS_PER_PAGE === 0) {

                    page = document.createElement("div");
                    page.className = "k-page";
                    sheet.appendChild(page);

                }

                const dataUrl = await window.QRCode.toDataURL(qrPayload(list[i].nis), {
                    width: PRINT_QR_SIZE,
                    margin: 1,
                    errorCorrectionLevel: "M"
                });

                page.appendChild(buildPrintCard(list[i], dataUrl, hasLogo));

                if (printBtn && i % 10 === 0) {
                    printBtn.textContent = "Menyiapkan " + (i + 1) + "/" + list.length + "...";
                    await nextFrame();
                }

            }

            const style = document.createElement("style");
            style.id = PRINT_STYLE_ID;
            style.textContent = PRINT_CSS;

            document.head.appendChild(style);
            document.body.appendChild(sheet);
            document.body.classList.add("printing-kartu");

            await imagesReady(sheet);
            await nextFrame();

            window.print();

        } catch (err) {

            console.warn("Gagal menyiapkan kartu cetak:", err);

            setStatus("Gagal menyiapkan kartu cetak: " + err.message, "error");

            cleanupPrint();

        }

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
        printBtn.addEventListener("click", printCards);
    }

    window.addEventListener("afterprint", cleanupPrint);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
