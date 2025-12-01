import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useRoomStore = defineStore('room', () => {
    const roomId = ref(null);
    const gameType = ref(null);
    const players = ref([]);
    const phase = ref('lobby'); // lobby, moving, judging, result
    const round = ref(1);
    const isHost = ref(false);

    const timer = ref(0);
    let timerInterval = null;

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

    function startTimer(seconds) {
        if (timerInterval) clearInterval(timerInterval);
        timer.value = seconds;
        timerInterval = setInterval(() => {
            if (timer.value > 0) {
                timer.value--;
            } else {
                clearInterval(timerInterval);
            }
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) clearInterval(timerInterval);
        timer.value = 0;
    }

    return {
        roomId,
        gameType,
        players,
        phase,
        round,
        isHost,
        timer,
        setRoom,
        setPhase,
        setPlayers,
        addPlayer,
        removePlayer,
        setRound,
        setIsHost,
        startTimer,
        stopTimer
    };
});
