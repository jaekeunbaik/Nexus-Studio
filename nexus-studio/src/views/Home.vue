<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
    
    <!-- Animated Background Glow -->
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4426FF] opacity-20 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#5E6BFF] opacity-15 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
    
    <!-- Hero Section -->
    <div class="text-center z-10 max-w-4xl">
      <h1 class="text-7xl md:text-9xl font-black text-white mb-6 tracking-tight" style="text-shadow: 0 0 40px rgba(68, 38, 255, 0.8), 0 0 80px rgba(94, 107, 255, 0.4)">
        Nexus Studio
      </h1>
      <div class="h-1 w-32 bg-gradient-to-r from-transparent via-[#4426FF] to-transparent mx-auto mb-8 neon-glow"></div>
      <p class="text-xl md:text-2xl text-[#C4C3D9] mb-12 font-light tracking-wide">
        {{ uiStore.t('subtitle') }}
      </p>
      
      <button 
        @click="$router.push('/games')"
        class="btn-primary text-lg px-16 py-5"
      >
        {{ uiStore.t('startPlaying') }}
      </button>
    </div>

    <!-- Decorative Grid Pattern -->
    <div class="absolute inset-0 opacity-5" style="background-image: linear-gradient(rgba(94, 107, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(94, 107, 255, 0.1) 1px, transparent 1px); background-size: 50px 50px;"></div>
  </div>
</template>

<script setup>
import { useUiStore } from '@/stores/uiStore';
const uiStore = useUiStore();
</script>

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.25; }
}
</style>
