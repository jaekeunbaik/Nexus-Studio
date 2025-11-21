<template>
  <div class="min-h-screen">
    <!-- Language Switcher -->
    <div class="fixed top-6 right-6 z-50">
      <button 
        @click="uiStore.toggleLanguage()"
        class="px-5 py-2.5 bg-[#181626] backdrop-blur-md text-[#E6E6F0] rounded-full hover:bg-[#1E1C2F] transition-all shadow-lg border border-[#5E6BFF]/30 hover:border-[#5E6BFF] font-medium hover:neon-glow"
      >
        {{ uiStore.language === 'en' ? '🇰🇷 한국어' : '🇺🇸 English' }}
      </button>
    </div>
    <router-view></router-view>
  </div>
</template>

<script setup>
import { useUiStore } from '@/stores/uiStore';
const uiStore = useUiStore();
</script>
