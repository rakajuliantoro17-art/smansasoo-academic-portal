/*
==========================================================
SMANSASOO Academic Portal
Profil Belajar (pages/profil-belajar.html)
Version : 2.0.0
==========================================================
Alat refleksi diri untuk mendukung pembelajaran berdiferensiasi
(kesiapan, minat, profil belajar). Semua butir, bobot, ambang,
dan teks saran ada di data/profil-belajar.json -- guru bisa
mengubahnya tanpa menyentuh berkas ini.

Alur (v2): SATU rangkaian tes yang menggabungkan lima topik,
dijawab lewat slider 5 tingkat, lalu dianalisis per topik:
  kesiapan  : pemahaman topik Matematika per kelas
  gaya      : 9 gaya belajar (kecenderungan campuran)
  minat     : minat karier model RIASEC -> rumpun SNBP
  ct        : Computational Thinking (4 pilar) + cara yang cocok
              dengan gaya belajar
  kebiasaan : motivasi, waktu, fokus, refleksi

Butir dari kelima topik diselang-seling (proporsional) agar
terasa satu kesatuan. Hasil akhir: "Arah potensialmu" (sintesis
berbasis aturan) + kartu hasil tiap topik beserta rekomendasinya.
Seluruh saran berbasis aturan (tanpa AI/LLM).

Data TIDAK dikirim ke server: hanya persentase per dimensi yang
disimpan di localStorage (STORE_KEY); jawaban yang belum selesai
disimpan sebagai draf (DRAFT_KEY) dan dihapus saat selesai.
STORE_KEY juga dibaca js/rasionalisasi.js untuk mengisi rumpun.
==========================================================
*/

