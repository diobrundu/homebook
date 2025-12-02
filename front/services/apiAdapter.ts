import { User, Service, ServiceProvider, Appointment, Order, ServiceCategory } from '../types';

// Basic helpers to convert between snake_case (API) and camelCase (frontend)
export const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
export const toSnake = (s: string) => s.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);

export function mapKeys(obj: any, keyMapper: (k: string) => string): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(v => mapKeys(v, keyMapper));
  if (typeof obj !== 'object') return obj;

  const out: any = {};
  Object.keys(obj).forEach(k => {
    const nk = keyMapper(k);
    out[nk] = mapKeys(obj[k], keyMapper);
  });
  return out;
}

// Specific mappers
export function mapUserFromApi(apiUser: any): User {
  const u = mapKeys(apiUser, toCamel);
  // Ensure fields required by frontend types exist or are normalized
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    email: u.email,
    phone: u.phone,
    status: (u.status === 'pending' ? 'pending' : (u.status || 'active')) as User['status'],
    profilePicture: u.profilePicture || u.profile_picture || undefined,
    notificationPreferences: u.notificationPreferences || { email: true, push: false }
  } as User;
}

export function mapUserToApi(user: Partial<User>): any {
  // Map frontend user object to API payload (snake_case)
  const payload = mapKeys(user, toSnake);
  return payload;
}

export function mapCategoryFromApi(api: any): ServiceCategory {
  const c = mapKeys(api, toCamel);
  return {
    id: c.id,
    name: c.name,
    description: c.description
  } as ServiceCategory;
}

export function mapServiceFromApi(api: any): Service {
  const s = mapKeys(api, toCamel);
  return {
    id: s.id,
    categoryId: s.categoryId,
    name: s.name,
    description: s.description,
    price: Number(s.price),
    priceUnit: s.priceUnit,
    categoryName: s.categoryName || undefined
  } as Service;
}

export function mapProviderFromApi(api: any): ServiceProvider {
  const p = mapKeys(api, toCamel);
  return {
    id: p.id,
    userId: p.userId,
    name: p.name || p.displayName || '',
    rating: Number(p.rating || 0),
    status: p.status || 'pending',
    introduction: p.introduction || '',
    joinDate: p.joinDate || p.join_date || ''
  } as ServiceProvider;
}

export function mapAppointmentFromApi(api: any): Appointment {
  const a = mapKeys(api, toCamel);
  
  // 提取providerId - 优先检查原始api对象（在mapKeys转换之前）
  // 因为后端@JsonProperty强制返回providerId，即使全局配置了SNAKE_CASE
  let providerId: number | null = null;
  
  // 1. 首先检查原始api对象（后端可能直接返回providerId或provider_id）
  if (api.providerId != null && api.providerId !== undefined) {
    providerId = typeof api.providerId === 'number' ? api.providerId : Number(api.providerId);
  } else if (api.provider_id != null && api.provider_id !== undefined) {
    providerId = typeof api.provider_id === 'number' ? api.provider_id : Number(api.provider_id);
  }
  
  // 2. 如果还没有找到，检查转换后的对象
  if (!providerId && (a.providerId != null && a.providerId !== undefined)) {
    providerId = typeof a.providerId === 'number' ? a.providerId : Number(a.providerId);
  } else if (!providerId && (a.provider_id != null && a.provider_id !== undefined)) {
    providerId = typeof a.provider_id === 'number' ? a.provider_id : Number(a.provider_id);
  }
  
  // 3. 如果还没有找到，尝试从嵌套对象中提取
  if (!providerId && a.provider && typeof a.provider === 'object') {
    providerId = a.provider.id || a.provider.providerId || null;
    if (providerId != null) {
      providerId = typeof providerId === 'number' ? providerId : Number(providerId);
    }
  }
  
  // 4. 最后检查原始api对象的嵌套provider
  if (!providerId && api.provider && typeof api.provider === 'object') {
    const rawProviderId = api.provider.id || api.provider.providerId || null;
    if (rawProviderId != null) {
      providerId = typeof rawProviderId === 'number' ? rawProviderId : Number(rawProviderId);
    }
  }
  
  // 确保providerId是数字类型或null
  if (providerId !== null && (isNaN(providerId) || providerId <= 0)) {
    providerId = null;
  }
  
  return {
    id: a.id,
    customerId: a.customerId || api.customer_id || (api.customer?.id) || null,
    customerName: a.customerName || a.customer_name || (api.customer?.name) || null,
    providerId: providerId,
    providerName: a.providerName || a.provider_name || (api.provider?.user?.name) || (api.provider?.name) || null,
    serviceId: a.serviceId || api.service_id || (api.service?.id) || null,
    serviceName: a.serviceName || a.service_name || (api.service?.name) || null,
    appointmentTime: (a.appointmentTime || a.appointment_time || api.appointment_time) as string,
    durationHours: Number(a.durationHours || a.duration_hours || api.duration_hours || 0),
    address: a.address,
    status: a.status,
    price: a.price !== undefined ? Number(a.price) : 0
  } as Appointment;
}

export function mapAppointmentToApi(appt: Partial<Appointment>): any {
  const payload = mapKeys(appt, toSnake);
  // backend expects datetime strings like 'YYYY-MM-DD HH:mm:ss' or ISO; keep frontend ISO as default
  return payload;
}

export function mapOrderFromApi(api: any): Order {
  const o = mapKeys(api, toCamel);
  return {
    id: o.id,
    appointmentId: o.appointmentId,
    orderNumber: o.orderNumber,
    amount: Number(o.amount),
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod
  } as Order;
}

// Generic helpers exported for use in services
export default {
  mapKeys,
  mapUserFromApi,
  mapUserToApi,
  mapServiceFromApi,
  mapCategoryFromApi,
  mapProviderFromApi,
  mapAppointmentFromApi,
  mapAppointmentToApi,
  mapOrderFromApi
};
