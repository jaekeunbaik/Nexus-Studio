<template>
  <div class="animal-board">
    <div class="board-grid">
      <div 
        v-for="loc in locations" 
        :key="loc"
        class="location-card"
        :class="[
          getLocationClass(loc),
          { 'is-selected': selectedLocation === loc },
          { 'is-largest': isLargestLocation(loc) }
        ]"
        @click="selectLocation(loc)"
      >
        <!-- Location Header -->
        <div class="location-header">
          <span class="location-emoji">{{ getLocationEmoji(loc) }}</span>
          <h3 class="location-name">{{ getLocationNameKo(loc) }}</h3>
          <span class="player-count">{{ getPlayersInLocation(loc).length }}명</span>
        </div>

        <!-- Largest Location Badge -->
        <div v-if="isLargestLocation(loc)" class="largest-badge">
          <span class="badge-icon">👑</span>
          <span class="badge-text">양 투표 가능</span>
        </div>

        <!-- Players in Location -->
        <div class="players-grid">
          <div 
            v-for="p in getPlayersInLocation(loc)" 
            :key="p.id"
            class="player-avatar"
            :class="{ 'is-me': p.id === myPlayerId }"
            :title="p.nickname"
          >
            <span class="avatar-emoji">{{ getPlayerIcon(p) }}</span>
            <span class="avatar-name">{{ p.nickname }}</span>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="getPlayersInLocation(loc).length === 0" class="empty-state">
          <span class="empty-icon">🌿</span>
          <span class="empty-text">비어있음</span>
        </div>

        <!-- My Location Indicator -->
        <div v-if="myLocation === loc" class="my-location-badge">
          <span class="pulse-dot"></span>
          <span class="badge-text">내 위치</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useRoomStore } from '@/stores/roomStore';

const props = defineProps({
  selectedLocation: String
});

const emit = defineEmits(['update:selectedLocation']);

const gameStore = useGameStore();
const playerStore = usePlayerStore();
const roomStore = useRoomStore();

const locations = ['Lobby', 'Forest', 'Field', 'River', 'Sky'];

const myLocation = computed(() => playerStore.location);
const myPlayerId = computed(() => playerStore.playerId);
const locationCounts = computed(() => gameStore.locationCounts);

function getLocationClass(loc) {
  const classes = {
    Lobby: 'location-lobby',
    Forest: 'location-forest',
    Field: 'location-field',
    River: 'location-river',
    Sky: 'location-sky'
  };
  return classes[loc] || '';
}

function getLocationEmoji(loc) {
  const emojis = {
    Lobby: '🏰',
    Forest: '🌲',
    Field: '🌾',
    River: '🌊',
    Sky: '☁️'
  };
  return emojis[loc] || '📍';
}

function getLocationNameKo(loc) {
  const names = {
    Lobby: '로비',
    Forest: '숲',
    Field: '들판',
    River: '강',
    Sky: '하늘'
  };
  return names[loc] || loc;
}

function getPlayersInLocation(loc) {
  return roomStore.players.filter(p => p.location === loc && p.alive);
}

function isLargestLocation(loc) {
  if (!locationCounts.value) return false;
  const maxCount = Math.max(...Object.values(locationCounts.value));
  return locationCounts.value[loc] === maxCount && maxCount > 0;
}

function getPlayerIcon(p) {
  // Show role icon only for current player
  if (p.id === myPlayerId.value) {
    return getRoleIcon(playerStore.role);
  }
  return '👤';
}

function getRoleIcon(role) {
  const icons = {
    shepherd_boy: '🧑‍🌾',
    sheep: '🐑',
    wolf: '🐺',
    turtle: '🐢',
    hedgehog: '🦔',
    owl: '🦉',
    bee: '🐝',
    honey_badger: '🍯'
  };
  return icons[role] || '👤';
}

function selectLocation(loc) {
  emit('update:selectedLocation', loc);
}
</script>

<style scoped>
.animal-board {
  width: 100%;
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.location-card {
  position: relative;
  border-radius: 20px;
  padding: 20px;
  min-height: 200px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 4px solid transparent;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.location-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.location-card:hover::before {
  opacity: 1;
}

.location-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.location-card.is-selected {
  border-color: #FFD700;
  box-shadow: 0 8px 32px rgba(255, 215, 0, 0.4);
  transform: translateY(-4px) scale(1.02);
}

.location-lobby {
  background: linear-gradient(135deg, #A0AEC0 0%, #718096 100%);
  color: white;
}

.location-forest {
  background: linear-gradient(135deg, #52C41A 0%, #237804 100%);
  color: white;
}

.location-field {
  background: linear-gradient(135deg, #FADB14 0%, #D48806 100%);
  color: #333;
}

.location-river {
  background: linear-gradient(135deg, #1890FF 0%, #0050B3 100%);
  color: white;
}

.location-sky {
  background: linear-gradient(135deg, #722ED1 0%, #391085 100%);
  color: white;
}

.location-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.location-emoji {
  font-size: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.location-name {
  font-size: 24px;
  font-weight: 900;
  margin: 0;
  flex: 1;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.player-count {
  background: rgba(255, 255, 255, 0.3);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  backdrop-filter: blur(10px);
}

.largest-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #333;
  padding: 6px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  animation: pulse 2s ease-in-out infinite;
}

.badge-icon {
  font-size: 16px;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.player-avatar {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  border: 2px solid transparent;
}

.player-avatar:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.player-avatar.is-me {
  background: rgba(255, 255, 255, 0.4);
  border-color: #FFD700;
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.6);
}

.avatar-emoji {
  font-size: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.avatar-name {
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  word-break: break-word;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  opacity: 0.6;
}

.empty-icon {
  font-size: 48px;
}

.empty-text {
  font-size: 14px;
  font-weight: 600;
}

.my-location-badge {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(255, 255, 255, 0.3);
  padding: 6px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 800;
  backdrop-filter: blur(10px);
}

.pulse-dot {
  width: 10px;
  height: 10px;
  background: #52C41A;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
  box-shadow: 0 0 8px #52C41A;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.95);
  }
}

@media (max-width: 768px) {
  .board-grid {
    grid-template-columns: 1fr;
  }
  
  .players-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  }
}
</style>
