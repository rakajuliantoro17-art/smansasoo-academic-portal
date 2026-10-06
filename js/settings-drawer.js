/*
==========================================================
SMANSASOO Academic Portal
Settings Drawer (sidebar pengaturan, bisa di-minimize)
Version : 1.1.0
==========================================================
Drawer pengaturan global yang muncul di SEMUA halaman yang
memuat file ini (lewat js/shell.js sudah ada di semua
halaman, tapi drawer ini modul terpisah supaya tidak
mengubah shell.js yang sudah stabil).

Cara kerja:
- Sembunyi total di luar layar (translateX) secara default —
  sesuai permintaan: "minimize" = geser keluar penuh, bukan
  menyempit jadi ikon.
- Ada SATU tombol kecil (bulat, ikon gear) yang selalu
  kelihatan di pojok kanan bawah untuk membuka drawer lagi --
  ini satu-satunya tombol gear di seluruh situs (tidak ada
  tombol gear kedua di navbar).
- Isi drawer: toggle mode gelap/terang (pakai window.Theme
  dari js/theme.js), dan menu admin (Absensi Scan, Generate
  QR Siswa, Rekap Absensi) yang minta login lewat
  window.AdminAuth (js/admin-auth.js) sebelum membuka halaman
  tujuan. Ke depan, pengaturan lain tinggal ditambah sebagai
  baris baru di dalam .settings-drawer-body.

SYARAT:
- js/theme.js (sebelum file ini) supaya toggle tema berfungsi.
  Kalau window.Theme tidak ada, toggle tetap dirender tapi
  diberi status disabled (tidak melempar error).
- js/admin-auth.js supaya menu admin bisa login. Dimuat
  otomatis oleh js/shell.js (Shell.loadStats()) di semua
  halaman, jadi tidak perlu ditambah manual. Kalau belum
  selesai dimuat saat drawer dibuka (jarang terjadi), menu
  tetap bisa diklik -- tautan langsung terbuka tanpa gerbang
  login untuk request itu saja.
==========================================================
*/

