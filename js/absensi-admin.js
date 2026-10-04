/*
==========================================================
SMANSASOO Academic Portal
Absensi Admin (Generate QR) Script
Version : 1.0.0
==========================================================
Ambil daftar siswa dari /api/absensi-students, lalu generate
QR code per siswa di browser (library "qrcode", dimuat lewat
CDN di pages/absensi-admin.html). Isi QR adalah JSON kecil
bertanda khusus supaya QR acak lain tidak diterima oleh
pages/absensi-scan.html:

  {"t":"SMANSASOO-ABSEN","nis":"<NIS>"}
==========================================================
*/

(function () {

    const grid = document.getElementById("absensiAdminGrid");
    const status = document.getElementById("absensiAdminStatus");
    const countLabel = document.getElementById("absensiAdminCount");
    const searchInput = document.getElementById("absensiAdminSearch");
    const printBtn = document.getElementById("absensiAdminPrintBtn");

    let allStudents = [];

    function setStatus(message, type) {

        if (!status) return;

        if (!message) {
            status.innerHTML = "";
            return;
        }

        status.innerHTML = `<div class="error-card">${message}</div>`;
        status.style.display = type === "error" ? "block" : "none";

    }

    function qrPayload(nis) {

        return JSON.stringify({ t: "SMANSASOO-ABSEN", nis: String(nis) });

    }

    function renderCard(student) {

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
        nis.textContent = `NIS: ${student.nis}`;
        card.appendChild(nis);

        if (window.QRCode && window.QRCode.toCanvas) {

            window.QRCode.toCanvas(canvas, qrPayload(student.nis), { width: 220, margin: 1 }, (err) => {

                if (err) console.warn("Gagal generate QR untuk", student.nis, err);

            });

        }

        return card;

    }

    function renderGrid(students) {

        if (!grid) return;

        grid.innerHTML = "";

        if (!students.length) {
            grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);">Tidak ada siswa yang cocok.</p>`;
            return;
        }

        students.forEach((student) => {

            grid.appendChild(renderCard(student));

        });

    }

    function applyFilter() {

        const keyword = (searchInput?.value || "").trim().toLowerCase();

        const filtered = !keyword
            ? allStudents
            : allStudents.filter((s) =>
                s.nama.toLowerCase().includes(keyword)
                || s.nis.toLowerCase().includes(keyword)
                || (s.kelas || "").toLowerCase().includes(keyword)
            );

        renderGrid(filtered);

        if (countLabel) {
            countLabel.textContent = `${filtered.length} dari ${allStudents.length} siswa`;
        }

    }

    async function init() {

        try {

            const response = await fetch("/api/absensi-students", { cache: "no-store" });
            const result = await response.json();

            if (!result.configured) {

                setStatus(result.message || "GOOGLE_SHEET_ID_ABSENSI belum diatur.", "error");
                if (countLabel) countLabel.textContent = "Belum dikonfigurasi";
                return;

            }

            if (!result.success) {

                setStatus(result.message || "Gagal memuat data siswa.", "error");
                return;

            }

            allStudents = result.data || [];

            applyFilter();

        } catch (err) {

            setStatus("Gagal memuat data siswa: " + err.message, "error");

        }

    }

    if (searchInput) {
        searchInput.addEventListener("input", applyFilter);
    }

    if (printBtn) {
        printBtn.addEventListener("click", () => window.print());
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
