/*
==========================================================
SMANSASOO Academic Portal
Nilai Kelas Search Module
Version : 1.0.0
==========================================================
Controller untuk tab "Rata-Rata Kelas" di pages/nilai.html.
Mengisi dropdown kelas lewat NilaiKelasAPI.getClassList(),
lalu mendelegasikan tombol "Tampilkan" ke
NilaiKelasAPI.getClassSummary() + NilaiKelasUI.
==========================================================
*/

window.NilaiKelasSearch = (() => {

    let classListLoaded = false;

    function initialize() {

        const btn = document.getElementById("kelasSubmit");

        if (!btn) {
            console.error("Tombol tampilkan rekap kelas tidak ditemukan.");
            return;
        }

        btn.addEventListener("click", handleSubmit);

    }

    async function ensureClassList() {

        if (classListLoaded) return;

        const select = document.getElementById("selectKelas");

        if (!select) return;

        try {

            const classes = await NilaiKelasAPI.getClassList();

            classes.forEach((k) => {

                const opt = document.createElement("option");
                opt.value = k;
                opt.textContent = k;
                select.appendChild(opt);

            });

            classListLoaded = true;

        } catch (error) {

            Utils.log("Gagal memuat daftar kelas:", error);

        }

    }

    async function handleSubmit() {

        const kelas = document.getElementById("selectKelas").value;
        const mapel = document.getElementById("selectMapelClass").value;

        NilaiKelasUI.showLoading();

        try {

            const response = await NilaiKelasAPI.getClassSummary(kelas, mapel);

            if (!response.success) {

                NilaiKelasUI.showError(response.message || CONFIG.MESSAGE.SERVER_ERROR);

                return;

            }

            NilaiKelasUI.showResult(response.data);

        } catch (error) {

            Utils.log("Kelas summary error:", error);

            NilaiKelasUI.showError(CONFIG.MESSAGE.SERVER_ERROR);

        }

    }

    return {

        initialize,

        ensureClassList

    };

})();

document.addEventListener("DOMContentLoaded", () => {

    NilaiKelasSearch.initialize();

});
