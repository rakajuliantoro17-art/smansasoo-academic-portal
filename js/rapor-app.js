/*
==========================================================
SMANSASOO Academic Portal
Rapor Pendidikan - Bootstrap
Version : 1.0.0
==========================================================
Controller tipis: panggil RaporData, lalu serahkan ke
RaporUI. Tidak ada logic fetch atau DOM di file ini sendiri
(lihat docs/UI-SHELL.md bagian 6).
==========================================================
*/

document.addEventListener("DOMContentLoaded", async () => {

    RaporUI.showLoading();

    try {

        const data = await RaporData.load();

        RaporUI.showResult(data);

    } catch (error) {

        console.error("Rapor Pendidikan Error :", error);

        RaporUI.showError(error.message);

    }

});
