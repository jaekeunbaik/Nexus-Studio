<template>
  <div class="bg-[#181626] rounded-xl md:rounded-2xl p-4 md:p-6 border-2 border-[#4426FF]/30 flex flex-col gap-4 md:gap-6 shadow-lg">
    <!-- Info Panel -->
    <div class="bg-[#1E1C2F] rounded-xl p-4 md:p-5 border border-[#5E6BFF]/20">
      <div class="flex justify-between items-center mb-4">
        <div>
          <span class="text-[#C4C3D9] text-xs font-bold uppercase tracking-wider">{{ uiStore.t('round') }}</span>
          <div class="text-3xl md:text-4xl font-black text-white">{{ round }} <span class="text-base md:text-lg text-[#C4C3D9] font-medium">/ 4</span></div>
        </div>
        <div class="text-right">
          <span class="text-[#C4C3D9] text-xs font-bold uppercase tracking-wider">{{ uiStore.t('myRole') }}</span>
          <div class="text-xl md:text-2xl font-bold flex items-center gap-2 justify-end text-white">
            {{ uiStore.t(`roles.${myRole}`) }} <span class="text-2xl md:text-3xl">{{ getRoleIcon(myRole) }}</span>
          </div>
        </div>
      </div>

      <!-- Status Text -->
      <div class="text-center p-3 bg-[#0F0E18] rounded-lg border border-[#5E6BFF]/30">
        <p v-if="phase === 'moving'" class="text-[#4426FF] font-bold animate-pulse flex items-center justify-center gap-2 text-sm md:text-base">
          <span>⏳</span> {{ uiStore.t('phase.moving') }}...
        </p>
        <p v-else-if="phase === 'judging'" class="text-[#FF5C5C] font-bold flex items-center justify-center gap-2 text-sm md:text-base">
          <span>⚔️</span> {{ uiStore.t('phase.judging') }}...
        </p>
        <p v-else class="text-[#C4C3D9] font-medium text-sm md:text-base">{{ uiStore.t('waitingHost') }}</p>
      </div>
    </div>

    <!-- Actions -->
    <div class="grid grid-cols-2 gap-3 md:gap-4">
      <button 
        @click="$emit('move')" 
        :disabled="!canMove"
        class="py-3 md:py-4 px-3 md:px-4 rounded-xl font-bold transition-all flex flex-col items-center gap-2 border-2 text-sm md:text-base active:scale-95"
        :class="canMove ? 'bg-[#4426FF] hover:bg-[#5E6BFF] text-white border-[#4426FF] shadow-lg hover:shadow-xl hover:-translate-y-1 neon-glow' : 'bg-[#1C1A29] text-[#C4C3D9]/50 cursor-not-allowed border-[#5E6BFF]/20'"
      >
        <span class="text-xl md:text-2xl">🏃</span>
        {{ uiStore.t('moveHere') }}
      </button>
      
      <button 
        @click="toggleInvestigateDropdown"
        :disabled="!canInvestigate"
        class="py-3 md:py-4 px-3 md:px-4 rounded-xl font-bold transition-all flex flex-col items-center gap-2 border-2 text-sm md:text-base active:scale-95 relative"
        :class="canInvestigate ? 'bg-[#1C1A29] hover:bg-[#5E6BFF]/20 text-white border-[#5E6BFF] shadow-lg hover:shadow-xl hover:-translate-y-1' : 'bg-[#1C1A29] text-[#C4C3D9]/50 cursor-not-allowed border-[#5E6BFF]/20'"
      >
        <span class="text-xl md:text-2xl">🔍</span>
        {{ uiStore.t('investigate') }}
      </button>
    </div>

    <!-- Investigation Dropdown -->
    <div v-if="showInvestigateDropdown && canInvestigate" class="bg-[#1E1C2F] rounded-xl p-4 border border-[#5E6BFF]/30 space-y-3">
      <div class="flex justify-between items-center mb-2">
        <h4 class="text-white font-bold text-sm md:text-base">{{ uiStore.t('selectPlayer') || 'Select Player' }}</h4>
        <button @click="showInvestigateDropdown = false" class="text-[#C4C3D9] hover:text-white text-xl">×</button>
      </div>
      <select 
        v-model="selectedInvestigateTarget"
        class="w-full p-3 rounded-lg border-2 border-[#5E6BFF] bg-[#0F0E18] text-white font-medium outline-none transition-all text-sm md:text-base"
      >
        <option value="">-- {{ uiStore.t('choosePlayer') || 'Choose a player' }} --</option>
        <option v-for="player in otherPlayers" :key="player.id" :value="player.id">
          {{ player.nickname }}
        </option>
      </select>
      <button 
        @click="confirmInvestigate"
        :disabled="!selectedInvestigateTarget"
        class="w-full btn-primary py-3 text-sm md:text-base"
        :class="!selectedInvestigateTarget && 'opacity-50 cursor-not-allowed'"
      >
        {{ uiStore.t('confirmInvestigate') || 'Confirm Investigation' }}
      </button>
    </div>

    <!-- Special Actions -->
    <div v-if="myRole === 'chameleon'" class="mt-2">
      <button 
        @click="$emit('disguise')"
        class="w-full py-3 md:py-4 px-4 bg-gradient-to-r from-[#4426FF] to-[#5E6BFF] hover:from-[#5E6BFF] hover:to-[#4426FF] text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 border-2 border-[#4426FF] neon-glow text-sm md:text-base active:scale-95"
      >
        <span>🎭</span> {{ uiStore.t('disguise') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePlayerStore } from '@/stores/playerStore';
import { useRoomStore } from '@/stores/roomStore';
import { useUiStore } from '@/stores/uiStore';
import { useSocket } from '@/composables/useSocket';

const props = defineProps({
  players: Array
});

const emit = defineEmits(['move', 'investigate', 'disguise']);

const playerStore = usePlayerStore();
const roomStore = useRoomStore();
const uiStore = useUiStore();
const { socket } = useSocket();

const round = computed(() => roomStore.round);
const phase = computed(() => roomStore.phase);
const myRole = computed(() => playerStore.role);

const canMove = computed(() => phase.value === 'moving');
const canInvestigate = computed(() => phase.value === 'moving');

const showInvestigateDropdown = ref(false);
const selectedInvestigateTarget = ref('');

const otherPlayers = computed(() => {
  return props.players?.filter(p => p.id !== socket.id && p.alive) || [];
});

function toggleInvestigateDropdown() {
  if (!canInvestigate.value) return;
  showInvestigateDropdown.value = !showInvestigateDropdown.value;
  selectedInvestigateTarget.value = '';
}

function confirmInvestigate() {
  if (selectedInvestigateTarget.value) {
    emit('investigate', selectedInvestigateTarget.value);
    showInvestigateDropdown.value = false;
    selectedInvestigateTarget.value = '';
  }
}

function getRoleIcon(role) {
  const icons = {
    lion: '🦁', crocodile: '🐊', eagle: '🦅', hyena: '🐕',
    chameleon: '🦎', 'cleaner-bird': '🐦', mouse: '🐭', crow: '🐦‍⬛',
    otter: '🦦', deer: '🦌', rabbit: '🐇', duck: '🦆', snake: '🐍'
  };
  return icons[role] || '?';
}
</script>
