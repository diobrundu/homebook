<template>
  <div v-if="loading" class="p-12 text-center text-gray-500">
    服务详情加载中...
  </div>
  <div v-else-if="!service" class="p-12 text-center text-red-500">
    未找到对应服务
  </div>
  <div v-else class="bg-white min-h-screen">
    <section class="relative bg-gray-900 h-64 md:h-80">
      <img
        :src="`https://picsum.photos/1200/600?random=${service.id}`"
        class="w-full h-full object-cover opacity-40"
        :alt="service.name"
      />
      <div class="absolute inset-0 flex items-center">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <span class="inline-block py-1 px-3 rounded-full bg-brand-600 text-white text-xs font-semibold uppercase tracking-wide mb-3">
            {{ service.categoryName || '未分类' }}
          </span>
          <h1 class="text-3xl md:text-5xl font-bold text-white mb-2">
            {{ service.name }}
          </h1>
          <div class="flex items-center text-white/90 gap-4 text-sm">
            <span>4.8 ⭐ · 120+ 条评价</span>
            <span>已验证服务者</span>
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div class="lg:col-span-2 space-y-10">
        <article>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">服务介绍</h2>
          <p class="text-lg text-gray-600 leading-relaxed">
            {{ service.description }}
          </p>
        </article>

        <section v-if="providers.length">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">推荐服务者</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article
              v-for="provider in providers"
              :key="provider.id"
              class="border rounded-xl p-4 hover:shadow-md cursor-pointer flex items-start gap-4"
              @click="go(`/provider-profile/${provider.id}`)"
            >
              <div class="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg flex-shrink-0">
                {{ provider.name.charAt(0) }}
              </div>
              <div>
                <h3 class="font-bold text-gray-900">
                  {{ provider.name }}
                  <span class="ml-1 text-sm text-green-600">已认证</span>
                </h3>
                <p class="text-sm text-gray-500 mt-1">
                  评分：{{ provider.rating.toFixed(1) }} / 5
                </p>
                <p class="text-xs text-brand-600 mt-2 font-medium">
                  查看详情 →
                </p>
              </div>
            </article>
          </div>
        </section>

        <section v-if="reviews.length">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">用户评价</h2>
          <div class="space-y-4">
            <article
              v-for="(review, idx) in reviews"
              :key="idx"
              class="bg-gray-50 p-6 rounded-xl border"
            >
              <header class="flex justify-between items-start mb-2">
                <div>
                  <h3 class="font-semibold text-gray-900">{{ review.user }}</h3>
                  <p class="text-xs text-gray-500">
                    {{ formatDate(review.date) }}
                  </p>
                </div>
                <span class="text-yellow-500 text-sm">
                  {{ '⭐'.repeat(review.rating) }}
                </span>
              </header>
              <p class="text-gray-600 italic">“{{ review.comment }}”</p>
            </article>
          </div>
        </section>
      </div>

      <aside class="lg:col-span-1">
        <div class="sticky top-24 space-y-6">
          <div class="bg-white rounded-xl shadow-lg border p-6">
            <p class="text-sm text-gray-500 font-medium uppercase tracking-wide">起步价</p>
            <div class="flex items-baseline mt-1">
              <span class="text-4xl font-extrabold text-gray-900">¥{{ service.price }}</span>
              <span class="text-gray-500 ml-2 font-medium">/ {{ service.priceUnit }}</span>
            </div>
            <button
              class="btn btn-primary w-full mt-6"
              @click="go(`/book/${service.id}`)"
            >
              立即预约
            </button>
            <p class="text-xs text-center text-gray-500 mt-4">
              完成服务后再付款
            </p>
          </div>

          <div class="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <h3 class="font-bold text-gray-900 mb-2">服务保障</h3>
            <ul class="text-sm text-gray-600 space-y-2">
              <li>✓ 24 小时客服支持</li>
              <li>✓ 不满意免费补单</li>
              <li>✓ 平台在线签约</li>
            </ul>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { Service, ServiceProvider } from '@/types';
import RealApi from '@/services/realApi';

interface Review {
  user: string;
  rating: number;
  comment: string;
  date: string;
}

const props = defineProps<{ id: string }>();
const router = useRouter();

const service = ref<Service | null>(null);
const reviews = ref<Review[]>([]);
const providers = ref<ServiceProvider[]>([]);
const loading = ref(true);

const loadData = async (serviceId: string) => {
  loading.value = true;
  service.value = null;
  try {
    const s = await RealApi.getServiceById(Number(serviceId));
    if (s) {
      service.value = s;
      reviews.value = await RealApi.getServiceReviews(s.id);
      const allProviders = await RealApi.getProviders();
      providers.value =
        s.categoryId === 1
          ? allProviders.filter((p) => p.id === 1)
          : allProviders.slice(0, 2);
    }
  } catch (error) {
    console.error('加载服务详情失败', error);
  } finally {
    loading.value = false;
  }
};

const go = (path: string) => router.push(path);

const formatDate = (input: string) => {
  try {
    return new Date(input).toLocaleDateString();
  } catch {
    return input;
  }
};

watch(
  () => props.id,
  (val) => {
    if (val) loadData(val);
  },
  { immediate: true },
);
</script>

<style scoped>
.btn {
  @apply inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
}
.btn-primary {
  @apply bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 px-4 py-3;
}
</style>


