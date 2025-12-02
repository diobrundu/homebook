<template>
  <div class="flex flex-col min-h-screen">
    <!-- 导航栏 -->
    <Navbar :hide-on-scroll="true" />
    
    <!-- 轮播图区域 -->
    <section class="relative bg-brand-700 overflow-hidden pt-16">
      <div class="carousel-container relative h-[600px] md:h-[700px]">
        <!-- 轮播项 -->
        <div
          v-for="(slide, index) in slides"
          :key="index"
          class="carousel-slide absolute inset-0 transition-all duration-700 ease-in-out"
          :class="{
            'opacity-100 z-10': currentSlide === index,
            'opacity-0 z-0': currentSlide !== index
          }"
        >
          <!-- 背景图片 -->
          <div class="absolute inset-0">
            <img
              :src="slide.image"
              :alt="slide.title"
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-r from-brand-900/80 via-brand-800/70 to-brand-700/60"></div>
          </div>
          
          <!-- 内容 -->
          <div class="relative h-full flex items-center">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div class="max-w-3xl">
                <h1 
                  class="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6 transform transition-all duration-1000"
                  :class="{
                    'translate-y-0 opacity-100': currentSlide === index,
                    'translate-y-8 opacity-0': currentSlide !== index
                  }"
                >
                  {{ slide.title }}
                </h1>
                <p 
                  class="text-xl text-brand-100 max-w-2xl mb-8 transform transition-all duration-1000 delay-200"
                  :class="{
                    'translate-y-0 opacity-100': currentSlide === index,
                    'translate-y-8 opacity-0': currentSlide !== index
                  }"
                >
                  {{ slide.description }}
                </p>
                <div 
                  class="flex gap-4 flex-wrap transform transition-all duration-1000 delay-300"
                  :class="{
                    'translate-y-0 opacity-100': currentSlide === index,
                    'translate-y-8 opacity-0': currentSlide !== index
                  }"
                >
                  <button
                    class="btn btn-primary"
                    @click="router.push(slide.primaryAction.path)"
                  >
                    {{ slide.primaryAction.text }}
                  </button>
                  <button
                    v-if="slide.secondaryAction"
                    class="btn btn-outline"
                    @click="router.push(slide.secondaryAction.path)"
                  >
                    {{ slide.secondaryAction.text }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 导航按钮 -->
        <button
          @click="previousSlide"
          class="carousel-nav carousel-nav-prev"
          aria-label="上一张"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          @click="nextSlide"
          class="carousel-nav carousel-nav-next"
          aria-label="下一张"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <!-- 指示器 -->
        <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          <button
            v-for="(slide, index) in slides"
            :key="index"
            @click="goToSlide(index)"
            class="carousel-indicator"
            :class="{ 'active': currentSlide === index }"
            :aria-label="`跳转到第${index + 1}张`"
          ></button>
        </div>
      </div>
    </section>

    <!-- 热门服务介绍区域 -->
    <section class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">
            热门服务推荐
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            精选优质服务，让您的生活更轻松便捷
          </p>
        </div>

        <div v-if="loadingServices" class="text-center text-gray-500 py-10">
          加载中...
        </div>

        <div
          v-else-if="featuredServices.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <article
            v-for="service in featuredServices"
            :key="service.id"
            class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col group cursor-pointer"
            @click="goToService(service.id)"
          >
            <!-- 服务图片 -->
            <div class="relative h-64 overflow-hidden">
              <img
                :src="getServiceImage(service.id)"
                :alt="service.name"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              <div class="absolute top-4 left-4">
                <span class="px-3 py-1 bg-brand-600 text-white text-sm font-semibold rounded-full">
                  {{ service.categoryName || '热门' }}
                </span>
              </div>
              <div class="absolute bottom-4 left-4 right-4">
                <h3 class="text-2xl font-bold text-white mb-2">
                  {{ service.name }}
                </h3>
              </div>
            </div>

            <!-- 服务详情 -->
            <div class="p-6 flex-1 flex flex-col">
              <p class="text-gray-600 mb-4 flex-1 line-clamp-3">
                {{ service.description }}
              </p>
              
              <div class="flex items-center justify-between pt-4 border-t">
                <div>
                  <span class="text-2xl font-bold text-brand-600">
                    ¥{{ service.price }}
                  </span>
                  <span class="text-sm text-gray-500 ml-1">
                    / {{ formatPriceUnit(service.priceUnit) }}
                  </span>
                </div>
                <button
                  class="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
                  @click.stop="goToBooking(service.id)"
                >
                  立即预约
                </button>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="text-center text-gray-500 py-10">
          暂无热门服务
        </div>

        <!-- 查看更多按钮 -->
        <div v-if="featuredServices.length > 0" class="text-center mt-12">
          <button
            class="px-8 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors text-lg"
            @click="router.push('/user/services')"
          >
            查看更多服务
          </button>
        </div>
      </div>
    </section>

    <!-- 特性介绍区域 -->
    <section class="py-16 bg-white flex-1">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
          为什么选择 HomeBook
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <article
            v-for="feature in features"
            :key="feature.title"
            class="flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div class="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xl font-bold mb-4">
              {{ feature.emoji }}
            </div>
            <h3 class="text-lg font-semibold text-gray-900">
              {{ feature.title }}
            </h3>
            <p class="mt-2 text-gray-600">
              {{ feature.description }}
            </p>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from '@/components/Navbar.vue';
import type { Service } from '@/types';
import RealApi from '@/services/realApi';

const router = useRouter();

// 热门服务
const featuredServices = ref<Service[]>([]);
const loadingServices = ref(true);

// 轮播图数据
const slides = [
  {
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=80',
    title: '专业家政服务',
    description: '一键预约可信赖的清洁、育儿、搬家等服务。真实评价、透明定价，让您的生活更轻松。',
    primaryAction: { text: '浏览服务', path: '/user/services' },
    secondaryAction: { text: '成为服务者', path: '/register' }
  },
  {
    image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1920&q=80',
    title: '严格审核，安全可靠',
    description: '所有服务者都需通过身份与技能核验，确保专业可靠。我们为您提供最安全的服务保障。',
    primaryAction: { text: '了解更多', path: '/user/services' },
    secondaryAction: { text: '立即预约', path: '/user/services' }
  },
  {
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=1920&q=80',
    title: '灵活排期，随时预约',
    description: '随时预约、自由改期，满足不同家庭的时间需求。让服务时间完全由您掌控。',
    primaryAction: { text: '开始预约', path: '/user/services' },
    secondaryAction: null
  },
  {
    image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1920&q=80',
    title: '真实评价，透明可信',
    description: '用户评分透明可查，服务质量一目了然。每一份评价都来自真实的服务体验。',
    primaryAction: { text: '查看评价', path: '/user/services' },
    secondaryAction: null
  }
];

const currentSlide = ref(0);
let autoPlayInterval: number | null = null;

// 下一张
const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slides.length;
};

