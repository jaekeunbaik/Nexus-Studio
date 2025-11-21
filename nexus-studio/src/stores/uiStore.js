import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useUiStore = defineStore('ui', () => {
    const language = ref('ko'); // Default to Korean as requested

    const translations = {
        en: {
            startPlaying: "START PLAYING",
            subtitle: "The Next Generation Multi-Game Platform",
            gameList: "Available Games",
            animalSurvivalDesc: "Survive in the wild! Use your role's unique abilities, manage hunger, and outsmart predators.",
            comingSoon: "More Games Coming Soon",
            room: "Room",
            roomLobby: "Room Lobby",
            enterNickname: "Enter Nickname",
            nicknameDesc: "What should we call you?",
            nicknamePlaceholder: "Nickname (Max 10 chars)",
            joinGame: "Join Game",
            players: "Players",
            startGame: "Start Game",
            waitingHost: "Waiting for host to start...",
            round: "Round",
            myRole: "My Role",
            moveHere: "Move Here",
            investigate: "Investigate",
            disguise: "Disguise",
            gameLogs: "Game Logs",
            gameOver: "Game Over",
            winners: "Winners",
            noWinners: "No winners...",
            backToGames: "Back to Games",
            playAgain: "Play Again",
            roles: {
                lion: "Lion", crocodile: "Crocodile", eagle: "Eagle", hyena: "Hyena",
                chameleon: "Chameleon", 'cleaner-bird': "Cleaner Bird", mouse: "Mouse", crow: "Crow",
                otter: "Otter", deer: "Deer", rabbit: "Rabbit", duck: "Duck", snake: "Snake"
            },
            locations: {
                Forest: "Forest", Field: "Field", River: "River", Sky: "Sky"
            },
            phase: {
                lobby: "Lobby", moving: "Moving", judging: "Judging", result: "Result"
            },
            selectPlayer: "Select Player",
            choosePlayer: "Choose a player",
            confirmInvestigate: "Confirm Investigation"
        },
        ko: {
            startPlaying: "게임 시작하기",
            subtitle: "차세대 멀티 게임 플랫폼",
            gameList: "게임 목록",
            animalSurvivalDesc: "야생에서 살아남으세요! 고유 능력을 사용하고, 배고픔을 관리하며, 포식자를 피하세요.",
            comingSoon: "새로운 게임 준비 중",
            room: "방",
            roomLobby: "대기실",
            enterNickname: "닉네임을 입력하세요",
            nicknameDesc: "게임에서 사용할 이름을 알려주세요.",
            nicknamePlaceholder: "닉네임 (최대 10자)",
            joinGame: "게임 입장",
            players: "플레이어",
            startGame: "게임 시작",
            waitingHost: "방장이 시작하기를 기다리는 중...",
            round: "라운드",
            myRole: "내 역할",
            moveHere: "여기로 이동",
            investigate: "조사하기",
            disguise: "위장하기",
            gameLogs: "게임 로그",
            gameOver: "게임 종료",
            winners: "승리자",
            noWinners: "승리자 없음...",
            backToGames: "게임 목록으로",
            playAgain: "다시 하기",
            roles: {
                lion: "사자", crocodile: "악어", eagle: "독수리", hyena: "하이에나",
                chameleon: "카멜레온", 'cleaner-bird': "악어새", mouse: "쥐", crow: "까마귀",
                otter: "수달", deer: "사슴", rabbit: "토끼", duck: "청둥오리", snake: "뱀"
            },
            locations: {
                Forest: "숲", Field: "들판", River: "강", Sky: "하늘"
            },
            phase: {
                lobby: "대기중", moving: "이동중", judging: "판정중", result: "결과"
            },
            selectPlayer: "플레이어 선택",
            choosePlayer: "플레이어를 선택하세요",
            confirmInvestigate: "조사 확정"
        }
    };

    const t = computed(() => (key) => {
        const keys = key.split('.');
        let value = translations[language.value];
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                return key; // Fallback to key if not found
            }
        }
        return value;
    });

    function setLanguage(lang) {
        language.value = lang;
    }

    function toggleLanguage() {
        language.value = language.value === 'en' ? 'ko' : 'en';
    }

    return {
        language,
        t,
        setLanguage,
        toggleLanguage
    };
});
