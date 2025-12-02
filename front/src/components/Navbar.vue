<template>
  <nav 
    class="bg-white shadow-sm z-50 transition-transform duration-300 ease-in-out"
    :class="props.hideOnScroll ? 'fixed top-0 left-0 right-0' : 'sticky top-0'"
    :style="props.hideOnScroll && isHidden ? { transform: 'translateY(-100%)' } : {}"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <RouterLink
          to="/"
          class="flex items-center cursor-pointer"
        >
          <span class="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">
            HB
          </span>
          <span class="ml-2 text-xl font-bold text-gray-900">HomeBook</span>
        </RouterLink>

        <div class="hidden md:flex items-center space-x-4">
          <RouterLink
            v-if="!isAdmin"
            to="/user/services"
            class="text-gray-600 hover:text-brand-600 px-3 py-2 rounded-md text-sm font-medium"
          >
            Services
          </RouterLink>

          <template v-if="user">
            <div class="flex items-center space-x-4 ml-4">
              <span class="text-sm text-gray-700">Hi, {{ user.name }}</span>
              <span
                class="px-2 py-1 text-xs font-semibold rounded-full bg-brand-100 text-brand-700 uppercase"
              >
                {{ user.role?.toString().replace('_', ' ') }}
              </span>

              <button
                v-if="isCustomer"
                class="btn btn-primary-sm"
                @click="go('/user/dashboard')"
              >
                My Dashboard
              </button>
              <button
                v-if="isProvider"
                class="btn btn-primary-sm"
                @click="go('/user/provider')"
              >
                Provider Portal
              </button>
              <button
                v-if="isAdmin"
                class="btn btn-primary-sm"
                @click="go('/admin')"
              >
                Admin Panel
              </button>

              <button
                v-if="!isAdmin"
                class="btn btn-outline-sm"
                @click="go('/user/profile')"
              >
                Profile
              </button>

              <button
                class="btn btn-secondary-sm"
                @click="logout"
              >
                Logout
              </button>
            </div>
          </template>
          <template v-else>
            <div class="flex space-x-2">
              <RouterLink
                to="/login"
                class="btn btn-secondary-sm"
              >
                Log in
              </RouterLink>
              <RouterLink
                to="/register"
                class="btn btn-primary-sm"
              >
                Sign up
              </RouterLink>
            </div>
          </template>
        </div>

        <!-- Mobile menu button -->
        <div class="flex items-center md:hidden">
          <button
            class="text-gray-500 hover:text-gray-700"
            @click="isOpen = !isOpen"
          >
            <span class="sr-only">Open main menu</span>
            <svg
              v-if="!isOpen"
              class="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <svg
              v-else
              class="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div
      v-if="isOpen"
      class="md:hidden bg-white border-t"
    >
      <div class="px-2 pt-2 pb-3 space-y-1">
        <button
          v-if="!isAdmin"
          class="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
          @click="go('/user/services')"
        >
          Services
        </button>

        <template v-if="user">
          <button
            class="block w-full text-left px-3 py-2 text-base font-medium text-brand-600 hover:bg-gray-50"
            @click="go(defaultDashboardPath)"
          >
            Dashboard
          </button>
          <button
            v-if="!isAdmin"
            class="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
            @click="go('/user/profile')"
          >
            My Profile
          </button>
          <button
            class="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-gray-50"
            @click="logout"
          >
            Logout
          </button>
        </template>
        <template v-else>
          <button
            class="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
            @click="go('/login')"
          >
            Login
          </button>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';

interface Props {
  hideOnScroll?: boolean; // 是否启用滚动隐藏功能
}

const props = withDefaults(defineProps<Props>(), {
  hideOnScroll: false,
});

const isOpen = ref(false);
const isHidden = ref(false);
const router = useRouter();
const { user, setUser } = useUserStore();

let lastScrollY = 0;
let scrollTimeout: number | null = null;

// 滚动处理函数
const handleScroll = () => {
  if (!props.hideOnScroll) return;
  
  const currentScrollY = window.scrollY;
  
  // 清除之前的定时器
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  
  // 如果滚动距离小于10px，不处理（避免顶部抖动）
  if (Math.abs(currentScrollY - lastScrollY) < 10) {
    return;
  }
  
  // 向下滚动且超过一定距离时隐藏
  if (currentScrollY > lastScrollY && currentScrollY > 100) {
    isHidden.value = true;
  } 
  // 向上滚动时显示
  else if (currentScrollY < lastScrollY) {
    isHidden.value = false;
  }
  
  // 在顶部时始终显示
  if (currentScrollY <= 10) {
    isHidden.value = false;
  }
  
  lastScrollY = currentScrollY;
};

onMounted(() => {
  if (props.hideOnScroll) {
    window.addEventListener('scroll', handleScroll, { passive: true });
    lastScrollY = window.scrollY;
  }
});

onUnmounted(() => {
  if (props.hideOnScroll) {
    window.removeEventListener('scroll', handleScroll);
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
  }
});

const normalizeRole = (role?: string) => role?.toLowerCase() ?? '';

const isCustomer = computed(() => normalizeRole(user.value?.role) === 'customer');
const isProvider = computed(() => normalizeRole(user.value?.role) === 'service_provider');
const isAdmin = computed(() => normalizeRole(user.value?.role) === 'admin');

const defaultDashboardPath = computed(() => {
  if (isAdmin.value) return '/admin';
  if (isProvider.value) return '/user/provider';
  return '/user/dashboard';
});

const go = (path: string) => {
  isOpen.value = false;
  router.push({ path });
};

const logout = () => {
  setUser(null);
  isOpen.value = false;
  router.push({ path: '/' });
};
</script>

<style scoped>
.btn {
  @apply inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-primary-sm {
  @apply bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 px-4 py-2 text-sm;
}
.btn-secondary-sm {
  @apply bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-brand-500 px-4 py-2 text-sm;
}
.btn-outline-sm {
  @apply bg-transparent text-brand-600 border border-brand-600 hover:bg-brand-50 focus:ring-brand-500 px-4 py-2 text-sm;
}
</style>


