import { apiClient } from './client';
import type {
  User,
  UserStats,
  UpdateUserProfileInput,
  OrderWithShipments,
  ShipmentWithLocation,
  ShipmentHistoryResponse,
  CreateShipmentInput,
  CreateShipmentResponse,
} from '@/types/backend';

/**
 * User Service
 * Handles all user-related API calls (customer features)
 * All endpoints require Firebase authentication
 */
export const userService = {
  /**
   * Get current user profile
   * GET /api/users/me
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/api/users/me');
    return response.data;
  },

  /**
   * Update user profile (name, phone)
   * PATCH /api/users/me
   */
  async updateProfile(data: UpdateUserProfileInput): Promise<User> {
    const response = await apiClient.patch<User>('/api/users/me', data);
    return response.data;
  },

  /**
   * Get user statistics
   * GET /api/users/me/stats
   */
  async getStats(): Promise<UserStats> {
    const response = await apiClient.get<UserStats>('/api/users/me/stats');
    return response.data;
  },

  /**
   * Get user's orders with shipments
   * GET /api/users/me/orders
   */
  async getOrders(): Promise<OrderWithShipments[]> {
    const response = await apiClient.get<OrderWithShipments[]>('/api/users/me/orders');
    return response.data;
  },

  /**
   * Get user's shipments with live tracking
   * GET /api/users/me/shipments
   * @param filters - Optional filters for status or package_status
   */
  async getShipments(filters?: {
    status?: string;
    package_status?: string;
  }): Promise<ShipmentWithLocation[]> {
    const response = await apiClient.get<ShipmentWithLocation[]>('/api/users/me/shipments', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get specific shipment with live location
   * GET /api/users/me/shipments/:id
   */
  async getShipment(id: number): Promise<ShipmentWithLocation> {
    const response = await apiClient.get<ShipmentWithLocation>(`/api/users/me/shipments/${id}`);
    return response.data;
  },

  /**
   * Get shipment event history (customer-friendly view)
   * GET /api/users/me/shipments/:id/history
   */
  async getShipmentHistory(id: number): Promise<ShipmentHistoryResponse> {
    const response = await apiClient.get<ShipmentHistoryResponse>(
      `/api/users/me/shipments/${id}/history`
    );
    return response.data;
  },

  /**
   * Create a new shipment/package
   * POST /api/users/me/shipments
   *
   * Supports two formats:
   * 1. Legacy: { pickupAddress, deliveryAddress, totalAmount }
   * 2. Enhanced: { sender: {...}, receiver: {...}, package: {...}, totalAmount }
   */
  async createShipment(data: CreateShipmentInput): Promise<CreateShipmentResponse> {
    const response = await apiClient.post<CreateShipmentResponse>(
      '/api/users/me/shipments',
      data
    );
    return response.data;
  },

  /**
   * Delete/cancel a shipment
   * DELETE /api/users/me/shipments/:id
   * Only allowed for pending or delivered shipments
   */
  async deleteShipment(
    id: number
  ): Promise<{ message: string; shipment_id: number; tracking_number: string; deleted_at: string }> {
    const response = await apiClient.delete(`/api/users/me/shipments/${id}`);
    return response.data;
  },

  /**
   * Register device push notification token
   * POST /api/users/me/push-token
   * Stores the Expo push token for sending notifications
   */
  async registerPushToken(token: string): Promise<{ message: string; token: string }> {
    console.log('🔵 [API] Calling registerPushToken endpoint...');
    console.log('🔵 [API] Token:', token.substring(0, 30) + '...');

    try {
      const response = await apiClient.post<{ message: string; token: string }>(
        '/api/users/me/push-token',
        { token }
      );
      console.log('✅ [API] registerPushToken success:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('🔴 [API] registerPushToken failed');
      console.error('🔴 [API] Status:', error.response?.status);
      console.error('🔴 [API] Response:', error.response?.data);
      console.error('🔴 [API] Message:', error.message);
      throw error;
    }
  },

  /**
   * Unregister device push notification token
   * DELETE /api/users/me/push-token
   */
  async unregisterPushToken(token: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>('/api/users/me/push-token', {
      data: { token },
    });
    return response.data;
  },
};
