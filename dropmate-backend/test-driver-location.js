import { io } from "socket.io-client";
import fetch from "node-fetch";

const BACKEND_URL = "http://localhost:8080";
const DRIVER_ID = 1; // Test driver ID

console.log("🚗 Driver Location Live Update Tester");
console.log("=====================================\n");

// Connect to WebSocket server
console.log("📡 Connecting to WebSocket server...");
const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling']
});

socket.on("connect", () => {
  console.log("✅ Connected to WebSocket server");
  console.log(`   Socket ID: ${socket.id}\n`);

  // Subscribe to all driver updates
  console.log("📻 Subscribing to all-drivers room...");
  socket.emit("subscribe_all_drivers");

  // Start simulating location updates
  setTimeout(() => {
    console.log("\n🌍 Starting location simulation...\n");
    simulateMovement();
  }, 1000);
});

socket.on("connect_error", (error) => {
  console.error("❌ Connection error:", error.message);
});

socket.on("disconnect", (reason) => {
  console.log(`\n⚠️  Disconnected: ${reason}`);
});

// Listen for driver location updates
socket.on("driver_location_updated", (data) => {
  console.log(`📍 LIVE UPDATE RECEIVED:`);
  console.log(`   Driver: ${data.driverId}`);
  console.log(`   Location: (${data.latitude}, ${data.longitude})`);
  console.log(`   Time: ${new Date().toLocaleTimeString()}\n`);
});

// Listen for driver status updates
socket.on("driver_status_updated", (data) => {
  console.log(`🔄 STATUS UPDATE RECEIVED:`);
  console.log(`   Driver: ${data.driver_id}`);
  console.log(`   Status: ${data.status}\n`);
});

// Simulate driver movement
let lat = 40.7128; // Starting at NYC
let lng = -74.0060;
let moveCount = 0;

async function simulateMovement() {
  if (moveCount >= 10) {
    console.log("\n✅ Test complete! Sent 10 location updates.");
    console.log("   Press Ctrl+C to exit\n");
    return;
  }

  // Simulate slight movement (like a car driving)
  lat += (Math.random() - 0.5) * 0.001;
  lng += (Math.random() - 0.5) * 0.001;
  moveCount++;

  console.log(`🚀 Sending location update #${moveCount}...`);

  try {
    const response = await fetch(`${BACKEND_URL}/api/drivers/${DRIVER_ID}/location`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        latitude: lat,
        longitude: lng,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`   ❌ Failed: ${error.error || response.statusText}`);
    } else {
      const data = await response.json();
      console.log(`   ✅ Sent to server (ID: ${data.id})`);
    }
  } catch (error) {
    console.error(`   ❌ Request failed: ${error.message}`);
  }

  // Schedule next update in 2 seconds
  setTimeout(simulateMovement, 2000);
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Shutting down...");
  socket.disconnect();
  process.exit(0);
});
