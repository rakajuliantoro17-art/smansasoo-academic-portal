/*
==========================================================
SMANSASOO Academic Portal
Print Module
Version : 1.0.0
==========================================================
Modul kecil untuk tombol "Cetak / Unduh PDF" di kartu hasil
(kenaikan kelas, nilai, kelulusan, rekap kelas).

CARA PAKAI: taruh atribut data-print-trigger di tombol mana
pun (boleh dibuat lewat innerHTML dinamis, tidak perlu wiring
manual tiap kali kartu di-render ulang, karena pakai event
delegation di document). Contoh:

  <button type="button" data-print-trigger
          data-print-filename="Kenaikan-Kelas-12345">
      Cetak / Unduh PDF
  </button>

Kenapa window.print() (bukan library PDF seperti jsPDF/
html2pdf): setiap browser modern sudah punya "Save as PDF" di
dialog print bawaan, hasilnya tajam (bukan screenshot canvas),
dan tidak perlu menambah dependency/CDN baru. Styling halaman
saat print diatur lewat @media print di css/print.css dan
css/shell.css (untuk sembunyikan navbar/sidebar).

data-print-filename (opsional): document.title diganti
sesaat sebelum dialog print dibuka, supaya nama file default
saat "Save as PDF" lebih rapi (browser biasanya memakai judul
tab sebagai nama file bawaan). Dikembalikan otomatis lewat
event "afterprint" begitu dialog ditutup.
==========================================================
*/

window.Print = (() => {

    function trigger(filename) {

        let originalTitle = null;

        function restoreTitle() {

            if (originalTitle !== null) {
                document.title = originalTitle;
            }

            window.removeEventListener("afterprint", restoreTitle);

        }

        if (filename) {

            originalTitle = document.title;

            document.title = filename;

            window.addEventListener("afterprint", restoreTitle);

        }

        window.print();

    }

    // Event delegation: tombol boleh muncul kapan saja lewat
    // innerHTML dinamis (hasil pencarian), tetap kepasang
    // tanpa perlu wiring ulang di tiap fungsi render.
    document.addEventListener("click", (event) => {

        const btn = event.target.closest("[data-print-trigger]");

        if (!btn) return;

        trigger(btn.dataset.printFilename || null);

    });

    return { trigger };

})();
