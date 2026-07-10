/*
==========================================================
SMANSASOO Academic Portal
UI Module
Version : 1.0.0
==========================================================
*/

window.UI = (() => {

    const result = document.getElementById("result");

    /* ==========================================
       RESULT
    ========================================== */

    function showResult(student) {

        if (!result) return;

        result.innerHTML = `

        <div class="result-card success slide-up">

            <h2 class="result-title">

                🎉 Selamat!

            </h2>

            <p class="text-center mt-1">

                Anda dinyatakan

                <strong>${student.status}</strong>

            </p>

            <div class="result-item">

                <span class="result-label">
                    Nama
                </span>

                <span class="result-value">
                    ${student.name}
                </span>

            </div>

            <div class="result-item">

                <span class="result-label">
                    NIS
                </span>

                <span class="result-value">
                    ${student.nis}
                </span>

            </div>

            <div class="result-item">

                <span class="result-label">
                    NISN
                </span>

                <span class="result-value">
                    ${student.nisn}
                </span>

            </div>

            <div class="result-item">

                <span class="result-label">
                    Kelas Lama
                </span>

                <span class="result-value">
                    ${student.previous_class}
                </span>

            </div>

            <div class="result-item">

                <span class="result-label">
                    Kelas Baru
                </span>

                <span class="result-value">
                    ${student.new_class}
                </span>

            </div>

            <div class="result-item">

                <span class="result-label">
                    Kelompok Minat
                </span>

                <span class="result-value">
                    ${student.major}
                </span>

            </div>

            <div class="result-item">

                <span class="result-label">
                    Wali Kelas
                </span>

                <span class="result-value">
                    ${student.homeroom_teacher}
                </span>

            </div>

        </div>

        `;

    }

    /* ==========================================
       LOADING
    ========================================== */

    function showLoading() {

        if (!result) return;

        result.innerHTML = `

        <div class="loading-box fade-in">

            <div class="spinner"></div>

            <p>

                ${CONFIG.MESSAGE.LOADING}

            </p>

        </div>

        `;

    }

    /* ==========================================
       ERROR
    ========================================== */

    function showError(message) {

        if (!result) return;

        result.innerHTML = `

        <div class="error-card fade-in">

            ${message}

        </div>

        `;

    }

    /* ==========================================
       EMPTY
    ========================================== */

    function clear() {

        if (!result) return;

        result.innerHTML = "";

    }

    /* ==========================================
       TOAST
    ========================================== */

    function toast(message) {

        let toast = document.createElement("div");

        toast.className = "toast";

        toast.innerText = message;

        document.body.appendChild(toast);

        setTimeout(() => {

            toast.classList.add("show");

        }, 50);

        setTimeout(() => {

            toast.classList.remove("show");

            setTimeout(() => {

                toast.remove();

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
