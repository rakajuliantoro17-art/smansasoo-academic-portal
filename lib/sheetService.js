import Papa from "papaparse";

const PUB_ID = process.env.SHEET_PUB_ID;

const SHEET_GIDS = {
  wajib: process.env.SHEET_GID_WAJIB,
  lanjutan: process.env.SHEET_GID_LANJUTAN,
  raport: process.env.SHEET_GID_RAPORT,
};

// Cache sederhana in-memory per instance serverless, biar tidak fetch CSV berkali-kali
// dalam waktu singkat. TTL 60 detik cukup untuk mengurangi rate-limit dari Google.
const cache = new Map();
const CACHE_TTL_MS = 60 * 1000;

async function fetchSheetRows(gid) {
  if (!PUB_ID || !gid) {
    throw new Error(
      "SHEET_PUB_ID atau GID belum diset. Cek file .env.local kamu."
    );
  }

  const cacheKey = `gid-${gid}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
    return cached.rows;
  }

  const url = `https://docs.google.com/spreadsheets/d/e/${PUB_ID}/pub?gid=${gid}&single=true&output=csv`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Gagal mengambil data sheet (gid=${gid}), status: ${res.status}. ` +
        `Pastikan spreadsheet masih dipublish ke web ("File > Share > Publish to web").`
    );
  }
  const text = await res.text();
  const parsed = Papa.parse(text, { skipEmptyLines: false });
  const rows = parsed.data || [];

  cache.set(cacheKey, { rows, time: Date.now() });
  return rows;
}

// Setara cleanNIS() di Code.gs
export function cleanNIS(val) {
  if (val === null || val === undefined) return "";
  const str = String(val).trim();
  return str.indexOf(".") !== -1 ? str.split(".")[0] : str;
}

