<template>
  <div class="min-h-screen p-8">
    <!-- Nickname Input Modal -->
    <NicknameInput 
      v-if="showNicknameInput"
      @submit="handleNicknameSubmit"
    />

    <!-- Room Lobby -->
    <div v-else class="max-w-4xl mx-auto">
      <header class="glass-panel p-8 mb-8">
        <div class="flex items-center gap-4 mb-4">
          <div class="h-12 w-1 bg-gradient-to-b from-[#4426FF] to-[#5E6BFF] neon-glow"></div>
          <div>
            <h1 class="text-4xl font-black text-white">{{ uiStore.t('roomLobby') }}</h1>
            <p class="text-[#C4C3D9] font-mono text-sm mt-1">{{ uiStore.t('room') }} ID: <span class="font-bold text-[#4426FF]">{{ roomId }}</span></p>
          </div>
        </div>
      </header>

      <!-- Players List -->
      <div class="glass-panel p-6 mb-8">
        <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <span>{{ uiStore.t('players') }}</span>
          <span class="text-sm font-normal text-[#C4C3D9]">({{ players.length }})</span>
        </h2>
        <div class="flex flex-wrap justify-center gap-4">
          <div 
            v-for="player in players" 
            :key="player.id"
            class="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.33%-0.6rem)] bg-[#1E1C2F] rounded-r-xl border-l-4 border-l-[#4426FF] pl-6 pr-4 py-4 border-y border-r border-[#5E6BFF]/20 hover:border-[#5E6BFF] transition-all hover:neon-glow"
            style="display: flex; flex-direction: row; align-items: center; gap: 16px;"
          >
            <div class="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-[#4426FF] to-[#5E6BFF] flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {{ player.nickname[0].toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0 overflow-hidden" style="display: flex; flex-direction: row; align-items: center; gap: 8px;">
              <p class="font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis">{{ player.nickname }}</p>
              <p v-if="player.isHost" class="text-xs text-[#FFD95A] font-medium whitespace-nowrap flex-shrink-0">👑 {{ uiStore.t('host') || 'Host' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Game Selection (Host Only) -->
      <div v-if="isHost" class="glass-panel p-6 mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">{{ uiStore.t('selectGame') || 'Select Game' }}</h2>
        <select 
          v-model="selectedGame"
          class="w-full p-4 rounded-xl border-2 border-[#5E6BFF] bg-[#1C1A29] text-white font-medium outline-none transition-all"
        >
          <option value="animalSurvival">🦁 Animal Survival</option>
        </select>
      </div>

      <!-- Start Button (Host Only) -->
      <div v-if="isHost" class="text-center">
        <button 
          @click="startGame"
          class="btn-primary text-lg px-16 py-5"
        >
          {{ uiStore.t('startGame') }}
        </button>
      </div>

      <!-- Waiting Message (Non-Host) -->
      <div v-else class="text-center glass-panel p-8">
        <div class="animate-pulse">
          <p class="text-[#C4C3D9] text-lg">{{ uiStore.t('waitingHost') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRoomStore } from '@/stores/roomStore';
import { useSocket } from '@/composables/useSocket';
import { useUiStore } from '@/stores/uiStore';
import NicknameInput from '@/components/NicknameInput.vue';

const route = useRoute();
const router = useRouter();
const { socket } = useSocket();
const roomStore = useRoomStore();
const uiStore = useUiStore();

const roomId = computed(() => route.params.id);
const players = computed(() => roomStore.players);
const isHost = computed(() => roomStore.isHost);

const selectedGame = ref('animalSurvival');
const showNicknameInput = ref(false);

function startGame() {
  socket.emit('startGame', { roomId: roomId.value, gameType: selectedGame.value });
}

function handleNicknameSubmit(nickname) {
  localStorage.setItem('nickname', nickname);
  showNicknameInput.value = false;
  joinRoom(nickname);
}

function joinRoom(nickname) {
  if (!socket.connected) {
    socket.connect();
  }
  socket.emit('joinRoom', { roomId: roomId.value, nickname });
}

onMounted(() => {
  const storedNickname = localStorage.getItem('nickname');
  if (!storedNickname) {
    showNicknameInput.value = true;
  } else {
    joinRoom(storedNickname);
  }

  socket.on('roomUpdate', (data) => {
    roomStore.setPlayers(data.players);
    const me = data.players.find(p => p.id === socket.id);
    if (me) roomStore.setIsHost(me.isHost);
  });

  socket.on('gameStarted', (data) => {
    console.log('Game started event received:', data);
    if (data.gameType === 'animalSurvival' || !data.gameType) {
      console.log('Navigating to game view...');
      router.push(`/game/${roomId.value}`).catch(err => console.error('Router push error:', err));
    }
  });
  
  socket.on('roomClosed', () => {
    alert('Room closed by admin');
    router.push('/');
  });
});

onUnmounted(() => {
  socket.off('roomUpdate');
  socket.off('gameStarted');
  socket.off('roomClosed');
});
</script>
