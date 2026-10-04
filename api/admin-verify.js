/*
==========================================================
SMANSASOO Academic Portal
GET /api/admin-verify
==========================================================
Memeriksa token admin dari header:  Authorization: Bearer <token>

Kredensial (default sementara + cara override lewat Environment
Variable) didokumentasikan di api/admin-login.js dan di
docs/ADMIN-AUTH.md -- signingSecret() di bawah HARUS selalu
sama dengan punya admin-login.js supaya tanda tangan token cocok.

Respon: 200 { valid: true,  username, expiresAt }
        401 { valid: false }

Endpoint lain yang perlu dilindungi (mis. yang menulis absensi)
memakai verifyAdmin() yang di-export di bawah -- lihat panduan
di docs/ADMIN-AUTH.md.
==========================================================
*/

const crypto = require("crypto");

// Harus identik dengan DEFAULT_SESSION_SECRET di api/admin-login.js.
const DEFAULT_SESSION_SECRET = "108c17f07e9b9bf7e1b7de3b8c047120558cc654c0e563a405b5af129ff3c040";

function sha(value) {

    return crypto.createHash("sha256").update(String(value)).digest();

}

function signingSecret() {

    if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET;
    if (process.env.ADMIN_PASSWORD) return sha("smansasoo-admin|" + process.env.ADMIN_PASSWORD).toString("hex");

    return DEFAULT_SESSION_SECRET;

}

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

module.exports = async function handler(req, res) {

    res.setHeader("Cache-Control", "no-store");

    const result = verifyAdmin(req);

    if (!result.configured) {
        return res.status(503).json({ valid: false, configured: false });
    }

    if (!result.ok) {
        return res.status(401).json({ valid: false });
    }

    return res.status(200).json({ valid: true, username: result.username, expiresAt: result.expiresAt });

};

module.exports.verifyAdmin = verifyAdmin;
