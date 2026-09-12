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

        result.classList.remove("hidden");

        result.innerHTML = `

        <div class="nilai-card fade-in">

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

            ${classStudentTableHTML(summary.students)}

        </div>

        `;

    }

    function classStudentTableHTML(students) {

        if (!students || !students.length) {

            return `<p class="rekap-empty-note">Tidak ada data siswa untuk kelas ini.</p>`;

        }

        return `

        <div class="nilai-table-wrap">

            <h3>Daftar Siswa</h3>

            <table class="nilai-table">

                <thead>
                    <tr>
                        <th>NIS</th>
                        <th>Nama</th>
                        <th>Kelas</th>
                        <th>Raport</th>
                        <th>UTS</th>
                        <th>SAS</th>
                        <th>Progress</th>
                    </tr>
                </thead>

                <tbody>

                    ${students.map((s) => `

                        <tr>
                            <td class="nilai-code">${escapeHTML(s.nis)}</td>
                            <td>${escapeHTML(s.nama)}</td>
                            <td>${escapeHTML(s.kelas)}</td>
                            <td>${escapeHTML(s.raport)}</td>
                            <td>${escapeHTML(s.uts)}</td>
                            <td>${escapeHTML(s.sas)}</td>
                            <td>${s.progress}%</td>
                        </tr>

                    `).join("")}

                </tbody>

            </table>

        </div>

        `;

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
