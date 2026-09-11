# SMANSASOO Academic Portal

Portal rekap nilai Matematika Wajib & Lanjutan Kelas XI — migrasi dari Google Apps Script (`Code.gs` + `Index.html`) ke **Next.js**, deploy di **Vercel**, tanpa dependensi Apps Script lagi.

Data tetap diambil dari Google Spreadsheet yang sudah kamu publish ke web (pubhtml), tapi lewat endpoint CSV publik — tidak butuh API key.

## 1. Struktur Project

```
lib/sheetService.js     -> port dari Code.gs (searchStudentByNIS, getClassList, getClassSummary)
pages/api/search-nis.js -> API route pengganti google.script.run.searchStudentByNIS
pages/api/class-list.js -> API route pengganti google.script.run.getClassList
pages/api/class-summary.js -> API route pengganti google.script.run.getClassSummary
pages/index.js           -> UI React, port dari Index.html
```

## 2. Dapatkan GID Tiap Tab Sheet

Spreadsheet kamu punya 3 tab: "NIlai Math Wajib Kelas XI", "Nilai Math Lanjutan Kelas XI", "Nilai Input Raport". Tiap tab punya `gid` unik yang dibutuhkan untuk export CSV.

1. Buka link pubhtml spreadsheet kamu.
2. Klik ke tab sheet yang dimaksud (misal "NIlai Math Wajib Kelas XI").
3. Lihat URL berubah jadi: `...pubhtml?gid=123456789&single=true`
4. Salin angka setelah `gid=` itu.
5. Ulangi untuk 3 tab tersebut.

> **Penting**: pastikan spreadsheet tetap dalam status "Published to web" (File → Share → Publish to web). Kalau publish-nya dimatikan, endpoint CSV akan gagal diakses.

## 3. Setup Environment Variables

Salin `.env.example` menjadi `.env.local`, lalu isi:

```bash
cp .env.example .env.local
```

```env
SHEET_PUB_ID=2PACX-1vQoeeD-Cm-YmbA7pXEmYX-nutIj0F3XWWxWqfBbVHpPN2-A8zQpzjZPYx6Rz9Dep4-6IhGG7p4npGLp
SHEET_GID_WAJIB=<gid tab Nilai Math Wajib Kelas XI>
SHEET_GID_LANJUTAN=<gid tab Nilai Math Lanjutan Kelas XI>
SHEET_GID_RAPORT=<gid tab Nilai Input Raport>
```

`SHEET_PUB_ID` sudah diisi otomatis sesuai link yang kamu berikan — tinggal isi 3 nilai GID-nya.

## 4. Jalankan Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## 5. Push ke GitHub

Kalau repo `smansasoo-academic-portal` sudah ada, tinggal replace isinya dengan folder ini lalu:

```bash
git add .
git commit -m "Migrate from Apps Script to Next.js + Vercel"
git push origin main
```

## 6. Deploy ke Vercel

1. Buka [vercel.com](https://vercel.com) → **Add New Project** → import repo GitHub `smansasoo-academic-portal`.
2. Vercel otomatis mendeteksi ini sebagai project Next.js — tidak perlu ubah build command.
3. Di bagian **Environment Variables**, tambahkan 4 variabel yang sama seperti di `.env.local`:
   - `SHEET_PUB_ID`
   - `SHEET_GID_WAJIB`
   - `SHEET_GID_LANJUTAN`
   - `SHEET_GID_RAPORT`
4. Klik **Deploy**.

Setiap kali kamu push ke `main`, Vercel akan auto-redeploy.

## 7. Catatan Penting

- **Delay update data**: endpoint CSV publik Google di-cache oleh Google, biasanya update dalam beberapa menit setelah kamu edit sheet. Kalau butuh lebih real-time, bisa upgrade ke Google Sheets API v4 dengan API key nanti.
- **Cache internal**: `lib/sheetService.js` menyimpan cache sederhana 60 detik di memori server supaya tidak fetch CSV berkali-kali pada request beruntun. Bisa disesuaikan lewat `CACHE_TTL_MS`.
- **Struktur kolom sheet**: kode ini mengasumsikan urutan kolom sheet kamu sama persis seperti versi Apps Script (kolom index 0–18). Kalau kamu ubah urutan/tambah kolom di sheet, sesuaikan juga index-nya di `lib/sheetService.js`.
- **Styling**: masih pakai Tailwind lewat CDN script (sama seperti `Index.html` asli) supaya migrasinya cepat dan visualnya identik. Kalau nanti mau setup Tailwind build proper (PostCSS), tinggal install `tailwindcss` + config, lalu hapus script CDN di `pages/_document.js`.
