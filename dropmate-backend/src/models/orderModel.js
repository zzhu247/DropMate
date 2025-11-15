import db from './db.js';

export async function listOrders() {
  const { rows } = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
  return rows;
}

/** Assign a driver to an order */
export async function assignDriverToOrder(orderId, driverId) {
  const { rows } = await db.query(
    `UPDATE orders
        SET driver_id = $1,
            status = 'assigned',
            updated_at = NOW()
      WHERE id = $2
  RETURNING *`,
    [driverId, orderId]
  );
  return rows[0];
}

/** Get active orders for a specific driver */
export async function getDriverActiveOrders(driverId) {
  const { rows } = await db.query(
    `SELECT o.*,
            s.id as shipment_id,
            s.tracking_number,
            s.status as shipment_status
       FROM orders o
       LEFT JOIN shipments s ON s.order_id = o.id
      WHERE o.driver_id = $1
        AND o.status IN ('assigned', 'picked_up', 'in_transit')
      ORDER BY o.created_at ASC`,
    [driverId]
  );
  return rows;
}