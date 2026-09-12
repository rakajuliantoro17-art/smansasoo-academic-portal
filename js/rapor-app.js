/*
==========================================================
SMANSASOO Academic Portal
Rapor Pendidikan - Bootstrap
Version : 2.0.0
==========================================================
CHANGELOG (v2.0.0):
- Sebelumnya langsung load() satu file data tanpa pilihan
  tahun. Sekarang alurnya:
  1. Ambil index (daftar tahun tersedia + tahun default)
  2. Isi dropdown tahun berdasar index itu
  3. Muat data tahun default, render
  4. Kalau dropdown diganti user, muat ulang data tahun yang
     dipilih (tanpa reload halaman)
==========================================================
*/

document.addEventListener("DOMContentLoaded", async () => {

    RaporUI.showLoading();

    try {

        const index = await RaporData.loadIndex();

        const years = index.tahun_tersedia || [];
        const defaultYear = index.tahun_default || years[0];

        RaporUI.renderYearSelect(years, defaultYear);

        RaporUI.onYearChange(async (year) => {

            RaporUI.showLoading();

            try {

                const data = await RaporData.load(year);
                RaporUI.showResult(data);

            } catch (error) {

                console.error("Rapor Pendidikan Error :", error);
                RaporUI.showError(error.message);

            }

        });

        const data = await RaporData.load(defaultYear);

        RaporUI.showResult(data);

    } catch (error) {

        console.error("Rapor Pendidikan Error :", error);

        RaporUI.showError(error.message);

    }

});
