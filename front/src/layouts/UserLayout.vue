<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
    <!-- 用户/服务人员导航栏 -->
    <Navbar />

    <!-- 主要内容区域 -->
    <main class="flex-1">
      <RouterView />
    </main>

    <!-- 页脚 -->
    <footer class="bg-white border-t mt-auto py-8">
      <div class="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
        &copy; 2025 HomeBook Inc. All rights reserved.
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import Navbar from '@/components/Navbar.vue';
</script>

<style scoped>
</style>

