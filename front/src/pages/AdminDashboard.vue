<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">管理控制台</h1>
      <p class="text-gray-600 mt-2">系统概览和管理入口</p>
    </div>

    <!-- 关键指标卡片 -->
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="metric-card">
        <p class="metric-label">今日订单总数</p>
        <p class="metric-value">{{ todayOrdersCount }}</p>
      </div>
      <div class="metric-card">
        <p class="metric-label">本日营业额</p>
        <p class="metric-value text-green-600">¥{{ todayRevenue.toFixed(2) }}</p>
      </div>
      <div class="metric-card">
        <p class="metric-label">今日访问用户</p>
        <p class="metric-value text-blue-600">{{ todayVisitors }}</p>
      </div>
      <div class="metric-card">
        <p class="metric-label">累计营收</p>
        <p class="metric-value text-purple-600">¥{{ totalRevenue.toFixed(2) }}</p>
      </div>
    </section>

    <!-- 图表区域 -->
    <section class="space-y-6">
      <!-- 月度营收图表 - 全宽显示 -->
      <div class="card">
        <div class="section-header">
          <h2 class="section-title">月度营收趋势</h2>
          <select
            v-model="selectedYear"
            class="input-select"
            @change="loadMonthlyRevenue"
          >
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}年
            </option>
          </select>
        </div>
        <div class="chart-container-wide">
          <SimpleChart
            v-if="monthlyRevenueData.length > 0"
            :data="monthlyRevenueData"
            type="bar"
            :width="1200"
            :height="300"
          />
          <p v-else class="text-center text-gray-500 py-10">加载中...</p>
        </div>
      </div>

      <!-- 累计营收和今日访问用户 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card">
          <div class="section-header">
            <h2 class="section-title">累计营收</h2>
          </div>
          <div class="chart-container">
            <div class="flex items-center justify-center h-full">
              <div class="text-center">
                <p class="text-5xl font-bold text-purple-600 mb-2">
                  ¥{{ totalRevenue.toFixed(2) }}
                </p>
                <p class="text-gray-500">总营收金额</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 今日访问用户可视化 -->
        <div class="card">
          <div class="section-header">
            <h2 class="section-title">今日访问用户</h2>
            <button class="btn-secondary" @click="loadTodayVisitors" :disabled="loadingVisitors">
              刷新
            </button>
          </div>
          <div class="chart-container">
            <div class="flex items-center justify-center h-full">
              <div class="text-center">
                <div class="inline-block p-8 rounded-full bg-blue-100 mb-4">
                  <span class="text-6xl font-bold text-blue-600">{{ todayVisitors }}</span>
                </div>
                <p class="text-gray-600">今日独立访问用户数</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 本周订单信息 -->
    <section class="card">
      <div class="section-header">
        <h2 class="section-title">本周订单统计</h2>
        <button class="btn-secondary" @click="loadWeeklyOrders" :disabled="loadingWeeklyOrders">
          刷新
        </button>
      </div>
      <div class="chart-container-wide">
        <SimpleChart
          v-if="weeklyOrdersData.length > 0"
          :data="weeklyOrdersData"
          type="line"
          :width="1200"
          :height="250"
        />
        <p v-else class="text-center text-gray-500 py-10">加载中...</p>
      </div>
    </section>

    <!-- 快速操作 -->
    <section class="card">
      <h2 class="section-title mb-4">快速操作</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          class="quick-action-btn"
          @click="$router.push('/admin/orders')"
        >
          <span class="text-2xl mb-2">📦</span>
          <span>订单管理</span>
        </button>
        <button
          class="quick-action-btn"
          @click="$router.push('/admin/users')"
        >
          <span class="text-2xl mb-2">👥</span>
          <span>用户管理</span>
        </button>
        <button
          class="quick-action-btn"
          @click="$router.push('/admin/providers')"
        >
          <span class="text-2xl mb-2">🔧</span>
          <span>服务人员</span>
        </button>
        <button
          class="quick-action-btn"
          @click="$router.push('/admin/appointments')"
        >
          <span class="text-2xl mb-2">📅</span>
          <span>预约管理</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import RealApi from '@/services/realApi';
import { useUserStore } from '@/stores/user';
import SimpleChart from '@/components/SimpleChart.vue';

const router = useRouter();
const { user } = useUserStore();

const stats = ref({ totalUsers: 0, totalOrders: 0, revenue: 0, pendingAppointments: 0 });
const monthlyRevenueData = ref<Array<{ name: string; value: number }>>([]);
const weeklyOrdersData = ref<Array<{ name: string; value: number }>>([]);
const selectedYear = ref(new Date().getFullYear());
const availableYears = ref([new Date().getFullYear(), new Date().getFullYear() - 1]);
const loadingWeeklyOrders = ref(false);
const loadingVisitors = ref(false);

const todayOrdersCount = ref(0);
const todayRevenue = ref(0);
const todayVisitors = ref(0);
const totalRevenue = computed(() => stats.value.revenue);

const ensureAdmin = () => {
  if (!user.value || user.value.role !== 'admin') {
    router.push('/login');
    throw new Error('NOT_AUTHORIZED');
  }
};

const loadStats = async () => {
  try {
    console.log('📈 加载统计数据...');
    stats.value = await RealApi.getStats();
    // 如果stats中包含今日访问用户数，使用它
    if (stats.value.todayVisitors !== undefined) {
      todayVisitors.value = stats.value.todayVisitors;
    }
    console.log('✅ 统计数据加载成功:', stats.value);
  } catch (error) {
    console.error('❌ 加载统计数据失败:', error);
  }
};