(function () {

    "use strict";

    var CFG_URL = "/data/profil-belajar.json";
    var RS_URL = "/data/rasionalisasi.json";
    var STORE_KEY = "smansasoo_profil_belajar";
    var DRAFT_KEY = "smansasoo_profil_belajar_draft";
    var PER_PAGE = 8;
    var TOPICS = ["kesiapan", "gaya", "minat", "ct", "kebiasaan"];

    var cfg = null;
    var rsCfg = null;

    var state = {
        kelas: "",
        page: 0,
        answers: {},
        items: []
    };

    var $ = function (id) { return document.getElementById(id); };

    /* ---------- util ---------- */

    function esc(s) {

        return String(s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
        });

    }

    function join(list) {

        if (list.length <= 1) return list.join("");
        return list.slice(0, -1).join(", ") + " dan " + list[list.length - 1];

    }

    function round(n) { return Math.round(n); }

    function levels() { return cfg.skala.length; }

    function info(key) { return cfg.topik_info[key]; }

    function byId(list, id) {

        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) return list[i];
        }

        return null;

    }

    /* ---------- penyimpanan lokal ---------- */

    function readJson(key) {

        try {
            var raw = localStorage.getItem(key);
            var obj = raw ? JSON.parse(raw) : {};
            return (obj && typeof obj === "object") ? obj : {};
        } catch (e) {
            return {};
        }

    }

    function writeJson(key, obj) {

        try {
            localStorage.setItem(key, JSON.stringify(obj));
            return true;
        } catch (e) {
            return false;
        }

    }

    function removeKey(key) {

        try { localStorage.removeItem(key); } catch (e) { /* abaikan */ }

    }

    function loadStore() { return readJson(STORE_KEY); }

    function storeComplete(s) {

        return TOPICS.every(function (k) { return !!s[k]; });

    }

    function loadDraft() {

        var d = readJson(DRAFT_KEY);

        return (d && typeof d.answers === "object" && d.answers) ? d : null;

    }

    function saveDraft() {

        writeJson(DRAFT_KEY, { kelas: state.kelas, page: state.page, answers: state.answers });

    }

    /* ---------- butir: satu rangkaian terpadu ---------- */

    function kesiapanTopik(kelas) {

        return (cfg.kesiapan.topik[kelas] || []).slice();

    }

    // Menggabungkan butir kelima topik. Butir ke-k dari topik berisi n
    // butir diberi posisi (k+0.5)/n, lalu diurutkan, sehingga topik
    // terselang-seling secara proporsional (satu kesatuan utuh).
    function buildItems(kelas) {

        var items = [];
        var order = 0;

        ["gaya", "minat", "ct", "kebiasaan"].forEach(function (m) {

            var butir = cfg[m].butir;

            butir.forEach(function (b, i) {
                items.push({ key: m + ":" + i, m: m, d: b.d, t: b.t, pos: (i + 0.5) / butir.length, ord: order });
            });

            order++;

        });

        var topik = kesiapanTopik(kelas);

        topik.forEach(function (t, i) {
            items.push({
                key: "kesiapan:" + i,
                m: "kesiapan",
                d: String(i),
                t: cfg.kesiapan.pernyataan.replace("{topik}", t),
                pos: (i + 0.5) / topik.length,
                ord: order
            });
        });

        items.sort(function (a, b) { return (a.pos - b.pos) || (a.ord - b.ord); });

        return items;

    }

    function validAnswers(items, answers) {

        var out = {};
        var L = levels();

        items.forEach(function (it) {

            var v = Number(answers[it.key]);

            if (answers[it.key] !== undefined && v >= 1 && v <= L && Math.floor(v) === v) out[it.key] = v;

        });

        return out;

    }

    /* ---------- skor ---------- */

    // persen 0-100 dari jumlah jawaban (skala 1..L) pada n butir
    function pctOf(sum, n) {

        return ((sum - n) / ((levels() - 1) * n)) * 100;

    }

    function scoreModule(m) {

        var sum = {};
        var cnt = {};

        state.items.forEach(function (it) {

            if (it.m !== m) return;

            sum[it.d] = (sum[it.d] || 0) + state.answers[it.key];
            cnt[it.d] = (cnt[it.d] || 0) + 1;

        });

        var out = {};

        Object.keys(sum).forEach(function (d) { out[d] = pctOf(sum[d], cnt[d]); });

        return out;

    }

    function ranked(scores) {

        return Object.keys(scores).map(function (id) {
            return { id: id, v: scores[id] };
        }).sort(function (a, b) { return b.v - a.v; });

    }

    function avg(scores) {

        var k = Object.keys(scores);

        return k.reduce(function (a, id) { return a + scores[id]; }, 0) / k.length;

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

        var r = byId((rsCfg && rsCfg.rumpun_minat) || [], id);

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

    // kelas status untuk skor rata-rata: kurang / sedang / baik
    function band(v) { return v < 40 ? "kurang" : (v < 70 ? "sedang" : "baik"); }

    function levelCT(v) { return { kurang: "perlu dilatih", sedang: "berkembang", baik: "kuat" }[band(v)]; }

    function kesiapanTier(p) {

        var t = cfg.kesiapan.tingkat;

        for (var i = 0; i < t.length; i++) {
            if (p < t[i].maks) return t[i];
        }

        return t[t.length - 1];

    }

    /* ---------- layar ---------- */

    function show(which) {

        $("pbStart").hidden = which !== "start";
        $("pbRun").hidden = which !== "run";
        $("pbResult").hidden = which !== "result";

        var heading = which === "start" ? $("pbStartTitle") : (which === "run" ? $("pbRunTitle") : $("pbResultTitle"));

        try { window.scrollTo(0, 0); } catch (e) { /* abaikan */ }
        if (heading && heading.focus) heading.focus();

    }

    /* ---------- layar mulai ---------- */

    function renderStart() {

        var box = $("pbTopics");

        if (!cfg) {
            box.innerHTML = "<div class=\"pb-error\">Data profil belajar belum bisa dimuat. Coba muat ulang halaman.</div>";
            $("pbMulai").disabled = true;
            return;
        }

        $("pbMulai").disabled = false;

        box.innerHTML = TOPICS.map(function (k) {

            var n = k === "kesiapan" ? "±" + (cfg.kesiapan.topik.XI || []).length : String(cfg[k].butir.length);

            return "<div class=\"pb-sum-card\"><span class=\"ico\" aria-hidden=\"true\">" + info(k).ikon + "</span>"
                + "<strong>" + esc(info(k).judul) + "</strong><span>" + esc(info(k).tanya) + " (" + n + " pernyataan)</span></div>";

        }).join("");

        var s = loadStore();
        var d = loadDraft();
        var kelas = (d && d.kelas) || (s.kesiapan && s.kesiapan.kelas) || "";
        var done = storeComplete(s);

        if (!$("pbKelas").value && kelas) $("pbKelas").value = kelas;

        $("pbLihat").hidden = !done;
        $("pbStartError").hidden = true;

        var hasDraft = !!d && Object.keys(d.answers).length > 0;

        if (hasDraft) {
            $("pbMulai").textContent = "Lanjutkan tes";
            $("pbStartInfo").textContent = "Ada " + Object.keys(d.answers).length + " jawaban tersimpan di browser ini. Kamu bisa melanjutkan dari halaman terakhir.";
        } else {
            $("pbMulai").textContent = done ? "Ulangi tes" : "Mulai tes";
            $("pbStartInfo").textContent = done ? "Hasil terakhirmu masih tersimpan di browser ini." : "Perkiraan waktu 10 sampai 15 menit. Jawabanmu tersimpan otomatis kalau halaman tertutup.";
        }

    }

    function onMulai() {

        var kelas = $("pbKelas").value;

        if (!kelas) {
            $("pbStartError").textContent = "Pilih kelasmu dulu, karena topik kesiapan Matematika berbeda tiap kelas.";
            $("pbStartError").hidden = false;
            return;
        }

        state.kelas = kelas;
        state.items = buildItems(kelas);
        state.page = 0;
        state.answers = {};

        var d = loadDraft();

        if (d && Object.keys(d.answers).length) {

            var ans = d.answers;

            // ganti kelas: jawaban kesiapan milik kelas lain dibuang
            if (d.kelas !== kelas) {
                ans = {};
                Object.keys(d.answers).forEach(function (k) {
                    if (k.indexOf("kesiapan:") !== 0) ans[k] = d.answers[k];
                });
            }

            state.answers = validAnswers(state.items, ans);
            state.page = Math.min(Math.max(Number(d.page) || 0, 0), totalPages() - 1);

        } else {
            removeKey(DRAFT_KEY);
        }

        saveDraft();
        renderPage();
        show("run");

    }

    /* ---------- mengerjakan tes ---------- */

    function totalPages() { return Math.ceil(state.items.length / PER_PAGE); }

    function answeredCount() { return Object.keys(state.answers).length; }

    function sliderHtml(it, n, total) {

        var L = levels();
        var v = state.answers[it.key];
        var has = v !== undefined;
        var mid = Math.ceil(L / 2);
        var cur = has ? v : mid;
        var label = has ? cfg.skala[cur - 1].label : "Geser untuk menjawab";
        var fill = ((cur - 1) / (L - 1)) * 100;
        var ticks = "";

        for (var i = 0; i < L; i++) ticks += "<i></i>";

        return "<div class=\"pb-card pb-q" + (has ? " is-answered" : "") + "\" role=\"group\" aria-labelledby=\"qt" + n + "\" data-qkey=\"" + it.key + "\">"
            + "<span class=\"pb-q-kode\">Pernyataan " + n + " dari " + total + "</span>"
            + "<p class=\"pb-q-text\" id=\"qt" + n + "\">" + esc(it.t) + "</p>"
            + "<div class=\"pb-slider" + (has ? "" : " is-empty") + "\" style=\"--fill:" + fill + "%\">"
            + "<input class=\"pb-range\" type=\"range\" min=\"1\" max=\"" + L + "\" step=\"1\" value=\"" + cur + "\" data-key=\"" + it.key + "\""
            + " aria-labelledby=\"qt" + n + "\" aria-valuetext=\"" + esc(has ? label : "Belum dijawab") + "\">"
            + "<div class=\"pb-ticks\" aria-hidden=\"true\">" + ticks + "</div>"
            + "<div class=\"pb-ends\" aria-hidden=\"true\"><span>" + esc(cfg.skala_ujung[0]) + "</span><span>" + esc(cfg.skala_ujung[1]) + "</span></div>"
            + "<div class=\"pb-val\" aria-live=\"polite\">" + esc(label) + "</div>"
            + "</div></div>";

    }

    function renderPage() {

        var from = state.page * PER_PAGE;
        var to = Math.min(from + PER_PAGE, state.items.length);
        var html = "";

        $("pbError").hidden = true;

        for (var i = from; i < to; i++) {
            html += sliderHtml(state.items[i], i + 1, state.items.length);
        }

        $("pbRunBody").innerHTML = html;
        updateProgress();

        $("pbNext").textContent = state.page === totalPages() - 1 ? "Lihat hasil" : "Lanjut";
        $("pbBack").textContent = state.page === 0 ? "Batal" : "Sebelumnya";

    }

    function updateProgress() {

        var n = state.items.length;
        var done = answeredCount();

        $("pbProgress").style.width = Math.round((done / n) * 100) + "%";
        $("pbProgressText").textContent = "Halaman " + (state.page + 1) + " dari " + totalPages() + " · terjawab " + done + " dari " + n;

    }

    // dipanggil saat siswa menyentuh/menggeser slider
    function answer(input) {

        var key = input.getAttribute("data-key");
        var v = Number(input.value);
        var wrap = input.closest(".pb-slider");
        var card = input.closest(".pb-q");
        var L = levels();

        state.answers[key] = v;

        wrap.classList.remove("is-empty");
        wrap.style.setProperty("--fill", (((v - 1) / (L - 1)) * 100) + "%");
        wrap.querySelector(".pb-val").textContent = cfg.skala[v - 1].label;
        input.setAttribute("aria-valuetext", cfg.skala[v - 1].label);

        card.classList.add("is-answered");
        card.classList.remove("is-missing");

        updateProgress();
        saveDraft();

    }

    function showError(msg) {

        var e = $("pbError");

        e.textContent = msg;
        e.hidden = false;

    }

    function onNext() {

        var from = state.page * PER_PAGE;
        var to = Math.min(from + PER_PAGE, state.items.length);
        var first = null;

        for (var i = from; i < to; i++) {

            if (state.answers[state.items[i].key] === undefined) {

                var card = document.querySelector("[data-qkey=\"" + state.items[i].key + "\"]");

                if (card) {
                    card.classList.add("is-missing");
                    if (!first) first = card;
                }

            }

        }

        if (first) {
            showError("Masih ada pernyataan yang belum dijawab di halaman ini. Geser atau ketuk slidernya dulu ya.");
            try { first.scrollIntoView({ block: "center" }); } catch (e) { /* abaikan */ }
            return;
        }

        if (state.page < totalPages() - 1) {
            state.page++;
            saveDraft();
            renderPage();
            try { window.scrollTo(0, 0); } catch (e) { /* abaikan */ }
            return;
        }

        finish();

    }

    function onBack() {

        if (state.page > 0) {
            state.page--;
            saveDraft();
            renderPage();
            try { window.scrollTo(0, 0); } catch (e) { /* abaikan */ }
            return;
        }

        renderStart();
        show("start");

    }

    /* ---------- menyimpan hasil ---------- */

    function finish() {

        var s = {};

        s.gaya = { skor: scoreModule("gaya") };

        s.minat = { skor: scoreModule("minat") };
        s.minat.rumpunTop = rumpunRank(s.minat.skor)[0].id;

        s.ct = { skor: scoreModule("ct") };
        s.kebiasaan = { skor: scoreModule("kebiasaan") };

        var topik = kesiapanTopik(state.kelas);
        var rincian = topik.map(function (t, i) { return state.answers["kesiapan:" + i]; });
        var sum = rincian.reduce(function (a, v) { return a + v; }, 0);
        var maks = Math.max(1, Math.round(levels() / 2));
        var prioritas = [];

        rincian.forEach(function (v, i) { if (v <= maks - 1) prioritas.push(topik[i]); });

        // prioritas: jawaban di bawah tengah skala (mis. 1 atau 2 dari 5)
        s.kesiapan = { kelas: state.kelas, levels: levels(), pct: pctOf(sum, topik.length), rincian: rincian, prioritas: prioritas };

        var ts = new Date().toISOString();

        TOPICS.forEach(function (k) { s[k].ts = ts; });

        writeJson(STORE_KEY, s);
        removeKey(DRAFT_KEY);

        showResult();

    }

    /* ---------- komponen hasil ---------- */

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
        var html = "<div class=\"pb-res\"><div class=\"pb-top\"><span class=\"pb-top-ico\" aria-hidden=\"true\">" + d1.ikon + "</span><div>"
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

            html += "<div class=\"pb-res\"><h3 class=\"pb-h3\">" + d.ikon + " " + esc(d.nama) + "</h3>"
                + "<p><b>Kekuatan:</b> " + esc(d.kuat) + "</p>"
                + "<p><b>Hal yang perlu diwaspadai:</b> " + esc(d.tantangan) + "</p>"
                + "<p><b>Arah yang disarankan, coba:</b></p>" + list(idx === 0 ? d.strategi : d.strategi.slice(0, 2)) + "</div>";

        });

        return html + "<p class=\"pb-note\">Gaya belajar bukan label tetap. Pakai ini sebagai ide untuk mencoba, dan gabungkan beberapa cara sesuai materi.</p>";

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
        var html = "<div class=\"pb-res\"><div class=\"pb-top\"><span class=\"pb-top-ico\" aria-hidden=\"true\">🧭</span><div>"
            + "<div class=\"pb-top-sub\">Kode minat (tiga teratas)</div>"
            + "<div class=\"pb-top-name\">" + esc(code) + "</div></div></div>";

        html += "<p>" + top3.map(function (r) {
            var t = byId(cfg.minat.tipe, r.id);
            return "<span class=\"pb-tag\">" + t.ikon + " " + esc(t.nama) + "</span>";
        }).join("") + "</p>";

        html += bars(rank, function (id) { return byId(cfg.minat.tipe, id).nama; }, 3) + "</div>";

        top3.forEach(function (r) {

            var t = byId(cfg.minat.tipe, r.id);

            html += "<div class=\"pb-res\"><h3 class=\"pb-h3\">" + t.ikon + " " + esc(t.nama) + "</h3>"
                + "<p>" + esc(t.ringkas) + "</p><p><b>Bidang yang sering sejalan:</b></p>" + list(t.bidang) + "</div>";

        });

        html += "<div class=\"pb-res\"><h3 class=\"pb-h3\">Arah yang disarankan: rumpun SNBP paling sejalan</h3>";

        rr.slice(0, 2).forEach(function (r, i) {

            html += "<p><b>" + (i + 1) + ". " + esc(rumpunLabel(r.id)) + "</b><br>"
                + esc((cfg.minat.rumpun_contoh || {})[r.id] || "") + "</p>" + (i === 0 ? tkaSaran(r.id) : "");

        });

        html += "<p>Rumpun pertama akan terisi otomatis di <a class=\"pb-link\" href=\"/pages/rasionalisasi.html\">Rasionalisasi SNBP</a>.</p></div>";

        return html + "<p class=\"pb-note\">Ini gambaran minat saat ini, bukan penentu jurusan. Minat bisa berkembang, jadi gali lebih jauh lewat guru BK, alumni, dan informasi resmi prodi.</p>";

    }

    function alatFor(pilarId, gayaSkor) {

        if (!gayaSkor) return [];

        var map = cfg.ct.alat[pilarId] || {};

        return ranked(gayaSkor).slice(0, 2).map(function (r) { return map[r.id]; }).filter(Boolean);

    }

    function ctText(p, alat) {

        var t = cfg.ct.templat;

        if (alat.length < 2) t = t.replace(/ Cara yang cocok denganmu:.*$/, "");

        return t.replace("{ringkas}", p.ringkas).replace("{latihan}", p.latihan).replace("{alat1}", alat[0] || "").replace("{alat2}", alat[1] || "");

    }

    function resultCT(s) {

        var rank = ranked(s.skor);
        var gaya = loadStore().gaya;
        var gs = gaya ? gaya.skor : null;
        var html = "<div class=\"pb-res\"><p>Computational Thinking (CT) adalah cara berpikir sistematis untuk memecahkan masalah. Skor di bawah adalah penilaian dirimu, bukan nilai ujian.</p>"
            + bars(rank, function (id) { return byId(cfg.ct.pilar, id).nama + " (" + levelCT(s.skor[id]) + ")"; }, 1) + "</div>";

        rank.slice().reverse().slice(0, 2).forEach(function (r) {

            var p = byId(cfg.ct.pilar, r.id);

            html += "<div class=\"pb-res\"><h3 class=\"pb-h3\">" + p.ikon + " Arah latihan: " + esc(p.nama) + "</h3><p>" + esc(ctText(p, alatFor(p.id, gs))) + "</p></div>";

        });

        return html + "<p class=\"pb-note\">Kekuatan CT-mu ada di " + esc(byId(cfg.ct.pilar, rank[0].id).nama) + ". Manfaatkan untuk membantu pilar lain.</p>";

    }

    function resultKebiasaan(s) {

        var rank = ranked(s.skor);
        var html = "<div class=\"pb-res\">" + bars(rank, function (id) { return byId(cfg.kebiasaan.dimensi, id).nama; }, 1) + "</div>";
        var best = byId(cfg.kebiasaan.dimensi, rank[0].id);

        html += "<div class=\"pb-res\"><h3 class=\"pb-h3\">" + best.ikon + " Kekuatanmu: " + esc(best.nama) + "</h3><p>" + esc(best.tinggi) + "</p></div>";

        rank.slice().reverse().slice(0, 2).forEach(function (r) {

            var d = byId(cfg.kebiasaan.dimensi, r.id);

            html += "<div class=\"pb-res\"><h3 class=\"pb-h3\">" + d.ikon + " Perlu perhatian: " + esc(d.nama) + "</h3>"
                + "<p>" + esc(d.rendah) + "</p><p><b>Arah yang disarankan, coba:</b></p>" + list(d.tips) + "</div>";

        });

        return html;

    }

    function resultKesiapan(s) {

        var tier = kesiapanTier(s.pct);
        var L = s.levels || 4;
        var topik = cfg.kesiapan.topik[s.kelas] || [];
        var rank = topik.map(function (t, i) { return { id: String(i), v: ((s.rincian[i] - 1) / (L - 1)) * 100 }; });
        var html = "<div class=\"pb-res\"><div class=\"pb-top\"><span class=\"pb-top-ico\" aria-hidden=\"true\">🧱</span><div>"
            + "<div class=\"pb-top-sub\">Kelas " + esc(s.kelas) + " · " + esc(cfg.kesiapan.mapel) + "</div>"
            + "<div class=\"pb-top-name\">" + esc(tier.label) + " (" + round(s.pct) + "%)</div></div></div>"
            + "<p>" + esc(tier.saran) + "</p>"
            + bars(rank, function (id) { return topik[Number(id)]; }, 0) + "</div>";

        if (s.prioritas && s.prioritas.length) {
            html += "<div class=\"pb-res\"><h3 class=\"pb-h3\">Arah yang disarankan: ulang topik ini dulu</h3>" + list(s.prioritas) + "</div>";
        } else {
            html += "<p class=\"pb-note\">Semua topik kamu nilai cukup paham atau lebih. Coba soal penalaran yang lebih menantang.</p>";
        }

        return html;

    }

    var RENDER = { kesiapan: resultKesiapan, gaya: resultGaya, minat: resultMinat, ct: resultCT, kebiasaan: resultKebiasaan };

    // label status ringkas per topik: {teks, kelas}
    function chipOf(k, s) {

        if (k === "kesiapan") {
            var tier = kesiapanTier(s.kesiapan.pct);
            return { teks: tier.label, kelas: { dasar: "kurang", menengah: "sedang", lanjut: "baik" }[tier.id] || "netral" };
        }

        if (k === "gaya") {
            var gr = ranked(s.gaya.skor);
            return { teks: isMerata(gr) ? "Profil merata" : join(gr.slice(0, 2).map(function (r) { return byId(cfg.gaya.dimensi, r.id).nama; })), kelas: "netral" };
        }

        if (k === "minat") {
            return { teks: "Kode " + ranked(s.minat.skor).slice(0, 3).map(function (r) { return r.id; }).join(""), kelas: "netral" };
        }

        var a = avg(s[k].skor);
        var b = band(a);

        return { teks: (k === "ct" ? "CT " : "Kebiasaan ") + { kurang: "perlu dilatih", sedang: "berkembang", baik: "kuat" }[b], kelas: b };

    }

    /* ---------- sintesis: arah potensialmu ---------- */

    function weakest(scores) { var r = ranked(scores); return r[r.length - 1]; }

    function synthesis(s) {

        var rr = rumpunRank(s.minat.skor);
        var top = rr[0];
        var second = rr[1];
        var group = top.id.split("_")[0];
        var codes = ranked(s.minat.skor).slice(0, 3).map(function (r) { return byId(cfg.minat.tipe, r.id).nama.split(" (")[0]; });
        var ctAvg = avg(s.ct.skor);
        var kebAvg = avg(s.kebiasaan.skor);
        var gr = ranked(s.gaya.skor);
        var gayaTop = (isMerata(gr) ? gr.slice(0, 3) : gr.slice(0, 2)).map(function (r) { return byId(cfg.gaya.dimensi, r.id).nama; });
        var ctBest = byId(cfg.ct.pilar, ranked(s.ct.skor)[0].id);
        var ctWeak = byId(cfg.ct.pilar, weakest(s.ct.skor).id);
        var kebBest = byId(cfg.kebiasaan.dimensi, ranked(s.kebiasaan.skor)[0].id);
        var kebWeak = byId(cfg.kebiasaan.dimensi, weakest(s.kebiasaan.skor).id);
        var notes = [];

        if (group === "saintek" && ctAvg >= 65) notes.push("Kemampuan berpikir komputasimu cukup kuat dan sejalan dengan rumpun saintek. Manfaatkan lewat proyek, lomba, atau olimpiade bidang sains, matematika, atau informatika.");
        if (group === "saintek" && ctAvg < 40) notes.push("Rumpun saintek menuntut penalaran yang sistematis, jadi latih pilar " + ctWeak.nama + " secara rutin sebelum menargetkan prodi saintek.");
        if (group === "saintek" && s.kesiapan.pct < 40) notes.push("Dasar Matematikamu masih perlu diperkuat. Mulai dari topik prioritas sebelum mengambil mata uji pilihan tingkat lanjut.");
        if (group === "soshum" && ctAvg >= 65) notes.push("Kemampuan menyaring informasi dan menyusun langkah akan membantu analisis di bidang sosial, hukum, dan ekonomi.");
        if (group === "soshum" && s.kesiapan.pct < 40) notes.push("Matematika tetap dipakai di banyak prodi soshum (statistika, ekonomi). Kuatkan dasarnya lewat topik prioritas.");
        if (kebAvg < 40) notes.push("Apa pun rumpunnya, perbaiki kebiasaan belajar (terutama " + kebWeak.nama.toLowerCase() + ") supaya potensimu tidak tertahan.");

        if (!notes.length) notes.push("Profilmu cukup seimbang. Pertahankan kebiasaan yang sudah baik dan jelajahi prodi di rumpun pilihanmu.");

        var html = "<div class=\"pb-card pb-arah\"><span class=\"pb-eyebrow\">Arah potensialmu</span>"
            + "<h3 class=\"pb-h3\">" + esc(rumpunLabel(top.id)) + "</h3>"
            + "<p>Minatmu paling kuat di " + esc(join(codes)) + ", dan ini paling sejalan dengan rumpun tersebut"
            + (second ? ", dengan alternatif <b>" + esc(rumpunLabel(second.id)) + "</b>" : "") + ". "
            + esc((cfg.minat.rumpun_contoh || {})[top.id] || "") + "</p>"
            + tkaSaran(top.id)
            + "<h3 class=\"pb-h3\">Kekuatanmu</h3>" + list([
                "Cara belajar: " + join(gayaTop),
                "Computational Thinking: " + ctBest.nama,
                "Kebiasaan: " + kebBest.nama
            ])
            + "<h3 class=\"pb-h3\">Perlu diperkuat</h3>" + list([
                s.kesiapan.prioritas.length ? "Topik Matematika: " + join(s.kesiapan.prioritas.slice(0, 3)) : "Topik Matematika: semuanya sudah cukup, coba soal penalaran",
                "Computational Thinking: " + ctWeak.nama,
                "Kebiasaan: " + kebWeak.nama
            ])
            + "<h3 class=\"pb-h3\">Catatan untuk arahmu</h3>" + list(notes)
            + "<h3 class=\"pb-h3\">Rencana belajar minggu ini</h3><ol>" + weeklyPlan(s).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol></div>";

        return html;

    }

    function summaryRows(s) {

        var rows = [];
        var tier = kesiapanTier(s.kesiapan.pct);
        var gr = ranked(s.gaya.skor);
        var names = (isMerata(gr) ? gr.slice(0, 3) : gr.slice(0, 2)).map(function (r) { return byId(cfg.gaya.dimensi, r.id).nama; });
        var mr = ranked(s.minat.skor);
        var cr = ranked(s.ct.skor);
        var kr = ranked(s.kebiasaan.skor);

        rows.push(["Kesiapan Matematika", "Kelas " + s.kesiapan.kelas + ": " + tier.label + " (" + round(s.kesiapan.pct) + "%)"]);
        rows.push(["Cara belajar", (isMerata(gr) ? "Merata: " : "") + join(names)]);
        rows.push(["Minat (RIASEC)", mr.slice(0, 3).map(function (r) { return r.id; }).join("") + " · " + rumpunLabel(s.minat.rumpunTop)]);
        rows.push(["Computational Thinking", "Terkuat: " + byId(cfg.ct.pilar, cr[0].id).nama + ". Perlu dilatih: " + byId(cfg.ct.pilar, cr[cr.length - 1].id).nama]);
        rows.push(["Kebiasaan belajar", "Kuat di " + byId(cfg.kebiasaan.dimensi, kr[0].id).nama + ". Perlu perhatian: " + byId(cfg.kebiasaan.dimensi, kr[kr.length - 1].id).nama]);

        return rows;

    }

    function weeklyPlan(s) {

        var plan = [];
        var g = byId(cfg.gaya.dimensi, ranked(s.gaya.skor)[0].id);
        var k = byId(cfg.kebiasaan.dimensi, weakest(s.kebiasaan.skor).id);
        var p = byId(cfg.ct.pilar, weakest(s.ct.skor).id);

        plan.push("Cara belajar " + g.nama + ": " + g.strategi[0]);
        plan.push("Kebiasaan (" + k.nama + "): " + k.tips[0]);
        plan.push("Latihan " + p.nama + ": " + p.latihan);

        if (s.kesiapan.prioritas && s.kesiapan.prioritas.length) {
            plan.push("Ulang topik " + join(s.kesiapan.prioritas.slice(0, 2)) + ", lalu kerjakan 5 soal untuk tiap topik.");
        }

        plan.push("Cari tahu satu prodi dari rumpun " + rumpunLabel(s.minat.rumpunTop) + ", lalu baca mata kuliah dan syarat seleksinya di situs resmi SNPMB.");

        return plan;

    }

    /* ---------- layar hasil ---------- */

    function showResult() {

        var s = loadStore();

        if (!cfg || !storeComplete(s)) {
            renderStart();
            show("start");
            return;
        }

        var html = synthesis(s);

        TOPICS.forEach(function (k, i) {

            var chip = chipOf(k, s);

            html += "<details class=\"pb-card pb-topic t-" + chip.kelas + "\" open>"
                + "<summary><span class=\"pb-topic-ico\" aria-hidden=\"true\">" + info(k).ikon + "</span>"
                + "<span><span class=\"pb-topic-kode\">Topik " + (i + 1) + "</span><span class=\"pb-topic-nama\">" + esc(info(k).judul) + "</span>"
                + "<span class=\"pb-label-chip " + chip.kelas + "\">" + esc(chip.teks) + "</span></span></summary>"
                + "<div class=\"pb-topic-body\">" + RENDER[k](s[k]) + "</div></details>";

        });

        $("pbResultBody").innerHTML = html;
        $("pbResultSub").textContent = "Kelas " + s.kesiapan.kelas + " · lima topik dianalisis dari satu rangkaian jawabanmu.";

        show("result");

    }

    /* ---------- cetak / simpan PDF ---------- */

    function printAll() {

        var s = loadStore();

        if (!storeComplete(s)) return;

        var tgl = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
        var rows = summaryRows(s).map(function (r) {
            return "<div class=\"pb-sum-row\"><span class=\"pb-sum-k\">" + esc(r[0]) + "</span><span class=\"pb-sum-v\">" + esc(r[1]) + "</span></div>";
        }).join("");
        var html = "<div class=\"pb-print-head\"><h1>Profil Belajar</h1><p>SMAN 1 Sooko Mojokerto · dicetak " + esc(tgl) + "</p>"
            + "<div class=\"pb-print-id\"><span>Nama:</span><span>Kelas:</span></div></div>"
            + "<div class=\"pb-card\"><h3 class=\"pb-h3\">Ringkasan</h3>" + rows + "</div>"
            + synthesis(s);

        TOPICS.forEach(function (k) {
            html += "<h2 class=\"pb-h2\" style=\"margin-top:1.2rem\">" + esc(info(k).judul) + "</h2>" + RENDER[k](s[k]);
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

        ctx.font = "600 18px 'Plus Jakarta Sans', sans-serif";
        ctx.fillStyle = "#55657d";
        ctx.fillText("Preferensi bersifat campuran dan bisa berubah. Dibuat di browser, tidak dikirim ke server.", x, H - pad - 28);

        return canvas;

    }

    function downloadCard() {

        if (!storeComplete(loadStore())) return;

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

    function onRunEvent(e) {

        var t = e.target;

        if (!t || !t.classList || !t.classList.contains("pb-range")) return;

        if (e.type === "keyup" && e.key !== "Enter" && e.key !== " ") return;

        answer(t);

    }

    function bind() {

        var body = $("pbRunBody");

        ["input", "change", "click", "keyup"].forEach(function (ev) { body.addEventListener(ev, onRunEvent); });

        $("pbMulai").addEventListener("click", onMulai);
        $("pbLihat").addEventListener("click", showResult);
        $("pbNext").addEventListener("click", onNext);
        $("pbBack").addEventListener("click", onBack);

        $("pbKelas").addEventListener("change", function () { $("pbStartError").hidden = true; });

        $("pbUlang").addEventListener("click", function () { renderStart(); show("start"); });
        $("pbUnduh").addEventListener("click", downloadCard);
        $("pbCetak").addEventListener("click", printAll);

        $("pbHapus").addEventListener("click", function () {

            if (!window.confirm("Hapus semua hasil Profil Belajar di browser ini? Tindakan ini tidak bisa dibatalkan.")) return;

            removeKey(STORE_KEY);
            removeKey(DRAFT_KEY);

            $("pbKelas").value = "";
            renderStart();
            show("start");

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
        fetchJson(RS_URL).then(function (d) { rsCfg = d; }, function () { rsCfg = null; });

        fetchJson(CFG_URL).then(function (d) {
            cfg = d;
            renderStart();
        }, function () {
            cfg = null;
            renderStart();
        });

    }

    init();

})();
