import { userService } from './userService';
import { locationService } from './locationClient';
import { backendShipmentToUI, backendShipmentsToUI } from './adapters';
import type {
  CreateShipmentInput,
  IShipmentsService,
  ListShipmentsOptions,
  ShipmentRoute,
} from './IShipmentsService';
import type { Shipment } from '@/types/shipment';

/**
 * HTTP Shipments Service
 * Uses real backend API instead of local storage or seed data
 */
export class HttpShipmentsService implements IShipmentsService {
  /**
   * List user's shipments from backend
   * GET /api/users/me/shipments
   */
  async list(options?: ListShipmentsOptions): Promise<Shipment[]> {
    try {
      // Fetch all shipments from backend
      // Note: Backend filtering will be added in the future
      const backendShipments = await userService.getShipments();

      // Convert to UI format
      let uiShipments = backendShipmentsToUI(backendShipments);

      // Apply client-side status filter
      if (options?.status) {
        uiShipments = uiShipments.filter((shipment) => shipment.status === options.status);
      }

      // Apply client-side search filter
      if (options?.query) {
        const query = options.query.toLowerCase().trim();
        uiShipments = uiShipments.filter((shipment) =>
          [shipment.trackingNo, shipment.nickname ?? '', shipment.itemDescription ?? '']
            .join(' ')
            .toLowerCase()
            .includes(query)
        );
      }

      // Sort by last updated (most recent first)
      uiShipments.sort((a, b) =>
        new Date(b.lastUpdatedIso).getTime() - new Date(a.lastUpdatedIso).getTime()
      );

      return uiShipments;
    } catch (error) {
      console.error('[HttpShipmentsService] Failed to list shipments:', error);
      throw error;
    }
  }

  /**
   * Get a single shipment by ID
   * GET /api/users/me/shipments/:id
   */
  async get(id: string): Promise<Shipment | undefined> {
    try {
      const shipmentId = parseInt(id, 10);
      if (isNaN(shipmentId)) {
        console.error('[HttpShipmentsService] Invalid shipment ID:', id);
        return undefined;
      }

      const backendShipment = await userService.getShipment(shipmentId);
      return backendShipmentToUI(backendShipment);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return undefined;
      }
      console.error('[HttpShipmentsService] Failed to get shipment:', error);
      throw error;
    }
  }

  /**
   * Create a new shipment
   * POST /api/users/me/shipments
   *
   * Maps UI CreateShipmentInput to backend CreateShipmentEnhanced format
   */
  async create(input: CreateShipmentInput): Promise<Shipment> {
    try {
      // Map UI input to backend format
      const backendInput = {
        sender: {
          name: 'Customer', // Will be filled from user profile on backend
          phone: '', // Will be filled from user profile
          address: input.origin?.address || 'Pickup location',
          latitude: input.origin?.lat,
          longitude: input.origin?.lng,
        },
        receiver: {
          name: input.nickname || 'Recipient',
          phone: '',
          address: input.destination?.address || 'Delivery location',
          latitude: input.destination?.lat,
          longitude: input.destination?.lng,
        },
        package: {
          description: input.itemDescription,
        },
        totalAmount: 0, // Will be calculated on backend or set by pricing logic
      };

      const result = await userService.createShipment(backendInput);

      // Convert response to UI format
      return backendShipmentToUI(result.shipment);
    } catch (error) {
      console.error('[HttpShipmentsService] Failed to create shipment:', error);
      throw error;
    }
  }

  /**
   * Delete/cancel a shipment
   * DELETE /api/users/me/shipments/:id
   */
  async delete(id: string): Promise<void> {
    try {
      const shipmentId = parseInt(id, 10);
      if (isNaN(shipmentId)) {
        throw new Error(`Invalid shipment ID: ${id}`);
      }

      await userService.deleteShipment(shipmentId);
    } catch (error) {
      console.error('[HttpShipmentsService] Failed to delete shipment:', error);
      throw error;
    }
  }

  /**
   * Get shipment route (coordinates for map)
   * This combines pickup, delivery, and current driver location
   */
  async getRoute(id: string): Promise<ShipmentRoute> {
    try {
      const shipmentId = parseInt(id, 10);
      if (isNaN(shipmentId)) {
        return { coordinates: [] };
      }

      // Get shipment with current location
      const backendShipment = await userService.getShipment(shipmentId);

      const coordinates: Array<{ lat: number; lng: number }> = [];

      // Add pickup location
      if (backendShipment.pickup_latitude && backendShipment.pickup_longitude) {
        coordinates.push({
          lat: backendShipment.pickup_latitude,
          lng: backendShipment.pickup_longitude,
        });
      }

      // Add current driver location (if in transit)
      if (backendShipment.current_location) {
        coordinates.push({
          lat: backendShipment.current_location.latitude,
          lng: backendShipment.current_location.longitude,
        });
      }

      // Add delivery location
      if (backendShipment.delivery_latitude && backendShipment.delivery_longitude) {
        coordinates.push({
          lat: backendShipment.delivery_latitude,
          lng: backendShipment.delivery_longitude,
        });
      }

      return { coordinates };
    } catch (error) {
      console.error('[HttpShipmentsService] Failed to get route:', error);
      return { coordinates: [] };
    }
  }
}

let instance: HttpShipmentsService | undefined;

export const getHttpShipmentsService = (): HttpShipmentsService => {
  if (!instance) {
    instance = new HttpShipmentsService();
  }

  return instance;
};
