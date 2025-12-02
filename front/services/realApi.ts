import * as adapter from './apiAdapter';
import { 
  User, Service, ServiceProvider, Appointment, Order, ServiceCategory, 
  AppointmentStatus, PaymentStatus, UserRole 
} from '../types';

// API基础URL
const API_BASE_URL = 'http://localhost:8081/api';

// 辅助函数：处理API响应（数组）
async function handleArrayResponse<T>(response: Response, mapper: (data: any) => T): Promise<T[]> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data.map(mapper) : [mapper(data)];
}

// 辅助函数：处理API响应（单个对象）
async function handleObjectResponse<T>(response: Response, mapper?: (data: any) => T): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  if (mapper) {
    return mapper(data);
  }
  return data as T;
}

// 辅助函数：处理简单响应（无返回值）
async function handleSimpleResponse(response: Response): Promise<void> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  // 尝试解析JSON，如果没有内容则忽略
  try {
    await response.json();
  } catch {
    // 忽略解析错误
  }
}

// 辅助函数：从对象中安全提取 ID（支持多种格式）
function extractId(obj: any, ...paths: string[]): number | null {
  if (!obj) {
    return null;
  }
  
  for (const path of paths) {
    const parts = path.split('.');
    let value: any = obj;
    let validPath = true;
    
    for (const part of parts) {
      if (value == null || value === undefined) {
        validPath = false;
        break;
      }
      value = value[part];
    }
    
    if (validPath && value != null && value !== undefined) {
      // 尝试转换为数字
      const numValue = typeof value === 'number' ? value : Number(value);
      if (!isNaN(numValue) && numValue > 0) {
        return numValue;
      }
    }
  }
  
  return null;
}

