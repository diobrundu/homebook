<template>
  <span
    class="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
    :class="colorClass"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ status: string }>();

const colorMap: Record<string, string> = {
  // 预约状态
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  // 支付状态
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
  // 会员状态
  non_member: 'bg-gray-100 text-gray-800',
  member: 'bg-blue-100 text-blue-800',
  super_member: 'bg-purple-100 text-purple-800',
  // 服务人员状态
  suspended: 'bg-red-100 text-red-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  // 兼容旧状态（已废弃）
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
};

const colorClass = computed(() => colorMap[props.status] || 'bg-gray-100 text-gray-800');

const labelMap: Record<string, string> = {
  // 预约状态
  pending: '待处理',
  accepted: '已接受',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  // 支付状态
  paid: '已支付',
  failed: '支付失败',
  refunded: '已退款',
  // 会员状态
  non_member: '非会员',
  member: '会员',
  super_member: '超级会员',
  // 服务人员状态
  suspended: '已暂停',
  approved: '已批准',
  rejected: '已拒绝',
  // 兼容旧状态
  active: '活跃',
  inactive: '非活跃',
};

const label = computed(() => labelMap[props.status] || props.status?.replace(/_/g, ' ') || 'unknown');
</script>


