<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">预约管理</h1>
      <p class="text-gray-600 mt-2">管理所有预约信息</p>
    </div>

    <div class="bg-white rounded-xl shadow-sm border p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <select
            v-model="statusFilter"
            class="input border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="accepted">已接受</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
        <button class="btn-secondary" @click="loadAppointments" :disabled="loading">
          刷新
        </button>
      </div>

      <div class="table-wrapper max-h-[600px] overflow-y-auto">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>时间</th>
              <th>客户</th>
              <th>服务人员</th>
              <th>服务</th>
              <th>地址</th>
              <th>价格</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredAppointments.length === 0">
              <td colspan="9" class="text-center py-6 text-gray-500">
                {{ loading ? '加载中...' : '暂无预约' }}
              </td>
            </tr>
            <tr v-for="apt in filteredAppointments" :key="apt.id">
              <td class="text-sm text-gray-600">#{{ apt.id }}</td>
              <td>
                <p class="font-medium text-gray-900">{{ formatDate(apt.appointmentTime) }}</p>
                <p class="text-xs text-gray-500">{{ apt.durationHours }} 小时</p>
              </td>
              <td class="text-sm text-gray-700">{{ apt.customerName || '客户' }}</td>
              <td class="text-sm text-gray-700">{{ apt.providerName || '未分配' }}</td>
              <td class="text-sm text-gray-600">{{ apt.serviceName || apt.serviceId }}</td>
              <td class="text-sm text-gray-500 max-w-xs truncate">{{ apt.address }}</td>
              <td class="font-semibold text-gray-900">¥{{ apt.price }}</td>
              <td>
                <StatusBadge :status="apt.status" />
              </td>
              <td>
                <select
                  class="input text-sm"
                  :value="apt.status"
                  @change="updateAppointment(apt.id, $event.target.value as any)"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import RealApi from '@/services/realApi';
import type { Appointment } from '@/types';
import { AppointmentStatus } from '@/types';
import { useUserStore } from '@/stores/user';
import StatusBadge from '@/components/StatusBadge.vue';

const router = useRouter();
const { user } = useUserStore();

const appointments = ref<Appointment[]>([]);
const loading = ref(false);
const statusFilter = ref('');

const ensureAdmin = () => {
  if (!user.value || user.value.role !== 'admin') {
    router.push('/login');
    throw new Error('NOT_AUTHORIZED');
  }
};

const loadAppointments = async () => {
  loading.value = true;
  try {
    appointments.value = await RealApi.getAllAppointments();
  } finally {
    loading.value = false;
  }
};

const filteredAppointments = computed(() => {
  if (!statusFilter.value) return appointments.value;
  return appointments.value.filter(apt => apt.status === statusFilter.value);
});

const updateAppointment = async (appointmentId: number, status: AppointmentStatus) => {
  try {
    await RealApi.updateAppointmentStatus(appointmentId, status);
    await loadAppointments();
  } catch (error: any) {
    alert('更新失败: ' + (error.message || '未知错误'));
  }
};

const formatDate = (value: string) => new Date(value).toLocaleString();

onMounted(async () => {
  try {
    ensureAdmin();
    await loadAppointments();
  } catch (error) {
    console.error(error);
  }
});
</script>

<style scoped>
.input {
  @apply focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500;
}
.table-wrapper {
  @apply -mx-6;
}
table {
  @apply min-w-full divide-y divide-gray-200;
}
th {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50;
}
td {
  @apply px-6 py-4 text-sm text-gray-700 align-top;
}
.btn-secondary {
  @apply inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 font-medium px-3 py-1.5 hover:bg-gray-50 transition;
}
</style>

