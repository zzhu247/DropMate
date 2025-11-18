/**
 * Backend API Type Definitions
 * Matches the DropMate backend database schema and API responses
 */

// ========== User & Authentication ==========

export type UserRole = 'customer' | 'driver' | 'admin';

export type User = {
  id: number;
  email: string;
  role: UserRole;
  firebase_uid: string;
  created_at: string;
  customer_id?: number | null;
  customer_name?: string | null;
  phone?: string | null;
  driver_id?: number | null;
  driver_name?: string | null;
};

export type Customer = {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  created_at: string;
  updated_at: string;
};

export type Driver = {
  id: number;
  user_id: number;
  name: string;
  vehicle_type: string;
  license_number: string;
  status: 'offline' | 'available' | 'on_delivery';
  created_at: string;
  updated_at: string;
};

// ========== Shipments ==========

export type ShipmentStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered';

export type PackageStatus = 'out_for_delivery' | 'in_transit' | 'delivered' | 'exceptions';

export type Shipment = {
  id: number;
  order_id: number;
  driver_id: number | null;
  tracking_number: string;
  status: ShipmentStatus;
  package_status?: PackageStatus | null;
  pickup_address: string;
  delivery_address: string;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  delivery_latitude?: number | null;
  delivery_longitude?: number | null;
  sender_name?: string | null;
  sender_phone?: string | null;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  package_weight?: number | null;
  package_description?: string | null;
  package_details?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  deleted_by_user_id?: number | null;
};

export type ShipmentWithDriver = Shipment & {
  driver_name?: string | null;
  vehicle_type?: string | null;
};

export type ShipmentWithLocation = ShipmentWithDriver & {
  current_location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  } | null;
};

// ========== Orders ==========

export type Order = {
  id: number;
  customer_id: number;
  total_amount: string; // Decimal as string
  status: string;
  created_at: string;
  updated_at: string;
};

export type OrderWithShipments = Order & {
  customer_name: string;
  shipments: ShipmentWithDriver[];
};

// ========== Events ==========

export type ShipmentEventType =
  | 'shipment_created'
  | 'driver_assigned'
  | 'status_change'
  | 'delivery_note'
  | 'pickup_arrival'
  | 'delivery_arrival'
  | 'issue'
  | 'customer_contact'
  | 'location_update';

export type ShipmentEvent = {
  id: number;
  shipment_id: number;
  event_type: ShipmentEventType;
  description: string;
  created_by_user_id?: number | null;
  from_status?: ShipmentStatus | null;
  to_status?: ShipmentStatus | null;
  latitude?: number | null;
  longitude?: number | null;
  metadata?: Record<string, any> | null;
  occurred_at: string;
  user_id?: number;
  user_name?: string;
};

export type DriverLocationEvent = {
  id: number;
  driver_id: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  occurred_at: string;
};

// ========== API Request/Response Types ==========

// User endpoints
export type UserStats = {
  total_orders: number;
  total_shipments: number;
  pending_shipments: number;
  in_transit_shipments: number;
  delivered_shipments: number;
  total_spent: string; // Decimal as string
};

// Create shipment (legacy format)
export type CreateShipmentLegacy = {
  pickupAddress: string;
  deliveryAddress: string;
  totalAmount: number;
};

// Create shipment (enhanced format)
export type CreateShipmentEnhanced = {
  sender: {
    name: string;
    phone: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  receiver: {
    name: string;
    phone: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  package: {
    weight?: number;
    description?: string;
    details?: Record<string, any>;
  };
  totalAmount: number;
};

export type CreateShipmentInput = CreateShipmentLegacy | CreateShipmentEnhanced;

export type CreateShipmentResponse = {
  message: string;
  shipment: ShipmentWithDriver;
};

// Driver registration
export type RegisterDriverInput = {
  name: string;
  vehicleType: string;
  licenseNumber: string;
};

export type RegisterDriverResponse = {
  message: string;
  driver: Driver;
};

// Update driver profile
export type UpdateDriverProfileInput = {
  name?: string;
  vehicleType?: string;
  licenseNumber?: string;
};

// Available packages (for drivers)
export type AvailablePackage = {
  id: number;
  tracking_number: string;
  pickup_address: string;
  delivery_address: string;
  status: ShipmentStatus;
  created_at: string;
  order_id: number;
  total_amount: string;
  customer_name: string;
  customer_phone: string;
};

export type AvailablePackagesResponse = {
  count: number;
  packages: AvailablePackage[];
};

// Claim package
export type ClaimPackageResponse = {
  message: string;
  package: ShipmentWithDriver;
};

// Driver deliveries
export type DeliveryItem = {
  id: number;
  tracking_number: string;
  pickup_address: string;
  delivery_address: string;
  status: ShipmentStatus;
  created_at: string;
  updated_at: string;
  order_id: number;
  total_amount: string;
  customer_name: string;
  customer_phone: string;
};

export type DriverDeliveriesResponse = {
  driverId: number;
  count: number;
  deliveries: DeliveryItem[];
};

// Update delivery status
export type UpdateDeliveryStatusInput = {
  status: 'in_transit' | 'delivered';
};

// Add delivery event
export type AddDeliveryEventInput = {
  eventType: ShipmentEventType;
  description: string;
  latitude?: number;
  longitude?: number;
};

export type AddDeliveryEventResponse = {
  message: string;
  event: ShipmentEvent;
};

// Shipment history
export type ShipmentHistoryResponse = {
  shipmentId: number;
  count: number;
  events: ShipmentEvent[];
};

// Location service types
export type RecordLocationInput = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export type RecordLocationResponse = {
  success: boolean;
  event: DriverLocationEvent;
  broadcastedToShipments: number;
};

export type LatestLocationResponse = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
};

export type LocationHistoryResponse = {
  driverId: number;
  count: number;
  locations: Array<{
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  }>;
};

export type ShipmentLocationResponse = {
  shipment_id: number;
  tracking_number?: string;
  shipment_status?: ShipmentStatus;
  driver_id: number | null;
  driver_name?: string | null;
  vehicle_type?: string | null;
  current_location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  } | null;
  message?: string;
};

// Update user profile
export type UpdateUserProfileInput = {
  name?: string;
  phone?: string;
};