// 辅助函数：处理Appointment的嵌套对象（customer, provider, service）
function mapAppointmentWithRelations(apiAppt: any): Appointment {
  const mapped = adapter.mapAppointmentFromApi(apiAppt);
  
  // 使用多种路径尝试提取 customerId（处理不同的 API 响应格式）
  if (!mapped.customerId) {
    mapped.customerId = extractId(
      apiAppt,
      'customer.id',
      'customerId',
      'customer_id'
    );
    
    // 如果还是找不到，尝试从嵌套对象中直接提取
    if (!mapped.customerId && apiAppt.customer) {
      const customerId = apiAppt.customer.id;
      if (customerId != null) {
        mapped.customerId = typeof customerId === 'number' ? customerId : Number(customerId);
      }
    }
  }
  
  // 提取 customerName
  if (!mapped.customerName && apiAppt.customer) {
    mapped.customerName = apiAppt.customer.name || apiAppt.customer.name || apiAppt.customer_name;
  }
  
  // 使用多种路径尝试提取 providerId（注意：provider 可能为 null）
  // 后端配置了SNAKE_CASE，所以字段名可能是provider_id
  // 但@JsonProperty方法应该返回providerId，所以需要同时检查
  if (!mapped.providerId || mapped.providerId === 0) {
    // 首先尝试直接从扁平化的字段获取（后端可能直接返回providerId或provider_id）
    // 检查所有可能的字段名
    if (apiAppt.providerId != null && apiAppt.providerId !== undefined && apiAppt.providerId !== 0) {
      mapped.providerId = typeof apiAppt.providerId === 'number' ? apiAppt.providerId : Number(apiAppt.providerId);
      if (!isNaN(mapped.providerId) && mapped.providerId > 0) {
        // Found providerId
      } else {
        mapped.providerId = null;
      }
    } else if (apiAppt.provider_id != null && apiAppt.provider_id !== undefined && apiAppt.provider_id !== 0) {
      mapped.providerId = typeof apiAppt.provider_id === 'number' ? apiAppt.provider_id : Number(apiAppt.provider_id);
      if (!isNaN(mapped.providerId) && mapped.providerId > 0) {
        // Found providerId
      } else {
        mapped.providerId = null;
      }
    } else {
      // 尝试从嵌套对象中提取
      mapped.providerId = extractId(
        apiAppt,
        'provider.id',
        'provider_id',
        'provider.providerId'
      );
      
      // 如果还是找不到，尝试从嵌套对象中直接提取
      if ((!mapped.providerId || mapped.providerId === 0) && apiAppt.provider && apiAppt.provider !== null && typeof apiAppt.provider === 'object') {
        const providerId = apiAppt.provider.id || apiAppt.provider.provider_id || apiAppt.provider.providerId;
        if (providerId != null && providerId !== undefined && providerId !== 0) {
          const numProviderId = typeof providerId === 'number' ? providerId : Number(providerId);
          if (!isNaN(numProviderId) && numProviderId > 0) {
            mapped.providerId = numProviderId;
          } else {
            mapped.providerId = null;
          }
        } else {
          mapped.providerId = null;
        }
      } else if (!apiAppt.provider || apiAppt.provider === null) {
        mapped.providerId = null;
      }
    }
    
    // 最终验证：确保providerId是有效的正数
    if (mapped.providerId !== null && (isNaN(mapped.providerId) || mapped.providerId <= 0)) {
      mapped.providerId = null;
    }
  } else {
    // 即使已经存在，也要验证有效性
    if (mapped.providerId !== null && (isNaN(mapped.providerId) || mapped.providerId <= 0)) {
      mapped.providerId = null;
    }
  }
  
  // 提取 providerName（可能在嵌套的 user 对象中）
  if (!mapped.providerName && apiAppt.provider) {
    if (apiAppt.provider.user && apiAppt.provider.user.name) {
      mapped.providerName = apiAppt.provider.user.name;
    } else if (apiAppt.provider.name) {
      mapped.providerName = apiAppt.provider.name;
    }
  }
  
  // 提取 serviceId
  if (!mapped.serviceId) {
    mapped.serviceId = extractId(
      apiAppt,
      'service.id',
      'serviceId',
      'service_id'
    ) || mapped.serviceId || 0;
  }
  
  // 提取 serviceName
  if (!mapped.serviceName && apiAppt.service) {
    mapped.serviceName = apiAppt.service.name || apiAppt.service_name;
  }
  
  // 处理appointmentTime格式
  if (apiAppt.appointment_time) {
    mapped.appointmentTime = apiAppt.appointment_time;
  }
  if (apiAppt.price !== undefined) {
    mapped.price = Number(apiAppt.price) || 0;
  } else if (apiAppt.service && apiAppt.service.price && apiAppt.duration_hours) {
    mapped.price = (apiAppt.service.price * apiAppt.duration_hours) || 0;
  }
  
  return mapped;
}

// 辅助函数：处理ServiceProvider的嵌套user对象
function mapProviderWithUser(apiProvider: any): ServiceProvider {
  const mapped = adapter.mapProviderFromApi(apiProvider);
  if (apiProvider.user) {
    mapped.userId = apiProvider.user.id || apiProvider.user_id;
    mapped.name = apiProvider.user.name || apiProvider.user_name || mapped.name;
  }
  if (apiProvider.join_date) {
    mapped.joinDate = apiProvider.join_date;
  } else if (apiProvider.joinDate) {
    mapped.joinDate = typeof apiProvider.joinDate === 'string' 
      ? apiProvider.joinDate 
      : apiProvider.joinDate.toString();
  }
  return mapped;
}

