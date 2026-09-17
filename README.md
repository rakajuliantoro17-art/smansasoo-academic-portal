# 🎓 SMANSASOO Academic Portal

Portal Pengumuman Akademik SMAN 1 Sooko Mojokerto.

---

## 📌 Tentang Project

SMANSASOO Academic Portal merupakan aplikasi web berbasis HTML, CSS, dan JavaScript yang digunakan sebagai portal resmi pengumuman akademik SMAN 1 Sooko Mojokerto.

Project ini dirancang agar dapat digunakan setiap tahun tanpa perlu membangun ulang aplikasi. Data akademik dikelola melalui Google Spreadsheet dan diakses menggunakan Google Apps Script sebagai REST API.

Website di-host menggunakan Vercel dan seluruh source code dikelola melalui GitHub.

---

## 🎯 Tujuan

- Pengumuman Kenaikan Kelas
- Pembagian Kelas Baru
- Pengumuman Kelulusan
- Pengumuman MPLS
- Informasi Akademik

---

## 🚀 Teknologi

| Teknologi | Keterangan |
|-----------|------------|
| HTML5 | Struktur Website |
| CSS3 | Tampilan |
| JavaScript ES6 | Interaksi |
| Google Apps Script | REST API |
| Google Spreadsheet | Database |
| GitHub | Version Control |
| Vercel | Hosting |

---

## 📁 Struktur Project

```text
smansasoo-academic-portal/
│
├── assets/
├── css/
├── docs/
├── js/
├── pages/
│
├── index.html
├── vercel.json
├── sw.js
├── README.md
├── LICENSE
└── .gitignore
```

---

## ⚙️ Arsitektur

```text
User
 │
 ▼
Vercel
 │
 ▼
Google Apps Script API
 │
 ▼
Google Spreadsheet
```

---

## 🌐 Deployment

Repository GitHub akan otomatis terhubung dengan Vercel sehingga setiap perubahan pada branch **main** akan langsung dideploy.

---

## 📊 Database

Seluruh data disimpan pada Google Spreadsheet.

Contoh struktur data:

| Tahun | NIS | NISN | Nama | Status | Kelas Lama | Kelas Baru | Minat | Wali |
|------|------|------|------|------|------|------|------|------|

---

## 🧩 UI Shell (konsistensi tampilan)

Nav bar dan footer di semua halaman dirender dari satu sumber:
`js/shell.js` + `css/shell.css`. Tambah menu baru cukup di satu tempat,
dan setiap halaman baru tinggal menyalin `pages/_template.html`.

Panduan lengkap (design tokens, komponen yang sudah ada, cara menambah
halaman/fitur baru): lihat **`docs/UI-SHELL.md`**.

---

## 📐 Modul Nilai (tanpa Apps Script)

Selain modul kenaikan kelas di atas, portal ini juga punya modul **Cek Nilai
Matematika** (`pages/nilai.html`) yang sudah sepenuhnya pindah dari Apps
Script ke Vercel Serverless Function (folder `/api`). Modul ini membaca
Google Spreadsheet langsung dari server, jadi ID spreadsheet tidak pernah
kelihatan di browser maupun di source code GitHub.

### Setup

1. Buka spreadsheet-nya, klik **Share** → ubah ke **"Anyone with the link
   - Viewer"** (bukan "Publish to web").
2. Salin ID spreadsheet dari URL-nya:
   `https://docs.google.com/spreadsheets/d/`**`ID_SPREADSHEET`**`/edit`
3. Di **Vercel Dashboard → Project → Settings → Environment Variables**,
   tambahkan:

   | Key | Value |
   |-----|-------|
   | `GOOGLE_SHEET_ID` | ID spreadsheet dari langkah 2 |

4. Redeploy project. Endpoint `/api/nilai`, `/api/kelas-list`, dan
   `/api/kelas-summary` akan otomatis aktif — lihat `docs/API.md` untuk
   detail masing-masing endpoint.

> ⚠️ Vercel hanya membaca serverless function dari folder **`/api`** di
> root project. Jangan pindahkan file-file di `/api` ke folder lain
> (mis. `functions/api/`) karena tidak akan ke-deploy.

---

## 📅 Multi Tahun Ajaran (Nilai)

Modul Cek Nilai mendukung banyak tahun ajaran sekaligus. Tahun berjalan
(default) tetap pakai `GOOGLE_SHEET_ID` seperti biasa; tahun ajaran lain
boleh disimpan di spreadsheet terpisah lewat Environment Variable dengan
pola `GOOGLE_SHEET_ID_<TAHUN>`.