function toNumber(val) {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function isFilled(val) {
  return val !== "" && val !== null && val !== undefined;
}

// Setara parseSubjectData() di Code.gs
function parseSubjectData(mapelTitle, kelas, nis, nama, assessments, nilaiRaport) {
  let completedCount = 0;
  const missingList = [];
  const detailList = [];

  assessments.forEach((item) => {
    const score = item.val;
    const isDone = isFilled(score) && toNumber(score) > 0;
    if (isDone) {
      completedCount++;
      detailList.push({
        code: item.code,
        name: item.name,
        score,
        remed: item.remed || "-",
        status: "Selesai",
      });
    } else {
      missingList.push(item.name);
      detailList.push({
        code: item.code,
        name: item.name,
        score: 0,
        remed: item.remed || "-",
        status: "Belum Ada Nilai",
      });
    }
  });

  return {
    mapel: mapelTitle,
    kelas,
    nis,
    nama,
    nilaiRaport,
    progress: Math.round((completedCount / assessments.length) * 100),
    completedCount,
    totalAssessments: assessments.length,
    missingList,
    details: detailList,
  };
}

// Setara searchStudentByNIS() di Code.gs
export async function searchStudentByNIS(nisInput) {
  try {
    const targetNIS = cleanNIS(nisInput);

    const [dataW, dataL, dataRaport] = await Promise.all([
      fetchSheetRows(SHEET_GIDS.wajib),
      fetchSheetRows(SHEET_GIDS.lanjutan),
      fetchSheetRows(SHEET_GIDS.raport),
    ]);

    const subjectsResult = [];

    let nilaiRaport = "-";
    for (let j = 1; j < dataRaport.length; j++) {
      if (cleanNIS(dataRaport[j][2]) === targetNIS) {
        const valR = dataRaport[j][4];
        nilaiRaport = isFilled(valR) ? valR : "-";
        break;
      }
    }

    for (let i = 1; i < dataW.length; i++) {
      if (cleanNIS(dataW[i][2]) === targetNIS) {
        const rowW = dataW[i];
        const listW = [
          { code: "BA1", name: "Tugas 1 - Bunga & Anuitas", val: rowW[4] },
          { code: "BA2", name: "Tugas 2 - Bunga & Anuitas", val: rowW[5] },
          { code: "BA3", name: "Tugas 3 - Bunga & Anuitas", val: rowW[6] },
          { code: "BA4", name: "Tugas 4 - Bunga & Anuitas", val: rowW[7] },
          { code: "FK1", name: "Tugas 1 - Fungsi Komposisi", val: rowW[8] },
          { code: "FK2", name: "Tugas 2 - Fungsi Komposisi", val: rowW[9] },
          { code: "FK3", name: "Tugas 3 - Fungsi Komposisi", val: rowW[10] },
          { code: "FK4", name: "Tugas 4 - Fungsi Komposisi", val: rowW[11] },
          { code: "BAUH", name: "UH - Bunga & Anuitas", val: rowW[12], remed: rowW[13] },
          { code: "FKUH", name: "UH - Fungsi Komposisi", val: rowW[14], remed: rowW[15] },
          { code: "UTS", name: "UTS", val: rowW[16] },
          { code: "SAS", name: "SAS", val: rowW[17], remed: rowW[18] },
        ];
        subjectsResult.push(
          parseSubjectData("Matematika Wajib", rowW[1], rowW[2], rowW[3], listW, nilaiRaport)
        );
        break;
      }
    }

    for (let k = 1; k < dataL.length; k++) {
      if (cleanNIS(dataL[k][2]) === targetNIS) {
        const rowL = dataL[k];
        const listL = [
          { code: "P1", name: "Tugas 1 - Polinomial", val: rowL[4] },
          { code: "P2", name: "Tugas 2 - Polinomial", val: rowL[5] },
          { code: "P3", name: "Tugas 3 - Polinomial", val: rowL[6] },
          { code: "P4", name: "Tugas 4 - Polinomial", val: rowL[7] },
          { code: "M1", name: "Tugas 1 - Matriks", val: rowL[8] },
          { code: "M2", name: "Tugas 2 - Matriks", val: rowL[9] },
          { code: "M3", name: "Tugas 3 - Matriks", val: rowL[10] },
          { code: "M4", name: "Tugas 4 - Matriks", val: rowL[11] },
          { code: "PUH", name: "UH - Polinomial", val: rowL[12], remed: rowL[13] },
          { code: "MUH", name: "UH - Matriks", val: rowL[14], remed: rowL[15] },
          { code: "UTS", name: "UTS", val: rowL[16] },
          { code: "SAS", name: "SAS", val: rowL[17], remed: rowL[18] },
        ];
        subjectsResult.push(
          parseSubjectData("Matematika Lanjutan", rowL[1], rowL[2], rowL[3], listL, nilaiRaport)
        );
        break;
      }
    }

    if (subjectsResult.length === 0) {
      return { status: "error", message: `Siswa dengan NIS '${targetNIS}' tidak ditemukan.` };
    }

    return { status: "success", data: subjectsResult };
  } catch (e) {
    return { status: "error", message: e.message || String(e) };
  }
}

// Setara getClassList() di Code.gs
export async function getClassList() {
  try {
    const [dataW, dataL, dataR] = await Promise.all([
      fetchSheetRows(SHEET_GIDS.wajib),
      fetchSheetRows(SHEET_GIDS.lanjutan),
      fetchSheetRows(SHEET_GIDS.raport),
    ]);

    const classes = [];
    [dataW, dataL, dataR].forEach((data) => {
      for (let i = 1; i < data.length; i++) {
        const k = String(data[i][1] || "").trim();
        if (k && k !== "Kelas" && classes.indexOf(k) === -1) {
          classes.push(k);
        }
      }
    });

    return classes.sort();
  } catch (e) {
    return [];
  }
}

// Setara getClassSummary() di Code.gs
export async function getClassSummary(targetKelas, targetMapel) {
  try {
    const gid = targetMapel === "LANJUTAN" ? SHEET_GIDS.lanjutan : SHEET_GIDS.wajib;
    const [data, dR] = await Promise.all([
      fetchSheetRows(gid),
      fetchSheetRows(SHEET_GIDS.raport),
    ]);

    const raportMap = {};
    for (let j = 1; j < dR.length; j++) {
      const nR = cleanNIS(dR[j][2]);
      const valR = dR[j][4];
      if (nR && isFilled(valR)) {
        raportMap[nR] = valR;
      }
    }

    const studentList = [];
    let totalR = 0,
      countR = 0,
      totalUTS = 0,
      countUTS = 0,
      totalSAS = 0,
      countSAS = 0,
      totalProg = 0;

    for (let i = 1; i < data.length; i++) {
      const k = String(data[i][1] || "").trim();
      if (targetKelas === "SEMUA" || k === targetKelas) {
        const nis = cleanNIS(data[i][2]);
        const nama = data[i][3];
        const uts = toNumber(data[i][16]);
        const sas = toNumber(data[i][17]);

        const rVal = raportMap[nis] !== undefined ? raportMap[nis] : "-";
        const numR = parseFloat(rVal);

        let doneCount = 0;
        [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 17].forEach((idx) => {
          if (isFilled(data[i][idx]) && toNumber(data[i][idx]) > 0) doneCount++;
        });
        const prog = Math.round((doneCount / 12) * 100);

        if (!isNaN(numR) && numR > 0) {
          totalR += numR;
          countR++;
        }
        if (uts > 0) {
          totalUTS += uts;
          countUTS++;
        }
        if (sas > 0) {
          totalSAS += sas;
          countSAS++;
        }
        totalProg += prog;

        studentList.push({
          nis,
          nama,
          kelas: k,
          raport: rVal,
          uts: uts > 0 ? uts : "-",
          sas: sas > 0 ? sas : "-",
          progress: prog,
        });
      }
    }

    return {
      status: "success",
      data: {
        totalSiswa: studentList.length,
        avgRaport: countR > 0 ? (totalR / countR).toFixed(1) : "-",
        avgUTS: countUTS > 0 ? (totalUTS / countUTS).toFixed(1) : "-",
        avgSAS: countSAS > 0 ? (totalSAS / countSAS).toFixed(1) : "-",
        avgProgress: studentList.length > 0 ? Math.round(totalProg / studentList.length) : 0,
        students: studentList,
      },
    };
  } catch (e) {
    return { status: "error", message: e.message || String(e) };
  }
}
