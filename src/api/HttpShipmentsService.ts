import { apiClient } from './client';
import {
  CreateShipmentInput,
  IShipmentsService,
  ListShipmentsOptions,
  ShipmentRoute,
} from './IShipmentsService';
import shipmentsSeed from './seed/shipments.json';
import routesSeed from './seed/routes.json';
import { Shipment } from '@/types';
import { sleep } from '@/utils/sleep';

const seededShipments = shipmentsSeed as Shipment[];
const seededRoutes = routesSeed as Record<string, ShipmentRoute>;

const latency = () => 250 + Math.random() * 350;

export class HttpShipmentsService implements IShipmentsService {
  async list(_options?: ListShipmentsOptions): Promise<Shipment[]> {
    await sleep(latency());

    // TODO: Replace stub with GET /shipments call once backend is ready.
    // const response = await apiClient.get<Shipment[]>('/shipments', { params: options });
    // return response.data;
    return [...seededShipments];
  }

  async get(id: string): Promise<Shipment | undefined> {
    await sleep(latency());

    // TODO: Replace stub with GET /shipments/{id} call.
    // const response = await apiClient.get<Shipment>(`/shipments/${id}`);
    // return response.data;
    return seededShipments.find((shipment) => shipment.id === id);
  }

  async create(input: CreateShipmentInput): Promise<Shipment> {
    await sleep(latency());

    // TODO: Replace stub with POST /shipments.
    // When backend is ready, the API should accept the full input including origin, destination, and itemDescription
    // const response = await apiClient.post<Shipment>('/shipments', input);
    // return response.data;
    const now = new Date().toISOString();
    return {
      id: `pending-${Date.now()}`,
      trackingNo: input.trackingNo,
      carrier: input.carrier,
      nickname: input.nickname,
      itemDescription: input.itemDescription,
      status: 'CREATED',
      checkpoints: [
        {
          code: 'CREATED',
          label: 'Label created',
          timeIso: now,
          location: input.origin?.address,
        },
      ],
      lastUpdatedIso: now,
      origin: input.origin,
      destination: input.destination,
    };
  }

  async delete(id: string): Promise<void> {
    await sleep(latency());

    // TODO: Replace stub with DELETE /shipments/{id}.
    // await apiClient.delete(`/shipments/${id}`);

    void id; // no-op placeholder until backend is connected.
  }

  async getRoute(id: string): Promise<ShipmentRoute> {
    await sleep(latency());

    // TODO: Replace stub with GET /shipments/{id}/location.
    // const response = await apiClient.get<ShipmentRoute>(`/shipments/${id}/location`);
    // return response.data;
    return seededRoutes[id] ?? { coordinates: [] };
  }
}

let instance: HttpShipmentsService | undefined;

export const getHttpShipmentsService = (): HttpShipmentsService => {
  if (!instance) {
    instance = new HttpShipmentsService();
  }

  return instance;
};
