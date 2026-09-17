/*
==========================================================
SMANSASOO Academic Portal
Pengumuman - UI
Version : 1.0.0
==========================================================
*/

window.PengumumanUI = (() => {

    const els = {};

    function cacheEls() {

        els.loading = document.getElementById("pengumumanLoading");
        els.error = document.getElementById("pengumumanError");
        els.content = document.getElementById("pengumumanContent");
        els.list = document.getElementById("pengumumanList");

    }

    function escapeHTML(value) {

        if (value === null || value === undefined || value === "") return "-";

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

    }

    function formatTanggal(value) {

        const d = new Date(value);

        if (isNaN(d.getTime())) return escapeHTML(value);

        return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    }

    function showLoading() {

        if (!els.loading) cacheEls();

        els.loading?.classList.remove("hidden");
        els.error?.classList.add("hidden");
        els.content?.classList.add("hidden");

    }

    function showError(message) {

        if (!els.error) cacheEls();

        els.loading?.classList.add("hidden");
        els.content?.classList.add("hidden");

        if (els.error) {

            els.error.classList.remove("hidden");
            els.error.textContent = message;

        }

    }

    function showResult(list) {

        if (!els.content) cacheEls();

        els.loading?.classList.add("hidden");
        els.error?.classList.add("hidden");
        els.content?.classList.remove("hidden");

        if (!els.list) return;

        if (!list.length) {

            els.list.innerHTML = `<p class="pengumuman-empty">Belum ada pengumuman aktif saat ini.</p>`;

            return;

        }

        els.list.innerHTML = list.map((item) => `

            <article class="pengumuman-card ${item.prioritas.toLowerCase() === "penting" ? "is-penting" : ""}">

                <div class="pengumuman-card-head">

                    <h3>${escapeHTML(item.judul)}</h3>

                    ${item.prioritas.toLowerCase() === "penting" ? `<span class="pengumuman-badge">Penting</span>` : ""}

                </div>

                ${item.tanggal ? `<time class="pengumuman-date">${formatTanggal(item.tanggal)}</time>` : ""}

                <p class="pengumuman-body">${escapeHTML(item.isi)}</p>

            </article>

        `).join("");

    }

    return { showLoading, showError, showResult };

})();
