/*
==========================================================
SMANSASOO Academic Portal
GET /api/admin-verify
==========================================================
Memeriksa token admin dari header:  Authorization: Bearer <token>

Respon: 200 { valid: true,  username, expiresAt }
        401 { valid: false }
        503 { valid: false, configured: false }

Untuk melindungi endpoint LAIN (mis. yang menulis absensi),
salin fungsi verifyAdmin() di bawah ke file endpoint itu dan
panggil di awal handler -- lihat panduan di docs/ADMIN-AUTH.md.
==========================================================
*/

const crypto = require("crypto");

function sha(value) {

    return crypto.createHash("sha256").update(String(value)).digest();

}

function signingSecret() {

    return process.env.ADMIN_SESSION_SECRET
        || sha("smansasoo-admin|" + process.env.ADMIN_PASSWORD).toString("hex");

}

function verifyAdmin(req) {

    if (!process.env.ADMIN_PASSWORD) return { ok: false, configured: false };

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
