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
