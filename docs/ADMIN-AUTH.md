# Login Admin (gerbang halaman Absensi)

Sistem login ringan untuk melindungi halaman staf/admin — saat ini dipakai
oleh tiga halaman Absensi QR:

- `pages/absensi-admin.html` (generate & cetak kartu QR)
- `pages/absensi-scan.html` (kios scan kamera)
- `pages/absensi-rekap.html` (rekap kehadiran)

## Cara kerja

1. **Server** (`api/admin-login.js`) memeriksa username + password terhadap
   `ADMIN_USERNAME` / `ADMIN_PASSWORD` (Environment Variable Vercel, bukan
   hardcode di source code). Kalau benar, server membalas token yang
   ditandatangani HMAC-SHA256, berlaku 8 jam.
2. **Browser** (`js/admin-auth.js`) menyimpan token itu di `sessionStorage`
   (hilang saat tab ditutup). Halaman dengan atribut `data-require-admin`
   pada tag `<script src="/js/admin-auth.js">` akan disembunyikan
   (`visibility:hidden`) sampai login berhasil.
3. Setelah login, setiap `fetch()` ke `/api/absensi-*` dari halaman itu
   otomatis membawa header `Authorization: Bearer <token>` (lewat patch
   `window.fetch`), jadi tidak perlu menambah kode apa pun di halaman.
4. **Server lagi** (`api/admin-verify.js`, fungsi `verifyAdmin(req)`) — kalau
   dipakai di endpoint lain, kode harus benar-benar memeriksa tanda tangan
   token, bukan percaya begitu saja pada header yang dikirim browser.
5. Ikon gerigi "Pengaturan" di navbar (dimuat otomatis oleh `js/shell.js` ->
   `js/settings-panel.js`) jadi menu cepat ke tiga halaman di atas; klik
   menu akan memunculkan overlay login kalau belum ada sesi aktif.

## Env var yang dibutuhkan

| Variabel | Wajib? | Keterangan |
|---|---|---|
| `ADMIN_USERNAME` | Ya (untuk aktifkan proteksi) | Username admin, mis. `admin` |
| `ADMIN_PASSWORD` | Ya | Password admin |
| `ADMIN_SESSION_SECRET` | Opsional | String acak untuk menandatangani token. Kalau kosong, diturunkan otomatis dari `ADMIN_PASSWORD`. |

**Kalau `ADMIN_USERNAME`/`ADMIN_PASSWORD` dikosongkan**, seluruh proteksi
otomatis nonaktif (halaman & API tetap bisa diakses langsung seperti
sebelum fitur ini ada) — jadi aman untuk di-deploy bertahap.

## Melindungi endpoint API lain

Endpoint yang sudah dilindungi: `api/absensi.js`, `api/absensi-rekap.js`,
`api/absensi-students.js`. Untuk menambah endpoint baru ke daftar ini,
tempel pola berikut di awal handler-nya:

```js
const { verifyAdmin } = require("./admin-verify");
// ...
const auth = verifyAdmin(req);

if (auth.configured && !auth.ok) {
    res.status(401).json({ success: false, message: "Sesi admin tidak valid, silakan login ulang." });
    return;
}
```

## Percobaan password salah

`api/admin-login.js` membatasi maksimal 5 percobaan gagal per alamat IP
per 10 menit. Kalau `UPSTASH_REDIS_REST_URL`/`TOKEN` sudah diisi (lihat
`.env.example`), batas ini tersimpan di Upstash (bertahan lintas
instance serverless); kalau tidak, disimpan di memori instance saja
(cukup sebagai pengaman dasar, bisa reset kalau Vercel memulai instance
baru).
