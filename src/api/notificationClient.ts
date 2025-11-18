import { io, Socket } from 'socket.io-client';
import { AppState, AppStateStatus } from 'react-native';
import { NOTIFICATION_URL } from './env';
import { showShipmentStatusNotification, showDriverProximityNotification } from '@/services/notificationService';
import type { Shipment, ShipmentStatus } from '@/types/backend';

/**
 * Notification Service WebSocket Client
 * Handles real-time updates for shipments and driver locations
 * Backend: services/notification-service (port 8082)
 */

export type DriverLocationUpdate = {
  driverId: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
};

export type ShipmentLocationUpdate = {
  shipmentId: number;
  driverId: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
};

export type ShipmentStatusUpdate = {
  shipmentId: number;
  status: ShipmentStatus;
  shipment: Shipment;
  timestamp: string;
};

export type NotificationEventHandlers = {
  onConnected?: (data: { message: string; socketId: string; timestamp: string }) => void;
  onDriverLocationUpdate?: (data: DriverLocationUpdate) => void;
  onShipmentLocationUpdate?: (data: ShipmentLocationUpdate) => void;
  onShipmentStatusUpdate?: (data: ShipmentStatusUpdate) => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
};

class NotificationService {
  private socket: Socket | null = null;
  private handlers: NotificationEventHandlers = {};
  private isAppInBackground = false;

  constructor() {
    // Track app state for background notifications
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    this.isAppInBackground = nextAppState === 'background' || nextAppState === 'inactive';
  };

  /**
   * Connect to the notification service WebSocket
   */
  connect(handlers: NotificationEventHandlers = {}) {
    if (this.socket?.connected) {
      console.log('[NotificationService] Already connected');
      return this.socket;
    }

    this.handlers = handlers;

    // Convert http(s) URL to ws(s)
    const wsUrl = NOTIFICATION_URL.replace(/^http/, 'ws');

    this.socket = io(wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Event listeners
    this.socket.on('connected', (data) => {
      console.log('[NotificationService] Connected:', data);
      this.handlers.onConnected?.(data);
    });

    this.socket.on('driver_location_updated', (data: DriverLocationUpdate) => {
      console.log('[NotificationService] Driver location update:', data);
      this.handlers.onDriverLocationUpdate?.(data);
    });

    this.socket.on('shipment_location_updated', (data: ShipmentLocationUpdate) => {
      console.log('[NotificationService] Shipment location update:', data);
      this.handlers.onShipmentLocationUpdate?.(data);
    });

    // New: Listen for shipment status updates
    this.socket.on('shipment_status_updated', (data: ShipmentStatusUpdate) => {
      console.log('[NotificationService] Shipment status update:', data);
      this.handlers.onShipmentStatusUpdate?.(data);

      // Show push notification if app is in background
      if (this.isAppInBackground) {
        showShipmentStatusNotification(data.shipment, data.status);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('[NotificationService] Disconnected');
      this.handlers.onDisconnect?.();
    });

    this.socket.on('error', (error: Error) => {
      console.error('[NotificationService] Error:', error);
      this.handlers.onError?.(error);
    });

    return this.socket;
  }

  /**
   * Subscribe to driver location updates
   */
  subscribeToDriver(driverId: number) {
    if (!this.socket?.connected) {
      console.warn('[NotificationService] Not connected. Call connect() first.');
      return;
    }

    console.log(`[NotificationService] Subscribing to driver ${driverId}`);
    this.socket.emit('subscribe:driver', driverId);
  }

  /**
   * Unsubscribe from driver location updates
   */
  unsubscribeFromDriver(driverId: number) {
    if (!this.socket?.connected) {
      return;
    }

    console.log(`[NotificationService] Unsubscribing from driver ${driverId}`);
    this.socket.emit('unsubscribe:driver', driverId);
  }

  /**
   * Subscribe to shipment location updates
   */
  subscribeToShipment(shipmentId: number) {
    if (!this.socket?.connected) {
      console.warn('[NotificationService] Not connected. Call connect() first.');
      return;
    }

    console.log(`[NotificationService] Subscribing to shipment ${shipmentId}`);
    this.socket.emit('subscribe:shipment', shipmentId);
  }

  /**
   * Unsubscribe from shipment location updates
   */
  unsubscribeFromShipment(shipmentId: number) {
    if (!this.socket?.connected) {
      return;
    }

    console.log(`[NotificationService] Unsubscribing from shipment ${shipmentId}`);
    this.socket.emit('unsubscribe:shipment', shipmentId);
  }

  /**
   * Disconnect from the notification service
   */
  disconnect() {
    if (this.socket) {
      console.log('[NotificationService] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.socket?.connected ?? false;
  }

  /**
   * Calculate distance between two coordinates (in km) using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check driver proximity and show notification if nearby
   * @param driverLocation Driver's current location
   * @param deliveryLocation Delivery destination
   * @param shipment Shipment data
   * @param proximityThresholdKm Distance threshold in km (default: 1km)
   */
  checkDriverProximity(
    driverLocation: { latitude: number; longitude: number },
    deliveryLocation: { latitude: number; longitude: number },
    shipment: Shipment,
    proximityThresholdKm: number = 1
  ) {
    const distance = this.calculateDistance(
      driverLocation.latitude,
      driverLocation.longitude,
      deliveryLocation.latitude,
      deliveryLocation.longitude
    );

    // If driver is within threshold and app is in background
    if (distance <= proximityThresholdKm && this.isAppInBackground) {
      // Estimate minutes based on average speed (30 km/h)
      const estimatedMinutes = Math.round((distance / 30) * 60);
      showDriverProximityNotification(shipment, estimatedMinutes);
    }

    return distance;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