### Cara nambah tahun ajaran baru

1. Siapkan spreadsheet untuk tahun itu dengan **struktur sheet yang sama
   persis** dengan yang sekarang (nama tab: `NIlai Math Wajib Kelas XI`,
   `Nilai Math Lanjutan Kelas XI`, `Nilai Input Raport`), lalu share
   **"Anyone with the link - Viewer"**.
2. Di **Vercel Dashboard → Project → Settings → Environment Variables**,
   tambahkan:

   | Key | Value |
   |-----|-------|
   | `GOOGLE_SHEET_ID_2026` | ID spreadsheet tahun ajaran 2026/2027 |
   | `GOOGLE_SHEET_ID_2025` | ID spreadsheet tahun ajaran 2025/2026 |

   (angka tahunnya = tahun **mulai** tahun ajaran, 4 digit, sesuai yang
   nanti ditulis di `tahun_tersedia`)

3. Edit `data/nilai-index.json`, tambahkan angka tahunnya ke
   `tahun_tersedia` (urut dari terbaru ke terlama) dan set
   `tahun_default` kalau perlu diganti.
4. Commit + redeploy. Dropdown "Tahun Pelajaran" di `pages/nilai.html`
   otomatis muncul tanpa perlu ubah kode lain.

> Tahun yang TIDAK punya `GOOGLE_SHEET_ID_<TAHUN>` sendiri otomatis
> jatuh ke `GOOGLE_SHEET_ID` (default) — jadi kalau memang belum mau
> memisah datanya, tidak wajib bikin env var baru dulu.

---

## 📊 Statistik Pengunjung (Panel Floating)

Sidebar punya tombol **"Statistik Pengunjung"** di bagian paling bawah
yang membuka panel floating (glassmorphism) berisi jumlah kunjungan ke
tiap halaman (Nilai, Kelulusan, Kenaikan Kelas, dst). Datanya disimpan
di **Upstash Redis** (gratis untuk trafik kecil-menengah), diakses lewat
REST API — tidak butuh tambahan dependency npm apa pun.

### Setup

1. Buat database Redis gratis di <https://console.upstash.com>
   (New Database → pilih region terdekat → Create).
2. Di halaman database itu, salin **REST URL** dan **REST TOKEN**.
3. Di **Vercel Dashboard → Project → Settings → Environment Variables**,
   tambahkan:

   | Key | Value |
   |-----|-------|
   | `UPSTASH_REDIS_REST_URL` | REST URL dari langkah 2 |
   | `UPSTASH_REDIS_REST_TOKEN` | REST TOKEN dari langkah 2 |

4. Redeploy project.

Selama dua Environment Variable itu belum diisi, panel tetap muncul
tapi menampilkan pesan "belum diaktifkan" — tidak ada yang error/rusak
di sisi pengguna. Endpoint yang dipakai: `GET /api/stats` (ambil semua
angka) dan `POST /api/stats?page=<key>` (tambah 1 hit, dipanggil
otomatis oleh `js/stats-tracker.js` tiap halaman dimuat).

---

## 🔌 API

Google Apps Script digunakan sebagai REST API.

Contoh request:

```text
GET
/api?nis=123456
```

Contoh response:

```json
{
  "success": true,
  "data": {
    "nama": "Ahmad",
    "status": "Naik",
    "kelasBaru": "XI-5"
  }
}
```

---

# 🛣️ Roadmap

## Version 1.0

- [x] HTML Structure
- [x] GitHub Repository
- [x] Vercel Deployment
- [x] Google Spreadsheet
- [x] Google Apps Script API
- [ ] Search NIS/NISN
- [ ] Result Card
- [ ] Responsive Design

---

## Version 1.5

- Countdown
- Informasi Sekolah
- FAQ
- Responsive Improvement
- Progressive Web App (PWA)
- Offline Page

---

## Version 2.0

- Multi Tahun Ajaran
- Multi Pengumuman
- Konfigurasi Portal
- Statistik Pengunjung
- Dashboard Admin
- Download PDF
- QR Verification

---

## 👨‍💻 Developer

SMAN 1 Sooko Mojokerto

IT Team

Academic Portal Project

---

## 📄 License

MIT License

Copyright © 2026 SMAN 1 Sooko Mojokerto
