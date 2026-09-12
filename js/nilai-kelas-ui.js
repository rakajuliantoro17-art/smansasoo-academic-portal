/*
==========================================================
SMANSASOO Academic Portal
Nilai Kelas UI Module
Version : 1.0.0
==========================================================
Merender hasil dari getClassSummary (lihat api/kelas-summary.js):
4 kartu rata-rata (Raport, UTS, SAS, Progress) + tabel semua
siswa di kelas yang dipilih.
==========================================================
*/

window.NilaiKelasUI = (() => {

    const result = document.getElementById("kelasResult");

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

        result.innerHTML = `<div class="error-card fade-in">${escapeHTML(message)}</div>`;

    }

    function clear() {

        if (!result) return;

        result.classList.add("hidden");

        result.innerHTML = "";

    }

    function showResult(data) {

        if (!result) return;

        result.classList.remove("hidden");

        result.innerHTML = `

        <div class="nilai-card fade-in">

            <div class="kelas-metrics">

                <div class="kelas-metric">
                    <span>Total Siswa</span>
                    <strong>${escapeHTML(data.totalSiswa)}</strong>
                </div>

                <div class="kelas-metric">
                    <span>Rerata Raport</span>
                    <strong class="kelas-metric-success">${escapeHTML(data.avgRaport)}</strong>
                </div>

                <div class="kelas-metric">
                    <span>Rerata UTS</span>
                    <strong class="kelas-metric-primary">${escapeHTML(data.avgUTS)}</strong>
                </div>

                <div class="kelas-metric">
                    <span>Rerata SAS</span>
                    <strong class="kelas-metric-primary">${escapeHTML(data.avgSAS)}</strong>
                </div>

                <div class="kelas-metric">
                    <span>Rerata Progress</span>
                    <strong class="kelas-metric-warning">${escapeHTML(data.avgProgress)}%</strong>
                </div>

            </div>

            ${studentsTableHTML(data.students)}

        </div>

        `;

    }

    function studentsTableHTML(students) {

        if (!students || !students.length) {
            return `<p class="nilai-progress-note">Tidak ada siswa pada kelas ini.</p>`;
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

                    ${students.map((st) => `

                        <tr>
                            <td class="nilai-code">${escapeHTML(st.nis)}</td>
                            <td>${escapeHTML(st.nama)}</td>
                            <td>${escapeHTML(st.kelas)}</td>
                            <td>${escapeHTML(st.raport)}</td>
                            <td>${escapeHTML(st.uts)}</td>
                            <td>${escapeHTML(st.sas)}</td>
                            <td>
                                <span class="nilai-status ${st.progress === 100 ? "done" : "pending"}">
                                    ${st.progress}%
                                </span>
                            </td>
                        </tr>

                    `).join("")}

                </tbody>

            </table>

        </div>

        `;

    }

    return {

        showLoading,

        showError,

        clear,

        showResult

    };

})();
