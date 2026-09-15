# UI Shell — Panduan Konsistensi Tampilan

Dokumen ini menjelaskan "shell" (kerangka tampilan bersama) portal ini,
supaya fitur yang ditambahkan di masa depan tidak merusak konsistensi
visual yang sudah ada.

---

## 1. Apa itu Shell di project ini

Shell = navbar atas + sidebar + footer yang dipakai **semua halaman**,
dirender dari satu sumber: `js/shell.js` + `css/shell.css`.

Sebelumnya situs ini punya 4 pola navbar berbeda yang tumbuh
sendiri-sendiri per halaman (dropdown sederhana, navbar custom
`index.html`, sidebar penuh khusus `pages/prestasi.html`, dan
`pages/rekap.html` yang malah tidak punya navbar situs sama sekali).
Sekarang semuanya satu sistem: navbar sticky di atas + sidebar (drawer
di mobile lewat tombol hamburger, kolom tetap di desktop ≥1024px).

Cara pakai di halaman manapun — **hanya butuh SATU elemen kosong**,
sisanya (termasuk isi halaman yang sudah ada) otomatis dibungkus oleh
`js/shell.js`:

```html
<body data-page="nilai">

    <div id="shellNav"></div>

    <!-- ...seluruh isi halaman seperti biasa, TIDAK perlu -->
    <!-- dibungkus <div class="app-content"> secara manual... -->

    <div id="shellFooter"></div>

    <script src="../js/config.js"></script>
    <script src="../js/utils.js"></script>
    <script src="../js/shell.js"></script>

</body>
```

Saat halaman dimuat, `js/shell.js` akan:
1. Mengisi `#shellNav` dengan navbar (logo, menu, tombol hamburger).
2. Memindahkan SEMUA elemen `<body>` lain (termasuk `#shellFooter`) ke
   dalam `<div class="app-content">`, lalu menaruhnya di sebelah
   sidebar — jadi halaman lama tidak perlu ditulis ulang markup-nya.
3. Mengisi `#shellFooter` dan menyorot menu aktif berdasarkan
   `data-page`.

**Sidebar per-halaman tambahan (opsional).** Kalau sebuah halaman perlu
daftar lompat "Di Halaman Ini" (seperti `pages/prestasi.html`) atau link
eksternal di sidebar, definisikan sebelum tag `<script src="../js/shell.js">`:

```html
<script>
    window.SHELL_PAGE_SECTIONS = [
        { id: "sekolah", label: "Ringkasan Sekolah", icon: "🏫" },
        { id: "peringkat", label: "Peringkat Nasional", icon: "🥇" }
    ];
    window.SHELL_EXTERNAL_LINK = {
        href: "https://contoh.go.id",
        label: "Buka Data Resmi"
    };
</script>
```

`SHELL_PAGE_SECTIONS` juga otomatis dapat scroll-spy (menyorot section
yang sedang dilihat) asal tiap section punya `id` yang cocok.

**Kenapa render lewat JS (bukan `fetch()` partial `.html`)?** Supaya tidak
ada request tambahan, tidak ada flash-of-unstyled-content, dan tetap
konsisten dengan pola yang sudah dipakai file lain di project ini
(`nilai-ui.js`, `nilai-kelas-ui.js` juga merender lewat template string).

---

## 2. Menambah menu navigasi baru

Buka `js/shell.js`, tambahkan satu baris ke `NAV_LINKS` (perlu `icon`
karena dipakai juga di sidebar):

```js
const NAV_LINKS = [
    { key: "home", label: "Beranda", href: "/index.html", icon: "🏠" },
    { key: "nilai", label: "Nilai", href: "/pages/nilai.html", icon: "📝" },
    { key: "jadwal", label: "Jadwal", href: "/pages/jadwal.html", icon: "🗓️" }, // <- baru
    ...
];
```

