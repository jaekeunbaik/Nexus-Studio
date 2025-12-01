import { defineStore } from 'pinia';
import { ref } from 'vue';

export const usePlayerStore = defineStore('player', () => {
    const playerId = ref(null);
    const nickname = ref('');
    const role = ref(null); // animal type
    const alive = ref(true);
    const hunger = ref(0);
    const location = ref(null); // Forest, Field, River, Sky

    // Mafia game specific
    const scanResults = ref([]); // For owl
    const wolfDetected = ref(false); // For shepherd boy
    const isProtected = ref(false); // For turtle protection
    const actionSubmitted = ref(false); // Track if action submitted this phase

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

    function setScanResults(results) {
        scanResults.value = results;
    }

    function setWolfDetected(detected) {
        wolfDetected.value = detected;
    }

    function setProtected(protectedStatus) {
        isProtected.value = protectedStatus;
    }

    function setActionSubmitted(submitted) {
        actionSubmitted.value = submitted;
    }

    function reset() {
        role.value = null;
        alive.value = true;
        hunger.value = 0;
        location.value = null;
        scanResults.value = [];
        wolfDetected.value = false;
        isProtected.value = false;
        actionSubmitted.value = false;
    }

    return {
        playerId,
        nickname,
        role,
        alive,
        hunger,
        location,
        scanResults,
        wolfDetected,
        isProtected,
        actionSubmitted,
        setPlayerInfo,
        setRole,
        setAlive,
        setHunger,
        setLocation,
        setScanResults,
        setWolfDetected,
        setProtected,
        setActionSubmitted,
        reset
    };
});
