/*
==========================================================
SMANSASOO Academic Portal
Rekap Search Module
Version : 1.0.0
==========================================================
Controller untuk pages/rekap.html. Ada dua mode:
1. "student" -> cek nilai satu siswa berdasarkan NIS.
2. "summary" -> rekap rata-rata satu kelas / semua kelas.
Pola sama seperti js/nilai-search.js: hanya delegasikan ke
RekapAPI dan RekapUI, tidak menyimpan logic render sendiri.
==========================================================
*/

window.RekapSearch = (() => {

    let mode = "student";

    /**
     * ==========================================
     * INITIALIZE
     * ==========================================
     */

    async function initialize() {

        const studentTabBtn = document.getElementById("rekapTabStudent");
        const summaryTabBtn = document.getElementById("rekapTabSummary");

        const studentForm = document.getElementById("rekapStudentForm");
        const summaryForm = document.getElementById("rekapSummaryForm");

        if (studentTabBtn && summaryTabBtn) {

            studentTabBtn.addEventListener("click", () => switchMode("student"));

            summaryTabBtn.addEventListener("click", () => switchMode("summary"));

        }

        if (studentForm) {

            studentForm.addEventListener("submit", handleStudentSubmit);

        }

        const keywordInput = document.getElementById("rekapKeyword");

        if (keywordInput) {

            // Polish kecil: cegah user mengetik selain angka di NIS,
            // supaya nggak perlu tunggu response server buat tahu
            // formatnya salah.
            keywordInput.addEventListener("input", () => {

                keywordInput.value = keywordInput.value.replace(/[^0-9]/g, "");

            });

        }

        if (summaryForm) {

            summaryForm.addEventListener("submit", handleSummarySubmit);

        }

        await loadClassOptions();

    }

    /**
     * ==========================================
     * SWITCH MODE (tab)
     * ==========================================
     */

    function switchMode(next) {

        mode = next;

        const studentTabBtn = document.getElementById("rekapTabStudent");
        const summaryTabBtn = document.getElementById("rekapTabSummary");

        const studentForm = document.getElementById("rekapStudentForm");
        const summaryForm = document.getElementById("rekapSummaryForm");

        const segmented = document.querySelector(".rekap-segmented");

        if (studentTabBtn) {
            studentTabBtn.classList.toggle("active", mode === "student");
            studentTabBtn.setAttribute("aria-selected", mode === "student" ? "true" : "false");
        }

        if (summaryTabBtn) {
            summaryTabBtn.classList.toggle("active", mode === "summary");
            summaryTabBtn.setAttribute("aria-selected", mode === "summary" ? "true" : "false");
        }

        if (segmented) {
            segmented.classList.toggle("is-summary", mode === "summary");
        }

        if (studentForm) studentForm.classList.toggle("hidden", mode !== "student");
        if (summaryForm) summaryForm.classList.toggle("hidden", mode !== "summary");

        RekapUI.clear();

    }

    /**
     * ==========================================
     * LOAD DAFTAR KELAS (untuk dropdown)
     * ==========================================
     */

    async function loadClassOptions() {

        const select = document.getElementById("rekapKelas");

        if (!select) return;

        try {

            const response = await RekapAPI.getRekapClassList();

            if (response.success && Array.isArray(response.data)) {

                RekapUI.fillClassOptions(select, response.data);

            }

        } catch (error) {

            Utils.log("Gagal memuat daftar kelas:", error);

        }

    }

    /**
     * ==========================================
     * HANDLE: CEK PER SISWA
     * ==========================================
     */

    async function handleStudentSubmit(event) {

        event.preventDefault();

        const input = document.getElementById("rekapKeyword");
        const keyword = input.value.trim();

        RekapUI.clear();

        if (keyword === "") {

            RekapUI.showError(CONFIG.MESSAGE.EMPTY_KEYWORD);

            input.classList.add("shake");

            setTimeout(() => input.classList.remove("shake"), 500);

            input.focus();

            return;

        }

        RekapUI.showLoading();

        try {

            const response = await RekapAPI.searchRekapStudent(keyword);

            if (!response.success) {

                RekapUI.showError(response.message || CONFIG.MESSAGE.NOT_FOUND);

                return;

            }

            RekapUI.showStudentResult(response.data);

        } catch (error) {

            Utils.log("Rekap student search error:", error);

            RekapUI.showError(CONFIG.MESSAGE.SERVER_ERROR);

        }

    }

    /**
     * ==========================================
     * HANDLE: REKAP KELAS
     * ==========================================
     */

    async function handleSummarySubmit(event) {

        event.preventDefault();

        const kelasSelect = document.getElementById("rekapKelas");
        const mapelSelect = document.getElementById("rekapMapel");

        const kelas = kelasSelect ? kelasSelect.value : "SEMUA";
        const mapel = mapelSelect ? mapelSelect.value : "WAJIB";

        RekapUI.clear();
        RekapUI.showLoading();

        try {

            const response = await RekapAPI.getRekapClassSummary(kelas, mapel);

            if (!response.success) {

                RekapUI.showError(response.message || CONFIG.MESSAGE.SERVER_ERROR);

                return;

            }

            RekapUI.showClassSummary(response.data);

        } catch (error) {

            Utils.log("Rekap class summary error:", error);

            RekapUI.showError(CONFIG.MESSAGE.SERVER_ERROR);

        }

    }

    /**
     * ==========================================
     * PUBLIC
     * ==========================================
     */

    return {

        initialize

    };

})();

document.addEventListener("DOMContentLoaded", () => {

    RekapSearch.initialize();

});
