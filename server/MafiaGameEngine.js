/**
 * Mafia-Style Animal Game Engine (양치기와 늑대)
 * Server-side game logic for social deduction game
 */

export const ROLES = {
    SHEPHERD_BOY: 'shepherd_boy',
    SHEEP: 'sheep',
    WOLF: 'wolf',
    TURTLE: 'turtle',
    HEDGEHOG: 'hedgehog',
    OWL: 'owl',
    BEE: 'bee',
    HONEY_BADGER: 'honey_badger'
};

export const LOCATIONS = ['Lobby', 'Forest', 'Field', 'River', 'Sky'];

export const PHASES = {
    NIGHT: 'night',
    DAY: 'day'
};

export class MafiaGameEngine {
    constructor() {
        this.players = []; // { id, nickname, role, alive, location, protected, lastSelfProtect }
        this.round = 1;
        this.maxRounds = 5;
        this.phase = PHASES.DAY; // Start with Day
        this.logs = [];
        this.deaths = [];
        this.nightActions = {}; // { playerId: { type, target } }
        this.dayActions = {}; // { playerId: { type, target } }
        this.scanResults = {}; // { owlId: [{ target, role }] }
        this.wolfDetections = {}; // { shepherdId: boolean }
        this.scheduledMoves = {}; // { playerId: location }
    }

    /**
     * Initialize game with players and assign roles
     */
    initGame(players) {
        // Shuffle roles
        const roles = Object.values(ROLES);
        const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);

        this.players = players.map((p, index) => ({
            id: p.id,
            nickname: p.nickname,
            role: shuffledRoles[index % shuffledRoles.length],
            alive: true,
            location: 'Lobby',
            protected: false,
            lastSelfProtect: 0
        }));
        this.scheduledMoves = {}; // Reset moves

        return {
            phase: this.phase,
            round: this.round
        };
    }

    /**
     * Get game state
     */
    getGameState() {
        return {
            round: this.round,
            phase: this.phase,
            players: this.getPublicPlayerData(),
            locationCounts: this.getLocationCounts()
        };
    }
}
