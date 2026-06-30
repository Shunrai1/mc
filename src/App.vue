<script setup>
import Experience from '@three/experience.js'
import Crosshair from '@ui-components/Crosshair.vue'
import UiRoot from '@ui-components/menu/UiRoot.vue'
import AchievementPopup from '@ui-components/ui/AchievementPopup.vue'
</script>

<template>
  <!-- 主容器：相对定位 -->
  <div class="relative h-screen w-screen overflow-hidden">
    <!-- Three.js Canvas -->
    <canvas ref="threeCanvas" class="three-canvas absolute inset-0 z-0" />
  </div>
</template>

<style scoped>
.three-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* Event Monitor 浮动面板样式 */
.event-monitor-overlay {
  position: absolute;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 100;
}
</style>
