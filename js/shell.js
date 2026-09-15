/*
==========================================================
SMANSASOO Academic Portal
Shell (Navbar + Sidebar + Footer)
Version : 2.1.0
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

CHANGELOG (v2.1.0):
- Sidebar bisa di-minimize (kolom ikon saja) lewat tombol
  chevron di sidebar ATAU shortcut keyboard Ctrl+B / Cmd+B.
  Preferensi disimpan di localStorage, konsisten di semua
  halaman. Lihat wireSidebarCollapse().
- Tiap link sidebar sekarang punya title="" (tooltip native)
  supaya tetap jelas maksudnya saat collapsed jadi ikon saja.

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

        <div class="app-sidebar-head">

            <p class="app-sidebar-title">Menu Situs</p>

            <button
                type="button"
                class="app-sidebar-collapse-btn"
                id="appSidebarCollapseBtn"
                aria-label="Perkecil sidebar (Ctrl+B)"
                title="Perkecil / perbesar sidebar (Ctrl+B)">
                &#10094;
            </button>

        </div>

        <nav>

            ${NAV_LINKS.map((link) => `
                <a href="${link.href}" class="${link.key === activeKey ? "active" : ""}" title="${link.label}">
                    <span class="icon">${link.icon}</span> <span class="label">${link.label}</span>
                </a>
            `).join("")}

        </nav>

        ${pageSections.length ? `

        <p class="app-sidebar-title">Di Halaman Ini</p>

        <nav id="sectionNav">

            ${pageSections.map((s) => `
                <a href="#${s.id}" data-section="${s.id}" title="${s.label}">
                    <span class="icon">${s.icon || "&bull;"}</span> <span class="label">${s.label}</span>
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

        mount.innerHTML = `

        <footer class="shell-footer">

            <div class="container shell-footer-inner">

                <div class="shell-footer-links">

                    ${FOOTER_EXTRA_LINKS.map((link) => `<a href="${link.href}">${link.label}</a>`).join("")}

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
       SIDEBAR MINIMIZE (desktop) -- tombol chevron
       + shortcut keyboard Ctrl+B (Cmd+B di Mac).
       Preferensi disimpan di localStorage supaya
       konsisten dipindah-pindah halaman.
    ========================================== */

    const COLLAPSE_STORAGE_KEY = "smansasoo-sidebar-collapsed";

    function isCollapsed() {

        try {
            return localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
        } catch (e) {
            return false;
        }

    }

    function setCollapsed(collapsed) {

        document.body.classList.toggle("sidebar-collapsed", collapsed);

        const btn = document.getElementById("appSidebarCollapseBtn");

        if (btn) {
            btn.setAttribute("aria-label", collapsed ? "Perbesar sidebar (Ctrl+B)" : "Perkecil sidebar (Ctrl+B)");
        }

        try {
            localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? "1" : "0");
        } catch (e) {
            // localStorage tidak tersedia -- abaikan, cukup state di memori.
        }

    }

    function wireSidebarCollapse() {

        // Terapkan preferensi tersimpan begitu shell dimuat.
        setCollapsed(isCollapsed());

        const btn = document.getElementById("appSidebarCollapseBtn");

        if (btn) {

            btn.addEventListener("click", () => {

                setCollapsed(!document.body.classList.contains("sidebar-collapsed"));

            });

        }

        // Ctrl+B / Cmd+B -- hanya efektif di desktop (sidebar
        // dock tetap), CSS-nya sendiri sudah di-scope ke situ,
        // jadi aman dipasang global tanpa cek lebar layar di JS.
        document.addEventListener("keydown", (event) => {

            const isShortcut = (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey
                && event.key.toLowerCase() === "b";

            if (!isShortcut) return;

            event.preventDefault();

            setCollapsed(!document.body.classList.contains("sidebar-collapsed"));

        });

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
        wireSidebarCollapse();
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
