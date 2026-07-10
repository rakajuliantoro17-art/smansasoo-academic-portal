# SMANSASOO Academic Portal API

Version **1.0.0**

---

# Overview

API digunakan untuk menghubungkan website **SMANSASOO Academic Portal** dengan database Google Spreadsheet melalui Google Apps Script.

Seluruh response menggunakan format **JSON**.

Base URL akan diperoleh setelah Google Apps Script dipublikasikan sebagai Web App.

Contoh:

```
https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxxxxxx/exec
```

---

# Response Format

Semua endpoint menggunakan format response berikut.

```json
{
    "success": true,
    "message": "Success",
    "version": "1.0.0",
    "timestamp": "2026-07-10T08:00:00Z",
    "data": {}
}
```

---

# Search Student

Mencari data siswa berdasarkan **NIS** atau **NISN**.

## Request

```
GET
```

Parameter

| Parameter | Type | Required | Keterangan |
|-----------|------|----------|------------|
| nis | String | Tidak | Nomor Induk Siswa |
| nisn | String | Tidak | Nomor Induk Siswa Nasional |

Minimal salah satu parameter harus dikirim.

---

## Contoh Request

Berdasarkan NIS

```
GET /?nis=240001
```

Berdasarkan NISN

```
GET /?nisn=0087654321
```

---

## Success Response

```json
{
    "success": true,
    "message": "Data ditemukan",
    "version": "1.0.0",
    "timestamp": "2026-07-10T08:00:00Z",
    "data": {
        "nis": "240001",
        "nisn": "0087654321",
        "name": "Ahmad Fauzi",
        "gender": "L",
        "status": "NAIK",
        "previous_class": "X-1",
        "new_class": "XI-STEM 1",
        "major": "STEM",
        "homeroom_teacher": "Drs. Budi Santoso",
        "academic_year": "2026/2027"
    }
}
```

---

## Student Not Found

```json
{
    "success": false,
    "message": "Data siswa tidak ditemukan",
    "version": "1.0.0",
    "timestamp": "2026-07-10T08:00:00Z",
    "data": null
}
```

---

## Invalid Request

```json
{
    "success": false,
    "message": "Parameter tidak lengkap",
    "version": "1.0.0",
    "timestamp": "2026-07-10T08:00:00Z",
    "data": null
}
```

---

# Data Dictionary

| Field | Type | Keterangan |
|------|------|------------|
| nis | String | Nomor Induk Siswa |
| nisn | String | Nomor Induk Siswa Nasional |
| name | String | Nama Lengkap |
| gender | String | L / P |
| status | String | NAIK / TIDAK NAIK |
| previous_class | String | Kelas Sebelumnya |
| new_class | String | Kelas Baru |
| major | String | Minat / Kelompok Mata Pelajaran |
| homeroom_teacher | String | Wali Kelas Baru |
| academic_year | String | Tahun Pelajaran |

---

# HTTP Status

| HTTP | Keterangan |
|------|------------|
| 200 | Request berhasil diproses |
| 400 | Parameter tidak valid |
| 404 | Data siswa tidak ditemukan |
| 500 | Kesalahan pada server |

---

# Security

Versi 1.0 menggunakan endpoint publik yang hanya menyediakan akses baca (read-only).

Data yang ditampilkan dibatasi pada informasi yang diperlukan untuk pengumuman akademik dan tidak memuat data sensitif siswa.

---

# Version History

| Version | Perubahan |
|---------|-----------|
| 1.0.0 | Search berdasarkan NIS dan NISN |
| 1.5.0 | Penambahan endpoint pengaturan portal |
| 2.0.0 | Multi tahun ajaran dan multi jenis pengumuman |

---

# Future Endpoints

Endpoint berikut direncanakan pada versi selanjutnya:

| Endpoint | Fungsi |
|----------|--------|
| `/settings` | Konfigurasi portal |
| `/announcement` | Informasi pengumuman |
| `/statistics` | Statistik akses portal |
| `/verification` | Verifikasi QR Code |
| `/health` | Status layanan API |

