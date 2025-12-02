<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">精选服务</h1>
      <p class="text-gray-500 mt-2">按类别、价格或关键词快速查找合适的服务</p>
    </header>

    <!-- 分类筛选 -->
    <div class="mb-6">
      <div class="flex flex-wrap gap-3">
        <button
          @click="selectedCategoryId = null"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            selectedCategoryId === null
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          全部
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          @click="selectedCategoryId = category.id"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            selectedCategoryId === category.id
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ category.name }}
        </button>
      </div>
    </div>

    <div class="mb-8 relative max-w-md">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        🔍
      </div>
      <input
        v-model="searchTerm"
        type="text"
        class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-shadow shadow-sm"
        placeholder="按名称、类别、描述搜索..."
      />
    </div>

    <div v-if="loading" class="text-center text-gray-500 py-10">
      服务加载中...
    </div>

    <div v-else>
      <div
        v-if="filteredServices.length === 0"
        class="text-center py-12"
      >
        <p class="text-gray-500">
          <span v-if="selectedCategoryId !== null && searchTerm">
            在"{{ categories.find(c => c.id === selectedCategoryId)?.name }}"分类中未找到与 "{{ searchTerm }}" 匹配的服务
          </span>
          <span v-else-if="selectedCategoryId !== null">
            在"{{ categories.find(c => c.id === selectedCategoryId)?.name }}"分类中暂无服务
          </span>
          <span v-else-if="searchTerm">
            未找到与 "{{ searchTerm }}" 匹配的服务
          </span>
          <span v-else>
            暂无服务
          </span>
        </p>
        <div class="flex gap-2 justify-center mt-4">
          <button
            v-if="searchTerm"
            class="text-brand-600 hover:text-brand-800 font-medium"
            @click="searchTerm = ''"
          >
            清空搜索
          </button>
          <button
            v-if="selectedCategoryId !== null"
            class="text-brand-600 hover:text-brand-800 font-medium"
            @click="selectedCategoryId = null"
          >
            查看全部
          </button>
        </div>
      </div>

      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <article
          v-for="service in filteredServices"
          :key="service.id"
          class="bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
        >
          <div
            class="h-48 bg-gray-200 overflow-hidden cursor-pointer"
            @click="go(`/service/${service.id}`)"
          >
            <img
              :src="`https://picsum.photos/400/300?random=${service.id}`"
              :alt="service.name"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="p-6 flex-1 flex flex-col">
            <p class="text-sm font-medium text-brand-600 mb-1">
              {{ service.categoryName || '未分类' }}
            </p>
            <h3
              class="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-brand-600"
              @click="go(`/service/${service.id}`)"
            >
              {{ service.name }}
            </h3>
            <p class="text-gray-500 mb-4 flex-1 line-clamp-3">
              {{ service.description }}
            </p>
            <div class="flex items-center justify-between mt-4 pt-4 border-t">
              <span class="text-lg font-bold text-gray-900">
                ¥{{ service.price }}
                <span class="text-sm font-normal text-gray-500"> / {{ service.priceUnit }}</span>
              </span>
              <button
                class="btn btn-primary-sm"
                @click="go(`/book/${service.id}`)"
              >
                立即预约
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Service, ServiceCategory } from '@/types';
import RealApi from '@/services/realApi';

const services = ref<Service[]>([]);
const categories = ref<ServiceCategory[]>([]);
const loading = ref(true);
const searchTerm = ref('');
const selectedCategoryId = ref<number | null>(null);
const router = useRouter();

const go = (path: string) => router.push(path);

const filteredServices = computed(() => {
  let result = services.value;

  // 按分类筛选
  if (selectedCategoryId.value !== null) {
    result = result.filter(service => service.categoryId === selectedCategoryId.value);
  }

  // 按搜索关键词筛选
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    result = result.filter((service) => {
      const nameMatch = service.name.toLowerCase().includes(term);
      const descMatch = service.description.toLowerCase().includes(term);
      const categoryMatch = service.categoryName?.toLowerCase().includes(term) ?? false;
      return nameMatch || descMatch || categoryMatch;
    });
  }

  return result;
});

onMounted(async () => {
  try {
    // 并行加载服务和分类
    const [servicesData, categoriesData] = await Promise.all([
      RealApi.getServices(),
      RealApi.getCategories()
    ]);
    services.value = servicesData;
    categories.value = categoriesData;
  } catch (error) {
    console.error('加载数据失败', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.btn-primary-sm {
  @apply bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors;
}
</style>


