/**
 * WereForest Game Engine
 * Server-side game logic for social deduction game
 */

export const ROLES = {
    SHEPHERD_BOY: 'shepherd_boy', // 양치기 소년
    SHEEP: 'sheep',               // 양
    WOLF: 'wolf',                 // 늑대
    TURTLE: 'turtle',             // 거북이
    HEDGEHOG: 'hedgehog',         // 고슴도치
    OWL: 'owl',                   // 부엉이
    BEE: 'bee',                   // 꿀벌
    HONEY_BADGER: 'honey_badger'  // 벌꿀오소리
};

export const LOCATIONS = ['Sky', 'River', 'Mountain', 'DeathCamp'];

export const PHASES = {
    NIGHT: 'night',
    DAY: 'day'
};

export class MafiaGameEngine {
    constructor() {
        this.players = []; // { id, nickname, role, alive, location, protected, lastSelfProtect, history: [] }
        this.round = 1;
        this.maxRounds = 5;
        this.phase = PHASES.DAY; // Start with Day (Discussion)
        this.logs = [];
        this.deaths = [];

        // Action storage
        this.nightActions = {}; // { playerId: { type, targetId } }
        this.dayActions = {};   // { playerId: { type, targetId } }
        this.moveRequests = {}; // { playerId: location }

        // Game State
        this.scanResults = {}; // { owlId: [{ targetId, role }] }
        this.wolfDetections = {}; // { shepherdId: boolean }
        this.banishedPlayers = new Set(); // Players banished by Honey Badger
    }

    /**
     * Initialize game with players and assign roles
     */
    initGame(players) {
        // Shuffle roles
        const roleList = this.assignRoles(players.length);
        const shuffledRoles = [...roleList].sort(() => Math.random() - 0.5);

        this.players = players.map((p, index) => ({
            id: p.id,
            nickname: p.nickname,
            role: shuffledRoles[index],
            alive: true,
            location: 'Lobby', // Initial location
            history: [], // Track past locations
            protected: false,
            lastSelfProtect: 0
        }));

        // Initial random distribution
        this.players.forEach(p => {
            const startLocs = ['Sky', 'River', 'Mountain'];
            p.location = startLocs[Math.floor(Math.random() * startLocs.length)];
            p.history.push(p.location);
        });

        this.resetActions();
        this.checkShepherdDetection(); // Day 1 check

        return {
            phase: this.phase,
            round: this.round,
            players: this.getPublicPlayerData()
        };
    }

    assignRoles(count) {
        // Basic distribution logic
        const roles = [];
        roles.push(ROLES.WOLF);
        roles.push(ROLES.SHEPHERD_BOY);
        roles.push(ROLES.SHEEP);
        roles.push(ROLES.TURTLE);
        roles.push(ROLES.HEDGEHOG);
        roles.push(ROLES.OWL);
        roles.push(ROLES.BEE);
        roles.push(ROLES.HONEY_BADGER);

        // Fill rest with Sheep or Wolves based on balance
        while (roles.length < count) {
            roles.push(ROLES.SHEEP);
        }
        return roles.slice(0, count);
    }

    resetActions() {
        this.nightActions = {};
        this.dayActions = {};
        this.moveRequests = {};
        this.players.forEach(p => {
            p.protected = false;
        });
    }

    /**
     * Handle player action
     */
    handleAction(playerId, action) {
        const player = this.getPlayer(playerId);
        if (!player || !player.alive) return { success: false, error: 'Dead or invalid player' };

        if (this.phase === PHASES.NIGHT) {
            // Night Actions
            if (['wolf', 'turtle', 'owl', 'honey_badger', 'sheep'].includes(player.role)) {
                this.nightActions[playerId] = action; // { type: 'kill'|'protect'|'scan'|'bite'|'vote', targetId }
                return { success: true };
            }
        } else {
            // Day Actions
            if (action.type === 'move') {
                // Move request for NEXT night
                // SRS: "Night becomes -> User inputs move -> Admin announces death -> Move executes"
                // So Move is a Night action.
            }

            // Immediate Day Skills
            if (player.role === ROLES.BEE && action.type === 'sting') {
                return this.resolveBeeSting(player, action.targetId);
            }
            if (player.role === ROLES.HONEY_BADGER && action.type === 'bite') {
                return this.resolveHoneyBadgerSkill(player, action.targetId, true);
            }
        }
        return { success: false, error: 'Invalid action for phase' };
    }

