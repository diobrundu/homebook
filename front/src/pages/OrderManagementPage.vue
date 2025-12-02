<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">订单管理</h1>
      <p class="text-gray-600 mt-2">管理所有订单信息</p>
    </div>

    <div class="bg-white rounded-xl shadow-sm border p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索订单号..."
            class="input border border-gray-300 rounded-lg px-4 py-2"
          />
          <select
            v-model="statusFilter"
            class="input border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">全部状态</option>
            <option value="pending">待支付</option>
            <option value="paid">已支付</option>
            <option value="failed">支付失败</option>
            <option value="refunded">已退款</option>
          </select>
        </div>
        <button class="btn-secondary" @click="loadOrders" :disabled="loading">
          刷新
        </button>
      </div>

      <div class="table-wrapper max-h-[600px] overflow-y-auto">
        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>预约ID</th>
              <th>金额</th>
              <th>支付状态</th>
              <th>支付方式</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredOrders.length === 0">
              <td colspan="6" class="text-center py-6 text-gray-500">
                {{ loading ? '加载中...' : '暂无订单' }}
              </td>
            </tr>
            <tr v-for="order in filteredOrders" :key="order.id">
              <td class="font-mono text-sm text-gray-700">{{ order.orderNumber }}</td>
              <td class="text-sm text-gray-600">#{{ order.appointmentId }}</td>
              <td class="font-semibold text-gray-900">¥{{ order.amount }}</td>
              <td><StatusBadge :status="order.paymentStatus" /></td>
              <td class="text-sm text-gray-500">{{ order.paymentMethod || '未设置' }}</td>
              <td class="text-sm text-gray-500">{{ formatDate(order.id) }}</td>
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
import type { Order } from '@/types';
import { useUserStore } from '@/stores/user';
import StatusBadge from '@/components/StatusBadge.vue';

const router = useRouter();
const { user } = useUserStore();

const orders = ref<Order[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');

const ensureAdmin = () => {
  if (!user.value || user.value.role !== 'admin') {
    router.push('/login');
    throw new Error('NOT_AUTHORIZED');
  }
};

const loadOrders = async () => {
  loading.value = true;
  try {
    orders.value = await RealApi.getOrders();
  } finally {
    loading.value = false;
  }
};

const filteredOrders = computed(() => {
  let result = orders.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(order => 
      order.orderNumber.toLowerCase().includes(query)
    );
  }
  
  if (statusFilter.value) {
    result = result.filter(order => order.paymentStatus === statusFilter.value);
  }
  
  return result;
});

const formatDate = (value: any) => {
  // 如果value是数字，可能是时间戳
  if (typeof value === 'number') {
    return new Date(value).toLocaleString();
  }
  return new Date().toLocaleString();
};

onMounted(async () => {
  try {
    ensureAdmin();
    await loadOrders();
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

