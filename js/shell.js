/*
==========================================================
SMANSASOO Academic Portal
Shell (Nav + Footer)
Version : 1.0.0
==========================================================
Satu-satunya tempat markup nav bar & footer didefinisikan.
Setiap halaman (sekarang maupun nanti) cukup menaruh dua
elemen kosong lalu memuat file ini:

  <div id="shellNav"></div>
  ... isi halaman ...
  <div id="shellFooter"></div>

  <script src="js/config.js"></script>
  <script src="js/utils.js"></script>
  <script src="js/shell.js"></script>

Kenapa begini (bukan fetch() partial .html)?
- Tidak butuh request tambahan / tidak ada flash-of-unstyled-
  content saat load.
- Konsisten dengan pola project ini: komponen lain (nilai-ui.js,
  nilai-kelas-ui.js) juga merender lewat template string JS,
  bukan file .html terpisah.
- Tetap jalan walau halaman dibuka langsung dari file:// saat
  development lokal (tidak kena batasan CORS seperti fetch()).

Halaman menandai dirinya lewat:
  <body data-page="home">      -> Beranda (index.html)
  <body data-page="nilai">     -> pages/nilai.html
  <body data-page="about">     -> pages/about.html
  <body data-page="privacy">   -> pages/privacy.html

Link baru untuk fitur mendatang TINGGAL ditambahkan ke
NAV_LINKS di bawah, tidak perlu edit tiap halaman satu-satu.
==========================================================
*/

window.Shell = (() => {

    /* ==========================================
       REGISTRY LINK NAVIGASI
       (satu-satunya tempat menambah menu baru)
    ========================================== */

    const NAV_LINKS = [
        { key: "home", label: "Beranda", href: "/index.html" },
        { key: "nilai", label: "Cek Nilai", href: "/pages/nilai.html" },
        { key: "about", label: "Tentang", href: "/pages/about.html" },
        { key: "privacy", label: "Privasi", href: "/pages/privacy.html" }
    ];

    /* ==========================================
       NAV BAR
    ========================================== */

    function renderNav() {

        const mount = document.getElementById("shellNav");

        if (!mount) return;

        const activeKey = document.body.dataset.page || "";

        mount.innerHTML = `

        <nav class="shell-nav">

            <div class="shell-nav-inner">

                <a href="/index.html" class="shell-brand">

                    <img src="/assets/logo/logo.png" alt="Logo SMAN 1 Sooko" class="shell-brand-logo">

                    <span>${CONFIG.SCHOOL_NAME}</span>

                </a>

                <button type="button" class="shell-nav-toggle" id="shellNavToggle" aria-label="Buka menu" aria-expanded="false">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <div class="shell-nav-links" id="shellNavLinks">

                    ${NAV_LINKS.map((link) => `
                        <a href="${link.href}" class="shell-nav-link ${link.key === activeKey ? "active" : ""}">
                            ${link.label}
                        </a>
                    `).join("")}

                </div>

            </div>

        </nav>

        `;

        const toggle = document.getElementById("shellNavToggle");
        const links = document.getElementById("shellNavLinks");

        if (toggle && links) {

            toggle.addEventListener("click", () => {

                const isOpen = links.classList.toggle("open");
                toggle.setAttribute("aria-expanded", String(isOpen));

            });

        }

    }

    /* ==========================================
       FOOTER
    ========================================== */

    function renderFooter() {

        const mount = document.getElementById("shellFooter");

        if (!mount) return;

        const year = (window.Utils && Utils.getCurrentYear) ? Utils.getCurrentYear() : new Date().getFullYear();

        mount.innerHTML = `

        <footer class="shell-footer">

            <div class="container shell-footer-inner">

                <div class="shell-footer-links">

                    ${NAV_LINKS.map((link) => `<a href="${link.href}">${link.label}</a>`).join("")}

                </div>

                <p>&copy; ${year} ${CONFIG.SCHOOL_NAME}</p>

                <small>${CONFIG.APP_NAME} &middot; v${CONFIG.VERSION}</small>

            </div>

        </footer>

        `;

    }

    function initialize() {

        renderNav();
        renderFooter();

    }

    return {

        NAV_LINKS,

        initialize

    };

})();

document.addEventListener("DOMContentLoaded", () => {

    Shell.initialize();

});
