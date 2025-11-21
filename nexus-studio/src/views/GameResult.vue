<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0F0E18] relative overflow-hidden">
    <!-- Background Glow -->
    <div class="absolute top-1/3 left-1/3 w-96 h-96 bg-[#4426FF] opacity-10 rounded-full blur-3xl"></div>
    
    <div class="max-w-2xl w-full glass-panel p-12 text-center relative z-10">
      <div class="mb-8">
        <h1 class="text-5xl font-black text-white mb-4" style="text-shadow: 0 0 20px rgba(68, 38, 255, 0.6)">{{ uiStore.t('gameOver') }}</h1>
        <div class="h-1 w-24 bg-gradient-to-r from-[#4426FF] to-[#5E6BFF] mx-auto neon-glow"></div>
      </div>

      <!-- Winners Display -->
      <div v-if="winners && winners.length > 0" class="mb-8">
        <h2 class="text-2xl font-bold text-[#FFD95A] mb-6">🏆 {{ uiStore.t('winners') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            v-for="winner in winners" 
            :key="winner.id"
            class="bg-[#1E1C2F] rounded-xl p-6 border-2 border-[#4426FF] shadow-lg neon-glow"
          >
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-[#4426FF] to-[#5E6BFF] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 shadow-lg">
              {{ winner.nickname[0].toUpperCase() }}
            </div>
            <p class="font-bold text-xl text-white">{{ winner.nickname }}</p>
            <p class="text-sm text-[#C4C3D9] mt-1">{{ winner.role }}</p>
          </div>
        </div>
      </div>

      <div v-else class="mb-8">
        <p class="text-[#C4C3D9] text-xl">{{ uiStore.t('noWinners') }}</p>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-4 justify-center">
        <button 
          @click="$router.push('/games')"
          class="btn-secondary px-8 py-4"
        >
          {{ uiStore.t('backToGames') }}
        </button>
        <button 
          @click="playAgain"
          class="btn-primary px-8 py-4"
        >
          {{ uiStore.t('playAgain') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRoomStore } from '@/stores/roomStore';
import { useUiStore } from '@/stores/uiStore';

const route = useRoute();
const router = useRouter();
const roomStore = useRoomStore();
const uiStore = useUiStore();

const winners = computed(() => {
  return roomStore.players.filter(p => p.alive);
});

function playAgain() {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  router.push(`/room/${roomId}`);
}

onMounted(() => {
  console.log('Game Result - Winners:', winners.value);
});
</script>
