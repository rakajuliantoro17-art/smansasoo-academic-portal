/*
==========================================================
SMANSASOO Academic Portal
Rapor Pendidikan - UI Renderer
Version : 1.0.0
==========================================================
Hanya menyentuh DOM lewat template string (pola sama dengan
nilai-ui.js / nilai-kelas-ui.js), tidak fetch apa pun --
data-nya dipasok oleh js/rapor-data.js.
==========================================================
*/

window.RaporUI = (() => {

    const els = {};

    function cacheEls() {

        els.loading = document.getElementById("raporLoading");
        els.error = document.getElementById("raporError");
        els.content = document.getElementById("raporContent");
        els.profile = document.getElementById("raporProfile");
        els.summary = document.getElementById("raporSummary");
        els.grid = document.getElementById("raporGrid");
        els.meta = document.getElementById("raporMeta");
        els.yearSelect = document.getElementById("raporYearSelect");

    }

    function showLoading() {

        if (!els.loading) cacheEls();

        els.loading?.classList.remove("hidden");
        els.error?.classList.add("hidden");
        els.content?.classList.add("hidden");

    }

    function showError(message) {

        if (!els.loading) cacheEls();

        els.loading?.classList.add("hidden");
        els.content?.classList.add("hidden");

        if (els.error) {

            els.error.textContent = message || CONFIG.MESSAGE.SERVER_ERROR;
            els.error.classList.remove("hidden");

        }

    }

    function deltaBadge(delta) {

        if (delta === null || delta === undefined) {

            return `<span class="rapor-card-delta flat">&mdash;</span>`;

        }

        if (delta > 0) return `<span class="rapor-card-delta up">&uarr; +${delta}</span>`;
        if (delta < 0) return `<span class="rapor-card-delta down">&darr; ${delta}</span>`;

        return `<span class="rapor-card-delta flat">&mdash; 0</span>`;

    }

    function statusBadge(label, definisi) {

        const key = Utils.trim(label).toLowerCase();

        return `

        <span class="rapor-label ${key}">

            <strong>${Utils.escapeHTML(label)}</strong>

            ${definisi ? `<span class="rapor-label-desc">${Utils.escapeHTML(definisi)}</span>` : ""}

        </span>

        `;

    }

    /**
     * Tabel kecil 2 baris: posisi dibanding sekolah lain,
     * di tingkat provinsi & nasional. Datanya sudah ada di
     * JSON (peringkat_provinsi / peringkat_nasional per
     * indikator maupun sub-indikator), sebelumnya cuma
     * ditulis sebagai satu baris teks -- sekarang jadi tabel
     * supaya lebih mudah dipindai.
     */
    function rankingTableHTML(peringkatProvinsi, peringkatNasional) {

        if (!peringkatProvinsi && !peringkatNasional) return "";

        return `

        <table class="rapor-rank-table">

            <tbody>

                <tr>
                    <th>Peringkat Provinsi</th>
                    <td>${Utils.escapeHTML(peringkatProvinsi || "-")}</td>
                </tr>

                <tr>
                    <th>Peringkat Nasional</th>
                    <td>${Utils.escapeHTML(peringkatNasional || "-")}</td>
                </tr>

            </tbody>

        </table>

        `;

    }

    function renderSubItem(sub) {

        return `

        <div class="rapor-sub-item">

            <div class="rapor-sub-top">
                <span class="rapor-sub-nama">${Utils.escapeHTML(sub.kode)} &middot; ${Utils.escapeHTML(sub.nama)}</span>
                <span class="rapor-sub-skor">${sub.skor ?? "&mdash;"}${sub.skor !== null ? "%" : ""}</span>
            </div>

            ${sub.definisi_capaian ? `<p class="rapor-sub-definisi">${Utils.escapeHTML(sub.definisi_capaian)}</p>` : ""}

            ${rankingTableHTML(sub.peringkat_provinsi, sub.peringkat_nasional)}

        </div>

        `;

    }

    function renderCard(group) {

        const pct = Math.max(0, Math.min(100, group.skor ?? 0));

        return `

        <div class="rapor-card" data-kode="${Utils.escapeHTML(group.kode)}">

            <button type="button" class="rapor-card-head" data-toggle>

                <span class="rapor-card-kode">${Utils.escapeHTML(group.kode)}</span>
                <div class="rapor-card-nama">${Utils.escapeHTML(group.nama)}</div>

                ${statusBadge(group.label, group.definisi_capaian)}

                <div class="rapor-card-metrics">

                    <div class="rapor-card-skor">
                        ${group.skor}<small>%</small>
                    </div>

                    ${deltaBadge(group.delta)}

                    <span class="rapor-card-sub-count">
                        ${group.sub.length} sub-indikator
                        <span class="rapor-card-toggle-icon">&#9660;</span>
                    </span>

                </div>

                <div class="rapor-progress-track">
                    <div class="rapor-progress-fill" style="width:${pct}%"></div>
                </div>

            </button>

            <div class="rapor-card-body">
                <div class="rapor-card-body-inner">

                    ${rankingTableHTML(group.peringkat_provinsi, group.peringkat_nasional)}

                    ${group.sub.map(renderSubItem).join("")}

                </div>
            </div>

        </div>

        `;

    }

    function bindToggles() {

        els.grid.querySelectorAll("[data-toggle]").forEach((btn) => {

            btn.addEventListener("click", () => {

                btn.closest(".rapor-card").classList.toggle("open");

            });

        });

    }

    /* ==========================================
       PROFIL SEKOLAH + LINGKARAN AKREDITASI
    ========================================== */

    function renderProfile(data) {

        if (!els.profile) cacheEls();

        if (!els.profile) return;

        els.profile.innerHTML = `

        <div class="rapor-profile-info">
            <span class="rapor-profile-label">Rapor Pendidikan</span>
            <strong class="rapor-profile-school">${Utils.escapeHTML(data.nama_sekolah)}</strong>
            <span class="rapor-profile-npsn">NPSN ${Utils.escapeHTML(data.npsn)}</span>
        </div>

        ${data.akreditasi ? `

        <div class="rapor-akreditasi" title="Akreditasi sekolah">
            <span class="rapor-akreditasi-ring">${Utils.escapeHTML(data.akreditasi)}</span>
            <span class="rapor-akreditasi-label">Akreditasi</span>
        </div>

        ` : ""}

        `;

    }

    /* ==========================================
       DROPDOWN TAHUN
    ========================================== */

    function renderYearSelect(years, selectedYear) {

        if (!els.yearSelect) cacheEls();

        if (!els.yearSelect) return;

        els.yearSelect.innerHTML = years
            .slice()
            .sort((a, b) => b - a)
            .map((year) => `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`)
            .join("");

    }

    function onYearChange(handler) {

        if (!els.yearSelect) cacheEls();

        els.yearSelect?.addEventListener("change", (event) => {

            handler(Number(event.target.value));

        });

    }

    function showResult(data) {

        if (!els.loading) cacheEls();

        els.loading?.classList.add("hidden");
        els.error?.classList.add("hidden");

        const r = data.ringkasan;

        renderProfile(data);

        if (els.summary) {

            els.summary.innerHTML = `

            <div class="rapor-summary-card">
                <span>Indikator</span>
                <strong>${r.jumlah_indikator}</strong>
                <span class="rapor-summary-note">Baik ${r.baik} &middot; Sedang ${r.sedang} &middot; Kurang ${r.kurang}</span>
            </div>

            <div class="rapor-summary-card">
                <span>Rata-rata Skor</span>
                <strong>${r.rata_rata_skor}%</strong>
            </div>

            <div class="rapor-summary-card">
                <span>Tahun Data</span>
                <strong>${data.tahun}</strong>
                <span class="rapor-summary-note">NPSN ${data.npsn}</span>
            </div>

            `;

        }

        if (els.grid) {

            els.grid.innerHTML = data.groups.map(renderCard).join("");

            bindToggles();

        }

        if (els.meta) {

            els.meta.textContent = `Sumber: ${data.sumber} · Data ${data.tahun} · Diperbarui ${data.diperbarui}`;

        }

        els.content?.classList.remove("hidden");

    }

    return {

        showLoading,
        showError,
        showResult,
        renderYearSelect,
        onYearChange

    };

})();
