/*
==========================================================
SMANSASOO Academic Portal
POST /api/admin-login
==========================================================
Cek username + password admin DI SERVER, lalu kembalikan token
bertanda tangan (HMAC-SHA256) yang berlaku 8 jam. Username dan
password TIDAK ada di source code: keduanya dibaca dari
Environment Variable Vercel.

Environment Variable:
  ADMIN_USERNAME        wajib   mis. admin
  ADMIN_PASSWORD        wajib
  ADMIN_SESSION_SECRET  opsional (string acak panjang). Kalau
                        kosong, rahasia penanda tangan diturunkan
                        dari ADMIN_PASSWORD.

Perlindungan tebak password: maksimal 5 gagal per IP per 10
menit (disimpan di Upstash kalau UPSTASH_REDIS_REST_* terisi,
kalau tidak, di memori instance -- cukup sebagai pengaman dasar).

Body  : { "username": "...", "password": "..." }
Respon: 200 { success, token, expiresAt, username }
        401 salah | 429 terlalu banyak percobaan
        503 belum dikonfigurasi di server
==========================================================
*/

const crypto = require("crypto");

const TTL_SECONDS = 8 * 60 * 60;
const MAX_FAILS = 5;
const WINDOW_SECONDS = 10 * 60;

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

function signingSecret() {

    return process.env.ADMIN_SESSION_SECRET
        || sha("smansasoo-admin|" + process.env.ADMIN_PASSWORD).toString("hex");

}

function signToken(payload) {

    const body = b64url(JSON.stringify(payload));
    const mac = crypto.createHmac("sha256", signingSecret()).update(body).digest();

    return body + "." + b64url(mac);

}

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

module.exports = async function handler(req, res) {

    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ success: false, message: "Metode tidak diizinkan." });
    }

    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (!adminUser || !adminPass) {
        return res.status(503).json({
            success: false,
            configured: false,
            message: "Login admin belum dikonfigurasi (ADMIN_USERNAME / ADMIN_PASSWORD belum diatur di Vercel)."
        });
    }

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
    const passOk = safeEqual(password, adminPass);

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

};
