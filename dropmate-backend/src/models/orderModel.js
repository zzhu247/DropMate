import db from '../database/db.js';

export async function listOrders() {
    const [rows] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    return rows;
}