export type Checkpoint = {
  code: 'CREATED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION';
  label: string;
  timeIso: string;
  location?: string;
  meta?: Record<string, any>;
};

export type Shipment = {
  id: string;
  trackingNo: string;
  carrier: 'UPS' | 'FedEx' | 'DHL' | 'CanadaPost' | 'Other';
  nickname?: string;
  status: Checkpoint['code'];
  etaIso?: string;
  checkpoints: Checkpoint[];
  lastUpdatedIso: string;
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
