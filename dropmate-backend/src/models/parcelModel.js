import db from "./db.js";

export async function listParcels() {
  // make sure this matches your actual table name
  const result = await db.query("SELECT * FROM shipments ORDER BY created_at DESC");
  return result.rows;
}

export async function updateParcelStatus(id, status) {
  const result = await db.query(
    "UPDATE shipments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
    [status, id]
  );
  return result.rows[0];
}
