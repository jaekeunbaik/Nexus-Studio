<template>
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all scale-100">
      <h2 class="text-2xl font-bold text-gray-800 mb-2 text-center">{{ uiStore.t('enterNickname') }}</h2>
      <p class="text-gray-500 text-center mb-6">{{ uiStore.t('nicknameDesc') }}</p>
      
      <input 
        v-model="nickname" 
        type="text" 
        :placeholder="uiStore.t('nicknamePlaceholder')"
        class="w-full p-4 bg-gray-100 rounded-xl border-2 border-transparent focus:border-purple-500 focus:bg-white transition-all text-gray-800 text-lg mb-4 outline-none"
        @keyup.enter="submit"
        maxlength="10"
      />
      
      <button 
        @click="submit"
        :disabled="!isValid"
        class="w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg"
        :class="isValid ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-purple-500/30 hover:scale-[1.02]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'"
      >
        {{ uiStore.t('joinGame') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUiStore } from '@/stores/uiStore';

const emit = defineEmits(['submit']);
const uiStore = useUiStore();

const nickname = ref('');

const isValid = computed(() => nickname.value.trim().length > 0);

function submit() {
  if (isValid.value) {
    emit('submit', nickname.value.trim());
  }
}
</script>
