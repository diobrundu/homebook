<template>
  <nav class="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 第一行：Logo和用户信息 -->
      <div class="flex justify-between items-center h-16 border-b border-gray-200">
        <!-- Logo -->
        <div class="flex items-center">
          <RouterLink
            to="/admin"
            class="flex items-center cursor-pointer"
          >
            <span class="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
              A
            </span>
            <span class="ml-2 text-xl font-bold text-gray-900">管理后台</span>
          </RouterLink>
        </div>

        <!-- 右侧菜单 -->
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-700">管理员：{{ user?.name || 'Admin' }}</span>
          
          <!-- 返回前台 -->
          <button
            class="btn btn-outline-sm"
            @click="goToFrontend"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回前台
          </button>
          
          <!-- 退出登录 -->
          <button
            class="btn btn-secondary-sm"
            @click="logout"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            退出登录
          </button>
        </div>
      </div>

      <!-- 第二行：导航菜单 -->
      <div class="flex items-center space-x-1 h-14">
        <router-link
          to="/admin"
          class="nav-item"
          :class="{ 'nav-item-active': $route.path === '/admin' }"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>控制台</span>
        </router-link>
        
        <router-link
          to="/admin/users"
          class="nav-item"
          :class="{ 'nav-item-active': $route.path === '/admin/users' }"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>用户管理</span>
        </router-link>
        
        <router-link
          to="/admin/providers"
          class="nav-item"
          :class="{ 'nav-item-active': $route.path === '/admin/providers' }"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>服务人员管理</span>
        </router-link>
        
        <router-link
          to="/admin/orders"
          class="nav-item"
          :class="{ 'nav-item-active': $route.path === '/admin/orders' }"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span>订单管理</span>
        </router-link>
        
        <router-link
          to="/admin/appointments"
          class="nav-item"
          :class="{ 'nav-item-active': $route.path === '/admin/appointments' }"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>预约管理</span>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const { user, setUser } = useUserStore();

const goToFrontend = () => {
  router.push('/');
};

const logout = () => {
  setUser(null);
  router.push('/login');
};
</script>

<style scoped>
.btn {
  @apply inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-outline-sm {
  @apply bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500 px-4 py-2 text-sm;
}

.btn-secondary-sm {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 px-4 py-2 text-sm;
}

.nav-item {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium;
}

.nav-item-active {
  @apply bg-purple-50 text-purple-700 font-semibold border-b-2 border-purple-600;
}
</style>
