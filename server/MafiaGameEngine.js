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

export const LOCATIONS = ['Forest', 'Field', 'River', 'Sky'];

export const PHASES = {
    NIGHT: 'night',
    DAY: 'day'
};

export class MafiaGameEngine {
    constructor() {
        this.players = []; // { id, nickname, role, alive, location, protected, lastSelfProtect }
        this.round = 1;
        this.maxRounds = 5;
        this.phase = PHASES.NIGHT;
        this.logs = [];
        this.deaths = [];
        this.nightActions = {}; // { playerId: { type, target } }
        this.dayActions = {}; // { playerId: { type, target } }
        this.scanResults = {}; // { owlId: [{ target, role }] }
        this.wolfDetections = {}; // { shepherdId: boolean }
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
            location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
            protected: false,
            lastSelfProtect: false
        }));

        this.round = 1;
        this.phase = PHASES.NIGHT;
        this.logs = [];
        this.deaths = [];

        return {
            round: this.round,
            phase: this.phase,
            players: this.getPublicPlayerData()
        };
    }

    /**
     * Get public player data (hides roles from other players)
     */
    getPublicPlayerData() {
        return this.players.map(p => ({
            id: p.id,
            nickname: p.nickname,
            alive: p.alive,
            location: p.location
        }));
    }

    /**
     * Get private player data (includes role)
     */
    getPrivatePlayerData(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return null;

        return {
            id: player.id,
            nickname: player.nickname,
            role: player.role,
            alive: player.alive,
            location: player.location,
            scanResults: this.scanResults[playerId] || [],
            wolfDetected: this.wolfDetections[playerId] || false
        };
    }

    /**
     * Submit a night action
     */
    submitNightAction(playerId, actionType, targetId = null) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !player.alive || this.phase !== PHASES.NIGHT) {
            return { success: false, error: 'Invalid action' };
        }

        // Validate action based on role
        const validAction = this.validateNightAction(player, actionType, targetId);
        if (!validAction.valid) {
            return { success: false, error: validAction.error };
        }

        this.nightActions[playerId] = { type: actionType, target: targetId };
        return { success: true };
    }

    /**
     * Validate night action
     */
    validateNightAction(player, actionType, targetId) {
        switch (player.role) {
            case ROLES.WOLF:
                if (actionType !== 'kill') return { valid: false, error: 'Invalid action for wolf' };
                const target = this.players.find(p => p.id === targetId);
                if (!target || !target.alive || target.location !== player.location) {
                    return { valid: false, error: 'Target must be alive and in same location' };
                }
                return { valid: true };

            case ROLES.TURTLE:
                if (actionType !== 'protect') return { valid: false, error: 'Invalid action for turtle' };
                const protectTarget = this.players.find(p => p.id === targetId);
                if (!protectTarget || !protectTarget.alive || protectTarget.location !== player.location) {
                    return { valid: false, error: 'Target must be alive and in same location' };
                }
                // Check if trying to protect self consecutively
                if (targetId === player.id && player.lastSelfProtect) {
                    return { valid: false, error: 'Cannot protect self consecutively' };
                }
                return { valid: true };

            case ROLES.OWL:
                if (actionType !== 'scan') return { valid: false, error: 'Invalid action for owl' };
                const scanTarget = this.players.find(p => p.id === targetId);
                if (!scanTarget || !scanTarget.alive || scanTarget.location !== player.location) {
                    return { valid: false, error: 'Target must be alive and in same location' };
                }
                return { valid: true };

            case ROLES.HONEY_BADGER:
                if (actionType !== 'bite') return { valid: false, error: 'Invalid action for honey badger' };
                const biteTarget = this.players.find(p => p.id === targetId);
                if (!biteTarget || !biteTarget.alive) {
                    return { valid: false, error: 'Target must be alive' };
                }
                return { valid: true };

            case ROLES.SHEEP:
                if (actionType !== 'vote') return { valid: false, error: 'Invalid action for sheep' };
                // Check if this sheep is in the largest location
                if (!this.isInLargestLocation(player)) {
                    return { valid: false, error: 'Only sheep in largest location can vote' };
                }
                const voteTarget = this.players.find(p => p.id === targetId);
                if (!voteTarget || !voteTarget.alive) {
                    return { valid: false, error: 'Target must be alive' };
                }
                return { valid: true };

            default:
                return { valid: false, error: 'This role has no night action' };
        }
    }

    /**
     * Submit a day action
     */
    submitDayAction(playerId, actionType, targetId = null) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !player.alive || this.phase !== PHASES.DAY) {
            return { success: false, error: 'Invalid action' };
        }

        const validAction = this.validateDayAction(player, actionType, targetId);
        if (!validAction.valid) {
            return { success: false, error: validAction.error };
        }

        this.dayActions[playerId] = { type: actionType, target: targetId };
        return { success: true };
    }

    /**
     * Validate day action
     */
    validateDayAction(player, actionType, targetId) {
        switch (player.role) {
            case ROLES.BEE:
                if (actionType !== 'sting') return { valid: false, error: 'Invalid action for bee' };
                const stingTarget = this.players.find(p => p.id === targetId);
                if (!stingTarget || !stingTarget.alive) {
                    return { valid: false, error: 'Target must be alive' };
                }
                return { valid: true };

            case ROLES.HONEY_BADGER:
                if (actionType !== 'bite') return { valid: false, error: 'Invalid action for honey badger' };
                const biteTarget = this.players.find(p => p.id === targetId);
                if (!biteTarget || !biteTarget.alive) {
                    return { valid: false, error: 'Target must be alive' };
                }
                return { valid: true };

            default:
                return { valid: false, error: 'This role has no day action' };
        }
    }

    /**
     * Check if player is in the largest location
     */
    isInLargestLocation(player) {
        const locationCounts = this.getLocationCounts();
        const maxCount = Math.max(...Object.values(locationCounts));
        return locationCounts[player.location] === maxCount;
    }

    /**
     * Get player counts per location
     */
    getLocationCounts() {
        const counts = { Forest: 0, Field: 0, River: 0, Sky: 0 };
        this.players.forEach(p => {
            if (p.alive && p.location) {
                counts[p.location]++;
            }
        });
        return counts;
    }

    /**
     * Move player to new location
     */
    movePlayer(playerId, newLocation) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !player.alive || !LOCATIONS.includes(newLocation)) {
            return { success: false, error: 'Invalid move' };
        }

        player.location = newLocation;
        return { success: true };
    }

    /**
     * Process all night actions
     */
    processNightActions() {
        const roundLogs = [];
        const roundDeaths = [];

        // Reset protections
        this.players.forEach(p => {
            p.protected = false;
        });

        // 1. Process Honey Badger bites (night)
        Object.entries(this.nightActions).forEach(([playerId, action]) => {
            const player = this.players.find(p => p.id === playerId);
            if (player && player.role === ROLES.HONEY_BADGER && action.type === 'bite') {
                const target = this.players.find(p => p.id === action.target);
                if (target && target.alive) {
                    if (target.role === ROLES.BEE) {
                        target.alive = false;
                        roundDeaths.push(target.id);
                        roundLogs.push(`🍯 벌꿀오소리가 꿀벌을 물어 죽였습니다!`);
                    } else if (target.role === ROLES.HEDGEHOG) {
                        // Hedgehog counter-kills
                        target.alive = false;
                        player.alive = false;
                        roundDeaths.push(target.id, player.id);
                        roundLogs.push(`🦔 고슴도치가 공격받아 벌꿀오소리와 함께 사망했습니다!`);
                    } else {
                        // Wrong target - exile honey badger
                        const randomLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
                        player.location = randomLocation;
                        roundLogs.push(`🍯 벌꿀오소리가 잘못된 대상을 지목하여 ${randomLocation}로 추방되었습니다!`);
                    }
                }
            }
        });

        // 2. Process Turtle protections
        Object.entries(this.nightActions).forEach(([playerId, action]) => {
            const player = this.players.find(p => p.id === playerId);
            if (player && player.alive && player.role === ROLES.TURTLE && action.type === 'protect') {
                const target = this.players.find(p => p.id === action.target);
                if (target && target.alive) {
                    target.protected = true;
                    // Update lastSelfProtect flag
                    player.lastSelfProtect = (action.target === playerId);
                    roundLogs.push(`🐢 거북이가 누군가를 보호했습니다.`);
                }
            }
        });

        // 3. Process Wolf kills
        Object.entries(this.nightActions).forEach(([playerId, action]) => {
            const player = this.players.find(p => p.id === playerId);
            if (player && player.alive && player.role === ROLES.WOLF && action.type === 'kill') {
                const target = this.players.find(p => p.id === action.target);
                if (target && target.alive) {
                    if (target.protected) {
                        roundLogs.push(`🐺 늑대가 공격했지만 대상이 보호받고 있었습니다!`);
                    } else if (target.role === ROLES.HEDGEHOG) {
                        // Hedgehog counter-kills wolf
                        target.alive = false;
                        player.alive = false;
                        roundDeaths.push(target.id, player.id);
                        roundLogs.push(`🦔 고슴도치가 공격받아 늑대와 함께 사망했습니다!`);
                    } else {
                        target.alive = false;
                        roundDeaths.push(target.id);
                        roundLogs.push(`🐺 늑대가 ${target.nickname}님을 죽였습니다!`);
                    }
                }
            }
        });

        // 4. Process Owl scans
        Object.entries(this.nightActions).forEach(([playerId, action]) => {
            const player = this.players.find(p => p.id === playerId);
            if (player && player.alive && player.role === ROLES.OWL && action.type === 'scan') {
                const target = this.players.find(p => p.id === action.target);
                if (target && target.alive) {
                    if (!this.scanResults[playerId]) {
                        this.scanResults[playerId] = [];
                    }
                    this.scanResults[playerId].push({
                        target: target.nickname,
                        role: target.role,
                        round: this.round
                    });
                    roundLogs.push(`🦉 부엉이가 누군가를 스캔했습니다.`);
                }
            }
        });

        // 5. Process Shepherd Boy detection
        this.players.forEach(player => {
            if (player.alive && player.role === ROLES.SHEPHERD_BOY) {
                const playersInLocation = this.players.filter(p =>
                    p.alive && p.location === player.location && p.id !== player.id
                );
                const hasWolf = playersInLocation.some(p => p.role === ROLES.WOLF);
                this.wolfDetections[player.id] = hasWolf;
                if (hasWolf) {
                    roundLogs.push(`🧑‍🌾 양치기 소년이 늑대의 기척을 느꼈습니다.`);
                }
            }
        });

        // 6. Process Sheep votes (밤에 투표)
        const sheepVotes = {};
        Object.entries(this.nightActions).forEach(([playerId, action]) => {
            const player = this.players.find(p => p.id === playerId);
            if (player && player.alive && player.role === ROLES.SHEEP && action.type === 'vote') {
                if (this.isInLargestLocation(player)) {
                    const targetId = action.target;
                    sheepVotes[targetId] = (sheepVotes[targetId] || 0) + 1;
                }
            }
        });

        // Determine vote result
        if (Object.keys(sheepVotes).length > 0) {
            const maxVotes = Math.max(...Object.values(sheepVotes));
            const winners = Object.entries(sheepVotes)
                .filter(([_, votes]) => votes === maxVotes)
                .map(([targetId, _]) => targetId);

            if (winners.length === 1) {
                const votedOut = this.players.find(p => p.id === winners[0]);
                if (votedOut && votedOut.alive) {
                    // 고슴도치가 양의 투표로 사망시 능력 미발동
                    votedOut.alive = false;
                    votedOut.diedByVote = true; // Mark as died by vote
                    roundDeaths.push(votedOut.id);
                    roundLogs.push(`🐑 양들의 투표로 ${votedOut.nickname}님이 처형되었습니다!`);
                }
            } else {
                roundLogs.push(`🐑 투표가 동점이 나와 아무도 처형되지 않았습니다.`);
            }
        }

        // Clear night actions
        this.nightActions = {};

        return { deaths: roundDeaths, logs: roundLogs };
    }

    /**
     * Process all day actions
     */
    processDayActions() {
        const roundLogs = [];
        const roundDeaths = [];

        // 1. Process Honey Badger bites (day)
        Object.entries(this.dayActions).forEach(([playerId, action]) => {
            const player = this.players.find(p => p.id === playerId);
            if (player && player.alive && player.role === ROLES.HONEY_BADGER && action.type === 'bite') {
                const target = this.players.find(p => p.id === action.target);
                if (target && target.alive) {
                    if (target.role === ROLES.BEE) {
                        target.alive = false;
                        roundDeaths.push(target.id);
                        roundLogs.push(`🍯 벌꿀오소리가 꿀벌을 물어 죽였습니다!`);
                    } else if (target.role === ROLES.HEDGEHOG) {
                        // Hedgehog counter-kills
                        target.alive = false;
                        player.alive = false;
                        roundDeaths.push(target.id, player.id);
                        roundLogs.push(`🦔 고슴도치가 공격받아 벌꿀오소리와 함께 사망했습니다!`);
                    } else {
                        // Wrong target - exile honey badger
                        const randomLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
                        player.location = randomLocation;
                        roundLogs.push(`🍯 벌꿀오소리가 잘못된 대상을 지목하여 ${randomLocation}로 추방되었습니다!`);
                    }
                }
            }
        });

        // 2. Process Bee stings
        Object.entries(this.dayActions).forEach(([playerId, action]) => {
            const player = this.players.find(p => p.id === playerId);
            if (player && player.alive && player.role === ROLES.BEE && action.type === 'sting') {
                const target = this.players.find(p => p.id === action.target);
                if (target && target.alive) {
                    if (target.role === ROLES.HONEY_BADGER) {
                        // Bee dies but honey badger survives
                        player.alive = false;
                        roundDeaths.push(player.id);
                        roundLogs.push(`🐝 꿀벌이 벌꿀오소리를 쏘려다 실패하고 사망했습니다!`);
                    } else {
                        // Both die
                        target.alive = false;
                        player.alive = false;
                        roundDeaths.push(target.id, player.id);
                        roundLogs.push(`🐝 꿀벌이 ${target.nickname}님을 쏘고 함께 사망했습니다!`);
                    }
                }
            }
        });



        // Clear day actions
        this.dayActions = {};

        return { deaths: roundDeaths, logs: roundLogs };
    }

    /**
     * Check win conditions
     */
    checkWinConditions() {
        const alivePlayers = this.players.filter(p => p.alive);
        const aliveRoles = alivePlayers.map(p => p.role);

        const wolves = this.players.filter(p => p.role === ROLES.WOLF);
        const sheep = this.players.filter(p => p.role === ROLES.SHEEP);
        const bees = this.players.filter(p => p.role === ROLES.BEE);
        const honeyBadgers = this.players.filter(p => p.role === ROLES.HONEY_BADGER);
        const neutrals = this.players.filter(p =>
            [ROLES.TURTLE, ROLES.HEDGEHOG, ROLES.OWL].includes(p.role)
        );

        const aliveWolves = wolves.filter(p => p.alive);
        const aliveSheep = sheep.filter(p => p.alive);
        const aliveBees = bees.filter(p => p.alive);
        const aliveHoneyBadgers = honeyBadgers.filter(p => p.alive);
        const aliveNeutrals = neutrals.filter(p => p.alive);

        const winners = [];

        // Sheep victory: All wolves dead
        if (aliveWolves.length === 0 && aliveSheep.length > 0) {
            aliveSheep.forEach(p => winners.push(p));
            // Shepherd boy wins with sheep
            const shepherds = this.players.filter(p => p.role === ROLES.SHEPHERD_BOY && p.alive);
            shepherds.forEach(p => winners.push(p));
            // Bees win with sheep
            aliveBees.forEach(p => winners.push(p));
        }

        // Wolf victory: All sheep dead OR all non-sheep animals dead
        const allSheepDead = aliveSheep.length === 0;
        const allNonSheepAnimalsDead = alivePlayers.every(p =>
            p.role === ROLES.WOLF || p.role === ROLES.SHEEP
        );

        if (aliveWolves.length > 0 && (allSheepDead || allNonSheepAnimalsDead)) {
            aliveWolves.forEach(p => winners.push(p));
        }

        // Honey Badger victory: All bees dead and self alive
        if (aliveBees.length === 0 && aliveHoneyBadgers.length > 0) {
            aliveHoneyBadgers.forEach(p => winners.push(p));
        }

        // Neutral animals victory: Self or one of turtle/owl/hedgehog/honey_badger alive
        const neutralOrHoneyBadgerAlive = alivePlayers.some(p =>
            [ROLES.TURTLE, ROLES.HEDGEHOG, ROLES.OWL, ROLES.HONEY_BADGER].includes(p.role)
        );

        if (neutralOrHoneyBadgerAlive) {
            this.players.forEach(p => {
                if ([ROLES.TURTLE, ROLES.HEDGEHOG, ROLES.OWL].includes(p.role)) {
                    if (p.alive || neutralOrHoneyBadgerAlive) {
                        if (!winners.find(w => w.id === p.id)) {
                            winners.push(p);
                        }
                    }
                }
            });
        }

        // Game ends after 5 rounds or if winners determined
        const gameOver = this.round >= this.maxRounds || winners.length > 0;

        return {
            gameOver,
            winners: winners.map(p => ({
                id: p.id,
                nickname: p.nickname,
                role: p.role
            }))
        };
    }

    /**
     * Advance to next phase
     */
    advancePhase() {
        if (this.phase === PHASES.NIGHT) {
            this.phase = PHASES.DAY;
        } else {
            this.phase = PHASES.NIGHT;
            this.round++;
        }

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
