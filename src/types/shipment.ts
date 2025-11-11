export type Checkpoint = {
  code: 'CREATED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION';
  label: string;
  timeIso: string;
  location?: string;
  meta?: Record<string, any>;
};

export type LocationPoint = {
  lat: number;
  lng: number;
  address: string;
};

export type RouteStop = {
  id: string;
  lat: number;
  lng: number;
  address: string;
  completed: boolean;
  order: number;
  completedAt?: string;
};

export type DriverLocation = {
  lat: number;
  lng: number;
  lastUpdated: string;
};

export type Shipment = {
  id: string;
  trackingNo: string;
  carrier: 'UPS' | 'FedEx' | 'DHL' | 'CanadaPost' | 'Other';
  nickname?: string;
  itemDescription?: string;
  status: Checkpoint['code'];
  etaIso?: string;
  checkpoints: Checkpoint[];
  lastUpdatedIso: string;
  origin?: LocationPoint;
  destination?: LocationPoint;
  stops?: RouteStop[];
  driverLocation?: DriverLocation;
};

export type DeliveryItem = {
  id: string;
  shipment: Shipment;
  deliveryAddress: string;
  recipientName?: string;
  priority: 'high' | 'medium' | 'low';
  orderIndex: number;
  estimatedDeliveryTime?: string;
  distance?: number; // in km
  notes?: string;
};
