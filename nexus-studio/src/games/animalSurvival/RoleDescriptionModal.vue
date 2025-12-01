<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header" :class="roleClass">
        <span class="role-icon">{{ roleIcon }}</span>
        <h2 class="role-title">{{ roleName }}</h2>
      </div>
      
      <div class="modal-body">
        <div class="info-section">
          <h3>📜 역할 설명</h3>
          <p>{{ roleDescription }}</p>
        </div>

        <div class="info-section">
          <h3>🎯 승리 조건</h3>
          <p>{{ winCondition }}</p>
        </div>

        <div class="info-section">
          <h3>✨ 특수 능력</h3>
          <p>{{ abilityDescription }}</p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="confirm-btn" @click="close">확인했습니다</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  role: String
});

const emit = defineEmits(['close']);

const roleData = {
  shepherd_boy: {
    name: '양치기 소년',
    icon: '🧑‍🌾',
    class: 'role-human',
    description: '당신은 양들을 지키는 양치기 소년입니다. 늑대의 존재를 감지할 수 있습니다.',
    winCondition: '모든 늑대를 찾아내어 제거하고 양들을 지키세요.',
    ability: '매일 밤, 현재 위치에 늑대가 있는지 감지할 수 있습니다.'
  },
  sheep: {
    name: '양',
    icon: '🐑',
    class: 'role-sheep',
    description: '당신은 평화로운 양입니다. 늑대에게 잡아먹히지 않도록 조심하세요.',
    winCondition: '모든 늑대가 제거될 때까지 생존하세요.',
    ability: '가장 많은 양이 모인 장소에서 투표권을 행사하여 의심스러운 동물을 처형할 수 있습니다.'
  },
  wolf: {
    name: '늑대',
    icon: '🐺',
    class: 'role-wolf',
    description: '당신은 굶주린 늑대입니다. 양의 탈을 쓰고 다른 동물들을 잡아먹으세요.',
    winCondition: '모든 양을 잡아먹거나, 양보다 늑대의 수가 많아지면 승리합니다.',
    ability: '매일 밤, 같은 지역에 있는 동물 하나를 선택하여 잡아먹을 수 있습니다.'
  },
  turtle: {
    name: '거북이',
    icon: '🐢',
    class: 'role-turtle',
    description: '당신은 단단한 등껍질을 가진 거북이입니다. 다른 동물들을 보호할 수 있습니다.',
    winCondition: '자신이나 다른 동물들이 생존하여 승리하세요.',
    ability: '매일 밤, 자신이나 다른 동물을 선택하여 늑대의 공격으로부터 보호할 수 있습니다. (자신은 연속 보호 불가)'
  },
  hedgehog: {
    name: '고슴도치',
    icon: '🦔',
    class: 'role-hedgehog',
    description: '당신은 가시가 돋친 고슴도치입니다. 당신을 공격하는 자는 큰 코 다칠 것입니다.',
    winCondition: '자신이나 다른 동물들이 생존하여 승리하세요.',
    ability: '늑대나 벌꿀오소리에게 공격받으면, 공격한 대상과 함께 사망합니다 (러브샷).'
  },
  owl: {
    name: '부엉이',
    icon: '🦉',
    class: 'role-owl',
    description: '당신은 밤의 감시자 부엉이입니다. 다른 동물의 정체를 꿰뚫어 볼 수 있습니다.',
    winCondition: '자신이나 다른 동물들이 생존하여 승리하세요.',
    ability: '매일 밤, 같은 지역에 있는 동물 하나를 선택하여 그 정체를 확인할 수 있습니다.'
  },
  bee: {
    name: '꿀벌',
    icon: '🐝',
    class: 'role-bee',
    description: '당신은 침을 가진 꿀벌입니다. 목숨을 걸고 적을 쏠 수 있습니다.',
    winCondition: '양 팀이 승리하도록 도우세요.',
    ability: '낮 동안, 의심스러운 동물을 쏘고 함께 사망할 수 있습니다.'
  },
  honey_badger: {
    name: '벌꿀오소리',
    icon: '🍯',
    class: 'role-badger',
    description: '당신은 겁 없는 벌꿀오소리입니다. 꿀벌을 찾아다니며, 방해되는 것은 무엇이든 물어뜯습니다.',
    winCondition: '모든 꿀벌을 제거하고 끝까지 생존하세요.',
    ability: '밤과 낮에 한 번씩, 다른 동물을 물어뜯을 수 있습니다. 꿀벌이면 죽이고, 아니면 자신이 추방당합니다.'
  }
};

const currentRole = computed(() => roleData[props.role] || {});
const roleName = computed(() => currentRole.value.name || '알 수 없음');
const roleIcon = computed(() => currentRole.value.icon || '❓');
const roleClass = computed(() => currentRole.value.class || '');
const roleDescription = computed(() => currentRole.value.description || '');
const winCondition = computed(() => currentRole.value.winCondition || '');
const abilityDescription = computed(() => currentRole.value.ability || '');

function close() {
  emit('close');
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  border-radius: 24px;
  width: 90%;
  max-width: 480px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  padding: 32px 24px;
  text-align: center;
  color: white;
  background: #333;
}

.role-human { background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%); }
.role-sheep { background: linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%); }
.role-wolf { background: linear-gradient(135deg, #4A4A4A 0%, #2C2C2C 100%); }
.role-turtle { background: linear-gradient(135deg, #2ECC71 0%, #27AE60 100%); }
.role-hedgehog { background: linear-gradient(135deg, #E67E22 0%, #D35400 100%); }
.role-owl { background: linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%); }
.role-bee { background: linear-gradient(135deg, #F1C40F 0%, #F39C12 100%); color: #333; }
.role-badger { background: linear-gradient(135deg, #8E44AD 0%, #2C3E50 100%); }

.role-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
}

.role-title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.5px;
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-section h3 {
  font-size: 16px;
  font-weight: 800;
  color: #333;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-section p {
  font-size: 15px;
  line-height: 1.6;
  color: #555;
  margin: 0;
  background: #F8F9FA;
  padding: 12px;
  border-radius: 12px;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #EEE;
  display: flex;
  justify-content: center;
}

.confirm-btn {
  background: #333;
  color: white;
  border: none;
  padding: 16px 48px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  background: #000;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
