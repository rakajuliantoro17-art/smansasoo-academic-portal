/*
==========================================================
SMANSASOO Academic Portal
Shell (Navbar + Sidebar + Footer)
Version : 2.0.0
==========================================================
Satu-satunya tempat markup navbar & sidebar situs
didefinisikan. Setiap halaman (sekarang maupun nanti) cukup
menaruh SATU elemen kosong sebagai baris pertama di <body>,
lalu memuat file ini di akhir <body>:

  <body data-page="nilai">

      <div id="shellNav"></div>

      ... seluruh isi halaman seperti biasa ...

      <div id="shellFooter"></div>

      <script src="js/config.js"></script>
      <script src="js/utils.js"></script>
      <script src="js/shell.js"></script>

  </body>

Shell akan otomatis:
1. Mengisi #shellNav dengan navbar (logo + menu + tombol
   hamburger).
2. Memindahkan SEMUA elemen <body> lainnya (termasuk
   #shellFooter) ke dalam <div class="app-content">, lalu
   menaruhnya di sebelah sidebar (<div class="app-layout">).
   Jadi halaman lama tidak perlu ditulis ulang markup-nya.
3. Mengisi #shellFooter seperti biasa.
4. Memasang sidebar (drawer di mobile, kolom tetap di
   desktop >=1024px) + overlay penutup.

CHANGELOG (v2.0.0):
- Sebelumnya ada 4 pola navbar berbeda di situs ini: dropdown
  versi lama shell.js, navbar custom index.html (css/navbar.css),
  sidebar penuh khusus pages/prestasi.html, dan topbar lokal
  pages/rekap.html. Semuanya digabung jadi SATU sistem di file
  ini (pola sidebar prestasi.html yang paling lengkap, jadi
  itu yang dipakai sebagai basis), supaya semua halaman
  konsisten.
- Kenapa render lewat JS (bukan fetch() partial .html): tidak
  ada request tambahan, tidak ada flash-of-unstyled-content,
  dan tetap jalan walau dibuka dari file:// saat development
  lokal.

Halaman menandai dirinya lewat atribut pada <body>:
  data-page="home"       -> index.html
  data-page="nilai"      -> pages/nilai.html
  data-page="rekap"      -> pages/rekap.html
  data-page="kelulusan"  -> pages/kelulusan.html
  data-page="prestasi"   -> pages/prestasi.html
  data-page="rapor"      -> pages/rapor.html
  data-page="about"      -> pages/about.html
  data-page="privacy"    -> pages/privacy.html

Link baru untuk fitur mendatang TINGGAL ditambahkan ke
NAV_LINKS di bawah, tidak perlu edit tiap halaman satu-satu.

Sidebar per-halaman tambahan (opsional, dipasang oleh halaman
itu sendiri lewat inline <script> SEBELUM tag <script src=
"js/shell.js">) mis. dipakai pages/prestasi.html untuk daftar
lompat "Di Halaman Ini":

  <script>
    window.SHELL_PAGE_SECTIONS = [
        { id: "sekolah", label: "Ringkasan Sekolah", icon: "🏫" },
        { id: "peringkat", label: "Peringkat Nasional", icon: "🥇" }
    ];
    window.SHELL_EXTERNAL_LINK = {
        href: "https://simt.kemendikdasmen.go.id/...",
        label: "Buka Data Resmi di SIMT"
    };
  </script>
==========================================================
*/

