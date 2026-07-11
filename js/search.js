/*
==========================================================
SMANSASOO Academic Portal
Search Module
Version : 1.1.0
==========================================================
FIX (v1.1.0):
- Sebelumnya file ini tidak pernah dimuat oleh index.html
  sama sekali (dead code). Sekarang di-load dan jadi
  satu-satunya controller pencarian.
- Tidak lagi punya salinan showResult/showLoading/showError
  sendiri — semua rendering didelegasikan ke window.UI
  supaya hanya ada SATU implementasi tampilan.
==========================================================
*/

window.Search = (() => {

    /**
     * ==========================================
     * INITIALIZE
     * ==========================================
     */

    function initialize() {

        const form = document.getElementById("searchForm");
        const input = document.getElementById("keyword");

        if (!form || !input) {
            console.error("Search form tidak ditemukan.");
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

        const input = document.getElementById("keyword");
        const keyword = input.value.trim();

        UI.clear();

        if (keyword === "") {

            UI.showError(CONFIG.MESSAGE.EMPTY_KEYWORD);

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

        UI.showLoading();

        try {

            const response = await API.searchStudent(keyword);

            if (!response.success) {

                UI.showError(response.message || CONFIG.MESSAGE.NOT_FOUND);

                return;

            }

            UI.showResult(response.data);

        } catch (error) {

            Utils.log("Search error:", error);

            UI.showError(CONFIG.MESSAGE.SERVER_ERROR);

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
