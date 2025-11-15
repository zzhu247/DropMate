# DropMate Backend Architecture Summary

## Overview
DropMate is a delivery management system designed for small businesses to manage orders, drivers, and customers with real-time tracking capabilities. The project uses a **hybrid architecture** combining a monolithic Express.js backend with TypeScript-based microservices.

---

## Project Structure

```
DropMate/
├── dropmate-backend/          # Main Express.js monolithic backend
│   ├── src/
│   │   ├── models/           # Database models & data access layer
│   │   ├── routes/           # API route handlers
│   │   ├── websocket/        # WebSocket server setup
│   │   └── server.js         # Application entry point
│   └── .env                  # Environment configuration
│
├── services/                  # Microservices (TypeScript)
│   ├── api-gateway/          # API Gateway with HTTP proxy & WebSocket
│   ├── identity-service/     # Authentication & user management
│   └── order-service/        # Order management service
│
├── db/schema/                # PostgreSQL database schemas
├── compose/                  # Docker Compose configurations
└── openapi/                  # API specifications
```

---

## How Connections Work

### 1. Database Connections

**Technology:** PostgreSQL with connection pooling (pg library)

**Configuration** (`dropmate-backend/src/models/db.js`):
- **Connection String:** `postgresql://postgres:admin123@localhost:5432/dropmate`
- **Pool-based:** Efficient connection reuse across all requests
- **SSL Support:** Configurable via `DATABASE_SSL` environment variable
- **Port:** 5432 (PostgreSQL default)

**Connection Code:**
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false
});

