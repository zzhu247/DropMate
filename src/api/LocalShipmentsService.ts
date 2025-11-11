import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

import { IShipmentsService, ListShipmentsOptions, CreateShipmentInput, ShipmentRoute } from './IShipmentsService';
import shipmentsSeed from './seed/shipments.json';
import routesSeed from './seed/routes.json';
import { Shipment } from '@/types';
import { sleep } from '@/utils/sleep';

const STORAGE_KEYS = {
  shipments: '@dropmate/shipments/v2',
  routes: '@dropmate/routes/v2',
  seeded: '@dropmate/seeded/v2',
};

const seededShipments = shipmentsSeed as Shipment[];
const seededRoutes = routesSeed as Record<string, ShipmentRoute>;

const latency = () => 250 + Math.random() * 350;

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export class LocalShipmentsService implements IShipmentsService {
  private ensureSeededPromise?: Promise<void>;

  private async ensureSeeded(): Promise<void> {
    if (!this.ensureSeededPromise) {
      this.ensureSeededPromise = (async () => {
        const alreadySeeded = await AsyncStorage.getItem(STORAGE_KEYS.seeded);
        if (!alreadySeeded) {
          await AsyncStorage.multiSet([
            [STORAGE_KEYS.shipments, JSON.stringify(seededShipments)],
            [STORAGE_KEYS.routes, JSON.stringify(seededRoutes)],
            [STORAGE_KEYS.seeded, 'true'],
          ]);
        }
      })();
    }

    await this.ensureSeededPromise;
  }

  private async loadShipments(): Promise<Shipment[]> {
    await this.ensureSeeded();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.shipments);
    if (!raw) {
      return [...seededShipments];
    }

    try {
      const parsed = JSON.parse(raw) as Shipment[];
      return parsed.sort((a, b) => (dayjs(b.lastUpdatedIso).valueOf() - dayjs(a.lastUpdatedIso).valueOf()));
    } catch (_error) {
      return [...seededShipments];
    }
  }

  private async loadRoutes(): Promise<Record<string, ShipmentRoute>> {
    await this.ensureSeeded();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.routes);
    if (!raw) {
      return { ...seededRoutes };
    }

    try {
      return JSON.parse(raw) as Record<string, ShipmentRoute>;
    } catch (_error) {
      return { ...seededRoutes };
    }
  }

  private async persistShipments(shipments: Shipment[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.shipments, JSON.stringify(shipments));
  }

  private async persistRoutes(routes: Record<string, ShipmentRoute>): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.routes, JSON.stringify(routes));
  }

  async list(options?: ListShipmentsOptions): Promise<Shipment[]> {
    await sleep(latency());
    const shipments = await this.loadShipments();

    const query = options?.query?.toLowerCase().trim();
    const statusFilter = options?.status;

    const filtered = shipments.filter((shipment) => {
      const matchesQuery = query
        ? [shipment.trackingNo, shipment.nickname ?? '', shipment.carrier]
            .join(' ')
            .toLowerCase()
            .includes(query)
        : true;
      const matchesStatus = statusFilter ? shipment.status === statusFilter : true;
      return matchesQuery && matchesStatus;
    });

    return filtered;
  }

  async get(id: string): Promise<Shipment | undefined> {
    await sleep(latency());
    const shipments = await this.loadShipments();
    return shipments.find((shipment) => shipment.id === id);
  }

  async create(input: CreateShipmentInput): Promise<Shipment> {
    await sleep(latency());
    const shipments = await this.loadShipments();

    const now = new Date().toISOString();

    const newShipment: Shipment = {
      id: generateId(),
      trackingNo: input.trackingNo.trim(),
      carrier: input.carrier,
      nickname: input.nickname?.trim() || undefined,
      itemDescription: input.itemDescription?.trim() || undefined,
      status: 'CREATED',
      checkpoints: [
        {
          code: 'CREATED',
          label: 'Label created',
          timeIso: now,
          location: input.origin?.address || 'Pending origin scan',
        },
      ],
      etaIso: undefined,
      lastUpdatedIso: now,
      origin: input.origin,
      destination: input.destination,
    };

    const nextShipments = [newShipment, ...shipments];
    await this.persistShipments(nextShipments);

    const routes = await this.loadRoutes();
    // If we have origin and destination, initialize route with coordinates
    const coordinates = [];
    if (input.origin) {
      coordinates.push({ lat: input.origin.lat, lng: input.origin.lng });
    }
    if (input.destination) {
      coordinates.push({ lat: input.destination.lat, lng: input.destination.lng });
    }
    routes[newShipment.id] = { coordinates };
    await this.persistRoutes(routes);

    return newShipment;
  }

  async delete(id: string): Promise<void> {
    await sleep(latency());
    const shipments = await this.loadShipments();
    const nextShipments = shipments.filter((shipment) => shipment.id !== id);
    await this.persistShipments(nextShipments);

    const routes = await this.loadRoutes();
    if (routes[id]) {
      delete routes[id];
      await this.persistRoutes(routes);
    }
  }

  async markAsDelivered(id: string): Promise<Shipment | undefined> {
    await sleep(latency());
    const shipments = await this.loadShipments();
    const target = shipments.find((shipment) => shipment.id === id);

    if (!target) {
      return undefined;
    }

    const now = new Date().toISOString();
    const hasDeliveredCheckpoint = target.checkpoints.some(
      (checkpoint) => checkpoint.code === 'DELIVERED',
    );

    const updatedCheckpoints = hasDeliveredCheckpoint
      ? target.checkpoints
      : [
          ...target.checkpoints,
          {
            code: 'DELIVERED' as const,
            label: 'Delivered',
            timeIso: now,
            location: target.checkpoints[target.checkpoints.length - 1]?.location,
          },
        ];

    const updatedShipment: Shipment = {
      ...target,
      status: 'DELIVERED',
      lastUpdatedIso: now,
      checkpoints: updatedCheckpoints,
      etaIso: undefined,
    };

    const nextShipments = shipments.map((shipment) =>
      shipment.id === id ? updatedShipment : shipment,
    );

    await this.persistShipments(nextShipments);

    return updatedShipment;
  }

  async getRoute(id: string): Promise<ShipmentRoute> {
    await sleep(latency());
    const routes = await this.loadRoutes();
    return routes[id] ?? { coordinates: [] };
  }
}

let instance: LocalShipmentsService | undefined;

export const getLocalShipmentsService = (): LocalShipmentsService => {
  if (!instance) {
    instance = new LocalShipmentsService();
  }

  return instance;
};
