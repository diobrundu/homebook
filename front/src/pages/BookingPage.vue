<template>
  <div v-if="loading" class="p-8 text-center text-gray-500">
    服务信息加载中...
  </div>
  <div v-else-if="!service" class="p-8 text-center text-red-500">
    未找到该服务
  </div>
  <div v-else class="max-w-2xl mx-auto px-4 py-10">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">预约 {{ service.name }}</h1>
    <form class="bg-white p-8 rounded-xl shadow border space-y-6" @submit.prevent="handleSubmit">
      <div class="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
        <div>
          <p class="text-sm text-gray-500">价格</p>
          <p class="font-semibold text-gray-900">
            ¥{{ service.price }} / {{ service.priceUnit }}
          </p>
        </div>
        <div v-if="service.priceUnit === 'hour'">
          <p class="text-sm text-gray-500">预计总价</p>
          <p class="font-bold text-brand-600 text-lg">
            ¥{{ (service.price * duration).toFixed(0) }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="flex flex-col gap-2">
          <span class="text-sm font-medium text-gray-700">日期</span>
          <input
            v-model="date"
            type="date"
            :min="minDate"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          <small v-if="errors.date" class="text-xs text-red-500">{{ errors.date }}</small>
        </label>
        <label class="flex flex-col gap-2">
          <span class="text-sm font-medium text-gray-700">时间</span>
          <input
            v-model="time"
            type="time"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          <small v-if="errors.time" class="text-xs text-red-500">{{ errors.time }}</small>
        </label>
      </div>

      <label
        v-if="service.priceUnit === 'hour'"
        class="flex flex-col gap-2"
      >
        <span class="text-sm font-medium text-gray-700">时长（小时）</span>
        <select
          v-model.number="duration"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        >
          <option v-for="value in [1,2,3,4,5]" :key="value" :value="value">
            {{ value }} 小时
          </option>
        </select>
      </label>

      <label class="flex flex-col gap-2">
        <span class="text-sm font-medium text-gray-700">服务地址</span>
        <textarea
          v-model="address"
          rows="3"
          placeholder="请填写详细地址"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
        <small v-if="errors.address" class="text-xs text-red-500">{{ errors.address }}</small>
      </label>

      <div class="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg font-medium transition-colors px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-brand-500"
          @click="router.back()"
        >
          取消
        </button>
        <button
          type="submit"
          class="inline-flex items-center justify-center rounded-lg font-medium transition-colors px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 disabled:opacity-60"
          :disabled="submitting"
        >
          {{ submitting ? '提交中...' : '确认预约' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { Service } from '@/types';
import RealApi from '@/services/realApi';
import { useUserStore } from '@/stores/user';

const props = defineProps<{ id: string }>();
const router = useRouter();
const { user } = useUserStore();

const service = ref<Service | null>(null);
const loading = ref(true);
const submitting = ref(false);
const date = ref('');
const time = ref('');
const duration = ref(2);
const address = ref('');
const errors = ref<Record<string, string>>({});

const minDate = computed(() => new Date().toISOString().split('T')[0]);

const loadService = async (serviceId: string) => {
  loading.value = true;
  try {
    service.value = await RealApi.getServiceById(Number(serviceId));
  } catch (error) {
    console.error('加载服务失败', error);
  } finally {
    loading.value = false;
  }
};

const validate = () => {
  const validation: Record<string, string> = {};
  if (!date.value) validation.date = '请选择日期';
  if (!time.value) validation.time = '请选择时间';
  if (!address.value.trim()) validation.address = '请输入详细地址';
  errors.value = validation;
  return Object.keys(validation).length === 0;
};

const handleSubmit = async () => {
  if (!service.value) return;
  if (!user.value) {
    router.push('/login');
    return;
  }
  if (!validate()) return;

  const appointmentDateTime = `${date.value}T${time.value.length === 5 ? `${time.value}:00` : time.value}`;
  submitting.value = true;
  try {
    await RealApi.createAppointment({
      customerId: user.value.id,
      serviceId: service.value.id,
      appointmentTime: appointmentDateTime,
      durationHours: Number(duration.value) || 1,
      address: address.value.trim(),
    });
    alert('预约成功，我们将尽快与您确认！');
    router.push('/user/dashboard');
  } catch (error: any) {
    alert(error?.message || '预约失败，请稍后重试');
  } finally {
    submitting.value = false;
  }
};

watch(
  () => props.id,
  (val) => {
    if (val) loadService(val);
  },
  { immediate: true },
);
</script>

<style scoped></style>
