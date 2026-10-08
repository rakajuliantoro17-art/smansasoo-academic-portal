/*
==========================================================
SMANSASOO Academic Portal
Rasionalisasi SNBP (pages/rasionalisasi.html)
Version : 1.0.0
==========================================================
Alur: pilih kelas -> isi nilai rapor + posisi di sekolah -> hasil.

Yang dihitung (sesuai aturan SNBP, bukan prediksi prodi/PTN):
- rata-rata rapor dari semester yang diisi
- kuota siswa eligible sekolah = persentase akreditasi
  (+ bonus e-rapor) x jumlah siswa seangkatan
- apakah peringkatmu berada di dalam kuota itu, dan seberapa
  tipis selisihnya

Angka persentase & data sekolah dibaca dari data/rasionalisasi.json
(bisa diubah tanpa menyentuh kode). Semua perhitungan terjadi di
browser; tidak ada data yang dikirim atau disimpan.
==========================================================
*/

(function () {

    "use strict";

    var CONFIG_URL = "/data/rasionalisasi.json";

    var DEFAULTS = {
        info_url: "https://snpmb.id",
        kuota: { A: 40, B: 25, C: 5, lainnya: 5 },
        bonus_erapor: 5,
        sekolah: { akreditasi: "", erapor: false, jumlah_siswa: { X: null, XI: null, XII: null } },
        semester: { X: [1], XI: [1, 2, 3], XII: [1, 2, 3, 4, 5] }
    };

    var cfg = DEFAULTS;
    var state = { kelas: "", hasil: null };

    function $(id) { return document.getElementById(id); }

    function h(tag, className, text) {

        var n = document.createElement(tag);

        if (className) n.className = className;
        if (text !== undefined && text !== null) n.textContent = text;

        return n;

    }

    function fmt(n, d) {

        return Number(n).toLocaleString("id-ID", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });

    }

    /* ==========================================
       NAVIGASI ANTAR LANGKAH
    ========================================== */

    function show(id, focusId) {

        ["rsIntro", "rsForm", "rsHasil"].forEach(function (s) { $(s).hidden = s !== id; });

        var f = $(focusId);

        if (f) {
            f.focus({ preventScroll: true });
            f.scrollIntoView({ block: "start", behavior: "smooth" });
        }

    }

    /* ==========================================
       FORM
    ========================================== */

    function buildSemesterInputs() {

        var wrap = $("rsSemester");
        var list = cfg.semester[state.kelas] || [1];

        wrap.textContent = "";

        list.forEach(function (sem) {

            var box = h("div", "rs-field");
            var label = h("label", "rs-label", "Semester " + sem);
            var input = h("input", "rs-input");

            label.htmlFor = "rsSem" + sem;
            input.id = "rsSem" + sem;
            // type="text": input number menolak koma (86,5) di sebagian browser/ponsel.
            // parseNum() menerima koma maupun titik.
            input.type = "text";
            input.inputMode = "decimal";
            input.autocomplete = "off";
            input.placeholder = "mis. 86,5";
            input.setAttribute("data-sem", String(sem));

            box.appendChild(label);
            box.appendChild(input);
            wrap.appendChild(box);

        });

    }

    function prefillSchool() {

        var s = cfg.sekolah || {};
        var jumlah = s.jumlah_siswa && s.jumlah_siswa[state.kelas];

        if (s.akreditasi && !$("rsAkreditasi").value) $("rsAkreditasi").value = s.akreditasi;
        if (s.erapor) $("rsErapor").checked = true;
        if (jumlah && !$("rsJumlah").value) $("rsJumlah").value = String(jumlah);

    }

    function openForm() {

        $("rsFormSub").textContent = "Kelas " + state.kelas + ". Isi sejujur mungkin supaya gambarannya akurat.";
        $("rsError").hidden = true;

        buildSemesterInputs();
        prefillSchool();

        show("rsForm", "rsFormTitle");

    }

    /* ==========================================
       HITUNG
    ========================================== */

    function parseNum(value) {

        if (value === "" || value === null || value === undefined) return NaN;

        return Number(String(value).replace(",", "."));

    }

    function readForm() {

        var errors = [];
        var semesters = [];
        var invalid = [];

        Array.prototype.forEach.call($("rsSemester").querySelectorAll("input"), function (inp) {

            inp.removeAttribute("aria-invalid");

            if (inp.value === "") return;

            var v = parseNum(inp.value);

            if (isNaN(v) || v < 0 || v > 100) {
                inp.setAttribute("aria-invalid", "true");
                invalid.push(inp);
                return;
            }

            semesters.push({ sem: Number(inp.getAttribute("data-sem")), nilai: v });

        });

        if (invalid.length) errors.push("Nilai rapor harus berupa angka 0 sampai 100.");
        if (!semesters.length && !invalid.length) errors.push("Isi minimal satu semester nilai rapor.");

        var akre = $("rsAkreditasi").value;
        var jumlah = parseNum($("rsJumlah").value);
        var rank = parseNum($("rsPeringkat").value);

        ["rsAkreditasi", "rsJumlah", "rsPeringkat"].forEach(function (id) { $(id).removeAttribute("aria-invalid"); });

        if (!akre) { errors.push("Pilih akreditasi sekolah."); $("rsAkreditasi").setAttribute("aria-invalid", "true"); }

        if (!(jumlah >= 1) || Math.floor(jumlah) !== jumlah) {
            errors.push("Jumlah siswa seangkatan harus bilangan bulat minimal 1.");
            $("rsJumlah").setAttribute("aria-invalid", "true");
        }

        if (!(rank >= 1) || Math.floor(rank) !== rank) {
            errors.push("Peringkat harus bilangan bulat minimal 1.");
            $("rsPeringkat").setAttribute("aria-invalid", "true");
        } else if (jumlah >= 1 && rank > jumlah) {
            errors.push("Peringkat tidak boleh lebih besar dari jumlah siswa seangkatan.");
            $("rsPeringkat").setAttribute("aria-invalid", "true");
        }

        return {
            errors: errors,
            data: {
                kelas: state.kelas,
                semesters: semesters.sort(function (a, b) { return a.sem - b.sem; }),
                akreditasi: akre,
                erapor: $("rsErapor").checked,
                jumlah: jumlah,
                peringkat: rank
            }
        };

    }

    function compute(d) {

        var sum = 0;

        d.semesters.forEach(function (s) { sum += s.nilai; });

        var avg = sum / d.semesters.length;
        var persen = (cfg.kuota[d.akreditasi] != null ? cfg.kuota[d.akreditasi] : cfg.kuota.lainnya) + (d.erapor ? cfg.bonus_erapor : 0);
        var kuota = Math.floor(d.jumlah * persen / 100);
        var selisih = kuota - d.peringkat;                 // >= 0 berarti di dalam kuota
        var buffer = Math.max(2, Math.ceil(kuota * 0.1));
        // aman: lebih dari "buffer" peringkat di dalam kuota; tipis: dalam rentang +-buffer dari batas
        var status = selisih > buffer ? "aman" : (selisih >= -buffer ? "tipis" : "luar");

        var tren = null;

        if (d.semesters.length >= 2) {
            tren = d.semesters[d.semesters.length - 1].nilai - d.semesters[0].nilai;
        }

        return {
            d: d,
            avg: avg,
            persen: persen,
            kuota: kuota,
            selisih: selisih,
            buffer: buffer,
            status: status,
            tren: tren,
            persenPeringkat: d.peringkat / d.jumlah * 100
        };

    }

    /* ==========================================
       HASIL
    ========================================== */

    function statusCopy(r) {

        var kelasNote = r.d.kelas === "XII" ? "" : " Kamu masih di kelas " + r.d.kelas + ", jadi peringkat dan nilai masih bisa berubah banyak.";

        if (r.kuota < 1) {
            return {
                badge: "Kuota belum terbentuk",
                title: "Dengan data ini, kuota sekolah kurang dari 1 siswa.",
                text: "Periksa lagi akreditasi dan jumlah siswa seangkatan yang kamu isi."
            };
        }

        if (r.status === "aman") {
            return {
                badge: "Di dalam kuota",
                title: "Peringkatmu ada di dalam kuota siswa eligible.",
                text: "Peringkat " + r.d.peringkat + " dari kuota " + r.kuota + " siswa, masih ada ruang " + r.selisih + " peringkat di bawahmu." + kelasNote
            };
        }

        if (r.status === "tipis" && r.selisih >= 0) {
            return {
                badge: "Di dalam kuota, tipis",
                title: "Kamu masuk kuota, tetapi selisihnya tipis.",
                text: "Peringkat " + r.d.peringkat + " dari kuota " + r.kuota + " siswa. Hanya " + r.selisih + " peringkat dari batas, jadi sedikit penurunan nilai bisa menggeser posisimu." + kelasNote
            };
        }

        if (r.status === "tipis") {
            return {
                badge: "Di luar kuota, dekat",
                title: "Kamu sedikit di luar kuota.",
                text: "Peringkat " + r.d.peringkat + " dari kuota " + r.kuota + " siswa. Kamu perlu naik " + (-r.selisih) + " peringkat untuk masuk, selisih yang masih bisa dikejar." + kelasNote
            };
        }

        return {
            badge: "Di luar kuota",
            title: "Peringkatmu belum masuk kuota siswa eligible.",
            text: "Peringkat " + r.d.peringkat + " dari kuota " + r.kuota + " siswa. Kamu perlu naik " + (-r.selisih) + " peringkat. Jalur lain seperti UTBK-SNBT tetap terbuka." + kelasNote
        };

    }

    function nextSteps(r) {

        var items = [];

        if (r.status === "luar") {
            items.push("Fokus menaikkan nilai semester berikutnya pada mata pelajaran yang paling banyak mengangkat rata-rata.");
            items.push("Mulai siapkan UTBK-SNBT sebagai jalur utama sambil terus memantau peringkat.");
        } else {
            items.push("Pertahankan nilai semester berikutnya. Peringkat dihitung dari rapor, jadi konsistensi lebih penting daripada satu semester bagus.");
        }

        if (r.tren !== null && r.tren < -1) {
            items.push("Nilaimu turun " + fmt(-r.tren, 2) + " poin dari semester pertama yang kamu isi. Cari tahu mata pelajaran penyebabnya.");
        }

        items.push("Tanyakan ke wali kelas atau bagian kurikulum cara sekolah menghitung peringkat eligible, karena penetapannya dilakukan sekolah.");
        items.push("Pantau pengumuman kuota resmi sekolah dan jadwal SNBP di portal SNPMB.");

        return items;

    }

    function renderResult(r) {

        var root = $("rsHasilIsi");
        var copy = statusCopy(r);

        root.textContent = "";

        var box = h("div", "rs-status rs-status--" + (r.kuota < 1 ? "luar" : r.status));
        box.appendChild(h("span", "rs-badge", copy.badge));
        box.appendChild(h("p", "rs-status-title", copy.title));
        box.appendChild(h("p", "", copy.text));
        root.appendChild(box);

        var stats = h("div", "rs-stats");

        [
            [fmt(r.avg, 2), "Rata-rata rapor"],
            ["#" + r.d.peringkat, "Peringkat dari " + fmt(r.d.jumlah)],
            [fmt(r.kuota), "Kuota eligible (" + fmt(r.persen) + "%)"],
            [fmt(r.persenPeringkat, 1) + "%", "Posisimu dari atas"]
        ].forEach(function (p) {
            var s = h("div", "rs-stat");
            s.appendChild(h("span", "rs-stat-v", p[0]));
            s.appendChild(h("span", "rs-stat-l", p[1]));
            stats.appendChild(s);
        });

        root.appendChild(stats);

        var bars = h("div", "rs-bars");
        bars.appendChild(h("h3", "", "Nilai per semester"));

        r.d.semesters.forEach(function (s) {
            var row = h("div", "rs-bar");
            var track = h("span", "rs-bar-track");
            var fill = h("span", "rs-bar-fill");

            fill.style.width = Math.max(0, Math.min(100, s.nilai)) + "%";
            track.appendChild(fill);

            row.appendChild(h("span", "", "Semester " + s.sem));
            row.appendChild(track);
            row.appendChild(h("span", "rs-bar-v", fmt(s.nilai, 2)));
            bars.appendChild(row);
        });

        root.appendChild(bars);

        var next = h("div", "rs-next");
        var ul = h("ul");

        next.appendChild(h("h3", "", "Langkah berikutnya"));

        nextSteps(r).forEach(function (t) { ul.appendChild(h("li", "", t)); });

        next.appendChild(ul);
        root.appendChild(next);

    }

    function hitung() {

        var res = readForm();
        var err = $("rsError");

        if (res.errors.length) {
            err.textContent = res.errors.join(" ");
            err.hidden = false;
            err.scrollIntoView({ block: "center", behavior: "smooth" });
            return;
        }

        err.hidden = true;
        state.hasil = compute(res.data);

        renderResult(state.hasil);
        show("rsHasil", "rsHasilTitle");

    }

    /* ==========================================
       INIT
    ========================================== */

    function wire() {

        $("rsKelas").addEventListener("change", function (e) {

            state.kelas = e.target.value;
            $("rsMulai").disabled = !state.kelas;

        });

        $("rsMulai").addEventListener("click", function () { if (state.kelas) openForm(); });
        $("rsKembali").addEventListener("click", function () { show("rsIntro", "rsHello"); });
        $("rsHitung").addEventListener("click", hitung);
        $("rsUbah").addEventListener("click", function () { show("rsForm", "rsFormTitle"); });
        $("rsCetak").addEventListener("click", function () { window.print(); });

        $("rsUlang").addEventListener("click", function () {

            state.kelas = "";
            state.hasil = null;

            $("rsKelas").value = "";
            $("rsMulai").disabled = true;
            ["rsJumlah", "rsPeringkat"].forEach(function (id) { $(id).value = ""; });
            $("rsAkreditasi").value = "";
            $("rsErapor").checked = false;

            show("rsIntro", "rsHello");

        });

        // Enter di kolom isian = lihat hasil
        $("rsForm").addEventListener("keydown", function (e) {
            if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "checkbox") {
                e.preventDefault();
                hitung();
            }
        });

    }

    function init() {

        if (!$("rsApp")) return;

        wire();

        fetch(CONFIG_URL, { cache: "no-cache" })
            .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
            .then(function (json) {
                cfg = Object.assign({}, DEFAULTS, json);
                if (cfg.info_url) $("rsInfo").href = cfg.info_url;
            })
            .catch(function (e) {
                if (window.console) console.warn("Konfigurasi rasionalisasi memakai nilai bawaan:", e);
            });

    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();

})();
