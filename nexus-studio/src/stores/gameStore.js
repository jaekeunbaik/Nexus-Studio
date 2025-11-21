import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useGameStore = defineStore('game', () => {
    const locationMap = ref({
        Forest: [],
        Field: [],
        River: [],
        Sky: []
    });
    const logs = ref([]);

    function setLocationMap(map) {
        locationMap.value = map;
    }

    function addLog(log) {
        logs.value.push(log);
    }

    function clearLogs() {
        logs.value = [];
    }

    return {
        locationMap,
        logs,
        setLocationMap,
        addLog,
        clearLogs
    };
});
