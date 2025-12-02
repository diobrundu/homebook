<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl w-full space-y-8">
      <header class="text-center">
        <h1 class="text-3xl font-extrabold text-gray-900">
          {{ step === 'register' ? '创建账号' : '邮箱验证' }}
        </h1>
        <p class="mt-2 text-sm text-gray-600">
          {{ step === 'register' ? '加入 HomeBook 社区' : `验证码已发送到 ${formData.email}` }}
        </p>
      </header>

      <div class="bg-white p-8 rounded-xl shadow space-y-6">
        <p v-if="generalError" class="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
          {{ generalError }}
        </p>

        <form v-if="step === 'register'" class="space-y-4" @submit.prevent="handleRegister">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="姓名" :error="errors.name">
              <input v-model="formData.name" type="text" class="input" placeholder="张三" autocomplete="name" />
            </FormField>
            <FormField label="用户名" :error="errors.username">
              <input v-model="formData.username" type="text" class="input" placeholder="zhangsan" autocomplete="username" />
            </FormField>
          </div>

          <FormField label="邮箱" :error="errors.email">
            <input v-model="formData.email" type="email" class="input" placeholder="user@example.com" autocomplete="email" />
          </FormField>

          <FormField label="身份" :error="errors.role">
            <select v-model="formData.role" class="input">
              <option :value="UserRole.Customer">预定服务（用户）</option>
              <option :value="UserRole.ServiceProvider">提供服务（服务者）</option>
            </select>
          </FormField>

          <FormField label="密码" :error="errors.password">
            <input v-model="formData.password" type="password" class="input" placeholder="至少 6 位" autocomplete="new-password" />
            <PasswordStrength :password="formData.password" />
          </FormField>

          <section v-if="formData.role === UserRole.ServiceProvider" class="space-y-4">
            <FormField label="自我介绍（可选）">
              <textarea v-model="introduction" rows="3" class="input" placeholder="介绍你的经验和技能" />
            </FormField>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                可提供的服务 <span class="text-red-500">*</span>
              </label>
              <div v-if="loadingServices" class="text-sm text-gray-500 py-2">服务加载中...</div>
              <div v-else class="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto space-y-4">
                <div v-for="category in categories" :key="category.id" class="space-y-2">
                  <h4 class="text-sm font-semibold text-gray-900">{{ category.name }}</h4>
                  <div class="space-y-1">
                    <label
                      v-for="service in servicesByCategory(category.id)"
                      :key="service.id"
                      class="flex items-center gap-3 text-sm text-gray-700 cursor-pointer"
                    >
                      <input type="checkbox" :value="service.id" v-model="selectedServiceIds" class="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                      <span>{{ service.name }}</span>
                    </label>
                  </div>
                </div>
                <p v-if="services.length === 0" class="text-sm text-gray-500">暂无可选服务</p>
              </div>
              <small v-if="errors.services" class="error">{{ errors.services }}</small>
            </div>
          </section>

          <label class="flex items-start gap-2 text-sm text-gray-700">
            <input type="checkbox" v-model="termsAccepted" class="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
            我已阅读并同意
            <button type="button" class="text-brand-600 underline" @click="showTerms = true">服务条款</button>
          </label>
          <small v-if="errors.terms" class="error">{{ errors.terms }}</small>

          <button type="submit" class="btn-primary w-full" :disabled="isSubmitting">
            {{ isSubmitting ? '提交中…' : '发送验证码' }}
          </button>

          <p class="text-center text-sm text-gray-500">
            已有账号？
            <router-link to="/login" class="text-brand-600">返回登录</router-link>
          </p>
        </form>

        <form v-else class="space-y-6" @submit.prevent="handleVerify">
          <div class="text-center space-y-2">
            <p class="text-sm text-gray-500">请输入邮箱收到的 6 位验证码</p>
          </div>
          <input
            v-model="verificationCode"
            maxlength="6"
            class="text-center text-2xl tracking-widest input"
            placeholder="123456"
          />
          <button type="button" class="text-sm text-brand-600" :disabled="isResending" @click="handleResendCode">
            {{ isResending ? '发送中…' : '重新发送验证码' }}
          </button>
          <button type="submit" class="btn-primary w-full" :disabled="isSubmitting">
            {{ isSubmitting ? '验证中…' : '完成注册' }}
          </button>
          <button type="button" class="btn-secondary w-full" @click="step = 'register'">返回注册</button>
        </form>
      </div>
    </div>

    <dialog v-if="showTerms" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-900">服务条款</h2>
          <button class="text-gray-500 hover:text-gray-700" @click="showTerms = false">✕</button>
        </div>
        <ol class="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>HomeBook 仅作为平台连接用户与服务者。</li>
          <li>预约取消需提前 24 小时，否则可能收取费用。</li>
          <li>付款经平台统一结算，保障双方权益。</li>
          <li>详细条款请查看官方网站，以最新版本为准。</li>
        </ol>
        <button class="btn-primary w-full" @click="showTerms = false">我已知晓</button>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, defineComponent, h } from 'vue';
import { useRouter } from 'vue-router';
import RealApi from '@/services/realApi';
import { UserRole, type Service, type ServiceCategory } from '@/types';

type Step = 'register' | 'verify';

const router = useRouter();
const step = ref<Step>('register');
const isSubmitting = ref(false);
const isResending = ref(false);
const generalError = ref('');

