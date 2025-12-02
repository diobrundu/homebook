import { MockApi } from './mockApi';
import * as adapter from './apiAdapter';
import { User, Service, ServiceProvider, Appointment, Order, ServiceCategory } from '../types';

// This file wraps the existing MockApi to demonstrate how a real API
// (which uses snake_case) would be converted using the adapter.

// Helper: simulate an API response by converting a frontend object to snake_case
// and then parsing it back through the mapping functions. This shows the exact
// adapter usage you'd do when calling a real backend.
function simulateApiRoundtrip<T>(obj: any, mapperFromApi: (api: any) => T): T {
  const apiPayload = adapter.mapKeys(obj, adapter.toSnake);
  return mapperFromApi(apiPayload);
}

export const MockApiWithAdapter = {
  // Login: accept frontend username, call mock backend, then map response
  login: async (username: string, password: string): Promise<User | null> => {
    // Call real backend login endpoint
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) return null;
      const apiUser = await res.json();
      return adapter.mapUserFromApi(apiUser);
    } catch (e) {
      // Fallback to mock when backend unavailable
      const resp = await MockApi.login(username as any);
      if (!resp) return null;
      return simulateApiRoundtrip(resp, adapter.mapUserFromApi);
    }
  },

  register: async (userData: Omit<User, 'id' | 'status' | 'notificationPreferences'>): Promise<{success: boolean, message: string}> => {
    // Convert frontend payload to API snake_case before sending (example)
    const apiPayload = adapter.mapUserToApi(userData);
    // In a real call: fetch('/api/register', { body: JSON.stringify(apiPayload) })
    // Here we still call MockApi.register which expects frontend shape; this is
    // only to demonstrate the conversion step.
    return await MockApi.register(userData as any);
  },

  getUsers: async (): Promise<User[]> => {
    const resp = await MockApi.getUsers();
    return resp.map(r => simulateApiRoundtrip(r, adapter.mapUserFromApi));
  },

  getCategories: async (): Promise<ServiceCategory[]> => {
    const resp = await MockApi.getCategories();
    return resp.map(r => simulateApiRoundtrip(r, adapter.mapCategoryFromApi));
  },

  getServices: async (): Promise<Service[]> => {
    const resp = await MockApi.getServices();
    return resp.map(r => simulateApiRoundtrip(r, adapter.mapServiceFromApi));
  },

  getProviders: async (): Promise<ServiceProvider[]> => {
    const resp = await MockApi.getProviders();
    return resp.map(r => simulateApiRoundtrip(r, adapter.mapProviderFromApi));
  },

  getAppointmentsByCustomer: async (customerId: number): Promise<Appointment[]> => {
    const resp = await MockApi.getAppointmentsByCustomer(customerId);
    return resp.map(r => simulateApiRoundtrip(r, adapter.mapAppointmentFromApi));
  },

  getAppointmentsByProvider: async (providerId: number): Promise<Appointment[]> => {
    const resp = await MockApi.getAppointmentsByProvider(providerId);
    return resp.map(r => simulateApiRoundtrip(r, adapter.mapAppointmentFromApi));
  },

  getAllAppointments: async (): Promise<Appointment[]> => {
    const resp = await MockApi.getAllAppointments();
    return resp.map(r => simulateApiRoundtrip(r, adapter.mapAppointmentFromApi));
  },

  createAppointment: async (appointment: Omit<Appointment, 'id' | 'status' | 'providerName' | 'serviceName'>): Promise<Appointment> => {
    // Convert to API payload before sending
    const apiPayload = adapter.mapKeys(appointment, adapter.toSnake);
    // Normally you'd send apiPayload to backend; here call MockApi and map response
    const resp = await MockApi.createAppointment(appointment as any);
    return simulateApiRoundtrip(resp, adapter.mapAppointmentFromApi);
  },

  getOrders: async (): Promise<Order[]> => {
    const resp = await MockApi.getOrders();
    return resp.map(r => simulateApiRoundtrip(r, adapter.mapOrderFromApi));
  },

  getOrdersByCustomer: async (customerId: number): Promise<Order[]> => {
    const resp = await MockApi.getOrdersByCustomer(customerId);
    return resp.map(r => simulateApiRoundtrip(r, adapter.mapOrderFromApi));
  },

  payOrder: async (orderId: number): Promise<void> => {
    return MockApi.payOrder(orderId);
  },

  getStats: async () => {
    const resp = await MockApi.getStats();
    // stats are simple numbers; return as-is
    return resp;
  }
};

export default MockApiWithAdapter;
