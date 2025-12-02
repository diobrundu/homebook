<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
    <header class="bg-brand-600 text-white rounded-2xl p-8 shadow-sm flex flex-col items-center gap-4">
      <div class="relative">
        <div class="w-28 h-28 rounded-full bg-white text-brand-600 flex items-center justify-center text-3xl font-bold ring-4 ring-brand-400 overflow-hidden">
          <img v-if="form.profilePicture" :src="form.profilePicture" alt="头像" class="w-full h-full object-cover" />
          <span v-else>{{ userInitial }}</span>
        </div>
        <label class="absolute bottom-1 right-1 bg-white text-gray-600 p-2 rounded-full shadow cursor-pointer hover:bg-gray-100">
          <input type="file" class="hidden" accept="image/*" @change="handleAvatarUpload" />
          <span class="text-xs font-medium">更新</span>
        </label>
      </div>
      <div class="text-center space-y-1">
        <h1 class="text-2xl font-bold">{{ form.name || user?.name }}</h1>
        <p class="text-brand-100">@{{ user?.username }}</p>
      </div>
      <button class="btn-secondary" v-if="!isEditing" @click="startEdit">
        编辑资料
      </button>
    </header>

    <section class="bg-white rounded-2xl shadow-sm border p-8 space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900">个人信息</h2>
        <div class="space-x-3" v-if="isEditing">
          <button class="btn-secondary" @click="cancelEdit">取消</button>
          <button class="btn-primary" :disabled="saving" @click="saveProfile">
            {{ saving ? '保存中…' : '保存' }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="姓名" :error="errors.name">
          <input v-model="form.name" :disabled="!isEditing" type="text" class="input" />
        </FormField>
        <FormField label="邮箱" :error="errors.email">
          <input v-model="form.email" :disabled="!isEditing" type="email" class="input" />
        </FormField>
        <FormField label="手机号" :error="errors.phone">
          <input v-model="form.phone" :disabled="!isEditing" type="tel" class="input" placeholder="166 1234 5678" />
        </FormField>
        <div>
          <p class="text-sm font-medium text-gray-700 mb-2">通知设置</p>
          <div class="space-y-2">
            <label class="flex items-center gap-3 text-sm">
              <input type="checkbox" v-model="form.notificationPreferences.email" :disabled="!isEditing" class="toggle" />
              邮件通知
            </label>
            <label class="flex items-center gap-3 text-sm">
              <input type="checkbox" v-model="form.notificationPreferences.push" :disabled="!isEditing" class="toggle" />
              推送通知
            </label>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white rounded-2xl shadow-sm border p-8 space-y-6">
      <h2 class="text-xl font-semibold text-gray-900">安全活动</h2>
      <ul class="divide-y divide-gray-200">
        <li class="py-3 text-sm text-gray-600 flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900">最近登录</p>
            <p class="text-xs text-gray-500">{{ lastLogin }}</p>
          </div>
          <span class="text-green-600 text-xs font-semibold">安全</span>
        </li>
        <li class="py-3 text-sm text-gray-600 flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900">账户状态</p>
            <p class="text-xs text-gray-500 capitalize">{{ user?.status }}</p>
          </div>
          <span class="text-gray-500 text-xs">如需变更请联系管理员</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, defineComponent, h } from 'vue';
import { useRouter } from 'vue-router';
import RealApi from '@/services/realApi';
import type { User } from '@/types';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const { user, setUser } = useUserStore();

const digitsOnly = (value: string) => value.replace(/\D/g, '');

const formatPhone = (value: string) => {
  const digits = digitsOnly(value);
  if (!digits) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 11)}`;
};

const isEditing = ref(false);
const saving = ref(false);
const form = reactive({
  name: '',
  email: '',
  phone: '',
  profilePicture: '',
  notificationPreferences: {
    email: true,
    push: true,
  },
});

const errors = reactive<Record<string, string>>({});

const userInitial = computed(() => user.value?.name?.charAt(0) ?? '?');
const lastLogin = new Date(Date.now() - 60 * 60 * 1000).toLocaleString();

watch(
  () => user.value,
  (val) => {
    if (!val) {
      router.push('/login');
      return;
    }
    form.name = val.name;
    form.email = val.email || '';
    form.phone = formatPhone(val.phone || '');
    form.profilePicture = val.profilePicture || '';
    form.notificationPreferences = {
      email: val.notificationPreferences?.email ?? true,
      push: val.notificationPreferences?.push ?? true,
    };
  },
  { immediate: true },
);

const startEdit = () => {
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
  errors.name = '';
  errors.email = '';
  errors.phone = '';
  if (user.value) {
    form.name = user.value.name;
    form.email = user.value.email || '';
    form.phone = formatPhone(user.value.phone || '');
    form.notificationPreferences.email = user.value.notificationPreferences?.email ?? true;
    form.notificationPreferences.push = user.value.notificationPreferences?.push ?? true;
  }
};

const validate = () => {
  errors.name = form.name.trim() ? '' : '姓名不能为空';
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? '' : '请输入有效邮箱';
  const rawPhone = digitsOnly(form.phone);
  errors.phone = rawPhone.length && rawPhone.length < 10 ? '手机号至少 10 位' : '';
  return !errors.name && !errors.email && !errors.phone;
};

const saveProfile = async () => {
  if (!user.value || !validate()) return;
  saving.value = true;
  try {
    const updated = await RealApi.updateUserProfile(user.value.id, {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: digitsOnly(form.phone),
      notificationPreferences: { ...form.notificationPreferences },
    });
    setUser(updated);
    isEditing.value = false;
    alert('个人资料已更新');
  } catch (error: any) {
    alert(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

const handleAvatarUpload = async (event: Event) => {
  if (!user.value) return;
  const files = (event.target as HTMLInputElement).files;
  if (!files?.length) return;
  const file = files[0];
  if (!file.type.startsWith('image/')) {
    alert('请上传图片文件');
    return;
  }
  try {
    const url = await RealApi.uploadUserProfilePicture(user.value.id, file);
    form.profilePicture = url;
    setUser({ ...(user.value as User), profilePicture: url });
  } catch (error) {
    alert('上传失败，请重试');
  }
};

const FormField = defineComponent({
  props: {
    label: String,
    error: String,
  },
  setup(props, { slots }) {
    return () =>
      h(
        'label',
        { class: 'flex flex-col gap-2 text-sm text-gray-700' },
        [
          props.label ? h('span', { class: 'font-medium' }, props.label) : null,
          slots.default?.(),
          props.error ? h('small', { class: 'text-xs text-red-500' }, props.error) : null,
        ],
      );
  },
});
</script>

<style scoped>
.input {
  @apply w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50;
}
.btn-primary {
  @apply inline-flex items-center justify-center rounded-lg bg-brand-600 text-white font-medium px-4 py-2 hover:bg-brand-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-60;
}
.btn-secondary {
  @apply inline-flex items-center justify-center rounded-lg border border-white/40 text-white font-medium px-4 py-2 hover:bg-white/10 transition;
}
.toggle {
  @apply h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500;
}
</style>


