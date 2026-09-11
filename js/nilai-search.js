/*
==========================================================
SMANSASOO Academic Portal
Nilai Search Module
Version : 1.0.0
==========================================================
Controller untuk form cek nilai di pages/nilai.html.
Pola sama seperti js/search.js: hanya delegasikan ke
NilaiAPI dan NilaiUI, tidak menyimpan logic render sendiri.
==========================================================
*/

window.NilaiSearch = (() => {

    /**
     * ==========================================
     * INITIALIZE
     * ==========================================
     */

    function initialize() {

        const form = document.getElementById("nilaiForm");
        const input = document.getElementById("nilaiKeyword");

        if (!form || !input) {
            console.error("Form cek nilai tidak ditemukan.");
            return;
        }

        form.addEventListener("submit", handleSubmit);

        input.focus();

    }

    /**
     * ==========================================
     * HANDLE SUBMIT
     * ==========================================
     */

    async function handleSubmit(event) {

        event.preventDefault();

        const input = document.getElementById("nilaiKeyword");
        const keyword = input.value.trim();

        NilaiUI.clear();

        if (keyword === "") {

            NilaiUI.showError(CONFIG.MESSAGE.EMPTY_KEYWORD);

            input.classList.add("shake");

            setTimeout(() => {
                input.classList.remove("shake");
            }, 500);

            input.focus();

            return;

        }

        await search(keyword);

    }

    /**
     * ==========================================
     * SEARCH
     * ==========================================
     */

    async function search(keyword) {

        NilaiUI.showLoading();

        try {

            const response = await NilaiAPI.searchNilai(keyword);

            if (!response.success) {

                NilaiUI.showError(response.message || CONFIG.MESSAGE.NOT_FOUND);

                return;

            }

            NilaiUI.showResult(response.data);

        } catch (error) {

            Utils.log("Nilai search error:", error);

            NilaiUI.showError(CONFIG.MESSAGE.SERVER_ERROR);

        }

    }

    /**
     * ==========================================
     * PUBLIC
     * ==========================================
     */

    return {

        initialize,

        search

    };

})();

document.addEventListener("DOMContentLoaded", () => {

    NilaiSearch.initialize();

});
