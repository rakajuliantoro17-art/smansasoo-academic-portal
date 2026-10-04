/*
==========================================================
SMANSASOO Academic Portal
Settings Panel (Pengaturan)
Version : 1.0.0
==========================================================
Tombol roda gigi di navbar membuka panel "Pengaturan" berisi
menu khusus admin. Klik menu -> muncul overlay login admin
(js/admin-auth.js). Setelah login berhasil, halaman tujuan
dibuka.

Menambah menu baru: tambahkan satu objek ke MENU di bawah.

Dimuat otomatis oleh js/shell.js (Shell.loadStats) SETELAH
navbar dirender, jadi halaman tidak perlu menambah tag apa pun.
==========================================================
*/

(function () {

    if (window.__settingsPanelLoaded) return;

    window.__settingsPanelLoaded = true;

    // true  = selalu minta login tiap klik menu
    // false = kalau sesi admin masih aktif (tab yang sama), langsung buka
    const ALWAYS_ASK = false;

    const MENU = [
        {
            key: "absensi-scan",
            title: "Absensi Scan",
            desc: "Scan kartu QR siswa dengan kamera",
            href: "/pages/absensi-scan"
        }
        // Contoh menu lain yang bisa ditambahkan:
        // { key: "absensi-admin", title: "Generate QR Siswa", desc: "Cetak kartu absen", href: "/pages/absensi-admin" },
        // { key: "absensi-rekap", title: "Rekap Absensi", desc: "Lihat kehadiran siswa", href: "/pages/absensi-rekap" }
    ];

    const GEAR = `
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>`;

    const LOCK = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
        </svg>`;

    const CAMERA = `
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/>
            <rect x="8.5" y="8.5" width="7" height="7" rx="1"/>
        </svg>`;

    let toggleEl = null;
    let panelEl = null;
    let backdropEl = null;
    let statusEl = null;

    function injectStyle() {

        const style = document.createElement("style");
        style.id = "settingsPanelStyle";
        style.textContent = `
            .sp-toggle {
                display: inline-flex; align-items: center; justify-content: center;
                flex: none; width: 44px; height: 44px; margin-left: auto; padding: 0;
                border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 12px;
                background: rgba(255, 255, 255, 0.14); color: #fff; cursor: pointer;
            }
            .sp-toggle[aria-expanded="true"] { background: rgba(255, 255, 255, 0.28); }
            .sp-toggle--float {
                position: fixed; right: 14px; bottom: 14px; z-index: 99980; margin: 0;
                background: #0f4c81; border-color: #0f4c81; box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3);
            }
            .sp-toggle:focus-visible, .sp-close:focus-visible, .sp-item:focus-visible, .sp-logout:focus-visible {
                outline: 3px solid #7cc0ff; outline-offset: 2px;
            }
            .sp-backdrop { position: fixed; inset: 0; z-index: 99970; background: transparent; }
            .sp-backdrop[hidden], .sp-panel[hidden] { display: none; }
            .sp-panel {
                --sp-ink: #14233a; --sp-muted: #55657d; --sp-bg: rgba(255, 255, 255, 0.94);
                --sp-line: rgba(20, 35, 58, 0.16); --sp-accent: #0f4c81; --sp-hover: rgba(15, 76, 129, 0.08);
                position: fixed; top: 68px; right: 12px; z-index: 99975;
                width: min(340px, calc(100vw - 24px)); padding: 14px 14px 12px;
                border: 1px solid var(--sp-line); border-radius: 16px;
                background: var(--sp-bg); color: var(--sp-ink);
                -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
                box-shadow: 0 18px 44px rgba(10, 25, 50, 0.28);
                font-family: "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
            }
            :root[data-theme="dark"] .sp-panel {
                --sp-ink: #e8eef8; --sp-muted: #a5b4ca; --sp-bg: rgba(14, 24, 40, 0.94);
                --sp-line: rgba(232, 238, 248, 0.2); --sp-accent: #7cc0ff; --sp-hover: rgba(124, 192, 255, 0.12);
            }
            .sp-panel *, .sp-panel *::before, .sp-panel *::after { box-sizing: border-box; }
            .sp-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
            .sp-title { margin: 0; font-size: 1.05rem; font-weight: 800; }
            .sp-close {
                width: 40px; height: 40px; border: 0; border-radius: 10px; background: transparent;
                color: var(--sp-muted); font-size: 1.5rem; line-height: 1; cursor: pointer;
            }
            .sp-group { margin: 4px 2px 6px; color: var(--sp-muted); font-size: 0.82rem; font-weight: 700; }
            .sp-list { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
            .sp-item {
                display: grid; grid-template-columns: 40px 1fr auto; align-items: center; gap: 10px;
                width: 100%; min-height: 60px; padding: 8px 10px; text-align: left;
                border: 1px solid var(--sp-line); border-radius: 12px;
                background: transparent; color: inherit; font: inherit; cursor: pointer;
            }
            .sp-item:hover { background: var(--sp-hover); }
            .sp-ico {
                display: inline-flex; align-items: center; justify-content: center;
                width: 40px; height: 40px; border-radius: 10px; background: var(--sp-hover); color: var(--sp-accent);
            }
            .sp-name { display: block; font-size: 0.98rem; font-weight: 800; line-height: 1.2; }
            .sp-desc { display: block; margin-top: 2px; color: var(--sp-muted); font-size: 0.82rem; line-height: 1.3; }
            .sp-badge {
                display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 999px;
                background: var(--sp-hover); color: var(--sp-accent); font-size: 0.74rem; font-weight: 800;
            }
            .sp-status {
                display: flex; align-items: center; justify-content: space-between; gap: 8px;
                margin: 10px 2px 0; padding-top: 10px; border-top: 1px solid var(--sp-line);
                color: var(--sp-muted); font-size: 0.84rem;
            }
            .sp-status[hidden] { display: none; }
            .sp-logout {
                min-height: 36px; padding: 0 12px; border: 1px solid var(--sp-line); border-radius: 9px;
                background: transparent; color: var(--sp-ink); font: inherit; font-size: 0.84rem; font-weight: 700; cursor: pointer;
            }
        `;

        document.head.appendChild(style);

    }

    function el(tag, className, html) {

        const node = document.createElement(tag);

        if (className) node.className = className;
        if (html !== undefined) node.innerHTML = html;

        return node;

    }

    function refreshStatus() {

        if (!statusEl || !window.AdminAuth) return;

        const logged = window.AdminAuth.isLoggedIn();

        statusEl.hidden = !logged;

    }

    function openPanel() {

        refreshStatus();

        backdropEl.hidden = false;
        panelEl.hidden = false;
        toggleEl.setAttribute("aria-expanded", "true");

        const first = panelEl.querySelector(".sp-item");

        if (first) first.focus();

    }

    function closePanel(restoreFocus) {

        panelEl.hidden = true;
        backdropEl.hidden = true;
        toggleEl.setAttribute("aria-expanded", "false");

        if (restoreFocus) toggleEl.focus();

    }

    async function onMenuClick(item) {

        closePanel(false);

        if (!window.AdminAuth) {
            window.location.href = item.href;
            return;
        }

        if (!ALWAYS_ASK && window.AdminAuth.isLoggedIn()) {
            window.location.href = item.href;
            return;
        }

        const ok = await window.AdminAuth.openLogin({ dismissible: true });

        if (ok) window.location.href = item.href;

    }

    function build() {

        injectStyle();

        toggleEl = el("button", "sp-toggle", GEAR);
        toggleEl.type = "button";
        toggleEl.id = "settingsPanelToggle";
        toggleEl.title = "Pengaturan";
        toggleEl.setAttribute("aria-label", "Pengaturan");
        toggleEl.setAttribute("aria-haspopup", "dialog");
        toggleEl.setAttribute("aria-expanded", "false");

        const navbar = document.querySelector(".app-navbar");

        if (navbar) {
            navbar.appendChild(toggleEl);
        } else {
            toggleEl.classList.add("sp-toggle--float");
            document.body.appendChild(toggleEl);
        }

        backdropEl = el("div", "sp-backdrop");
        backdropEl.hidden = true;

        panelEl = el("aside", "sp-panel");
        panelEl.hidden = true;
        panelEl.setAttribute("role", "dialog");
        panelEl.setAttribute("aria-label", "Pengaturan");

        const head = el("div", "sp-head");
        const title = el("h2", "sp-title");
        title.textContent = "Pengaturan";
        const close = el("button", "sp-close", "&times;");
        close.type = "button";
        close.setAttribute("aria-label", "Tutup pengaturan");
        head.appendChild(title);
        head.appendChild(close);

        const group = el("p", "sp-group");
        group.textContent = "Menu admin";

        const list = el("ul", "sp-list");

        MENU.forEach((item) => {

            const li = document.createElement("li");
            const btn = el("button", "sp-item");

            btn.type = "button";
            btn.setAttribute("data-key", item.key);

            const ico = el("span", "sp-ico", CAMERA);
            const text = el("span", "");
            const name = el("span", "sp-name");
            const desc = el("span", "sp-desc");

            name.textContent = item.title;
            desc.textContent = item.desc;
            text.appendChild(name);
            text.appendChild(desc);

            const badge = el("span", "sp-badge", LOCK + " Admin");

            btn.appendChild(ico);
            btn.appendChild(text);
            btn.appendChild(badge);

            btn.addEventListener("click", () => onMenuClick(item));

            li.appendChild(btn);
            list.appendChild(li);

        });

        statusEl = el("div", "sp-status");
        statusEl.hidden = true;

        const statusText = el("span", "");
        statusText.textContent = "Sesi admin aktif";

        const logout = el("button", "sp-logout");
        logout.type = "button";
        logout.textContent = "Keluar";
        logout.addEventListener("click", () => {
            if (window.AdminAuth) window.AdminAuth.logout();
            refreshStatus();
        });

        statusEl.appendChild(statusText);
        statusEl.appendChild(logout);

        panelEl.appendChild(head);
        panelEl.appendChild(group);
        panelEl.appendChild(list);
        panelEl.appendChild(statusEl);

        document.body.appendChild(backdropEl);
        document.body.appendChild(panelEl);

        toggleEl.addEventListener("click", () => {

            if (panelEl.hidden) openPanel();
            else closePanel(false);

        });

        close.addEventListener("click", () => closePanel(true));
        backdropEl.addEventListener("click", () => closePanel(false));

        document.addEventListener("keydown", (event) => {

            if (event.key === "Escape" && !panelEl.hidden) closePanel(true);

        });

    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", build);
    } else {
        build();
    }

})();