const formData = reactive({
  name: '',
  username: '',
  email: '',
  role: UserRole.Customer,
  password: '',
});
const introduction = ref('');
const selectedServiceIds = ref<number[]>([]);
const services = ref<Service[]>([]);
const categories = ref<ServiceCategory[]>([]);
const loadingServices = ref(false);
const termsAccepted = ref(false);
const showTerms = ref(false);
const verificationCode = ref('');

const errors = reactive<Record<string, string>>({});

const servicesByCategory = (categoryId: number) =>
  services.value.filter((service) => service.categoryId === categoryId);

watch(
  () => formData.role,
  async (role) => {
    if (role === UserRole.ServiceProvider && services.value.length === 0) {
      loadingServices.value = true;
      try {
        const [svc, cats] = await Promise.all([RealApi.getServices(), RealApi.getCategories()]);
        services.value = svc;
        categories.value = cats;
      } catch (error) {
        console.error('加载服务列表失败', error);
      } finally {
        loadingServices.value = false;
      }
    }
  },
);

const validateForm = () => {
  generalError.value = '';
  errors.name = formData.name.trim() ? '' : '姓名不能为空';
  errors.username =
    formData.username.trim().length >= 3 ? '' : '用户名至少 3 个字符';
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? '' : '请输入有效邮箱';
  errors.password = formData.password.length >= 6 ? '' : '密码至少 6 位';
  errors.terms = termsAccepted.value ? '' : '请先同意服务条款';

  if (formData.role === UserRole.ServiceProvider) {
    errors.services = selectedServiceIds.value.length ? '' : '至少选择一项服务';
  } else {
    errors.services = '';
  }

  return Object.values(errors).every((val) => !val);
};

const handleRegister = async () => {
  if (!validateForm()) return;
  isSubmitting.value = true;
  try {
    await RealApi.sendEmailVerificationCode(formData.email);
    alert('验证码已发送到邮箱，请查收');
    step.value = 'verify';
  } catch (error: any) {
    generalError.value = error?.message || '发送验证码失败';
  } finally {
    isSubmitting.value = false;
  }
};

const handleVerify = async () => {
  if (verificationCode.value.length !== 6) {
    generalError.value = '请输入 6 位验证码';
    return;
  }
  isSubmitting.value = true;
  try {
    const valid = await RealApi.verifyEmail(formData.email, verificationCode.value);
    if (!valid) {
      generalError.value = '验证码无效，请重试';
      return;
    }

    const payload: Record<string, any> = {
      name: formData.name,
      username: formData.username,
      email: formData.email,
      role: formData.role,
      password: formData.password,
    };

    if (formData.role === UserRole.ServiceProvider) {
      if (introduction.value.trim()) payload.introduction = introduction.value.trim();
      payload.serviceIds = selectedServiceIds.value;
    }

    const result = await RealApi.register(payload);
    if (result.success) {
      alert('注册成功，请使用账号密码登录');
      router.push('/login');
    }
  } catch (error: any) {
    generalError.value = error?.message || '注册失败，请稍后重试';
  } finally {
    isSubmitting.value = false;
  }
};

const handleResendCode = async () => {
  isResending.value = true;
  try {
    await RealApi.sendEmailVerificationCode(formData.email);
    alert('验证码已重新发送');
  } catch (error: any) {
    generalError.value = error?.message || '验证码发送失败';
  } finally {
    isResending.value = false;
  }
};

const FormField = defineComponent({
  props: {
    label: String,
    error: String,
  },
  setup(props, { slots }) {
    return () =>
      h('label', { class: 'flex flex-col gap-2' }, [
        props.label ? h('span', { class: 'text-sm font-medium text-gray-700' }, props.label) : null,
        slots.default?.(),
        props.error ? h('small', { class: 'text-xs text-red-500' }, props.error) : null,
      ]);
  },
});

const PasswordStrength = defineComponent({
  props: {
    password: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const score = computed(() => {
      let value = 0;
      if (props.password.length >= 6) value += 1;
      if (props.password.length >= 8) value += 1;
      if (/[0-9]/.test(props.password) || /[^A-Za-z0-9]/.test(props.password)) value += 1;
      if (/[0-9]/.test(props.password) && /[^A-Za-z0-9]/.test(props.password)) value += 1;
      return value;
    });

    const label = computed(() => ['弱', '较弱', '一般', '较强', '强'][score.value] || '');
    const width = computed(() => `${(score.value / 4) * 100}%`);
    const color = computed(
      () => ['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][score.value - 1] || 'bg-gray-300',
    );

    return () =>
      h('div', { class: 'space-y-1' }, [
        h('div', { class: 'h-1 w-full bg-gray-200 rounded-full overflow-hidden' }, [
          h('div', {
            class: `h-full transition-all duration-300 ${color.value}`,
            style: { width: width.value },
          }),
        ]),
        h('p', { class: 'text-xs text-gray-500 text-right' }, label.value),
      ]);
  },
});
</script>

<style scoped>
.input {
  @apply w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500;
}
.btn-primary {
  @apply inline-flex items-center justify-center rounded-lg bg-brand-600 text-white font-medium px-4 py-2 hover:bg-brand-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-60;
}
.btn-secondary {
  @apply inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 font-medium px-4 py-2 hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500;
}
.error {
  @apply text-xs text-red-500;
}
</style>


