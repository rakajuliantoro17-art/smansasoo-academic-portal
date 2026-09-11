import Head from "next/head";
import { useState, useEffect } from "react";

export default function Home() {
  const [tab, setTab] = useState("nis");

  return (
    <>
      <Head>
        <title>Dashboard Rekap Nilai Math Wajib & Lanjutan</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-8">
        <div className="bg-indigo-700 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">Portal Nilai Matematika</h1>
            <p className="text-indigo-200 text-sm mt-1">Kelas XI - Wajib & Lanjutan SMAN 1 Sooko</p>
          </div>
          <div className="flex bg-indigo-800 p-1 rounded-xl">
            <button
              onClick={() => setTab("nis")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                tab === "nis" ? "bg-white text-indigo-700 shadow" : "text-indigo-200 hover:text-white"
              }`}
            >
              Cari Per NIS
            </button>
            <button
              onClick={() => setTab("kelas")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                tab === "kelas" ? "bg-white text-indigo-700 shadow" : "text-indigo-200 hover:text-white"
              }`}
            >
              Rata-Rata Kelas
            </button>
          </div>
        </div>

        {tab === "nis" ? <TabNIS /> : <TabKelas />}
      </div>
    </>
  );
}

function TabNIS() {
  const [nisInput, setNisInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null); // array of subject objects
  const [activeIndex, setActiveIndex] = useState(0);

  async function cariSiswa() {
    const nis = nisInput.trim();
    if (!nis) {
      alert("Masukkan NIS terlebih dahulu!");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await fetch(`/api/search-nis?nis=${encodeURIComponent(nis)}`);
      const json = await res.json();
      if (json.status === "error") {
        setErrorMsg(json.message);
        setStudentData(null);
      } else {
        setStudentData(json.data);
        setActiveIndex(0);
      }
    } catch (e) {
      setErrorMsg("Terjadi kesalahan: " + e.message);
      setStudentData(null);
    } finally {
      setLoading(false);
    }
  }

  const activeSubject = studentData ? studentData[activeIndex] : null;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Cari Berdasarkan NIS Siswa:
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={nisInput}
            onChange={(e) => setNisInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && cariSiswa()}
            placeholder="Masukkan NIS (contoh: 17233)..."
            className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button
            onClick={cariSiswa}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition whitespace-nowrap"
          >
            {loading ? "Mencari..." : "Cari"}
          </button>
        </div>
        {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
      </div>

      {studentData && activeSubject && (
        <div className="space-y-6">
          {studentData.length > 1 && (
            <div className="flex gap-2">
              {studentData.map((item, index) => (
                <button
                  key={item.mapel}
                  onClick={() => setActiveIndex(index)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                    index === activeIndex
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  {item.mapel}
                </button>
              ))}
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <div className="flex gap-2 mb-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                  Kelas {activeSubject.kelas}
                </span>
                <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full">
                  {activeSubject.mapel}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800">{activeSubject.nama}</h2>
              <p className="text-slate-500 text-sm mt-1">
                NIS: <span className="font-medium text-slate-700">{activeSubject.nis}</span>
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl text-center shadow-xs">
              <span className="text-xs font-extrabold text-emerald-800 tracking-wider uppercase">
                Nilai Raport
              </span>
              <div className="text-4xl font-black text-emerald-600 mt-1">
                {activeSubject.nilaiRaport}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-700">Progress Kelengkapan Nilai</span>
              <span className="text-lg font-black text-indigo-600">{activeSubject.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
              <div
                className="bg-indigo-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${activeSubject.progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              <span className="font-bold text-slate-700">{activeSubject.completedCount}</span> dari{" "}
              <span className="font-bold text-slate-700">{activeSubject.totalAssessments}</span>{" "}
              komponen penilaian tuntas.
            </p>
          </div>

          {activeSubject.missingList.length > 0 && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-5 rounded-r-2xl">
              <h3 className="text-rose-800 font-bold text-sm">⚠️ Belum Ada Nilai / Belum Selesai:</h3>
              <ul className="list-disc list-inside text-rose-700 text-sm mt-2 space-y-1 font-medium">
                {activeSubject.missingList.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
            <h3 className="font-bold text-slate-800 mb-4">Rincian Komponen Nilai</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Komponen Penilaian</th>
                  <th className="py-3 px-4">Nilai</th>
                  <th className="py-3 px-4">Remedial</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {activeSubject.details.map((item) => {
                  const isDone = item.status === "Selesai";
                  return (
                    <tr key={item.code}>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-slate-500">{item.code}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{item.name}</td>
                      <td className={`py-3 px-4 font-bold ${isDone ? "text-slate-700" : "text-rose-500"}`}>
                        {item.score}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{item.remed}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            isDone ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TabKelas() {
  const [mapel, setMapel] = useState("WAJIB");
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState("SEMUA");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listLoaded, setListLoaded] = useState(false);

  async function ensureClassListLoaded() {
    if (listLoaded) return;
    const res = await fetch("/api/class-list");
    const list = await res.json();
    setKelasList(Array.isArray(list) ? list : []);
    setListLoaded(true);
  }

  async function loadClassSummary() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/class-summary?kelas=${encodeURIComponent(selectedKelas)}&mapel=${encodeURIComponent(mapel)}`
      );
      const json = await res.json();
      if (json.status === "error") {
        alert(json.message);
        setSummary(null);
      } else {
        setSummary(json.data);
      }
    } catch (e) {
      alert("Terjadi kesalahan: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  // Muat daftar kelas begitu tab ini pertama kali dibuka
  useEffect(() => {
    ensureClassListLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800">Analisis Rata-Rata Kelas</h3>
          <p className="text-xs text-slate-500">Pilih Mata Pelajaran & Kelas</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={mapel}
            onChange={(e) => setMapel(e.target.value)}
            className="px-3 py-2 border rounded-xl font-semibold text-slate-700 text-sm"
          >
            <option value="WAJIB">Math Wajib</option>
            <option value="LANJUTAN">Math Lanjutan</option>
          </select>
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="px-3 py-2 border rounded-xl font-semibold text-slate-700 text-sm"
          >
            <option value="SEMUA">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <button
            onClick={loadClassSummary}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700"
          >
            {loading ? "Memuat..." : "Tampilkan"}
          </button>
        </div>
      </div>

      {summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Rerata Raport" value={summary.avgRaport} color="text-emerald-600" />
            <MetricCard label="Rerata UTS" value={summary.avgUTS} color="text-indigo-600" />
            <MetricCard label="Rerata SAS" value={summary.avgSAS} color="text-blue-600" />
            <MetricCard label="Rerata Progress" value={`${summary.avgProgress}%`} color="text-amber-500" />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4">NIS</th>
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Raport</th>
                  <th className="py-3 px-4">UTS</th>
                  <th className="py-3 px-4">SAS</th>
                  <th className="py-3 px-4">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {summary.students.map((st) => (
                  <tr key={st.nis}>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-slate-500">{st.nis}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{st.nama}</td>
                    <td className="py-3 px-4 text-xs font-bold text-indigo-600">{st.kelas}</td>
                    <td className="py-3 px-4 font-extrabold text-emerald-600">{st.raport}</td>
                    <td className="py-3 px-4 font-bold text-slate-700">{st.uts}</td>
                    <td className="py-3 px-4 font-bold text-slate-700">{st.sas}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          st.progress === 100
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {st.progress}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border text-center">
      <span className="text-xs font-bold text-slate-400">{label}</span>
      <div className={`text-3xl font-black mt-1 ${color}`}>{value}</div>
    </div>
  );
}
