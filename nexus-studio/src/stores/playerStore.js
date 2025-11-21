import { defineStore } from 'pinia';
import { ref } from 'vue';

export const usePlayerStore = defineStore('player', () => {
    const playerId = ref(null);
    const nickname = ref('');
    const role = ref(null); // animal type
    const alive = ref(true);
    const hunger = ref(0);
    const location = ref(null); // Forest, Field, River, Sky

    function setPlayerInfo(id, name) {
        playerId.value = id;
        nickname.value = name;
    }

    function setRole(newRole) {
        role.value = newRole;
    }

    function setAlive(status) {
        alive.value = status;
    }

    function setHunger(val) {
        hunger.value = val;
    }

    function setLocation(loc) {
        location.value = loc;
    }

    function reset() {
        role.value = null;
        alive.value = true;
        hunger.value = 0;
        location.value = null;
    }

    return {
        playerId,
        nickname,
        role,
        alive,
        hunger,
        location,
        setPlayerInfo,
        setRole,
        setAlive,
        setHunger,
        setLocation,
        reset
    };
});
