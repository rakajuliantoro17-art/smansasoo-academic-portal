/*
==========================================================
SMANSASOO Academic Portal
Profil Belajar (pages/profil-belajar.html)
Version : 1.0.0
==========================================================
Alat refleksi diri untuk mendukung pembelajaran berdiferensiasi
(kesiapan, minat, profil belajar). Semua butir, bobot, ambang,
dan teks saran ada di data/profil-belajar.json -- guru bisa
mengubahnya tanpa menyentuh berkas ini.

Modul:
  kesiapan  : penilaian diri per topik Matematika (per kelas)
  gaya      : 9 gaya belajar (kecenderungan campuran)
  minat     : minat karier model RIASEC -> rumpun SNBP
  ct        : Computational Thinking (4 pilar) + cara yang cocok
              dengan gaya belajar
  kebiasaan : kebiasaan belajar (motivasi, waktu, fokus, refleksi)

Aturan saran sepenuhnya berbasis aturan (tanpa AI/LLM).
Data TIDAK dikirim ke server: hanya persentase per dimensi
yang disimpan di localStorage (kunci STORE_KEY) di browser ini.
Kunci tersebut juga dibaca js/rasionalisasi.js untuk mengisi
rumpun minat secara otomatis.
==========================================================
*/

(function () {

    "use strict";

    var CFG_URL = "/data/profil-belajar.json";
    var RS_URL = "/data/rasionalisasi.json";
    var STORE_KEY = "smansasoo_profil_belajar";
    var PER_PAGE = 6;

    var cfg = null;
    var rsCfg = null;

    var state = {
        mod: "",
        page: 0,
        answers: {},
        kelas: ""
    };

    var MODS = [
        { key: "kesiapan", ikon: "🧱", judul: "Kesiapan Belajar", desc: "Nilai sendiri seberapa paham topik Matematika kelasmu, supaya latihan bisa dimulai dari titik yang pas.", waktu: "±3 menit" },
        { key: "gaya", ikon: "🎧", judul: "Cara Belajar (9 gaya)", desc: "Kenali kecenderungan cara belajarmu: visual, auditori, baca-tulis, kinestetik, dan lainnya.", waktu: "±6 menit" },
        { key: "minat", ikon: "🧭", judul: "Minat & Bakat (RIASEC)", desc: "Lihat minat kariermu dan kaitannya dengan rumpun pilihan SNBP.", waktu: "±7 menit" },
        { key: "ct", ikon: "🧩", judul: "Computational Thinking", desc: "Seberapa terbiasa kamu memecah, mengenali pola, menyaring, dan menyusun langkah untuk memecahkan masalah.", waktu: "±3 menit" },
        { key: "kebiasaan", ikon: "📅", judul: "Kebiasaan Belajar", desc: "Cek motivasi, pengelolaan waktu, fokus, dan refleksi dirimu.", waktu: "±3 menit" }
    ];

    var $ = function (id) { return document.getElementById(id); };

    /* ---------- util ---------- */

    function esc(s) {

        return String(s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
        });

    }

    function modOf(key) {

        for (var i = 0; i < MODS.length; i++) {
            if (MODS[i].key === key) return MODS[i];
        }

        return null;

    }

    function join(list) {

        if (list.length <= 1) return list.join("");
        return list.slice(0, -1).join(", ") + " dan " + list[list.length - 1];

    }

    function round(n) { return Math.round(n); }

    /* ---------- penyimpanan lokal ---------- */

    function loadStore() {

        try {
            var raw = localStorage.getItem(STORE_KEY);
            var obj = raw ? JSON.parse(raw) : {};
            return (obj && typeof obj === "object") ? obj : {};
        } catch (e) {
            return {};
        }

    }

    function saveStore(obj) {

        try {
            localStorage.setItem(STORE_KEY, JSON.stringify(obj));
            return true;
        } catch (e) {
            return false;
        }

    }

    function saveModule(key, data) {

        var s = loadStore();

        data.ts = new Date().toISOString();
        s[key] = data;
        saveStore(s);

    }

    /* ---------- skor ---------- */

    function pct(sum, n) {

        return ((sum - n) / (3 * n)) * 100;

    }

    // butir: [{d,t}], answers: {index: 1..4} -> {dimId: persen}
    function scoreDims(butir, answers) {

        var sum = {};
        var cnt = {};

        butir.forEach(function (b, i) {
            sum[b.d] = (sum[b.d] || 0) + Number(answers[i]);
            cnt[b.d] = (cnt[b.d] || 0) + 1;
        });

        var out = {};

        Object.keys(sum).forEach(function (d) {
            out[d] = pct(sum[d], cnt[d]);
        });

        return out;

    }

    // urut menurun dari {id: persen} -> [{id, v}]
    function ranked(scores) {

        return Object.keys(scores).map(function (id) {
            return { id: id, v: scores[id] };
        }).sort(function (a, b) { return b.v - a.v; });

    }

    function byId(list, id) {

        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) return list[i];
        }

        return null;

    }

    function isMerata(rank) {

        if (rank.length < 3) return false;
        return (rank[0].v - rank[2].v) < (cfg.merata_selisih || 12);

    }

    function rumpunRank(minatScores) {

        var out = [];
        var w = cfg.minat.rumpun_bobot || {};

        Object.keys(w).forEach(function (rid) {

            var total = 0;

            Object.keys(w[rid]).forEach(function (code) {
                total += w[rid][code] * (minatScores[code] || 0);
            });

            out.push({ id: rid, v: total });

        });

        return out.sort(function (a, b) { return b.v - a.v; });

    }

    function rumpunLabel(id) {

        var list = (rsCfg && rsCfg.rumpun_minat) || [];
        var r = byId(list, id);

        if (r) return r.label;

        var fallback = {
            saintek_tech: "Saintek: Teknologi & Teknik",
            saintek_med: "Saintek: Kedokteran & Kesehatan",
            saintek_pure: "Saintek: MIPA (Sains Murni)",
            soshum_eco: "Soshum: Ekonomi & Bisnis",
            soshum_soc: "Soshum: Sosial, Hukum & Politik",
            soshum_art: "Soshum: Seni & Kreatif"
        };

        return fallback[id] || id;

    }

    function levelCT(v) {

        if (v < 40) return "perlu dilatih";
        if (v < 70) return "berkembang";
        return "kuat";

    }

    function kesiapanTier(p) {

        var t = cfg.kesiapan.tingkat;

        for (var i = 0; i < t.length; i++) {
            if (p < t[i].maks) return t[i];
        }

        return t[t.length - 1];

    }

    /* ---------- tampilan: pindah layar ---------- */

    function show(which) {

        $("pbHub").hidden = which !== "hub";
        $("pbRun").hidden = which !== "run";
        $("pbResult").hidden = which !== "result";

        var heading = which === "hub" ? $("pbHello") : (which === "run" ? $("pbRunTitle") : $("pbResultTitle"));

        try { window.scrollTo(0, 0); } catch (e) { /* abaikan */ }
        if (heading && heading.focus) heading.focus();

    }

    /* ---------- beranda ---------- */

    function renderHub() {

        var s = loadStore();
        var box = $("pbMods");

        if (!cfg) {
            box.innerHTML = "<div class=\"pb-error\">Data profil belajar belum bisa dimuat. Coba muat ulang halaman.</div>";
            return;
        }

        box.innerHTML = MODS.map(function (m) {

            var done = !!s[m.key];
            var badge = done
                ? "<span class=\"pb-badge\">Sudah diisi</span>"
                : "<span class=\"pb-badge pb-badge--todo\">Belum diisi</span>";

            return "<button type=\"button\" class=\"pb-mod\" data-mod=\"" + m.key + "\">"
                + "<span class=\"pb-mod-ico\" aria-hidden=\"true\">" + m.ikon + "</span>"
                + "<span class=\"pb-mod-title\">" + esc(m.judul) + "</span>"
                + "<span class=\"pb-mod-desc\">" + esc(m.desc) + "</span>"
                + "<span class=\"pb-mod-meta\">" + badge + " · " + esc(m.waktu) + "</span>"
                + "</button>";

        }).join("");

        renderSummary();

    }

    /* ---------- ringkasan & rencana ---------- */

    function summaryRows(s) {

        var rows = [];

        if (s.kesiapan) {
            var tier = kesiapanTier(s.kesiapan.pct);
            rows.push(["Kesiapan Matematika", "Kelas " + s.kesiapan.kelas + ": " + tier.label + " (" + round(s.kesiapan.pct) + "%)"]);
        }

        if (s.gaya) {
            var gr = ranked(s.gaya.skor);
            var names = (isMerata(gr) ? gr.slice(0, 3) : gr.slice(0, 2)).map(function (r) {
                return byId(cfg.gaya.dimensi, r.id).nama;
            });
            rows.push(["Cara belajar", (isMerata(gr) ? "Merata: " : "") + join(names)]);
        }

        if (s.minat) {
            var mr = ranked(s.minat.skor);
            var code = mr.slice(0, 3).map(function (r) { return r.id; }).join("");
            rows.push(["Minat (RIASEC)", code + " · " + rumpunLabel(s.minat.rumpunTop)]);
        }

        if (s.ct) {
            var cr = ranked(s.ct.skor);
            rows.push(["Computational Thinking", "Terkuat: " + byId(cfg.ct.pilar, cr[0].id).nama + ". Perlu dilatih: " + byId(cfg.ct.pilar, cr[cr.length - 1].id).nama]);
        }

        if (s.kebiasaan) {
            var kr = ranked(s.kebiasaan.skor);
            rows.push(["Kebiasaan belajar", "Kuat di " + byId(cfg.kebiasaan.dimensi, kr[0].id).nama + ". Perlu perhatian: " + byId(cfg.kebiasaan.dimensi, kr[kr.length - 1].id).nama]);
        }

        return rows;

    }

    function weeklyPlan(s) {

        var plan = [];

        if (s.gaya) {
            var g = byId(cfg.gaya.dimensi, ranked(s.gaya.skor)[0].id);
            plan.push("Cara belajar " + g.nama + ": " + g.strategi[0]);
        }

        if (s.kebiasaan) {
            var kr = ranked(s.kebiasaan.skor);
            var k = byId(cfg.kebiasaan.dimensi, kr[kr.length - 1].id);
            plan.push("Kebiasaan (" + k.nama + "): " + k.tips[0]);
        }

        if (s.ct) {
            var cr = ranked(s.ct.skor);
            var p = byId(cfg.ct.pilar, cr[cr.length - 1].id);
            plan.push("Latihan " + p.nama + ": " + p.latihan);
        }

        if (s.kesiapan && s.kesiapan.prioritas && s.kesiapan.prioritas.length) {
            plan.push("Ulang topik " + join(s.kesiapan.prioritas.slice(0, 2)) + ", lalu kerjakan 5 soal untuk tiap topik.");
        }

        if (s.minat) {
            plan.push("Cari tahu satu prodi dari rumpun " + rumpunLabel(s.minat.rumpunTop) + ", lalu baca mata kuliah dan syarat seleksinya di situs resmi SNPMB.");
        }

        return plan;

    }

    function renderSummary() {

        var s = loadStore();
        var any = MODS.some(function (m) { return !!s[m.key]; });

        $("pbSummary").hidden = !any;

        if (!any || !cfg) return;

        var rows = summaryRows(s).map(function (r) {
            return "<div class=\"pb-sum-row\"><span class=\"pb-sum-k\">" + esc(r[0]) + "</span><span class=\"pb-sum-v\">" + esc(r[1]) + "</span></div>";
        }).join("");

        var plan = weeklyPlan(s);
        var planHtml = plan.length
            ? "<h3 class=\"pb-h3\">Rencana belajar minggu ini</h3><ol>" + plan.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol>"
            : "";

        $("pbSummaryBody").innerHTML = "<div class=\"pb-res\">" + rows + planHtml + "</div>";

    }

    /* ---------- mengerjakan modul ---------- */

    function startModule(key) {

        state.mod = key;
        state.page = 0;
        state.answers = {};
        state.kelas = "";

        var m = modOf(key);

        $("pbRunTitle").textContent = m.judul;
        $("pbError").hidden = true;

        if (key === "kesiapan") {
            $("pbRunSub").textContent = "Pilih kelasmu, lalu nilai seberapa paham kamu pada tiap topik " + cfg.kesiapan.mapel + ".";
            $("pbProgressWrap").hidden = true;
            $("pbProgressText").textContent = "";
            $("pbNext").textContent = "Lihat hasil";
        } else {
            $("pbRunSub").textContent = "Pilih seberapa sesuai tiap pernyataan dengan dirimu saat ini.";
            $("pbProgressWrap").hidden = false;
        }

        renderPage();
        show("run");

    }

    function butirOf(key) {

        return cfg[key === "gaya" ? "gaya" : key === "minat" ? "minat" : key === "ct" ? "ct" : "kebiasaan"].butir;

    }

    function totalPages(key) {

        return Math.ceil(butirOf(key).length / PER_PAGE);

    }

    function radioGroup(name, scale, checked) {

        return "<div class=\"pb-opts\" role=\"radiogroup\">" + scale.map(function (o) {
            return "<label class=\"pb-opt\"><input type=\"radio\" name=\"" + name + "\" value=\"" + o.v + "\""
                + (Number(checked) === o.v ? " checked" : "") + "><span>" + esc(o.label) + "</span></label>";
        }).join("") + "</div>";

    }

    function renderPage() {

        var key = state.mod;
        var body = $("pbRunBody");

        $("pbError").hidden = true;

        if (key === "kesiapan") {
            renderKesiapanForm(body);
            $("pbBack").textContent = "Kembali";
            return;
        }

        var butir = butirOf(key);
        var tp = totalPages(key);
        var from = state.page * PER_PAGE;
        var to = Math.min(from + PER_PAGE, butir.length);
        var html = "";

        for (var i = from; i < to; i++) {

            html += "<fieldset class=\"pb-q\"><legend>Pernyataan " + (i + 1) + " dari " + butir.length + "</legend>"
                + "<p class=\"pb-q-text\">" + esc(butir[i].t) + "</p>"
                + radioGroup("q" + i, cfg.skala, state.answers[i])
                + "</fieldset>";

        }

        body.innerHTML = html;

        var done = Object.keys(state.answers).length;

        $("pbProgress").style.width = Math.round((done / butir.length) * 100) + "%";
        $("pbProgressText").textContent = "Halaman " + (state.page + 1) + " dari " + tp + " · terjawab " + done + " dari " + butir.length;
        $("pbNext").textContent = state.page === tp - 1 ? "Lihat hasil" : "Lanjut";
        $("pbBack").textContent = state.page === 0 ? "Batal" : "Sebelumnya";

    }

    function renderKesiapanForm(body) {

        var k = cfg.kesiapan;
        var opts = ["<option value=\"\">Pilih kelas</option>"].concat(["X", "XI", "XII"].map(function (c) {
            return "<option value=\"" + c + "\"" + (state.kelas === c ? " selected" : "") + ">Kelas " + c + "</option>";
        })).join("");

        var html = "<div class=\"pb-panel\"><label class=\"pb-label\" for=\"pbKelas\">Kelasmu</label>"
            + "<select class=\"pb-select\" id=\"pbKelas\">" + opts + "</select>"
            + "<p class=\"pb-sub\">" + esc(k.catatan) + "</p><div id=\"pbTopics\"></div></div>";

        body.innerHTML = html;
        renderTopics();

    }

    function renderTopics() {

        var k = cfg.kesiapan;
        var box = $("pbTopics");

        if (!box) return;

        if (!state.kelas) {
            box.innerHTML = "";
            return;
        }

        var list = k.topik[state.kelas] || [];

        box.innerHTML = list.map(function (t, i) {
            return "<div class=\"pb-topic\"><p class=\"pb-topic-name\">" + esc(t) + "</p>"
                + radioGroup("t" + i, k.skala, state.answers[i]) + "</div>";
        }).join("");

    }

    function readRadios() {

        var inputs = document.querySelectorAll("#pbRunBody input[type=radio]:checked");

        Array.prototype.forEach.call(inputs, function (el) {

            var name = el.name;
            var idx = Number(name.slice(1));

            state.answers[idx] = Number(el.value);

        });

    }

    function showError(msg) {

        var e = $("pbError");

        e.textContent = msg;
        e.hidden = false;

        try { e.scrollIntoView({ block: "center" }); } catch (x) { /* abaikan */ }

    }

    function onNext() {

        readRadios();

        var key = state.mod;

        if (key === "kesiapan") {

            if (!state.kelas) { showError("Pilih kelasmu dulu."); return; }

            var list = cfg.kesiapan.topik[state.kelas] || [];

            for (var j = 0; j < list.length; j++) {
                if (!state.answers[j]) { showError("Nilai dulu topik \"" + list[j] + "\" ya."); return; }
            }

            finishKesiapan();
            return;

        }

        var butir = butirOf(key);
        var from = state.page * PER_PAGE;
        var to = Math.min(from + PER_PAGE, butir.length);

        for (var i = from; i < to; i++) {
            if (!state.answers[i]) { showError("Masih ada pernyataan yang belum dijawab di halaman ini."); return; }
        }

        if (state.page < totalPages(key) - 1) {
            state.page++;
            renderPage();
            try { window.scrollTo(0, 0); } catch (e) { /* abaikan */ }
            return;
        }

        finishQuiz();

    }

    function onBack() {

        readRadios();

        if (state.mod !== "kesiapan" && state.page > 0) {
            state.page--;
            renderPage();
            return;
        }

        renderHub();
        show("hub");

    }

    /* ---------- menyimpan hasil ---------- */

    function finishQuiz() {

        var key = state.mod;
        var skor = scoreDims(butirOf(key), state.answers);
        var data = { skor: skor };

        if (key === "minat") {
            data.rumpunTop = rumpunRank(skor)[0].id;
        }

        saveModule(key, data);
        showResult(key);

    }

    function finishKesiapan() {

        var list = cfg.kesiapan.topik[state.kelas];
        var sum = 0;
        var prioritas = [];
        var rincian = [];

        list.forEach(function (t, i) {

            var v = state.answers[i];

            sum += v;
            rincian.push(v);

            if (v <= 2) prioritas.push(t);

        });

        saveModule("kesiapan", {
            kelas: state.kelas,
            pct: pct(sum, list.length),
            rincian: rincian,
            prioritas: prioritas
        });

        showResult("kesiapan");

    }

    /* ---------- hasil ---------- */

    function bars(rank, nameOf, topN) {

        return "<ul class=\"pb-bars\">" + rank.map(function (r, i) {
            return "<li class=\"pb-bar" + (i < topN ? " pb-bar--top" : "") + "\">"
                + "<span class=\"pb-bar-name\">" + esc(nameOf(r.id)) + "</span>"
                + "<span class=\"pb-bar-track\"><span class=\"pb-bar-fill\" style=\"width:" + round(r.v) + "%\"></span></span>"
                + "<span class=\"pb-bar-v\">" + round(r.v) + "%</span></li>";
        }).join("") + "</ul>";

    }

    function list(items) {

        return "<ul>" + items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";

    }

    function resultGaya(s) {

        var rank = ranked(s.skor);
        var merata = isMerata(rank);
        var top = rank.slice(0, merata ? 3 : 2);
        var d1 = byId(cfg.gaya.dimensi, top[0].id);
        var html = "";

        html += "<div class=\"pb-res\"><div class=\"pb-top\"><span class=\"pb-top-ico\" aria-hidden=\"true\">" + d1.ikon + "</span><div>"
            + "<div class=\"pb-top-sub\">" + (merata ? "Profil merata" : "Kecenderungan utama") + "</div>"
            + "<div class=\"pb-top-name\">" + esc(join(top.map(function (r) { return byId(cfg.gaya.dimensi, r.id).nama; }))) + "</div></div></div>";

        if (merata) {
            html += "<p class=\"pb-note\">Skor tiga teratasmu berdekatan, artinya kamu fleksibel dan bisa memakai banyak cara. Coba satu per satu untuk melihat mana yang terasa paling efektif.</p>";
        } else {
            html += "<p>" + esc(d1.ringkas) + "</p>";
        }

        html += bars(rank, function (id) { return byId(cfg.gaya.dimensi, id).nama; }, top.length) + "</div>";

        top.forEach(function (r, idx) {

            var d = byId(cfg.gaya.dimensi, r.id);

            html += "<div class=\"pb-res\"><h3 class=\"pb-h3\" style=\"margin-top:0\">" + d.ikon + " " + esc(d.nama) + "</h3>"
                + "<p><b>Kekuatan:</b> " + esc(d.kuat) + "</p>"
                + "<p><b>Hal yang perlu diwaspadai:</b> " + esc(d.tantangan) + "</p>"
                + "<p><b>Cara mencobanya:</b></p>" + list(idx === 0 ? d.strategi : d.strategi.slice(0, 2)) + "</div>";

        });

        html += "<p class=\"pb-note\">Gaya belajar bukan label tetap. Pakai ini sebagai ide untuk mencoba, dan gabungkan beberapa cara sesuai materi.</p>";

        return html;

    }

    function tkaSaran(rumpunId) {

        var tka = rsCfg && rsCfg.tka;

        if (!tka || !tka.rekomendasi_rumpun || !tka.rekomendasi_rumpun[rumpunId]) return "";

        return "<p><b>Mata uji pilihan TKA yang umum dipilih:</b> " + esc(tka.rekomendasi_rumpun[rumpunId].join(", ")) + ". Ini contoh umum, cek ketentuan resmi dan pastikan mapelnya ada di rapormu.</p>";

    }

    function resultMinat(s) {

        var rank = ranked(s.skor);
        var top3 = rank.slice(0, 3);
        var code = top3.map(function (r) { return r.id; }).join("");
        var rr = rumpunRank(s.skor);
        var html = "";

        html += "<div class=\"pb-res\"><div class=\"pb-top\"><span class=\"pb-top-ico\" aria-hidden=\"true\">🧭</span><div>"
            + "<div class=\"pb-top-sub\">Kode minat (tiga teratas)</div>"
            + "<div class=\"pb-top-name\">" + esc(code) + "</div></div></div>";

        html += "<p>" + top3.map(function (r) {
            var t = byId(cfg.minat.tipe, r.id);
            return "<span class=\"pb-tag\">" + t.ikon + " " + esc(t.nama) + "</span>";
        }).join("") + "</p>";

        html += bars(rank, function (id) { return byId(cfg.minat.tipe, id).nama; }, 3) + "</div>";

        top3.forEach(function (r) {

            var t = byId(cfg.minat.tipe, r.id);

            html += "<div class=\"pb-res\"><h3 class=\"pb-h3\" style=\"margin-top:0\">" + t.ikon + " " + esc(t.nama) + "</h3>"
                + "<p>" + esc(t.ringkas) + "</p><p><b>Bidang yang sering sejalan:</b></p>" + list(t.bidang) + "</div>";

        });

        html += "<div class=\"pb-res\"><h3 class=\"pb-h3\" style=\"margin-top:0\">Rumpun SNBP yang paling sejalan</h3>";

        rr.slice(0, 2).forEach(function (r, i) {

            html += "<p><b>" + (i + 1) + ". " + esc(rumpunLabel(r.id)) + "</b><br>"
                + esc((cfg.minat.rumpun_contoh || {})[r.id] || "") + "</p>" + (i === 0 ? tkaSaran(r.id) : "");

        });

        html += "<p>Rumpun pertama akan terisi otomatis di <a class=\"pb-link\" href=\"/pages/rasionalisasi.html\">Rasionalisasi SNBP</a>.</p></div>";

        html += "<p class=\"pb-note\">Ini gambaran minat saat ini, bukan penentu jurusan. Minat bisa berkembang, jadi gali lebih jauh lewat guru BK, alumni, dan informasi resmi prodi.</p>";

        return html;

    }

    function alatFor(pilarId, gayaSkor) {

        if (!gayaSkor) return [];

        var rank = ranked(gayaSkor).slice(0, 2);
        var map = cfg.ct.alat[pilarId] || {};

        return rank.map(function (r) { return map[r.id]; }).filter(Boolean);

    }

    function ctText(p, alat) {

        var t = cfg.ct.templat;

        if (alat.length < 2) {
            t = t.replace(/ Cara yang cocok denganmu:.*$/, "");
        }

        return t
            .replace("{ringkas}", p.ringkas)
            .replace("{latihan}", p.latihan)
            .replace("{alat1}", alat[0] || "")
            .replace("{alat2}", alat[1] || "");

    }

    function resultCT(s) {

        var rank = ranked(s.skor);
        var gaya = loadStore().gaya;
        var gs = gaya ? gaya.skor : null;
        var html = "<div class=\"pb-res\"><p>Computational Thinking (CT) adalah cara berpikir sistematis untuk memecahkan masalah. Skor di bawah adalah penilaian dirimu, bukan nilai ujian.</p>"
            + bars(rank, function (id) { return byId(cfg.ct.pilar, id).nama + " (" + levelCT(s.skor[id]) + ")"; }, 1) + "</div>";

        var focus = rank.slice().reverse().slice(0, 2);

        focus.forEach(function (r) {

            var p = byId(cfg.ct.pilar, r.id);

            html += "<div class=\"pb-res\"><h3 class=\"pb-h3\" style=\"margin-top:0\">" + p.ikon + " Latih " + esc(p.nama) + "</h3><p>" + esc(ctText(p, alatFor(p.id, gs))) + "</p></div>";

        });

        var best = byId(cfg.ct.pilar, rank[0].id);

        html += "<p class=\"pb-note\">Kekuatan CT-mu ada di " + esc(best.nama) + ". Manfaatkan untuk membantu pilar lain.</p>";

        if (!gs) {
            html += "<p class=\"pb-note\">Isi juga modul <b>Cara Belajar</b> supaya saran latihan disesuaikan dengan gaya belajarmu.</p>";
        }

        return html;

    }

    function resultKebiasaan(s) {

        var rank = ranked(s.skor);
        var html = "<div class=\"pb-res\">" + bars(rank, function (id) { return byId(cfg.kebiasaan.dimensi, id).nama; }, 1) + "</div>";
        var best = byId(cfg.kebiasaan.dimensi, rank[0].id);

        html += "<div class=\"pb-res\"><h3 class=\"pb-h3\" style=\"margin-top:0\">" + best.ikon + " Kekuatanmu: " + esc(best.nama) + "</h3><p>" + esc(best.tinggi) + "</p></div>";

        rank.slice().reverse().slice(0, 2).forEach(function (r) {

            var d = byId(cfg.kebiasaan.dimensi, r.id);

            html += "<div class=\"pb-res\"><h3 class=\"pb-h3\" style=\"margin-top:0\">" + d.ikon + " Perlu perhatian: " + esc(d.nama) + "</h3>"
                + "<p>" + esc(d.rendah) + "</p><p><b>Coba:</b></p>" + list(d.tips) + "</div>";

        });

        return html;

    }

    function resultKesiapan(s) {

        var tier = kesiapanTier(s.pct);
        var topik = cfg.kesiapan.topik[s.kelas] || [];
        var rank = topik.map(function (t, i) { return { id: String(i), v: pct(s.rincian[i], 1) }; });

        var html = "<div class=\"pb-res\"><div class=\"pb-top\"><span class=\"pb-top-ico\" aria-hidden=\"true\">🧱</span><div>"
            + "<div class=\"pb-top-sub\">Kelas " + esc(s.kelas) + " · " + esc(cfg.kesiapan.mapel) + "</div>"
            + "<div class=\"pb-top-name\">" + esc(tier.label) + " (" + round(s.pct) + "%)</div></div></div>"
            + "<p>" + esc(tier.saran) + "</p>"
            + bars(rank, function (id) { return topik[Number(id)]; }, 0) + "</div>";

        if (s.prioritas && s.prioritas.length) {
            html += "<div class=\"pb-res\"><h3 class=\"pb-h3\" style=\"margin-top:0\">Topik yang perlu diulang dulu</h3>" + list(s.prioritas) + "</div>";
        } else {
            html += "<p class=\"pb-note\">Semua topik kamu nilai cukup paham atau lebih. Coba soal penalaran yang lebih menantang.</p>";
        }

        return html;

    }

    function showResult(key) {

        var s = loadStore()[key];
        var m = modOf(key);
        var map = {
            gaya: resultGaya,
            minat: resultMinat,
            ct: resultCT,
            kebiasaan: resultKebiasaan,
            kesiapan: resultKesiapan
        };

        state.mod = key;

        $("pbResultTitle").textContent = "Hasil: " + m.judul;
        $("pbResultBody").innerHTML = map[key](s);

        show("result");

    }

    /* ---------- cetak / simpan PDF ---------- */

    // Menyusun lembar rekap lengkap (ringkasan, rencana, dan hasil tiap
    // modul) lalu memanggil dialog cetak browser; siswa/guru bisa memilih
    // "Simpan sebagai PDF". Tidak ada yang dikirim ke server.
    function printAll() {

        var s = loadStore();
        var map = { kesiapan: resultKesiapan, gaya: resultGaya, minat: resultMinat, ct: resultCT, kebiasaan: resultKebiasaan };
        var tgl = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
        var rows = summaryRows(s).map(function (r) {
            return "<div class=\"pb-sum-row\"><span class=\"pb-sum-k\">" + esc(r[0]) + "</span><span class=\"pb-sum-v\">" + esc(r[1]) + "</span></div>";
        }).join("");
        var plan = weeklyPlan(s);
        var html = "<div class=\"pb-print-head\"><h1>Profil Belajar</h1><p>SMAN 1 Sooko Mojokerto · dicetak " + esc(tgl) + "</p>"
            + "<div class=\"pb-print-id\"><span>Nama:</span><span>Kelas:</span></div></div>"
            + "<div class=\"pb-res\"><h3 class=\"pb-h3\" style=\"margin-top:0\">Ringkasan</h3>" + rows + "</div>";

        if (plan.length) {
            html += "<div class=\"pb-res\"><h3 class=\"pb-h3\" style=\"margin-top:0\">Rencana belajar minggu ini</h3><ol>"
                + plan.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol></div>";
        }

        MODS.forEach(function (m) {
            if (s[m.key]) html += "<h2 class=\"pb-h2\" style=\"margin-top:1.2rem\">" + esc(m.judul) + "</h2>" + map[m.key](s[m.key]);
        });

        html += "<p class=\"pb-fine\">Refleksi diri pribadi, bukan tes psikologi dan bukan penentu jurusan. Preferensi bersifat campuran dan bisa berubah.</p>";

        $("pbPrint").innerHTML = html;
        document.body.classList.add("pb-printing");

        var cleanup = function () {
            document.body.classList.remove("pb-printing");
            window.removeEventListener("afterprint", cleanup);
        };

        window.addEventListener("afterprint", cleanup);
        window.print();

    }

    /* ---------- kartu PNG ---------- */

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

    function drawCard() {

        var s = loadStore();
        var rows = summaryRows(s);
        var plan = weeklyPlan(s);
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

        ctx.fillStyle = "rgba(255,255,255,0.96)";
        roundRectPath(ctx, pad, 230, W - pad * 2, H - 230 - pad, 28);
        ctx.fill();

        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 28px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("SMAN 1 Sooko Mojokerto", W / 2, 88);

        ctx.font = "800 46px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Kartu Profil Belajar", W / 2, 146);

        ctx.font = "600 22px 'Plus Jakarta Sans', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,.85)";
        ctx.fillText("Refleksi diri pribadi · bukan tes psikologi", W / 2, 188);

        ctx.textAlign = "left";

        var x = pad + 40;
        var maxW = W - pad * 2 - 80;
        var y = 300;

        rows.forEach(function (r) {

            ctx.font = "700 20px 'Plus Jakarta Sans', sans-serif";
            ctx.fillStyle = "#55657d";
            ctx.fillText(r[0], x, y);
            y += 34;

            ctx.font = "800 26px 'Plus Jakarta Sans', sans-serif";
            ctx.fillStyle = "#14233a";

            wrapTextLines(ctx, r[1], maxW).forEach(function (ln) {
                ctx.fillText(ln, x, y);
                y += 34;
            });

            y += 16;

        });

        if (plan.length) {

            y += 8;
            ctx.font = "800 24px 'Plus Jakarta Sans', sans-serif";
            ctx.fillStyle = "#0f4c81";
            ctx.fillText("Rencana belajar minggu ini", x, y);
            y += 38;

            ctx.font = "600 20px 'Plus Jakarta Sans', sans-serif";
            ctx.fillStyle = "#14233a";

            plan.forEach(function (t, i) {

                wrapTextLines(ctx, (i + 1) + ". " + t, maxW).forEach(function (ln) {
                    if (y < H - pad - 70) ctx.fillText(ln, x, y);
                    y += 28;
                });

                y += 8;

            });

        }

        ctx.font = "600 18px 'Plus Jakarta Sans', sans-serif";
        ctx.fillStyle = "#55657d";
        ctx.fillText("Preferensi bersifat campuran dan bisa berubah. Dibuat di browser, tidak dikirim ke server.", x, H - pad - 28);

        return canvas;

    }

    function downloadCard() {

        var go = function () {

            var canvas = drawCard();
            var a = document.createElement("a");

            a.download = "kartu-profil-belajar.png";
            a.href = canvas.toDataURL("image/png");
            document.body.appendChild(a);
            a.click();
            a.remove();

        };

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(go, go);
        } else {
            go();
        }

    }

    /* ---------- event ---------- */

    function bind() {

        $("pbMods").addEventListener("click", function (e) {

            var btn = e.target.closest ? e.target.closest("[data-mod]") : null;

            if (!btn) return;

            var key = btn.getAttribute("data-mod");
            var s = loadStore();

            if (s[key]) {
                showResult(key);
            } else {
                startModule(key);
            }

        });

        $("pbRunBody").addEventListener("change", function (e) {

            if (e.target.id === "pbKelas") {
                readRadios();
                state.kelas = e.target.value;
                state.answers = {};
                renderTopics();
            }

        });

        $("pbNext").addEventListener("click", onNext);
        $("pbBack").addEventListener("click", onBack);

        $("pbUlang").addEventListener("click", function () { startModule(state.mod); });

        $("pbKeHub").addEventListener("click", function () {
            renderHub();
            show("hub");
        });

        $("pbUnduh").addEventListener("click", downloadCard);
        $("pbCetak").addEventListener("click", printAll);

        $("pbHapus").addEventListener("click", function () {

            if (!window.confirm("Hapus semua hasil Profil Belajar di browser ini? Tindakan ini tidak bisa dibatalkan.")) return;

            try { localStorage.removeItem(STORE_KEY); } catch (e) { /* abaikan */ }

            renderHub();

        });

    }

    function fetchJson(url) {

        return fetch(url, { cache: "no-cache" }).then(function (res) {
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.json();
        });

    }

    function init() {

        bind();

        // Konfigurasi rasionalisasi hanya dipakai untuk saran mapel pilihan
        // TKA dan nama rumpun; kalau gagal dimuat, halaman tetap jalan.
        fetchJson(RS_URL).then(function (d) { rsCfg = d; renderSummary(); }, function () { rsCfg = null; });

        fetchJson(CFG_URL).then(function (d) {
            cfg = d;
            renderHub();
        }, function () {
            cfg = null;
            renderHub();
        });

    }

    init();

})();
