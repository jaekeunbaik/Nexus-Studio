<template>
  <div class="game-container">
    <div class="game-wrapper">
      <!-- Header -->
      <header class="game-header">
        <div class="header-content">
          <div class="room-info">
            <span class="room-icon">🎮</span>
            <h1 class="room-id">{{ roomId }}</h1>
          </div>
          <div class="game-stats">
            <div class="stat-badge">
              <span class="stat-icon">👥</span>
              <span class="stat-value">{{ players.length }}명</span>
            </div>
            <div class="stat-badge phase-badge" :class="phaseClass">
              <span class="stat-icon">{{ phaseIcon }}</span>
              <span class="stat-value">{{ phaseName }}</span>
            </div>
            <div class="stat-badge timer-badge" :class="{ 'timer-urgent': timer <= 10 }">
              <span class="stat-icon">⏳</span>
              <span class="stat-value">{{ formattedTimer }}</span>
            </div>
            <div class="stat-badge location-badge" v-if="myLocation">
              <span class="stat-icon">📍</span>
              <span class="stat-value">{{ myLocationName }}</span>
            </div>
          </div>
        </div>
      </header>

      <RoleDescriptionModal 
        :isOpen="showRoleModal" 
        :role="myRole" 
        @close="closeRoleModal" 
      />

      <!-- Main Content -->
      <div class="game-content">
        <!-- Game Board -->
        <div class="board-section">
          <AnimalBoard 
            v-model:selectedLocation="selectedLocation"
          />
          
          <!-- Move Button (Night Only) -->
          <div v-if="phase === 'night'" class="move-controls">
            <button 
              class="move-btn" 
              :disabled="!selectedLocation || isMoving"
              @click="handleMove"
            >
              <span class="btn-icon">🏃</span>
              <span class="btn-text">{{ selectedLocation ? getLocationNameKo(selectedLocation) + '(으)로 이동 예약' : '이동할 지역 선택' }}</span>
            </button>
            <p class="move-hint">밤이 끝나면 선택한 지역으로 이동합니다.</p>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="sidebar-section">
          <!-- Mafia Game UI -->
          <MafiaUI />

          <!-- Game Logs -->
          <div class="logs-panel">
            <div class="logs-header">
              <span class="logs-icon">📜</span>
              <h3 class="logs-title">게임 로그</h3>
            </div>
            <div class="logs-content">
              <div v-for="(log, i) in logs" :key="i" class="log-item">
                {{ log }}
              </div>
              <div v-if="logs.length === 0" class="logs-empty">
                게임이 시작되었습니다...
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
import { useSocket } from '@/composables/useSocket';
import AnimalBoard from '@/games/animalSurvival/AnimalBoard.vue';
import MafiaUI from '@/games/animalSurvival/MafiaUI.vue';
import RoleDescriptionModal from '@/games/animalSurvival/RoleDescriptionModal.vue';

const route = useRoute();
const router = useRouter();
const { socket } = useSocket();
const roomStore = useRoomStore();
const gameStore = useGameStore();
const playerStore = usePlayerStore();

const roomId = computed(() => roomStore.roomId);
const players = computed(() => roomStore.players);
const phase = computed(() => roomStore.phase);
const logs = computed(() => gameStore.logs);
const gameType = computed(() => gameStore.gameType);
const timer = computed(() => roomStore.timer);
const myRole = computed(() => playerStore.role);
const myLocation = computed(() => playerStore.location);

const showRoleModal = ref(false);
const selectedLocation = ref(null);
const isMoving = ref(false);

const formattedTimer = computed(() => {
  const m = Math.floor(timer.value / 60);
  const s = timer.value % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
});

const myLocationName = computed(() => {
  const names = {
    Sky: '하늘',
    River: '강',
    Mountain: '산',
    DeathCamp: '사망자 수용소'
  };
  return names[myLocation.value] || myLocation.value;
});

function closeRoleModal() {
  showRoleModal.value = false;
}

const phaseClass = computed(() => {
  if (phase.value === 'night') return 'phase-night';
  if (phase.value === 'day') return 'phase-day';
  return '';
});

const phaseIcon = computed(() => {
  if (phase.value === 'night') return '🌙';
  if (phase.value === 'day') return '☀️';
  return '⏸️';
});

const phaseName = computed(() => {
  if (phase.value === 'night') return '밤';
  if (phase.value === 'day') return '낮';
  if (phase.value === 'moving') return '이동';
  return '대기';
});

function handleMove() {
  if (!selectedLocation.value) return;
  
  isMoving.value = true;
  socket.emit('mafiaMoveLocation', { 
    roomId: roomId.value, 
    location: selectedLocation.value 
  });
}

