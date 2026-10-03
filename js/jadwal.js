/*
==========================================================
SMANSASOO Academic Portal
Jadwal Pelajaran (pages/jadwal.html)
Version : 1.0.0
==========================================================
Membaca data/jadwal.json (hasil transkripsi PDF jadwal
semester ganjil 2026/2027) lalu menampilkan jadwal per KELAS
dan per HARI, atau satu minggu penuh.

- Filter: kelas (select) + hari (Senin-Jumat atau Seminggu).
- Hari bawaan = hari ini (zona waktu WIB); Sabtu/Minggu -> Senin.
- Kalau melihat hari ini, pelajaran yang sedang berlangsung
  ditandai, dan pelajaran berikutnya diberi label "Berikutnya".
- Pilihan tersimpan di URL (?kelas=XI-3&hari=selasa) supaya
  bisa dibagikan, dan kelas terakhir diingat di localStorage.
- Jam pelajaran yang terpotong istirahat (mis. jam 4-5) otomatis
  ditampilkan sebagai dua kartu, dengan baris istirahat di tengah.

Halaman memuat js/shell.js (navbar + sidebar + footer) seperti
halaman lain; file ini tidak bergantung pada shell.
==========================================================
*/

(function () {

    "use strict";

    var DATA_URL = "/data/jadwal.json";
    var HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
    var SEMUA = "Seminggu";
    var STORAGE_KELAS = "smansasoo-jadwal-kelas";
    var WEEKDAY_INDEX = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

    var data = null;
    var state = { kelas: "", hari: "" };
    var tick = null;

    /* ==========================================
       UTIL
    ========================================== */

    function byId(id) {

        return document.getElementById(id);

    }

    function h(tag, className, text) {

        var node = document.createElement(tag);

        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = text;

        return node;

    }

    function toMinutes(clock) {

        var parts = clock.split(".");

        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);

    }

    // Tanggal & jam sekarang di WIB, apa pun zona waktu perangkatnya.
    function nowWIB() {

        var parts = new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Jakarta",
            weekday: "short",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }).formatToParts(new Date());

        var o = {};

        parts.forEach(function (p) { o[p.type] = p.value; });

        return {
            hari: WEEKDAY_INDEX[o.weekday],
            menit: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10),
            tanggal: o.year + "-" + o.month + "-" + o.day
        };

    }

    function waktuKey(hari) {

        if (hari === "Senin") return "Senin";
        if (hari === "Jumat") return "Jumat";

        return "Selasa-Kamis";

    }

    function jamLabel(dari, sampai) {

        return dari === sampai ? "Jam " + dari : "Jam " + dari + "\u2013" + sampai;

    }

    function guruOf(kode) {

        return data.guru[String(kode).split(" ")[0]] || null;

    }

    function defaultHari() {

        var now = nowWIB();

        return now.hari <= 4 ? HARI[now.hari] : HARI[0];

    }

    /* ==========================================
       DATA -> BARIS TIMELINE
    ========================================== */

    function buildRows(kelas, hari) {

        var waktu = data.waktu[waktuKey(hari)];
        var entries = data.jadwal[kelas][hari];
        var byJam = {};
        var rows = [];
        var current = null;

        entries.forEach(function (e, i) {

            for (var j = e[0]; j <= e[1]; j++) byJam[j] = i;

        });

        waktu.forEach(function (w) {

            if (w.t === "jam") {

                var idx = byJam[w.jam];
                var e = entries[idx];

                if (current && current.idx === idx) {

                    current.sampai = w.jam;
                    current.s = w.s;

                } else {

                    current = {
                        tipe: "pelajaran",
                        idx: idx,
                        dari: w.jam,
                        sampai: w.jam,
                        m: w.m,
                        s: w.s,
                        kode: e[2],
                        mapel: e[3]
                    };

                    rows.push(current);

                }

            } else {

                // istirahat / upacara / literasi memutus kartu pelajaran
                current = null;

                rows.push({ tipe: w.t, label: w.label, m: w.m, s: w.s });

            }

        });

        return rows;

    }

    function summaryOf(kelas, hari) {

        var entries = data.jadwal[kelas][hari];
        var waktu = data.waktu[waktuKey(hari)];
        var jamRows = waktu.filter(function (w) { return w.t === "jam"; });
        var total = 0;

        entries.forEach(function (e) { total += e[1] - e[0] + 1; });

        return {
            total: total,
            mulai: jamRows[0].m,
            selesai: jamRows[jamRows.length - 1].s
        };

    }

    /* ==========================================
       RENDER: SATU HARI
    ========================================== */

    function renderDay(root) {

        var kelas = state.kelas;
        var hari = state.hari;
        var rows = buildRows(kelas, hari);
        var sum = summaryOf(kelas, hari);
        var now = nowWIB();
        var isToday = now.hari === HARI.indexOf(hari);
        var liveFound = false;
        var nextFound = false;

        var head = h("div", "jd-result-head");
        head.appendChild(h("h2", "jd-h2", kelas + ", " + hari));
        head.appendChild(h("p", "jd-summary", sum.total + " jam pelajaran, " + sum.mulai + " sampai " + sum.selesai));
        root.appendChild(head);

        var list = h("ol", "jd-rows");

        rows.forEach(function (r) {

            var start = toMinutes(r.m);
            var end = toMinutes(r.s);
            var live = isToday && now.menit >= start && now.menit < end;
            var li = h("li", "jd-row");

            if (live) li.classList.add("is-now");

            var time = h("div", "jd-time", r.m);

            if (r.tipe === "pelajaran") {

                time.appendChild(h("small", "", r.s));

            } else {

                li.classList.add(r.tipe === "istirahat" ? "jd-row--rest" : "jd-row--rest", r.tipe === "khusus" ? "jd-row--khusus" : "jd-row--break");
                time.textContent = r.m;

            }

            li.appendChild(time);
            li.appendChild(h("div", "jd-spine"));

            var body = h("div", "jd-body");

            if (r.tipe === "pelajaran") {

                var mapel = data.mapel[r.mapel];
                var guru = guruOf(r.kode);
                var card = h("div", "jd-card");

                card.style.setProperty("--c", mapel.warna);
                card.style.setProperty("--span", String(r.sampai - r.dari + 1));

                var top = h("div", "jd-card-top");
                top.appendChild(h("p", "jd-jam", jamLabel(r.dari, r.sampai)));
                top.appendChild(h("span", "jd-kode", r.kode));
                card.appendChild(top);

                card.appendChild(h("p", "jd-mapel", mapel.nama));
                card.appendChild(h("p", "jd-guru", guru ? guru.n : "Kode guru " + r.kode));

                if (live) {

                    liveFound = true;
                    card.appendChild(h("span", "jd-badge", "Sedang berlangsung"));

                } else if (isToday && !liveFound && !nextFound && start > now.menit) {

                    nextFound = true;
                    card.appendChild(h("span", "jd-badge", "Berikutnya"));

                }

                body.appendChild(card);

            } else {

                var label = r.label + " (" + r.m + " \u2013 " + r.s + ")";

                body.appendChild(h("div", "jd-rest", label));

            }

            li.appendChild(body);
            list.appendChild(li);

        });

        root.appendChild(list);

    }

    /* ==========================================
       RENDER: SEMINGGU
    ========================================== */

    function renderWeek(root) {

        var kelas = state.kelas;
        var now = nowWIB();

        var head = h("div", "jd-result-head");
        head.appendChild(h("h2", "jd-h2", kelas + ", satu minggu"));
        head.appendChild(h("p", "jd-summary", "Ketuk nama hari untuk melihat jam dan nama guru"));
        root.appendChild(head);

        var grid = h("div", "jd-week");

        HARI.forEach(function (hari, di) {

            var sum = summaryOf(kelas, hari);
            var box = h("section", "jd-day");

            if (now.hari === di) box.classList.add("is-today");

            var title = h("h3", "jd-day-head");
            var btn = h("button", "jd-daylink");

            btn.type = "button";
            btn.setAttribute("data-hari", hari);
            btn.appendChild(h("span", "", hari + (now.hari === di ? " (hari ini)" : "")));
            btn.appendChild(h("small", "", sum.mulai + "\u2013" + sum.selesai));
            title.appendChild(btn);
            box.appendChild(title);

            var ul = h("ul", "jd-wlist");

            data.jadwal[kelas][hari].forEach(function (e) {

                var mapel = data.mapel[e[3]];
                var li = h("li", "jd-wi");

                li.style.setProperty("--c", mapel.warna);
                li.appendChild(h("span", "jd-wi-jam", e[0] === e[1] ? String(e[0]) : e[0] + "\u2013" + e[1]));
                li.appendChild(h("span", "jd-wi-mapel", mapel.nama));
                li.appendChild(h("span", "jd-wi-kode", e[2]));
                ul.appendChild(li);

            });

            box.appendChild(ul);
            grid.appendChild(box);

        });

        root.appendChild(grid);

    }

    /* ==========================================
       RENDER: UTAMA
    ========================================== */

    function render() {

        var root = byId("jdResult");

        if (!root || !data) return;

        root.textContent = "";

        if (!state.kelas) {

            var empty = h("div", "jd-empty");
            empty.appendChild(h("strong", "", "Pilih kelas dulu"));
            empty.appendChild(h("span", "", "Jadwal akan muncul di sini setelah kelasnya dipilih."));
            root.className = "";
            root.appendChild(empty);

            return;

        }

        root.className = "jd-result";

        if (state.hari === SEMUA) renderWeek(root);
        else renderDay(root);

        updatePills();

    }

    /* ==========================================
       KONTROL
    ========================================== */

    function buildKelasSelect() {

        var select = byId("jdKelas");
        var groups = { "X": "Kelas X", "XI": "Kelas XI", "XII": "Kelas XII" };
        var placeholder = h("option", "", "Pilih kelas");

        placeholder.value = "";
        select.appendChild(placeholder);

        Object.keys(groups).forEach(function (g) {

            var og = document.createElement("optgroup");

            og.label = groups[g];

            Object.keys(data.jadwal)
                .filter(function (k) { return k.split(" ")[0] === g; })
                .forEach(function (k) {

                    var opt = h("option", "", k);
                    opt.value = k;
                    og.appendChild(opt);

                });

            select.appendChild(og);

        });

    }

    function buildPills() {

        var wrap = byId("jdHari");
        var now = nowWIB();

        HARI.concat([SEMUA]).forEach(function (hari, i) {

            var b = h("button", "jd-pill", hari);

            b.type = "button";
            b.setAttribute("data-hari", hari);
            b.setAttribute("aria-pressed", "false");

            if (i <= 4 && now.hari === i) {

                b.setAttribute("data-today", "1");
                b.setAttribute("aria-label", hari + ", hari ini");

            }

            wrap.appendChild(b);

        });

    }

    function updatePills() {

        Array.prototype.forEach.call(byId("jdHari").children, function (b) {

            b.setAttribute("aria-pressed", b.getAttribute("data-hari") === state.hari ? "true" : "false");

        });

    }

    /* ==========================================
       URL + STORAGE
    ========================================== */

    function readUrl() {

        var out = { kelas: "", hari: "" };

        try {

            var q = new URLSearchParams(window.location.search);
            var kelas = (q.get("kelas") || "").replace("-", " ").toUpperCase();
            var hari = (q.get("hari") || "").toLowerCase();

            if (data.jadwal[kelas]) out.kelas = kelas;

            if (hari === "semua" || hari === SEMUA.toLowerCase()) out.hari = SEMUA;

            HARI.forEach(function (n) { if (n.toLowerCase() === hari) out.hari = n; });

        } catch (e) {
            // URL tidak bisa dibaca -- pakai bawaan.
        }

        return out;

    }

    function writeUrl() {

        if (!window.history || !history.replaceState) return;

        try {

            var q = new URLSearchParams();

            if (state.kelas) q.set("kelas", state.kelas.replace(" ", "-"));

            q.set("hari", state.hari === SEMUA ? "semua" : state.hari.toLowerCase());

            history.replaceState(null, "", window.location.pathname + "?" + q.toString());

        } catch (e) {
            // abaikan
        }

    }

    function savedKelas() {

        try {

            var k = localStorage.getItem(STORAGE_KELAS) || "";

            return data.jadwal[k] ? k : "";

        } catch (e) {

            return "";

        }

    }

    function saveKelas(k) {

        try { localStorage.setItem(STORAGE_KELAS, k); } catch (e) { /* abaikan */ }

    }

    /* ==========================================
       EVENT
    ========================================== */

    function setState(next) {

        if (next.kelas !== undefined) state.kelas = next.kelas;
        if (next.hari !== undefined) state.hari = next.hari;

        byId("jdKelas").value = state.kelas;

        if (state.kelas) saveKelas(state.kelas);

        writeUrl();
        render();

    }

    function wire() {

        byId("jdKelas").addEventListener("change", function (ev) {

            setState({ kelas: ev.target.value });

        });

        byId("jdHari").addEventListener("click", function (ev) {

            var b = ev.target.closest("button[data-hari]");

            if (b) setState({ hari: b.getAttribute("data-hari") });

        });

        // dari tampilan seminggu: ketuk nama hari -> buka hari itu
        byId("jdResult").addEventListener("click", function (ev) {

            var b = ev.target.closest("button[data-hari]");

            if (b) {

                setState({ hari: b.getAttribute("data-hari") });
                byId("jdResult").scrollIntoView({ block: "start", behavior: "smooth" });

            }

        });

        // penanda "sedang berlangsung" ikut bergeser saat jam berganti
        tick = window.setInterval(function () {

            if (state.kelas && state.hari !== SEMUA) render();

        }, 30000);

    }

    /* ==========================================
       INFO TAMBAHAN
    ========================================== */

    function fillMeta() {

        var m = data.meta;
        var sub = byId("jdSub");

        if (sub) sub.textContent = "Semester Ganjil, Tahun Pelajaran " + m.tahun_pelajaran + ". Berlaku mulai " + m.berlaku_mulai_teks + ".";

        var note = byId("jdNote");

        if (note && nowWIB().tanggal < m.berlaku_mulai) {

            note.textContent = "Jadwal ini belum berlaku. Mulai berlaku " + m.berlaku_mulai_teks + ".";
            note.hidden = false;

        }

        var disahkan = byId("jdDisahkan");

        if (disahkan) disahkan.textContent = "Disahkan di " + m.disahkan + ".";

    }

    function showError() {

        var root = byId("jdResult");

        if (!root) return;

        root.textContent = "";
        root.className = "";

        var box = h("div", "jd-empty");
        box.appendChild(h("strong", "", "Jadwal belum bisa dimuat"));
        box.appendChild(h("span", "", "Periksa koneksi internet, lalu muat ulang halaman ini."));
        root.appendChild(box);

    }

    /* ==========================================
       INIT
    ========================================== */

    function init() {

        if (!byId("jdResult")) return;

        fetch(DATA_URL, { cache: "no-cache" })
            .then(function (res) {

                if (!res.ok) throw new Error("HTTP " + res.status);

                return res.json();

            })
            .then(function (json) {

                data = json;

                fillMeta();
                buildKelasSelect();
                buildPills();
                wire();

                var fromUrl = readUrl();

                setState({
                    kelas: fromUrl.kelas || savedKelas(),
                    hari: fromUrl.hari || defaultHari()
                });

            })
            .catch(function (err) {

                if (window.console) console.warn("Jadwal gagal dimuat:", err);

                showError();

            });

    }

    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", init);

    } else {

        init();

    }

})();
