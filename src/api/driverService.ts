import { apiClient } from './client';
import type {
  RegisterDriverInput,
  RegisterDriverResponse,
  UpdateDriverProfileInput,
  Driver,
  AvailablePackagesResponse,
  ClaimPackageResponse,
  DriverDeliveriesResponse,
  UpdateDeliveryStatusInput,
  AddDeliveryEventInput,
  AddDeliveryEventResponse,
  ShipmentStatus,
} from '@/types/backend';

/**
 * Driver Service
 * Handles all driver-related API calls
 * All endpoints require Firebase authentication with driver role
 */
export const driverService = {
  /**
   * Register as a driver (converts customer account to driver)
   * POST /api/users/me/register-driver
   */
  async registerAsDriver(data: RegisterDriverInput): Promise<RegisterDriverResponse> {
    const response = await apiClient.post<RegisterDriverResponse>(
      '/api/users/me/register-driver',
      data
    );
    return response.data;
  },

  /**
   * Update driver profile
   * PATCH /api/users/me/driver-profile
   */
  async updateProfile(data: UpdateDriverProfileInput): Promise<{ message: string; driver: Driver }> {
    const response = await apiClient.patch<{ message: string; driver: Driver }>(
      '/api/users/me/driver-profile',
      data
    );
    return response.data;
  },

  /**
   * Get available packages to claim
   * GET /api/users/me/available-packages
   */
  async getAvailablePackages(limit: number = 50): Promise<AvailablePackagesResponse> {
    const response = await apiClient.get<AvailablePackagesResponse>(
      '/api/users/me/available-packages',
      {
        params: { limit },
      }
    );
    return response.data;
  },

  /**
   * Claim a package
   * POST /api/users/me/packages/:id/claim
   */
  async claimPackage(packageId: number): Promise<ClaimPackageResponse> {
    const response = await apiClient.post<ClaimPackageResponse>(
      `/api/users/me/packages/${packageId}/claim`
    );
    return response.data;
  },

  /**
   * Get driver's deliveries
   * GET /api/users/me/deliveries
   * Optional status filter: assigned, in_transit, delivered
   */
  async getDeliveries(status?: ShipmentStatus): Promise<DriverDeliveriesResponse> {
    const response = await apiClient.get<DriverDeliveriesResponse>('/api/users/me/deliveries', {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  /**
   * Update delivery status
   * PATCH /api/users/me/deliveries/:id/status
   */
  async updateDeliveryStatus(
    deliveryId: number,
    data: UpdateDeliveryStatusInput
  ): Promise<{
    message: string;
    delivery: {
      id: number;
      tracking_number: string;
      status: ShipmentStatus;
      updated_at: string;
    };
  }> {
    const response = await apiClient.patch(
      `/api/users/me/deliveries/${deliveryId}/status`,
      data
    );
    return response.data;
  },

  /**
   * Add delivery event/note
   * POST /api/users/me/deliveries/:id/events
   */
  async addDeliveryEvent(
    deliveryId: number,
    data: AddDeliveryEventInput
  ): Promise<AddDeliveryEventResponse> {
    const response = await apiClient.post<AddDeliveryEventResponse>(
      `/api/users/me/deliveries/${deliveryId}/events`,
      data
    );
    return response.data;
  },
};
