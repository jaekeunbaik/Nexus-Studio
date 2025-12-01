<template>
  <div class="mafia-ui">
    <!-- Character Card Display -->
    <div class="my-character" v-if="myRole">
      <CharacterCard :role="myRole" />
      
      <!-- Private Information -->
      <div class="private-info" v-if="hasPrivateInfo">
        <!-- Shepherd Boy - Wolf Detection -->
        <div v-if="myRole === 'shepherd_boy' && wolfDetected" class="info-alert wolf-alert">
          <span class="alert-icon">⚠️</span>
          <span class="alert-text">이 지역에 늑대가 있습니다!</span>
        </div>
        
        <!-- Owl - Scan Results -->
        <div v-if="myRole === 'owl' && scanResults.length > 0" class="info-alert scan-alert">
          <div class="scan-header">
            <span class="alert-icon">🔍</span>
            <span class="alert-text">스캔 결과</span>
          </div>
          <div class="scan-results">
            <div v-for="(result, i) in scanResults" :key="i" class="scan-item">
              <span class="scan-round">라운드 {{ result.round }}:</span>
              <span class="scan-target">{{ result.target }}</span>
              <span class="scan-role">{{ getRoleNameKo(result.role) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Phase Info -->
    <div class="phase-info" :class="phaseClass">
      <div class="phase-icon">{{ phaseIcon }}</div>
      <div class="phase-details">
        <div class="phase-name">{{ phaseName }}</div>
        <div class="round-info">라운드 {{ round }} / 5</div>
      </div>
    </div>

    <!-- Action Panel -->
    <div class="action-panel" v-if="canAct">
      <h3 class="action-title">{{ actionTitle }}</h3>
      
      <!-- Night Actions -->
      <div v-if="phase === 'night'" class="actions">
        <!-- Wolf Kill -->
        <div v-if="myRole === 'wolf'" class="action-group">
          <button @click="showTargetSelector('kill')" class="action-btn wolf-btn">
            <span class="btn-icon">🐺</span>
            <span class="btn-text">공격하기</span>
          </button>
        </div>

        <!-- Turtle Protect -->
        <div v-if="myRole === 'turtle'" class="action-group">
          <button @click="showTargetSelector('protect')" class="action-btn turtle-btn">
            <span class="btn-icon">🛡️</span>
            <span class="btn-text">보호하기</span>
          </button>
        </div>

        <!-- Owl Scan -->
        <div v-if="myRole === 'owl'" class="action-group">
          <button @click="showTargetSelector('scan')" class="action-btn owl-btn">
            <span class="btn-icon">🔍</span>
            <span class="btn-text">스캔하기</span>
          </button>
        </div>

        <!-- Sheep Vote -->
        <div v-if="myRole === 'sheep' && canSheepVote" class="action-group">
          <button @click="showTargetSelector('vote')" class="action-btn sheep-btn">
            <span class="btn-icon">🗳️</span>
            <span class="btn-text">투표하기</span>
          </button>
          <p class="action-hint">양이 가장 많은 지역에서 투표 가능!</p>
        </div>

        <!-- Honey Badger Bite (Night) -->
        <div v-if="myRole === 'honey_badger'" class="action-group">
          <button @click="showTargetSelector('bite')" class="action-btn badger-btn">
            <span class="btn-icon">🍯</span>
            <span class="btn-text">물어뜯기</span>
          </button>
        </div>
      </div>

      <!-- Day Actions -->
      <div v-if="phase === 'day'" class="actions">
        <!-- Bee Sting -->
        <div v-if="myRole === 'bee'" class="action-group">
          <button @click="showTargetSelector('sting')" class="action-btn bee-btn">
            <span class="btn-icon">🐝</span>
            <span class="btn-text">벌침 쏘기</span>
          </button>
          <p class="action-warning">⚠️ 사용시 본인도 사망합니다!</p>
        </div>

        <!-- Honey Badger Bite (Day) -->
        <div v-if="myRole === 'honey_badger'" class="action-group">
          <button @click="showTargetSelector('bite')" class="action-btn badger-btn">
            <span class="btn-icon">🍯</span>
            <span class="btn-text">물어뜯기</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Target Selector Modal -->
    <div v-if="showSelector" class="modal-overlay" @click="closeSelector">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>대상 선택</h3>
          <button @click="closeSelector" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="target-list">
            <button
              v-for="player in availableTargets"
              :key="player.id"
              @click="selectTarget(player.id)"
              class="target-btn"
            >
              <span class="target-name">{{ player.nickname }}</span>
              <span class="target-location">📍 {{ getLocationNameKo(player.location) }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Submitted Indicator -->
    <div v-if="actionSubmitted" class="submitted-indicator">
      <span class="check-icon">✅</span>
      <span class="check-text">행동 제출 완료!</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePlayerStore } from '@/stores/playerStore';
import { useRoomStore } from '@/stores/roomStore';
import { useGameStore } from '@/stores/gameStore';
import { useSocket } from '@/composables/useSocket';
import CharacterCard from './CharacterCard.vue';

const emit = defineEmits(['submitAction']);

const playerStore = usePlayerStore();
const roomStore = useRoomStore();
const gameStore = useGameStore();
const { socket } = useSocket();

const showSelector = ref(false);
const currentAction = ref(null);

const myRole = computed(() => playerStore.role);
const phase = computed(() => roomStore.phase);
const round = computed(() => roomStore.round);
const scanResults = computed(() => playerStore.scanResults);
const wolfDetected = computed(() => playerStore.wolfDetected);
const actionSubmitted = computed(() => playerStore.actionSubmitted);
const locationCounts = computed(() => gameStore.locationCounts);

const hasPrivateInfo = computed(() => {
  return (myRole.value === 'shepherd_boy' && wolfDetected.value) ||
         (myRole.value === 'owl' && scanResults.value.length > 0);
});

const phaseClass = computed(() => phase.value === 'night' ? 'phase-night' : 'phase-day');
const phaseIcon = computed(() => phase.value === 'night' ? '🌙' : '☀️');
const phaseName = computed(() => phase.value === 'night' ? '밤' : '낮');

const canAct = computed(() => {
  if (!playerStore.alive || actionSubmitted.value) return false;
  
  const nightRoles = ['wolf', 'turtle', 'owl', 'sheep', 'honey_badger'];
  const dayRoles = ['bee', 'honey_badger'];
  
  if (phase.value === 'night') return nightRoles.includes(myRole.value);
  if (phase.value === 'day') return dayRoles.includes(myRole.value);
  
  return false;
});

const canSheepVote = computed(() => {
  if (myRole.value !== 'sheep') return false;
  const myLocation = playerStore.location;
  const maxCount = Math.max(...Object.values(locationCounts.value));
  return locationCounts.value[myLocation] === maxCount;
});

const actionTitle = computed(() => {
  if (phase.value === 'night') return '🌙 밤 행동';
  return '☀️ 낮 행동';
});

const availableTargets = computed(() => {
  const players = roomStore.players.filter(p => p.alive && p.id !== socket.id);
  
  // For actions requiring same location
  if (['kill', 'protect', 'scan'].includes(currentAction.value)) {
    return players.filter(p => p.location === playerStore.location);
  }
  
  return players;
});

function showTargetSelector(action) {
  currentAction.value = action;
  showSelector.value = true;
}

function closeSelector() {
  showSelector.value = false;
  currentAction.value = null;
}

function selectTarget(targetId) {
  const actionType = currentAction.value;
  const isNightAction = phase.value === 'night';
  
  if (isNightAction) {
    socket.emit('mafiaSubmitNightAction', {
      roomId: roomStore.roomId,
      actionType,
      targetId
    });
  } else {
    socket.emit('mafiaSubmitDayAction', {
      roomId: roomStore.roomId,
      actionType,
      targetId
    });
  }
  
  playerStore.setActionSubmitted(true);
  closeSelector();
}

function getRoleNameKo(role) {
  const names = {
    shepherd_boy: '양치기 소년',
    sheep: '양',
    wolf: '늑대',
    turtle: '거북이',
    hedgehog: '고슴도치',
    owl: '부엉이',
    bee: '꿀벌',
    honey_badger: '벌꿀오소리'
  };
  return names[role] || role;
}

function getLocationNameKo(location) {
  const names = {
    Forest: '숲',
    Field: '들판',
    River: '강',
    Sky: '하늘'
  };
  return names[location] || location;
}
</script>

<style scoped>
.mafia-ui {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.my-character {
  background: linear-gradient(135deg, #FFF9E6 0%, #FFFEF7 100%);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.private-info {
  margin-top: 16px;
}

.info-alert {
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: pulse 2s ease-in-out infinite;
}

.wolf-alert {
  background: linear-gradient(135deg, #FFE5E5 0%, #FFD0D0 100%);
  border: 2px solid #FF6B6B;
}

.scan-alert {
  background: linear-gradient(135deg, #E5F3FF 0%, #D0E8FF 100%);
  border: 2px solid #4A90E2;
  flex-direction: column;
  align-items: flex-start;
}

.scan-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.scan-results {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scan-item {
  background: white;
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.scan-round {
  font-weight: 600;
  color: #666;
}

.scan-target {
  font-weight: 700;
  color: #333;
}

.scan-role {
  margin-left: auto;
  font-weight: 800;
  color: #4A90E2;
}

.alert-icon {
  font-size: 24px;
}

.alert-text {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.phase-info {
  background: white;
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 3px solid;
}

.phase-night {
  border-color: #4A5568;
  background: linear-gradient(135deg, #2D3748 0%, #1A202C 100%);
}

.phase-night .phase-name,
.phase-night .round-info {
  color: white;
}

.phase-day {
  border-color: #FFD700;
  background: linear-gradient(135deg, #FFF9E6 0%, #FFEB3B 100%);
}

.phase-icon {
  font-size: 48px;
}

.phase-details {
  flex: 1;
}

.phase-name {
  font-size: 24px;
  font-weight: 900;
  margin-bottom: 4px;
}

.round-info {
  font-size: 14px;
  font-weight: 600;
  opacity: 0.8;
}

.action-panel {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.action-title {
  font-size: 20px;
  font-weight: 800;
  margin: 0 0 16px 0;
  color: #333;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  padding: 16px 20px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.action-btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 24px;
}

.wolf-btn {
  background: linear-gradient(135deg, #696969 0%, #2F2F2F 100%);
  color: white;
}

.turtle-btn {
  background: linear-gradient(135deg, #90EE90 0%, #3CB371 100%);
  color: white;
}

.owl-btn {
  background: linear-gradient(135deg, #D2B48C 0%, #8B7355 100%);
  color: white;
}

.sheep-btn {
  background: linear-gradient(135deg, #FFF0F5 0%, #FFB6C1 100%);
  color: #333;
}

.bee-btn {
  background: linear-gradient(135deg, #FFEB3B 0%, #FFA000 100%);
  color: #333;
}

.badger-btn {
  background: linear-gradient(135deg, #BA55D3 0%, #8B4789 100%);
  color: white;
}

.action-hint {
  font-size: 12px;
  color: #666;
  margin: 0;
  text-align: center;
  font-weight: 600;
}

.action-warning {
  font-size: 12px;
  color: #FF6B6B;
  margin: 0;
  text-align: center;
  font-weight: 700;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 800;
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: #999;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
}

.close-btn:hover {
  color: #333;
}

.target-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.target-btn {
  background: linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%);
  border: 2px solid #DEE2E6;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}

.target-btn:hover {
  background: linear-gradient(135deg, #E9ECEF 0%, #DEE2E6 100%);
  border-color: #4A90E2;
  transform: translateX(4px);
}

.target-name {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.target-location {
  font-size: 14px;
  color: #666;
}

.submitted-indicator {
  background: linear-gradient(135deg, #D4EDDA 0%, #C3E6CB 100%);
  border: 2px solid #28A745;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  animation: bounce 0.5s ease;
}

.check-icon {
  font-size: 24px;
}

.check-text {
  font-size: 16px;
  font-weight: 700;
  color: #155724;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
</style>
