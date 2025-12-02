<template>
  <div v-if="loading" class="p-12 text-center text-gray-500">
    服务者信息加载中...
  </div>
  <div v-else-if="!provider" class="p-12 text-center text-red-500">
    未找到对应服务者
  </div>
  <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <aside class="lg:col-span-1">
        <div class="bg-white rounded-xl shadow-sm border overflow-hidden sticky top-24">
          <div class="h-32 bg-brand-600"></div>
          <div class="px-6 pb-6 text-center -mt-12">
            <div class="h-24 w-24 rounded-full bg-white border-4 border-white mx-auto flex items-center justify-center text-3xl font-bold text-brand-600 shadow-md">
              {{ provider.name.charAt(0) }}
            </div>
            <h2 class="mt-4 text-xl font-bold text-gray-900">
              {{ provider.name }}
              <span class="text-blue-500 text-sm ml-1">✔</span>
            </h2>
            <p class="text-gray-500 text-sm mt-2">{{ provider.introduction }}</p>
            <div class="flex justify-center items-center mt-4 text-yellow-500">
              <span class="text-gray-900 font-bold mr-2">{{ provider.rating.toFixed(1) }}</span>
              <span>⭐</span>
              <span class="text-gray-400 text-sm ml-1">({{ reviews.length }} 条评价)</span>
            </div>
          </div>
        </div>
      </aside>

      <section class="lg:col-span-2 space-y-10">
        <article>
          <h3 class="text-xl font-bold text-gray-900 mb-4">可提供的服务</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="service in services"
              :key="service.id"
              class="bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between"
            >
              <div>
                <p class="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1">
                  {{ service.categoryName }}
                </p>
                <h4 class="text-lg font-bold text-gray-900 mb-2">
                  {{ service.name }}
                </h4>
                <p class="text-sm text-gray-500 line-clamp-2">
                  {{ service.description }}
                </p>
              </div>
              <div class="mt-4 flex items-center justify-between">
                <span class="font-bold text-gray-900">
                  ¥{{ service.price }}
                  <span class="text-sm font-normal text-gray-500">/{{ service.priceUnit }}</span>
                </span>
                <button
                  class="btn btn-primary-sm"
                  @click="go(`/book/${service.id}`)"
                >
                  预约
                </button>
              </div>
            </div>
            <p
              v-if="services.length === 0"
              class="col-span-2 text-center text-gray-500 py-8 bg-gray-50 rounded-xl"
            >
              暂无服务信息
            </p>
          </div>
        </article>

        <article>
          <h3 class="text-xl font-bold text-gray-900 mb-4">客户评价</h3>
          <div class="space-y-4">
            <div
              v-for="(review, index) in reviews"
              :key="index"
              class="bg-white p-5 rounded-xl border shadow-sm"
            >
              <header class="flex justify-between items-start mb-2">
                <div>
                  <p class="text-sm font-bold text-gray-900">{{ review.user }}</p>
                  <p class="text-xs text-gray-500">{{ formatDate(review.date) }}</p>
                </div>
                <span class="text-yellow-500 text-sm">
                  {{ '⭐'.repeat(review.rating) }}
                </span>
              </header>
              <p class="text-gray-600 text-sm">“{{ review.comment }}”</p>
            </div>
            <p
              v-if="reviews.length === 0"
              class="text-center text-gray-500 py-8 bg-gray-50 rounded-xl"
            >
              暂无评价
            </p>
          </div>
        </article>
      </section>
    </div>
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

const provider = ref<ServiceProvider | null>(null);
const services = ref<Service[]>([]);
const reviews = ref<Review[]>([]);
const loading = ref(true);

const fetchProfile = async (providerId: string) => {
  loading.value = true;
  provider.value = null;
  try {
    const id = Number(providerId);
    provider.value = await RealApi.getProviderById(id);
    services.value = await RealApi.getServicesByProviderId(id);
    reviews.value = await RealApi.getProviderReviews(id);
  } catch (error) {
    console.error('加载服务者信息失败', error);
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
    if (val) fetchProfile(val);
  },
  { immediate: true },
);
</script>

<style scoped>
.btn-primary-sm {
  @apply bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors;
}
</style>


