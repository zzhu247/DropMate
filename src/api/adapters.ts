/**
 * Data Adapters
 * Maps between backend API format and UI format
 */

import type { ShipmentWithLocation, ShipmentStatus } from '@/types/backend';
import type { Shipment, Checkpoint, LocationPoint } from '@/types/shipment';

/**
 * Map backend shipment status or package_status to UI checkpoint code
 * Prioritizes package_status if available for more accurate tracking
 */
const mapStatusToCheckpointCode = (
  status: ShipmentStatus,
  packageStatus?: string | null
): Checkpoint['code'] => {
  // Use package_status if available (more specific)
  if (packageStatus) {
    switch (packageStatus) {
      case 'out_for_delivery':
        return 'OUT_FOR_DELIVERY';
      case 'in_transit':
        return 'IN_TRANSIT';
      case 'delivered':
        return 'DELIVERED';
      case 'exceptions':
        return 'EXCEPTION';
      default:
        break;
    }
  }

  // Fall back to general status
  switch (status) {
    case 'pending':
    case 'assigned':
      return 'CREATED';
    case 'in_transit':
      return 'IN_TRANSIT';
    case 'delivered':
      return 'DELIVERED';
    default:
      return 'CREATED';
  }
};

/**
 * Map backend status/package_status to human-readable label
 */
const mapStatusToLabel = (
  status: ShipmentStatus,
  packageStatus?: string | null
): string => {
  // Use package_status if available (more specific)
  if (packageStatus) {
    switch (packageStatus) {
      case 'out_for_delivery':
        return 'Out for delivery';
      case 'in_transit':
        return 'In transit';
      case 'delivered':
        return 'Delivered';
      case 'exceptions':
        return 'Delivery exception';
      default:
        break;
    }
  }

  // Fall back to general status
  switch (status) {
    case 'pending':
      return 'Package created, waiting for driver';
    case 'assigned':
      return 'Driver assigned';
    case 'in_transit':
      return 'In transit';
    case 'delivered':
      return 'Delivered';
    default:
      return 'Unknown';
  }
};

/**
 * Convert backend shipment to UI shipment format
 */
export const backendShipmentToUI = (backendShipment: ShipmentWithLocation): Shipment => {
  const checkpointCode = mapStatusToCheckpointCode(
    backendShipment.status,
    backendShipment.package_status
  );

  // Build checkpoints from status
  const checkpoints: Checkpoint[] = [
    {
      code: 'CREATED',
      label: 'Package created',
      timeIso: backendShipment.created_at,
      location: backendShipment.pickup_address,
    },
  ];

  // Add additional checkpoints based on status
  if (backendShipment.status === 'assigned' || backendShipment.status === 'in_transit' || backendShipment.status === 'delivered') {
    checkpoints.push({
      code: 'CREATED', // Reuse as "assigned"
      label: `Assigned to ${backendShipment.driver_name || 'driver'}`,
      timeIso: backendShipment.updated_at,
      location: backendShipment.pickup_address,
    });
  }

  if (backendShipment.status === 'in_transit' || backendShipment.status === 'delivered') {
    checkpoints.push({
      code: 'IN_TRANSIT',
      label: 'Out for delivery',
      timeIso: backendShipment.updated_at,
      location: backendShipment.current_location
        ? `Lat: ${backendShipment.current_location.latitude.toFixed(4)}, Lng: ${backendShipment.current_location.longitude.toFixed(4)}`
        : 'In transit',
    });
  }

  if (backendShipment.status === 'delivered') {
    checkpoints.push({
      code: 'DELIVERED',
      label: 'Delivered',
      timeIso: backendShipment.updated_at,
      location: backendShipment.delivery_address,
    });
  }

  // Map origin and destination
  const origin: LocationPoint | undefined = backendShipment.pickup_latitude && backendShipment.pickup_longitude
    ? {
        lat: backendShipment.pickup_latitude,
        lng: backendShipment.pickup_longitude,
        address: backendShipment.pickup_address,
      }
    : undefined;

  const destination: LocationPoint | undefined = backendShipment.delivery_latitude && backendShipment.delivery_longitude
    ? {
        lat: backendShipment.delivery_latitude,
        lng: backendShipment.delivery_longitude,
        address: backendShipment.delivery_address,
      }
    : undefined;

  // Map driver location
  const driverLocation = backendShipment.current_location
    ? {
        lat: backendShipment.current_location.latitude,
        lng: backendShipment.current_location.longitude,
        lastUpdated: backendShipment.current_location.timestamp,
      }
    : undefined;

  return {
    id: backendShipment.id.toString(),
    trackingNo: backendShipment.tracking_number,
    carrier: 'Other', // DropMate is a direct delivery service
    nickname: backendShipment.receiver_name || undefined,
    itemDescription: backendShipment.package_description || undefined,
    status: checkpointCode,
    checkpoints,
    lastUpdatedIso: backendShipment.updated_at,
    origin,
    destination,
    driverLocation,
    senderName: backendShipment.sender_name || undefined,
    senderPhone: backendShipment.sender_phone || undefined,
    receiverName: backendShipment.receiver_name || undefined,
    receiverPhone: backendShipment.receiver_phone || undefined,
  };
};

/**
 * Convert array of backend shipments to UI format
 */
export const backendShipmentsToUI = (backendShipments: ShipmentWithLocation[]): Shipment[] => {
  return backendShipments.map(backendShipmentToUI);
};
