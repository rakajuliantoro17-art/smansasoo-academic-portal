/*
==========================================================
SMANSASOO Academic Portal
Rekap UI Module
Version : 1.0.0
==========================================================
Merender dua jenis hasil dari /api/rekap:
1. Cek nilai satu siswa (mirip pola js/nilai-ui.js)
2. Rekap rata-rata satu kelas / semua kelas (kartu ringkasan
   + tabel daftar siswa)
==========================================================
*/

window.RekapUI = (() => {

    const result = document.getElementById("rekapResult");

    let subjects = [];
    let activeIndex = 0;

    // State untuk tabel rekap kelas (search + sort), dipisah dari
    // data mentah supaya bisa difilter/diurutkan ulang tanpa fetch
    // ulang ke server.
    let currentSummary = null;
    let sortKey = null;
    let sortDir = 1; // 1 = ascending, -1 = descending
    let searchTerm = "";

    // Ambang batas untuk highlight (bisa disesuaikan kalau KKM beda).
    const PROGRESS_LOW = 50;
    const PROGRESS_MID = 80;
    const RAPORT_LOW = 75;

    /* ==========================================
       ESCAPE (anti-XSS, sama seperti ui.js)
    ========================================== */

    function escapeHTML(value) {

        if (value === null || value === undefined || value === "") {
            return "-";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

    }

    /* ==========================================
       LOADING / ERROR / CLEAR
    ========================================== */

    function showLoading() {

        if (!result) return;

        result.classList.remove("hidden");

        result.innerHTML = `

        <div class="loading-box fade-in">

            <div class="spinner"></div>

            <p>${escapeHTML(CONFIG.MESSAGE.LOADING)}</p>

        </div>

        `;

    }

    function showError(message) {

        if (!result) return;

        result.classList.remove("hidden");

        result.innerHTML = `

        <div class="error-card fade-in">

            ${escapeHTML(message)}

        </div>

        `;

    }

    function clear() {

        if (!result) return;

        result.classList.add("hidden");

        result.innerHTML = "";

        currentSummary = null;

        sortKey = null;

        searchTerm = "";

    }

    /* ==========================================
       MODE 1: HASIL PER SISWA
    ========================================== */

    function showStudentResult(data) {

        if (!result) return;

        subjects = Array.isArray(data) ? data : [data];

        activeIndex = 0;

        result.classList.remove("hidden");

        renderStudent();

    }

    function renderStudent() {

        const subject = subjects[activeIndex];

        if (!subject) {
            showError(CONFIG.MESSAGE.NOT_FOUND);
            return;
        }

        result.innerHTML = `

        <div class="nilai-card fade-in">

            ${subjects.length > 1 ? studentTabsHTML() : ""}

            <div class="nilai-header">

                <div>
                    <span class="nilai-badge">${escapeHTML(subject.kelas)}</span>
                    <span class="nilai-badge nilai-badge-alt">${escapeHTML(subject.mapel)}</span>
                    <h2>${escapeHTML(subject.nama)}</h2>
                    <p class="nilai-nis">NIS: ${escapeHTML(subject.nis)}</p>
                </div>

                <div class="nilai-raport-box">
                    <span>Nilai Raport</span>
                    <strong>${escapeHTML(subject.nilaiRaport)}</strong>
                </div>

            </div>

            <div class="nilai-progress">

                <div class="nilai-progress-label">
                    <span>Progress Kelengkapan Nilai</span>
                    <strong>${subject.progress}%</strong>
                </div>

                <div class="nilai-progress-track">
                    <div class="nilai-progress-fill" style="width:${subject.progress}%"></div>
                </div>

                <p class="nilai-progress-note">
                    ${subject.completedCount} dari ${subject.totalAssessments} komponen penilaian tuntas.
                </p>

            </div>

            ${subject.missingList && subject.missingList.length ? missingHTML(subject.missingList) : ""}

            ${detailsTableHTML(subject.details)}

        </div>

        `;

        result.querySelectorAll("[data-tab-index]").forEach((btn) => {

            btn.addEventListener("click", () => {

                activeIndex = Number(btn.dataset.tabIndex);

                renderStudent();

            });

        });

    }

    function studentTabsHTML() {

        return `

        <div class="nilai-tabs">

            ${subjects.map((s, i) => `

                <button
                    type="button"
                    data-tab-index="${i}"
                    class="nilai-tab ${i === activeIndex ? "active" : ""}">
                    ${escapeHTML(s.mapel)}
                </button>

            `).join("")}

        </div>

        `;

    }

    function missingHTML(list) {

        return `

        <div class="nilai-missing">

            <h3>Belum Ada Nilai / Belum Selesai</h3>

            <ul>
                ${list.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}
            </ul>

        </div>

        `;

    }

    function detailsTableHTML(details) {

        if (!details || !details.length) return "";

        return `

        <div class="nilai-table-wrap">

            <h3>Rincian Komponen Nilai</h3>

            <table class="nilai-table">

                <thead>
                    <tr>
                        <th>Kode</th>
                        <th>Komponen</th>
                        <th>Nilai</th>
                        <th>Remedial</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>

                    ${details.map((item) => `

                        <tr>
                            <td class="nilai-code">${escapeHTML(item.code)}</td>
                            <td>${escapeHTML(item.name)}</td>
                            <td class="${item.status === "Selesai" ? "" : "nilai-empty"}">${escapeHTML(item.score)}</td>
                            <td>${escapeHTML(item.remed)}</td>
                            <td>
                                <span class="nilai-status ${item.status === "Selesai" ? "done" : "pending"}">
                                    ${escapeHTML(item.status)}
                                </span>
                            </td>
                        </tr>

                    `).join("")}

                </tbody>

            </table>

        </div>

        `;

    }

    /* ==========================================
       MODE 2: REKAP KELAS
    ========================================== */

    function showClassSummary(summary) {

        if (!result) return;

        currentSummary = summary;
        sortKey = null;
        sortDir = 1;
        searchTerm = "";

        result.classList.remove("hidden");

        result.innerHTML = `

        <div class="nilai-card fade-in printable">

            <div class="print-letterhead">
                <img src="../assets/logo/logo.png" alt="Logo ${escapeHTML(CONFIG.SCHOOL_NAME)}">
                <h3>${escapeHTML(CONFIG.SCHOOL_NAME)}</h3>
                <p>Rekap Nilai Kelas &middot; Tahun Pelajaran ${escapeHTML(CONFIG.ACADEMIC_YEAR)}</p>
            </div>

            <div class="rekap-summary-header">
                <span class="nilai-badge">${escapeHTML(summary.kelas)}</span>
                <span class="nilai-badge nilai-badge-alt">${escapeHTML(summary.mapel)}</span>
                <h2>Rekap ${summary.totalSiswa} Siswa</h2>
            </div>

            <div class="rekap-stats-grid">

                <div class="rekap-stat-box">
                    <span>Rata-rata Raport</span>
                    <strong>${escapeHTML(summary.avgRaport)}</strong>
                </div>

                <div class="rekap-stat-box">
                    <span>Rata-rata UTS</span>
                    <strong>${escapeHTML(summary.avgUTS)}</strong>
                </div>

                <div class="rekap-stat-box">
                    <span>Rata-rata SAS</span>
                    <strong>${escapeHTML(summary.avgSAS)}</strong>
                </div>

                <div class="rekap-stat-box">
                    <span>Rata-rata Progress</span>
                    <strong>${summary.avgProgress}%</strong>
                </div>

            </div>

            ${summary.students && summary.students.length ? `

            <div class="rekap-legend">
                <span><i class="dot-low"></i> Progress di bawah ${PROGRESS_LOW}%</span>
                <span><i class="dot-mid"></i> Progress ${PROGRESS_LOW}-${PROGRESS_MID - 1}%</span>
                <span><i class="dot-raport"></i> Nilai raport di bawah ${RAPORT_LOW}</span>
            </div>

            <div class="rekap-table-toolbar">

                <input
                    type="text"
                    id="rekapTableSearch"
                    class="rekap-table-search"
                    placeholder="Cari nama atau NIS...">

                <span class="rekap-table-count" id="rekapTableCount"></span>

            </div>

            ` : ""}

            <div id="rekapTableContainer"></div>

            <button
                type="button"
                class="btn-print"
                data-print-trigger
                data-print-filename="Rekap-Kelas-${escapeHTML(summary.kelas)}-${escapeHTML(summary.mapel)}">
                <span class="icon">&#128424;</span> Cetak / Unduh PDF
            </button>

        </div>

        `;

        renderClassTable();

        const searchInput = document.getElementById("rekapTableSearch");

        if (searchInput) {

            searchInput.addEventListener("input", () => {

                searchTerm = searchInput.value.trim().toLowerCase();

                renderClassTable();

            });

        }

    }

    /**
     * Render ulang HANYA bagian tabel (dipanggil saat pertama kali
     * showClassSummary, atau setelah search/sort berubah) supaya
     * kartu statistik & input pencarian tidak ikut ke-reset.
     */

    function renderClassTable() {

        const container = document.getElementById("rekapTableContainer");

        if (!container || !currentSummary) return;

        let students = currentSummary.students || [];

        if (searchTerm) {

            students = students.filter((s) => {

                const nama = String(s.nama || "").toLowerCase();
                const nis = String(s.nis || "").toLowerCase();

                return nama.includes(searchTerm) || nis.includes(searchTerm);

            });

        }

        if (sortKey) {

            students = [...students].sort((a, b) => {

                const va = sortValue(a, sortKey);
                const vb = sortValue(b, sortKey);

                if (va < vb) return -1 * sortDir;
                if (va > vb) return 1 * sortDir;

                return 0;

            });

        }

        const countLabel = document.getElementById("rekapTableCount");

        if (countLabel) {

            const total = (currentSummary.students || []).length;

            countLabel.textContent = searchTerm
                ? `${students.length} dari ${total} siswa`
                : `${total} siswa`;

        }

        container.innerHTML = classStudentTableHTML(students);

        // Delegasi klik untuk header yang bisa di-sort.

        container.querySelectorAll("[data-sort-key]").forEach((th) => {

            th.addEventListener("click", () => {

                const key = th.dataset.sortKey;

                if (sortKey === key) {
                    sortDir = sortDir * -1;
                } else {
                    sortKey = key;
                    sortDir = 1;
                }

                renderClassTable();

            });

        });

    }

    function sortValue(student, key) {

        if (key === "raport" || key === "uts" || key === "sas") {

            const num = parseFloat(student[key]);

            return isNaN(num) ? -1 : num;

        }

        if (key === "progress") {
            return Number(student.progress) || 0;
        }

        return String(student[key] || "").toLowerCase();

    }

    function classStudentTableHTML(students) {

        if (!students || !students.length) {

            return `<p class="rekap-table-noresult">Tidak ada siswa yang cocok.</p>`;

        }

        const columns = [
            { key: "nis", label: "NIS" },
            { key: "nama", label: "Nama" },
            { key: "kelas", label: "Kelas" },
            { key: "raport", label: "Raport" },
            { key: "uts", label: "UTS" },
            { key: "sas", label: "SAS" },
            { key: "progress", label: "Progress" }
        ];

        return `

        <div class="nilai-table-wrap">

            <table class="nilai-table">

                <thead>
                    <tr>
                        ${columns.map((col) => `

                            <th
                                data-sort-key="${col.key}"
                                class="${sortKey === col.key ? "sort-active" : ""}">
                                ${col.label}
                                <span class="sort-arrow">${sortArrow(col.key)}</span>
                            </th>

                        `).join("")}
                    </tr>
                </thead>

                <tbody>

                    ${students.map((s) => {

                        const progress = Number(s.progress) || 0;

                        const rowClass = progress < PROGRESS_LOW
                            ? "rekap-row-low"
                            : (progress < PROGRESS_MID ? "rekap-row-mid" : "");

                        const raportNum = parseFloat(s.raport);
                        const raportLow = !isNaN(raportNum) && raportNum < RAPORT_LOW;

                        return `

                        <tr class="${rowClass}">
                            <td class="nilai-code">${escapeHTML(s.nis)}</td>
                            <td>${escapeHTML(s.nama)}</td>
                            <td>${escapeHTML(s.kelas)}</td>
                            <td class="${raportLow ? "rekap-cell-low" : ""}">${escapeHTML(s.raport)}</td>
                            <td>${escapeHTML(s.uts)}</td>
                            <td>${escapeHTML(s.sas)}</td>
                            <td>${progress}%</td>
                        </tr>

                        `;

                    }).join("")}

                </tbody>

            </table>

        </div>

        `;

    }

    function sortArrow(key) {

        if (sortKey !== key) return "↕";

        return sortDir === 1 ? "↑" : "↓";

    }

    /* ==========================================
       DROPDOWN KELAS
    ========================================== */

    function fillClassOptions(selectEl, classes) {

        if (!selectEl) return;

        const current = selectEl.value;

        selectEl.innerHTML = `<option value="SEMUA">Semua Kelas</option>` +
            classes.map((k) => `<option value="${escapeHTML(k)}">${escapeHTML(k)}</option>`).join("");

        if (current && classes.includes(current)) {
            selectEl.value = current;
        }

    }

    /* ==========================================
       PUBLIC
    ========================================== */

    return {

        showLoading,

        showError,

        clear,

        showStudentResult,

        showClassSummary,

        fillClassOptions

    };

})();
