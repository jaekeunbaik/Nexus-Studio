<template>
  <div class="min-h-screen p-8 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
    <!-- Animated Background Glow -->
    <div class="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#7B2FFF] opacity-20 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#00D4FF] opacity-15 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
    
    <!-- Nickname Input Modal -->
    <NicknameInput 
      v-if="showNicknameInput"
      @submit="handleNicknameSubmit"
    />

    <!-- Room Lobby -->
    <div v-else class="max-w-4xl mx-auto w-full relative z-10">
      <header class="glass-panel p-8 mb-8 border-2 border-[#7B2FFF]/40 shadow-[0_0_30px_rgba(123,47,255,0.3)]">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-4">
            <div class="h-12 w-1.5 bg-gradient-to-b from-[#7B2FFF] to-[#00D4FF] shadow-[0_0_20px_rgba(123,47,255,0.8)]"></div>
            <div>
              <h1 class="text-4xl font-black text-white" style="text-shadow: 0 0 20px rgba(123, 47, 255, 0.6)">{{ uiStore.t('roomLobby') }}</h1>
              <p class="text-[#E0E7FF] font-mono text-sm mt-1">{{ uiStore.t('room') }} ID: <span class="font-bold text-[#00D4FF]">{{ roomId }}</span></p>
            </div>
          </div>
          
          <!-- QR Code Button -->
          <button 
            @click="showQrModal = true"
            class="p-3 rounded-xl bg-[#7B2FFF]/20 border-2 border-[#7B2FFF]/50 hover:border-[#00D4FF] hover:shadow-[0_0_20px_rgba(0,212,255,0.6)] transition-all group"
            title="Show QR Code"
          >
            <span class="text-2xl group-hover:scale-110 transition-transform block">📱</span>
          </button>
        </div>
      </header>

      <!-- Players List -->
      <div class="glass-panel p-6 mb-8 border-2 border-[#00D4FF]/30 shadow-[0_0_25px_rgba(0,212,255,0.2)]">
        <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2" style="text-shadow: 0 0 15px rgba(0, 212, 255, 0.5)">
          <span>{{ uiStore.t('players') }}</span>
          <span class="text-sm font-normal text-[#E0E7FF]">({{ players.length }})</span>
        </h2>
        <div class="flex flex-wrap justify-center gap-4">
          <div 
            v-for="player in players" 
            :key="player.id"
            class="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.33%-0.6rem)] bg-[#1E1C2F]/80 rounded-xl border-l-4 border-l-[#00D4FF] pl-6 pr-4 py-4 border border-[#7B2FFF]/30 hover:border-[#00D4FF] hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all"
            style="display: flex; flex-direction: row; align-items: center; gap: 16px;"
          >
            <div class="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-[#7B2FFF] to-[#00D4FF] flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(123,47,255,0.6)]">
              {{ player.nickname[0].toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0 overflow-hidden" style="display: flex; flex-direction: row; align-items: center; gap: 8px;">
              <p class="font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis">{{ player.nickname }}</p>
              <p v-if="player.isHost" class="text-xs text-[#FFD700] font-medium whitespace-nowrap flex-shrink-0">👑 {{ uiStore.t('host') || 'Host' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Game Info (Host Only) -->
      <div v-if="isHost" class="glass-panel p-6 mb-8 border-2 border-[#FF006E]/30 shadow-[0_0_25px_rgba(255,0,110,0.2)]">
        <h2 class="text-2xl font-bold text-white mb-4" style="text-shadow: 0 0 15px rgba(255, 0, 110, 0.5)">게임 정보</h2>
        
        <!-- Game Description -->
        <div class="p-4 bg-[#1E1C2F]/80 rounded-xl border-2 border-[#FF006E]/40">
          <p class="text-[#E0E7FF] text-sm leading-relaxed">
            <span class="font-bold text-[#FF006E]">🎭 양치기 소년 (Shepherd & Wolf)</span><br/>
            8가지 역할 (양치기, 양, 늑대, 거북이, 고슴도치, 부엉이, 꿀벌, 벌꿀오소리)<br/>
            밤/낮 페이즈, 역할별 특수 능력, 5라운드 진행
          </p>
        </div>
      </div>

      <!-- Start Button (Host Only) -->
      <div v-if="isHost" class="text-center">
        <button 
          @click="startGame"
          :disabled="players.length < 8"
          class="bg-gradient-to-r from-[#7B2FFF] via-[#00D4FF] to-[#7B2FFF] text-white text-lg px-16 py-5 rounded-full font-bold shadow-2xl hover:shadow-[0_0_40px_rgba(123,47,255,0.8)] hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 animate-gradient bg-[length:200%_auto]"
        >
          {{ players.length < 8 ? `8명이 모여야 시작할 수 있습니다 (${players.length}/8)` : uiStore.t('startGame') }}
        </button>
      </div>

      <!-- Debug Fill Button (Host Only) -->
      <div v-if="isHost" class="text-center mt-4">
        <button 
          @click="debugFillRoom"
          class="text-[#7B2FFF] text-sm px-4 py-2 rounded-lg border border-[#7B2FFF]/30 hover:bg-[#7B2FFF]/10 transition-colors"
        >
          🤖 Debug: Fill Room
        </button>
      </div>

      <!-- Waiting Message (Non-Host) -->
      <div v-else class="text-center glass-panel p-8 border-2 border-[#7B2FFF]/30">
        <div class="animate-pulse">
          <p class="text-[#E0E7FF] text-lg">{{ uiStore.t('waitingHost') }}</p>
        </div>
      </div>
    </div>

    <!-- QR Code Modal -->
    <div v-if="showQrModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" @click="showQrModal = false">
      <div class="bg-[#1E1C2F] p-8 rounded-2xl border border-[#5E6BFF] shadow-2xl max-w-sm w-full text-center relative" @click.stop>
        <button @click="showQrModal = false" class="absolute top-4 right-4 text-[#C4C3D9] hover:text-white text-2xl">×</button>
        
        <h3 class="text-2xl font-bold text-white mb-6">방 초대 QR 코드</h3>
        
        <div class="bg-white p-4 rounded-xl inline-block mb-6">
          <QrcodeVue :value="currentUrl" :size="200" level="H" />
        </div>
        
        <p class="text-[#C4C3D9] text-sm mb-2">카메라로 스캔하여 입장하세요!</p>
        <div class="flex items-center justify-center gap-2">
          <p class="text-[#5E6BFF] text-xs font-mono break-all">{{ currentUrl }}</p>
          <button 
            @click="copyUrl" 
            class="p-1 rounded hover:bg-[#5E6BFF]/20 text-[#5E6BFF] transition-colors"
            title="링크 복사"
          >
            📋
          </button>
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
import QrcodeVue from 'qrcode.vue';

const route = useRoute();
const router = useRouter();
const { socket } = useSocket();
const roomStore = useRoomStore();
const uiStore = useUiStore();

const roomId = computed(() => route.params.id);
const players = computed(() => roomStore.players);
const isHost = computed(() => roomStore.isHost);

const selectedGame = ref('mafiaGame');
const showNicknameInput = ref(false);
const showQrModal = ref(false);
const currentUrl = computed(() => `${window.location.origin}/room/${roomId.value}`);

function copyUrl() {
  if (navigator.clipboard && window.isSecureContext) {
    // Secure context (HTTPS or localhost)
    navigator.clipboard.writeText(currentUrl.value).then(() => {
      alert('링크가 복사되었습니다!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
      fallbackCopyTextToClipboard(currentUrl.value);
    });
  } else {
    // Non-secure context (HTTP)
    fallbackCopyTextToClipboard(currentUrl.value);
  }
}

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    const msg = successful ? 'successful' : 'unsuccessful';
    if (successful) {
      alert('링크가 복사되었습니다!');
    } else {
      alert('링크 복사에 실패했습니다. 수동으로 복사해주세요.');
    }
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
    alert('링크 복사에 실패했습니다. 수동으로 복사해주세요.');
  }

  document.body.removeChild(textArea);
}

function startGame() {
  socket.emit('startGame', { roomId: roomId.value, gameType: selectedGame.value });
}

function debugFillRoom() {
  socket.emit('debugFillRoom', { roomId: roomId.value });
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
    router.push(`/game/${roomId.value}`).catch(err => console.error('Router push error:', err));
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

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.35; }
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-gradient {
  animation: gradient 3s ease infinite;
}
</style>
