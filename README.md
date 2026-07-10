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
