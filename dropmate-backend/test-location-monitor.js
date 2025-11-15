/**
 * Location Monitor
 * Connects to WebSocket and displays live driver location updates
 */

import { io } from 'socket.io-client';

const API_URL = 'http://localhost:8080';

console.log('📡 Driver Location Monitor Started');
console.log('===================================\n');

// Connect to WebSocket
const socket = io(API_URL);

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log(`   Socket ID: ${socket.id}\n`);

  // Subscribe to all driver updates
  socket.emit('subscribe_all_drivers');
  console.log('📻 Subscribed to all driver updates');
  console.log('   Waiting for location updates...\n');
});

socket.on('disconnect', () => {
  console.log('\n❌ Disconnected from WebSocket server');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.log('   Make sure the backend server is running on port 8080\n');
});

// Listen for driver location updates
socket.on('driver_location_updated', (data) => {
  const time = new Date().toLocaleTimeString();
  console.log(`\n🚗 Driver Location Update Received`);
  console.log(`   Driver ID: ${data.driverId}`);
  console.log(`   📍 Latitude:  ${data.latitude}`);
  console.log(`   📍 Longitude: ${data.longitude}`);
  console.log(`   ⏰ Time: ${time}`);
  console.log('   ────────────────────────────────');
});

// Listen for driver status updates
socket.on('driver_status_updated', (driver) => {
  const time = new Date().toLocaleTimeString();
  console.log(`\n👤 Driver Status Update`);
  console.log(`   Driver ID: ${driver.id}`);
  console.log(`   Name: ${driver.name}`);
  console.log(`   Status: ${driver.status}`);
  console.log(`   ⏰ Time: ${time}`);
  console.log('   ────────────────────────────────');
});

// Listen for order assignments
socket.on('order_assigned', (data) => {
  const time = new Date().toLocaleTimeString();
  console.log(`\n📦 Order Assignment`);
  console.log(`   Order ID: ${data.orderId}`);
  console.log(`   Driver ID: ${data.driverId}`);
  console.log(`   Status: ${data.status}`);
  console.log(`   ⏰ Time: ${time}`);
  console.log('   ────────────────────────────────');
});

console.log('\nPress Ctrl+C to stop monitoring\n');
