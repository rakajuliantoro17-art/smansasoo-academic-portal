import { searchStudentByNIS } from "../../lib/sheetService";

export default async function handler(req, res) {
  const nis = req.method === "POST" ? req.body?.nis : req.query.nis;

  if (!nis) {
    return res.status(400).json({ status: "error", message: "Parameter 'nis' wajib diisi." });
  }

  const result = await searchStudentByNIS(nis);
  return res.status(200).json(result);
}
