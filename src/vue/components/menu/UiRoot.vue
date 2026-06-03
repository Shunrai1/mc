<script setup>
import { useUiStore } from '@pinia/uiStore.js'
import emitter from '@three/utils/event/event-bus.js'
/**
 * UiRoot - Menu System Root Component
 * Manages screen transitions and overlay rendering
 */
import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import HowToPlay from './HowToPlay.vue'
import LoadingScreen from './LoadingScreen.vue'
</script>

<template></template>

<style scoped></style>
