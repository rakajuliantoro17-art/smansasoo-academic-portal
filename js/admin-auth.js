/*
==========================================================
SMANSASOO Academic Portal
Admin Auth (overlay login + penjaga halaman)
Version : 1.0.0
==========================================================
Dipakai oleh js/settings-drawer.js (menu admin di dalam panel
Pengaturan, dibuka lewat tombol gear yang sama dengan toggle
tema) dan oleh halaman khusus admin.

Cara pakai:
- Overlay login:   AdminAuth.openLogin({ dismissible: true })
                   -> Promise<boolean> (true = berhasil login)
- Jaga halaman:    <script src="/js/admin-auth.js" data-require-admin></script>
                   di <head> halaman admin (mis. pages/absensi-scan.html).
                   Tanpa login, halaman tertutup overlay.

Username & password TIDAK ada di file ini. Pemeriksaan dilakukan
oleh server (/api/admin-auth, method POST). Browser hanya menyimpan
token bertanda tangan di sessionStorage (hilang saat tab ditutup,
dan kedaluwarsa 8 jam).

Selama sesi admin aktif, setiap fetch ke /api/absensi-* otomatis
membawa header Authorization: Bearer <token>, jadi server bisa
menolak permintaan tanpa login (lihat docs/ADMIN-AUTH.md).
==========================================================
*/