Menu ini otomatis muncul di navbar, sidebar, **dan** footer di semua
halaman — tidak perlu edit file `.html` satu per satu. Kalau menu tidak
perlu tampil menonjol di navbar utama (mis. halaman "Tentang"/"Privasi"),
tambahkan ke `FOOTER_EXTRA_LINKS` saja — itu hanya muncul di footer.

---

## 3. Membuat halaman baru

1. Salin `pages/_template.html`, ganti nama filenya.
2. Ganti `<title>`, `data-page`, dan isi `<header>`.
3. Daftarkan halamannya di `NAV_LINKS` (langkah 2 di atas) kalau perlu
   muncul di menu.
4. Isi `<main>` pakai komponen yang sudah ada (lihat bagian 5), bukan
   markup/CSS baru dari nol.

---

## 4. Design tokens (jangan hardcode warna/spacing)

Semua nilai visual sudah ada di `css/variables.css`. Pakai variable-nya,
supaya kalau warna brand berubah, cukup diubah di satu tempat.

| Kebutuhan | Variable |
|---|---|
| Warna utama (biru sekolah) | `var(--primary)` |
| Warna aksen (kuning) | `var(--secondary)` |
| Sukses / warning / bahaya | `var(--success)` / `var(--warning)` / `var(--danger)` |
| Latar kartu | `var(--surface)`, `var(--surface-alt)` |
| Teks & border | `var(--text)`, `var(--text-light)`, `var(--border-light)` |
| Radius sudut | `var(--radius-md)`, `var(--radius-lg)`, `var(--radius-pill)` |
| Jarak/spacing | `var(--space-sm)` … `var(--space-2xl)` |
| Bayangan | `var(--shadow-sm)`, `var(--shadow-md)` |

---

## 5. Komponen yang sudah ada — pakai ulang ini dulu

Sebelum bikin class CSS baru, cek apakah sudah ada:

| Komponen | Class | Sumber |
|---|---|---|
| Kartu form pencarian | `.search-card` | `css/style.css` |
| Kartu hasil sederhana (label/value) | `.result-card`, `.result-item`, `.result-label`, `.result-value` | `css/style.css` |
| Kartu hasil nilai (progress, tabel) | `.nilai-card`, `.nilai-table`, `.nilai-progress-*`, `.nilai-status` | `css/nilai.css` |
| Kartu metrik ringkas (angka besar) | `.kelas-metric`, `.kelas-metrics` | `css/nilai.css` |
| Tab di dalam satu halaman | `.nilai-tabs` / `.nilai-tab` (per-fitur) atau `.nilai-page-tabs` / `.nilai-page-tab` (level halaman) | `css/nilai.css` |
| Loading spinner | `.loading-box`, `.spinner` | `css/style.css`, `css/animation.css` |
| Pesan error | `.error-card` | `css/style.css` |
| Sembunyikan elemen | `.hidden` | `css/style.css` |

Kalau memang butuh tampilan baru yang belum ada polanya, tambahkan CSS-nya
di file CSS khusus fitur tersebut (contoh: `css/jadwal.css`) — jangan
edit `css/style.css` / `css/variables.css` kecuali menambah token baru
yang benar-benar dipakai lintas halaman.

---

## 6. Pola JS untuk fitur baru yang memanggil API

Ikuti pola 3 file yang sudah dipakai modul nilai:

- `js/<fitur>-api.js` — fetch ke `/api/<fitur>`, tidak menyentuh DOM.
- `js/<fitur>-ui.js` — fungsi `showLoading()`, `showError()`, `showResult(data)`, hanya menyentuh DOM lewat template string, tidak fetch apa pun.
- `js/<fitur>-search.js` — controller: dengarkan submit/klik, panggil `*API`, lalu panggil `*UI`.

Endpoint server-nya sendiri (kalau butuh baca Google Sheets) ditaruh di
`api/<fitur>.js` dan boleh pakai ulang `api/_lib/gsheet.js` (lihat
`docs/API.md`).
