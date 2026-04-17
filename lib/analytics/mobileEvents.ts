import apiClient from '@/lib/api/client';

type MobileEventPayload = {
  name: string;
  properties?: Record<string, unknown>;
  ts?: string;
};

class MobileEvents {
  private queue: MobileEventPayload[] = [];
  private flushing = false;

  track(name: string, properties?: Record<string, unknown>) {
    this.queue.push({
      name,
      properties: properties || {},
      ts: new Date().toISOString(),
    });

    if (this.queue.length >= 5) {
      this.flush().catch(() => {
        // Keep best-effort; queue remains for later retries.
      });
    }
  }

  async flush() {
    if (this.flushing || this.queue.length === 0) {
      return;
    }

    this.flushing = true;
    const batch = [...this.queue];

    try {
      await apiClient.post('/analytics/mobile-events', { events: batch });
      this.queue = this.queue.slice(batch.length);
    } catch (error) {
      // Endpoint may not exist yet; keep events locally and fail gracefully.
      if (__DEV__) {
        console.log('[MobileEvents] Flush deferred:', error);
      }
    } finally {
      this.flushing = false;
    }
  }
}

export const mobileEvents = new MobileEvents();
