/**
 * Backend API stub. All methods are local mocks today.
 * Point `baseUrl` at your API when you attach the backend.
 */

import { marcusAnswers, marcusProfile, events, announcements, resources, foodPlaces } from '@/mock/data';

const config = {
  /** Set EXPO_PUBLIC_API_URL when the backend is ready. */
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
  useMock: !process.env.EXPO_PUBLIC_API_URL,
};

async function mockDelay<T>(value: T, ms = 200): Promise<T> {
  await new Promise((r) => setTimeout(r, ms));
  return value;
}

export const api = {
  config,

  async getProfile() {
    return mockDelay({ ...marcusProfile });
  },

  async getApplicationAnswers() {
    return mockDelay({ ...marcusAnswers });
  },

  async saveApplicationPartial(partial: Record<string, unknown>) {
    console.log('[api.mock] saveApplicationPartial', partial);
    return mockDelay({ ok: true as const });
  },

  async getResources() {
    return mockDelay(resources);
  },

  async getFoodPlaces() {
    return mockDelay(foodPlaces);
  },

  async getEvents() {
    return mockDelay(events);
  },

  async getAnnouncements() {
    return mockDelay(announcements);
  },

  async saveEvent(eventId: string) {
    console.log('[api.mock] saveEvent', eventId);
    return mockDelay({ ok: true as const, eventId });
  },

  async requestHelperHandoff() {
    console.log('[api.mock] requestHelperHandoff');
    return mockDelay({ ok: true as const });
  },

  async deleteAccount() {
    console.log('[api.mock] deleteAccount');
    return mockDelay({ ok: true as const });
  },
};
