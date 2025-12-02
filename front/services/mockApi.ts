import { User, UserRole, Service, ServiceProvider, Appointment, AppointmentStatus, Order, PaymentStatus, ServiceCategory } from '../types';

// Initial Data from SQL dump
let users: User[] = [
  { 
    id: 1, username: 'zhangwei', name: 'Zhang Wei', role: UserRole.Customer, phone: '13800138000', email: 'zhangwei@example.com', status: 'active',
    notificationPreferences: { email: true, push: true }
  },
  { 
    id: 2, username: 'wangfang', name: 'Wang Fang', role: UserRole.Customer, phone: '13800138001', status: 'active',
    notificationPreferences: { email: true, push: false }
  },
  { 
    id: 4, username: 'zhaoqiang', name: 'Zhao Qiang', role: UserRole.ServiceProvider, phone: '13800138003', status: 'active',
    notificationPreferences: { email: true, push: true }
  },
  { 
    id: 5, username: 'zhoumin', name: 'Zhou Min', role: UserRole.ServiceProvider, phone: '13800138004', status: 'active',
    notificationPreferences: { email: false, push: true }
  },
  { 
    id: 6, username: 'admin', name: 'Admin User', role: UserRole.Admin, email: 'admin@example.com', status: 'active',
    notificationPreferences: { email: true, push: true }
  },
];

let categories: ServiceCategory[] = [
  { id: 1, name: 'Cleaning', description: 'Home Cleaning Services' },
  { id: 2, name: 'Childcare', description: 'Professional Childcare' },
  { id: 3, name: 'Moving', description: 'Relocation Services' },
];

const services: Service[] = [
  { id: 1, categoryId: 1, name: 'House Cleaning', description: 'Standard home cleaning', price: 100, priceUnit: 'hour', categoryName: 'Cleaning' },
  { id: 2, categoryId: 1, name: 'Carpet Cleaning', description: 'Deep carpet wash', price: 150, priceUnit: 'hour', categoryName: 'Cleaning' },
  { id: 3, categoryId: 2, name: 'Babysitting', description: 'Child care service', price: 80, priceUnit: 'hour', categoryName: 'Childcare' },
  { id: 4, categoryId: 3, name: 'Piano Moving', description: 'Professional piano moving', price: 200, priceUnit: 'session', categoryName: 'Moving' },
];

const providers: ServiceProvider[] = [
  { id: 1, userId: 4, name: 'Zhao Qiang', rating: 4.8, status: 'approved', introduction: 'Experienced cleaner with 5 years of experience in residential and commercial cleaning. I pay attention to details and ensure your home is spotless.', joinDate: '2025-11-28' },
  { id: 2, userId: 5, name: 'Zhou Min', rating: 4.9, status: 'approved', introduction: 'Certified nanny and early childhood educator. I love working with kids and creating a safe, fun environment for them.', joinDate: '2025-11-28' },
];

let appointments: Appointment[] = [
  { 
    id: 1, customerId: 1, customerName: 'Zhang Wei', providerId: 1, providerName: 'Zhao Qiang', 
    serviceId: 1, serviceName: 'House Cleaning', appointmentTime: '2025-12-01T10:00:00', 
    durationHours: 2, address: 'Beijing Chaoyang District XX #101', status: AppointmentStatus.Completed, price: 200 
  },
  { 
    id: 2, customerId: 2, customerName: 'Wang Fang', providerId: 2, providerName: 'Zhou Min', 
    serviceId: 3, serviceName: 'Babysitting', appointmentTime: '2025-12-02T15:00:00', 
    durationHours: 3, address: 'Shanghai Pudong YY #202', status: AppointmentStatus.Completed, price: 240 
  },
  { 
    id: 3, customerId: 1, customerName: 'Zhang Wei', providerId: 2, providerName: 'Zhou Min', 
    serviceId: 3, serviceName: 'Babysitting', appointmentTime: '2025-12-15T09:00:00', 
    durationHours: 4, address: 'Beijing Chaoyang District XX #101', status: AppointmentStatus.Pending, price: 320 
  },
  { 
    id: 4, customerId: 1, customerName: 'Zhang Wei', providerId: 1, providerName: 'Zhao Qiang', 
    serviceId: 1, serviceName: 'House Cleaning', appointmentTime: '2025-12-20T14:00:00', 
    durationHours: 3, address: 'Beijing Chaoyang District XX #101', status: AppointmentStatus.Pending, price: 300 
  }
];

