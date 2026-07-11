/*
==========================================================
SMANSASOO Academic Portal
UI Module
Version : 1.2.0
==========================================================
FIX (v1.1.0):
- BUG KRITIS: #result tidak pernah lepas class "hidden".
  Sekarang setiap fungsi show* melepasnya.

BARU (v1.2.0):
- showResult() sekarang bercabang berdasarkan student.status:
  * NAIK        -> overlay perayaan full-screen (flash,
                   confetti, balon, musik) + kartu ringkas
                   di halaman.
  * TIDAK NAIK  -> kartu netral biasa saja di halaman,
                   TANPA overlay/animasi/warna mencolok.
    Sengaja dibuat berbeda karena status ini menyangkut siswa
    (anak di bawah umur) yang tidak naik kelas — tidak pantas
    diberi perlakuan visual yang sama seperti "gagal".
- Semua data siswa sekarang lewat escapeHTML() sebelum masuk
  innerHTML (menutup pola XSS yang dicatat di audit awal).
==========================================================
*/

window.UI = (() => {

    const result = document.getElementById("result");
    const overlay = document.getElementById("overlay");
    const overlayBox = document.getElementById("overlayBox");
    const flash = document.getElementById("flash");
    const balloonsContainer = document.getElementById("balloons");
    const audio = document.getElementById("celebrationSound");

    let audioFadeInterval = null;

    /* ==========================================
       ESCAPE (anti-XSS)
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
       ROUTER HASIL
    ========================================== */

    function showResult(student) {

        if (!result) return;

        result.classList.remove("hidden");

        if (isPromoted(student.status)) {

            renderPromotedSummary(student);

            celebrate(student);

        } else {

            renderNeutralResult(student);

        }

    }

    function isPromoted(status) {

        return String(status || "")
            .toUpperCase()
            .indexOf(CONFIG.STATUS_NOT_PROMOTED_KEYWORD) === -1;

    }

    /* ==========================================
       KARTU HASIL (dipakai dua-duanya, beda opsi)
    ========================================== */

    function studentCardHTML(student, opts) {

        const cardClass = opts.neutral
            ? "result-card result-neutral fade-in"
            : "result-card success slide-up";

        const detailRows = opts.neutral
            ? ""
            : `

            <div class="result-item">
                <span class="result-label">Kelas Baru</span>
                <span class="result-value">${escapeHTML(student.new_class)}</span>
            </div>

            <div class="result-item">
                <span class="result-label">Kelompok Minat</span>
                <span class="result-value">${escapeHTML(student.major)}</span>
            </div>

            <div class="result-item">
                <span class="result-label">Wali Kelas</span>
                <span class="result-value">${escapeHTML(student.homeroom_teacher)}</span>
            </div>

            `;

        const note = opts.neutral
            ? `<p class="status-note">${escapeHTML(CONFIG.MESSAGE.NOT_PROMOTED_NOTE)}</p>`
            : "";

        return `

        <div class="${cardClass}">

            <h2 class="result-title">${opts.title}</h2>

            <div class="result-item">
                <span class="result-label">Nama</span>
                <span class="result-value">${escapeHTML(student.name)}</span>
            </div>

            <div class="result-item">
                <span class="result-label">NIS</span>
                <span class="result-value">${escapeHTML(student.nis)}</span>
            </div>

            <div class="result-item">
                <span class="result-label">NISN</span>
                <span class="result-value">${escapeHTML(student.nisn)}</span>
            </div>

            <div class="result-item">
                <span class="result-label">Status</span>
                <span class="result-value">${escapeHTML(student.status)}</span>
            </div>

            <div class="result-item">
                <span class="result-label">Kelas Lama</span>
                <span class="result-value">${escapeHTML(student.previous_class)}</span>
            </div>

            ${detailRows}

            ${note}

        </div>

        `;

    }

    /* ==========================================
       NAIK — kartu ringkas di halaman
    ========================================== */

    function renderPromotedSummary(student) {

        result.innerHTML = studentCardHTML(student, {
            title: "Pengumuman Kenaikan Kelas",
            neutral: false
        });

    }

    /* ==========================================
       NAIK — overlay perayaan
    ========================================== */

    function celebrate(student) {

        if (!overlay || !overlayBox) return;

        resetCelebration();

        overlayBox.innerHTML = `

            <div class="headline">SELAMAT</div>

            <div class="student-name">${escapeHTML(student.name)}</div>

            <div class="subtext">DINYATAKAN NAIK KE KELAS BERIKUTNYA</div>

            <div class="student-detail">
                ${escapeHTML(student.new_class)} &middot; ${escapeHTML(student.major)}
            </div>

            <div class="student-detail">
                Wali Kelas: ${escapeHTML(student.homeroom_teacher)}
            </div>

            <button id="btnCloseOverlay" type="button">Tutup</button>

        `;

        const closeBtn = document.getElementById("btnCloseOverlay");

        if (closeBtn) {
            closeBtn.addEventListener("click", closeOverlay);
        }

        if (flash) flash.classList.add("show");

        setTimeout(() => overlay.classList.add("show"), 200);

        setTimeout(() => fireConfetti(), 1500);

        setTimeout(() => fireConfetti({ spread: 120, originY: .5 }), 1800);

        setTimeout(() => launchBalloons(), 1500);

        if (CONFIG.ENABLE_CELEBRATION_AUDIO) {

            setTimeout(() => playCelebrationAudio(), 1500);

        }

    }

    function fireConfetti(opts = {}) {

        if (typeof confetti !== "function") return;

        confetti({

            particleCount: opts.particleCount || 150,

            spread: opts.spread || 90,

            origin: { y: opts.originY || .6 }

        });

    }

    function launchBalloons() {

        if (!balloonsContainer) return;

        for (let i = 0; i < 12; i++) {

            setTimeout(() => {

                const b = document.createElement("div");

                b.className = "balloon";

                b.style.left = Math.random() * 100 + "vw";

                b.style.background = `hsl(${Math.random() * 360},70%,60%)`;

                balloonsContainer.appendChild(b);

                setTimeout(() => b.remove(), 6000);

            }, i * 200);

        }

    }

    function playCelebrationAudio() {

        if (!audio || !CONFIG.CELEBRATION_AUDIO_URL) return;

        audio.src = CONFIG.CELEBRATION_AUDIO_URL;

        audio.currentTime = 0;

        audio.volume = 0;

        audio.play().catch(() => {

            // File belum ada / autoplay diblokir browser.
            // Sengaja diabaikan diam-diam, visual tetap jalan.

        });

        let v = 0;

        audioFadeInterval = setInterval(() => {

            v += 0.05;

            if (v >= 1) {

                audio.volume = 1;

                clearInterval(audioFadeInterval);

            } else {

                audio.volume = v;

            }

        }, 80);

    }

    function closeOverlay() {

        if (!overlay) return;

        overlay.classList.remove("show");

        stopCelebrationAudio();

    }

    function stopCelebrationAudio() {

        if (audioFadeInterval) {
            clearInterval(audioFadeInterval);
            audioFadeInterval = null;
        }

        if (audio) {
            audio.pause();
        }

    }

    function resetCelebration() {

        if (overlay) overlay.classList.remove("show");

        if (flash) flash.classList.remove("show");

        if (balloonsContainer) balloonsContainer.innerHTML = "";

        stopCelebrationAudio();

    }

    /* ==========================================
       TIDAK NAIK — netral, tanpa animasi
    ========================================== */

    function renderNeutralResult(student) {

        result.innerHTML = studentCardHTML(student, {
            title: "Pengumuman Kenaikan Kelas",
            neutral: true
        });

    }

    /* ==========================================
       LOADING
    ========================================== */

    function showLoading() {

        if (!result) return;

        resetCelebration();

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

        resetCelebration();

        result.classList.remove("hidden");

        result.innerHTML = `

        <div class="error-card fade-in">

            ${escapeHTML(message)}

        </div>

        `;

    }

    /* ==========================================
       CLEAR / RESET
    ========================================== */

    function clear() {

        if (!result) return;

        resetCelebration();

        result.classList.add("hidden");

        result.innerHTML = "";

    }

    /* ==========================================
       TOAST (disiapkan untuk V1.5, belum dipakai)
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
       INIT — klik di luar kartu overlay = tutup
    ========================================== */

    if (overlay) {

        overlay.addEventListener("click", (event) => {

            if (event.target === overlay) {

                closeOverlay();

            }

        });

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
