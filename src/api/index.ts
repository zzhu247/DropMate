/**
 * Central API Exports
 * Import all API services from here
 */

// Core API client (with auth)
export { apiClient } from './client';

// Service clients
export { userService } from './userService';
export { driverService } from './driverService';
export { locationService } from './locationClient';
export { notificationService } from './notificationClient';

// Shipments service (uses userService under the hood)
export { getShipmentsService } from './serviceFactory';
export type { IShipmentsService } from './IShipmentsService';

// Configuration
export { BASE_URL, LOCATION_URL, NOTIFICATION_URL, USE_HTTP, TIMEOUT } from './env';

// Adapters
export { backendShipmentToUI, backendShipmentsToUI } from './adapters';
