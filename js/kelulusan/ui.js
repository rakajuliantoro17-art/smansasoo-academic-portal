/*
==========================================================
SMANSASOO Graduation Portal
UI Module
Version : 2.1.0
==========================================================
FIX (v2.1.0):
- BUG KRITIS: seluruh modul ini sebelumnya fork mentah dari
  project Kenaikan Kelas — merujuk ke key CONFIG yang TIDAK
  ADA di config.js Kelulusan (STATUS_NOT_PROMOTED_KEYWORD,
  MESSAGE.NOT_PROMOTED_NOTE, ENABLE_CELEBRATION_AUDIO,
  CELEBRATION_AUDIO_URL). Semua diganti ke key yang benar-
  benar ada: STATUS_PASS, MESSAGE.NOT_PASS_MESSAGE,
  ENABLE_AUDIO, AUDIO_URL.
- Field siswa diganti dari skema Kenaikan Kelas
  (previous_class/new_class/major/homeroom_teacher) ke
  skema Kelulusan sesuai StudentService.gs FIELD_MAP:
  graduation_number, graduation_date, note.
- isPromoted() -> isPassed(): sekarang exact match terhadap
  CONFIG.STATUS_PASS ("LULUS"), bukan substring check
  terhadap keyword yang tidak ada.
- graduation_number & graduation_date memang boleh kosong
  (SK belum terbit) — kalau kosong, baris terkait di kartu
  hasil disembunyikan sepenuhnya alih-alih menampilkan "-"
  yang membingungkan siswa.
- Tanggal ditampilkan lewat Utils.formatDate() (dari
  utils.js) supaya rapi ("5 Mei 2026"), bukan string ISO
  mentah yang dikirim Apps Script.
- Semua data siswa tetap lewat escapeHTML() sebelum masuk
  innerHTML (pola anti-XSS dari audit awal, tidak diubah).
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

        if (isPassed(student.status)) {

            renderPassedSummary(student);

            celebrate(student);

        } else {

            renderNeutralResult(student);

        }

    }

    function isPassed(status) {

        return String(status || "")
            .trim()
            .toUpperCase() === CONFIG.STATUS_PASS;

    }

    /* ==========================================
       KARTU HASIL (dipakai dua-duanya, beda opsi)
    ========================================== */

    function studentCardHTML(student, opts) {

        const cardClass = opts.neutral
            ? "result-card result-neutral fade-in"
            : "result-card success slide-up";

        const skRows = opts.neutral
            ? ""
            : `

            ${student.graduation_number ? `
            <div class="result-item">
                <span class="result-label">Nomor SKL</span>
                <span class="result-value">${escapeHTML(student.graduation_number)}</span>
            </div>
            ` : ""}

            ${student.graduation_date ? `
            <div class="result-item">
                <span class="result-label">Tanggal Kelulusan</span>
                <span class="result-value">${escapeHTML(Utils.formatDate(student.graduation_date))}</span>
            </div>
            ` : ""}

            `;

        const note = opts.neutral
            ? `<p class="status-note">${escapeHTML(CONFIG.MESSAGE.NOT_PASS_MESSAGE)}</p>`
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

            ${skRows}

            ${note}

        </div>

        `;

    }

    /* ==========================================
       LULUS — kartu ringkas di halaman
    ========================================== */

    function renderPassedSummary(student) {

        result.innerHTML = studentCardHTML(student, {
            title: CONFIG.ANNOUNCEMENT_TITLE,
            neutral: false
        });

    }

    /* ==========================================
       LULUS — overlay perayaan
    ========================================== */

    function celebrate(student) {

        if (!overlay || !overlayBox) return;

        resetCelebration();

        overlayBox.innerHTML = `

            <div class="headline">SELAMAT</div>

            <div class="student-name">${escapeHTML(student.name)}</div>

            <div class="subtext">DINYATAKAN LULUS</div>

            <div class="subtext">DARI ${escapeHTML(CONFIG.SCHOOL_NAME)}</div>

            <button id="btnCloseOverlay" type="button">Tutup</button>

        `;

        const closeBtn = document.getElementById("btnCloseOverlay");

        if (closeBtn) {
            closeBtn.addEventListener("click", closeOverlay);
        }

        if (flash && CONFIG.ENABLE_FLASH) flash.classList.add("show");

        setTimeout(() => overlay.classList.add("show"), 200);

        if (CONFIG.ENABLE_CONFETTI) {

            setTimeout(() => fireConfetti({
                particleCount: CONFIG.CONFETTI_PARTICLE,
                spread: CONFIG.CONFETTI_SPREAD
            }), 1500);

            setTimeout(() => fireConfetti({ spread: 120, originY: .5 }), 1800);

        }

        if (CONFIG.ENABLE_BALLOON) {

            setTimeout(() => launchBalloons(), 1500);

        }

        if (CONFIG.ENABLE_AUDIO) {

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

        const total = CONFIG.BALLOON_COUNT || 12;

        for (let i = 0; i < total; i++) {

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

        if (!audio || !CONFIG.AUDIO_URL) return;

        audio.src = CONFIG.AUDIO_URL;

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
       TIDAK LULUS — netral, tanpa animasi
    ========================================== */

    function renderNeutralResult(student) {

        result.innerHTML = studentCardHTML(student, {
            title: CONFIG.ANNOUNCEMENT_TITLE,
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
