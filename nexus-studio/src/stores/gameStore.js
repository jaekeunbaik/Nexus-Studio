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
    const gameType = ref('animalSurvival'); // 'animalSurvival' or 'mafiaGame'
    const locationCounts = ref({ Forest: 0, Field: 0, River: 0, Sky: 0 });

    function setLocationMap(map) {
        locationMap.value = map;
    }

    function setGameType(type) {
        gameType.value = type;
    }

    function setLocationCounts(counts) {
        locationCounts.value = counts;
    }

    function addLog(log) {
        logs.value.push(log);
    }

    function clearLogs() {
        logs.value = [];
    }

    function reset() {
        logs.value = [];
        locationMap.value = { Forest: [], Field: [], River: [], Sky: [] };
        locationCounts.value = { Forest: 0, Field: 0, River: 0, Sky: 0 };
    }

    return {
        locationMap,
        logs,
        gameType,
        locationCounts,
        setLocationMap,
        setGameType,
        setLocationCounts,
        addLog,
        clearLogs,
        reset
    };
});
