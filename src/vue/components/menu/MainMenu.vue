<script setup>
/**
 * MainMenu - Main menu with Root and WorldSetup views
 * Includes Advanced panel for WorldGen settings
 */
import { useSettingsStore } from '@pinia/settingsStore.js'
import { useUiStore } from '@pinia/uiStore.js'
import { WORLDGEN_PRESET_IDS, WORLDGEN_PRESETS } from '@three/config/worldgen-presets.js'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AchievementMenu from './AchievementMenu.vue'
import McStepSlider from './ui/McStepSlider.vue'
</script>