    handleMoveRequest(playerId, location) {
        const player = this.getPlayer(playerId);
        if (!player || !player.alive) return { success: false, error: 'Invalid player' };

        // Rule: Cannot stay in same location twice consecutively
        const lastLoc = player.history[player.history.length - 1];
        if (lastLoc === location) {
            return { success: false, error: 'Cannot stay in the same location twice consecutively' };
        }

        this.moveRequests[playerId] = location;
        return { success: true };
    }

    /**
     * Resolve Night Phase (The 9 Steps)
     */
    resolveNightPhase() {
        const logs = [];
        const deaths = new Set();
        const protectedPlayers = new Set();

        // 1. Honey Badger (Immediate check - Night Action)
        const badgers = this.getPlayersByRole(ROLES.HONEY_BADGER);
        badgers.forEach(badger => {
            const action = this.nightActions[badger.id];
            if (action && action.type === 'bite') {
                const target = this.getPlayer(action.targetId);
                if (target) {
                    if (target.role === ROLES.BEE) {
                        deaths.add(target.id);
                        logs.push(`🍯 벌꿀오소리가 꿀벌(${target.nickname})을 사냥했습니다!`);
                    } else {
                        // Fail -> Banish Badger (Random move later)
                        this.banishedPlayers.add(badger.id);
                        logs.push(`🍯 벌꿀오소리의 사냥 실패! 다른 지역으로 추방됩니다.`);
                    }
                }
            }
        });

        // 2. Turtle Protection
        const turtles = this.getPlayersByRole(ROLES.TURTLE);
        turtles.forEach(turtle => {
            const action = this.nightActions[turtle.id];
            if (action && action.type === 'protect') {
                // Self protect check
                if (action.targetId === turtle.id) {
                    if (turtle.lastSelfProtect === this.round - 1) return; // Cannot consecutive self-protect
                    turtle.lastSelfProtect = this.round;
                }
                protectedPlayers.add(action.targetId);
            }
        });

        // 3. Hedgehog Reflection (Passive)
        // This is reactive, handled in Wolf/Sheep steps

        // 4. Sheep Voting
        const locationCounts = this.getLocationCounts();
        let maxCount = 0;
        let largestLocs = [];
        Object.entries(locationCounts).forEach(([loc, count]) => {
            if (loc === 'DeathCamp') return;
            if (count > maxCount) {
                maxCount = count;
                largestLocs = [loc];
            } else if (count === maxCount) {
                largestLocs.push(loc);
            }
        });

        if (largestLocs.length === 1) {
            const targetLoc = largestLocs[0];
            const sheepInLoc = this.players.filter(p => p.alive && p.role === ROLES.SHEEP && p.location === targetLoc);

            if (sheepInLoc.length > 0) {
                const votes = {};
                sheepInLoc.forEach(sheep => {
                    const action = this.nightActions[sheep.id];
                    if (action && action.type === 'vote') {
                        votes[action.targetId] = (votes[action.targetId] || 0) + 1;
                    }
                });

                // Find majority
                let maxVote = 0;
                let votedTarget = null;
                Object.entries(votes).forEach(([tid, count]) => {
                    if (count > maxVote) {
                        maxVote = count;
                        votedTarget = tid;
                    } else if (count === maxVote) {
                        votedTarget = null; // Tie
                    }
                });

                if (votedTarget) {
                    const target = this.getPlayer(votedTarget);
                    if (target) {
                        deaths.add(target.id);
                        logs.push(`🐑 양들의 투표로 ${target.nickname}님이 처형되었습니다.`);
                    }
                }
            }
        }

        // 5. Wolf Kill
        const wolves = this.getPlayersByRole(ROLES.WOLF);
        wolves.forEach(wolf => {
            const action = this.nightActions[wolf.id];
            if (action && action.type === 'kill') {
                const target = this.getPlayer(action.targetId);
                if (target && target.location === wolf.location) { // Must be same location
                    if (protectedPlayers.has(target.id)) {
                        logs.push(`🛡️ 늑대의 공격이 거북이의 보호로 막혔습니다.`);
                    } else {
                        deaths.add(target.id);
                        logs.push(`🐺 늑대가 ${target.nickname}님을 습격했습니다.`);

                        // Hedgehog Reflection
                        if (target.role === ROLES.HEDGEHOG) {
                            if (!protectedPlayers.has(wolf.id)) {
                                deaths.add(wolf.id);
                                logs.push(`🦔 고슴도치의 가시에 찔려 공격자가 사망했습니다.`);
                            }
                        }
                    }
                }
            }
        });

        // 6. Owl Scan
        const owls = this.getPlayersByRole(ROLES.OWL);
        owls.forEach(owl => {
            const action = this.nightActions[owl.id];
            if (action && action.type === 'scan') {
                const target = this.getPlayer(action.targetId);
                if (target && target.location === owl.location) {
                    if (!this.scanResults[owl.id]) this.scanResults[owl.id] = [];
                    this.scanResults[owl.id].push({
                        targetId: target.id,
                        role: target.role,
                        round: this.round
                    });
                }
            }
        });

        // 7. Death Aggregation & 8. Announcement
        deaths.forEach(pid => {
            const p = this.getPlayer(pid);
            if (p && p.alive) {
                p.alive = false;
                p.location = 'DeathCamp';
                this.deaths.push({
                    round: this.round,
                    nickname: p.nickname,
                    role: p.role
                });
            }
        });

        // 9. Move Survivors
        this.players.forEach(p => {
            if (p.alive) {
                if (this.banishedPlayers.has(p.id)) {
                    // Random move excluding current
                    const validLocs = LOCATIONS.filter(l => l !== 'DeathCamp' && l !== p.location);
                    p.location = validLocs[Math.floor(Math.random() * validLocs.length)];
                    this.banishedPlayers.delete(p.id);
                } else if (this.moveRequests[p.id]) {
                    p.location = this.moveRequests[p.id];
                }
                p.history.push(p.location);
            }
        });

        // Transition handled by advancePhase()
        // this.round++; // Round increment should happen in advancePhase or here? 
        // Let's keep round increment here for now, but phase switch in advancePhase.
        // Actually, index.js calls advancePhase() AFTER processNightActions().
        // So we should NOT switch phase here.

        return {
            logs,
            deaths: Array.from(deaths)
        };
    }

