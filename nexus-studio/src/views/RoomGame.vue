<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0F0E18]">
    <div class="w-full max-w-7xl mx-auto p-4 md:p-6">
      <!-- Header -->
      <header class="glass-panel p-4 md:p-6 mb-4 border-2 border-[#4426FF] neon-glow">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 class="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <span class="text-[#4426FF]">#</span> {{ roomId }}
          </h1>
          <div class="flex gap-3 flex-wrap justify-center">
            <div class="text-sm font-medium text-[#C4C3D9] bg-[#1C1A29] px-4 py-2 rounded-lg border border-[#5E6BFF]/30">
              {{ uiStore.t('players') }}: <span class="font-bold text-white">{{ players.length }}</span>
            </div>
            <div class="text-sm font-medium text-[#C4C3D9] bg-[#1C1A29] px-4 py-2 rounded-lg border border-[#5E6BFF]/30">
              Phase: <span class="font-bold text-[#4426FF]">{{ uiStore.t(`phase.${phase}`) }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content - Stacked on Mobile -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        <!-- Game Board - Full Width on Mobile -->
        <div class="lg:col-span-2">
          <div class="glass-panel p-4 md:p-6 border border-[#5E6BFF]/30">
            <AnimalBoard 
              v-model:selectedLocation="selectedLocation"
            />
          </div>
        </div>

        <!-- Sidebar / UI Panel -->
        <div class="lg:col-span-1">
          <div class="glass-panel p-4 md:p-6 border border-[#5E6BFF]/30 space-y-4">
            <AnimalUI 
              :players="players"
              @move="handleMove"
              @investigate="handleInvestigate"
              @disguise="handleDisguise"
            />

            <!-- Logs -->
            <div class="bg-[#1E1C2F] rounded-xl p-4 max-h-64 overflow-y-auto border border-[#5E6BFF]/20">
              <h3 class="text-sm font-bold text-[#4426FF] uppercase tracking-wider mb-3">{{ uiStore.t('gameLogs') }}</h3>
              <div class="space-y-2 text-sm">
                <div v-for="(log, i) in logs" :key="i" class="text-[#C4C3D9] border-b border-[#5E6BFF]/10 pb-2 last:border-0 last:pb-0 leading-relaxed">
                  {{ log }}
                </div>
                <div v-if="logs.length === 0" class="text-[#C4C3D9]/50 italic text-center py-4">
                  Game started...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRoomStore } from '@/stores/roomStore';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useUiStore } from '@/stores/uiStore';
import { useSocket } from '@/composables/useSocket';
import AnimalBoard from '@/games/animalSurvival/AnimalBoard.vue';
import AnimalUI from '@/games/animalSurvival/AnimalUI.vue';

const route = useRoute();
const router = useRouter();
const { socket } = useSocket();
const roomStore = useRoomStore();
const gameStore = useGameStore();
const playerStore = usePlayerStore();
const uiStore = useUiStore();

const roomId = computed(() => roomStore.roomId);
const players = computed(() => roomStore.players);
const phase = computed(() => roomStore.phase);
const logs = computed(() => gameStore.logs);

const selectedLocation = ref(null);

function handleMove() {
  if (!selectedLocation.value) return;
  socket.emit('selectMove', { roomId: roomId.value, location: selectedLocation.value });
}

function handleInvestigate(targetId) {
  if (targetId) {
    socket.emit('selectInvestigate', { roomId: roomId.value, targetId });
  }
}

function handleDisguise(role) {
  if (role) {
    socket.emit('selectDisguise', { roomId: roomId.value, role });
  }
}

onMounted(() => {
  if (!roomStore.roomId) {
    roomStore.setRoom(route.params.id, 'animalSurvival');
  }
  socket.emit('rejoin', { roomId: route.params.id });

  socket.on('gameStateUpdate', (state) => {
    roomStore.setPhase(state.phase);
    roomStore.setRound(state.round);
    roomStore.setPlayers(state.players);
    gameStore.setLocationMap(state.locationMap);
    const me = state.players.find(p => p.id === socket.id);
    if (me) {
      playerStore.setAlive(me.alive);
      playerStore.setHunger(me.hunger);
      playerStore.setLocation(me.location);
      playerStore.setRole(me.role);
    }
  });

  socket.on('gameLogs', (newLogs) => {
    newLogs.forEach(log => gameStore.addLog(log));
  });
  
  socket.on('gameOver', (results) => {
    router.push(`/result/${roomId.value}`);
  });
});

onUnmounted(() => {
  socket.off('gameStateUpdate');
  socket.off('gameLogs');
  socket.off('gameOver');
});
</script>
