import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DriverState = {
  isDriverMode: boolean;
  driverId?: string;
  driverName?: string;
  vehicleInfo?: {
    type: string;
    plateNumber: string;
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  setDriverMode: (enabled: boolean) => void;
  setDriverInfo: (driverId: string, driverName: string) => void;
  setVehicleInfo: (type: string, plateNumber: string) => void;
  updateLocation: (latitude: number, longitude: number) => void;
  clearDriverData: () => void;
};

export const useDriver = create<DriverState>()(
  persist(
    (set) => ({
      isDriverMode: false,
      driverId: undefined,
      driverName: undefined,
      vehicleInfo: undefined,
      currentLocation: undefined,

      setDriverMode: (enabled) => set({ isDriverMode: enabled }),

      setDriverInfo: (driverId, driverName) =>
        set({ driverId, driverName }),

      setVehicleInfo: (type, plateNumber) =>
        set({ vehicleInfo: { type, plateNumber } }),

      updateLocation: (latitude, longitude) =>
        set({ currentLocation: { latitude, longitude } }),

      clearDriverData: () =>
        set({
          isDriverMode: false,
          driverId: undefined,
          driverName: undefined,
          vehicleInfo: undefined,
          currentLocation: undefined,
        }),
    }),
    {
      name: 'driver-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