// 上一张
const previousSlide = () => {
  currentSlide.value = (currentSlide.value - 1 + slides.length) % slides.length;
};

// 跳转到指定幻灯片
const goToSlide = (index: number) => {
  currentSlide.value = index;
};

// 自动播放
const startAutoPlay = () => {
  autoPlayInterval = window.setInterval(() => {
    nextSlide();
  }, 5000); // 每5秒切换一次
};

// 停止自动播放
const stopAutoPlay = () => {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
  }
};

// 鼠标悬停时暂停自动播放
const handleMouseEnter = () => {
  stopAutoPlay();
};

const handleMouseLeave = () => {
  startAutoPlay();
};

// 获取热门服务
const loadFeaturedServices = async () => {
  try {
    loadingServices.value = true;
    const allServices = await RealApi.getServices();
    // 选择前6个服务作为热门服务（可以根据实际需求调整选择逻辑）
    featuredServices.value = allServices.slice(0, 6);
  } catch (error) {
    console.error('加载热门服务失败', error);
  } finally {
    loadingServices.value = false;
  }
};

// 获取服务图片（可以根据服务ID生成不同的图片）
const getServiceImage = (serviceId: number) => {
  // 使用不同的图片URL，可以根据服务类型选择不同的图片
  const images = [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&q=80',
    'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80',
    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80',
    'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&q=80',
    'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80',
  ];
  return images[serviceId % images.length] || images[0];
};

// 格式化价格单位
const formatPriceUnit = (unit: string | undefined) => {
  if (!unit) return '次';
  
  // 如果已经是中文格式（如"元/小时"），直接返回
  if (unit.includes('元') || unit.includes('小时') || unit.includes('天') || unit.includes('次')) {
    return unit;
  }
  
  // 否则映射枚举值
  const unitMap: Record<string, string> = {
    hour: '小时',
    day: '天',
    session: '次',
    other: '次',
  };
  return unitMap[unit.toLowerCase()] || unit;
};

// 跳转到服务详情
const goToService = (serviceId: number) => {
  router.push(`/user/service/${serviceId}`);
};

// 跳转到预约页面
const goToBooking = (serviceId: number) => {
  router.push(`/user/book/${serviceId}`);
};

onMounted(() => {
  startAutoPlay();
  loadFeaturedServices();
});

onUnmounted(() => {
  stopAutoPlay();
});

const features = [
  {
    emoji: '✅',
    title: '严格审核',
    description: '所有服务者都需通过身份与技能核验，确保专业可靠。',
  },
  {
    emoji: '⏰',
    title: '灵活排期',
    description: '随时预约、自由改期，满足不同家庭的时间需求。',
  },
  {
    emoji: '⭐',
    title: '真实评价',
    description: '用户评分透明可查，服务质量一目了然。',
  },
];
</script>

<style scoped>
.carousel-container {
  position: relative;
}

.carousel-slide {
  will-change: opacity;
}

.carousel-nav {
  @apply absolute top-1/2 -translate-y-1/2 z-20 
         bg-white/20 hover:bg-white/30 
         text-white rounded-full p-3 
         transition-all duration-300 
         focus:outline-none focus:ring-2 focus:ring-white/50
         backdrop-blur-sm;
}

.carousel-nav-prev {
  @apply left-4 md:left-8;
}

.carousel-nav-next {
  @apply right-4 md:right-8;
}

.carousel-nav:hover {
  @apply scale-110;
}

.carousel-indicator {
  @apply w-3 h-3 rounded-full 
         bg-white/40 hover:bg-white/60 
         transition-all duration-300 
         focus:outline-none focus:ring-2 focus:ring-white/50;
}

.carousel-indicator.active {
  @apply bg-white w-8;
}

.btn {
  @apply inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply bg-white text-brand-700 hover:bg-gray-100 px-6 py-3 focus:ring-brand-200 shadow-lg hover:shadow-xl;
}

.btn-outline {
  @apply text-white border-2 border-white px-6 py-3 hover:bg-white/10 focus:ring-white/50 backdrop-blur-sm;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .carousel-container {
    height: 500px;
  }
  
  .carousel-nav {
    @apply p-2;
  }
  
  .carousel-nav svg {
    @apply w-4 h-4;
  }
}
</style>
