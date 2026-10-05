/*
==========================================================
SMANSASOO Academic Portal
POST /api/admin-auth  (login)
GET  /api/admin-auth  (verify token)
==========================================================
Digabung jadi SATU file (dulu dua: admin-login.js +
admin-verify.js) karena paket Vercel Hobby membatasi
maksimal 12 Serverless Functions per deployment -- lihat
docs/ADMIN-AUTH.md.

POST: cek username + password admin DI SERVER, lalu kembalikan
token bertanda tangan (HMAC-SHA256) yang berlaku 8 jam.

Kredensial default (SEMENTARA, supaya tidak perlu mengatur
Environment Variable di Vercel dulu):
  username: admin
  password: ditentukan oleh pemilik portal -- TIDAK dituliskan
            di source code ini. Yang tersimpan di bawah hanya
            SHA-256 dari password itu (DEFAULT_PASSWORD_HASH),
            jadi siapa pun yang membaca file ini tidak langsung
            tahu passwordnya.

Kalau nanti mau ganti username/password tanpa ubah kode, isi
Environment Variable di Vercel Project Settings (otomatis
mengambil alih nilai default di atas):
  ADMIN_USERNAME        mis. admin
  ADMIN_PASSWORD        plaintext baru
  ADMIN_SESSION_SECRET  opsional, string acak panjang

Perlindungan tebak password: maksimal 5 gagal per IP per 10
menit (disimpan di Upstash kalau UPSTASH_REDIS_REST_* terisi,
kalau tidak, di memori instance -- cukup sebagai pengaman dasar).

POST body  : { "username": "...", "password": "..." }
POST respon: 200 { success, token, expiresAt, username }
             401 salah | 429 terlalu banyak percobaan

GET header : Authorization: Bearer <token>
GET respon : 200 { valid: true, username, expiresAt }
             401 { valid: false }

Endpoint LAIN yang perlu dilindungi (mis. yang menulis absensi)
memakai verifyAdmin() yang di-export di bawah -- lihat panduan
di docs/ADMIN-AUTH.md.
==========================================================
*/

const crypto = require("crypto");

const TTL_SECONDS = 8 * 60 * 60;
const MAX_FAILS = 5;
const WINDOW_SECONDS = 10 * 60;

// Default sementara -- lihat catatan di atas. Untuk mengganti,
// isi ADMIN_USERNAME / ADMIN_PASSWORD di Environment Variable
// Vercel (nilainya akan menggantikan default ini).
const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD_HASH = "1c563926e5cd9c53dbb4449cc919ef9d346021b3a1b14e5f1f377ed30eccefe2";
const DEFAULT_SESSION_SECRET = "108c17f07e9b9bf7e1b7de3b8c047120558cc654c0e563a405b5af129ff3c040";

const memFails = new Map();

function sha(value) {

    return crypto.createHash("sha256").update(String(value)).digest();

}

function safeEqual(a, b) {

    return crypto.timingSafeEqual(sha(a), sha(b));

}

function b64url(buffer) {

    return Buffer.from(buffer).toString("base64url");

}

function adminUsername() {

    return process.env.ADMIN_USERNAME || DEFAULT_USERNAME;

}

// Password ADMIN_PASSWORD (kalau diisi) dibandingkan sebagai
// plaintext seperti biasa; kalau tidak diisi, dibandingkan
// terhadap hash default di atas (plaintext-nya tidak pernah
// disimpan di sini).
function passwordMatches(password) {

    if (process.env.ADMIN_PASSWORD) {
        return safeEqual(password, process.env.ADMIN_PASSWORD);
    }

    const given = sha(password);
    const expected = Buffer.from(DEFAULT_PASSWORD_HASH, "hex");

    return given.length === expected.length && crypto.timingSafeEqual(given, expected);

}

function signingSecret() {

    if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET;
    if (process.env.ADMIN_PASSWORD) return sha("smansasoo-admin|" + process.env.ADMIN_PASSWORD).toString("hex");

    return DEFAULT_SESSION_SECRET;

}