const loadMonthlyRevenue = async () => {
  try {
    console.log(`📅 加载 ${selectedYear.value} 年月度营收数据...`);
    const data = await RealApi.getRevenueByMonth(selectedYear.value);
    console.log('📊 月度营收原始数据:', data);
    
    // API已经返回了12个月的数据，直接使用
    // 确保数据有12个月，如果不足则补全
    if (data.length >= 12) {
      monthlyRevenueData.value = data.slice(0, 12).map(item => ({
        name: item.name,
        value: item.revenue
      }));
    } else {
      // 如果数据不足12个月，补全
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      const revenueMap = new Map(data.map(item => [item.name, item.revenue]));
      monthlyRevenueData.value = months.map((month, index) => ({
        name: month,
        value: revenueMap.get(month) || data[index]?.revenue || 0
      }));
    }
    
    console.log('✅ 月度营收数据处理完成:', monthlyRevenueData.value);
  } catch (error) {
    console.error('❌ 加载月度营收数据失败:', error);
    console.warn('⚠️ 使用模拟数据作为后备方案');
    // 如果API失败，使用模拟数据
    monthlyRevenueData.value = Array.from({ length: 12 }, (_, i) => ({
      name: `${i + 1}月`,
      value: Math.random() * 10000
    }));
  }
};

const loadWeeklyOrders = async () => {
  loadingWeeklyOrders.value = true;
  try {
    console.log('📦 加载本周订单数据...');
    // 直接调用后端API获取本周订单统计
    const data = await RealApi.getWeeklyOrders();
    console.log('📦 本周订单数据:', data);
    
    // API已经返回了格式化的数据，直接使用
    weeklyOrdersData.value = data.length > 0 
      ? data 
      : ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => ({
          name: day,
          value: 0
        }));
    
    console.log('✅ 本周订单数据加载完成:', weeklyOrdersData.value);
  } catch (error) {
    console.error('❌ 加载本周订单数据失败:', error);
    console.warn('⚠️ 使用空数据作为后备方案');
    // 使用空数据
    weeklyOrdersData.value = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => ({
      name: day,
      value: 0
    }));
  } finally {
    loadingWeeklyOrders.value = false;
  }
};

const loadTodayVisitors = async () => {
  loadingVisitors.value = true;
  try {
    console.log('👥 加载今日访问用户数据...');
    // 调用后端API获取今日访问用户数（基于last_login_time）
    todayVisitors.value = await RealApi.getTodayVisitors();
    console.log('✅ 今日访问用户数:', todayVisitors.value);
  } catch (error) {
    console.error('❌ 加载今日访问用户数据失败:', error);
    // 如果API失败，尝试从stats中获取
    try {
      const statsData = await RealApi.getStats();
      todayVisitors.value = statsData.todayVisitors || 0;
    } catch (e) {
      todayVisitors.value = 0;
    }
  } finally {
    loadingVisitors.value = false;
  }
};

const loadTodayData = async () => {
  try {
    console.log('📊 加载今日数据（订单数和营业额）...');
    // 调用后端API获取今日订单统计
    const data = await RealApi.getTodayOrders();
    todayOrdersCount.value = data.count || 0;
    todayRevenue.value = data.revenue || 0;
    console.log('✅ 今日数据加载完成:', {
      todayOrdersCount: todayOrdersCount.value,
      todayRevenue: todayRevenue.value
    });
  } catch (error) {
    console.error('❌ 加载今日数据失败:', error);
    // 如果API失败，使用默认值0
    todayOrdersCount.value = 0;
    todayRevenue.value = 0;
  }
};

onMounted(async () => {
  try {
    console.log('🚀 管理员控制台初始化开始...');
    ensureAdmin();
    console.log('✅ 管理员权限验证通过');
    
    console.log('📊 开始加载统计数据...');
    await Promise.all([
      loadStats(),
      loadMonthlyRevenue(),
      loadWeeklyOrders(),
      loadTodayVisitors(),
      loadTodayData()
    ]);
    
    console.log('✅ 所有数据加载完成', {
      stats: stats.value,
      todayOrdersCount: todayOrdersCount.value,
      todayRevenue: todayRevenue.value,
      todayVisitors: todayVisitors.value,
      totalRevenue: totalRevenue.value
    });
  } catch (error) {
    console.error('❌ 控制台初始化错误:', error);
  }
});
</script>

<style scoped>
.metric-card {
  @apply bg-white rounded-xl shadow-sm border p-6 space-y-1;
}
.metric-label {
  @apply text-sm text-gray-500;
}
.metric-value {
  @apply text-3xl font-bold text-gray-900;
}
.card {
  @apply bg-white rounded-xl shadow-sm border p-6 space-y-4;
}
.section-header {
  @apply flex items-center justify-between;
}
.section-title {
  @apply text-lg font-semibold text-gray-900;
}
.chart-container {
  @apply w-full h-[300px] flex items-center justify-center;
}
.chart-container-wide {
  @apply w-full h-[300px] flex items-center justify-start overflow-x-auto;
}
.chart-container-wide svg {
  min-width: 100%;
}
.input-select {
  @apply border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500;
}
.btn-nav {
  @apply inline-flex items-center justify-center rounded-lg bg-brand-600 text-white font-medium px-4 py-2 hover:bg-brand-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 text-sm;
}
.btn-secondary {
  @apply inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 font-medium px-3 py-1.5 hover:bg-gray-50 transition;
}
.quick-action-btn {
  @apply flex flex-col items-center justify-center p-6 rounded-lg border border-gray-200 hover:border-brand-500 hover:bg-brand-50 transition cursor-pointer;
}
</style>
