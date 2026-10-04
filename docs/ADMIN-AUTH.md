# Login Admin (gerbang halaman Absensi)

Sistem login ringan untuk melindungi halaman staf/admin — saat ini dipakai
oleh tiga halaman Absensi QR:

- `pages/absensi-admin.html` (generate & cetak kartu QR)
- `pages/absensi-scan.html` (kios scan kamera)
- `pages/absensi-rekap.html` (rekap kehadiran)

## Cara kerja

1. **Server** (`api/admin-login.js`) memeriksa username + password terhadap
   kredensial default yang tertanam di kode (hanya hash-nya, lihat bagian
   "Kredensial saat ini" di bawah), atau terhadap `ADMIN_USERNAME` /
   `ADMIN_PASSWORD` kalau Environment Variable itu diisi di Vercel. Kalau
   benar, server membalas token yang ditandatangani HMAC-SHA256, berlaku
   8 jam.
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

## Kredensial saat ini

Login admin **sudah aktif tanpa perlu mengatur apa pun di Vercel**.
Username dan password sementara ditentukan langsung di kode
(`api/admin-login.js`) supaya tidak perlu bolak-balik ke dashboard
Vercel dulu. Yang tersimpan di file itu **hanya hash SHA-256** dari
password, bukan teks aslinya — jadi siapa pun yang membuka source
code (termasuk siapa pun dengan akses ke repo GitHub) tidak langsung
melihat passwordnya. Username & password hanya diketahui oleh pemilik
portal.

Kalau suatu saat mau **mengganti** username/password tanpa mengubah
kode (disarankan untuk pemakaian jangka panjang, karena hash di kode
tidak bisa "dicabut" dari riwayat git), isi Environment Variable di
Vercel Project Settings — nilainya otomatis mengambil alih default di
kode:

| Variabel | Wajib? | Keterangan |
|---|---|---|
| `ADMIN_USERNAME` | Tidak (opsional) | Kalau diisi, menggantikan default `admin`. |
| `ADMIN_PASSWORD` | Tidak (opsional) | Kalau diisi, menggantikan password default. |
| `ADMIN_SESSION_SECRET` | Opsional | String acak untuk menandatangani token. Kalau kosong, diturunkan otomatis dari `ADMIN_PASSWORD` (atau dari secret default kalau `ADMIN_PASSWORD` juga kosong). |

Proteksi di `api/absensi.js`, `api/absensi-rekap.js`, dan
`api/absensi-students.js` selalu aktif sekarang (tidak ada mode
"nonaktif otomatis" lagi, karena sudah ada kredensial default).

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
