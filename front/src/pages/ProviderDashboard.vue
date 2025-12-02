<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
    <section v-if="!provider" class="text-center py-20 text-gray-500">
      无法找到您的服务者资料，请联系管理员开通
    </section>

    <template v-else>
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="card col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">本周收入</h2>
            <button class="btn-secondary" @click="loadEarnings" :disabled="loadingEarnings">刷新</button>
          </div>
          <div class="h-48 flex items-center justify-center">
            <p v-if="loadingEarnings" class="text-gray-500">加载中...</p>
            <p v-else-if="weeklyEarnings.length === 0" class="text-gray-500">暂无数据</p>
            <div v-else class="w-full space-y-2">
              <div
                v-for="item in weeklyEarnings"
                :key="item.name"
                class="flex items-center gap-3 text-sm"
              >
                <span class="w-16 text-gray-500">{{ item.name }}</span>
                <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-brand-500"
                    :style="{ width: `${Math.min(item.income / maxIncome * 100, 100)}%` }"
                  ></div>
                </div>
                <span class="w-12 text-right font-medium text-gray-900">¥{{ item.income }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card">
          <p class="text-sm text-gray-500">已完成服务</p>
          <p class="text-4xl font-bold text-gray-900">
            {{ completedAppointments }}
          </p>
          <p class="text-sm text-gray-500 mt-2">上次登录：{{ lastLogin }}</p>
        </div>
      </section>

      <section>
        <div class="section-header">
          <div class="flex gap-4">
            <button
              class="tab"
              :class="{ active: activeTab === 'appointments' }"
              @click="activeTab = 'appointments'"
            >
              预约管理
            </button>
            <button
              class="tab"
              :class="{ active: activeTab === 'services' }"
              @click="activeTab = 'services'"
            >
              服务管理
            </button>
          </div>
          <button class="btn-secondary" @click="loadAppointments" :disabled="loadingAppointments">
            刷新
          </button>
        </div>

        <div v-if="activeTab === 'appointments'" class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>客户</th>
                <th>服务内容</th>
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
                  <p class="font-semibold text-gray-900">{{ formatDate(apt.appointmentTime) }}</p>
                  <p class="text-xs text-gray-500">{{ apt.durationHours }} 小时</p>
                </td>
                <td>
                  <p class="font-medium text-gray-900">{{ apt.customerName || '客户' }}</p>
                  <p class="text-xs text-gray-500">{{ apt.address }}</p>
                </td>
                <td>
                  <p class="font-medium text-gray-900">{{ apt.serviceName || '服务' }}</p>
                </td>
                <td><StatusBadge :status="apt.status" /></td>
                <td class="text-right space-x-2">
                  <button
                    v-if="apt.status === 'pending'"
                    class="btn-secondary"
                    @click="updateStatus(apt.id, 'accepted')"
                  >
                    接单
                  </button>
                  <button
                    v-if="apt.status === 'in_progress' || apt.status === 'accepted'"
                    class="btn-primary"
                    @click="updateStatus(apt.id, 'completed')"
                  >
                    完成
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">我提供的服务</h3>
            <button class="btn-secondary" @click="loadServices" :disabled="loadingServices">
              重新加载
            </button>
          </div>
          <p class="text-sm text-gray-500">勾选服务后点击保存即可更新您的可接项目</p>
          <div class="divide-y divide-gray-200">
            <label
              v-for="service in allServices"
              :key="service.id"
              class="flex items-center justify-between py-3"
            >
              <div>
                <p class="font-medium text-gray-900">{{ service.name }}</p>
                <p class="text-xs text-gray-500">{{ service.categoryName }}</p>
              </div>
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                :value="service.id"
                v-model="selectedServiceIds"
              />
            </label>
          </div>
          <button class="btn-primary w-full" :disabled="loadingServices" @click="saveServices">
            保存设置
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import RealApi from '@/services/realApi';
import type { Appointment, Service, ServiceProvider } from '@/types';
import { AppointmentStatus } from '@/types';
import { useUserStore } from '@/stores/user';
import StatusBadge from '@/components/StatusBadge.vue';

const router = useRouter();
const { user } = useUserStore();

const provider = ref<ServiceProvider | null>(null);
const appointments = ref<Appointment[]>([]);
const weeklyEarnings = ref<{ name: string; income: number }[]>([]);
const loadingAppointments = ref(false);
const loadingEarnings = ref(false);
const loadingServices = ref(false);
const allServices = ref<Service[]>([]);
const selectedServiceIds = ref<number[]>([]);
const activeTab = ref<'appointments' | 'services'>('appointments');

const maxIncome = computed(() =>
  Math.max(...weeklyEarnings.value.map((item) => item.income), 1),
);

const completedAppointments = computed(
  () => appointments.value.filter((apt) => apt.status === AppointmentStatus.Completed).length,
);

const lastLogin = computed(() =>
  new Date(Date.now() - 1000 * 60 * 60 * 24).toLocaleDateString(),
);

const ensureProvider = async () => {
  if (!user.value) {
    router.push('/login');
    throw new Error('NOT_AUTHENTICATED');
  }
  if (provider.value) return provider.value;
  const providers = await RealApi.getProviders();
  const found = providers.find((p) => p.userId === user.value?.id) || null;
  provider.value = found;
  if (!found) throw new Error('Provider not found');
  return found;
};

const loadAppointments = async () => {
  loadingAppointments.value = true;
  try {
    const prov = await ensureProvider();
    appointments.value = await RealApi.getAppointmentsByProvider(prov.id);
  } finally {
    loadingAppointments.value = false;
  }
};

const loadEarnings = async () => {
  loadingEarnings.value = true;
  try {
    const prov = await ensureProvider();
    weeklyEarnings.value = await RealApi.getProviderWeeklyEarnings(prov.id);
  } catch (error) {
    weeklyEarnings.value = [];
    console.error(error);
  } finally {
    loadingEarnings.value = false;
  }
};

const loadServices = async () => {
  loadingServices.value = true;
  try {
    const prov = await ensureProvider();
    const [mine, all] = await Promise.all([
      RealApi.getProviderServices(prov.id),
      RealApi.getServices(),
    ]);
    selectedServiceIds.value = mine.map((service) => service.id);
    allServices.value = all;
  } finally {
    loadingServices.value = false;
  }
};

const saveServices = async () => {
  const prov = await ensureProvider();
  await RealApi.updateProviderServices(prov.id, selectedServiceIds.value);
  alert('服务项目已更新');
};

const updateStatus = async (appointmentId: number, status: AppointmentStatus) => {
  await RealApi.updateAppointmentStatus(appointmentId, status);
  await loadAppointments();
};

const formatDate = (value: string) => new Date(value).toLocaleString();

onMounted(async () => {
  try {
    await ensureProvider();
    await Promise.all([loadAppointments(), loadEarnings(), loadServices()]);
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
  @apply flex items-center justify-between;
}
.tab {
  @apply px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-transparent hover:border-gray-200;
}
.tab.active {
  @apply bg-brand-50 text-brand-700 border-brand-200;
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