    resolveBeeSting(bee, targetId) {
        const target = this.getPlayer(targetId);
        if (!target || !target.alive) return { success: false, error: 'Invalid target' };

        // Bee dies too
        bee.alive = false;
        bee.location = 'DeathCamp';

        // Target dies (unless Badger?)
        if (target.role === ROLES.HONEY_BADGER) {
            this.logs.push(`🐝 꿀벌이 벌꿀오소리를 공격했다가 역공당해 사망했습니다!`);
        } else {
            target.alive = false;
            target.location = 'DeathCamp';
            this.logs.push(`🐝 꿀벌의 침! ${target.nickname}님과 꿀벌이 함께 사망했습니다.`);
        }

        return { success: true };
    }

    resolveHoneyBadgerSkill(badger, targetId, isDay) {
        const target = this.getPlayer(targetId);
        if (!target || !target.alive) return { success: false, error: 'Invalid target' };

        if (target.role === ROLES.BEE) {
            target.alive = false;
            target.location = 'DeathCamp';
            this.logs.push(`🍯 벌꿀오소리가 꿀벌(${target.nickname})을 찾아내어 처치했습니다!`);
        } else {
            // Fail
            if (target.role === ROLES.HEDGEHOG) {
                badger.alive = false;
                badger.location = 'DeathCamp';
                this.logs.push(`🍯 벌꿀오소리가 고슴도치를 건드렸다가 사망했습니다.`);
            } else {
                // Banish
                if (isDay) {
                    const validLocs = LOCATIONS.filter(l => l !== 'DeathCamp' && l !== badger.location);
                    badger.location = validLocs[Math.floor(Math.random() * validLocs.length)];
                    badger.history.push(badger.location);
                    this.logs.push(`🍯 벌꿀오소리의 사냥 실패! 다른 지역으로 추방되었습니다.`);
                } else {
                    this.banishedPlayers.add(badger.id);
                }
            }
        }
        return { success: true };
    }

