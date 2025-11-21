import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useRoomStore = defineStore('room', () => {
    const roomId = ref(null);
    const gameType = ref(null);
    const players = ref([]);
    const phase = ref('lobby'); // lobby, moving, judging, result
    const round = ref(1);
    const isHost = ref(false);

    function setRoom(id, type) {
        roomId.value = id;
        gameType.value = type;
    }

    function setPhase(newPhase) {
        phase.value = newPhase;
    }

    function setPlayers(newPlayers) {
        players.value = newPlayers;
    }

    function addPlayer(player) {
        if (!players.value.find(p => p.id === player.id)) {
            players.value.push(player);
        }
    }

    function removePlayer(playerId) {
        players.value = players.value.filter(p => p.id !== playerId);
    }

    function setRound(r) {
        round.value = r;
    }

    function setIsHost(val) {
        isHost.value = val;
    }

    return {
        roomId,
        gameType,
        players,
        phase,
        round,
        isHost,
        setRoom,
        setPhase,
        setPlayers,
        addPlayer,
        removePlayer,
        setRound,
        setIsHost
    };
});
