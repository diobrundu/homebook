<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">用户管理</h1>
      <p class="text-gray-600 mt-2">管理系统中的所有用户</p>
    </div>

    <div class="bg-white rounded-xl shadow-sm border p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索用户名或邮箱..."
            class="input border border-gray-300 rounded-lg px-4 py-2"
          />
          <select
            v-model="roleFilter"
            class="input border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">全部角色</option>
            <option value="customer">客户</option>
            <option value="service_provider">服务人员</option>
            <option value="admin">管理员</option>
          </select>
          <select
            v-model="statusFilter"
            class="input border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">全部状态</option>
            <option value="non_member">非会员</option>
            <option value="member">会员</option>
            <option value="super_member">超级会员</option>
          </select>
        </div>
        <button class="btn-secondary" @click="loadUsers" :disabled="loading">
          刷新
        </button>
      </div>

      <div class="table-wrapper max-h-[600px] overflow-y-auto">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>姓名</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="7" class="text-center py-6 text-gray-500">
                {{ loading ? '加载中...' : '暂无用户' }}
              </td>
            </tr>
            <tr v-for="u in filteredUsers" :key="u.id">
              <td class="text-sm text-gray-600">#{{ u.id }}</td>
              <td class="font-medium text-gray-900">{{ u.username }}</td>
              <td class="text-sm text-gray-700">{{ u.name }}</td>
              <td class="text-sm text-gray-600">{{ u.email || '-' }}</td>
              <td>
                <span
                  class="px-2 py-1 text-xs font-semibold rounded-full"
                  :class="{
                    'bg-blue-100 text-blue-700': u.role === 'customer',
                    'bg-green-100 text-green-700': u.role === 'service_provider',
                    'bg-purple-100 text-purple-700': u.role === 'admin',
                  }"
                >
                  {{ u.role === 'customer' ? '客户' : u.role === 'service_provider' ? '服务人员' : '管理员' }}
                </span>
              </td>
              <td>
                <StatusBadge :status="u.status" />
              </td>
              <td>
                <button
                  class="text-sm text-brand-600 hover:text-brand-700"
                  @click="handleUpdateStatus(u)"
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
import type { User } from '@/types';
import { useUserStore } from '@/stores/user';
import StatusBadge from '@/components/StatusBadge.vue';

const router = useRouter();
const { user } = useUserStore();

const users = ref<User[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const roleFilter = ref('');
const statusFilter = ref('');

const ensureAdmin = () => {
  if (!user.value || user.value.role !== 'admin') {
    router.push('/login');
    throw new Error('NOT_AUTHORIZED');
  }
};

const loadUsers = async () => {
  loading.value = true;
  try {
    users.value = await RealApi.getUsers();
  } finally {
    loading.value = false;
  }
};

const filteredUsers = computed(() => {
  let result = users.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(u => 
      u.username.toLowerCase().includes(query) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      u.name.toLowerCase().includes(query)
    );
  }
  
  if (roleFilter.value) {
    result = result.filter(u => u.role === roleFilter.value);
  }
  
  if (statusFilter.value) {
    result = result.filter(u => u.status === statusFilter.value);
  }
  
  return result;
});

const handleUpdateStatus = async (u: User) => {
  const newStatus = prompt(`修改用户 ${u.name} 的会员状态 (non_member/member/super_member):`, u.status);
  if (newStatus && ['non_member', 'member', 'super_member'].includes(newStatus)) {
    try {
      await RealApi.updateUserStatus(u.id, newStatus as 'non_member' | 'member' | 'super_member');
      await loadUsers();
      alert('会员状态更新成功');
    } catch (error: any) {
      alert('更新失败: ' + (error.message || '未知错误'));
    }
  }
};

onMounted(async () => {
  try {
    ensureAdmin();
    await loadUsers();
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

