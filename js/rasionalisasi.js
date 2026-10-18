/*
==========================================================
SMANSASOO Academic Portal
Rasionalisasi SNBP (pages/rasionalisasi.html)
Version : 2.1.0
==========================================================
Alur: pilih kelas -> isi target/minat + nilai rapor per mapel
per semester + posisi di sekolah -> hasil.

Yang dihitung (sesuai aturan SNBP, bukan prediksi prodi/PTN):
- rata-rata rapor dari semester yang diisi (dihitung dari
  rata-rata tiap mapel yang diisi di semester itu)
- mapel dengan rata-rata tertinggi/terendah, buat saran belajar
- kuota siswa eligible sekolah = persentase akreditasi
  (+ bonus e-rapor) x jumlah siswa seangkatan
- apakah peringkatmu berada di dalam kuota itu, dan seberapa
  tipis selisihnya

Fitur tambahan (v2.0.0):
- daftar mapel bisa diubah (tambah/hapus) oleh siswa
- rumpun minat & jurusan/kampus impian (opsional, cuma buat
  catatan strategi, bukan prediksi lolos jurusan tertentu)
- riwayat hasil tersimpan di localStorage perangkat ini saja
  (bisa dihapus kapan saja lewat tombol "Hapus semua")
- kartu hasil bisa diunduh sebagai gambar PNG lewat <canvas>,
  jelas dilabeli "simulasi pribadi, bukan pengumuman resmi"

Fitur tambahan (v2.1.0): hasil TKA (opsional, diisi siswa sendiri)
- 3 mata uji wajib + mata uji pilihan, masing-masing skor dan
  daya serap (%) kalau tertera di hasil TKA
- "Agen" ini BERBASIS ATURAN (tanpa LLM/API): catatan dibuat dari
  aturan di data/rasionalisasi.json (blok "tka"), yaitu: kecocokan
  mapel pilihan dengan rumpun minat, apakah mapel pilihan ada di
  rapor (minimal N semester), selisih nilai rapor vs skor TKA,
  mata uji TKA terendah/tertinggi, dan daya serap terendah
- Blok "tka" tidak ada di DEFAULTS: kalau berkas JSON gagal dimuat,
  bagian TKA disembunyikan, bagian lain tetap jalan

Angka persentase & data sekolah dibaca dari data/rasionalisasi.json
(bisa diubah tanpa menyentuh kode). Semua perhitungan terjadi di
browser; tidak ada data yang dikirim ke server mana pun.
==========================================================
*/

