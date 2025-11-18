export const shipmentKeys = {
  all: ['shipments'] as const,
  list: (filters?: { query?: string; status?: string }) =>
    ['shipments', filters?.query ?? 'all', filters?.status ?? 'all'] as const,
  detail: (id: string) => ['shipments', 'detail', id] as const,
  route: (id: string) => ['shipments', 'route', id] as const,
};

export const userKeys = {
  all: ['user'] as const,
  profile: () => ['user', 'profile'] as const,
  stats: () => ['user', 'stats'] as const,
};
