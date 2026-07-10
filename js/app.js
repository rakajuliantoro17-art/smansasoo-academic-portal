/*
==========================================================
SMANSASOO Academic Portal
Application Script
Version : 1.0.0
==========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    initializeApp();

});

/* ==========================================
   INITIALIZE
========================================== */

function initializeApp() {

    const form = document.getElementById("searchForm");
    const input = document.getElementById("keyword");

    if (!form || !input) {
        console.error("Form pencarian tidak ditemukan.");
        return;
    }

    form.addEventListener("submit", handleSearch);

    input.focus();

}

/* ==========================================
   HANDLE SEARCH
========================================== */

async function handleSearch(event) {

    event.preventDefault();

    const input = document.getElementById("keyword");
    const keyword = input.value.trim();

    clearMessage();

    if (keyword === "") {

        showError("Silakan masukkan NIS atau NISN.");

        input.classList.add("shake");

        setTimeout(() => {

            input.classList.remove("shake");

        }, 500);

        input.focus();

        return;

    }

    showLoading();

    try {

        const result = await API.searchStudent(keyword);

        hideLoading();

        if (!result.success) {

            showError(result.message);

            return;

        }

        showResult(result.data);

    } catch (error) {

        hideLoading();

        console.error(error);

        showError("Terjadi kesalahan saat mengambil data.");

    }

}

/* ==========================================
   SHOW RESULT
========================================== */

function showResult(student) {

    const result = document.getElementById("result");

    if (!result) return;

    result.innerHTML = `

        <div class="result-card success slide-up">

            <h2 class="result-title">
                Pengumuman Kenaikan Kelas
            </h2>

            <div class="result-item">
                <span class="result-label">Nama</span>
                <span class="result-value">${student.name}</span>
            </div>

            <div class="result-item">
                <span class="result-label">NIS</span>
                <span class="result-value">${student.nis}</span>
            </div>

            <div class="result-item">
                <span class="result-label">Status</span>
                <span class="result-value">${student.status}</span>
            </div>

            <div class="result-item">
                <span class="result-label">Kelas Lama</span>
                <span class="result-value">${student.previous_class}</span>
            </div>

            <div class="result-item">
                <span class="result-label">Kelas Baru</span>
                <span class="result-value">${student.new_class}</span>
            </div>

            <div class="result-item">
                <span class="result-label">Kelompok Minat</span>
                <span class="result-value">${student.major}</span>
            </div>

            <div class="result-item">
                <span class="result-label">Wali Kelas</span>
                <span class="result-value">${student.homeroom_teacher}</span>
            </div>

        </div>

    `;

}

/* ==========================================
   SHOW ERROR
========================================== */

function showError(message) {

    const result = document.getElementById("result");

    if (!result) return;

    result.innerHTML = `

        <div class="error-card fade-in">

            ${message}

        </div>

    `;

}

/* ==========================================
   LOADING
========================================== */

function showLoading() {

    const result = document.getElementById("result");

    if (!result) return;

    result.innerHTML = `

        <div class="loading-box">

            <div class="spinner"></div>

            <p>Memuat data...</p>

        </div>

    `;

}

function hideLoading() {

    // Placeholder untuk pengembangan selanjutnya

}

/* ==========================================
   CLEAR
========================================== */

function clearMessage() {

    const result = document.getElementById("result");

    if (!result) return;

    result.innerHTML = "";

}
