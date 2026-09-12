/*
==========================================================
SMANSASOO Academic Portal
Nilai Page Tabs Module
Version : 1.0.0
==========================================================
Mengatur dua tab di pages/nilai.html: "Cari Per NIS" dan
"Rata-Rata Kelas". Saat tab kelas dibuka pertama kali,
dropdown kelasnya diisi (lazy load).
==========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    const tabNIS = document.getElementById("pageTabNIS");
    const tabKelas = document.getElementById("pageTabKelas");
    const sectionNIS = document.getElementById("sectionNIS");
    const sectionKelas = document.getElementById("sectionKelas");

    if (!tabNIS || !tabKelas || !sectionNIS || !sectionKelas) return;

    tabNIS.addEventListener("click", () => {

        tabNIS.classList.add("active");
        tabKelas.classList.remove("active");
        sectionNIS.classList.remove("hidden");
        sectionKelas.classList.add("hidden");

    });

    tabKelas.addEventListener("click", () => {

        tabKelas.classList.add("active");
        tabNIS.classList.remove("active");
        sectionKelas.classList.remove("hidden");
        sectionNIS.classList.add("hidden");

        if (window.NilaiKelasSearch) {
            NilaiKelasSearch.ensureClassList();
        }

    });

});
