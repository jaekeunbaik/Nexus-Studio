<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#FFF5F7] via-[#E8F4FF] to-[#F0FFF4]">
    
    <!-- Animated Background Glow -->
    <div class="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#FFB6D9] opacity-40 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#A8E6FF] opacity-35 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C4F1BE] opacity-30 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
    
    <!-- Hero Section -->
    <div class="text-center z-10 max-w-4xl mx-auto flex flex-col items-center justify-center">
      <h1 class="text-7xl md:text-9xl font-black bg-gradient-to-r from-[#FF6B9D] via-[#4FACFE] to-[#00F2FE] bg-clip-text text-transparent mb-6 tracking-tight" style="text-shadow: 0 4px 20px rgba(255, 107, 157, 0.3)">
        Nexus Studio
      </h1>
      <div class="h-2 w-48 bg-gradient-to-r from-[#FF6B9D] via-[#4FACFE] to-[#00F2FE] mx-auto mb-8 rounded-full shadow-lg"></div>
      <p class="text-xl md:text-2xl text-[#5A5A7A] mb-12 font-semibold tracking-wide">
        차세대 멀티 게임 플랫폼
      </p>
      
      <button 
        @click="$router.push('/games')"
        class="bg-gradient-to-r from-[#FF6B9D] via-[#4FACFE] to-[#00F2FE] text-white text-lg px-16 py-5 rounded-full font-bold shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 animate-gradient bg-[length:200%_auto]"
      >
        게임 시작하기
      </button>
    </div>

    <!-- Decorative Elements -->
    <div class="absolute top-10 left-10 w-20 h-20 bg-[#FFB6D9] opacity-20 rounded-full blur-xl"></div>
    <div class="absolute bottom-10 right-10 w-32 h-32 bg-[#A8E6FF] opacity-20 rounded-full blur-xl"></div>
    <div class="absolute top-1/3 right-20 w-16 h-16 bg-[#C4F1BE] opacity-25 rounded-full blur-lg"></div>
  </div>
</template>

<script setup>
// No imports needed for now
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
