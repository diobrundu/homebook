<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-5xl w-full">
      <!-- 角色选择卡片 -->
      <div v-if="!selectedRole" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          @click.stop="selectRole('customer')"
          @keydown.enter="selectRole('customer')"
          @keydown.space.prevent="selectRole('customer')"
          tabindex="0"
          role="button"
          aria-label="选择用户登录"
          class="role-card cursor-pointer transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          <div class="role-icon bg-blue-500">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mt-4">用户登录</h3>
          <p class="text-sm text-gray-600 mt-2">预订和管理您的服务预约</p>
        </div>

        <div
          @click.stop="selectRole('service_provider')"
          @keydown.enter="selectRole('service_provider')"
          @keydown.space.prevent="selectRole('service_provider')"
          tabindex="0"
          role="button"
          aria-label="选择服务人员登录"
          class="role-card cursor-pointer transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          <div class="role-icon bg-green-500">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mt-4">服务人员登录</h3>
          <p class="text-sm text-gray-600 mt-2">管理您的服务订单和客户</p>
        </div>

        <div
          @click.stop="selectRole('admin')"
          @keydown.enter="selectRole('admin')"
          @keydown.space.prevent="selectRole('admin')"
          tabindex="0"
          role="button"
          aria-label="选择管理员登录"
          class="role-card cursor-pointer transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          <div class="role-icon bg-purple-500">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mt-4">管理员登录</h3>
          <p class="text-sm text-gray-600 mt-2">系统管理和数据统计</p>
        </div>
      </div>

      <!-- 登录表单 -->
      <div v-if="selectedRole" class="max-w-md mx-auto">
        <!-- 返回按钮 -->
        <button
          @click="selectedRole = null"
          class="mb-6 text-white hover:text-gray-200 transition-colors flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>返回选择角色</span>
        </button>

        <!-- 登录卡片 -->
        <div class="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <!-- 角色标识 -->
          <div class="text-center mb-6">
            <div :class="roleIconClass" class="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-4">
              <component :is="roleIcon" class="w-8 h-8 text-white" />
            </div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ roleTitle }}</h1>
            <p class="text-sm text-gray-600">{{ roleDescription }}</p>
          </div>

          <!-- 安全提示 -->
          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-yellow-700">
                  <strong>安全提示：</strong>请确保在安全的环境下登录，不要在公共设备上保存密码。
                </p>
              </div>
            </div>
          </div>

          <!-- 第三方登录（仅对用户和服务人员显示） -->
          <div v-if="selectedRole !== 'admin'" class="space-y-3 mb-6">
            <button
              @click="handleOAuthLogin('google')"
              :disabled="loading"
              class="oauth-button oauth-google w-full"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>使用 Google 登录</span>
            </button>

            <button
              @click="handleOAuthLogin('github')"
              :disabled="loading"
              class="oauth-button oauth-github w-full"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"/>
              </svg>
              <span>使用 GitHub 登录</span>
            </button>
          </div>

          <!-- 分隔线 -->
          <div v-if="selectedRole !== 'admin'" class="relative mb-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white text-gray-500">或使用账号密码登录</span>
            </div>
          </div>

          <!-- 登录表单 -->
          <form class="space-y-5" @submit.prevent="handleSubmit">
            <div class="space-y-4">
              <label class="flex flex-col gap-2">
                <span class="text-sm font-semibold text-gray-700">用户名</span>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    v-model.trim="username"
                    type="text"
                    autocomplete="username"
                    class="input-with-icon pl-10"
                    placeholder="请输入用户名"
                    :class="{ 'border-red-500': errors.username || loginAttempts >= 3 }"
                  />
                </div>
                <small v-if="errors.username" class="error">{{ errors.username }}</small>
              </label>

              <label class="flex flex-col gap-2">
                <span class="text-sm font-semibold text-gray-700">密码</span>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    class="input-with-icon pl-10 pr-10"
                    placeholder="请输入密码"
                    :class="{ 'border-red-500': errors.password || loginAttempts >= 3 }"
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg v-if="showPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
                <small v-if="errors.password" class="error">{{ errors.password }}</small>
              </label>

              <!-- 图片验证码 -->
              <div v-if="showCaptcha || loginAttempts >= 2" class="flex flex-col gap-2">
                <span class="text-sm font-semibold text-gray-700">验证码</span>
                <div class="flex gap-3">
                  <div class="flex-1 relative">
                    <input
                      v-model="captchaCode"
                      type="text"
                      class="input-with-icon"
                      placeholder="请输入验证码"
                      maxlength="4"
                    />
                  </div>
                  <div
                    @click="refreshCaptcha"
                    class="captcha-image cursor-pointer border-2 border-gray-300 rounded-lg overflow-hidden hover:border-brand-500 transition-colors"
                    v-html="captchaSvg"
                  ></div>
                </div>
                <small v-if="errors.captcha" class="error">{{ errors.captcha }}</small>
              </div>

              <!-- 登录尝试警告 -->
              <div v-if="loginAttempts >= 3" class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-red-800">
                      <strong>账户安全警告：</strong>登录失败次数过多，账户已临时锁定。请{{ lockoutTime }}秒后重试，或联系管理员。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 安全选项 -->
            <div class="flex items-center justify-between">
              <label class="flex items-center">
                <input
                  v-model="rememberMe"
                  type="checkbox"
                  class="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700">记住我（30天）</span>
              </label>
              <a href="#" class="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
                忘记密码？
              </a>
            </div>

            <!-- 双因素认证提示（管理员） -->
            <div v-if="selectedRole === 'admin' && enable2FA" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-blue-800">
                    <strong>双因素认证：</strong>管理员账户需要启用2FA。登录后将要求输入验证码。
                  </p>
                </div>
              </div>
            </div>

            <!-- 错误提示 -->
            <div v-if="generalError" class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-800">{{ generalError }}</p>
                </div>
              </div>
            </div>

            <!-- 提交按钮 -->
            <button
              type="submit"
              class="btn-primary w-full"
              :disabled="loading || (loginAttempts >= 3 && lockoutTime > 0)"
              @click.prevent="handleSubmit"
            >
              <span v-if="loading" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                登录中…
              </span>
              <span v-else>安全登录</span>
            </button>
          </form>

          <!-- 底部提示 -->
          <div class="mt-6 space-y-2">
            <p class="text-center text-xs text-gray-500">
              登录即表示您同意我们的
              <a href="#" class="text-brand-600 hover:text-brand-700">服务条款</a>
              和
              <a href="#" class="text-brand-600 hover:text-brand-700">隐私政策</a>
            </p>
            <p class="text-center text-xs text-gray-400">
              <svg class="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              所有登录活动均受SSL加密保护
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import RealApi from '@/services/realApi';
import { useUserStore } from '@/stores/user';
import type { User } from '@/types';

