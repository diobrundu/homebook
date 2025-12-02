<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 管理员导航栏（包含顶部菜单） -->
    <AdminNavbar />
    
    <!-- 内容区域（全宽） -->
    <main class="max-w-full mx-auto p-6">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router';
import AdminNavbar from '@/components/AdminNavbar.vue';
import { useUserStore } from '@/stores/user';
import { computed, onMounted } from 'vue';

const router = useRouter();
const { user } = useUserStore();

// 验证管理员权限
const isAdmin = computed(() => {
  const role = user.value?.role?.toLowerCase();
  return role === 'admin';
});

onMounted(() => {
  if (!isAdmin.value) {
    router.push('/login');
  }
});
</script>

<style scoped>
</style>