function signToken(payload) {

    const body = b64url(JSON.stringify(payload));
    const mac = crypto.createHmac("sha256", signingSecret()).update(body).digest();

    return body + "." + b64url(mac);

}

/* ==========================================
   VERIFIKASI TOKEN (dipakai GET di bawah,
   dan di-export untuk endpoint lain)
========================================== */

function verifyAdmin(req) {

    const header = String(req.headers.authorization || "");
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    const parts = token.split(".");

    if (parts.length !== 2) return { ok: false, configured: true };

    const expected = crypto.createHmac("sha256", signingSecret()).update(parts[0]).digest();
    let given;

    try {
        given = Buffer.from(parts[1], "base64url");
    } catch (e) {
        return { ok: false, configured: true };
    }

    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
        return { ok: false, configured: true };
    }

    let payload;

    try {
        payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    } catch (e) {
        return { ok: false, configured: true };
    }

    if (!payload || !payload.exp || Math.floor(Date.now() / 1000) >= payload.exp) {
        return { ok: false, configured: true };
    }

    return { ok: true, configured: true, username: payload.u, expiresAt: payload.exp };

}

/* ==========================================
   LOGIN (POST) -- pembatas percobaan gagal
========================================== */

function clientIp(req) {

    const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();

    return forwarded || (req.socket && req.socket.remoteAddress) || "unknown";

}

async function upstash(commands) {

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) return null;

    try {

        const response = await fetch(url.replace(/\/$/, "") + "/pipeline", {
            method: "POST",
            headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify(commands)
        });

        if (!response.ok) return null;

        return await response.json();

    } catch (e) {

        return null;

    }

}

async function getFails(key) {

    const data = await upstash([["GET", key]]);

    if (data && data[0]) return Number(data[0].result) || 0;

    const entry = memFails.get(key);

    if (!entry || Date.now() > entry.reset) return 0;

    return entry.count;

}

async function addFail(key) {

    const data = await upstash([["INCR", key], ["EXPIRE", key, WINDOW_SECONDS]]);

    if (data) return;

    const entry = memFails.get(key);

    if (!entry || Date.now() > entry.reset) {
        memFails.set(key, { count: 1, reset: Date.now() + WINDOW_SECONDS * 1000 });
    } else {
        entry.count++;
    }

}

async function clearFails(key) {

    await upstash([["DEL", key]]);
    memFails.delete(key);

}

function readBody(req) {

    let body = req.body;

    if (typeof body === "string") {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    return body && typeof body === "object" ? body : {};

}

async function handleLogin(req, res) {

    const adminUser = adminUsername();

    const key = "adminfail:" + clientIp(req);

    if ((await getFails(key)) >= MAX_FAILS) {
        return res.status(429).json({
            success: false,
            message: "Terlalu banyak percobaan gagal. Coba lagi dalam 10 menit."
        });
    }

    const body = readBody(req);
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    // keduanya selalu dihitung (tanpa short-circuit) supaya waktu respons seragam
    const userOk = safeEqual(username, adminUser);
    const passOk = passwordMatches(password);

    if (!(userOk && passOk)) {

        await addFail(key);
        await new Promise((resolve) => setTimeout(resolve, 500));

        return res.status(401).json({ success: false, message: "Username atau password salah." });

    }

    await clearFails(key);

    const now = Math.floor(Date.now() / 1000);
    const exp = now + TTL_SECONDS;

    return res.status(200).json({
        success: true,
        token: signToken({ u: adminUser, iat: now, exp }),
        expiresAt: exp,
        username: adminUser
    });

}

function handleVerify(req, res) {

    const result = verifyAdmin(req);

    if (!result.ok) {
        return res.status(401).json({ valid: false });
    }

    return res.status(200).json({ valid: true, username: result.username, expiresAt: result.expiresAt });

}

module.exports = async function handler(req, res) {

    res.setHeader("Cache-Control", "no-store");

    if (req.method === "POST") return handleLogin(req, res);
    if (req.method === "GET") return handleVerify(req, res);

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ success: false, message: "Metode tidak diizinkan." });

};

module.exports.verifyAdmin = verifyAdmin;