export const RealApi = {
  login: async (username: string, password: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        // 尝试解析后端返回的错误消息
        let errorMessage = '登录失败，请稍后重试';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            // 将后端错误消息转换为中文
            if (errorData.error === 'username and password required') {
              errorMessage = '用户名和密码不能为空';
            } else if (errorData.error === 'invalid credentials') {
              errorMessage = '用户名或密码错误';
            } else {
              errorMessage = errorData.error;
            }
          }
        } catch (e) {
          // 如果无法解析JSON，使用默认错误消息
          if (response.status === 401) {
            errorMessage = '用户名或密码错误';
          } else if (response.status === 400) {
            errorMessage = '请求参数错误';
          }
        }
        
        // 401时返回null（兼容旧代码），但抛出包含错误消息的异常
        if (response.status === 401) {
          const error = new Error(errorMessage);
          (error as any).status = 401;
          throw error;
        }
        
        throw new Error(errorMessage);
      }
      
      const apiUser = await response.json();
      return adapter.mapUserFromApi(apiUser);
    } catch (error: any) {
      console.error('Login error:', error);
      // 如果是网络错误，提供更友好的提示
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('无法连接到服务器，请检查网络连接或联系管理员');
      }
      throw error;
    }
  },

  register: async (userData: Omit<User, 'id' | 'status' | 'notificationPreferences'> & { password?: string; serviceIds?: number[]; introduction?: string }): Promise<{success: boolean, message: string}> => {
    try {
      const apiPayload = adapter.mapUserToApi(userData);
      // 后端期望的格式
      const payload: any = {
        username: apiPayload.username || userData.username,
        password: userData.password || '',
        name: apiPayload.name || userData.name,
        email: apiPayload.email || userData.email,
        role: userData.role || 'customer'
      };
      
      // 如果是服务人员，添加introduction和serviceIds
      if (userData.role === UserRole.ServiceProvider) {
        if (userData.introduction) {
          payload.introduction = userData.introduction;
        }
        if (userData.serviceIds && userData.serviceIds.length > 0) {
          payload.serviceIds = userData.serviceIds;
        }
      }
      
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await handleObjectResponse<{success: boolean, message: string}>(response);
      return result;
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  },

  sendEmailVerificationCode: async (email: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send_verification_code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      await handleSimpleResponse(response);
    } catch (error) {
      console.error('Send verification code error:', error);
      throw error;
    }
  },

  verifyEmail: async (email: string, code: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify_code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const result = await handleObjectResponse<{ success: boolean }>(response);
      return result.success;
    } catch (error) {
      console.error('Verify email code error:', error);
      throw error;
    }
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      return await handleArrayResponse<User>(response, adapter.mapUserFromApi);
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  },

  updateUserStatus: async (userId: number, status: 'non_member' | 'member' | 'super_member'): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      await handleSimpleResponse(response);
    } catch (error) {
      console.error('Update user status error:', error);
      throw error;
    }
  },

  updateUserProfile: async (userId: number, data: Partial<User>): Promise<User> => {
    try {
      const payload = adapter.mapUserToApi(data);
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name || data.name,
          phone: payload.phone || data.phone,
          email: payload.email || data.email
        })
      });
      await handleSimpleResponse(response);
      // 重新获取用户信息
      const users = await RealApi.getUsers();
      const updated = users.find(u => u.id === userId);
      if (!updated) throw new Error('User not found');
      return updated;
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  },

  uploadUserProfilePicture: async (userId: number, file: File): Promise<string> => {
    try {
      // 简化处理：将文件转换为base64或上传到服务器
      // 这里假设后端接受base64字符串
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          const base64String = reader.result as string;
          const response = await fetch(`${API_BASE_URL}/users/${userId}/profile_picture`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profilePicture: base64String })
          });
          await handleSimpleResponse(response);
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Upload profile picture error:', error);
      throw error;
    }
  },

  getCategories: async (): Promise<ServiceCategory[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      return await handleArrayResponse<ServiceCategory>(response, adapter.mapCategoryFromApi);
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  },

  addCategory: async (category: Omit<ServiceCategory, 'id'>): Promise<ServiceCategory> => {
    // 后端可能没有这个接口
    throw new Error('Not implemented');
  },

  updateCategory: async (category: ServiceCategory): Promise<void> => {
    // 后端可能没有这个接口
    throw new Error('Not implemented');
  },

  deleteCategory: async (id: number): Promise<void> => {
    // 后端可能没有这个接口
    throw new Error('Not implemented');
  },

  getServices: async (): Promise<Service[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/services`);
      const services = await handleArrayResponse<Service>(response, adapter.mapServiceFromApi);
      // 获取分类信息以填充categoryName
      const categories = await RealApi.getCategories();
      return services.map(s => ({
        ...s,
        categoryName: categories.find(c => c.id === s.categoryId)?.name
      }));
    } catch (error) {
      console.error('Get services error:', error);
      throw error;
    }
  },

  getServiceById: async (id: number): Promise<Service | undefined> => {
    try {
      const response = await fetch(`${API_BASE_URL}/services/${id}`);
      if (response.status === 404) return undefined;
      const service = await handleObjectResponse<Service>(response, adapter.mapServiceFromApi);
      // 获取分类信息
      const categories = await RealApi.getCategories();
      return {
        ...service,
        categoryName: categories.find(c => c.id === service.categoryId)?.name
      };
    } catch (error) {
      console.error('Get service by id error:', error);
      return undefined;
    }
  },

  getProviders: async (): Promise<ServiceProvider[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/providers`);
      return await handleArrayResponse<ServiceProvider>(response, mapProviderWithUser);
    } catch (error) {
      console.error('Get providers error:', error);
      throw error;
    }
  },

  getProviderById: async (id: number): Promise<ServiceProvider | undefined> => {
    try {
      const response = await fetch(`${API_BASE_URL}/providers/${id}`);
      if (response.status === 404) return undefined;
      return await handleObjectResponse<ServiceProvider>(response, mapProviderWithUser);
    } catch (error) {
      console.error('Get provider by id error:', error);
      return undefined;
    }
  },

  getServicesByProviderId: async (providerId: number): Promise<Service[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/services/by_provider/${providerId}`);
      const services = await handleArrayResponse<Service>(response, adapter.mapServiceFromApi);
      // 获取分类信息
      const categories = await RealApi.getCategories();
      return services.map(s => ({
        ...s,
        categoryName: categories.find(c => c.id === s.categoryId)?.name
      }));
    } catch (error) {
      console.error('Get services by provider error:', error);
      throw error;
    }
  },

  getProviderReviews: async (providerId: number): Promise<{user: string, rating: number, comment: string, date: string}[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/providers/${providerId}/reviews`);
      const reviews = await response.json();
      if (!Array.isArray(reviews)) return [];
      // 获取用户信息以填充用户名
      const users = await RealApi.getUsers();
      return reviews.map((r: any) => ({
        user: users.find(u => u.id === r.customer_id || r.customerId)?.name || 'Anonymous',
        rating: Number(r.rating || 0),
        comment: r.comment || '',
        date: r.created_at || r.createdAt || new Date().toISOString().split('T')[0]
      }));
    } catch (error) {
      console.error('Get provider reviews error:', error);
      return [];
    }
  },

  getAppointmentsByCustomer: async (customerId: number): Promise<Appointment[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments?customerId=${customerId}`);
      return await handleArrayResponse<Appointment>(response, mapAppointmentWithRelations);
    } catch (error) {
      console.error('Get appointments by customer error:', error);
      throw error;
    }
  },

  getAppointmentsByProvider: async (providerId: number): Promise<Appointment[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments?providerId=${providerId}`);
      return await handleArrayResponse<Appointment>(response, mapAppointmentWithRelations);
    } catch (error) {
      console.error('Get appointments by provider error:', error);
      throw error;
    }
  },

  getAllAppointments: async (): Promise<Appointment[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments`);
      return await handleArrayResponse<Appointment>(response, mapAppointmentWithRelations);
    } catch (error) {
      console.error('Get all appointments error:', error);
      throw error;
    }
  },

  createAppointment: async (appointment: Omit<Appointment, 'id' | 'status' | 'providerName' | 'serviceName' | 'price'>): Promise<Appointment> => {
    try {
      // 后端期望的格式（根据ApiController.CreateAppointmentRequest）
      // 确保所有字段都有值
      if (!appointment.customerId || !appointment.serviceId || !appointment.appointmentTime || !appointment.address) {
        throw new Error('Missing required fields: customerId, serviceId, appointmentTime, or address');
      }
      
      const requestBody = {
        customerId: appointment.customerId,
        serviceId: appointment.serviceId,
        appointmentTime: appointment.appointmentTime,
        durationHours: appointment.durationHours || 1.0,
        address: appointment.address
      };
      
      console.log('Sending appointment request:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error('Appointment creation failed - full error data:', errorData);
        
        // Handle validation errors (format: {"errors": {"field": "message"}})
        if (errorData.errors && typeof errorData.errors === 'object') {
          const validationErrors = Object.entries(errorData.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          throw new Error(`Validation failed: ${validationErrors}`);
        }
        
        // Handle single error message
        const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return await handleObjectResponse<Appointment>(response, mapAppointmentWithRelations);
    } catch (error: any) {
      console.error('Create appointment error:', error);
      throw error;
    }
  },

  updateAppointmentStatus: async (id: number, status: AppointmentStatus): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      await handleSimpleResponse(response);
    } catch (error) {
      console.error('Update appointment status error:', error);
      throw error;
    }
  },

  updateAppointmentAddress: async (id: number, address: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}/address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      await handleSimpleResponse(response);
    } catch (error) {
      console.error('Update appointment address error:', error);
      throw error;
    }
  },

  updateAppointmentProvider: async (id: number, providerId: number | null): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}/provider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId })
      });
      await handleSimpleResponse(response);
    } catch (error) {
      console.error('Update appointment provider error:', error);
      throw error;
    }
  },

  submitReview: async (appointmentId: number, customerId: number, providerId: number, rating: number, comment: string): Promise<void> => {
    try {
      // Ensure all required fields are valid numbers
      const aptId = Number(appointmentId);
      const custId = Number(customerId);
      const provId = Number(providerId);
      const ratingNum = Number(rating);
      
      if (!aptId || isNaN(aptId) || aptId <= 0) {
        throw new Error('Invalid appointmentId: must be a positive number');
      }
      if (!custId || isNaN(custId) || custId <= 0) {
        throw new Error('Invalid customerId: must be a positive number');
      }
      if (!provId || isNaN(provId) || provId <= 0) {
        throw new Error('Invalid providerId: must be a positive number');
      }
      if (!ratingNum || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        throw new Error('Invalid rating: must be between 1 and 5');
      }
      
      const requestBody = {
        appointmentId: aptId,
        customerId: custId,
        providerId: provId,
        rating: ratingNum,
        comment: comment || ''
      };
      
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: response.statusText };
        }
        
        console.error('Review submission failed - full error data:', errorData);
        console.error('Response status:', response.status);
        console.error('Request body that was sent:', requestBody);
        
        // Handle validation errors (Spring Boot @Valid errors) - errors is an object
        if (errorData.errors && typeof errorData.errors === 'object' && !Array.isArray(errorData.errors)) {
          const validationErrors = Object.entries(errorData.errors)
            .map(([field, message]) => {
              // 处理中文错误消息
              const msg = String(message);
              if (msg.includes('不能为null') || msg.includes('不能为空')) {
                return `${field}: 不能为空`;
              }
              return `${field}: ${msg}`;
            })
            .join(', ');
          
          // 提取缺失的字段
          const missingFields = Object.keys(errorData.errors);
          let userMessage = '提交失败：缺少以下必需字段：' + missingFields.join(', ');
          
          if (missingFields.includes('providerId')) {
            userMessage += '。提示：此预约可能尚未分配给服务人员。';
          }
          
          console.error('Validation errors:', validationErrors);
          console.error('Missing fields:', missingFields);
          
          throw new Error(userMessage);
        }
        
        // Handle validation errors as array (if any)
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const validationErrors = errorData.errors
            .map((err: any) => {
              const field = err.field || err.fieldName || 'field';
              const msg = err.defaultMessage || err.message || 'validation error';
              return `${field}: ${msg}`;
            })
            .join(', ');
          throw new Error(`Validation failed: ${validationErrors}`);
        }
        
        // Handle single error message
        let errorMessage = errorData.error || errorData.message;
        
        // If error message contains Chinese validation messages, extract them
        if (typeof errorMessage === 'string') {
          if (errorMessage.includes('不能为null') || errorMessage.includes('不能为空')) {
            // 尝试从错误消息中提取字段名
            const fieldMatch = errorMessage.match(/(\w+)\s*-\s*不能为/);
            if (fieldMatch) {
              const fieldName = fieldMatch[1];
              errorMessage = `提交失败：字段 ${fieldName} 不能为空。`;
              if (fieldName.toLowerCase().includes('provider')) {
                errorMessage += '提示：此预约可能尚未分配给服务人员。';
              }
            } else {
              errorMessage = '提交失败：缺少必需的字段信息。请确保预约已分配给服务人员。';
            }
          } else if (errorMessage.includes('Validation failed')) {
            // 解析验证失败的消息
            errorMessage = errorMessage.replace('Validation failed: ', '提交失败：');
          }
        }
        
        if (!errorMessage) {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      await handleSimpleResponse(response);
    } catch (error) {
      console.error('Submit review error:', error);
      throw error;
    }
  },

  getServiceReviews: async (serviceId: number): Promise<{user: string, rating: number, comment: string, date: string}[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/services/${serviceId}/reviews`);
      const reviews = await response.json();
      if (!Array.isArray(reviews)) return [];
      // 获取用户信息
      const users = await RealApi.getUsers();
      return reviews.map((r: any) => ({
        user: users.find(u => u.id === r.customer_id || r.customerId)?.name || 'Anonymous',
        rating: Number(r.rating || 0),
        comment: r.comment || '',
        date: r.created_at || r.createdAt || new Date().toISOString().split('T')[0]
      }));
    } catch (error) {
      console.error('Get service reviews error:', error);
      return [];
    }
  },

  rescheduleAppointment: async (id: number, newDateTime: string, address?: string): Promise<void> => {
    try {
      const requestBody: any = { newDateTime };
      if (address) {
        requestBody.address = address;
      }
      const response = await fetch(`${API_BASE_URL}/appointments/${id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      await handleSimpleResponse(response);
    } catch (error) {
      console.error('Reschedule appointment error:', error);
      throw error;
    }
  },

  sendAppointmentReminder: async (id: number, type: 'email' | 'push'): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}/reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      await handleSimpleResponse(response);
    } catch (error) {
      console.error('Send appointment reminder error:', error);
      throw error;
    }
  },

  getOrders: async (): Promise<Order[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`);
      return await handleArrayResponse<Order>(response, adapter.mapOrderFromApi);
    } catch (error) {
      console.error('Get orders error:', error);
      throw error;
    }
  },

  getOrdersByCustomer: async (customerId: number): Promise<Order[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders?customerId=${customerId}`);
      return await handleArrayResponse<Order>(response, adapter.mapOrderFromApi);
    } catch (error) {
      console.error('Get orders by customer error:', error);
      throw error;
    }
  },

  payOrder: async (orderId: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      await handleSimpleResponse(response);
    } catch (error) {
      console.error('Pay order error:', error);
      throw error;
    }
  },

  getStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      const data = await handleObjectResponse<any>(response);
      // 后端返回snake_case，转换为前端期望的格式
      return {
        totalUsers: data.total_users || data.totalUsers || 0,
        totalOrders: data.total_orders || data.totalOrders || 0,
        revenue: data.revenue || 0,
        pendingAppointments: data.pending_appointments || data.pendingAppointments || 0,
        todayVisitors: data.today_visitors || data.todayVisitors || 0
      };
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  },

  getTodayVisitors: async (): Promise<number> => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats/today_visitors`);
      const data = await handleObjectResponse<{ count: number }>(response);
      return data.count || 0;
    } catch (error) {
      console.error('Get today visitors error:', error);
      throw error;
    }
  },

  getTodayOrders: async (): Promise<{ count: number; revenue: number }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats/today_orders`);
      const data = await handleObjectResponse<{ count: number; revenue: number }>(response);
      return {
        count: data.count || 0,
        revenue: data.revenue || 0
      };
    } catch (error) {
      console.error('Get today orders error:', error);
      throw error;
    }
  },

  getRevenueByMonth: async (year?: number): Promise<{ name: string; revenue: number }[]> => {
    try {
      const query = year ? `?year=${year}` : '';
      const response = await fetch(`${API_BASE_URL}/stats/revenue_by_month${query}`);
      if (!response.ok) {
        throw new Error('Failed to load revenue data');
      }
      const data = await response.json();
      if (!Array.isArray(data)) return [];
      
      // 月份映射：将英文月份转换为中文
      const monthMap: Record<string, string> = {
        'Jan': '1月', 'Feb': '2月', 'Mar': '3月', 'Apr': '4月',
        'May': '5月', 'Jun': '6月', 'Jul': '7月', 'Aug': '8月',
        'Sep': '9月', 'Oct': '10月', 'Nov': '11月', 'Dec': '12月'
      };
      
      return data.map((item: any, index: number) => {
        const monthLabel = item.month || item.name || '';
        const chineseMonth = monthMap[monthLabel] || `${index + 1}月`;
        return {
          name: chineseMonth,
          revenue: Number(item.revenue || 0)
        };
      });
    } catch (error) {
      console.error('Get revenue by month error:', error);
      throw error;
    }
  },

  getWeeklyOrders: async (): Promise<{ name: string; value: number }[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats/weekly_orders`);
      if (!response.ok) {
        throw new Error('Failed to load weekly orders data');
      }
      const data = await response.json();
      if (!Array.isArray(data)) return [];
      
      // 星期映射，用于排序：周一到周日
      const weekDayOrder: Record<string, number> = {
        '周一': 1, '周二': 2, '周三': 3, '周四': 4,
        '周五': 5, '周六': 6, '周日': 7
      };
      
      // 映射数据并排序，确保从周一开始到周日结束
      return data
        .map((item: any) => ({
          name: item.name || '',
          value: Number(item.value || 0)
        }))
        .sort((a, b) => {
          const orderA = weekDayOrder[a.name] || 99;
          const orderB = weekDayOrder[b.name] || 99;
          return orderA - orderB;
        });
    } catch (error) {
      console.error('Get weekly orders error:', error);
      throw error;
    }
  },

  getProviderWeeklyEarnings: async (providerId: number): Promise<{ name: string; income: number }[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/providers/${providerId}/weekly_earnings`);
      if (!response.ok) {
        throw new Error('Failed to load weekly earnings');
      }
      const data = await response.json();
      if (!Array.isArray(data)) return [];
      return data.map((item: any) => ({
        name: item.name,
        income: Number(item.income || 0)
      }));
    } catch (error) {
      console.error('Get weekly earnings error:', error);
      throw error;
    }
  },

  // Provider Services Management
  getProviderServices: async (providerId: number): Promise<Service[]> => {
    return RealApi.getServicesByProviderId(providerId);
  },

  addProviderService: async (providerId: number, serviceId: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/providers/${providerId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId })
      });
      await handleSimpleResponse(response);
    } catch (error) {
      console.error('Add provider service error:', error);
      throw error;
    }
  },

  removeProviderService: async (providerId: number, serviceId: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/providers/${providerId}/services/${serviceId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      await handleSimpleResponse(response);
    } catch (error) {
      console.error('Remove provider service error:', error);
      throw error;
    }
  },

  updateProviderServices: async (providerId: number, serviceIds: number[]): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/providers/${providerId}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceIds })
      });
      await handleSimpleResponse(response);
    } catch (error) {
      console.error('Update provider services error:', error);
      throw error;
    }
  }
};

export default RealApi;

