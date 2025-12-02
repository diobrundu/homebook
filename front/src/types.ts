export enum UserRole {
  Customer = 'customer',
  ServiceProvider = 'service_provider',
  Admin = 'admin',
}

export enum AppointmentStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum PaymentStatus {
  Pending = 'pending',
  Paid = 'paid',
  Failed = 'failed',
  Refunded = 'refunded',
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  status: 'non_member' | 'member' | 'super_member'; // 会员状态：非会员、会员、超级会员
  profilePicture?: string;
  lastLoginTime?: string; // 最后登录时间
  notificationPreferences?: {
    email: boolean;
    push: boolean;
  };
}

export interface ServiceCategory {
  id: number;
  name: string;
  description: string;
}

export interface Service {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  price: number;
  priceUnit: 'hour' | 'day' | 'session' | 'other';
  categoryName?: string;
}

export interface ServiceProvider {
  id: number;
  userId: number;
  name: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  introduction: string;
  joinDate: string;
}

export interface Appointment {
  id: number;
  customerId: number;
  customerName?: string;
  providerId?: number;
  providerName?: string;
  serviceId: number;
  serviceName?: string;
  appointmentTime: string;
  durationHours: number;
  address: string;
  status: AppointmentStatus;
  price: number;
}

export interface Order {
  id: number;
  appointmentId: number;
  orderNumber: string;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
}

export interface StatData {
  name: string;
  value: number;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface ProviderAvailability {
  id: number;
  providerId: number;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface ProviderDocument {
  id: number;
  providerId: number;
  documentType: string;
  documentPath: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string | null;
  reviewerId?: number | null;
}

export interface Review {
  id: number;
  appointmentId: number;
  customerId: number;
  providerId: number;
  rating: number;
  comment?: string;
  createdAt: string;
}


