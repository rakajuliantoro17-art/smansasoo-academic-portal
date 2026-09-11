/*
==========================================================
SMANSASOO Academic Portal
Nilai UI Module
Version : 1.0.0
==========================================================
Merender hasil dari Code.gs (searchStudentByNIS): satu atau
lebih mata pelajaran (Wajib / Lanjutan), masing-masing berisi
progress kelengkapan nilai, komponen yang belum diisi, dan
rincian tiap komponen penilaian.
==========================================================
*/

window.NilaiUI = (() => {

    const result = document.getElementById("nilaiResult");

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
       LOADING
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

    /* ==========================================
       ERROR
    ========================================== */

    function showError(message) {

        if (!result) return;

        result.classList.remove("hidden");

        result.innerHTML = `

        <div class="error-card fade-in">

            ${escapeHTML(message)}

        </div>

        `;

    }

    /* ==========================================
       CLEAR
    ========================================== */

    function clear() {

        if (!result) return;

        result.classList.add("hidden");

        result.innerHTML = "";

    }

    /* ==========================================
       SHOW RESULT
    ========================================== */

    function showResult(data) {

        if (!result) return;

        subjects = Array.isArray(data) ? data : [data];

        activeIndex = 0;

        result.classList.remove("hidden");

        render();

    }

    function render() {

        const subject = subjects[activeIndex];

        if (!subject) {
            showError(CONFIG.MESSAGE.NOT_FOUND);
            return;
        }

        result.innerHTML = `

        <div class="nilai-card fade-in">

            ${subjects.length > 1 ? tabsHTML() : ""}

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

                render();

            });

        });

    }

    /* ==========================================
       TABS (dipakai kalau siswa punya >1 mapel)
    ========================================== */

    function tabsHTML() {

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

    /* ==========================================
       MISSING LIST
    ========================================== */

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

    /* ==========================================
       DETAILS TABLE
    ========================================== */

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
       PUBLIC
    ========================================== */

    return {

        showLoading,

        showError,

        clear,

        showResult

    };

})();
