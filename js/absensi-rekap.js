/*
==========================================================
SMANSASOO Academic Portal
Absensi Rekap Script
Version : 1.0.0
==========================================================
Ambil rekap dari /api/absensi-rekap sesuai filter (tanggal,
kelas, mapel, jam ke-), tampilkan ringkasan + tabel log +
daftar siswa yang belum absen (kalau filter sesi lengkap),
dan sediakan export CSV dari data yang sedang ditampilkan.
==========================================================
*/

(function () {

    const filterTanggal = document.getElementById("absensiRekapTanggal");
    const filterKelas = document.getElementById("absensiRekapKelas");
    const filterMapel = document.getElementById("absensiRekapMapel");
    const filterJamKe = document.getElementById("absensiRekapJamKe");

    const applyBtn = document.getElementById("absensiRekapApplyBtn");
    const exportBtn = document.getElementById("absensiRekapExportBtn");

    const statusEl = document.getElementById("absensiRekapStatus");
    const summaryEl = document.getElementById("absensiRekapSummary");
    const tableWrapEl = document.getElementById("absensiRekapTableWrap");
    const belumSectionEl = document.getElementById("absensiRekapBelumSection");
    const belumListEl = document.getElementById("absensiRekapBelumList");

    let currentRecords = [];
    let kelasListLoaded = false;

    function todayLocal() {

        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0");

        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    }

    function setStatus(message, isError) {

        if (!statusEl) return;

        if (!message) {
            statusEl.innerHTML = "";
            return;
        }

        statusEl.innerHTML = isError
            ? `<div class="error-card">${message}</div>`
            : `<p style="color:var(--text-muted);font-size:0.85rem;">${message}</p>`;

    }

    function populateKelasDropdown(kelasList) {

        if (!filterKelas || kelasListLoaded) return;

        kelasList.forEach((kelas) => {

            const opt = document.createElement("option");
            opt.value = kelas;
            opt.textContent = kelas;
            filterKelas.appendChild(opt);

        });

        kelasListLoaded = true;

    }

    function renderSummary(data) {

        const cards = [
            { label: "Total Kehadiran", value: data.totalRecords },
            { label: "Total Siswa di Kelas", value: data.totalSiswaKelas !== null ? data.totalSiswaKelas : "-" },
            {
                label: "Persentase Hadir",
                value: data.totalSiswaKelas ? `${Math.round((data.totalRecords / data.totalSiswaKelas) * 100)}%` : "-"
            }
        ];

        summaryEl.innerHTML = cards.map((c) => `

            <div class="absensi-rekap-stat">
                <span>${c.label}</span>
                <strong>${c.value}</strong>
            </div>

        `).join("");

    }

    function renderTable(records) {

        if (!records.length) {
            tableWrapEl.innerHTML = `<p class="absensi-rekap-empty">Tidak ada data kehadiran untuk filter ini.</p>`;
            return;
        }

        tableWrapEl.innerHTML = `

        <div class="absensi-rekap-table-wrap">

            <table class="absensi-rekap-table">

                <thead>
                    <tr>
                        <th>Waktu</th>
                        <th>NIS</th>
                        <th>Nama</th>
                        <th>Kelas</th>
                        <th>Mapel</th>
                        <th>Jam Ke</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>

                    ${records.map((r) => `

                        <tr>
                            <td>${r.waktu}</td>
                            <td>${r.nis}</td>
                            <td>${r.nama}</td>
                            <td>${r.kelas}</td>
                            <td>${r.mapel}</td>
                            <td>${r.jamKe}</td>
                            <td>${r.status}</td>
                        </tr>

                    `).join("")}

                </tbody>

            </table>

        </div>

        `;

    }

    function renderBelumAbsen(siswaBelumAbsen) {

        if (!siswaBelumAbsen) {
            belumSectionEl.style.display = "none";
            return;
        }

        belumSectionEl.style.display = "block";

        if (!siswaBelumAbsen.length) {
            belumListEl.innerHTML = `<p style="color:var(--success);font-size:0.9rem;">Semua siswa di kelas ini sudah absen pada sesi ini.</p>`;
            return;
        }

        belumListEl.innerHTML = siswaBelumAbsen.map((s) =>
            `<span class="absensi-rekap-belum-chip">${s.nama} (${s.nis})</span>`
        ).join("");

    }

    function exportCSV() {

        if (!currentRecords.length) {
            alert("Tidak ada data untuk diekspor.");
            return;
        }

        const header = ["Tanggal", "Waktu", "NIS", "Nama", "Kelas", "Mapel", "Jam Ke", "Status"];

        const rows = currentRecords.map((r) => [r.tanggal, r.waktu, r.nis, r.nama, r.kelas, r.mapel, r.jamKe, r.status]);

        const csv = [header, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `absensi-rekap-${filterTanggal.value || "semua"}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);

    }

    async function loadRekap() {

        setStatus("Memuat data...", false);

        const params = new URLSearchParams({
            tanggal: filterTanggal.value || "",
            kelas: filterKelas.value || "SEMUA",
            mapel: filterMapel.value || "",
            jamKe: filterJamKe.value || ""
        });

        try {

            const response = await fetch(`/api/absensi-rekap?${params.toString()}`, { cache: "no-store" });
            const result = await response.json();

            if (!result.configured) {
                setStatus(result.message || "GOOGLE_SHEET_ID_ABSENSI belum diatur.", true);
                summaryEl.innerHTML = "";
                tableWrapEl.innerHTML = "";
                belumSectionEl.style.display = "none";
                return;
            }

            if (!result.success) {
                setStatus(result.message || "Gagal memuat rekap.", true);
                return;
            }

            setStatus("", false);

            const data = result.data;

            populateKelasDropdown(data.kelasList || []);

            currentRecords = data.records || [];

            renderSummary(data);
            renderTable(currentRecords);
            renderBelumAbsen(data.siswaBelumAbsen);

        } catch (err) {

            setStatus("Gagal memuat rekap: " + err.message, true);

        }

    }

    function init() {

        if (filterTanggal && !filterTanggal.value) {
            filterTanggal.value = todayLocal();
        }

        if (applyBtn) applyBtn.addEventListener("click", loadRekap);
        if (exportBtn) exportBtn.addEventListener("click", exportCSV);

        loadRekap();

    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
