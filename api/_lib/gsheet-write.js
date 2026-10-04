/*
==========================================================
SMANSASOO Academic Portal
Shared Library: Google Sheets Writer (Service Account)
Version : 1.0.0
==========================================================
Dipakai khusus oleh fitur yang perlu MENULIS ke Google
Sheets (mis. api/absensi.js mencatat log scan QR), berbeda
dari api/_lib/gsheet.js yang HANYA membaca lewat endpoint
publik gviz/tq.

Menulis ke Google Sheets butuh otorisasi OAuth2, jadi file
ini membuat Service Account JSON Web Token sendiri (pakai
modul "crypto" bawaan Node, TANPA dependency npm tambahan),
menukarnya ke access token Google, lalu memanggil Google
Sheets API v4 (spreadsheets.values.append) langsung lewat
fetch().

SETUP YANG DIPERLUKAN (sekali saja):
1. Buka https://console.cloud.google.com -> buat/pilih
   project -> aktifkan "Google Sheets API".
2. Buat Service Account (IAM & Admin > Service Accounts),
   lalu buat key baru bertipe JSON -- akan terdownload
   sebuah file .json berisi "client_email" & "private_key".
3. Buka spreadsheet absensi di Google Sheets -> klik Share
   -> tambahkan "client_email" dari file JSON itu sebagai
   Editor.
4. Di Vercel -> Project Settings -> Environment Variables,
   tambahkan:
     GOOGLE_SERVICE_ACCOUNT_EMAIL   = nilai "client_email"
     GOOGLE_SERVICE_ACCOUNT_KEY     = nilai "private_key"
       (termasuk baris "-----BEGIN PRIVATE KEY-----" dkk.
       Kalau ditempel sebagai satu baris, ganti tiap baris
       baru dengan karakter "\n" literal -- kode di bawah
       otomatis mengembalikannya jadi baris baru asli.)
5. Redeploy.
==========================================================
*/

const crypto = require("crypto");

function base64url(input) {

    const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);

    return buffer
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

}

let cachedToken = null;
let cachedTokenExpiry = 0;

async function getAccessToken() {

    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!email || !rawKey) {
        throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_KEY belum diatur di Environment Variable Vercel.");
    }

    // Token Google berlaku 1 jam; cache di memori supaya tidak
    // minta token baru di tiap request selama instance function
    // masih "hangat".
    const now = Math.floor(Date.now() / 1000);

    if (cachedToken && cachedTokenExpiry - 60 > now) {
        return cachedToken;
    }

    const privateKey = rawKey.replace(/\\n/g, "\n");

    const header = { alg: "RS256", typ: "JWT" };

    const claim = {
        iss: email,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600
    };

    const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(signingInput);
    signer.end();

    const signature = base64url(signer.sign(privateKey));

    const assertion = `${signingInput}.${signature}`;

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Gagal mendapatkan access token Google (HTTP ${response.status}): ${text}`);
    }

    const data = await response.json();

    cachedToken = data.access_token;
    cachedTokenExpiry = now + (data.expires_in || 3600);

    return cachedToken;

}

/**
 * Menambahkan satu baris baru di AKHIR sheet bernama `sheetName`
 * pada spreadsheet `spreadsheetId`. `rowValues` adalah array
 * nilai kolom, urut dari kolom A.
 */
async function appendRow(spreadsheetId, sheetName, rowValues) {

    const accessToken = await getAccessToken();

    const range = encodeURIComponent(`${sheetName}!A1`);

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ values: [rowValues] })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Gagal menulis ke Google Sheets (HTTP ${response.status}): ${text}`);
    }

    return response.json();

}

module.exports = {
    getAccessToken,
    appendRow
};