(function () {

    if (window.AdminAuth) return;

    const SESSION_KEY = "smansasoo-admin-session";
    // Login (POST) dan verifikasi (GET) sekarang satu endpoint yang sama
    // -- lihat api/admin-auth.js (digabung supaya tidak melebihi batas
    // 12 Serverless Functions di paket Vercel Hobby).
    const LOGIN_URL = "/api/admin-auth";
    const VERIFY_URL = "/api/admin-auth";
    const PROTECTED_API = /^\/api\/absensi-/;

    const thisScript = document.currentScript;
    const requirePage = !!(thisScript && thisScript.hasAttribute("data-require-admin"));

    let overlayEl = null;

    /* ==========================================
       SESI
    ========================================== */

    function readSession() {

        try {

            const raw = sessionStorage.getItem(SESSION_KEY);

            if (!raw) return null;

            const s = JSON.parse(raw);

            if (!s || !s.token || !s.exp || Date.now() >= s.exp * 1000) {
                sessionStorage.removeItem(SESSION_KEY);
                return null;
            }

            return s;

        } catch (e) {

            return null;

        }

    }

    function saveSession(token, exp, username) {

        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, exp, username }));
        } catch (e) {
            // sessionStorage tidak tersedia -- sesi hanya berlaku di halaman ini.
        }

    }

    function logout() {

        try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* abaikan */ }

    }

    function isLoggedIn() {

        return !!readSession();

    }

    function getToken() {

        const s = readSession();

        return s ? s.token : "";

    }

    function username() {

        const s = readSession();

        return s ? (s.username || "admin") : "";

    }

    // true = valid, false = ditolak server, null = tidak bisa dicek (offline)
    async function verify() {

        const token = getToken();

        if (!token) return false;

        try {

            const response = await fetch(VERIFY_URL, {
                headers: { Authorization: "Bearer " + token },
                cache: "no-store"
            });

            if (response.ok) return true;
            if (response.status === 401) return false;

            return null;

        } catch (e) {

            return null;

        }

    }

    /* ==========================================
       fetch ke /api/absensi-* otomatis membawa token
    ========================================== */

    function installFetchAuth() {

        if (window.__adminFetchPatched) return;

        window.__adminFetchPatched = true;

        const original = window.fetch.bind(window);

        window.fetch = function (input, init) {

            try {

                const raw = typeof input === "string" ? input : (input && input.url) || "";
                const url = new URL(raw, window.location.href);

                if (url.origin === window.location.origin && PROTECTED_API.test(url.pathname)) {

                    const s = readSession();

                    if (s) {

                        const headers = new Headers(
                            (init && init.headers) || (typeof input !== "string" && input && input.headers) || {}
                        );

                        if (!headers.has("Authorization")) {
                            headers.set("Authorization", "Bearer " + s.token);
                        }

                        init = Object.assign({}, init, { headers });

                    }

                }

            } catch (e) {
                // gagal membaca URL -- teruskan permintaan apa adanya.
            }

            return original(input, init);

        };

    }

    /* ==========================================
       STYLE
    ========================================== */

    function injectStyle() {

        if (document.getElementById("adminAuthStyle")) return;

        const style = document.createElement("style");
        style.id = "adminAuthStyle";
        style.textContent = `
            .aa-overlay {
                --aa-ink: #14233a; --aa-muted: #55657d; --aa-card: #ffffff;
                --aa-line: rgba(20, 35, 58, 0.18); --aa-accent: #0f4c81; --aa-accent-ink: #ffffff;
                --aa-err: #b3261e; --aa-err-bg: #fde9e7;
                position: fixed; inset: 0; z-index: 99999;
                display: flex; align-items: center; justify-content: center;
                padding: 16px; visibility: visible;
                background: rgba(8, 20, 38, 0.58);
                -webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px);
                font-family: "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
            }
            :root[data-theme="dark"] .aa-overlay {
                --aa-ink: #e8eef8; --aa-muted: #a5b4ca; --aa-card: #15233a;
                --aa-line: rgba(232, 238, 248, 0.22); --aa-accent: #7cc0ff; --aa-accent-ink: #0a1a2e;
                --aa-err: #ffb4ab; --aa-err-bg: rgba(255, 180, 171, 0.14);
            }
            .aa-overlay--gate { background: rgba(8, 20, 38, 0.97); -webkit-backdrop-filter: none; backdrop-filter: none; }
            .aa-overlay *, .aa-overlay *::before, .aa-overlay *::after { box-sizing: border-box; }
            body.aa-lock { overflow: hidden; }
            .aa-card {
                width: min(100%, 390px); padding: 24px 22px 20px;
                border: 1px solid var(--aa-line); border-radius: 18px;
                background: var(--aa-card); color: var(--aa-ink);
                box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
            }
            .aa-title { margin: 0; font-size: 1.35rem; font-weight: 800; letter-spacing: -0.01em; }
            .aa-sub { margin: 6px 0 18px; color: var(--aa-muted); font-size: 0.92rem; line-height: 1.45; }
            .aa-field { margin-bottom: 14px; }
            .aa-label { display: block; margin-bottom: 5px; font-size: 0.84rem; font-weight: 700; color: var(--aa-muted); }
            .aa-row { display: flex; gap: 8px; }
            .aa-input {
                flex: 1; min-width: 0; min-height: 46px; padding: 0 12px;
                border: 1px solid var(--aa-line); border-radius: 10px;
                background: transparent; color: var(--aa-ink); font: inherit; font-size: 1rem;
            }
            .aa-eye {
                flex: none; min-width: 86px; min-height: 46px; padding: 0 10px;
                border: 1px solid var(--aa-line); border-radius: 10px;
                background: transparent; color: var(--aa-ink); font: inherit; font-size: 0.85rem; font-weight: 700; cursor: pointer;
            }
            .aa-error {
                margin: 0 0 14px; padding: 9px 12px; border-radius: 10px;
                background: var(--aa-err-bg); color: var(--aa-err);
                font-size: 0.9rem; font-weight: 600; line-height: 1.4;
            }
            .aa-error[hidden] { display: none; }
            .aa-actions { display: flex; gap: 10px; margin-top: 4px; }
            .aa-btn {
                flex: 1; min-height: 46px; padding: 0 14px; border-radius: 10px;
                font: inherit; font-size: 0.98rem; font-weight: 800; cursor: pointer;
                border: 1px solid var(--aa-line); background: transparent; color: var(--aa-ink);
            }
            .aa-btn--primary { background: var(--aa-accent); border-color: var(--aa-accent); color: var(--aa-accent-ink); }
            .aa-btn[disabled] { opacity: 0.65; cursor: progress; }
            .aa-back { display: block; margin-top: 14px; text-align: center; color: var(--aa-accent); font-weight: 700; font-size: 0.9rem; }
            .aa-input:focus-visible, .aa-eye:focus-visible, .aa-btn:focus-visible, .aa-back:focus-visible {
                outline: 3px solid var(--aa-accent); outline-offset: 2px;
            }
        `;

        document.head.appendChild(style);

    }

    /* ==========================================
       OVERLAY LOGIN
    ========================================== */

    function el(tag, className, text) {

        const node = document.createElement(tag);

        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;

        return node;

    }

    function closeOverlay() {

        if (!overlayEl) return;

        overlayEl.remove();
        overlayEl = null;
        document.body.classList.remove("aa-lock");

    }

    function openLogin(options) {

        const opts = Object.assign({ dismissible: true, gate: false }, options);

        if (overlayEl) return Promise.resolve(false);

        injectStyle();

        return new Promise((resolve) => {

            const previousFocus = document.activeElement;

            const overlay = el("div", "aa-overlay" + (opts.gate ? " aa-overlay--gate" : ""));
            const card = el("div", "aa-card");

            card.setAttribute("role", "dialog");
            card.setAttribute("aria-modal", "true");
            card.setAttribute("aria-labelledby", "aaTitle");

            const title = el("h2", "aa-title", "Masuk Admin");
            title.id = "aaTitle";

            const sub = el("p", "aa-sub", "Halaman ini khusus admin. Masukkan username dan password untuk melanjutkan.");

            const form = document.createElement("form");
            form.noValidate = true;

            const fUser = el("div", "aa-field");
            const lUser = el("label", "aa-label", "Username");
            lUser.htmlFor = "aaUser";
            const iUser = el("input", "aa-input");
            iUser.id = "aaUser";
            iUser.type = "text";
            iUser.name = "username";
            iUser.autocomplete = "username";
            iUser.autocapitalize = "none";
            iUser.spellcheck = false;
            fUser.appendChild(lUser);
            fUser.appendChild(iUser);

            const fPass = el("div", "aa-field");
            const lPass = el("label", "aa-label", "Password");
            lPass.htmlFor = "aaPass";
            const row = el("div", "aa-row");
            const iPass = el("input", "aa-input");
            iPass.id = "aaPass";
            iPass.type = "password";
            iPass.name = "password";
            iPass.autocomplete = "current-password";
            const eye = el("button", "aa-eye", "Tampilkan");
            eye.type = "button";
            eye.setAttribute("aria-pressed", "false");
            eye.addEventListener("click", () => {
                const show = iPass.type === "password";
                iPass.type = show ? "text" : "password";
                eye.textContent = show ? "Sembunyikan" : "Tampilkan";
                eye.setAttribute("aria-pressed", show ? "true" : "false");
            });
            row.appendChild(iPass);
            row.appendChild(eye);
            fPass.appendChild(lPass);
            fPass.appendChild(row);

            const error = el("p", "aa-error");
            error.id = "aaError";
            error.setAttribute("role", "alert");
            error.hidden = true;

            const actions = el("div", "aa-actions");
            const submit = el("button", "aa-btn aa-btn--primary", "Masuk");
            submit.type = "submit";
            actions.appendChild(submit);

            let cancel = null;

            if (opts.dismissible) {
                cancel = el("button", "aa-btn", "Batal");
                cancel.type = "button";
                actions.insertBefore(cancel, submit);
            }

            form.appendChild(fUser);
            form.appendChild(fPass);
            form.appendChild(error);
            form.appendChild(actions);

            card.appendChild(title);
            card.appendChild(sub);
            card.appendChild(form);

            if (opts.gate) {
                const back = el("a", "aa-back", "Kembali ke beranda");
                back.href = "/index.html";
                card.appendChild(back);
            }

            overlay.appendChild(card);
            document.body.appendChild(overlay);
            document.body.classList.add("aa-lock");
            overlayEl = overlay;

            function finish(ok) {

                document.removeEventListener("keydown", onKey, true);
                closeOverlay();

                if (previousFocus && previousFocus.focus && !opts.gate) {
                    try { previousFocus.focus(); } catch (e) { /* abaikan */ }
                }

                resolve(ok);

            }

            function showError(message) {

                error.textContent = message;
                error.hidden = false;

            }

            function onKey(event) {

                if (event.key === "Escape" && opts.dismissible) {
                    event.preventDefault();
                    finish(false);
                    return;
                }

                if (event.key !== "Tab") return;

                const items = Array.from(card.querySelectorAll("input, button, a[href]")).filter((n) => !n.disabled);
                const first = items[0];
                const last = items[items.length - 1];

                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }

            }

            document.addEventListener("keydown", onKey, true);

            if (cancel) cancel.addEventListener("click", () => finish(false));

            if (opts.dismissible) {
                overlay.addEventListener("mousedown", (event) => {
                    if (event.target === overlay) finish(false);
                });
            }

            form.addEventListener("submit", async (event) => {

                event.preventDefault();

                const u = iUser.value.trim();
                const p = iPass.value;

                error.hidden = true;

                if (!u || !p) {
                    showError("Username dan password wajib diisi.");
                    (u ? iPass : iUser).focus();
                    return;
                }

                submit.disabled = true;
                submit.textContent = "Memeriksa...";

                try {

                    const response = await fetch(LOGIN_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username: u, password: p }),
                        cache: "no-store"
                    });

                    let result = {};

                    try { result = await response.json(); } catch (e) { /* bukan JSON */ }

                    if (response.ok && result.success && result.token) {

                        saveSession(result.token, result.expiresAt, result.username);
                        finish(true);
                        return;

                    }

                    if (response.status === 503) {
                        showError(result.message || "Login admin belum dikonfigurasi di server.");
                    } else if (response.status === 404) {
                        showError("Endpoint /api/admin-auth tidak ditemukan. Pastikan file api/admin-auth.js sudah ter-deploy.");
                    } else {
                        showError(result.message || "Login gagal (HTTP " + response.status + ").");
                    }

                    iPass.value = "";
                    iPass.focus();

                } catch (e) {

                    showError("Tidak bisa terhubung ke server. Periksa koneksi internet.");

                } finally {

                    submit.disabled = false;
                    submit.textContent = "Masuk";

                }

            });

            iUser.focus();

        });

    }

    /* ==========================================
       PENJAGA HALAMAN (data-require-admin)
    ========================================== */

    function startPageGuard() {

        const hide = document.createElement("style");
        hide.id = "adminGuardHide";
        hide.textContent = "html{visibility:hidden !important}";
        document.head.appendChild(hide);

        installFetchAuth();

        function reveal() {

            const node = document.getElementById("adminGuardHide");

            if (node) node.remove();

        }

        async function gate() {

            reveal();

            const ok = await openLogin({ dismissible: false, gate: true });

            if (ok) window.location.reload();

        }

        async function run() {

            if (!isLoggedIn()) {
                gate();
                return;
            }

            const result = await verify();

            if (result === false) {
                logout();
                gate();
                return;
            }

            // true, atau null (offline: server tetap menolak saat menulis tanpa token valid)
            reveal();

        }

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", run);
        } else {
            run();
        }

    }

    window.AdminAuth = {
        openLogin,
        isLoggedIn,
        getToken,
        username,
        logout,
        verify,
        installFetchAuth
    };

    if (requirePage) startPageGuard();

})();
