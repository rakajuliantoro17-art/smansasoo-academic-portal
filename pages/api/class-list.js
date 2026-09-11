import { getClassList } from "../../lib/sheetService";

export default async function handler(req, res) {
  const classes = await getClassList();
  return res.status(200).json(classes);
}
