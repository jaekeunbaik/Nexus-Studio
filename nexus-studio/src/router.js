import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import GameList from './views/GameList.vue';
import RoomLobby from './views/RoomLobby.vue';
import RoomGame from './views/RoomGame.vue';
import GameResult from './views/GameResult.vue';
import AdminDashboard from './views/AdminDashboard.vue';

const routes = [
    { path: '/', component: Home },
    { path: '/games', component: GameList },
    { path: '/room/:id', component: RoomLobby },
    { path: '/game/:id', component: RoomGame },
    { path: '/result/:id', component: GameResult },
    { path: '/admin', component: AdminDashboard },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