window.Shell = (() => {

    /* ==========================================
       REGISTRY LINK NAVIGASI
       (satu-satunya tempat menambah menu baru)
    ========================================== */

    const NAV_LINKS = [
        { key: "home", label: "Beranda", href: "/index.html", icon: "🏠" },
        { key: "nilai", label: "Nilai", href: "/pages/nilai.html", icon: "📝" },
        { key: "rekap", label: "Rekap", href: "/pages/rekap.html", icon: "📊" },
        { key: "kelulusan", label: "Kelulusan", href: "/pages/kelulusan.html", icon: "🎓" },
        { key: "prestasi", label: "Prestasi", href: "/pages/prestasi.html", icon: "🏆" },
        { key: "rapor", label: "Rapor Pendidikan", href: "/pages/rapor.html", icon: "📈" }
    ];

    // Ditambahkan di footer saja (tidak memenuhi navbar/sidebar utama).
    const FOOTER_EXTRA_LINKS = [
        { label: "Tentang", href: "/pages/about.html" },
        { label: "Privasi", href: "/pages/privacy.html" }
    ];

    function activePage() {

        return document.body.dataset.page || "";

    }

    /* ==========================================
       NAVBAR
    ========================================== */

    function navbarHTML() {

        const activeKey = activePage();

        return `

        <nav class="app-navbar">

            <div class="app-navbar-left">

                <button type="button" class="app-hamburger" id="appSidebarToggle" aria-label="Buka menu" aria-expanded="false">
                    &#9776;
                </button>

                <a href="/index.html" class="app-navbar-brand">
                    <img src="/assets/logo/logo.png" alt="Logo ${CONFIG.SCHOOL_NAME}">
                    <strong>${CONFIG.SCHOOL_NAME}</strong>
                </a>

            </div>

            <div class="app-navbar-links">

                ${NAV_LINKS.map((link) => `
                    <a href="${link.href}" class="${link.key === activeKey ? "active" : ""}">${link.label}</a>
                `).join("")}

            </div>

        </nav>

        `;

    }

    /* ==========================================
       SIDEBAR
    ========================================== */

    function sidebarHTML() {

        const activeKey = activePage();

        const pageSections = Array.isArray(window.SHELL_PAGE_SECTIONS) ? window.SHELL_PAGE_SECTIONS : [];
        const externalLink = window.SHELL_EXTERNAL_LINK || null;

        return `

        <p class="app-sidebar-title">Menu Situs</p>

        <nav>

            ${NAV_LINKS.map((link) => `
                <a href="${link.href}" class="${link.key === activeKey ? "active" : ""}">
                    <span class="icon">${link.icon}</span> ${link.label}
                </a>
            `).join("")}

        </nav>

        ${pageSections.length ? `

        <p class="app-sidebar-title">Di Halaman Ini</p>

        <nav id="sectionNav">

            ${pageSections.map((s) => `
                <a href="#${s.id}" data-section="${s.id}">
                    <span class="icon">${s.icon || "&bull;"}</span> ${s.label}
                </a>
            `).join("")}

        </nav>

        ` : ""}

        ${externalLink ? `

        <div class="app-sidebar-external">
            <a href="${externalLink.href}" target="_blank" rel="noopener">
                ${externalLink.label} &rarr;
            </a>
        </div>

        ` : ""}

        `;

    }

    /* ==========================================
       FOOTER
    ========================================== */

    function renderFooter() {

        const mount = document.getElementById("shellFooter");

        if (!mount) return;

        const year = (window.Utils && Utils.getCurrentYear) ? Utils.getCurrentYear() : new Date().getFullYear();

        const allLinks = NAV_LINKS.map((l) => ({ label: l.label, href: l.href })).concat(FOOTER_EXTRA_LINKS);

        mount.innerHTML = `

        <footer class="shell-footer">

            <div class="container shell-footer-inner">

                <div class="shell-footer-links">

                    ${allLinks.map((link) => `<a href="${link.href}">${link.label}</a>`).join("")}

                </div>

                <p>&copy; ${year} ${CONFIG.SCHOOL_NAME}</p>

                <small>${CONFIG.APP_NAME} &middot; v${CONFIG.VERSION}</small>

            </div>

        </footer>

        `;

    }

    /* ==========================================
       LAYOUT: bungkus isi halaman + pasang sidebar
    ========================================== */

    function buildLayout(navMount) {

        // Pindahkan semua elemen <body> lain (kecuali navbar)
        // ke dalam .app-content, tanpa perlu halaman menulis
        // ulang markup-nya.
        const contentWrap = document.createElement("div");
        contentWrap.className = "app-content";

        Array.from(document.body.children).forEach((el) => {

            if (el === navMount) return;

            contentWrap.appendChild(el);

        });

        const overlay = document.createElement("div");
        overlay.className = "app-sidebar-overlay";
        overlay.id = "appSidebarOverlay";

        const sidebar = document.createElement("aside");
        sidebar.className = "app-sidebar";
        sidebar.id = "appSidebar";
        sidebar.innerHTML = sidebarHTML();

        const layout = document.createElement("div");
        layout.className = "app-layout";
        layout.appendChild(sidebar);
        layout.appendChild(contentWrap);

        document.body.appendChild(overlay);
        document.body.appendChild(layout);

        return { overlay, sidebar };

    }

    /* ==========================================
       INTERAKSI: buka/tutup sidebar (mobile)
    ========================================== */

    function wireSidebarToggle(overlay, sidebar) {

        const toggle = document.getElementById("appSidebarToggle");

        function close() {

            document.body.classList.remove("sidebar-open");

            if (toggle) toggle.setAttribute("aria-expanded", "false");

        }

        function open() {

            document.body.classList.add("sidebar-open");

            if (toggle) toggle.setAttribute("aria-expanded", "true");

        }

        if (toggle) {

            toggle.addEventListener("click", () => {

                document.body.classList.contains("sidebar-open") ? close() : open();

            });

        }

        if (overlay) {

            overlay.addEventListener("click", close);

        }

        sidebar.querySelectorAll("a").forEach((link) => {

            link.addEventListener("click", close);

        });

    }

    /* ==========================================
       SCROLL-SPY (opsional, untuk "Di Halaman Ini")
    ========================================== */

    function wireScrollSpy() {

        const pageSections = Array.isArray(window.SHELL_PAGE_SECTIONS) ? window.SHELL_PAGE_SECTIONS : [];

        if (!pageSections.length || !("IntersectionObserver" in window)) return;

        const sections = pageSections
            .map((s) => document.getElementById(s.id))
            .filter(Boolean);

        const links = document.querySelectorAll("#sectionNav a");

        if (!sections.length || !links.length) return;

        const observer = new IntersectionObserver((entries) => {

            entries.forEach((entry) => {

                if (!entry.isIntersecting) return;

                links.forEach((link) => {

                    link.classList.toggle(
                        "active",
                        link.dataset.section === entry.target.id
                    );

                });

            });

        }, { rootMargin: "-40% 0px -50% 0px" });

        sections.forEach((section) => observer.observe(section));

    }

    /* ==========================================
       INIT
    ========================================== */

    function initialize() {

        const navMount = document.getElementById("shellNav");

        if (!navMount) return;

        navMount.innerHTML = navbarHTML();

        const { overlay, sidebar } = buildLayout(navMount);

        renderFooter();

        wireSidebarToggle(overlay, sidebar);
        wireScrollSpy();

    }

    return {

        NAV_LINKS,

        initialize

    };

})();

document.addEventListener("DOMContentLoaded", () => {

    Shell.initialize();

});
