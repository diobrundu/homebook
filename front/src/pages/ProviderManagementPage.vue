<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">服务人员管理</h1>
      <p class="text-gray-600 mt-2">管理所有服务人员信息</p>
    </div>

    <div class="bg-white rounded-xl shadow-sm border p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索服务人员姓名..."
            class="input border border-gray-300 rounded-lg px-4 py-2"
          />
          <select
            v-model="statusFilter"
            class="input border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">全部状态</option>
            <option value="pending">待审核</option>
            <option value="approved">已批准</option>
            <option value="rejected">已拒绝</option>
            <option value="suspended">已暂停</option>
          </select>
        </div>
        <button class="btn-secondary" @click="loadProviders" :disabled="loading">
          刷新
        </button>
      </div>

      <div class="table-wrapper max-h-[600px] overflow-y-auto">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>姓名</th>
              <th>评分</th>
              <th>状态</th>
              <th>简介</th>
              <th>加入日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredProviders.length === 0">
              <td colspan="7" class="text-center py-6 text-gray-500">
                {{ loading ? '加载中...' : '暂无服务人员' }}
              </td>
            </tr>
            <tr v-for="provider in filteredProviders" :key="provider.id">
              <td class="text-sm text-gray-600">#{{ provider.id }}</td>
              <td class="font-medium text-gray-900">{{ provider.name }}</td>
              <td>
                <span class="text-sm font-semibold text-gray-900">
                  {{ provider.rating.toFixed(1) }}
                </span>
                <span class="text-xs text-gray-500 ml-1">⭐</span>
              </td>
              <td>
                <StatusBadge :status="provider.status" />
              </td>
              <td class="text-sm text-gray-600 max-w-xs truncate">
                {{ provider.introduction || '-' }}
              </td>
              <td class="text-sm text-gray-500">
                {{ formatDate(provider.joinDate) }}
              </td>
              <td>
                <button
                  class="text-sm text-brand-600 hover:text-brand-700"
                  @click="handleUpdateStatus(provider)"
                >
                  修改状态
                </button>
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
import type { ServiceProvider } from '@/types';
import { useUserStore } from '@/stores/user';
import StatusBadge from '@/components/StatusBadge.vue';

const router = useRouter();
const { user } = useUserStore();

const providers = ref<ServiceProvider[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');

const ensureAdmin = () => {
  if (!user.value || user.value.role !== 'admin') {
    router.push('/login');
    throw new Error('NOT_AUTHORIZED');
  }
};

const loadProviders = async () => {
  loading.value = true;
  try {
    providers.value = await RealApi.getProviders();
  } finally {
    loading.value = false;
  }
};

const filteredProviders = computed(() => {
  let result = providers.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(p => 
      p.name.toLowerCase().includes(query) ||
      (p.introduction && p.introduction.toLowerCase().includes(query))
    );
  }
  
  if (statusFilter.value) {
    result = result.filter(p => p.status === statusFilter.value);
  }
  
  return result;
});

const handleUpdateStatus = async (provider: ServiceProvider) => {
  const newStatus = prompt(
    `修改服务人员 ${provider.name} 的状态 (pending/approved/rejected/suspended):`,
    provider.status
  );
  if (newStatus && ['pending', 'approved', 'rejected', 'suspended'].includes(newStatus)) {
    // 这里需要后端API支持，暂时只显示提示
    alert('状态更新功能需要后端API支持');
    // await RealApi.updateProviderStatus(provider.id, newStatus);
    // await loadProviders();
  }
};

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

onMounted(async () => {
  try {
    ensureAdmin();
    await loadProviders();
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

