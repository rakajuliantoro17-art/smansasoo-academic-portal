/*
==========================================================
SMANSASOO Academic Portal
Settings Drawer (sidebar pengaturan, bisa di-minimize)
Version : 1.0.0
==========================================================
Drawer pengaturan global yang muncul di SEMUA halaman yang
memuat file ini (lewat js/shell.js sudah ada di semua
halaman, tapi drawer ini modul terpisah supaya tidak
mengubah shell.js yang sudah stabil).

Cara kerja:
- Sembunyi total di luar layar (translateX) secara default —
  sesuai permintaan: "minimize" = geser keluar penuh, bukan
  menyempit jadi ikon.
- Ada satu tombol kecil (bulat, ikon gear) yang selalu
  kelihatan di pojok kanan bawah untuk membuka drawer lagi.
- Isi drawer saat ini baru satu pengaturan: toggle mode
  gelap/terang (pakai window.Theme dari js/theme.js, kalau
  ada). Ke depan, pengaturan lain tinggal ditambah sebagai
  baris baru di dalam .settings-drawer-body.

SYARAT: halaman yang memuat file ini SEBAIKNYA juga memuat
js/theme.js (sebelum file ini) supaya toggle-nya berfungsi.
Kalau window.Theme tidak ada, toggle tetap dirender tapi
diberi status disabled (tidak melempar error).
==========================================================
*/

window.SettingsDrawer = (() => {

    const TOGGLE_ID = "settingsThemeToggle";

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

            </div>

        </aside>

        `;

    }

    function open(drawer, overlay, trigger) {

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

    }

    return { initialize };

})();

document.addEventListener("DOMContentLoaded", () => {

    SettingsDrawer.initialize();

});
