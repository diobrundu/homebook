<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
    <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card">
        <p class="text-sm text-gray-500">全部预约</p>
        <p class="text-3xl font-bold text-gray-900">{{ appointments.length }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500">待处理</p>
        <p class="text-3xl font-bold text-yellow-600">{{ pendingAppointments }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500">未付订单</p>
        <p class="text-3xl font-bold text-red-600">{{ unpaidOrders }}</p>
      </div>
    </section>

    <section>
      <div class="section-header">
        <h2>预约列表</h2>
        <button class="btn-secondary" @click="reloadAppointments" :disabled="loadingAppointments">
          刷新
        </button>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>服务</th>
              <th>地址</th>
              <th>状态</th>
              <th class="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="appointments.length === 0">
              <td colspan="5" class="text-center py-6 text-gray-500">暂无预约</td>
            </tr>
            <tr v-for="apt in appointments" :key="apt.id">
              <td>
                <p class="font-medium text-gray-900">
                  {{ formatDate(apt.appointmentTime) }}
                </p>
                <p class="text-xs text-gray-500">
                  时长 {{ apt.durationHours }} 小时
                </p>
              </td>
              <td>
                <p class="text-gray-900 font-medium">{{ apt.serviceName || apt.serviceId }}</p>
                <p class="text-sm text-gray-500">技师：{{ apt.providerName || '待分配' }}</p>
              </td>
              <td class="text-sm text-gray-500">{{ apt.address }}</td>
              <td>
                <StatusBadge :status="apt.status" />
              </td>
              <td class="text-right space-x-2">
                <button
                  v-if="canCancel(apt.status)"
                  class="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                  @click="handleCancel(apt.id)"
                >
                  取消
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <div class="section-header">
        <h2>订单与支付</h2>
        <button class="btn-secondary" @click="reloadOrders" :disabled="loadingOrders">
          刷新
        </button>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>金额</th>
              <th>状态</th>
              <th class="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="orders.length === 0">
              <td colspan="4" class="text-center py-6 text-gray-500">暂无订单</td>
            </tr>
            <tr v-for="order in orders" :key="order.id">
              <td class="font-mono text-sm text-gray-700">{{ order.orderNumber }}</td>
              <td class="font-semibold text-gray-900">¥{{ order.amount }}</td>
              <td><StatusBadge :status="order.paymentStatus" /></td>
              <td class="text-right">
                <button
                  v-if="order.paymentStatus !== 'paid'"
                  class="btn-primary"
                  @click="handlePay(order.id)"
                >
                  支付
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import RealApi from '@/services/realApi';
import { AppointmentStatus, type Appointment, type Order } from '@/types';
import { useUserStore } from '@/stores/user';
import StatusBadge from '@/components/StatusBadge.vue';

const router = useRouter();
const { user } = useUserStore();

const appointments = ref<Appointment[]>([]);
const orders = ref<Order[]>([]);
const loadingAppointments = ref(false);
const loadingOrders = ref(false);

const ensureLoggedIn = () => {
  if (!user.value) {
    router.push('/login');
    throw new Error('NOT_AUTHENTICATED');
  }
  return user.value;
};

const loadAppointments = async () => {
  const currentUser = ensureLoggedIn();
  loadingAppointments.value = true;
  try {
    appointments.value = await RealApi.getAppointmentsByCustomer(currentUser.id);
  } finally {
    loadingAppointments.value = false;
  }
};

const loadOrders = async () => {
  const currentUser = ensureLoggedIn();
  loadingOrders.value = true;
  try {
    orders.value = await RealApi.getOrdersByCustomer(currentUser.id);
  } finally {
    loadingOrders.value = false;
  }
};

const reloadAppointments = () => loadAppointments().catch(console.error);
const reloadOrders = () => loadOrders().catch(console.error);

const pendingAppointments = computed(
  () => appointments.value.filter((apt) => apt.status === AppointmentStatus.Pending).length,
);

const unpaidOrders = computed(
  () => orders.value.filter((order) => order.paymentStatus !== 'paid').length,
);

const canCancel = (status: AppointmentStatus) =>
  [AppointmentStatus.Pending, AppointmentStatus.Accepted].includes(status);

const handleCancel = async (appointmentId: number) => {
  if (!confirm('确定取消该预约吗？')) return;
  await RealApi.updateAppointmentStatus(appointmentId, AppointmentStatus.Cancelled);
  await loadAppointments();
};

const handlePay = async (orderId: number) => {
  await RealApi.payOrder(orderId);
  await loadOrders();
  alert('支付成功');
};

const formatDate = (value: string) => new Date(value).toLocaleString();

onMounted(async () => {
  try {
    ensureLoggedIn();
    await Promise.all([loadAppointments(), loadOrders()]);
  } catch (error) {
    console.error(error);
  }
});
</script>

<style scoped>
.card {
  @apply bg-white rounded-xl shadow-sm border p-6 space-y-2;
}
.section-header {
  @apply flex items-center justify-between mb-4;
}
.section-header h2 {
  @apply text-xl font-bold text-gray-900;
}
.table-wrapper {
  @apply bg-white rounded-xl shadow-sm border overflow-hidden;
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
.btn-primary {
  @apply inline-flex items-center justify-center rounded-lg bg-brand-600 text-white font-medium px-4 py-2 hover:bg-brand-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-60;
}
.btn-secondary {
  @apply inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 font-medium px-3 py-1.5 hover:bg-gray-50 transition;
}
</style>


