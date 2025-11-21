<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full">
    <div 
      v-for="loc in locations" 
      :key="loc"
      class="relative rounded-xl md:rounded-2xl p-4 md:p-6 transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-95 shadow-xl overflow-hidden group border-2 min-h-[140px] md:min-h-[180px]"
      :class="[
        getLocationColor(loc),
        selectedLocation === loc ? 'border-[#4426FF] shadow-2xl scale-[1.02] neon-glow' : 'border-transparent hover:border-[#5E6BFF]/50'
      ]"
      @click="selectLocation(loc)"
    >
      <!-- Background Overlay -->
      <div class="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors"></div>

      <h3 class="text-2xl md:text-3xl font-black text-white mb-3 md:mb-4 drop-shadow-lg relative z-10">{{ uiStore.t(`locations.${loc}`) }}</h3>
      
      <!-- Players in this location -->
      <div class="flex flex-wrap gap-2 relative z-10">
        <div 
          v-for="p in getPlayersInLocation(loc)" 
          :key="p.id"
          class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#181626] border-2 border-[#5E6BFF] flex items-center justify-center text-xl md:text-2xl shadow-lg"
          :title="p.nickname"
        >
          {{ getPlayerIcon(p) }}
        </div>
      </div>

      <!-- Current Player Indicator -->
      <div v-if="myLocation === loc" class="absolute top-3 right-3 z-10">
        <span class="w-3 h-3 md:w-4 md:h-4 bg-[#3BFF9C] rounded-full inline-block animate-pulse shadow-lg neon-glow"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useRoomStore } from '@/stores/roomStore';
import { useUiStore } from '@/stores/uiStore';

const props = defineProps({
  selectedLocation: String
});

const emit = defineEmits(['update:selectedLocation']);

const gameStore = useGameStore();
const playerStore = usePlayerStore();
const roomStore = useRoomStore();
const uiStore = useUiStore();

const locations = ['Forest', 'Field', 'River', 'Sky'];

const myLocation = computed(() => playerStore.location);

function getLocationColor(loc) {
  switch(loc) {
    case 'Forest': return 'bg-gradient-to-br from-green-700 to-green-900';
    case 'Field': return 'bg-gradient-to-br from-amber-600 to-amber-800';
    case 'River': return 'bg-gradient-to-br from-blue-700 to-blue-900';
    case 'Sky': return 'bg-gradient-to-br from-indigo-700 to-indigo-900';
    default: return 'bg-gray-700';
  }
}

function getPlayersInLocation(loc) {
  return roomStore.players.filter(p => p.location === loc && p.alive);
}

function getPlayerIcon(p) {
  if (p.id === playerStore.playerId) return getRoleIcon(playerStore.role);
  return '👤';
}

function getRoleIcon(role) {
  const icons = {
    lion: '🦁', crocodile: '🐊', eagle: '🦅', hyena: '🐕',
    chameleon: '🦎', 'cleaner-bird': '🐦', mouse: '🐭', crow: '🐦‍⬛',
    otter: '🦦', deer: '🦌', rabbit: '🐇', duck: '🦆', snake: '🐍'
  };
  return icons[role] || '?';
}

function selectLocation(loc) {
  emit('update:selectedLocation', loc);
}
</script>
