export type DiscoveryTopic = {
    id: string;
    name: string;
    enabled: boolean;
    featured: boolean;
    order: number;
};

export const DEFAULT_DISCOVERY_TOPICS: DiscoveryTopic[] = [
    { id: 'comedy', name: 'Comedy', enabled: true, featured: true, order: 1 },
    { id: 'music', name: 'Music', enabled: true, featured: true, order: 2 },
    { id: 'dance', name: 'Dance', enabled: true, featured: false, order: 3 },
    { id: 'food', name: 'Food', enabled: true, featured: false, order: 4 },
    { id: 'travel', name: 'Travel', enabled: true, featured: false, order: 5 },
    { id: 'art', name: 'Art', enabled: true, featured: false, order: 6 },
    { id: 'sports', name: 'Sports', enabled: true, featured: false, order: 7 },
    { id: 'gaming', name: 'Gaming', enabled: true, featured: true, order: 8 },
    { id: 'education', name: 'Education', enabled: true, featured: false, order: 9 },
    { id: 'fashion', name: 'Fashion', enabled: true, featured: false, order: 10 },
    { id: 'beauty', name: 'Beauty', enabled: true, featured: false, order: 11 },
    { id: 'pets', name: 'Pets', enabled: true, featured: false, order: 12 },
    { id: 'diy', name: 'DIY', enabled: true, featured: false, order: 13 },
];
