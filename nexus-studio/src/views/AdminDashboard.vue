<template>
  <div class="min-h-screen p-8">
    <div class="max-w-6xl mx-auto">
      <header class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-black text-slate-800">Admin Dashboard</h1>
        <button @click="$router.push('/')" class="text-slate-500 hover:text-slate-800">Exit</button>
      </header>

      <!-- Auth -->
      <div v-if="!isAuthenticated" class="max-w-md mx-auto glass-panel p-8">
        <h2 class="text-xl font-bold mb-4 text-slate-800">Admin Login</h2>
        <input 
          v-model="password" 
          type="password" 
          placeholder="Enter Password" 
          class="w-full p-3 bg-slate-50 rounded-xl mb-4 text-slate-800 border border-slate-200 focus:border-violet-500 outline-none"
          @keyup.enter="login"
        >
        <button @click="login" class="w-full btn-primary">Login</button>
      </div>

      <!-- Dashboard -->
      <div v-else>
        <!-- Create Room -->
        <div class="glass-panel p-6 mb-8">
          <h2 class="text-xl font-bold mb-4 text-slate-800">Create Party Room</h2>
          <div class="flex gap-4">
            <input 
              v-model="newRoomName" 
              type="text" 
              placeholder="Room Name (e.g. Room 101)" 
              class="flex-1 p-3 bg-slate-50 rounded-xl text-slate-800 border border-slate-200 focus:border-violet-500 outline-none"
            >
            <button @click="createRoom" class="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg hover:shadow-emerald-500/30 transition-all">Create</button>
          </div>
        </div>

        <!-- Room List -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="room in rooms" :key="room.id" class="glass-panel p-6 relative group">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-xl font-bold text-slate-800">{{ room.name }}</h3>
                <p class="text-slate-400 text-sm font-mono">ID: {{ room.id }}</p>
              </div>
              <button @click="deleteRoom(room.id)" class="text-rose-400 hover:text-rose-600 text-sm font-bold">Delete</button>
            </div>
            
            <div class="bg-white p-4 rounded-xl flex justify-center mb-4 shadow-inner border border-slate-100">
              <QrcodeVue :value="getRoomUrl(room.id)" :size="150" level="H" />
            </div>
            
            <div class="text-center">
              <a :href="getRoomUrl(room.id)" target="_blank" class="text-violet-500 hover:underline text-sm break-all font-medium">
                {{ getRoomUrl(room.id) }}
              </a>
              <div class="mt-3 text-slate-500 text-sm bg-slate-100 py-2 rounded-lg">
                Players: <span class="text-slate-800 font-bold">{{ room.playerCount }}</span> | Phase: <span class="text-slate-800 font-bold">{{ room.phase }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import QrcodeVue from 'qrcode.vue';

const isAuthenticated = ref(false);
const password = ref('');
const rooms = ref([]);
const newRoomName = ref('');

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function login() {
  if (password.value === 'admin123') {
    isAuthenticated.value = true;
    fetchRooms();
  } else {
    alert('Invalid password');
  }
}

async function fetchRooms() {
  try {
    const res = await fetch(`${API_URL}/api/admin/rooms`);
    rooms.value = await res.json();
  } catch (e) {
    console.error(e);
  }
}

async function createRoom() {
  if (!newRoomName.value) return;
  try {
    await fetch(`${API_URL}/api/admin/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newRoomName.value, password: 'admin123' })
    });
    newRoomName.value = '';
    fetchRooms();
  } catch (e) {
    console.error(e);
  }
}

async function deleteRoom(id) {
  if (!confirm('Delete this room?')) return;
  try {
    await fetch(`${API_URL}/api/admin/rooms/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'admin123' })
    });
    fetchRooms();
  } catch (e) {
    console.error(e);
  }
}

function getRoomUrl(id) {
  return `${window.location.origin}/room/${id}`;
}

// Auto refresh
setInterval(() => {
  if (isAuthenticated.value) fetchRooms();
}, 5000);
</script>