    checkShepherdDetection() {
        const shepherds = this.getPlayersByRole(ROLES.SHEPHERD_BOY);
        shepherds.forEach(s => {
            if (!s.alive) return;
            const wolvesInLoc = this.players.some(p =>
                p.alive && p.role === ROLES.WOLF && p.location === s.location
            );
            this.wolfDetections[s.id] = wolvesInLoc;
        });
    }

    checkWinConditions() {
        const alivePlayers = this.players.filter(p => p.alive);
        const wolves = alivePlayers.filter(p => p.role === ROLES.WOLF);
        const sheep = alivePlayers.filter(p => p.role === ROLES.SHEEP);
        const bees = alivePlayers.filter(p => p.role === ROLES.BEE);
        const badgers = alivePlayers.filter(p => p.role === ROLES.HONEY_BADGER);
        const others = alivePlayers.filter(p => p.role !== ROLES.WOLF);

        // Honey Badger Win: All Bees dead + Self alive (Solo win?)
        if (badgers.length > 0 && bees.length === 0) {
            // Optional: Check if game should end or if it's just a personal win
        }

        // Sheep Win: All Wolves dead
        if (wolves.length === 0) {
            return { winner: 'sheep', message: '모든 늑대가 사망하여 양 팀이 승리했습니다!', gameOver: true, winners: 'sheep' };
        }

        // Wolf Win: All Sheep dead OR All Non-Wolves dead
        if (sheep.length === 0 || others.length === 0) {
            return { winner: 'wolf', message: '늑대 팀이 승리했습니다!', gameOver: true, winners: 'wolf' };
        }

        return { gameOver: false };
    }

    /**
     * Get private data for a specific player
     */
    getPrivatePlayerData(playerId) {
        const player = this.getPlayer(playerId);
        if (!player) return null;

        const data = {
            role: player.role,
            alive: player.alive
        };

        if (player.role === ROLES.OWL) {
            data.scanResults = this.scanResults[playerId] || [];
        }

        if (player.role === ROLES.SHEPHERD_BOY) {
            data.wolfDetected = this.wolfDetections[playerId] || false;
        }

        return data;
    }

    /**
     * Get public game state
     */
    getGameState() {
        return {
            round: this.round,
            phase: this.phase,
            players: this.getPublicPlayerData(),
            locationCounts: this.getLocationCounts()
        };
    }

    /**
     * Wrapper for index.js calls
     */
    submitNightAction(playerId, actionType, targetId) {
        return this.handleAction(playerId, { type: actionType, targetId });
    }

    submitDayAction(playerId, actionType, targetId) {
        return this.handleAction(playerId, { type: actionType, targetId });
    }

    scheduleMove(playerId, location) {
        return this.handleMoveRequest(playerId, location);
    }

    processNightActions() {
        return this.resolveNightPhase();
    }

    processDayActions() {
        return { logs: [] };
    }

    advancePhase() {
        if (this.phase === PHASES.NIGHT) {
            this.phase = PHASES.DAY;
            this.round++;
            this.checkShepherdDetection();
        } else {
            this.phase = PHASES.NIGHT;
            this.resetActions(); // Clear actions for new night
        }
    }

    // Helpers
    getPlayer(id) { return this.players.find(p => p.id === id); }
    getPlayersByRole(role) { return this.players.filter(p => p.alive && p.role === role); }

    getLocationCounts() {
        const counts = {};
        LOCATIONS.forEach(l => counts[l] = 0);
        this.players.forEach(p => {
            if (p.alive) counts[p.location] = (counts[p.location] || 0) + 1;
        });
        return counts;
    }

    getPublicPlayerData() {
        return this.players.map(p => ({
            id: p.id,
            nickname: p.nickname,
            alive: p.alive,
            location: p.location,
            // Role is hidden
        }));
    }
}
