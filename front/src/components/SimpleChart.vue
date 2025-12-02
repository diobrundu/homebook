<template>
  <div class="w-full h-full">
    <svg :width="width" :height="height" class="w-full h-full">
      <!-- 背景网格 -->
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      <!-- Y轴标签 -->
      <g v-for="(tick, i) in yTicks" :key="'y-' + i">
        <line
          :x1="leftPadding"
          :y1="topPadding + chartHeight * (1 - tick.value / maxValue)"
          :x2="width - rightPadding"
          :y2="topPadding + chartHeight * (1 - tick.value / maxValue)"
          stroke="#e5e7eb"
          stroke-width="1"
        />
        <text
          :x="leftPadding - 10"
          :y="topPadding + chartHeight * (1 - tick.value / maxValue) + 4"
          text-anchor="end"
          class="text-xs fill-gray-500"
        >
          {{ formatValue(tick.value) }}
        </text>
      </g>
      
      <!-- 数据线/柱状图 -->
      <g v-if="type === 'line'">
        <polyline
          :points="linePoints"
          fill="none"
          stroke="#3b82f6"
          stroke-width="2"
          class="line-path"
        />
        <g
          v-for="(point, i) in dataPoints"
          :key="'point-' + i"
          class="line-point-group"
        >
          <!-- 数据点 -->
          <circle
            :cx="point.x"
            :cy="point.y"
            :r="hoveredIndex === i ? 6 : 4"
            :fill="hoveredIndex === i ? '#2563eb' : '#3b82f6'"
            class="line-point"
            @mouseenter="hoveredIndex = i"
            @mouseleave="hoveredIndex = -1"
            style="cursor: pointer;"
          />
          <!-- 数据标签背景 - 确保标签清晰可见 -->
          <rect
            v-if="point.value > 0"
            :x="point.x - 20"
            :y="Math.max(point.y - 28, topPadding + 5)"
            width="40"
            height="18"
            rx="4"
            fill="white"
            :stroke="hoveredIndex === i ? '#2563eb' : '#e5e7eb'"
            stroke-width="1"
            :opacity="hoveredIndex === i ? 0.95 : 0.9"
            class="line-label-bg"
          />
          <!-- 数据标签 - 显示在数据点上方，根据位置智能调整 -->
          <text
            v-if="point.value > 0"
            :x="point.x"
            :y="Math.max(point.y - 12, topPadding + 15)"
            text-anchor="middle"
            class="line-label"
            :class="{ 'line-label-hover': hoveredIndex === i }"
          >
            {{ formatValue(point.value) }}
          </text>
        </g>
      </g>
      <g v-else-if="type === 'bar'">
        <g
          v-for="(point, i) in dataPoints"
          :key="'bar-' + i"
          class="bar-group"
        >
          <rect
            :x="point.x - barWidth / 2"
            :y="point.y"
            :width="barWidth"
            :height="(height - bottomPadding) - point.y"
            :fill="hoveredIndex === i ? '#2563eb' : '#3b82f6'"
            :opacity="hoveredIndex === i ? 1 : 0.7"
            class="bar-rect"
            @mouseenter="hoveredIndex = i"
            @mouseleave="hoveredIndex = -1"
            style="cursor: pointer;"
          />
          <!-- 顶部数值标签 -->
          <text
            v-if="point.value > 0"
            :x="point.x"
            :y="Math.max(point.y - 5, topPadding + 15)"
            text-anchor="middle"
            class="bar-label"
            :class="{ 'bar-label-hover': hoveredIndex === i }"
          >
            {{ formatValue(point.value) }}
          </text>
        </g>
      </g>
      
      <!-- X轴标签 -->
      <g v-for="(item, i) in data" :key="'x-' + i">
        <text
          :x="dataPoints[i]?.x || (leftPadding + chartWidth * (i / (data.length - 1 || 1)))"
          :y="height - bottomPadding + 20"
          text-anchor="middle"
          class="text-xs fill-gray-600"
        >
          {{ item.name }}
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface Props {
  data: Array<{ name: string; value: number }>;
  type?: 'line' | 'bar';
  width?: number;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'line',
  width: 400,
  height: 200,
});

const leftPadding = 60; // 左侧padding增加，给Y轴标签更多空间
const rightPadding = 40; // 右侧padding防止溢出
const topPadding = 40;
const bottomPadding = 50; // 底部padding给X轴标签更多空间
const hoveredIndex = ref(-1);

// 固定柱宽为35px
const barWidth = 35;

const maxValue = computed(() => {
  if (props.data.length === 0) return 100;
  const max = Math.max(...props.data.map(d => d.value));
  return max === 0 ? 100 : Math.ceil(max * 1.1);
});

const yTicks = computed(() => {
  const ticks = [];
  const numTicks = 5;
  for (let i = 0; i <= numTicks; i++) {
    ticks.push({ value: (maxValue.value * i) / numTicks });
  }
  return ticks;
});

const chartWidth = computed(() => props.width - leftPadding - rightPadding);
const chartHeight = computed(() => props.height - topPadding - bottomPadding);

const dataPoints = computed(() => {
  if (props.data.length === 0) return [];
  
  return props.data.map((item, i) => {
    let x: number;
    
    if (props.type === 'bar') {
      // 柱状图：确保第一个柱子的左边和最后一个柱子的右边有足够空间
      const startX = leftPadding + barWidth / 2; // 第一个柱子中心位置
      const endX = props.width - rightPadding - barWidth / 2; // 最后一个柱子中心位置
      x = props.data.length === 1 
        ? startX 
        : startX + ((endX - startX) * i) / (props.data.length - 1);
    } else {
      // 折线图：均匀分布在整个图表区域
      const startX = leftPadding;
      const endX = props.width - rightPadding;
      x = props.data.length === 1 
        ? (startX + endX) / 2
        : startX + ((endX - startX) * i) / (props.data.length - 1);
    }
    
    const y = topPadding + chartHeight.value * (1 - item.value / maxValue.value);
    return { x, y, value: item.value };
  });
});

const linePoints = computed(() => {
  return dataPoints.value.map(p => `${p.x},${p.y}`).join(' ');
});

const formatValue = (value: number) => {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
  return value.toFixed(0);
};
</script>

<style scoped>
svg {
  display: block;
}

.bar-rect {
  transition: fill 0.2s ease, opacity 0.2s ease;
}

.bar-label {
  font-size: 11px;
  fill: #6b7280;
  font-weight: 500;
  pointer-events: none;
  transition: all 0.2s ease;
}

.bar-label-hover {
  fill: #2563eb;
  font-weight: 600;
  font-size: 12px;
}

.line-path {
  transition: stroke 0.2s ease;
}

.line-point {
  transition: r 0.2s ease, fill 0.2s ease;
}

.line-point:hover {
  filter: brightness(1.2);
}

.line-label {
  font-size: 11px;
  fill: #374151;
  font-weight: 500;
  pointer-events: none;
  transition: all 0.2s ease;
}

.line-label-hover {
  fill: #2563eb;
  font-weight: 600;
  font-size: 12px;
}

.line-label-bg {
  pointer-events: none;
}
</style>

