import { getClassSummary } from "../../lib/sheetService";

export default async function handler(req, res) {
  const kelas = req.query.kelas || "SEMUA";
  const mapel = req.query.mapel || "WAJIB";

  const result = await getClassSummary(kelas, mapel);
  return res.status(200).json(result);
}