window.SettingsDrawer = (() => {

    const TOGGLE_ID = "settingsThemeToggle";

    const ADMIN_MENU = [
        {
            key: "absensi-scan",
            title: "Absensi Scan",
            desc: "Scan kartu QR siswa dengan kamera",
            href: "/pages/absensi-scan"
        },
        {
            key: "absensi-admin",
            title: "Generate QR Siswa",
            desc: "Buat & cetak kartu QR absen per siswa",
            href: "/pages/absensi-admin"
        },
        {
            key: "absensi-rekap",
            title: "Rekap Absensi",
            desc: "Lihat kehadiran siswa per sesi",
            href: "/pages/absensi-rekap"
        }
    ];

    const CAMERA_ICON = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/>
            <rect x="8.5" y="8.5" width="7" height="7" rx="1"/>
        </svg>`;

    const LOCK_ICON = `
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
        </svg>`;

    function adminMenuMarkup() {

        const items = ADMIN_MENU.map((item) => `

            <li>
                <button type="button" class="settings-admin-item" data-key="${item.key}" data-href="${item.href}">
                    <span class="settings-admin-ico">${CAMERA_ICON}</span>
                    <span class="settings-admin-text">
                        <span class="settings-admin-name">${item.title}</span>
                        <span class="settings-admin-desc">${item.desc}</span>
                    </span>
                    <span class="settings-admin-badge">${LOCK_ICON} Admin</span>
                </button>
            </li>

        `).join("");

        return `

        <div class="settings-row settings-row--stack">

            <div class="settings-row-text">
                <span class="settings-row-title">Menu Admin</span>
                <span class="settings-row-desc">Absensi QR -- perlu login</span>
            </div>

            <ul class="settings-admin-list" id="settingsAdminList">${items}</ul>

            <div class="settings-admin-status" id="settingsAdminStatus" hidden>
                <span>Sesi admin aktif</span>
                <button type="button" class="settings-admin-logout" id="settingsAdminLogout">Keluar</button>
            </div>

        </div>

        `;

    }

    function markup() {

        return `

        <button
            type="button"
            class="settings-trigger"
            id="settingsTrigger"
            aria-label="Buka panel pengaturan"
            aria-haspopup="dialog"
            aria-expanded="false">

            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"></path>
            </svg>

        </button>

        <div class="settings-drawer-overlay" id="settingsOverlay"></div>

        <aside class="settings-drawer" id="settingsDrawer" role="dialog" aria-modal="true" aria-label="Panel pengaturan" aria-hidden="true">

            <div class="settings-drawer-head">
                <strong>Pengaturan</strong>
                <button type="button" class="settings-close" id="settingsClose" aria-label="Tutup panel pengaturan">
                    &times;
                </button>
            </div>

            <div class="settings-drawer-body">

                <div class="settings-row">

                    <div class="settings-row-text">
                        <span class="settings-row-title">Mode Tampilan</span>
                        <span class="settings-row-desc">Beralih antara terang dan gelap</span>
                    </div>

                    <button
                        type="button"
                        class="theme-toggle"
                        id="${TOGGLE_ID}"
                        aria-label="Ganti mode gelap/terang"
                        aria-pressed="false">

                        <span class="theme-toggle-track">
                            <span class="theme-toggle-icon" aria-hidden="true">&#9728;&#65039;</span>
                            <span class="theme-toggle-icon" aria-hidden="true">&#127769;</span>
                        </span>

                        <span class="theme-toggle-thumb" aria-hidden="true"></span>

                    </button>

                </div>

                ${adminMenuMarkup()}

            </div>

        </aside>

        `;

    }

    function refreshAdminStatus() {

        const statusEl = document.getElementById("settingsAdminStatus");

        if (!statusEl) return;

        statusEl.hidden = !(window.AdminAuth && window.AdminAuth.isLoggedIn());

    }

    function open(drawer, overlay, trigger) {

        refreshAdminStatus();

        drawer.classList.add("open");
        overlay.classList.add("open");
        drawer.setAttribute("aria-hidden", "false");
        trigger.setAttribute("aria-expanded", "true");

    }

    function close(drawer, overlay, trigger) {

        drawer.classList.remove("open");
        overlay.classList.remove("open");
        drawer.setAttribute("aria-hidden", "true");
        trigger.setAttribute("aria-expanded", "false");

    }

    function initialize() {

        const wrapper = document.createElement("div");
        wrapper.innerHTML = markup();

        while (wrapper.firstChild) {
            document.body.appendChild(wrapper.firstChild);
        }

        const trigger = document.getElementById("settingsTrigger");
        const overlay = document.getElementById("settingsOverlay");
        const drawer = document.getElementById("settingsDrawer");
        const closeBtn = document.getElementById("settingsClose");

        trigger.addEventListener("click", () => open(drawer, overlay, trigger));
        overlay.addEventListener("click", () => close(drawer, overlay, trigger));
        closeBtn.addEventListener("click", () => close(drawer, overlay, trigger));

        document.addEventListener("keydown", (event) => {

            if (event.key === "Escape" && drawer.classList.contains("open")) {
                close(drawer, overlay, trigger);
            }

        });

        if (window.Theme) {

            Theme.initToggle(TOGGLE_ID);

        } else {

            const toggleBtn = document.getElementById(TOGGLE_ID);

            if (toggleBtn) {
                toggleBtn.disabled = true;
                toggleBtn.title = "Modul tema belum dimuat di halaman ini";
            }

        }

        /* ---------- Menu Admin ---------- */

        document.querySelectorAll(".settings-admin-item").forEach((btn) => {

            btn.addEventListener("click", async () => {

                const href = btn.getAttribute("data-href");

                close(drawer, overlay, trigger);

                if (!window.AdminAuth) {
                    window.location.href = href;
                    return;
                }

                if (window.AdminAuth.isLoggedIn()) {
                    window.location.href = href;
                    return;
                }

                const ok = await window.AdminAuth.openLogin({ dismissible: true });

                if (ok) window.location.href = href;

            });

        });

        const logoutBtn = document.getElementById("settingsAdminLogout");

        if (logoutBtn) {

            logoutBtn.addEventListener("click", () => {

                if (window.AdminAuth) window.AdminAuth.logout();
                refreshAdminStatus();

            });

        }

    }

    return { initialize };

})();

document.addEventListener("DOMContentLoaded", () => {

    SettingsDrawer.initialize();

});
