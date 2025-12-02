import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import { useUserStore } from './stores/user';

// 路由守卫：检查管理员权限
const adminGuard = (to: any, from: any, next: any) => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role?.toLowerCase() === 'admin') {
        next();
        return;
      }
    } catch (e) {
      // 解析失败
    }
  }
  next('/login');
};

// 路由守卫：检查用户登录
const authGuard = (to: any, from: any, next: any) => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user) {
        next();
        return;
      }
    } catch (e) {
      // 解析失败
    }
  }
  next('/login');
};

const routes: RouteRecordRaw[] = [
  // ========== 公共页面（无布局） ==========
  {
    path: '/',
    name: 'landing',
    component: () => import('./pages/PublicLanding.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('./pages/LoginPage.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('./pages/RegisterPage.vue'),
  },

  // ========== 用户/服务人员页面（使用UserLayout） ==========
  {
    path: '/user',
    component: () => import('./layouts/UserLayout.vue'),
    beforeEnter: authGuard,
    children: [
      {
        path: 'services',
        name: 'services',
        component: () => import('./pages/ServicesPage.vue'),
      },
      {
        path: 'service/:id',
        name: 'service-details',
        component: () => import('./pages/ServiceDetailsPage.vue'),
        props: true,
      },
      {
        path: 'provider-profile/:id',
        name: 'provider-profile',
        component: () => import('./pages/ProviderProfilePage.vue'),
        props: true,
      },
      {
        path: 'book/:id',
        name: 'booking',
        component: () => import('./pages/BookingPage.vue'),
        props: true,
      },
      {
        path: 'dashboard',
        name: 'customer-dashboard',
        component: () => import('./pages/CustomerDashboard.vue'),
      },
      {
        path: 'provider',
        name: 'provider-dashboard',
        component: () => import('./pages/ProviderDashboard.vue'),
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('./pages/ProfilePage.vue'),
      },
    ],
  },

  // ========== 管理员页面（使用AdminLayout） ==========
  {
    path: '/admin',
    component: () => import('./layouts/AdminLayout.vue'),
    beforeEnter: adminGuard,
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('./pages/AdminDashboard.vue'),
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('./pages/UserManagementPage.vue'),
      },
      {
        path: 'providers',
        name: 'admin-providers',
        component: () => import('./pages/ProviderManagementPage.vue'),
      },
      {
        path: 'orders',
        name: 'admin-orders',
        component: () => import('./pages/OrderManagementPage.vue'),
      },
      {
        path: 'appointments',
        name: 'admin-appointments',
        component: () => import('./pages/AppointmentManagementPage.vue'),
      },
    ],
  },

  // ========== 兼容旧路由（重定向到新路由） ==========
  {
    path: '/services',
    redirect: '/user/services',
  },
  {
    path: '/service/:id',
    redirect: (to) => `/user/service/${to.params.id}`,
  },
  {
    path: '/provider-profile/:id',
    redirect: (to) => `/user/provider-profile/${to.params.id}`,
  },
  {
    path: '/book/:id',
    redirect: (to) => `/user/book/${to.params.id}`,
  },
  {
    path: '/dashboard',
    redirect: '/user/dashboard',
  },
  {
    path: '/provider',
    redirect: '/user/provider',
  },
  {
    path: '/profile',
    redirect: '/user/profile',
  },

  // ========== 404页面 ==========
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('./pages/NotFound.vue'),
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
