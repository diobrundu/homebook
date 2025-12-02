<template>
  <div class="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
    <p class="text-8xl font-black text-brand-100">404</p>
    <h1 class="text-3xl font-bold text-gray-900 mt-4">页面走丢了</h1>
    <p class="text-gray-500 mt-2 max-w-lg">
      我们没有找到您访问的页面。请检查地址是否正确，或返回首页继续浏览服务。
    </p>
    <div class="mt-6 flex gap-4">
      <button class="btn btn-primary" @click="router.push('/')">返回首页</button>
      <button class="btn btn-secondary" @click="router.back()">返回上一页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style scoped>
.btn {
  @apply inline-flex items-center justify-center rounded-lg font-medium transition-colors px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2;
}
.btn-primary {
  @apply bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500;
}
.btn-secondary {
  @apply bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-brand-500;
}
</style>


