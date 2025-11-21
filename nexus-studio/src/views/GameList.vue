<template>
  <div class="min-h-screen p-8">
    <header class="max-w-6xl mx-auto mb-12 flex justify-between items-center">
      <div>
        <h1 class="text-5xl font-black text-white mb-2" style="text-shadow: 0 0 20px rgba(68, 38, 255, 0.6)">{{ uiStore.t('gameList') }}</h1>
        <div class="h-1 w-24 bg-gradient-to-r from-[#4426FF] to-[#5E6BFF] neon-glow"></div>
      </div>
      <button @click="$router.push('/')" class="text-[#C4C3D9] hover:text-white font-medium transition-colors flex items-center gap-2 hover:neon-glow">
        <span>←</span> Home
      </button>
    </header>

    <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      
      <!-- Animal Survival Card -->
      <div class="card hover:scale-[1.02] transition-transform duration-300 group cursor-pointer" @click="createRoom">
        <div class="h-48 bg-gradient-to-br from-[#1E1C2F] to-[#181626] rounded-xl mb-6 flex items-center justify-center shadow-inner relative overflow-hidden border border-[#4426FF]/30">
          <div class="absolute inset-0 bg-[#4426FF] opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <span class="text-6xl relative z-10 group-hover:scale-110 transition-transform">🦁</span>
        </div>
        <h2 class="text-2xl font-bold mb-3 text-white">Animal Survival</h2>
        <p class="text-[#C4C3D9] mb-6 leading-relaxed text-sm">
          {{ uiStore.t('animalSurvivalDesc') }}
        </p>
        <button 
          class="w-full btn-primary"
        >
          {{ uiStore.t('startGame') }}
        </button>
      </div>

      <!-- Coming Soon -->
      <div class="card opacity-50 cursor-not-allowed">
        <div class="h-48 bg-[#1C1A29] rounded-xl mb-6 flex items-center justify-center border border-[#5E6BFF]/20">
          <span class="text-6xl grayscale">🎲</span>
        </div>
        <h2 class="text-2xl font-bold mb-3 text-white">Coming Soon</h2>
        <p class="text-[#C4C3D9] mb-6 text-sm">
          {{ uiStore.t('comingSoon') }}
        </p>
        <button class="w-full btn-secondary" disabled>
          Coming Soon
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useUiStore } from '@/stores/uiStore';

const router = useRouter();
const uiStore = useUiStore();

function createRoom() {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  router.push(`/room/${roomId}`);
}
</script>
