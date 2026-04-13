import apiClient from '@/lib/api/client';
import { DiscoveryTopic } from '@/data/discoveryTopics';

type DiscoveryTopicsResponse = {
    success: boolean;
    topics: DiscoveryTopic[];
};

export const DiscoveryTopicsService = {
    async getTopics(): Promise<DiscoveryTopic[]> {
        const response = await apiClient.get<DiscoveryTopicsResponse>('/discovery/topics');
        return response.data.topics || [];
    },
    async getAdminTopics(): Promise<DiscoveryTopic[]> {
        const response = await apiClient.get<DiscoveryTopicsResponse>('/admin/discovery/topics');
        return response.data.topics || [];
    },
    async saveTopics(topics: DiscoveryTopic[]): Promise<DiscoveryTopic[]> {
        const response = await apiClient.put<DiscoveryTopicsResponse>(
            '/admin/discovery/topics',
            { topics }
        );
        return response.data.topics || [];
    },
    async resetTopics(): Promise<DiscoveryTopic[]> {
        const response = await apiClient.delete<DiscoveryTopicsResponse>('/admin/discovery/topics');
        return response.data.topics || [];
    },
};
