/*
==========================================================
SMANSASOO Academic Portal
UI Module
Version : 1.1.0
==========================================================
FIX (v1.1.0):
- BUG KRITIS: sebelumnya #result punya class="hidden" di
  index.html dan tidak pernah dilepas oleh JS manapun,
  sehingga hasil pencarian tidak pernah terlihat walau
  data sudah berhasil diambil. Sekarang setiap fungsi
  show* melepas class "hidden" dari #result.
- Ini menjadi satu-satunya modul yang menulis ke DOM untuk
  hasil pencarian (app.js dan search.js tidak lagi punya
  salinan fungsi showResult/showError/showLoading sendiri).
==========================================================
*/

window.UI = (() => {

    const result = document.getElementById("result");

    /* ==========================================
       RESULT
    ========================================== */

    function showResult(student) {

        if (!result) return;

        result.classList.remove("hidden");

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
                <span class="result-label">NISN</span>
                <span class="result-value">${student.nisn}</span>
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
       LOADING
    ========================================== */

    function showLoading() {

        if (!result) return;

        result.classList.remove("hidden");

        result.innerHTML = `

        <div class="loading-box fade-in">

            <div class="spinner"></div>

            <p>${CONFIG.MESSAGE.LOADING}</p>

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

            ${message}

        </div>

        `;

    }

    /* ==========================================
       EMPTY / RESET
    ========================================== */

    function clear() {

        if (!result) return;

        result.classList.add("hidden");

        result.innerHTML = "";

    }

    /* ==========================================
       TOAST
    ========================================== */

    function toast(message) {

        const el = document.createElement("div");

        el.className = "toast";

        el.innerText = message;

        document.body.appendChild(el);

        setTimeout(() => {

            el.classList.add("show");

        }, 50);

        setTimeout(() => {

            el.classList.remove("show");

            setTimeout(() => {

                el.remove();

            }, 300);

        }, 3000);

    }

    /* ==========================================
       PUBLIC
    ========================================== */

    return {

        showResult,

        showLoading,

        showError,

        clear,

        toast

    };

})();
