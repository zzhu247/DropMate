import express from 'express';
import { listOrders, assignDriverToOrder } from '../models/orderModel.js';

const router = express.Router();

// GET /api/orders → list all orders
router.get('/', async (req, res) => {
  try {
    const orders = await listOrders();
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PATCH /api/orders/:id/assign → assign driver to order
router.patch('/:id/assign', async (req, res) => {
  try {
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({ error: 'driverId is required' });
    }

    const order = await assignDriverToOrder(req.params.id, driverId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Broadcast assignment to WebSocket clients
    const io = req.app.get('io');
    io.to('all-drivers').emit('order_assigned', {
      orderId: order.id,
      driverId: order.driver_id,
      customerId: order.customer_id,
      status: order.status,
    });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign driver' });
  }
});

export default router;