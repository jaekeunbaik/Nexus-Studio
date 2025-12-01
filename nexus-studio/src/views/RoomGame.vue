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
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <div class="game-content">
        <!-- Game Board -->
        <div class="board-section">
          <AnimalBoard 
            v-model:selectedLocation="selectedLocation"
          />
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

const selectedLocation = ref(null);

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
  });

  socket.on('mafiaGameStateUpdate', (state) => {
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
    if (data) {
      playerStore.setRole(data.role);
      playerStore.setScanResults(data.scanResults || []);
      playerStore.setWolfDetected(data.wolfDetected || false);
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
});
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
</style>