const router = useRouter();
const { setUser } = useUserStore();

const selectedRole = ref<'customer' | 'service_provider' | 'admin' | null>(null);
const username = ref('');
const password = ref('');
const showPassword = ref(false);
const captchaCode = ref('');
const rememberMe = ref(false);
const enable2FA = ref(true); // 管理员默认启用2FA
const loading = ref(false);
const generalError = ref('');
const loginAttempts = ref(0);
const lockoutTime = ref(0);
const showCaptcha = ref(false);
const captchaSvg = ref('');
const captchaAnswer = ref('');

const errors = reactive<Record<string, string>>({});

// 角色相关计算属性
const roleTitle = computed(() => {
  if (selectedRole.value === 'admin') return '管理员登录';
  if (selectedRole.value === 'service_provider') return '服务人员登录';
  return '用户登录';
});

const roleDescription = computed(() => {
  if (selectedRole.value === 'admin') return '系统管理和数据统计';
  if (selectedRole.value === 'service_provider') return '管理您的服务订单和客户';
  return '预订和管理您的服务预约';
});

const roleIconClass = computed(() => {
  if (selectedRole.value === 'admin') return 'bg-gradient-to-br from-purple-600 to-purple-700';
  if (selectedRole.value === 'service_provider') return 'bg-gradient-to-br from-green-600 to-green-700';
  return 'bg-gradient-to-br from-blue-600 to-blue-700';
});

