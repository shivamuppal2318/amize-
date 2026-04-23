import { secureStorage } from "@/lib/auth/storage";

// ClerkProvider expects a token cache interface.
// We store Clerk's tokens alongside our other auth storage.
export const clerkTokenCache = {
  async getToken(key: string) {
    return await secureStorage.get(`clerk:${key}`);
  },
  async saveToken(key: string, token: string) {
    await secureStorage.set(`clerk:${key}`, token);
  },
  async clearToken(key: string) {
    await secureStorage.remove(`clerk:${key}`);
  },
};

