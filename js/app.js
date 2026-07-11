/*
==========================================================
SMANSASOO Academic Portal
Application Bootstrap
Version : 1.1.0
==========================================================
FIX (v1.1.0):
- Sebelumnya file ini punya salinan sendiri dari
  showResult/showError/showLoading/hideLoading yang identik
  dengan ui.js dan search.js (3 implementasi paralel).
  Sekarang app.js hanya bertugas menyalakan Search module.
==========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    Search.initialize();

});