const db = {
  query: (text, params) => pool.query(text, params),
  pool,
};
```

**Database Schema:**
- **Partitioned Tables:** `ad_impressions`, `driver_location_events`, `shipment_events`, `webhook_events`
- **Main Tables:** `drivers`, `orders`, `shipments`, `message_threads`, `messages`
- **Deployment:** Docker container with auto-initialization from schema files

### 2. HTTP API Connections

#### Main Backend (Port 8080)
**Framework:** Express.js with CORS and JSON parsing middleware

**Request Flow:**
```
Client → Express Server (8080) → Route Handler → Model Function → PostgreSQL → Response
```

**Key Routes:**
- `/api/drivers` - Driver management & GPS tracking
- `/api/shipments` - Shipment tracking & status updates
- `/api/messages` - Thread-based messaging system
- `/api/orders` - Order management

#### Microservices Architecture (Port 4000)
**API Gateway** (`services/api-gateway/src/index.ts`):
- Proxies requests to backend services using `http-proxy-middleware`
- **Timeout:** 5000ms per service call
- **Security:** Helmet, CORS, compression, request logging
- **Error Handling:** Returns 502 Bad Gateway on service failure

**Service Routing:**
- `/api/v1/auth/*` → Identity Service (port 4001)
- `/api/v1/orders/*` → Order Service (port 4002)

**Proxy Configuration:**
```typescript
app.use("/api/v1/auth", createProxyMiddleware({
  target: "http://identity-service:4001",
  changeOrigin: true,
  timeout: 5000
}));
```

### 3. WebSocket Connections

#### Main Backend WebSocket (Socket.IO)
**Location:** `dropmate-backend/src/server.js`
**Port:** 8080 (same as HTTP)
**Library:** Socket.IO v4.7.5

**Real-Time Events:**
1. `driver_status_updated` - Driver availability changes
2. `driver_location_updated` - GPS location updates
3. `new_message` - New messages in threads
4. `shipment_updated` - Shipment status changes

**Implementation:**
```javascript
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", socket => {
  console.log("Client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});

// Broadcasting from route handlers
req.app.get("io").emit("driver_location_updated", { driverId, latitude, longitude });
```

#### API Gateway WebSocket
**Path:** `/ws`
**Library:** Native WebSocket (ws)
**Behavior:** Echo server that broadcasts to all clients

---

## Data Flow Examples

### 1. Driver Location Update Flow
```
Driver App → POST /api/drivers/:id/location
           → driverModel.addDriverLocationEvent()
           → INSERT INTO driver_location_events
           → WebSocket emit("driver_location_updated")
           → All connected clients receive update
           → Dashboard maps update in real-time
```

### 2. Message Posting Flow
```
User → POST /api/messages/threads/:id
     → messagesModel.createMessage()
     → INSERT INTO messages
     → WebSocket emit("new_message")
     → All thread participants notified instantly
```

### 3. Authentication Flow (Microservices)
```
Client → POST /api/v1/auth/login
       → API Gateway (4000)
       → Identity Service (4001)
       → Validate credentials
       → Generate JWT token
       → Return { token, user }
       → Client stores token
       → Subsequent requests include "Authorization: Bearer <token>"
```

---

## API Endpoints

### Main Backend (http://localhost:8080)

#### Drivers
- **GET** `/api/drivers` - List all active drivers with last known location
- **PATCH** `/api/drivers/:id/status` - Update driver status (active/on_duty/offline)
- **POST** `/api/drivers/:id/location` - Record GPS location (triggers WebSocket event)

#### Shipments
- **GET** `/api/shipments` - List all shipments with order data
- **PATCH** `/api/shipments/:id/status` - Update shipment status (triggers WebSocket event)

#### Messages
- **GET** `/api/messages/threads` - List all message threads
- **GET** `/api/messages/threads/:id` - Get messages in a thread
- **POST** `/api/messages/threads` - Create new thread
- **POST** `/api/messages/threads/:id` - Send message (triggers WebSocket event)

#### Orders
- **GET** `/api/orders` - List all orders

### Microservices (http://localhost:4000)

#### Authentication
- **POST** `/api/v1/auth/register` - User registration
- **POST** `/api/v1/auth/login` - User login (returns JWT)
- **GET** `/api/v1/auth/profile` - Get authenticated user profile

#### Orders
- **GET** `/api/v1/orders` - List all orders
- **GET** `/api/v1/orders/:id` - Get specific order
- **POST** `/api/v1/orders` - Create new order
- **PATCH** `/api/v1/orders/:id/assign` - Assign driver to order
- **PATCH** `/api/v1/orders/:id/status` - Update order status

---

## Database Models

### Drivers (`models/driverModel.js`)
```sql
drivers (
  id UUID PRIMARY KEY,
  name VARCHAR,
  vehicle_type VARCHAR,
  license_number VARCHAR,
  status VARCHAR,  -- 'active', 'on_duty', 'offline'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

driver_location_events (
  id SERIAL PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id),
  latitude DECIMAL,
  longitude DECIMAL,
  occurred_at TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (occurred_at)
```

**Functions:**
- `listDrivers()` - Returns drivers with latest GPS coordinates
- `updateDriverStatus(id, status)` - Updates availability
- `addDriverLocationEvent(driverId, lat, lng)` - Logs GPS ping

### Shipments (`models/shipmentsModel.js`)
```sql
shipments (
  id UUID PRIMARY KEY,
  status VARCHAR,
  tracking_number VARCHAR,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Functions:**
- `listShipments()` - Returns shipments with LEFT JOIN on orders
- `updateShipmentStatus(id, status)` - Updates status with timestamp

### Messages (`models/messagesModel.js`)
```sql
message_threads (
  id UUID PRIMARY KEY,
  subject VARCHAR,
  context_type VARCHAR,  -- 'order', 'shipment', etc.
  context_id UUID,
  created_by UUID,
  created_at TIMESTAMP
)

messages (
  id UUID PRIMARY KEY,
  thread_id UUID REFERENCES message_threads(id),
  author_user_id UUID,
  author_driver_id UUID,
  body TEXT,
  sent_at TIMESTAMP
)
```

**Functions:**
- `listThreads()` - Returns threads with message counts
- `getMessagesByThread(threadId)` - Returns messages in chronological order
- `createThread(subject, contextType, contextId, createdBy)` - Creates new thread
- `createMessage(threadId, authorUserId, body)` - Adds message to thread

### Orders (`models/orderModel.js`)
```sql
orders (
  id UUID PRIMARY KEY,
  customer_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Functions:**
- `listOrders()` - Returns all orders sorted by creation date

**⚠️ Known Issue:** Import path incorrect (`'../database/db.js'` should be `'./db.js'`)

---

## Authentication & Security

### JWT-Based Authentication
**Implementation:** Identity Service (`services/identity-service/src/index.ts`)

**Token Structure:**
```javascript
jwt.sign(
  { sub: user.id, role: user.role, email: user.email },
  JWT_SECRET,
  { expiresIn: "1h" }
)
```

**User Roles:**
- `manager` - Business managers (create/manage orders)
- `driver` - Delivery drivers (fulfill orders)
- `customer` - End customers (track deliveries)

**Security Configurations:**
- **JWT Secret:** `super_secret_change_me` (main backend), `dev-secret` (microservices)
- **Token Expiration:** 1 hour (no refresh mechanism)
- **CORS:** Currently allows all origins (`*`)
- **Security Headers:** Helmet middleware on API Gateway

### ⚠️ Security Gaps
1. **Plain Text Passwords:** Identity service stores passwords without hashing
2. **No Auth Middleware:** Main backend has JWT dependencies but no implementation
3. **In-Memory Storage:** Identity service users stored in Map (non-persistent)
4. **Unprotected WebSockets:** No token validation on socket connections

---

## Technology Stack

### Main Backend
- **Runtime:** Node.js 20 (ES Modules)
- **Framework:** Express.js 4.19.2
- **Database:** PostgreSQL 16 (via pg 8.11.3)
- **WebSocket:** Socket.IO 4.7.5
- **Security:** CORS, bcrypt (unused), jsonwebtoken (unused)

### Microservices
- **Language:** TypeScript
- **Framework:** Express.js 4.19.2
- **Security:** Helmet, JWT
- **Proxy:** http-proxy-middleware 3.0.3
- **WebSocket:** ws (native)

### Infrastructure
- **Database:** PostgreSQL 16 with partitioning
- **Cache:** Redis (configured but unused)
- **Containerization:** Docker with multi-stage builds
- **Orchestration:** Docker Compose
- **Database Admin:** pgAdmin (port 5050)

---

## Environment Configuration

### Main Backend (.env)
```bash
PORT=8080
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/dropmate
DATABASE_SSL=false
JWT_SECRET=super_secret_change_me
```

### Docker Compose Services
- **api-gateway:** Port 4000
- **identity-service:** Port 4001 (JWT_SECRET=dev-secret)
- **order-service:** Port 4002
- **postgres:** Port 5432 (user: dropmate, password: dropmate)
- **redis:** Port 6379
- **backend:** Port 8080
- **pgadmin:** Port 5050

---

## Deployment

### Docker Configuration
**Main Backend Dockerfile:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY src ./src
EXPOSE 8080
CMD ["node", "src/server.js"]
```

**Microservices:** Multi-stage builds with TypeScript compilation

### Orchestration
- **Development:** Docker Compose
- **Production Target:** Kubernetes on Fly.io (planned)
- **Monitoring:** Prometheus + Grafana (planned)

---

## Critical Issues & Gaps

### 🔴 Critical Issues
1. **Broken Import:** `orderModel.js` has incorrect database path
2. **Non-Persistent Data:** Microservices use in-memory Maps (data lost on restart)
3. **No Authentication:** Main backend lacks JWT middleware implementation
4. **Security Vulnerabilities:** Plain text passwords, no bcrypt usage, CORS allows all

### 🟡 Incomplete Features
1. **Auth Routes:** Only stub implementation exists
2. **Order Model:** Missing create/update functions
3. **Redis Integration:** Configured but not used in code
4. **Database Schema:** Only partitioning SQL, no main schema file
5. **WebSocket Auth:** No token validation on connections

### 🟠 Architecture Inconsistencies
1. **Dual Backends:** Unclear which is primary (monolith vs microservices)
2. **Data Storage Split:** Monolith uses PostgreSQL, microservices use memory
3. **No Service Communication:** Microservices don't interact with main backend
4. **Port Management:** Both systems run independently (8080 vs 4000)

---

## Design Patterns Used

### Repository Pattern
- Models abstract database queries from route handlers
- Routes call model functions instead of raw SQL

### Proxy Pattern
- API Gateway proxies requests to backend services
- Enables service discovery and centralized routing

### Event-Driven Pattern
- WebSocket events for real-time updates
- Decouples data changes from UI updates

### Connection Pooling
- PostgreSQL pool manages database connections
- Improves performance and resource utilization

---

## Recommendations

### Immediate Priorities
1. **Fix Import Path:** Correct `orderModel.js` database import
2. **Implement Authentication:** Add JWT middleware to main backend
3. **Add Password Hashing:** Implement bcrypt in identity service
4. **Persistent Storage:** Connect microservices to PostgreSQL
5. **Database Schema:** Create complete schema initialization script

### Short-term Improvements
1. **Input Validation:** Add request validation middleware
2. **Error Handling:** Implement centralized error handler
3. **WebSocket Auth:** Validate JWT tokens on socket connections
4. **Redis Integration:** Use for caching and pub/sub
5. **Monitoring:** Add logging and observability

### Long-term Architecture
1. **Consolidate Backends:** Choose monolith or microservices
2. **Service Mesh:** Implement service-to-service communication
3. **API Versioning:** Formalize API version strategy
4. **Rate Limiting:** Add request throttling
5. **Comprehensive Testing:** Unit, integration, and e2e tests

---

## Development Setup

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16

### Running Locally

**Main Backend:**
```bash
cd dropmate-backend
npm install
npm run dev  # Uses nodemon for auto-reload
```

**Microservices:**
```bash
docker-compose up -d  # Starts all services
```

**Database:**
```bash
cd compose
docker-compose up -d  # Starts PostgreSQL + pgAdmin
```

### Accessing Services
- Main Backend: http://localhost:8080
- API Gateway: http://localhost:4000
- pgAdmin: http://localhost:5050
- PostgreSQL: localhost:5432

---

## Connection Summary

### How Everything Connects

1. **Clients** connect to either:
   - Main backend (8080) for driver/shipment/message operations
   - API Gateway (4000) for authentication and orders

2. **Main Backend** connects to:
   - PostgreSQL via connection pool
   - Clients via Socket.IO WebSocket

3. **API Gateway** connects to:
   - Identity Service (HTTP proxy)
   - Order Service (HTTP proxy)
   - Clients via WebSocket (/ws endpoint)

4. **Database** is accessed by:
   - Main backend (persistent storage)
   - Microservices (NOT YET - using memory instead)

5. **Real-time Updates** flow:
   - Data change → Model function → Database
   - Route handler → WebSocket emit
   - All connected clients receive broadcast

---

## Current Project State

**Development Stage:** Early development with functional prototypes

**Working Features:**
- Express backend with PostgreSQL
- Real-time WebSocket updates
- Basic CRUD for drivers, shipments, messages
- Docker containerization
- API Gateway with service routing

**In Progress:**
- Authentication system
- Order management
- Complete database schema

**Not Started:**
- Monitoring/observability
- Comprehensive testing
- Production deployment
- Service-to-service communication

---

*Last Updated: 2025-11-14*
