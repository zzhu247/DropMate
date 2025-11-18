import axios from 'axios';
import { LOCATION_URL, TIMEOUT } from './env';

/**
 * Location Service API Client
 * Handles driver GPS tracking and location history
 * Backend: services/location-service (port 8081)
 */
export const locationClient = axios.create({
  baseURL: LOCATION_URL,
  timeout: TIMEOUT,
});

/**
 * Location Service API Endpoints
 */
export const locationService = {
  /**
   * Record driver GPS location
   * POST /api/location/:driverId
   */
  async recordLocation(
    driverId: number,
    data: {
      latitude: number;
      longitude: number;
      accuracy: number;
    }
  ) {
    const response = await locationClient.post(`/api/location/${driverId}`, data);
    return response.data;
  },

  /**
   * Get latest driver location
   * GET /api/location/:driverId/latest
   */
  async getLatestLocation(driverId: number) {
    const response = await locationClient.get<{
      latitude: number;
      longitude: number;
      accuracy: number;
      timestamp: string;
    }>(`/api/location/${driverId}/latest`);
    return response.data;
  },

  /**
   * Get driver location history
   * GET /api/location/:driverId/history
   */
  async getLocationHistory(
    driverId: number,
    options?: {
      limit?: number;
      since?: string; // ISO timestamp
    }
  ) {
    const response = await locationClient.get<{
      driverId: number;
      count: number;
      locations: Array<{
        latitude: number;
        longitude: number;
        accuracy: number;
        timestamp: string;
      }>;
    }>(`/api/location/${driverId}/history`, {
      params: options,
    });
    return response.data;
  },

  /**
   * Get shipment's current location (driver location)
   * GET /api/location/shipment/:shipmentId
   */
  async getShipmentLocation(shipmentId: number) {
    const response = await locationClient.get<{
      shipment_id: number;
      tracking_number: string;
      shipment_status: string;
      driver_id: number | null;
      driver_name: string | null;
      vehicle_type: string | null;
      current_location: {
        latitude: number;
        longitude: number;
        accuracy: number;
        timestamp: string;
      } | null;
      message?: string;
    }>(`/api/location/shipment/${shipmentId}`);
    return response.data;
  },
};