let orders: Order[] = [
  { id: 1, appointmentId: 1, orderNumber: 'ORD1001', amount: 200, paymentStatus: PaymentStatus.Paid, paymentMethod: 'wechat' },
  { id: 2, appointmentId: 2, orderNumber: 'ORD1002', amount: 240, paymentStatus: PaymentStatus.Paid, paymentMethod: 'alipay' },
  { id: 3, appointmentId: 3, orderNumber: 'ORD1003', amount: 320, paymentStatus: PaymentStatus.Pending, paymentMethod: '' }
];

// Mock storage for verification codes: email -> code
const verificationCodes = new Map<string, string>();

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const MockApi = {
  login: async (username: string): Promise<User | null> => {
    await delay(500);
    const user = users.find(u => u.username === username);
    if (!user) return null;
    
    if (user.status === 'inactive') throw new Error("Account is inactive.");
    if (user.status === 'pending') throw new Error("Email verification required.");
    
    return user;
  },

  register: async (userData: Omit<User, 'id' | 'status' | 'notificationPreferences'>): Promise<{success: boolean, message: string}> => {
    await delay(600);
    // Check if username or email exists
    if (users.some(u => u.username === userData.username)) {
        throw new Error("Username already taken.");
    }
    if (userData.email && users.some(u => u.email === userData.email)) {
        throw new Error("Email already registered.");
    }

    const newId = Math.max(...users.map(u => u.id)) + 1;
    const newUser: User = {
        ...userData,
        id: newId,
        status: 'pending', // Pending verification
        notificationPreferences: { email: true, push: true }
    };

    users.push(newUser);

    // Generate mock code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    if (userData.email) {
        verificationCodes.set(userData.email, code);
        // Simulate sending email
        console.log(`[MOCK EMAIL] To: ${userData.email}, Code: ${code}`);
        return { success: true, message: code }; // Returning code here just for demo/alert purposes
    }

    return { success: true, message: '123456' };
  },

  verifyEmail: async (email: string, code: string): Promise<boolean> => {
    await delay(500);
    const storedCode = verificationCodes.get(email);
    if (storedCode === code) {
        const user = users.find(u => u.email === email);
        if (user) {
            user.status = 'active';
            verificationCodes.delete(email);
            return true;
        }
    }
    return false;
  },

  getUsers: async (): Promise<User[]> => {
    await delay(300);
    return [...users];
  },

  updateUserStatus: async (userId: number, status: 'active' | 'inactive' | 'pending'): Promise<void> => {
    await delay(300);
    users = users.map(u => u.id === userId ? { ...u, status } : u);
  },

  updateUserProfile: async (userId: number, data: Partial<User>): Promise<User> => {
    await delay(500);
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error("User not found");
    
    // Update user in store
    users[index] = { ...users[index], ...data };
    return users[index];
  },

  uploadUserProfilePicture: async (userId: number, file: File): Promise<string> => {
    await delay(1000);
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error("User not found");
    
    const mockUrl = URL.createObjectURL(file);
    users[index] = { ...users[index], profilePicture: mockUrl };
    return mockUrl;
  },

  getCategories: async (): Promise<ServiceCategory[]> => {
    await delay(300);
    return [...categories];
  },

  addCategory: async (category: Omit<ServiceCategory, 'id'>): Promise<ServiceCategory> => {
    await delay(400);
    const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    const newCategory = { ...category, id: newId };
    categories = [...categories, newCategory];
    return newCategory;
  },

  updateCategory: async (category: ServiceCategory): Promise<void> => {
    await delay(400);
    categories = categories.map(c => c.id === category.id ? category : c);
  },

  deleteCategory: async (id: number): Promise<void> => {
    await delay(400);
    categories = categories.filter(c => c.id !== id);
  },

  getServices: async (): Promise<Service[]> => {
    await delay(300);
    return services;
  },

  getServiceById: async (id: number): Promise<Service | undefined> => {
    await delay(200);
    return services.find(s => s.id === id);
  },

  getProviders: async (): Promise<ServiceProvider[]> => {
    await delay(300);
    return providers;
  },

  getProviderById: async (id: number): Promise<ServiceProvider | undefined> => {
    await delay(200);
    return providers.find(p => p.id === id);
  },

  getServicesByProviderId: async (providerId: number): Promise<Service[]> => {
    await delay(300);
    // Mock logic: Assign services based on basic rules for the demo
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return [];
    
    if (provider.id === 1) return services.filter(s => s.categoryId === 1);
    if (provider.id === 2) return services.filter(s => s.categoryId === 2);
    return [];
  },

  getProviderReviews: async (providerId: number): Promise<{user: string, rating: number, comment: string, date: string}[]> => {
    await delay(300);
    return [
        { user: 'Zhang Wei', rating: 5, comment: 'Very professional and polite. Did a great job.', date: '2023-11-15' },
        { user: 'Lisa M.', rating: 4, comment: 'Good work, reliable.', date: '2023-10-20' },
        { user: 'Tom H.', rating: 5, comment: 'Best service I have had in years.', date: '2023-09-05' },
    ];
  },

  getAppointmentsByCustomer: async (customerId: number): Promise<Appointment[]> => {
    await delay(400);
    return appointments.filter(a => a.customerId === customerId).sort((a, b) => new Date(b.appointmentTime).getTime() - new Date(a.appointmentTime).getTime());
  },

  getAppointmentsByProvider: async (providerId: number): Promise<Appointment[]> => {
    await delay(400);
    return appointments.filter(a => a.providerId === providerId).sort((a, b) => new Date(b.appointmentTime).getTime() - new Date(a.appointmentTime).getTime());
  },

  getAllAppointments: async (): Promise<Appointment[]> => {
    await delay(400);
    return appointments;
  },

  createAppointment: async (appointment: Omit<Appointment, 'id' | 'status' | 'providerName' | 'serviceName'>): Promise<Appointment> => {
    await delay(800);
    const service = services.find(s => s.id === appointment.serviceId);
    const newId = appointments.length + 1;
    const newAppt: Appointment = {
      ...appointment,
      id: newId,
      status: AppointmentStatus.Pending,
      serviceName: service?.name,
      providerId: appointment.providerId || (service?.categoryId === 1 ? 1 : 2), 
      providerName: appointment.providerId ? providers.find(p => p.id === appointment.providerId)?.name : 'Pending Assignment'
    };
    appointments = [newAppt, ...appointments];
    return newAppt;
  },

  updateAppointmentStatus: async (id: number, status: AppointmentStatus): Promise<void> => {
    await delay(400);
    appointments = appointments.map(a => a.id === id ? { ...a, status } : a);
  },

  submitReview: async (appointmentId: number, rating: number, comment: string): Promise<void> => {
    await delay(500);
    console.log(`Review submitted for appointment ${appointmentId}: ${rating} stars, "${comment}"`);
  },

  getServiceReviews: async (serviceId: number): Promise<{user: string, rating: number, comment: string, date: string}[]> => {
    await delay(300);
    return [
        { user: 'Alice', rating: 5, comment: 'Excellent service, very professional!', date: '2023-10-15' },
        { user: 'Bob', rating: 4, comment: 'Good job, but arrived a bit late.', date: '2023-11-02' },
        { user: 'Charlie', rating: 5, comment: 'Highly recommended! Will book again.', date: '2023-12-01' },
    ];
  },

  rescheduleAppointment: async (id: number, newDateTime: string): Promise<void> => {
    await delay(600);
    appointments = appointments.map(a => 
      a.id === id ? { ...a, appointmentTime: newDateTime, status: AppointmentStatus.Pending } : a
    );
  },

  sendAppointmentReminder: async (id: number, type: 'email' | 'push'): Promise<void> => {
    await delay(500);
    console.log(`Reminder sent for appointment ${id} via ${type}`);
  },

  getOrders: async (): Promise<Order[]> => {
    await delay(300);
    return orders;
  },

  getOrdersByCustomer: async (customerId: number): Promise<Order[]> => {
    await delay(400);
    const customerApptIds = appointments.filter(a => a.customerId === customerId).map(a => a.id);
    return orders.filter(o => customerApptIds.includes(o.appointmentId));
  },

  payOrder: async (orderId: number): Promise<void> => {
    await delay(600);
    orders = orders.map(o => o.id === orderId ? { ...o, paymentStatus: PaymentStatus.Paid, paymentMethod: 'credit_card' } : o);
  },

  getStats: async () => {
    await delay(300);
    return {
      totalUsers: users.length,
      totalOrders: orders.length,
      revenue: orders.reduce((acc, o) => acc + o.amount, 0),
      pendingAppointments: appointments.filter(a => a.status === AppointmentStatus.Pending).length
    };
  }
};