(function () {

    "use strict";

    var CONFIG_URL = "/data/rasionalisasi.json";
    var HISTORY_KEY = "smansasoo_rasionalisasi_riwayat";
    var MAX_HISTORY = 20;

    var DEFAULTS = {
        info_url: "https://snpmb.id",
        kuota: { A: 40, B: 25, C: 5, lainnya: 5 },
        bonus_erapor: 5,
        sekolah: { akreditasi: "", erapor: false, jumlah_siswa: { X: null, XI: null, XII: null } },
        semester: { X: [1], XI: [1, 2, 3], XII: [1, 2, 3, 4, 5] },
        mapel_default: [
            "Bahasa Indonesia", "Bahasa Inggris", "Matematika",
            "PKN/Pendidikan Pancasila", "Pendidikan Agama", "Sejarah Indonesia",
            "PJOK", "Seni Budaya", "Informatika"
        ],
        rumpun_minat: [
            { id: "saintek_tech", label: "Saintek: Teknologi & Teknik" },
            { id: "saintek_med", label: "Saintek: Kedokteran & Kesehatan" },
            { id: "saintek_pure", label: "Saintek: MIPA (Sains Murni)" },
            { id: "soshum_eco", label: "Soshum: Ekonomi & Bisnis" },
            { id: "soshum_soc", label: "Soshum: Sosial, Hukum & Politik" },
            { id: "soshum_art", label: "Soshum: Seni & Kreatif" }
        ]
    };

    var STATUS_LABEL = { aman: "Aman", tipis: "Tipis", luar: "Di luar", kosong: "Kuota kosong" };

    var cfg = DEFAULTS;
    var state = { kelas: "", mapel: DEFAULTS.mapel_default.slice(), hasil: null };

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

    function slug(name) {

        return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "mapel";

    }

    function rumpunLabel(id) {

        var found = (cfg.rumpun_minat || []).filter(function (r) { return r.id === id; })[0];

        return found ? found.label : "";

    }

    function formatTanggal(ts) {

        try {
            return new Date(ts).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
        } catch (e) {
            return "";
        }

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

        if (id === "rsIntro") renderHistorySection();

    }

    /* ==========================================
       DAFTAR MAPEL (tag + grid nilai per semester)
    ========================================== */

    function semesterList() { return cfg.semester[state.kelas] || [1]; }

    function mapelInputId(sem, mapel) { return "rsNilai_" + sem + "_" + slug(mapel); }

    function mapelRow(sem, mapel) {

        var box = h("div", "rs-field rs-field--mapel");
        var id = mapelInputId(sem, mapel);
        var label = h("label", "rs-label", mapel);
        var input = h("input", "rs-input");

        label.htmlFor = id;

        // type="text": input number menolak koma (86,5) di sebagian browser/ponsel.
        // parseNum() menerima koma maupun titik.
        input.type = "text";
        input.inputMode = "decimal";
        input.autocomplete = "off";
        input.placeholder = "mis. 86,5";
        input.id = id;
        input.setAttribute("data-sem", String(sem));
        input.setAttribute("data-mapel", mapel);

        box.appendChild(label);
        box.appendChild(input);

        return box;

    }

    function buildSemesterWrap() {

        var wrap = $("rsSemesterWrap");
        var list = semesterList();

        wrap.textContent = "";

        list.forEach(function (sem, idx) {

            var det = h("details", "rs-sem-accordion");
            var sum = h("summary", "rs-sem-summary", "Semester " + sem);
            var grid = h("div", "rs-grid");

            det.open = idx === 0;
            grid.id = "rsMapelGrid" + sem;

            state.mapel.forEach(function (m) { grid.appendChild(mapelRow(sem, m)); });

            det.appendChild(sum);
            det.appendChild(grid);
            wrap.appendChild(det);

        });

    }

    function addMapelRows(mapel) {

        semesterList().forEach(function (sem) {
            var grid = $("rsMapelGrid" + sem);
            if (grid) grid.appendChild(mapelRow(sem, mapel));
        });

    }

    function removeMapelRows(mapel) {

        semesterList().forEach(function (sem) {
            var el = $(mapelInputId(sem, mapel));
            var box = el && el.closest ? el.closest(".rs-field--mapel") : null;
            if (box) box.remove();
        });

    }

    function buildMapelTags() {

        var wrap = $("rsMapelTags");

        wrap.textContent = "";

        state.mapel.forEach(function (m) {

            var tag = h("span", "rs-tag");
            var btn = h("button", "rs-tag-x", "×");

            tag.appendChild(h("span", "", m));

            btn.type = "button";
            btn.setAttribute("aria-label", "Hapus mapel " + m);
            btn.addEventListener("click", function () {

                if (state.mapel.length <= 1) return;

                state.mapel = state.mapel.filter(function (x) { return x !== m; });
                removeMapelRows(m);
                buildMapelTags();

            });

            tag.appendChild(btn);
            wrap.appendChild(tag);

        });

    }

    function tambahMapel() {

        var inp = $("rsMapelBaru");
        var name = (inp.value || "").trim();

        if (!name) return;

        var exists = state.mapel.some(function (m) { return m.toLowerCase() === name.toLowerCase(); });

        if (exists) { inp.value = ""; return; }

        state.mapel.push(name);
        addMapelRows(name);
        buildMapelTags();

        inp.value = "";
        inp.focus();

    }

    function buildRumpunSelect() {

        var sel = $("rsRumpun");

        while (sel.options.length > 1) sel.remove(1);

        (cfg.rumpun_minat || []).forEach(function (r) {
            var opt = document.createElement("option");
            opt.value = r.id;
            opt.textContent = r.label;
            sel.appendChild(opt);
        });

    }

    function prefillSchool() {

        var s = cfg.sekolah || {};
        var jumlah = s.jumlah_siswa && s.jumlah_siswa[state.kelas];

        if (s.akreditasi && !$("rsAkreditasi").value) $("rsAkreditasi").value = s.akreditasi;
        if (s.erapor) $("rsErapor").checked = true;
        if (jumlah && !$("rsJumlah").value) $("rsJumlah").value = String(jumlah);

    }

    /* ==========================================
       TKA: FORM INPUT (opsional, diisi siswa sendiri)
    ========================================== */

    function tkaCfg() { return cfg.tka || null; }

    function tkaId(key, field) { return "rsTka_" + key + "_" + field; }

    // skor TKA bisa desimal (mis. 683,33), jadi tampilkan 2 desimal hanya kalau perlu
    function fmtSkor(n) { return Number.isInteger(n) ? fmt(n, 0) : fmt(n, 2); }

    function tkaNumInput(key, field, placeholder, ariaLabel) {

        var input = h("input", "rs-input");

        input.type = "text";
        input.inputMode = "decimal";
        input.autocomplete = "off";
        input.placeholder = placeholder;
        input.id = tkaId(key, field);
        input.setAttribute("aria-label", ariaLabel);

        return input;

    }

    function tkaColsHeader(t) {

        var cols = h("div", "rs-tka-cols");

        cols.setAttribute("aria-hidden", "true");
        cols.appendChild(h("span", "", "Mata uji"));
        cols.appendChild(h("span", "", "Skor (" + t.skor_min + "-" + t.skor_max + ")"));
        cols.appendChild(h("span", "", "Daya serap (%)"));

        return cols;

    }

    function tkaRowWajib(nama, key) {

        var row = h("div", "rs-tka-row");

        row.appendChild(h("span", "rs-tka-name", nama));
        row.appendChild(tkaNumInput(key, "skor", "mis. 640", "Skor TKA " + nama));
        row.appendChild(tkaNumInput(key, "daya", "mis. 72", "Daya serap " + nama + " (persen)"));

        return row;

    }

    function tkaRowPilihan(t, key, no) {

        var row = h("div", "rs-tka-row");
        var wrap = h("div", "rs-field-pick");
        var sel = h("select", "rs-select");
        var first = document.createElement("option");

        first.value = "";
        first.textContent = "Pilih mata uji pilihan " + no;
        sel.appendChild(first);

        t.pilihan.forEach(function (p) {
            var opt = document.createElement("option");
            opt.value = p.nama;
            opt.textContent = p.nama;
            sel.appendChild(opt);
        });

        sel.id = tkaId(key, "nama");
        sel.setAttribute("aria-label", "Mata uji pilihan " + no);

        wrap.appendChild(sel);
        row.appendChild(wrap);
        row.appendChild(tkaNumInput(key, "skor", "mis. 640", "Skor TKA mata uji pilihan " + no));
        row.appendChild(tkaNumInput(key, "daya", "mis. 72", "Daya serap mata uji pilihan " + no + " (persen)"));

        return row;

    }

    function buildTka() {

        var card = $("rsTkaCard");
        var wrap = $("rsTkaWrap");
        var t = tkaCfg();

        if (!card || !wrap) return;

        // tanpa konfigurasi TKA (JSON gagal dimuat) bagian ini disembunyikan, form lain tetap jalan
        if (!t) { card.hidden = true; return; }

        card.hidden = false;
        $("rsTkaNote").hidden = state.kelas === "XII";
        wrap.textContent = "";

        var gw = h("div", "rs-tka-group");

        gw.appendChild(h("h3", "", "Mata uji wajib"));
        gw.appendChild(tkaColsHeader(t));
        t.wajib.forEach(function (nama, i) { gw.appendChild(tkaRowWajib(nama, "w" + i)); });
        wrap.appendChild(gw);

        var gp = h("div", "rs-tka-group");

        gp.appendChild(h("h3", "", "Mata uji pilihan (maksimal " + t.jumlah_pilihan + ")"));
        gp.appendChild(tkaColsHeader(t));

        for (var i = 0; i < t.jumlah_pilihan; i++) gp.appendChild(tkaRowPilihan(t, "p" + i, i + 1));

        wrap.appendChild(gp);

    }

    function openForm() {

        $("rsFormSub").textContent = "Kelas " + state.kelas + ". Isi sejujur mungkin supaya gambarannya akurat.";
        $("rsError").hidden = true;

        buildMapelTags();
        buildSemesterWrap();
        buildTka();
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

    function readTka(errors) {

        var t = tkaCfg();
        var result = { entries: [], pilihan: [] };

        if (!t || $("rsTkaCard").hidden) return result;

        var slots = [];
        var badSkor = false;
        var badDaya = false;
        var needPick = false;
        var dup = false;
        var seen = {};

        t.wajib.forEach(function (nama, i) { slots.push({ key: "w" + i, nama: nama, jenis: "wajib", sel: null }); });

        for (var i = 0; i < t.jumlah_pilihan; i++) {

            var sel = $(tkaId("p" + i, "nama"));

            sel.removeAttribute("aria-invalid");
            slots.push({ key: "p" + i, nama: sel.value, jenis: "pilihan", sel: sel });

            if (sel.value) {
                if (seen[sel.value]) dup = true;
                seen[sel.value] = true;
                result.pilihan.push(sel.value);
            }

        }

        slots.forEach(function (s) {

            var skorEl = $(tkaId(s.key, "skor"));
            var dayaEl = $(tkaId(s.key, "daya"));

            skorEl.removeAttribute("aria-invalid");
            dayaEl.removeAttribute("aria-invalid");

            if (skorEl.value === "" && dayaEl.value === "") return;

            if (!s.nama) {
                needPick = true;
                s.sel.setAttribute("aria-invalid", "true");
                return;
            }

            var skor = skorEl.value === "" ? null : parseNum(skorEl.value);
            var daya = dayaEl.value === "" ? null : parseNum(dayaEl.value);

            if (skor !== null && (isNaN(skor) || skor < t.skor_min || skor > t.skor_max)) {
                skorEl.setAttribute("aria-invalid", "true");
                badSkor = true;
                skor = null;
            }

            if (daya !== null && (isNaN(daya) || daya < 0 || daya > 100)) {
                dayaEl.setAttribute("aria-invalid", "true");
                badDaya = true;
                daya = null;
            }

            if (skor === null && daya === null) return;

            result.entries.push({ nama: s.nama, jenis: s.jenis, skor: skor, daya: daya });

        });

        if (badSkor) errors.push("Skor TKA harus berupa angka " + t.skor_min + " sampai " + t.skor_max + ".");
        if (badDaya) errors.push("Daya serap TKA harus berupa angka 0 sampai 100.");
        if (needPick) errors.push("Pilih dulu mata uji pilihan TKA sebelum mengisi skor atau daya serapnya.");
        if (dup) errors.push("Dua mata uji pilihan TKA tidak boleh sama.");

        return result;

    }

    function readForm() {

        var errors = [];
        var invalid = [];
        var mapelAgg = {};
        var semAgg = {};

        Array.prototype.forEach.call($("rsSemesterWrap").querySelectorAll("input[data-mapel]"), function (inp) {

            inp.removeAttribute("aria-invalid");

            if (inp.value === "") return;

            var v = parseNum(inp.value);

            if (isNaN(v) || v < 0 || v > 100) {
                inp.setAttribute("aria-invalid", "true");
                invalid.push(inp);
                return;
            }

            var sem = Number(inp.getAttribute("data-sem"));
            var mapel = inp.getAttribute("data-mapel");

            if (!mapelAgg[mapel]) mapelAgg[mapel] = { sum: 0, count: 0 };
            mapelAgg[mapel].sum += v;
            mapelAgg[mapel].count += 1;

            if (!semAgg[sem]) semAgg[sem] = { sum: 0, count: 0 };
            semAgg[sem].sum += v;
            semAgg[sem].count += 1;

        });

        if (invalid.length) errors.push("Nilai rapor harus berupa angka 0 sampai 100.");

        var semesters = Object.keys(semAgg)
            .map(function (k) { return Number(k); })
            .sort(function (a, b) { return a - b; })
            .map(function (sem) { return { sem: sem, nilai: semAgg[sem].sum / semAgg[sem].count }; });

        if (!semesters.length && !invalid.length) errors.push("Isi minimal satu nilai mapel di salah satu semester.");

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

        var tka = readTka(errors);

        return {
            errors: errors,
            data: {
                kelas: state.kelas,
                tka: tka.entries,
                tkaPilihan: tka.pilihan,
                semesters: semesters,
                mapelAgg: mapelAgg,
                akreditasi: akre,
                erapor: $("rsErapor").checked,
                jumlah: jumlah,
                peringkat: rank,
                rumpun: $("rsRumpun").value,
                impian: ($("rsImpian").value || "").trim()
            }
        };

    }

    /* ==========================================
       TKA: ANALISIS BERBASIS ATURAN
    ========================================== */

    // label kategori dari config (saat ini cuma "Istimewa" >= 725; rentang lain belum diketahui)
    function kategoriTka(skor) {

        var t = tkaCfg();

        if (!t || skor === null) return "";

        var list = (t.kategori || []).slice().sort(function (a, b) { return b.min - a.min; });

        for (var i = 0; i < list.length; i++) {
            if (skor >= list[i].min) return list[i].label;
        }

        return "";

    }

    // cari mapel rapor yang namanya memuat potongan nama (mis. "Pancasila" cocok dengan
    // "PKN/Pendidikan Pancasila"); kalau ada beberapa, pakai yang semesternya paling banyak
    function findRapor(d, frag) {

        var f = String(frag || "").toLowerCase();
        var best = null;

        if (!f) return null;

        Object.keys(d.mapelAgg).forEach(function (name) {

            if (name.toLowerCase().indexOf(f) === -1) return;

            var a = d.mapelAgg[name];

            if (!best || a.count > best.count) best = { mapel: name, avg: a.sum / a.count, count: a.count };

        });

        return best;

    }

    function raporFragFor(jenis, nama) {

        var t = tkaCfg();

        if (jenis === "wajib") return nama;

        var p = ((t && t.pilihan) || []).filter(function (x) { return x.nama === nama; })[0];

        return p ? p.rapor : nama;

    }

    function tkaAnalyze(d) {

        var t = tkaCfg();
        var list = [];

        if (t) {

            (d.tka || []).forEach(function (e) {

                var pos = e.skor === null ? null : (e.skor - t.skor_min) / (t.skor_max - t.skor_min) * 100;

                list.push({
                    nama: e.nama,
                    jenis: e.jenis,
                    skor: e.skor,
                    daya: e.daya,
                    pos: pos,
                    kategori: kategoriTka(e.skor),
                    rapor: findRapor(d, raporFragFor(e.jenis, e.nama))
                });

            });

        }

        var scored = list.filter(function (e) { return e.skor !== null; })
            .sort(function (a, b) { return a.skor - b.skor; });

        return { list: list, scored: scored };

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

        var mapelList = Object.keys(d.mapelAgg).map(function (name) {
            var a = d.mapelAgg[name];
            return { mapel: name, avg: a.sum / a.count };
        }).sort(function (a, b) { return a.avg - b.avg; });

        var tka = tkaAnalyze(d);

        return {
            d: d,
            tkaList: tka.list,
            tkaScored: tka.scored,
            tkaLowest: tka.scored.length ? tka.scored[0] : null,
            tkaHighest: tka.scored.length ? tka.scored[tka.scored.length - 1] : null,
            avg: avg,
            persen: persen,
            kuota: kuota,
            selisih: selisih,
            buffer: buffer,
            status: status,
            tren: tren,
            persenPeringkat: d.peringkat / d.jumlah * 100,
            mapelList: mapelList,
            mapelLowest: mapelList.length ? mapelList[0] : null,
            mapelHighest: mapelList.length ? mapelList[mapelList.length - 1] : null
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

        if (r.mapelLowest) {
            items.push("Mapel dengan rata-rata terendah: " + r.mapelLowest.mapel + " (" + fmt(r.mapelLowest.avg, 1) + "). Fokuskan belajar di sana karena paling banyak mengangkat rata-rata rapormu.");
        }

        if (r.status === "luar") {
            items.push("Mulai siapkan UTBK-SNBT sebagai jalur utama sambil terus memantau peringkat.");
        } else {
            items.push("Pertahankan nilai semester berikutnya. Peringkat dihitung dari rapor, jadi konsistensi lebih penting daripada satu semester bagus.");
        }

        if (r.tren !== null && r.tren < -1) {
            items.push("Rata-rata rapormu turun " + fmt(-r.tren, 2) + " poin dari semester pertama yang kamu isi. Cari tahu mapel penyebabnya.");
        }

        if (r.d.rumpun && (r.status === "tipis" || r.status === "luar")) {
            items.push("Karena minatmu di " + rumpunLabel(r.d.rumpun) + ", pertimbangkan juga prodi sejenis dengan peminat lebih sedikit -- biasanya ambang nilainya lebih longgar dibanding prodi paling favorit.");
        }

        items.push("Tanyakan ke wali kelas atau bagian kurikulum cara sekolah menghitung peringkat eligible, karena penetapannya dilakukan sekolah.");
        items.push("Pantau pengumuman kuota resmi sekolah dan jadwal SNBP di portal SNPMB.");

        return items;

    }

    // Catatan strategi TKA: murni aturan (tanpa LLM). Semua ambang ada di data/rasionalisasi.json (blok "tka").
    function tkaCatatan(r) {

        var t = tkaCfg();
        var notes = [];

        if (!t) return notes;

        var d = r.d;
        var minSem = t.min_semester_rapor || 2;
        var semAvail = (cfg.semester[d.kelas] || [1]).length;
        var rumpun = d.rumpun ? rumpunLabel(d.rumpun) : "";
        var rec = d.rumpun && t.rekomendasi_rumpun ? t.rekomendasi_rumpun[d.rumpun] : null;

        if (!r.tkaList.length && d.kelas === "XII") {
            notes.push("Kamu belum mengisi hasil TKA. Pada SNBP, TKA dipakai untuk mencocokkan dengan nilai rapor, jadi isi bagian TKA kalau hasilnya sudah ada.");
        }

        // 1. mata uji terendah / tertinggi dan predikat
        if (r.tkaScored.length >= 2) {
            notes.push("Mata uji TKA terendahmu: " + r.tkaLowest.nama + " (" + fmtSkor(r.tkaLowest.skor) + "), tertinggi: " + r.tkaHighest.nama + " (" + fmtSkor(r.tkaHighest.skor) + "). Prioritaskan persiapan di mata uji terendah, terutama kalau itu mata uji wajib.");
        }

        var byKat = {};

        r.tkaScored.forEach(function (e) {
            if (!e.kategori) return;
            if (!byKat[e.kategori]) byKat[e.kategori] = [];
            byKat[e.kategori].push(e.nama);
        });

        Object.keys(byKat).forEach(function (k) {
            notes.push("Predikat " + k + " di: " + byKat[k].join(", ") + ".");
        });

        // 2. daya serap terendah
        var dayaList = r.tkaList.filter(function (e) { return e.daya !== null; })
            .sort(function (a, b) { return a.daya - b.daya; });

        if (dayaList.length) {
            notes.push("Daya serap terendahmu: " + dayaList[0].nama + " (" + fmtSkor(dayaList[0].daya) + "%). Buka rincian daya serap per bagian materi di tka.kemendikdasmen.go.id, lalu pelajari ulang bagian yang paling lemah.");
        }

        // 3. rapor vs TKA (perbandingan kasar: posisi skor pada skala TKA vs rata-rata rapor)
        var gaps = [];

        r.tkaScored.forEach(function (e) {
            if (e.rapor && e.pos !== null) gaps.push({ e: e, diff: e.rapor.avg - e.pos });
        });

        gaps.sort(function (a, b) { return Math.abs(b.diff) - Math.abs(a.diff); });

        gaps.slice(0, 2).forEach(function (g) {

            var e = g.e;
            var banding = "rapor " + e.rapor.mapel + " rata-rata " + fmt(e.rapor.avg, 1) + " vs skor TKA " + e.nama + " " + fmtSkor(e.skor) + " (sekitar " + fmt(e.pos, 0) + "% dari skala)";

            if (g.diff >= t.selisih_wajar) {
                notes.push("Selisih cukup besar: " + banding + ". Karena TKA dipakai untuk mencocokkan dengan rapor, selisih seperti ini bisa terlihat kurang konsisten, jadi perkuat penguasaan materinya. Ini perbandingan kasar, bukan aturan resmi.");
            } else if (g.diff <= -t.selisih_wajar) {
                notes.push("Skor TKA-mu lebih tinggi dari nilai rapornya: " + banding + ". Kemampuanmu melebihi yang terlihat di rapor, jadi jaga agar nilai rapor semester berikutnya ikut naik. Ini perbandingan kasar, bukan aturan resmi.");
            }

        });

        // 4. mata uji pilihan harus ada di rapor (minimal N semester, aturan SNBP 2025)
        d.tkaPilihan.forEach(function (nama) {

            var rap = findRapor(d, raporFragFor("pilihan", nama));

            if (!rap) {
                notes.push("Mata uji pilihan " + nama + " belum ada nilainya di rapor yang kamu isi. Pada SNBP, mapel pilihan TKA sebaiknya tercantum di rapor minimal " + minSem + " semester (aturan SNBP 2025; cek ketentuan 2027 di SNPMB).");
            } else if (semAvail >= minSem && rap.count < minSem) {
                notes.push("Mata uji pilihan " + nama + " baru terisi " + rap.count + " semester di rapor. Sebaiknya minimal " + minSem + " semester (aturan SNBP 2025; cek ketentuan 2027 di SNPMB).");
            }

        });

        // 5. mata uji pilihan vs rumpun minat
        if (rec && rec.length) {

            if (!d.tkaPilihan.length) {

                notes.push("Untuk minat " + rumpun + ", mata uji pilihan yang umum dipilih: " + rec.join(", ") + ". Pastikan sesuai syarat prodi tujuan dan ada di rapormu.");

            } else {

                var cocok = d.tkaPilihan.filter(function (n) { return rec.indexOf(n) !== -1; });

                if (!cocok.length) {
                    notes.push("Mata uji pilihanmu (" + d.tkaPilihan.join(", ") + ") kurang sejalan dengan minat " + rumpun + ". Yang umum dipilih: " + rec.join(", ") + ". Cek syarat prodi tujuan sebelum memutuskan.");
                } else if (cocok.length < d.tkaPilihan.length) {
                    notes.push("Sebagian mata uji pilihanmu sejalan dengan minat " + rumpun + " (" + cocok.join(", ") + "). Pastikan yang lain juga punya rekam nilai di rapor.");
                } else {
                    notes.push("Mata uji pilihanmu sejalan dengan minat " + rumpun + ". Lanjutkan dengan memastikan nilai rapor mapel itu juga kuat.");
                }

            }

        }

        return notes;

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

        if (r.d.impian || r.d.rumpun) {

            var target = h("div", "rs-target");
            var bits = [];

            if (r.d.impian) bits.push(r.d.impian);
            if (r.d.rumpun) bits.push(rumpunLabel(r.d.rumpun));

            target.appendChild(h("span", "rs-target-label", "Target kamu"));
            target.appendChild(h("p", "rs-target-text", bits.join(" · ")));
            root.appendChild(target);

        }

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

        if (r.mapelList.length) {

            var mbars = h("div", "rs-bars");
            mbars.appendChild(h("h3", "", "Rata-rata per mata pelajaran"));

            r.mapelList.forEach(function (m) {
                var row = h("div", "rs-bar rs-bar--mapel");
                var track = h("span", "rs-bar-track");
                var fill = h("span", "rs-bar-fill");

                fill.style.width = Math.max(0, Math.min(100, m.avg)) + "%";
                track.appendChild(fill);

                row.appendChild(h("span", "", m.mapel));
                row.appendChild(track);
                row.appendChild(h("span", "rs-bar-v", fmt(m.avg, 1)));
                mbars.appendChild(row);
            });

            root.appendChild(mbars);

        }

        if (r.tkaList.length) {

            var t = tkaCfg();
            var tb = h("div", "rs-bars");

            tb.appendChild(h("h3", "", "Hasil TKA"));

            r.tkaList.forEach(function (e) {

                var row = h("div", "rs-bar rs-bar--tka");
                var track = h("span", "rs-bar-track");
                var fill = h("span", "rs-bar-fill");
                var bits = [];

                fill.style.width = (e.pos === null ? 0 : Math.max(0, Math.min(100, e.pos))) + "%";
                track.appendChild(fill);

                row.appendChild(h("span", "", e.nama + (e.jenis === "pilihan" ? " (pilihan)" : "")));
                row.appendChild(track);
                row.appendChild(h("span", "rs-bar-v", e.skor === null ? "-" : fmtSkor(e.skor)));
                tb.appendChild(row);

                if (e.kategori) bits.push("Predikat " + e.kategori);
                if (e.daya !== null) bits.push("Daya serap " + fmtSkor(e.daya) + "%");

                if (bits.length) tb.appendChild(h("p", "rs-tka-sub", bits.join(" · ")));

            });

            tb.appendChild(h("p", "rs-tka-sub", "Skala skor TKA SMA " + t.skor_min + "-" + t.skor_max + ". Panjang batang = posisi skor pada skala itu."));
            root.appendChild(tb);

        }

        var tkaNotes = tkaCatatan(r);

        if (tkaNotes.length) {

            var tn = h("div", "rs-next");
            var tul = h("ul");

            tn.appendChild(h("h3", "", "Catatan hasil TKA"));
            tkaNotes.forEach(function (t2) { tul.appendChild(h("li", "", t2)); });
            tn.appendChild(tul);
            root.appendChild(tn);

        }

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
        pushHistory(state.hasil);
        show("rsHasil", "rsHasilTitle");

    }

    /* ==========================================
       RIWAYAT (localStorage, per perangkat)
    ========================================== */

    function loadHistory() {

        try {
            var raw = localStorage.getItem(HISTORY_KEY);
            var arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }

    }

    function saveHistory(arr) {

        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(-MAX_HISTORY))); } catch (e) { /* localStorage tidak tersedia, abaikan */ }

    }

    function clearHistory() {

        try { localStorage.removeItem(HISTORY_KEY); } catch (e) { /* abaikan */ }

    }

    function pushHistory(r) {

        var arr = loadHistory();

        arr.push({
            ts: Date.now(),
            kelas: r.d.kelas,
            avg: r.avg,
            peringkat: r.d.peringkat,
            jumlah: r.d.jumlah,
            kuota: r.kuota,
            status: r.kuota < 1 ? "kosong" : r.status,
            persenPeringkat: r.persenPeringkat,
            impian: r.d.impian || "",
            rumpun: r.d.rumpun || ""
        });

        saveHistory(arr);

    }

    function sparklineSVG(arr) {

        if (arr.length < 2) return "";

        var w = 320, hh = 64, pad = 8;
        var vals = arr.map(function (e) { return e.avg; });
        var min = Math.min.apply(null, vals);
        var max = Math.max.apply(null, vals);
        var range = (max - min) || 1;

        var pts = vals.map(function (v, i) {
            var x = pad + (i / (vals.length - 1)) * (w - pad * 2);
            var y = hh - pad - ((v - min) / range) * (hh - pad * 2);
            return x.toFixed(1) + "," + y.toFixed(1);
        }).join(" ");

        return '<svg viewBox="0 0 ' + w + ' ' + hh + '" width="100%" height="' + hh + '" preserveAspectRatio="none" role="img" aria-label="Grafik tren rata-rata rapor">' +
            '<polyline points="' + pts + '" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>';

    }

    function renderHistorySection() {

        var box = $("rsHistoryBox");
        var arr = loadHistory();

        if (!box) return;

        if (!arr.length) { box.hidden = true; return; }

        box.hidden = false;

        $("rsHistoryChart").innerHTML = sparklineSVG(arr);

        var list = $("rsHistoryList");

        list.textContent = "";

        arr.slice().reverse().slice(0, 8).forEach(function (e) {

            var li = h("li", "rs-history-item");
            var main = h("div", "rs-history-item-main");

            main.appendChild(h("span", "rs-history-date", formatTanggal(e.ts)));
            main.appendChild(h("span", "rs-history-sub", "Kelas " + e.kelas + " · rata-rata " + fmt(e.avg, 2) + " · peringkat #" + e.peringkat));

            li.appendChild(main);
            li.appendChild(h("span", "rs-badge rs-badge--mini rs-badge--" + e.status, STATUS_LABEL[e.status] || "Di luar"));

            list.appendChild(li);

        });

    }

    function wireHistory() {

        $("rsHistoryClear").addEventListener("click", function () {

            if (!window.confirm("Hapus semua riwayat yang tersimpan di perangkat ini?")) return;

            clearHistory();
            renderHistorySection();

        });

    }

    /* ==========================================
       KARTU HASIL (unduh sebagai PNG)
    ========================================== */

    function roundRectPath(ctx, x, y, w, hh, r) {

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + hh, r);
        ctx.arcTo(x + w, y + hh, x, y + hh, r);
        ctx.arcTo(x, y + hh, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();

    }

    function wrapTextLines(ctx, text, maxWidth) {

        var words = String(text).split(/\s+/);
        var lines = [];
        var line = "";

        words.forEach(function (w) {

            var test = line ? line + " " + w : w;

            if (line && ctx.measureText(test).width > maxWidth) {
                lines.push(line);
                line = w;
            } else {
                line = test;
            }

        });

        if (line) lines.push(line);

        return lines;

    }

    function drawCard(r) {

        var W = 1080, H = 1350, pad = 60;
        var canvas = document.createElement("canvas");

        canvas.width = W;
        canvas.height = H;

        var ctx = canvas.getContext("2d");
        var grad = ctx.createLinearGradient(0, 0, 0, H);

        grad.addColorStop(0, "#0f4c81");
        grad.addColorStop(1, "#102a46");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // panel putih
        ctx.fillStyle = "#ffffff";
        roundRectPath(ctx, pad, 230, W - pad * 2, H - 230 - pad, 28);
        ctx.fill();

        // header
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 28px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("SMAN 1 Sooko Mojokerto", W / 2, 88);

        ctx.font = "800 42px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Kartu Hasil Rasionalisasi SNBP", W / 2, 142);

        ctx.font = "600 22px 'Plus Jakarta Sans', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,.85)";
        ctx.fillText("Simulasi pribadi · bukan pengumuman resmi SNPMB", W / 2, 182);

        // isi panel
        var bodyX = pad + 50;
        var maxTextWidth = W - pad * 2 - 100;
        var cursorY = 310;

        ctx.textAlign = "left";

        ctx.font = "700 26px 'Plus Jakarta Sans', sans-serif";
        ctx.fillStyle = "#14233a";
        ctx.fillText("Kelas " + r.d.kelas, bodyX, cursorY);

        // badge status
        var colors = {
            aman: ["#0f7a56", "rgba(15,122,86,.12)"],
            tipis: ["#8a5a00", "rgba(214,158,46,.18)"],
            luar: ["#b3261e", "rgba(179,38,30,.1)"],
            kosong: ["#55657d", "rgba(85,101,125,.12)"]
        };
        var statusKey = r.kuota < 1 ? "kosong" : r.status;
        var sc = colors[statusKey] || colors.luar;
        var badgeText = STATUS_LABEL[statusKey] || "Di luar";

        cursorY += 46;

        ctx.font = "700 22px 'Plus Jakarta Sans', sans-serif";
        var badgeW = ctx.measureText(badgeText).width + 48;

        ctx.fillStyle = sc[1];
        roundRectPath(ctx, bodyX, cursorY - 34, badgeW, 46, 23);
        ctx.fill();

        ctx.fillStyle = sc[0];
        ctx.fillText(badgeText, bodyX + 24, cursorY - 2);

        cursorY += 70;

        function statRow(label, value) {

            ctx.font = "600 20px 'Plus Jakarta Sans', sans-serif";
            ctx.fillStyle = "#55657d";
            ctx.fillText(label, bodyX, cursorY);

            ctx.font = "800 30px 'Plus Jakarta Sans', sans-serif";
            ctx.fillStyle = "#14233a";
            ctx.fillText(value, bodyX, cursorY + 36);

            cursorY += 86;

        }

        statRow("Rata-rata rapor", fmt(r.avg, 2));
        statRow("Peringkat", "#" + r.d.peringkat + " dari " + fmt(r.d.jumlah) + " siswa");
        statRow("Kuota eligible sekolah", fmt(r.kuota) + " siswa (" + fmt(r.persen) + "%)");

        if (r.mapelLowest) statRow("Mapel perlu perhatian", r.mapelLowest.mapel + " (" + fmt(r.mapelLowest.avg, 1) + ")");

        if (r.tkaHighest) {

            statRow(r.tkaScored.length > 1 ? "TKA tertinggi" : "Hasil TKA", r.tkaHighest.nama + " (" + fmtSkor(r.tkaHighest.skor) + ")");

            if (r.tkaScored.length > 1) statRow("TKA terendah", r.tkaLowest.nama + " (" + fmtSkor(r.tkaLowest.skor) + ")");

        }

        if (r.d.impian) {

            ctx.font = "600 20px 'Plus Jakarta Sans', sans-serif";
            ctx.fillStyle = "#55657d";
            ctx.fillText("Target jurusan & kampus", bodyX, cursorY);

            ctx.font = "700 26px 'Plus Jakarta Sans', sans-serif";
            ctx.fillStyle = "#14233a";

            var lines = wrapTextLines(ctx, r.d.impian, maxTextWidth).slice(0, 2);

            lines.forEach(function (l, i) { ctx.fillText(l, bodyX, cursorY + 34 + i * 32); });

            cursorY += 50 + lines.length * 32;

        }

        ctx.font = "500 18px 'Plus Jakarta Sans', sans-serif";
        ctx.fillStyle = "#8a93a6";
        ctx.fillText("Dibuat " + formatTanggal(Date.now()), bodyX, H - pad - 14);

        return canvas;

    }

    function unduhKartu() {

        if (!state.hasil) return;

        var go = function () {

            var canvas = drawCard(state.hasil);
            var link = document.createElement("a");

            link.download = "kartu-rasionalisasi-snbp.png";
            link.href = canvas.toDataURL("image/png");

            document.body.appendChild(link);
            link.click();
            link.remove();

        };

        // tunggu font kustom selesai dimuat biar kartu tidak jatuh ke font bawaan browser
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(go).catch(go);
        else go();

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
        $("rsUnduhKartu").addEventListener("click", unduhKartu);
        $("rsMapelTambah").addEventListener("click", tambahMapel);

        wireHistory();

        $("rsUlang").addEventListener("click", function () {

            state.kelas = "";
            state.hasil = null;

            $("rsKelas").value = "";
            $("rsMulai").disabled = true;
            ["rsJumlah", "rsPeringkat", "rsImpian"].forEach(function (id) { $(id).value = ""; });
            $("rsAkreditasi").value = "";
            $("rsRumpun").value = "";
            $("rsErapor").checked = false;

            show("rsIntro", "rsHello");

        });

        // Enter di kolom tambah mapel = tambah mapel, bukan langsung hitung
        $("rsMapelBaru").addEventListener("keydown", function (e) {
            if (e.key === "Enter") { e.preventDefault(); tambahMapel(); }
        });

        // Enter di kolom isian lain = lihat hasil
        $("rsForm").addEventListener("keydown", function (e) {
            if (e.target.id === "rsMapelBaru") return;
            if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "checkbox") {
                e.preventDefault();
                hitung();
            }
        });

    }

    function init() {

        if (!$("rsApp")) return;

        buildRumpunSelect();
        wire();
        renderHistorySection();

        fetch(CONFIG_URL, { cache: "no-cache" })
            .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
            .then(function (json) {

                cfg = Object.assign({}, DEFAULTS, json);

                if (cfg.info_url) $("rsInfo").href = cfg.info_url;

                buildRumpunSelect();

                // kalau siswa belum mulai isi form, pakai daftar mapel dari konfigurasi terbaru
                if (!state.kelas && cfg.mapel_default) state.mapel = cfg.mapel_default.slice();

                // form terlanjur terbuka sebelum JSON selesai dimuat: tampilkan bagian TKA sekarang
                if (state.kelas && !$("rsForm").hidden) buildTka();

            })
            .catch(function (e) {
                if (window.console) console.warn("Konfigurasi rasionalisasi memakai nilai bawaan:", e);
            });

    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();

})();
