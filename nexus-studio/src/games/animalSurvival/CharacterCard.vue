<template>
  <div class="character-card" :class="{ 'is-modal': isModal }">
    <div class="card-inner" :style="{ borderColor: roleColor }">
      <!-- Character Icon -->
      <div class="character-icon" :style="{ background: roleGradient }">
        <span class="icon-emoji">{{ roleEmoji }}</span>
      </div>

      <!-- Character Name -->
      <h3 class="character-name" :style="{ color: roleColor }">
        {{ roleNameKo }}
        <span class="character-name-en">{{ roleNameEn }}</span>
      </h3>

      <!-- Win Condition -->
      <div class="info-section win-condition">
        <div class="section-header">
          <span class="icon">🏆</span>
          <span class="label">승리조건</span>
        </div>
        <p class="section-content">{{ winCondition }}</p>
      </div>

      <!-- Ability -->
      <div class="info-section ability">
        <div class="section-header">
          <span class="icon">✨</span>
          <span class="label">보유 능력</span>
        </div>
        <p class="section-content">{{ ability }}</p>
      </div>

      <!-- Activation -->
      <div class="info-section activation">
        <div class="section-header">
          <span class="icon">⚡</span>
          <span class="label">능력 발동</span>
        </div>
        <p class="section-content">{{ activation }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  role: {
    type: String,
    required: true
  },
  isModal: {
    type: Boolean,
    default: false
  }
});

const roleData = {
  shepherd_boy: {
    nameKo: '양치기 소년',
    nameEn: 'SHEPHERD',
    emoji: '🧑‍🌾',
    color: '#8B4513',
    gradient: 'linear-gradient(135deg, #D2691E 0%, #8B4513 100%)',
    winCondition: '양의 승리',
    ability: '같은 지역에 늑대가 있는지 알 수 있다.',
    activation: '밤이 되면 지역 이동 후 운영진에게 자동 전달받음.'
  },
  sheep: {
    nameKo: '양',
    nameEn: 'SHEEP',
    emoji: '🐑',
    color: '#FFB6C1',
    gradient: 'linear-gradient(135deg, #FFF0F5 0%, #FFB6C1 100%)',
    winCondition: '모든 늑대 사망',
    ability: '양이 가장 많은 지역은 투표가 활성화되며 비밀투표를 통해 플레이어 1명을 죽일수있음',
    activation: '밤이 되면 양이 가장 많은 지역의 양들은 운영진에게 죽일 플레이어 지목'
  },
  wolf: {
    nameKo: '늑대',
    nameEn: 'WOLF',
    emoji: '🐺',
    color: '#4A4A4A',
    gradient: 'linear-gradient(135deg, #696969 0%, #2F2F2F 100%)',
    winCondition: '모든 양 사망 또는 양 이외의 모든 동물 사망',
    ability: '같은 지역의 플레이어 1명을 매 라운드마다 죽일수 있다.',
    activation: '밤이 되면 운영진에게 죽일 플레이어 1명 지목'
  },
  turtle: {
    nameKo: '거북이',
    nameEn: 'TURTLE',
    emoji: '🐢',
    color: '#3CB371',
    gradient: 'linear-gradient(135deg, #90EE90 0%, #3CB371 100%)',
    winCondition: '본인 또는 부엉이, 고슴도치, 벌꿀오소리 중 한마리 이상 생존',
    ability: '같은 지역의 플레이어 1명 보호 또는 자신 보호. 단, 자신보호는 연속 불가',
    activation: '밤이 되면 보호하고싶은 플레이어 1명 지목'
  },
  hedgehog: {
    nameKo: '고슴도치',
    nameEn: 'HEDGEHOG',
    emoji: '🦔',
    color: '#CD853F',
    gradient: 'linear-gradient(135deg, #DEB887 0%, #CD853F 100%)',
    winCondition: '본인 또는 거북이, 부엉이, 벌꿀오소리 중 1명 이상 생존',
    ability: '공격을 받으면 공격한 상대와 함께 사망. 단, 양의 투표로 사망시 능력 미발동',
    activation: '-'
  },
  owl: {
    nameKo: '부엉이',
    nameEn: 'OWL',
    emoji: '🦉',
    color: '#8B7355',
    gradient: 'linear-gradient(135deg, #D2B48C 0%, #8B7355 100%)',
    winCondition: '본인 또는 거북이, 고슴도치, 벌꿀오소리 중 1명 이상 생존',
    ability: '같은 지역의 플레이어 1명 정체를 스캔한다.',
    activation: '밤이되면 스캔하고 싶은 플레이어 지목'
  },
  bee: {
    nameKo: '꿀벌',
    nameEn: 'HONEYBEE',
    emoji: '🐝',
    color: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFEB3B 0%, #FFA000 100%)',
    winCondition: '모든 늑대 사망',
    ability: '낮에 플레이어 1명을 죽이고 본인도 사망. 단, 벌꿀오소리 지목시 능력 미발동(본인만 사망)',
    activation: '낮이 되면 운영진을 소환해 "쓩~!" 소리를 내며 벌침을 쏠 사람 지목'
  },
  honey_badger: {
    nameKo: '벌꿀오소리',
    nameEn: 'HONEY BADGER',
    emoji: '🍯',
    color: '#8B4789',
    gradient: 'linear-gradient(135deg, #BA55D3 0%, #8B4789 100%)',
    winCondition: '꿀벌을 모두 죽이고 본인 생존',
    ability: '언제든(낮,밤) 꿀벌을 죽일수 있다. 단, 지목한 사람이 꿀벌이 아닐시 즉시 다른 지역으로 추방',
    activation: '밤/낮 상관없이 운영진에게 능력 발동'
  }
};

const currentRole = computed(() => roleData[props.role] || roleData.sheep);
const roleNameKo = computed(() => currentRole.value.nameKo);
const roleNameEn = computed(() => currentRole.value.nameEn);
const roleEmoji = computed(() => currentRole.value.emoji);
const roleColor = computed(() => currentRole.value.color);
const roleGradient = computed(() => currentRole.value.gradient);
const winCondition = computed(() => currentRole.value.winCondition);
const ability = computed(() => currentRole.value.ability);
const activation = computed(() => currentRole.value.activation);
</script>

<style scoped>
.character-card {
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
}

.character-card.is-modal {
  max-width: 400px;
}

.card-inner {
  background: linear-gradient(135deg, #FFF9E6 0%, #FFFEF7 100%);
  border-radius: 20px;
  border: 4px solid;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card-inner:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

.character-icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 3px solid #fff;
}

.icon-emoji {
  font-size: 56px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.character-name {
  text-align: center;
  font-size: 28px;
  font-weight: 900;
  margin: 0 0 8px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.character-name-en {
  display: block;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 2px;
  opacity: 0.7;
  margin-top: 4px;
}

.info-section {
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.info-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.section-header .icon {
  font-size: 20px;
}

.section-header .label {
  font-size: 14px;
  font-weight: 800;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.section-content {
  font-size: 14px;
  line-height: 1.6;
  color: #555;
  margin: 0;
  font-weight: 500;
}

.win-condition {
  border-left: 4px solid #FFD700;
}

.ability {
  border-left: 4px solid #FF69B4;
}

.activation {
  border-left: 4px solid #87CEEB;
}
</style>
