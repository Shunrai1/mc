<script setup>

import { useHudStore } from '@pinia/hudStore.js'
import { useUiStore } from '@pinia/uiStore.js'
import emitter from '@three/utils/event/event-bus.js'
/**
这是 Minecraft 风格的游戏内 HUD（Heads-Up Display，平视显示器）——玩家在游戏中看到的"屏幕上的所有 UI 元素"都在这里组装。
HUD 只在游戏进行中（screen === 'playing'）显示，主菜单/暂停/加载界面时不会出现。

┌────────────────────────────────────────────┐
│  TopInfoBar (坐标 + 指南针)        │ InfoPanel   │ ← 顶部
│                                    │ KeyFeedback │
├────────────────────────────────────┴─────────┤
│                                            │
│                                            │
│             (3D 游戏画面)                   │
│                                            │
│                                            │
├────────────────────────────────────────────┤
│ [HealthBar] [HungerBar]                    │
│        [ExperienceBar]                     │
│        [Hotbar ▢▢▢▢▢▢▢▢▢]                 │ ← 底部
├────────────────────────────────────────────┤
│ [ChatBox]                                  │ ← 系统消息
└────────────────────────────────────────────┘
                        [PlayerPreview] [AchievementToast]
 */
import { onMounted, onUnmounted } from 'vue'
import AchievementPopup from '../ui/AchievementPopup.vue'
import AchievementToast from './AchievementToast.vue'
import ChatBox from './ChatBox.vue'
import ExperienceBar from './ExperienceBar.vue'
import HealthBar from './HealthBar.vue'
import Hotbar from './Hotbar.vue'
import HungerBar from './HungerBar.vue'
import InfoPanel from './InfoPanel.vue'
import KeyFeedbackPanel from './KeyFeedbackPanel.vue'
import PlayerPreview from './PlayerPreview.vue'
import TopInfoBar from './TopInfoBar.vue'

const ui = useUiStore()
const hud = useHudStore()

function handleKeyDown(e) {
  // If user is typing in an input, ignore logic
  if (['INPUT', 'TEXTAREA'].includes(e.target.tagName))
    return

  if (e.code === 'KeyT') {
    e.preventDefault()
    hud.toggleChat()
  }
}

// Handle pointer lock state when chat toggles
function handleChatOpened() {
  document.exitPointerLock()
}

function handleChatClosed() {
  // Re-request pointer lock to resume gameplay immediately
  // Note: Some browsers might block this if not triggered by user gesture,
  // but usually in a "click to play" app it might work or require a click.
  // We'll emit the request and let the handler decide.
  emitter.emit('game:request_pointer_lock')
}

// Setup event listeners on mount
onMounted(() => {
  hud.setupListeners()
  window.addEventListener('keydown', handleKeyDown)
  emitter.on('ui:chat-opened', handleChatOpened)
  emitter.on('ui:chat-closed', handleChatClosed)
})

onUnmounted(() => {
  hud.cleanupListeners()
  window.removeEventListener('keydown', handleKeyDown)
  emitter.off('ui:chat-opened', handleChatOpened)
  emitter.off('ui:chat-closed', handleChatClosed)
})
</script>

<template>
  <!-- HUD only visible when playing -->
  <div v-if="ui.screen === 'playing'" class="hud-root">
    <!-- Top Info Bar: Coordinates + Compass -->
    <TopInfoBar />

    <!-- Top Right Info Panel Stack -->
    <div class="hud-top-right-stack">
      <InfoPanel />
      <KeyFeedbackPanel />
    </div>

    <!-- Bottom HUD: Health, Hunger, XP, Hotbar -->
    <div class="bottom-hud">
      <div class="stats-row">
        <HealthBar />
        <HungerBar />
      </div>
      <ExperienceBar />
      <Hotbar />
    </div>

    <!-- Chat Box: System messages -->
    <ChatBox />

    <!-- Player Preview -->
    <PlayerPreview />

    <AchievementToast />
    <AchievementPopup />
  </div>
</template>
