import React, { useEffect, useState } from 'react';
import { User, Appointment, AppointmentStatus, Order, StatData, UserRole, ServiceCategory, PaymentStatus, Service, ServiceProvider } from '../types';
import RealApi from '../services/realApi';
import { Button, PageContainer, StatusBadge } from '../components/Shared';
import { Calendar, DollarSign, Clock, CheckCircle, XCircle, User as UserIcon, Filter, Search, Ban, Lock, Unlock, Star, MapPin, Folder, Plus, Edit, Trash, Receipt, Bell, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardProps {
  user: User;
}

// --- Customer Dashboard ---
export const CustomerDashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'orders'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [reviewModal, setReviewModal] = useState<{isOpen: boolean, aptId: number | null}>({isOpen: false, aptId: null});
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  // Reschedule State
  const [rescheduleModal, setRescheduleModal] = useState<{isOpen: boolean, aptId: number | null}>({isOpen: false, aptId: null});
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleAddress, setRescheduleAddress] = useState('');
  const [showCustomAddress, setShowCustomAddress] = useState(false);

  // Edit Order Address State
  const [editAddressModal, setEditAddressModal] = useState<{isOpen: boolean, orderId: number | null, appointmentId: number | null}>({isOpen: false, orderId: null, appointmentId: null});
  const [newAddress, setNewAddress] = useState('');
  
  // Payment Modal State
  const [paymentModal, setPaymentModal] = useState<{isOpen: boolean, orderId: number | null}>({isOpen: false, orderId: null});
  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const appts = await RealApi.getAppointmentsByCustomer(user.id);
        setAppointments(appts);
        const ords = await RealApi.getOrdersByCustomer(user.id);
        setOrders(ords);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };
    fetchData();
  }, [user.id]);

  const handleOpenEditAddress = (orderId: number, appointmentId: number) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    setNewAddress(appointment?.address || '');
    setEditAddressModal({ isOpen: true, orderId, appointmentId });
  };

  const handleUpdateAddress = async () => {
    if (!editAddressModal.appointmentId || !newAddress.trim()) {
      alert('Please enter a valid address.');
      return;
    }
    try {
      await RealApi.updateAppointmentAddress(editAddressModal.appointmentId, newAddress.trim());
      const [updatedAppointments, updatedOrders] = await Promise.all([
        RealApi.getAppointmentsByCustomer(user.id),
        RealApi.getOrdersByCustomer(user.id)
      ]);
      setAppointments(updatedAppointments);
      setOrders(updatedOrders);
      setEditAddressModal({ isOpen: false, orderId: null, appointmentId: null });
      alert('Address updated successfully!');
    } catch (err) {
      alert('Failed to update address: ' + (err as Error).message);
    }
  };

  const handleCancel = async (id: number) => {
    if (window.confirm("Are you sure you want to cancel this appointment?\n\nCancellation Policy: Cancellations within 24 hours may incur a fee.")) {
      try {
        await RealApi.updateAppointmentStatus(id, AppointmentStatus.Cancelled);
        const updated = await RealApi.getAppointmentsByCustomer(user.id);
        setAppointments(updated);
      } catch (err) {
        alert('Failed to cancel appointment: ' + (err as Error).message);
      }
    }
  };

  const handleOpenReview = (id: number) => {
    setReviewModal({isOpen: true, aptId: id});
    setRating(5);
    setComment('');
    setReviewError(null);
    setSubmittingReview(false);
  };

  const handleSubmitReview = async () => {
    setReviewError(null);
    
    if (!reviewModal.aptId) {
      setReviewError('预约ID缺失，无法提交评价');
      return;
    }
    
    // 验证评分
    if (!rating || rating < 1 || rating > 5) {
      setReviewError('请选择1-5星的评分');
      return;
    }
    
    let appointment = appointments.find(a => a.id === reviewModal.aptId);
    
    // 始终从API重新获取预约，确保数据是最新的和完整的
    // 使用getAppointmentsByCustomer而不是getAllAppointments，确保数据正确映射
    try {
      const customerAppointments = await RealApi.getAppointmentsByCustomer(user.id);
      const fetchedAppointment = customerAppointments.find(a => a.id === reviewModal.aptId);
      
      if (fetchedAppointment) {
        appointment = fetchedAppointment;
      } else {
        // 如果找不到，尝试从所有appointment中查找（作为后备方案）
        const allAppointments = await RealApi.getAllAppointments();
        const fallbackAppointment = allAppointments.find(a => a.id === reviewModal.aptId);
        if (fallbackAppointment) {
          appointment = fallbackAppointment;
        }
      }
    } catch (err) {
      console.error('Failed to fetch appointment from API:', err);
      // 不阻止继续，使用状态中的数据
    }
    
    if (!appointment) {
      setReviewError('找不到预约信息，请刷新页面后重试');
      return;
    }
    
    // 获取必需的ID
    const appointmentId = appointment.id;
    const customerId = user?.id || appointment.customerId;
    const providerId = appointment.providerId;
    
    // 验证所有必需的ID（支持数字和字符串类型）
    const missingFields: string[] = [];
    
    // 辅助函数：将值转换为数字并验证
    const validateId = (id: any, fieldName: string): boolean => {
      if (id === null || id === undefined) {
        console.error(`❌ 验证失败: ${fieldName}为null或undefined`, { id, type: typeof id });
        return false;
      }
      // 转换为数字
      const numId = typeof id === 'string' ? Number(id) : Number(id);
      if (isNaN(numId) || numId <= 0) {
        console.error(`❌ 验证失败: ${fieldName}无效`, { 
          originalValue: id, 
          originalType: typeof id,
          convertedValue: numId,
          isNaN: isNaN(numId),
          isLessOrEqualZero: numId <= 0
        });
        return false;
      }
      return true;
    };
    
    if (!validateId(appointmentId, 'appointmentId')) {
      missingFields.push('预约ID');
    }
    if (!validateId(customerId, 'customerId')) {
      missingFields.push('客户ID');
    }
    if (!validateId(providerId, 'providerId')) {
      missingFields.push('服务人员ID');
      console.error('❌ ProviderId详细诊断:', { 
        providerId, 
        type: typeof providerId,
        isNull: providerId === null,
        isUndefined: providerId === undefined,
        value: JSON.stringify(providerId),
        'appointment.providerId': appointment.providerId,
        'appointment.status': appointment.status,
        'appointment对象': appointment,
        'Number(providerId)': Number(providerId),
        'isNaN(Number(providerId))': isNaN(Number(providerId)),
        'appointment原始数据': JSON.stringify(appointment, null, 2)
      });
      
      // 如果appointment状态是completed但没有providerId，这可能是数据映射问题
      if (appointment.status === 'completed') {
      }
    }
    
    if (missingFields.length > 0) {
      let errorMsg = `缺少以下信息：${missingFields.join(', ')}`;
      if (missingFields.includes('服务人员ID')) {
        errorMsg += '。\n\n提示：此预约可能尚未分配给服务人员。只有已分配给服务人员的预约才能提交评价。';
      } else {
        errorMsg += '。请刷新页面后重试。';
      }
      
      console.error('Missing required fields for review submission:', {
        missingFields,
        appointmentId,
        customerId,
        providerId,
        appointmentData: appointment,
        user: user
      });
      
      setReviewError(errorMsg);
      return;
    }
    
    try {
      setSubmittingReview(true);
      
      // 确保所有ID都是数字类型
      const finalAppointmentId = Number(appointmentId);
      const finalCustomerId = Number(customerId);
      const finalProviderId = Number(providerId);
      const finalRating = Number(rating);
      
      
      // 再次验证（确保转换后仍然有效）
      if (isNaN(finalAppointmentId) || finalAppointmentId <= 0) {
        throw new Error('预约ID无效');
      }
      if (isNaN(finalCustomerId) || finalCustomerId <= 0) {
        throw new Error('客户ID无效');
      }
      if (isNaN(finalProviderId) || finalProviderId <= 0) {
        throw new Error('服务人员ID无效');
      }
      if (isNaN(finalRating) || finalRating < 1 || finalRating > 5) {
        throw new Error('评分无效（必须在1-5之间）');
      }
      
      await RealApi.submitReview(finalAppointmentId, finalCustomerId, finalProviderId, finalRating, comment || '');
      setReviewModal({isOpen: false, aptId: null});
      setRating(5);
      setComment('');
      alert('感谢您的评价！');
      // Refresh appointments to show updated review status
      const updated = await RealApi.getAppointmentsByCustomer(user.id);
      setAppointments(updated);
    } catch (err: any) {
      console.error('Submit review error details:', err);
      console.error('Error stack:', err.stack);
      const errorMessage = err?.message || '未知错误';
      // 解析后端返回的错误信息
      let displayError = errorMessage;
      if (errorMessage.includes('Validation failed') || errorMessage.includes('不能为null') || errorMessage.includes('不能为空')) {
        displayError = '提交失败：缺少必需的字段信息。请刷新页面后重试。';
      } else if (errorMessage.includes('providerId') || errorMessage.includes('服务人员')) {
        displayError = '提交失败：此预约尚未分配给服务人员，无法提交评价。';
      }
      setReviewError(displayError);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOpenReschedule = (apt: Appointment) => {
    // Basic date parsing assuming ISO format from mock data
    const parts = apt.appointmentTime.split('T');
    if (parts.length >= 2) {
        setRescheduleDate(parts[0]);
        setRescheduleTime(parts[1].substring(0, 5));
    }
    setRescheduleAddress(apt.address || '');
    setShowCustomAddress(false);
    setRescheduleModal({isOpen: true, aptId: apt.id});
  };

  // Get unique addresses from user's appointment history
  const getAddressHistory = (): string[] => {
    const addresses = appointments
      .map(apt => apt.address)
      .filter((addr): addr is string => addr !== undefined && addr.trim() !== '');
    // Remove duplicates and return unique addresses
    return Array.from(new Set(addresses));
  };

  const handleSubmitReschedule = async () => {
    if (rescheduleModal.aptId && rescheduleDate && rescheduleTime) {
      if (!rescheduleAddress.trim()) {
        alert('Please enter or select an address');
        return;
      }
      const newDateTime = `${rescheduleDate}T${rescheduleTime}:00`;
      try {
        // Update both time and address
        await RealApi.rescheduleAppointment(rescheduleModal.aptId, newDateTime, rescheduleAddress.trim());
        setRescheduleModal({isOpen: false, aptId: null});
        // Refresh list
        const updated = await RealApi.getAppointmentsByCustomer(user.id);
        setAppointments(updated);
        alert('Appointment rescheduled successfully. Status set to pending.');
      } catch (err) {
        alert('Failed to reschedule appointment: ' + (err as Error).message);
      }
      
      // Close details if open for the same appointment
      if (selectedAppt?.id === rescheduleModal.aptId) {
          setSelectedAppt(null);
      }
    }
  };

  const handleSendReminder = async (id: number) => {
    try {
      await RealApi.sendAppointmentReminder(id, 'email');
      alert('Reminder sent successfully!');
    } catch (err) {
      alert('Failed to send reminder: ' + (err as Error).message);
    }
    alert('Reminder sent to your email!');
  };

  const handleOpenPayment = (orderId: number) => {
    setPaymentModal({isOpen: true, orderId});
    setPaymentMethod('credit_card');
  };

  const handlePayOrder = async () => {
    if (!paymentModal.orderId) return;
    
    try {
      await RealApi.payOrder(paymentModal.orderId);
      const updatedOrders = await RealApi.getOrdersByCustomer(user.id);
      setOrders(updatedOrders);
      setPaymentModal({isOpen: false, orderId: null});
      alert("付款成功！");
    } catch (err) {
      alert('付款失败: ' + (err as Error).message);
    }
  };

  const getServiceForOrder = (apptId: number) => {
    return appointments.find(a => a.id === apptId)?.serviceName || 'Service';
  };

  const reschedulingApt = appointments.find(a => a.id === rescheduleModal.aptId);

  return (
    <PageContainer title="My Dashboard">
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
         <button 
           onClick={() => setActiveTab('appointments')}
           className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'appointments' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
         >
           My Appointments
         </button>
         <button 
           onClick={() => setActiveTab('orders')}
           className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'orders' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
         >
           My Orders
         </button>
      </div>

      {activeTab === 'appointments' && (
        appointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No appointments yet</h3>
              <p className="text-gray-500 mt-1">Book your first service today!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map(apt => (
              <div key={apt.id} className="bg-white p-6 rounded-lg shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center gap-2 mb-1">
                     <h3 className="text-lg font-bold text-gray-900">{apt.serviceName}</h3>
                     <StatusBadge status={apt.status} />
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div className="flex items-center"><Clock className="h-4 w-4 mr-2" /> {new Date(apt.appointmentTime).toLocaleString()} ({apt.durationHours} hrs)</div>
                    <div className="flex items-center"><UserIcon className="h-4 w-4 mr-2" /> Provider: {apt.providerName}</div>
                    <div className="flex items-center"><DollarSign className="h-4 w-4 mr-2" /> Total: ${apt.price}</div>
                  </div>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                   <Button size="sm" variant="secondary" onClick={() => setSelectedAppt(apt)}>Details</Button>
                   {apt.status === AppointmentStatus.Completed && apt.providerId && apt.providerId > 0 && (
                      <Button size="sm" variant="outline" onClick={() => handleOpenReview(apt.id)}>Write Review</Button>
                   )}
                   {apt.status === AppointmentStatus.Completed && (!apt.providerId || apt.providerId <= 0) && (
                      <span className="text-xs text-gray-400 italic px-2 py-1">无法评价（未分配服务人员）</span>
                   )}
                   {(apt.status === AppointmentStatus.Pending || apt.status === AppointmentStatus.Accepted) && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleOpenReschedule(apt)}>Reschedule</Button>
                        <Button size="sm" variant="outline" onClick={() => handleSendReminder(apt.id)} title="Send Email Reminder">
                            <Bell className="h-3 w-3" />
                        </Button>
                      </>
                   )}
                   {apt.status === AppointmentStatus.Pending && (
                      <Button size="sm" variant="danger" onClick={() => handleCancel(apt.id)}>Cancel</Button>
                   )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'orders' && (
        orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed">
            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
             <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map(order => (
                        <tr key={order.id}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{getServiceForOrder(order.appointmentId)}</td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-900">${order.amount}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 capitalize">{order.paymentMethod || '—'}</td>
                            <td className="px-6 py-4"><StatusBadge status={order.paymentStatus} /></td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleOpenPayment(order.id)}>
                                        <CreditCard className="h-4 w-4 mr-1" /> 付款
                                    </Button>
                                    {order.paymentStatus === 'pending' && (
                                        <Button size="sm" onClick={() => handleOpenPayment(order.id)}>Pay Now</Button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        )
      )}

      {/* Details Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => { if(e.target === e.currentTarget) setSelectedAppt(null); }}>
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{selectedAppt.serviceName}</h3>
                        <p className="text-sm text-gray-500">Appointment #{selectedAppt.id}</p>
                    </div>
                    <button onClick={() => setSelectedAppt(null)} className="text-gray-400 hover:text-gray-500 transition-colors">
                        <XCircle className="h-6 w-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Status</span>
                        <StatusBadge status={selectedAppt.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 border rounded-lg">
                            <div className="flex items-center text-gray-500 mb-1">
                                <Clock className="h-4 w-4 mr-1" /> <span className="text-xs font-medium uppercase">Time</span>
                            </div>
                            <p className="font-semibold text-gray-900">{new Date(selectedAppt.appointmentTime).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-600">{new Date(selectedAppt.appointmentTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                            <div className="flex items-center text-gray-500 mb-1">
                                <Clock className="h-4 w-4 mr-1" /> <span className="text-xs font-medium uppercase">Duration</span>
                            </div>
                            <p className="font-semibold text-gray-900">{selectedAppt.durationHours} Hours</p>
                        </div>
                    </div>

                    <div className="p-3 border rounded-lg">
                         <div className="flex items-center text-gray-500 mb-1">
                            <UserIcon className="h-4 w-4 mr-1" /> <span className="text-xs font-medium uppercase">Provider</span>
                        </div>
                        <p className="font-semibold text-gray-900">{selectedAppt.providerName}</p>
                    </div>

                    <div className="p-3 border rounded-lg">
                        <div className="flex items-center text-gray-500 mb-1">
                            <MapPin className="h-4 w-4 mr-1" /> <span className="text-xs font-medium uppercase">Address</span>
                        </div>
                        <p className="text-gray-900 text-sm">{selectedAppt.address}</p>
                    </div>

                     <div className="flex justify-between items-center pt-2 mt-2 border-t">
                        <span className="text-base font-semibold text-gray-700">Total Amount</span>
                        <span className="text-2xl font-bold text-brand-600">${selectedAppt.price}</span>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 flex-wrap">
                    {(selectedAppt.status === AppointmentStatus.Pending || selectedAppt.status === AppointmentStatus.Accepted) && (
                        <Button variant="outline" onClick={() => handleOpenReschedule(selectedAppt)}>Reschedule</Button>
                    )}
                    {selectedAppt.status === AppointmentStatus.Pending && (
                        <Button variant="danger" onClick={() => { handleCancel(selectedAppt.id); setSelectedAppt(null); }}>Cancel Appointment</Button>
                    )}
                    <Button variant="secondary" onClick={() => setSelectedAppt(null)}>Close</Button>
                </div>
            </div>
        </div>
      )}

      {/* Edit Address Modal */}
      {editAddressModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">修改订单信息</h3>
            <p className="text-sm text-gray-600 mb-4">更新服务地址</p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="order-address" className="block text-sm font-medium text-gray-700 mb-1">服务地址</label>
                <textarea
                  id="order-address"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 p-3 border text-sm"
                  rows={3}
                  placeholder="请输入完整的服务地址"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="secondary" onClick={() => setEditAddressModal({isOpen: false, orderId: null, appointmentId: null})}>
                取消
              </Button>
              <Button onClick={handleUpdateAddress} disabled={!newAddress.trim()}>
                保存
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Reschedule Appointment</h3>
                
                {reschedulingApt && (
                    <div className="mb-6 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                        Current schedule: <span className="font-semibold">{new Date(reschedulingApt.appointmentTime).toLocaleString()}</span>
                        <br />
                        Current address: <span className="font-semibold">{reschedulingApt.address || 'Not set'}</span>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label htmlFor="reschedule-date" className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
                        <input 
                            type="date" 
                            id="reschedule-date"
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 p-2 border" 
                            value={rescheduleDate} 
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div>
                        <label htmlFor="reschedule-time" className="block text-sm font-medium text-gray-700 mb-1">New Time</label>
                        <input 
                            type="time" 
                            id="reschedule-time"
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 p-2 border" 
                            value={rescheduleTime} 
                            onChange={(e) => setRescheduleTime(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="reschedule-address" className="block text-sm font-medium text-gray-700 mb-1">Service Address</label>
                        {!showCustomAddress ? (
                            <div className="space-y-2">
                                <select
                                    id="reschedule-address"
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 p-2 border"
                                    value={rescheduleAddress}
                                    onChange={(e) => {
                                        if (e.target.value === '__custom__') {
                                            setShowCustomAddress(true);
                                            setRescheduleAddress('');
                                        } else {
                                            setRescheduleAddress(e.target.value);
                                        }
                                    }}
                                >
                                    <option value="">-- Select an address --</option>
                                    {getAddressHistory().map((addr, idx) => (
                                        <option key={idx} value={addr}>{addr}</option>
                                    ))}
                                    <option value="__custom__">+ Add new address</option>
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <textarea
                                    id="reschedule-custom-address"
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 p-2 border text-sm"
                                    rows={3}
                                    placeholder="Enter full address including unit number"
                                    value={rescheduleAddress}
                                    onChange={(e) => setRescheduleAddress(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="text-sm text-brand-600 hover:text-brand-700"
                                    onClick={() => {
                                        setShowCustomAddress(false);
                                        const currentApt = appointments.find(a => a.id === rescheduleModal.aptId);
                                        setRescheduleAddress(currentApt?.address || '');
                                    }}
                                >
                                    ← Select from saved addresses
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => setRescheduleModal({isOpen: false, aptId: null})}>Cancel</Button>
                    <Button onClick={handleSubmitReschedule} disabled={!rescheduleDate || !rescheduleTime || !rescheduleAddress.trim()}>Confirm Reschedule</Button>
                </div>
            </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
             <h3 className="text-xl font-bold text-gray-900 mb-4">评价服务</h3>
             <div className="flex justify-center space-x-2 mb-6" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button 
                    key={s} 
                    type="button"
                    id={`rating-${s}`}
                    name="rating"
                    value={s}
                    onClick={() => setRating(s)} 
                    className="focus:outline-none transition-transform hover:scale-110"
                    aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
                    aria-pressed={s === rating}
                  >
                    <Star className={`h-10 w-10 ${s <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                  </button>
                ))}
             </div>
             <textarea 
               id="review-comment"
               name="review-comment"
               className="w-full border-gray-300 border rounded-lg p-3 text-sm focus:ring-brand-500 focus:border-brand-500 mb-4" 
               rows={4} 
               placeholder="请在这里写下你的评论......"
               value={comment}
               onChange={(e) => {
                 setComment(e.target.value);
                 setReviewError(null);
               }}
               aria-label="Review comment"
             ></textarea>
             
             {/* Error message display */}
             {reviewError && (
               <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                 <div className="flex items-start">
                   <svg className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                   </svg>
                   <p className="text-sm text-red-800">{reviewError}</p>
                 </div>
               </div>
             )}
             
             <div className="flex justify-end space-x-3">
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setReviewModal({isOpen: false, aptId: null});
                    setReviewError(null);
                  }}
                  disabled={submittingReview}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleSubmitReview}
                  disabled={submittingReview || !rating}
                >
                  {submittingReview ? '提交中...' : '提交评价'}
                </Button>
             </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal.isOpen && paymentModal.orderId && (() => {
        const order = orders.find(o => o.id === paymentModal.orderId);
        if (!order) {
          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <p className="text-gray-600">订单不存在</p>
                <Button onClick={() => setPaymentModal({isOpen: false, orderId: null})} className="mt-4">
                  关闭
                </Button>
              </div>
            </div>
          );
        }
        
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => { if(e.target === e.currentTarget) setPaymentModal({isOpen: false, orderId: null}); }}>
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">付款</h3>
                <button 
                  onClick={() => setPaymentModal({isOpen: false, orderId: null})} 
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">订单号</span>
                    <span className="text-sm font-medium text-gray-900">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">服务项目</span>
                    <span className="text-sm font-medium text-gray-900">{getServiceForOrder(order.appointmentId)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-base font-semibold text-gray-900">应付金额</span>
                    <span className="text-2xl font-bold text-brand-600">${order.amount}</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700 mb-2">
                    付款方式
                  </label>
                  <select
                    id="payment-method"
                    name="payment-method"
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 p-3 border"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="credit_card">信用卡</option>
                    <option value="debit_card">借记卡</option>
                    <option value="paypal">PayPal</option>
                    <option value="alipay">支付宝</option>
                    <option value="wechat">微信支付</option>
                    <option value="bank_transfer">银行转账</option>
                  </select>
                </div>

                {paymentMethod === 'credit_card' && (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="card-number" className="block text-sm font-medium text-gray-700 mb-1">
                        卡号
                      </label>
                      <input
                        type="text"
                        id="card-number"
                        name="card-number"
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 p-2 border"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="card-expiry" className="block text-sm font-medium text-gray-700 mb-1">
                          有效期
                        </label>
                        <input
                          type="text"
                          id="card-expiry"
                          name="card-expiry"
                          className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 p-2 border"
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label htmlFor="card-cvv" className="block text-sm font-medium text-gray-700 mb-1">
                          CVV
                        </label>
                        <input
                          type="text"
                          id="card-cvv"
                          name="card-cvv"
                          className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 p-2 border"
                          placeholder="123"
                          maxLength={4}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="card-name" className="block text-sm font-medium text-gray-700 mb-1">
                        持卡人姓名
                      </label>
                      <input
                        type="text"
                        id="card-name"
                        name="card-name"
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 p-2 border"
                        placeholder="Card Holder Name"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'alipay' && (
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <CreditCard className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">请使用支付宝扫码支付</p>
                  </div>
                )}

                {paymentMethod === 'wechat' && (
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <CreditCard className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">请使用微信扫码支付</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  variant="secondary" 
                  onClick={() => setPaymentModal({isOpen: false, orderId: null})}
                >
                  取消
                </Button>
                <Button 
                  onClick={handlePayOrder}
                  disabled={order.paymentStatus !== 'pending'}
                >
                  确认付款
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </PageContainer>
  );
};

// --- Provider Dashboard ---
export const ProviderDashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'services'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [providerId, setProviderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<{ name: string; income: number }[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(true);

  // Service Management State
  const [providerServices, setProviderServices] = useState<Service[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  
  // Check if appointment service is in provider's service list
  const isServiceInProviderList = (appointment: Appointment): boolean => {
    if (!appointment.serviceId) return true;
    return providerServices.some(s => s.id === appointment.serviceId);
  };

  useEffect(() => {
    const loadProviderData = async () => {
      try {
        // Get all providers and find the one matching current user
        const providers = await RealApi.getProviders();
        const provider = providers.find(p => p.userId === user.id);
        
        if (provider) {
          setProviderId(provider.id);
          const [appts, earnings, services] = await Promise.all([
            RealApi.getAppointmentsByProvider(provider.id),
            RealApi.getProviderWeeklyEarnings(provider.id).catch(err => {
              console.error('Failed to load weekly earnings:', err);
              return [];
            }),
            RealApi.getProviderServices(provider.id).catch(err => {
              console.error('Failed to load provider services:', err);
              return [];
            })
          ]);
          setAppointments(appts);
          setStats(earnings);
          setProviderServices(services);
        } else {
          console.error('Provider profile not found for user:', user.id);
        }
      } catch (err) {
        console.error('Failed to load provider data:', err);
      } finally {
        setLoading(false);
        setEarningsLoading(false);
      }
    };
    loadProviderData();
  }, [user.id]);

  // Load services when switching to services tab
  useEffect(() => {
    if (activeTab === 'services' && providerId && !servicesLoading) {
      loadServices();
    }
  }, [activeTab, providerId]);

  const loadServices = async () => {
    if (!providerId) return;
    setServicesLoading(true);
    try {
      const [myServices, all] = await Promise.all([
        RealApi.getProviderServices(providerId),
        RealApi.getServices()
      ]);
      setProviderServices(myServices);
      setAllServices(all);
      setSelectedServiceIds(myServices.map(s => s.id));
    } catch (err) {
      console.error('Failed to load services:', err);
      alert('Failed to load services: ' + (err as Error).message);
    } finally {
      setServicesLoading(false);
    }
  };

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServiceIds(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSaveServices = async () => {
    if (!providerId) return;
    setServicesLoading(true);
    try {
      await RealApi.updateProviderServices(providerId, selectedServiceIds);
      await loadServices();
      alert('Services updated successfully!');
    } catch (err) {
      console.error('Failed to update services:', err);
      alert('Failed to update services: ' + (err as Error).message);
    } finally {
      setServicesLoading(false);
    }
  };

  const handleAction = async (id: number, status: AppointmentStatus) => {
      if (!providerId) return;
      try {
        await RealApi.updateAppointmentStatus(id, status);
        // Refresh
        const updated = await RealApi.getAppointmentsByProvider(providerId);
        setAppointments(updated);
      } catch (err) {
        alert('Failed to update appointment: ' + (err as Error).message);
      }
  };

  const handleSendReminder = async (id: number) => {
      try {
        await RealApi.sendAppointmentReminder(id, 'push');
        alert('Reminder notification sent to customer!');
      } catch (err) {
        alert('Failed to send reminder: ' + (err as Error).message);
      }
  };

  if (loading) return <div className="p-8 text-center">Loading provider data...</div>;
  if (!providerId) return <div className="p-8 text-center text-red-500">Provider profile not found. Please contact support.</div>;

  return (
    <PageContainer title="Provider Portal">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border col-span-2">
              <h3 className="text-lg font-semibold mb-4">Weekly Earnings</h3>
              <div className="h-64 flex items-center justify-center">
                {earningsLoading ? (
                  <p className="text-gray-500">Loading earnings...</p>
                ) : stats.length === 0 ? (
                  <p className="text-gray-500">No earnings data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                          <Tooltip />
                          <Bar dataKey="income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
          </div>
          <div className="bg-blue-600 p-6 rounded-xl shadow-sm text-white flex flex-col justify-between">
              <div>
                  <h3 className="text-blue-100 font-medium mb-1">Total Jobs Done</h3>
                  <p className="text-4xl font-bold">{appointments.filter(a => a.status === 'completed').length}</p>
              </div>
              <div>
                  <h3 className="text-blue-100 font-medium mb-1">Rating</h3>
                  <div className="flex items-center">
                    <span className="text-4xl font-bold">4.9</span>
                    <Star className="h-6 w-6 ml-2 text-yellow-400 fill-current" />
                  </div>
              </div>
          </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`${
              activeTab === 'appointments'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`${
              activeTab === 'services'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Folder className="h-4 w-4 mr-2" />
            Manage Services
          </button>
        </nav>
      </div>

      {activeTab === 'appointments' && (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Schedule</h2>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map(apt => {
                    const isAdminAssigned = !isServiceInProviderList(apt);
                    return (
                    <tr key={apt.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(apt.appointmentTime).toLocaleDateString()} <br/>
                            <span className="text-gray-500">{new Date(apt.appointmentTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                                <span>{apt.serviceName}</span>
                                {isAdminAssigned && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full" title="此单为管理员派发">
                                        管理员派发
                                    </span>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs" title={apt.address}>{apt.address}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={apt.status} /></td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {apt.status === AppointmentStatus.Pending && (
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleAction(apt.id, AppointmentStatus.Accepted)} className="text-green-600 hover:text-green-900 flex items-center"><CheckCircle className="h-4 w-4 mr-1"/> Accept</button>
                                    <button onClick={() => handleAction(apt.id, AppointmentStatus.Cancelled)} className="text-red-600 hover:text-red-900 flex items-center"><XCircle className="h-4 w-4 mr-1"/> Decline</button>
                                </div>
                            )}
                            {apt.status === AppointmentStatus.Accepted && (
                                <div className="flex items-center justify-end">
                                    <button onClick={() => handleSendReminder(apt.id)} className="text-blue-600 hover:text-blue-900 flex items-center mr-3" title="Send Reminder Notification">
                                        <Bell className="h-4 w-4 mr-1"/> Remind
                                    </button>
                                    <button onClick={() => handleAction(apt.id, AppointmentStatus.Completed)} className="text-brand-600 hover:text-brand-900">Mark Complete</button>
                                </div>
                            )}
                        </td>
                    </tr>
                    );
                })}
            </tbody>
        </table>
      </div>
        </>
      )}

      {activeTab === 'services' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Manage Your Services</h2>
            <Button
              onClick={handleSaveServices}
              disabled={servicesLoading}
              className="flex items-center"
            >
              {servicesLoading ? 'Saving...' : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          {servicesLoading && !providerServices.length ? (
            <div className="text-center py-12 text-gray-500">Loading services...</div>
          ) : (
            <div className="space-y-6">
              {(() => {
                const categories = Array.from(new Set(allServices.map(s => s.categoryId))) as number[];
                const categoryMap: { [key: number]: string } = {};
                allServices.forEach(s => {
                  if (!categoryMap[s.categoryId]) {
                    categoryMap[s.categoryId] = s.categoryName || 'Other';
                  }
                });

                return categories.map((categoryId: number) => {
                  const categoryServices = allServices.filter(s => s.categoryId === categoryId);
                  if (categoryServices.length === 0) return null;

                  return (
                    <div key={categoryId} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">{categoryMap[categoryId] || 'Other'}</h3>
                      <div className="space-y-2">
                        {categoryServices.map(service => {
                          const isSelected = selectedServiceIds.includes(service.id);
                          return (
                            <label
                              key={service.id}
                              className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleServiceToggle(service.id)}
                                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                              />
                              <div className="ml-3 flex-1">
                                <div className="font-medium text-gray-900">{service.name}</div>
                                {service.description && (
                                  <div className="text-sm text-gray-500">{service.description}</div>
                                )}
                              </div>
                              <div className="text-sm font-medium text-brand-600">
                                ¥{service.price}/{service.priceUnit}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

// --- Admin Dashboard ---
export const AdminDashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'categories' | 'appointments'>('overview');
  
  return (
    <PageContainer title="Admin Panel">
       <div className="flex space-x-1 mb-8 border-b border-gray-200 overflow-x-auto">
         <button 
           className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
           onClick={() => setActiveTab('overview')}
         >
           Overview
         </button>
         <button 
           className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'users' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
           onClick={() => setActiveTab('users')}
         >
           User Management
         </button>
         <button 
           className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'categories' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
           onClick={() => setActiveTab('categories')}
         >
           Service Categories
         </button>
         <button 
           className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'appointments' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
           onClick={() => setActiveTab('appointments')}
         >
           All Appointments
         </button>
       </div>
       
       {activeTab === 'overview' && <AdminOverview />}
       {activeTab === 'users' && <AdminUserManagement />}
       {activeTab === 'categories' && <AdminCategoryManagement />}
       {activeTab === 'appointments' && <AdminAppointments />}
    </PageContainer>
  );
};

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [revenueData, setRevenueData] = useState<{ name: string; revenue: number }[]>([]);
  const [chartLoading, setChartLoading] = useState<boolean>(true);

  useEffect(() => {
    RealApi.getStats().then(setStats).catch(err => {
      console.error('Failed to load stats:', err);
    });
    RealApi.getOrders().then(setOrders).catch(err => {
      console.error('Failed to load orders:', err);
    });
    RealApi.getRevenueByMonth()
      .then(setRevenueData)
      .catch(err => {
        console.error('Failed to load revenue data:', err);
      })
      .finally(() => setChartLoading(false));
  }, []);

  if (!stats) return <div className="p-8 text-center text-gray-500">Loading stats...</div>;

  const defaultChartData = [
    { name: 'Jan', revenue: 0 },
    { name: 'Feb', revenue: 0 },
    { name: 'Mar', revenue: 0 },
    { name: 'Apr', revenue: 0 },
    { name: 'May', revenue: 0 },
    { name: 'Jun', revenue: 0 },
    { name: 'Jul', revenue: 0 },
    { name: 'Aug', revenue: 0 },
    { name: 'Sep', revenue: 0 },
    { name: 'Oct', revenue: 0 },
    { name: 'Nov', revenue: 0 },
    { name: 'Dec', revenue: 0 },
  ];

  const chartData = revenueData.length ? revenueData : defaultChartData;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">${stats.revenue.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <p className="text-sm font-medium text-gray-500">Pending Appts</p>
                <p className="text-2xl font-bold text-brand-600 mt-2">{stats.pendingAppointments}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Overview</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                            <Tooltip />
                            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {chartLoading && <p className="text-sm text-gray-400 mt-4">Loading revenue data...</p>}
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
                </div>
                <div className="overflow-y-auto max-h-72">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.map(order => (
                                <tr key={order.id}>
                                    <td className="px-6 py-3 text-sm text-gray-900">{order.orderNumber}</td>
                                    <td className="px-6 py-3 text-sm text-gray-900">${order.amount}</td>
                                    <td className="px-6 py-3 text-sm text-gray-500 capitalize">{order.paymentMethod}</td>
                                    <td className="px-6 py-3 text-sm"><StatusBadge status={order.paymentStatus} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </>
  );
}

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    RealApi.getUsers().then(data => {
      setUsers(data);
      setLoading(false);
    });
  };

  const handleStatusToggle = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    if (window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} user ${user.username}?`)) {
       // Note: updateUserStatus is not implemented in backend yet
       alert('User status update not implemented in backend');
       // await RealApi.updateUserStatus(user.id, newStatus);
       fetchUsers();
    }
  };

  const filteredUsers = filterRole === 'all' ? users : users.filter(u => u.role === filterRole);

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center bg-white border rounded-lg p-1">
             {(['all', UserRole.Customer, UserRole.ServiceProvider, UserRole.Admin] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${filterRole === role ? 'bg-brand-100 text-brand-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {role === 'all' ? 'All Users' : role.replace('_', ' ')}
                </button>
             ))}
          </div>
          <div className="relative">
             <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
             <input type="text" placeholder="Search users..." className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-64" />
          </div>
       </div>

       <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
                <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
             </thead>
             <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                   <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading users...</td></tr>
                ) : filteredUsers.length === 0 ? (
                   <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No users found.</td></tr>
                ) : filteredUsers.map(u => (
                   <tr key={u.id}>
                      <td className="px-6 py-4">
                         <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium">
                               {u.name.charAt(0)}
                            </div>
                            <div className="ml-4">
                               <div className="text-sm font-medium text-gray-900">{u.name}</div>
                               <div className="text-sm text-gray-500">@{u.username}</div>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            u.role === UserRole.Admin ? 'bg-purple-100 text-purple-800' :
                            u.role === UserRole.ServiceProvider ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                         }`}>
                            {u.role.replace('_', ' ')}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                         {u.email && <div className="mb-1">{u.email}</div>}
                         {u.phone && <div>{u.phone}</div>}
                      </td>
                      <td className="px-6 py-4">
                         <StatusBadge status={u.status} />
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                         {u.role !== UserRole.Admin && (
                            <Button 
                               size="sm" 
                               variant={u.status === 'active' ? 'danger' : 'success'}
                               onClick={() => handleStatusToggle(u)}
                            >
                               {u.status === 'active' ? 
                                 <><Lock className="h-3 w-3 mr-1" /> Deactivate</> : 
                                 <><Unlock className="h-3 w-3 mr-1" /> Activate</>
                               }
                            </Button>
                         )}
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  )
}

const AdminCategoryManagement: React.FC = () => {
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setIsLoading(true);
        const data = await RealApi.getCategories();
        setCategories(data);
        setIsLoading(false);
    };

    const handleOpenModal = (category?: ServiceCategory) => {
        if (category) {
            setEditingCategory(category);
            setFormData({ name: category.name, description: category.description });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            // Note: deleteCategory is not implemented in backend yet
            alert('Delete category not implemented in backend');
            // await RealApi.deleteCategory(id);
            loadCategories();
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            // Note: updateCategory is not implemented in backend yet
            alert('Update category not implemented in backend');
            // await RealApi.updateCategory({ ...editingCategory, ...formData });
        } else {
            // Note: addCategory is not implemented in backend yet
            alert('Add category not implemented in backend');
            // await RealApi.addCategory(formData);
        }
        setIsModalOpen(false);
        loadCategories();
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Service Categories</h2>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="h-4 w-4 mr-2" /> Add Category
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Loading categories...</td></tr>
                        ) : categories.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No categories found.</td></tr>
                        ) : categories.map(cat => (
                            <tr key={cat.id}>
                                <td className="px-6 py-4 text-sm text-gray-500">#{cat.id}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-brand-50 rounded-lg text-brand-600 mr-3">
                                            <Folder className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{cat.description}</td>
                                <td className="px-6 py-4 text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        <button onClick={() => handleOpenModal(cat)} className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded">
                                            <Trash className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingCategory ? 'Edit Category' : 'Add New Category'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                                <input 
                                    type="text" 
                                    required
                                    id="category-name"
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 p-2 border" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Plumbing"
                                />
                            </div>
                            <div>
                                <label htmlFor="category-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea 
                                    required
                                    rows={3}
                                    id="category-description"
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 p-2 border" 
                                    value={formData.description} 
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Describe the category..."
                                />
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit">{editingCategory ? 'Update Category' : 'Create Category'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminAppointments: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [search, setSearch] = useState('');

    // Provider assignment modal state
    const [providerModal, setProviderModal] = useState<{isOpen: boolean, appointmentId: number | null}>({isOpen: false, appointmentId: null});
    const [providers, setProviders] = useState<ServiceProvider[]>([]);
    const [providerServicesMap, setProviderServicesMap] = useState<Map<number, Service[]>>(new Map());
    const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
    const [assigningProvider, setAssigningProvider] = useState(false);
    const [loadingProviderServices, setLoadingProviderServices] = useState(false);
    
    // Filter states for provider modal
    const [providerSearch, setProviderSearch] = useState('');
    const [filterByService, setFilterByService] = useState(true); // Only show providers who offer the service
    const [minRating, setMinRating] = useState<number | null>(null);

    useEffect(() => {
        RealApi.getAllAppointments().then(data => {
            setAppointments(data);
            setFilteredAppointments(data);
            setLoading(false);
        });
        // Load providers for assignment
        RealApi.getProviders().then(async data => {
            const approvedProviders = data.filter(p => p.status === 'approved');
            setProviders(approvedProviders);
            
            // Load services for each provider
            const servicesMap = new Map<number, Service[]>();
            setLoadingProviderServices(true);
            try {
                await Promise.all(
                    approvedProviders.map(async (provider) => {
                        try {
                            const services = await RealApi.getProviderServices(provider.id);
                            servicesMap.set(provider.id, services);
                        } catch (err) {
                            console.error(`Failed to load services for provider ${provider.id}:`, err);
                            servicesMap.set(provider.id, []);
                        }
                    })
                );
                setProviderServicesMap(servicesMap);
            } catch (err) {
                console.error('Failed to load provider services:', err);
            } finally {
                setLoadingProviderServices(false);
            }
        }).catch(err => {
            console.error('Failed to load providers:', err);
        });
    }, []);

    const handleOpenProviderModal = (appointmentId: number) => {
        const appointment = appointments.find(a => a.id === appointmentId);
        // Prevent opening modal for completed appointments
        if (appointment?.status === AppointmentStatus.Completed) {
            alert('无法修改已完成预约的服务人员');
            return;
        }
        setSelectedProviderId(appointment?.providerId || null);
        setProviderModal({isOpen: true, appointmentId});
        // Reset filters when opening modal
        setProviderSearch('');
        setFilterByService(true);
        setMinRating(null);
    };
    
    const getFilteredProviders = (): ServiceProvider[] => {
        const currentAppointment = getCurrentAppointment();
        let filtered = providers;
        
        // Filter by service match
        if (filterByService && currentAppointment?.serviceId) {
            filtered = filtered.filter(provider => {
                const services = providerServicesMap.get(provider.id) || [];
                return services.some(s => s.id === currentAppointment.serviceId);
            });
        }
        
        // Filter by search text
        if (providerSearch.trim()) {
            const searchLower = providerSearch.toLowerCase();
            filtered = filtered.filter(provider => 
                provider.name.toLowerCase().includes(searchLower) ||
                provider.introduction?.toLowerCase().includes(searchLower)
            );
        }
        
        // Filter by minimum rating
        if (minRating !== null) {
            filtered = filtered.filter(provider => 
                provider.rating && provider.rating >= minRating
            );
        }
        
        return filtered;
    };

    const getCurrentAppointment = () => {
        if (!providerModal.appointmentId) return null;
        return appointments.find(a => a.id === providerModal.appointmentId);
    };

    const checkProviderServiceMatch = (providerId: number | null) => {
        if (!providerId) return { match: true, message: '' };
        const appointment = getCurrentAppointment();
        if (!appointment || !appointment.serviceId) return { match: true, message: '' };
        
        const providerServices = providerServicesMap.get(providerId) || [];
        const hasService = providerServices.some(s => s.id === appointment.serviceId);
        
        if (!hasService) {
            return {
                match: false,
                message: '此服务人员未选择此服务类型，此单为管理员派发'
            };
        }
        return { match: true, message: '' };
    };

    const handleAssignProvider = async () => {
        if (!providerModal.appointmentId) return;
        setAssigningProvider(true);
        try {
            await RealApi.updateAppointmentProvider(providerModal.appointmentId, selectedProviderId);
            // Refresh appointments
            const updated = await RealApi.getAllAppointments();
            setAppointments(updated);
            setProviderModal({isOpen: false, appointmentId: null});
            setSelectedProviderId(null);
            alert('Provider assigned successfully!');
        } catch (err) {
            alert('Failed to assign provider: ' + (err as Error).message);
        } finally {
            setAssigningProvider(false);
        }
    };

    useEffect(() => {
        let result = appointments;

        if (statusFilter !== 'all') {
            result = result.filter(a => a.status === statusFilter);
        }

        if (dateStart) {
            result = result.filter(a => new Date(a.appointmentTime) >= new Date(dateStart));
        }

        if (dateEnd) {
             const end = new Date(dateEnd);
             end.setHours(23, 59, 59, 999);
             result = result.filter(a => new Date(a.appointmentTime) <= end);
        }

        if (search) {
            const lower = search.toLowerCase();
            result = result.filter(a => 
                (a.customerName?.toLowerCase().includes(lower) || '') ||
                (a.providerName?.toLowerCase().includes(lower) || '') ||
                (a.serviceName?.toLowerCase().includes(lower) || '')
            );
        }

        setFilteredAppointments(result);
    }, [appointments, statusFilter, dateStart, dateEnd, search]);

    const clearFilters = () => {
        setStatusFilter('all');
        setDateStart('');
        setDateEnd('');
        setSearch('');
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 w-full">
                    <div className="flex-1">
                        <label htmlFor="admin-search" className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                        <div className="relative">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                id="admin-search"
                                placeholder="Customer, Provider or Service..." 
                                className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-full"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-48">
                         <label htmlFor="admin-status-filter" className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                         <select 
                            id="admin-status-filter"
                            className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                         >
                            <option value="all">All Statuses</option>
                            {Object.values(AppointmentStatus).map(s => (
                                <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                            ))}
                         </select>
                    </div>
                    <div className="w-full md:w-auto flex gap-2">
                        <div>
                            <label htmlFor="admin-start-date" className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                            <input 
                                type="date" 
                                id="admin-start-date"
                                className="border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
                                value={dateStart}
                                onChange={(e) => setDateStart(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="admin-end-date" className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                            <input 
                                type="date" 
                                id="admin-end-date"
                                className="border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
                                value={dateEnd}
                                onChange={(e) => setDateEnd(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div>
                     <Button variant="secondary" size="sm" onClick={clearFilters}>Clear</Button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                             <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Loading appointments...</td></tr>
                        ) : filteredAppointments.length === 0 ? (
                             <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No appointments found matching filters.</td></tr>
                        ) : filteredAppointments.map(apt => (
                            <tr key={apt.id}>
                                <td className="px-6 py-4 text-sm text-gray-500">#{apt.id}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {new Date(apt.appointmentTime).toLocaleDateString()} <br/>
                                    <span className="text-gray-500 text-xs">{new Date(apt.appointmentTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{apt.serviceName}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{apt.customerName}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{apt.providerName || <span className="text-gray-400 italic">Unassigned</span>}</td>
                                <td className="px-6 py-4"><StatusBadge status={apt.status} /></td>
                                <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">${apt.price}</td>
                                <td className="px-6 py-4 text-right text-sm font-medium">
                                    {apt.status === AppointmentStatus.Completed ? (
                                        <span className="text-gray-400 text-xs italic" title="Cannot modify provider for completed appointments">
                                            已完成
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleOpenProviderModal(apt.id)}
                                            className="text-brand-600 hover:text-brand-900 flex items-center ml-auto"
                                            title="Assign/Change Provider"
                                        >
                                            <Edit className="h-4 w-4 mr-1" />
                                            Provider
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Provider Assignment Modal */}
            {providerModal.isOpen && providerModal.appointmentId && (() => {
                const currentAppointment = getCurrentAppointment();
                const serviceMatch = checkProviderServiceMatch(selectedProviderId);
                const isCompleted = currentAppointment?.status === AppointmentStatus.Completed;
                
                return (
                    <div 
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setProviderModal({isOpen: false, appointmentId: null});
                                setSelectedProviderId(null);
                            }
                        }}
                    >
                        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 my-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Assign Service Provider</h3>
                                    {currentAppointment && (
                                        <>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Service: <span className="font-medium">{currentAppointment.serviceName}</span>
                                            </p>
                                            {isCompleted && (
                                                <p className="text-sm text-yellow-600 mt-1 font-medium">
                                                    ⚠️ 此预约已完成，无法修改服务人员
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setProviderModal({isOpen: false, appointmentId: null});
                                        setSelectedProviderId(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-500 transition-colors"
                                >
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>

                            {isCompleted ? (
                                <div className="text-center py-12">
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                                        <p className="text-yellow-800 font-medium">此预约已完成，无法修改服务人员</p>
                                        <p className="text-yellow-600 text-sm mt-2">已完成的服务预约不允许修改服务提供者</p>
                                    </div>
                                </div>
                            ) : loadingProviderServices ? (
                                <div className="text-center py-12 text-gray-500">Loading provider services...</div>
                            ) : (
                                <>
                                    {/* Filter Section */}
                                    <div className="mb-6 space-y-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="flex flex-col md:flex-row gap-4">
                                            {/* Search */}
                                            <div className="flex-1">
                                                <label htmlFor="provider-search" className="block text-xs font-medium text-gray-700 mb-1">
                                                    搜索服务人员
                                                </label>
                                                <div className="relative">
                                                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        id="provider-search"
                                                        placeholder="输入姓名或简介搜索..."
                                                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-full"
                                                        value={providerSearch}
                                                        onChange={(e) => setProviderSearch(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Filter by service */}
                                            <div className="w-full md:w-auto">
                                                <label htmlFor="filter-by-service" className="block text-xs font-medium text-gray-700 mb-1">
                                                    筛选条件
                                                </label>
                                                <div className="flex items-center h-10">
                                                    <label className="flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            id="filter-by-service"
                                                            className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                                                            checked={filterByService}
                                                            onChange={(e) => setFilterByService(e.target.checked)}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700">仅显示可提供此服务的</span>
                                                    </label>
                                                </div>
                                            </div>
                                            
                                            {/* Rating filter */}
                                            <div className="w-full md:w-auto">
                                                <label htmlFor="min-rating" className="block text-xs font-medium text-gray-700 mb-1">
                                                    最低评分
                                                </label>
                                                <select
                                                    id="min-rating"
                                                    className="h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                    value={minRating === null ? '' : minRating.toString()}
                                                    onChange={(e) => setMinRating(e.target.value ? parseFloat(e.target.value) : null)}
                                                >
                                                    <option value="">不限</option>
                                                    <option value="4.0">4.0★ 以上</option>
                                                    <option value="4.5">4.5★ 以上</option>
                                                    <option value="4.8">4.8★ 以上</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Results count */}
                                    <div className="mb-4 flex items-center justify-between">
                                        <p className="text-sm text-gray-600">
                                            找到 <span className="font-medium text-gray-900">{getFilteredProviders().length}</span> 位服务人员
                                            {providers.length !== getFilteredProviders().length && (
                                                <span className="text-gray-400 ml-1">（共 {providers.length} 位）</span>
                                            )}
                                        </p>
                                        {(providerSearch || minRating !== null || !filterByService) && (
                                            <button
                                                onClick={() => {
                                                    setProviderSearch('');
                                                    setFilterByService(true);
                                                    setMinRating(null);
                                                }}
                                                className="text-sm text-brand-600 hover:text-brand-800"
                                            >
                                                清除筛选
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto mb-6">
                                        {/* Unassign option */}
                                        <div
                                            onClick={() => setSelectedProviderId(null)}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                selectedProviderId === null
                                                    ? 'border-brand-500 bg-brand-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-gray-900">取消分配 (Unassign)</span>
                                                {selectedProviderId === null && (
                                                    <CheckCircle className="h-5 w-5 text-brand-600" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Provider cards */}
                                        {getFilteredProviders().length === 0 ? (
                                            <div className="col-span-2 text-center py-12 text-gray-500">
                                                没有找到符合筛选条件的服务人员
                                            </div>
                                        ) : (
                                            <>
                                                {getFilteredProviders().map(provider => {
                                            const providerServices = providerServicesMap.get(provider.id) || [];
                                            const isSelected = selectedProviderId === provider.id;
                                            
                                            return (
                                                <div
                                                    key={provider.id}
                                                    onClick={() => setSelectedProviderId(provider.id)}
                                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                        isSelected
                                                            ? 'border-brand-500 bg-brand-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-semibold text-gray-900">{provider.name}</span>
                                                                {isSelected && (
                                                                    <CheckCircle className="h-5 w-5 text-brand-600" />
                                                                )}
                                                            </div>
                                                            {provider.rating && (
                                                                <div className="flex items-center text-sm text-gray-600">
                                                                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                                                    <span>{provider.rating}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {provider.introduction && (
                                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{provider.introduction}</p>
                                                    )}
                                                    
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 mb-2">可提供的服务：</p>
                                                        {providerServices.length > 0 ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {providerServices.map(service => (
                                                                    <span
                                                                        key={service.id}
                                                                        className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
                                                                    >
                                                                        {service.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">暂无服务</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                            </>
                                        )}
                                    </div>

                                    {/* Warning message if service doesn't match */}
                                    {selectedProviderId && !serviceMatch.match && (
                                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-yellow-800">提示</h3>
                                                    <p className="mt-1 text-sm text-yellow-700">{serviceMatch.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end space-x-3">
                                        <Button 
                                            variant="secondary" 
                                            onClick={() => {
                                                setProviderModal({isOpen: false, appointmentId: null});
                                                setSelectedProviderId(null);
                                            }}
                                        >
                                            {isCompleted ? '关闭' : 'Cancel'}
                                        </Button>
                                        {!isCompleted && (
                                            <Button 
                                                onClick={handleAssignProvider}
                                                disabled={assigningProvider}
                                            >
                                                {assigningProvider ? 'Assigning...' : 'Assign Provider'}
                                            </Button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};