const roleIcon = computed(() => {
  const iconProps = { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' };
  if (selectedRole.value === 'admin') {
    return h('svg', iconProps, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
      })
    ]);
  }
  if (selectedRole.value === 'service_provider') {
    return h('svg', iconProps, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
      })
    ]);
  }
  return h('svg', iconProps, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
    })
  ]);
});

// 生成验证码
const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  captchaAnswer.value = code;

  // 生成SVG验证码
  const svg = `
    <svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="40" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1"/>
      ${code.split('').map((char, i) => {
        const x = 20 + i * 25;
        const y = 25 + (Math.random() - 0.5) * 8;
        const rotation = (Math.random() - 0.5) * 30;
        const fontSize = 18 + Math.random() * 4;
        const colors = ['#1f2937', '#374151', '#4b5563', '#6b7280'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${color}" transform="rotate(${rotation} ${x} ${y})">${char}</text>`;
      }).join('')}
      ${Array.from({ length: 5 }, () => {
        const x1 = Math.random() * 120;
        const y1 = Math.random() * 40;
        const x2 = Math.random() * 120;
        const y2 = Math.random() * 40;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#d1d5db" stroke-width="0.5" opacity="0.5"/>`;
      }).join('')}
    </svg>
  `;
  captchaSvg.value = svg;
};

const refreshCaptcha = () => {
  generateCaptcha();
  captchaCode.value = '';
};

// 选择角色
const selectRole = (role: 'customer' | 'service_provider' | 'admin') => {
  console.log('选择角色:', role);
  try {
    selectedRole.value = role;
    username.value = '';
    password.value = '';
    captchaCode.value = '';
    loginAttempts.value = 0;
    lockoutTime.value = 0;
    generalError.value = '';
    errors.captcha = '';
    showCaptcha.value = role === 'admin'; // 管理员默认显示验证码
    if (showCaptcha.value) {
      generateCaptcha();
    }
    console.log('角色选择成功，当前角色:', selectedRole.value);
  } catch (error) {
    console.error('选择角色时出错:', error);
  }
};

// 验证表单
const validate = () => {
  console.log('开始验证表单...');
  errors.username = username.value ? '' : '用户名不能为空';
  errors.password = password.value ? '' : '密码不能为空';
  
  if (showCaptcha.value || loginAttempts.value >= 2) {
    console.log('需要验证码，showCaptcha:', showCaptcha.value, 'loginAttempts:', loginAttempts.value);
    if (!captchaCode.value) {
      errors.captcha = '请输入验证码';
    } else if (captchaCode.value.toUpperCase() !== captchaAnswer.value) {
      errors.captcha = '验证码错误';
      refreshCaptcha();
    } else {
      errors.captcha = '';
    }
  }
  
  const isValid = !errors.username && !errors.password && !errors.captcha;
  console.log('验证结果:', isValid, 'errors:', errors);
  return isValid;
};

// 账户锁定倒计时
const startLockout = () => {
  lockoutTime.value = 300; // 5分钟
  const interval = setInterval(() => {
    lockoutTime.value--;
    if (lockoutTime.value <= 0) {
      clearInterval(interval);
      loginAttempts.value = 0;
    }
  }, 1000);
};

// 重定向
const redirectByRole = (user: User) => {
  if (user.role === 'admin') {
    router.push('/admin');
  } else if (user.role === 'service_provider') {
    router.push('/user/provider');
  } else {
    router.push('/user/dashboard');
  }
};

// 提交登录
const handleSubmit = async () => {
  console.log('=== 开始提交登录 ===');
  console.log('用户名:', username.value);
  console.log('密码:', password.value ? '***' : '(空)');
  console.log('选中角色:', selectedRole.value);
  
  generalError.value = '';
  errors.captcha = '';
  
  if (loginAttempts.value >= 3 && lockoutTime.value > 0) {
    console.log('账户已锁定');
    generalError.value = `账户已锁定，请${lockoutTime.value}秒后重试`;
    return;
  }
  
  console.log('开始验证表单...');
  if (!validate()) {
    console.log('表单验证失败，停止提交');
    return;
  }
  
  console.log('表单验证通过，开始登录请求...');
  loading.value = true;
  try {
    console.log('调用RealApi.login...');
    const loggedIn = await RealApi.login(username.value, password.value);
    console.log('登录API返回:', loggedIn);
    
    // 如果返回null（虽然现在应该不会，但保留兼容性）
    if (!loggedIn) {
      console.log('登录返回null，登录失败');
      loginAttempts.value++;
      if (loginAttempts.value >= 2 && !showCaptcha.value) {
        showCaptcha.value = true;
        generateCaptcha();
      }
      if (loginAttempts.value >= 3) {
        startLockout();
        generalError.value = '登录失败次数过多，账户已临时锁定';
      } else {
        generalError.value = '用户名或密码错误';
      }
      return;
    }
    
    // 验证角色匹配
    if (selectedRole.value && loggedIn.role !== selectedRole.value) {
      generalError.value = `该账号不是${roleTitle.value}，请选择正确的登录入口`;
      loginAttempts.value++;
      return;
    }
    
    // 登录成功，重置尝试次数
    loginAttempts.value = 0;
    lockoutTime.value = 0;
    generalError.value = '';
    
    // 保存记住我
    if (rememberMe.value) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('rememberedUsername', username.value);
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberedUsername');
    }
    
    setUser(loggedIn);
    redirectByRole(loggedIn);
  } catch (error: any) {
    loginAttempts.value++;
    if (loginAttempts.value >= 2 && !showCaptcha) {
      showCaptcha.value = true;
      generateCaptcha();
    }
    
    // 根据错误类型显示不同的错误消息
    if (loginAttempts.value >= 3) {
      startLockout();
      generalError.value = '登录失败次数过多，账户已临时锁定';
    } else {
      // 使用API返回的错误消息，如果没有则使用默认消息
      generalError.value = error?.message || '登录失败，请稍后重试';
    }
    
    console.error('登录错误:', error);
  } finally {
    loading.value = false;
  }
};

// OAuth登录
const handleOAuthLogin = async (provider: 'google' | 'github' | 'wechat') => {
  loading.value = true;
  generalError.value = '';
  
  try {
    console.log(`使用 ${provider} 登录`);
    generalError.value = `${provider === 'wechat' ? '微信' : provider === 'github' ? 'GitHub' : 'Google'} 登录功能即将上线，敬请期待！`;
  } catch (error: any) {
    generalError.value = error?.message || `${provider} 登录失败，请稍后重试`;
  } finally {
    loading.value = false;
  }
};

// 初始化
onMounted(() => {
  // 检查是否有记住的用户名
  if (localStorage.getItem('rememberMe') === 'true') {
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    if (rememberedUsername) {
      username.value = rememberedUsername;
      rememberMe.value = true;
    }
  }
});
</script>

<style scoped>
.role-card {
  @apply bg-white rounded-xl shadow-lg p-6 border-2 border-transparent hover:border-brand-500 transition-all;
  position: relative;
  z-index: 1;
  user-select: none;
  -webkit-user-select: none;
}

.role-card:hover {
  @apply shadow-xl;
}

.role-card:active {
  @apply scale-95;
}

.role-icon {
  @apply w-16 h-16 rounded-xl flex items-center justify-center shadow-md;
}

.input-with-icon {
  @apply block w-full px-3 py-3 pl-10 border border-gray-300 rounded-lg shadow-sm 
         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 
         text-gray-900 placeholder-gray-400 transition-all duration-200;
}

.input-with-icon:focus {
  @apply shadow-md;
}

.btn-primary {
  @apply inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 
         text-white font-semibold px-4 py-3 hover:from-brand-700 hover:to-brand-800 
         transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 
         focus:ring-brand-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg;
}

.oauth-button {
  @apply inline-flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium
         transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
         disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md;
}

.oauth-google {
  @apply bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400 
         hover:bg-gray-50 focus:ring-gray-500;
}

.oauth-github {
  @apply bg-gray-900 text-white border-2 border-gray-900 hover:bg-gray-800 
         hover:border-gray-800 focus:ring-gray-500;
}

.captcha-image {
  @apply w-32 h-12 flex items-center justify-center bg-gray-50;
}

.error {
  @apply text-xs text-red-600 mt-1;
}
</style>
