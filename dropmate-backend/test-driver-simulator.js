/**
 * Driver Location Simulator
 * Simulates a driver moving around and sending GPS location updates
 */

import fetch from 'node-fetch';

const DRIVER_ID = 1; // Change this to test different drivers
const API_URL = 'http://localhost:8080';
const UPDATE_INTERVAL = 2000; // Send update every 2 seconds

// Simulate movement around San Francisco
let currentLat = 37.7749;
let currentLng = -122.4194;
const moveSpeed = 0.001; // How much to move per update

console.log('🚗 Driver Location Simulator Started');
console.log(`Driver ID: ${DRIVER_ID}`);
console.log(`Update Interval: ${UPDATE_INTERVAL}ms`);
console.log('=====================================\n');

let updateCount = 0;

async function sendLocationUpdate() {
  // Simulate random movement
  currentLat += (Math.random() - 0.5) * moveSpeed;
  currentLng += (Math.random() - 0.5) * moveSpeed;

  const payload = {
    latitude: parseFloat(currentLat.toFixed(6)),
    longitude: parseFloat(currentLng.toFixed(6))
  };

  try {
    const response = await fetch(`${API_URL}/api/drivers/${DRIVER_ID}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      updateCount++;
      const data = await response.json();
      console.log(`✅ Update #${updateCount} sent successfully`);
      console.log(`   📍 Lat: ${payload.latitude}, Lng: ${payload.longitude}`);
      console.log(`   ⏰ Time: ${new Date(data.occurred_at).toLocaleTimeString()}\n`);
    } else {
      const error = await response.json();
      console.error('❌ Failed to send update:', error);
    }
  } catch (error) {
    console.error('❌ Error sending location update:', error.message);
    console.log('   Make sure the backend server is running on port 8080\n');
  }
}

// Send first update immediately
sendLocationUpdate();

// Then send updates at regular intervals
setInterval(sendLocationUpdate, UPDATE_INTERVAL);

console.log('Press Ctrl+C to stop the simulator\n');
