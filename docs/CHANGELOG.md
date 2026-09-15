# Changelog

Semua perubahan penting pada proyek **SMANSASOO Academic Portal** akan didokumentasikan pada file ini.

Format changelog mengikuti prinsip **Keep a Changelog** dan menggunakan **Semantic Versioning (SemVer)**.

---

## [Unreleased]

### Changed

- **Navbar & sidebar disatukan.** Sebelumnya ada 4 pola navbar berbeda
  (dropdown lama `js/shell.js`, navbar custom `index.html` via
  `css/navbar.css`, sidebar penuh khusus `pages/prestasi.html`, dan
  `pages/rekap.html` yang tidak punya navbar situs sama sekali).
  Sekarang semua halaman (index, nilai, rekap, kelulusan, prestasi,
  rapor, about, privacy) memakai satu sistem navbar+sidebar bersama
  di `css/shell.css` + `js/shell.js` (v2.0.0), digeneralisasi dari
  pola sidebar yang sebelumnya cuma ada di `prestasi.html`.
- `js/shell.js` sekarang otomatis membungkus isi halaman ke dalam
  layout sidebar+konten (`.app-layout` / `.app-content`) saat load,
  jadi halaman lama tidak perlu ditulis ulang markup-nya.
- Halaman dengan kebutuhan sidebar tambahan (jump-nav "Di Halaman Ini",
  link eksternal) bisa memakainya lewat `window.SHELL_PAGE_SECTIONS`
  dan `window.SHELL_EXTERNAL_LINK`, didokumentasikan di
  `docs/UI-SHELL.md`.
- `css/navbar.css` dihapus (fungsinya digantikan `css/shell.css`).

### Fixed

- Path favicon/logo yang salah (`assets/favicon.ico`,
  `assets/logo.png`) di beberapa halaman, seharusnya
  `assets/logo/favicon.ico` dan `assets/logo/logo.png`.

### Planned

- Dashboard Administrator
- Multi Tahun Ajaran
- Multi Jenis Pengumuman
- Statistik Pengunjung
- QR Verification
- Export PDF
- Dark Mode di seluruh halaman (saat ini baru `pages/rekap.html`)

---

# [1.0.0] - 2026-07-10

## Foundation Release

Versi pertama sebagai fondasi pengembangan portal akademik SMAN 1 Sooko Mojokerto.

### Added

- Struktur repository GitHub.
- Deployment menggunakan Vercel.
- Integrasi Google Spreadsheet sebagai database.
- Perencanaan Google Apps Script sebagai REST API.
- Halaman pencarian berdasarkan NIS/NISN.
- Halaman hasil pengumuman.
- Responsive Layout.
- CSS Variables.
- CSS Animation.
- Progressive Web App (manifest).
- Service Worker.
- Dokumentasi API.
- Sample JSON untuk simulasi data.

### Documentation

- README.md
- API.md
- CHANGELOG.md
- LICENSE

### Infrastructure

- GitHub Repository
- Vercel Configuration
- Folder Structure
- Versioning

---

# [1.1.0] - Planned

## Improvement Release

### Planned

- Validasi Input
- Loading Indicator
- Error Handling
- Skeleton Loading
- Better Search Animation

---

# [1.5.0] - Planned

## User Experience Release

### Planned

- Countdown Pengumuman
- FAQ
- Informasi Sekolah
- Offline Page
- Install as PWA
- Share Result
- Glassmorphism UI
- Better Mobile Experience

---

# [2.0.0] - Planned

## Academic Portal Release

### Planned

- Multi Tahun Ajaran
- Multi Pengumuman
- Dashboard Administrator
- Pengaturan Portal
- QR Verification
- Statistik Pengunjung
- Download PDF
- Konfigurasi Portal dari Spreadsheet

---

## Versioning

Project menggunakan **Semantic Versioning**.

Format:

MAJOR.MINOR.PATCH

Contoh:

- 1.0.0 → Initial Release
- 1.0.1 → Bug Fix
- 1.1.0 → New Feature
- 2.0.0 → Major Release

---

## Legend

| Jenis | Keterangan |
|--------|------------|
| Added | Fitur baru |
| Changed | Perubahan fitur |
| Deprecated | Fitur akan dihapus |
| Removed | Fitur dihapus |
| Fixed | Perbaikan bug |
| Security | Perbaikan keamanan |

---

## Authors

SMANSASOO Academic Portal

IT Team SMAN 1 Sooko Mojokerto

Copyright © 2026
