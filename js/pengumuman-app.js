/*
==========================================================
SMANSASOO Academic Portal
Pengumuman - Bootstrap
Version : 1.0.0
==========================================================
*/

document.addEventListener("DOMContentLoaded", async () => {

    PengumumanUI.showLoading();

    try {

        const list = await PengumumanData.load();

        PengumumanUI.showResult(list);

    } catch (error) {

        console.error("Pengumuman Error :", error);

        PengumumanUI.showError(error.message);

    }

});
