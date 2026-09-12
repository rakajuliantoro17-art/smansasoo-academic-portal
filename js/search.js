/*
==========================================================
SMANSASOO Graduation Portal
Search Module
Version : 2.0.0
==========================================================

Mengatur seluruh proses pencarian data kelulusan.

Flow

User
   │
Submit Form
   │
Validasi
   │
Loading
   │
API.searchStudent()
   │
┌──────────────┐
│ Success      │
│ showResult() │
└──────────────┘
        │
┌──────────────┐
│ Failed       │
│ showError()  │
└──────────────┘

==========================================================
*/

window.Search = (() => {

    let isSearching = false;

    /**
     * ==================================================
     * INITIALIZE
     * ==================================================
     */

    function initialize() {

        const form = document.getElementById("searchForm");
        const input = document.getElementById("keyword");

        if (!form || !input) {

            console.error("Search form tidak ditemukan.");

            return;

        }

        form.addEventListener("submit", handleSubmit);

        input.placeholder = CONFIG.SEARCH_PLACEHOLDER;

        input.focus();

    }

    /**
     * ==================================================
     * HANDLE SUBMIT
     * ==================================================
     */

    async function handleSubmit(event) {

        event.preventDefault();

        if (isSearching) return;

        const input = document.getElementById("keyword");

        const keyword = input.value.trim();

        UI.clear();

        if (keyword.length === 0) {

            showInputError(
                CONFIG.MESSAGE.EMPTY_KEYWORD,
                input
            );

            return;

        }

        if (keyword.length < CONFIG.SEARCH_MIN_LENGTH) {

            showInputError(
                "NIS atau NISN tidak valid.",
                input
            );

            return;

        }

        await search(keyword);

    }

    /**
     * ==================================================
     * SEARCH
     * ==================================================
     */

    async function search(keyword) {

        isSearching = true;

        // Setelah tombol "Lihat Hasil Kelulusan" diklik (dan lolos
        // validasi), ganti background halaman dari scc.jpg ke
        // syari.png. Class ini dibaca oleh css/glass.css (.bg-layer).
        document.body.classList.add("celebration");

        const button = document.querySelector(
            "#searchForm button"
        );

        if (button) {

            button.disabled = true;

            button.innerHTML = "Memproses...";

        }

        UI.showLoading();

        try {

            const response =
                await API.searchStudent(keyword);

            UI.clear();

            if (!response.success) {

                UI.showError(

                    response.message ||

                    CONFIG.MESSAGE.NOT_FOUND

                );

                return;

            }

            UI.showResult(response.data);

        }

        catch (error) {

            Utils.log(error);

            UI.clear();

            UI.showError(

                CONFIG.MESSAGE.SERVER_ERROR

            );

        }

        finally {

            isSearching = false;

            if (button) {

                button.disabled = false;

                button.innerHTML =

                    "Lihat Hasil Kelulusan";

            }

        }

    }

    /**
     * ==================================================
     * INPUT ERROR
     * ==================================================
     */

    function showInputError(message, input) {

        UI.showError(message);

        input.classList.add("shake");

        input.focus();

        setTimeout(() => {

            input.classList.remove("shake");

        }, 500);

    }

    /**
     * ==================================================
     * PUBLIC
     * ==================================================
     */

    return {

        initialize,

        search

    };

})();
