<script setup>
import { useHudStore } from '@pinia/hudStore.js'
/**
 * HungerBar - Minecraft Style Hunger Display
 * 10 drumsticks, each = 2 hunger points (max 20)
 * 它把 hud.hunger（一个 0-20 的数字）可视化成 10 个鸡腿图标——这是 MC 玩家再熟悉不过的 HUD 元素。
 * 饥饿值范围	第 i 个图标显示
hunger >= (i*2) + 2
full (完整)
hunger >= (i*2) + 1
half (半个)
其他
empty (空)
 */
import { computed } from 'vue'

const hud = useHudStore()

// Calculate food states: 'full', 'half', or 'empty'
const foods = computed(() => {
  const result = []
  const hungerVal = hud.hunger
  for (let i = 0; i < 10; i++) {
    const foodPoints = i * 2
    if (hungerVal >= foodPoints + 2) {
      result.push('full')
    }
    else if (hungerVal >= foodPoints + 1) {
      result.push('half')
    }
    else {
      result.push('empty')
    }
  }
  return result
})
</script>

<template>
  <div class="food-bar">
    <div
      v-for="(state, index) in foods"
      :key="index"
      class="unit food"
      :class="state"
    />
  </div>
</template>