onMounted(() => {
  if (!roomStore.roomId) {
    roomStore.setRoom(route.params.id, 'mafiaGame');
  }
  socket.emit('rejoin', { roomId: route.params.id });

  // Original game events
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

  // Mafia game events
  socket.on('gameStarted', ({ gameType: type }) => {
    gameStore.setGameType(type);
    playerStore.setActionSubmitted(false);
    roomStore.startTimer(60); // Start 60s timer
  });

  socket.on('mafiaGameStateUpdate', (state) => {
    // Check if phase changed to reset timer
    if (roomStore.phase !== state.phase) {
      roomStore.startTimer(60); // Reset timer on phase change
    }

    roomStore.setPhase(state.phase);
    roomStore.setRound(state.round);
    roomStore.setPlayers(state.players);
    gameStore.setLocationCounts(state.locationCounts);
    
    // Reset action submitted on phase change
    playerStore.setActionSubmitted(false);
    
    const me = state.players.find(p => p.id === socket.id);
    if (me) {
      playerStore.setAlive(me.alive);
      playerStore.setLocation(me.location);
    }
  });

  socket.on('mafiaPrivateData', (data) => {
    console.log('Received mafiaPrivateData:', data);
    if (data) {
      // Update store first
      const isNewRole = !playerStore.role;
      playerStore.setRole(data.role);
      playerStore.setScanResults(data.scanResults || []);
      playerStore.setWolfDetected(data.wolfDetected || false);

      // Then show modal if it's a new role assignment
      if (isNewRole && data.role) {
        console.log('Opening role modal for role:', data.role);
        showRoleModal.value = true;
      }
    }
  });

  socket.on('mafiaGameLogs', (newLogs) => {
    newLogs.forEach(log => gameStore.addLog(log));
  });

  socket.on('mafiaActionResult', (result) => {
    if (result.success) {
      console.log('Action submitted successfully');
    } else {
      console.error('Action failed:', result.error);
      playerStore.setActionSubmitted(false);
    }
  });

  socket.on('mafiaGameOver', (data) => {
    router.push(`/result/${roomId.value}`);
  });

  socket.on('mafiaMoveSuccess', ({ location }) => {
    isMoving.value = false;
    // Show success feedback (maybe toast or just console for now)
    console.log('Move scheduled to:', location);
    alert(`다음 날 ${getLocationNameKo(location)}로 이동합니다.`);
  });

  socket.on('mafiaMoveError', ({ error }) => {
    isMoving.value = false;
    alert(error);
  });
});

onUnmounted(() => {
  socket.off('gameStateUpdate');
  socket.off('gameLogs');
  socket.off('gameOver');
  socket.off('gameStarted');
  socket.off('mafiaGameStateUpdate');
  socket.off('mafiaPrivateData');
  socket.off('mafiaGameLogs');
  socket.off('mafiaActionResult');
  socket.off('mafiaGameOver');
  socket.off('mafiaMoveSuccess');
  socket.off('mafiaMoveError');
});

function getLocationNameKo(loc) {
  const names = {
    Sky: '하늘',
    River: '강',
    Mountain: '산',
    DeathCamp: '사망자 수용소'
  };
  return names[loc] || loc;
}
</script>

<style scoped>
.game-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFF9E6 0%, #FFFEF7 100%);
  padding: 20px;
}

.game-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.game-header {
  background: white;
  border-radius: 20px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 3px solid #FFD700;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.room-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.room-icon {
  font-size: 32px;
}

.room-id {
  font-size: 28px;
  font-weight: 900;
  margin: 0;
  color: #333;
}

.game-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-badge {
  background: linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%);
  padding: 8px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 2px solid #DEE2E6;
}

.stat-icon {
  font-size: 20px;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.phase-badge.phase-night {
  background: linear-gradient(135deg, #2D3748 0%, #1A202C 100%);
  border-color: #4A5568;
}

.phase-badge.phase-night .stat-value {
  color: white;
}

.phase-badge.phase-day {
  background: linear-gradient(135deg, #FFEB3B 0%, #FFA000 100%);
  border-color: #FFD700;
}

.timer-badge {
  background: linear-gradient(135deg, #FFF 0%, #F0F0F0 100%);
  border-color: #DDD;
}

.timer-urgent {
  background: linear-gradient(135deg, #FFE5E5 0%, #FFD0D0 100%);
  border-color: #FF6B6B;
  animation: pulse 1s infinite;
}

.timer-urgent .stat-value {
  color: #D32F2F;
}

.location-badge {
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
  border-color: #90CAF9;
}

.location-badge .stat-value {
  color: #1976D2;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.game-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 20px;
}

.board-section {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.logs-panel {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.logs-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #F0F0F0;
}

.logs-icon {
  font-size: 24px;
}

.logs-title {
  font-size: 18px;
  font-weight: 800;
  margin: 0;
  color: #333;
}

.logs-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item {
  background: linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%);
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  border-left: 4px solid #4A90E2;
  font-weight: 500;
}

.logs-empty {
  text-align: center;
  padding: 32px 16px;
  color: #999;
  font-size: 14px;
  font-style: italic;
}

@media (max-width: 1024px) {
  .game-content {
    grid-template-columns: 1fr;
  }
  
  .sidebar-section {
    order: -1;
  }
}

@media (max-width: 768px) {
  .game-container {
    padding: 12px;
  }
  
  .game-header {
    padding: 16px;
  }
  
  .room-id {
    font-size: 20px;
  }
  
  .board-section {
    padding: 16px;
  }
}

.move-controls {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.move-btn {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
  width: 100%;
  justify-content: center;
}

.move-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(74, 144, 226, 0.4);
}

.move-btn:disabled {
  background: #CCC;
  cursor: not-allowed;
  box-shadow: none;
}

.move-hint {
  font-size: 14px;
  color: #666;
  margin: 0;
}
</style>
