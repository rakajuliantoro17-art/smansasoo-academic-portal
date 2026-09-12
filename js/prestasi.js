/*
==========================================================
SMANSASOO Academic Portal
Prestasi Module
Version : 1.0.0
==========================================================
Memuat data/prestasi.json (data statis, diupdate manual oleh
admin -- BUKAN ditarik live dari SIMT, lihat catatan
"_readme" di file JSON itu sendiri) lalu merender kartu-kartu
bergaya SIMT: identitas sekolah, peringkat nasional, kategori
prestasi, tabel per tahun, dan daftar siswa berprestasi.
==========================================================
*/

(function () {

    const root = document.getElementById("prestasiRoot");

    function escapeHTML(value) {

        if (value === null || value === undefined || value === "") {
            return "-";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

    }

    function formatDateID(iso) {

        try {

            const date = new Date(iso + "T00:00:00");

            return date.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });

        } catch (e) {

            return iso;

        }

    }

    // Ikon sederhana per kategori (emoji, bukan copy ikon SVG
    // SIMT) supaya tidak menjiplak aset visual milik pihak lain.
    const KATEGORI_ICON = {

        "Olahraga": "🏅",

        "Riset dan Inovasi": "🔬",

        "Seni Budaya": "🎨"

    };

    function iconFor(nama) {

        return KATEGORI_ICON[nama] || "🏆";

    }

    function render(data) {

        const kategoriHTML = (data.kategori || []).map((k) => `

            <div class="prestasi-kategori-item">

                <div>
                    <span class="k-count">${escapeHTML(k.jumlah)}</span>
                    <span class="k-name">${escapeHTML(k.nama)}</span>
                </div>

                <div class="prestasi-kategori-icon" aria-hidden="true">${iconFor(k.nama)}</div>

            </div>

        `).join("");

        const tahunRowsHTML = (data.per_tahun || []).map((t) => `

            <tr>
                <td>${escapeHTML(t.tahun)}</td>
                <td>${escapeHTML(t.jumlah)}</td>
            </tr>

        `).join("");

        const siswaRowsHTML = (data.siswa_berprestasi || []).map((s, i) => `

            <tr>
                <td>${i + 1}</td>
                <td class="col-nama">${escapeHTML(s.nama)}</td>
                <td>${escapeHTML(s.jumlah_prestasi)}</td>
            </tr>

        `).join("");

        root.innerHTML = `

        <div class="prestasi-card prestasi-school-card" id="sekolah">

            <img src="../assets/logo/logo.png" alt="Logo sekolah">

            <div>
                <h2>SMAN 1 Sooko Mojokerto</h2>
                <p>Dashboard talenta berikut menampilkan peta persebaran prestasi peserta didik yang terkurasi Pusat Prestasi Nasional (Puspresnas), Kemendikdasmen.</p>
            </div>

        </div>

        <div class="prestasi-card prestasi-rank-card" id="peringkat">

            <div>
                <p class="rank-label">Peringkat Nasional &middot; Jenjang ${escapeHTML(data.ranking?.jenjang)}</p>
                <p class="rank-value">#${escapeHTML(data.ranking?.posisi)} <small>dari seluruh SMA se-Indonesia</small></p>
                <p class="rank-note">${escapeHTML(data.ranking?.catatan)}</p>
            </div>

            <a href="${data.source_urls?.peringkat_nasional}" target="_blank" rel="noopener">
                Cek Peringkat Live di SIMT &rarr;
            </a>

        </div>

        <div class="prestasi-card" id="kategori">

            <p class="prestasi-section-title">Peserta Didik Berprestasi</p>
            <p class="prestasi-section-sub">Statistik prestasi per kategori &middot; Total ${escapeHTML(data.total_prestasi)} prestasi</p>

            <div class="prestasi-kategori-grid">
                ${kategoriHTML}
            </div>

        </div>

        <div class="prestasi-card" id="per-tahun">

            <p class="prestasi-section-title">Sebaran Prestasi per Tahun</p>
            <p class="prestasi-section-sub">Jumlah prestasi yang tercatat tiap tahun ajaran</p>

            <div class="prestasi-table-wrap">

                <table class="prestasi-table">

                    <thead>
                        <tr>
                            <th>Tahun</th>
                            <th>Jumlah Prestasi</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${tahunRowsHTML}
                    </tbody>

                </table>

            </div>

        </div>

        <div class="prestasi-card" id="siswa">

            <p class="prestasi-section-title">Peserta Didik Berprestasi</p>
            <p class="prestasi-section-sub">${escapeHTML((data.siswa_berprestasi || []).length)} dari ${escapeHTML(data.total_prestasi)}+ pencatatan yang ditampilkan di sini</p>

            <div class="prestasi-table-wrap">

                <table class="prestasi-table">

                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Nama</th>
                            <th>Jumlah Prestasi</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${siswaRowsHTML}
                    </tbody>

                </table>

            </div>

            <p class="prestasi-footnote">
                <a href="${data.source_urls?.detail_sekolah}" target="_blank" rel="noopener">
                    Lihat Daftar Lengkap &amp; Detail Resmi di SIMT &rarr;
                </a>
            </p>

        </div>

        <p class="prestasi-updated-note">
            Data diupdate manual terakhir kali pada ${escapeHTML(formatDateID(data.last_updated))}.
            Untuk angka paling akurat &amp; real-time, selalu cek langsung ke SIMT Puspresnas.
        </p>

        `;

        initScrollspy();

    }

    /**
     * Scrollspy sederhana: highlight link "Di Halaman Ini" di
     * sidebar sesuai section yang sedang terlihat di viewport.
     */

    function initScrollspy() {

        const sections = Array.from(document.querySelectorAll(
            "#sekolah, #peringkat, #kategori, #per-tahun, #siswa"
        ));

        const links = document.querySelectorAll("#sectionNav a");

        if (!sections.length || !links.length || !("IntersectionObserver" in window)) {
            return;
        }

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

    function showError() {

        root.innerHTML = `

        <div class="prestasi-card prestasi-error">
            Data prestasi belum bisa dimuat. Silakan cek langsung ke
            <a href="https://simt.kemendikdasmen.go.id/detail-prestasi-sekolah?npsn=20502727" target="_blank" rel="noopener">SIMT Puspresnas</a>.
        </div>

        `;

    }

    async function initialize() {

        if (!root) return;

        try {

            const response = await fetch("../data/prestasi.json", { cache: "no-store" });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            render(data);

        } catch (error) {

            console.warn("Gagal memuat data/prestasi.json:", error);

            showError();

        }

    }

    document.addEventListener("DOMContentLoaded", initialize);

})();
