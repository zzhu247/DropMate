import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  USE_HTTP?: boolean;
  BASE_URL?: string;
  LOCATION_URL?: string;
  NOTIFICATION_URL?: string;
  TIMEOUT?: number;
};

const envUseHttp = process.env.EXPO_PUBLIC_USE_HTTP;
const envBaseUrl = process.env.EXPO_PUBLIC_BASE_URL;
const envLocationUrl = process.env.EXPO_PUBLIC_LOCATION_URL;
const envNotificationUrl = process.env.EXPO_PUBLIC_NOTIFICATION_URL;
const envTimeout = process.env.EXPO_PUBLIC_TIMEOUT;

const parseBoolean = (value: string | boolean | undefined): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return false;
};

export const USE_HTTP = envUseHttp !== undefined ? parseBoolean(envUseHttp) : extra.USE_HTTP ?? false;
export const BASE_URL = envBaseUrl ?? extra.BASE_URL ?? 'https://api.dropmate.dev';
export const LOCATION_URL = envLocationUrl ?? extra.LOCATION_URL ?? BASE_URL;
export const NOTIFICATION_URL = envNotificationUrl ?? extra.NOTIFICATION_URL ?? BASE_URL;
export const TIMEOUT =
  envTimeout !== undefined ? Number(envTimeout) : extra.TIMEOUT ?? 8000;
