import apiClient from '@/lib/api/client';

export type NearbyDiscoveryItem = {
  id: string;
  title: string;
  type: 'Creator' | 'Video';
  distanceKm: number;
  latitude: number;
  longitude: number;
  imageUrl: string;
  subtitle: string;
  targetId: string;
  targetType: 'user' | 'video';
};

type NearbyDiscoveryResponse = {
  success: boolean;
  area: string | null;
  items: NearbyDiscoveryItem[];
};

export const NearbyService = {
  async getNearbyDiscovery(params: {
    latitude: number;
    longitude: number;
    area?: string;
    limit?: number;
  }): Promise<NearbyDiscoveryItem[]> {
    const response = await apiClient.get<NearbyDiscoveryResponse>('/explore/nearby', {
      params,
    });

    return response.data.items || [];
  },
};
