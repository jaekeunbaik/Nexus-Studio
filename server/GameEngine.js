/**
 * Animal Survival Game Engine (Server Side)
 */

export const ROLES = {
    LION: 'lion',
    CROCODILE: 'crocodile',
    EAGLE: 'eagle',
    HYENA: 'hyena',
    CHAMELEON: 'chameleon',
    CLEANER_BIRD: 'cleaner-bird',
    MOUSE: 'mouse',
    CROW: 'crow',
    OTTER: 'otter',
    DEER: 'deer',
    RABBIT: 'rabbit',
    DUCK: 'duck',
    SNAKE: 'snake'
};

export const LOCATIONS = ['Forest', 'Field', 'River', 'Sky'];

export class GameEngine {
    constructor() {
        this.players = [];
        this.round = 1;
        this.logs = [];
        this.deaths = [];
        this.survivors = [];
    }

    initRound(players) {
        this.players = players;
        return {
            round: this.round,
            players: this.players
        };
    }

    applyMoves(moveMap) {
        const movedPlayers = [];
        this.players.forEach(p => {
            if (!p.alive) return;
            const newLoc = moveMap[p.id];
            if (newLoc && LOCATIONS.includes(newLoc)) {
                p.location = newLoc;
                movedPlayers.push({ id: p.id, location: newLoc });
            }
        });
        return movedPlayers;
    }

    resolvePredation() {
        const locationMap = {};
        LOCATIONS.forEach(loc => locationMap[loc] = []);

        this.players.forEach(p => {
            if (p.alive && p.location) {
                locationMap[p.location].push(p);
            }
        });

        const roundDeaths = [];
        const roundLogs = [];

        Object.keys(locationMap).forEach(loc => {
            const animals = locationMap[loc];
            if (animals.length < 2) return;

            const predators = [ROLES.LION, ROLES.CROCODILE, ROLES.EAGLE, ROLES.HYENA];
            const snake = animals.find(p => p.role === ROLES.SNAKE);

            let attacker = null;
            for (const predRole of predators) {
                attacker = animals.find(p => p.role === predRole);
                if (attacker) break;
            }

            if (attacker) {
                const potentialVictims = animals.filter(p => p.id !== attacker.id);

                if (potentialVictims.length > 0) {
                    const victimIndex = Math.floor(Math.random() * potentialVictims.length);
                    const victim = potentialVictims[victimIndex];

                    const herbivores = [ROLES.OTTER, ROLES.DEER, ROLES.RABBIT, ROLES.DUCK];
                    const herbivoreCount = animals.filter(p => herbivores.includes(p.role)).length;
                    const isProtected = herbivores.includes(victim.role) && herbivoreCount >= 2;

                    if (isProtected) {
                        roundLogs.push(`[${loc}] ${attacker.role} tried to attack ${victim.role}, but they were protected!`);
                    } else {
                        if (victim.role === ROLES.SNAKE) {
                            attacker.alive = false;
                            this.deaths.push(attacker);
                            roundDeaths.push(attacker.id);
                            roundLogs.push(`[${loc}] ${attacker.role} attacked Snake and died from poison!`);
                        } else {
                            victim.alive = false;
                            this.deaths.push(victim);
                            roundDeaths.push(victim.id);
                            roundLogs.push(`[${loc}] ${attacker.role} ate ${victim.role}!`);
                            attacker.hunger = 0;
                        }
                    }
                }
            }
        });

        return { deaths: roundDeaths, logs: roundLogs };
    }

    updateHunger() {
        const deaths = [];
        const logs = [];

        this.players.forEach(p => {
            if (!p.alive) return;

            if ([ROLES.LION, ROLES.CROCODILE, ROLES.EAGLE, ROLES.HYENA].includes(p.role)) {
                p.hunger += 1;

                let starved = false;
                if (p.role === ROLES.LION && p.hunger >= 1) starved = true;
                if ((p.role === ROLES.CROCODILE || p.role === ROLES.EAGLE) && p.hunger >= 2) starved = true;
                if (p.role === ROLES.HYENA && p.hunger >= 3) starved = true;

                if (starved) {
                    p.alive = false;
                    this.deaths.push(p);
                    deaths.push(p.id);
                    logs.push(`${p.role} starved to death!`);
                }
            }
        });

        return { deaths, logs };
    }

    checkRoundEnd() {
        this.round += 1;
        return this.round > 4;
    }

    calculateWinners() {
        const winners = [];
        const survivors = this.players.filter(p => p.alive);
        const deads = this.players.filter(p => !p.alive);

        const lion = this.players.find(p => p.role === ROLES.LION);
        const crocodile = this.players.find(p => p.role === ROLES.CROCODILE);

        this.players.forEach(p => {
            let won = false;
            if (!p.alive && p.role !== ROLES.SNAKE) {
                // Dead usually lose
            }

            switch (p.role) {
                case ROLES.LION:
                case ROLES.CROCODILE:
                case ROLES.EAGLE:
                case ROLES.CHAMELEON:
                case ROLES.OTTER:
                case ROLES.DEER:
                case ROLES.RABBIT:
                case ROLES.DUCK:
                    if (p.alive) won = true;
                    break;
                case ROLES.HYENA:
                    if (p.alive && (!lion || !lion.alive)) won = true;
                    break;
                case ROLES.CLEANER_BIRD:
                    if (crocodile && crocodile.alive) won = true;
                    break;
                case ROLES.MOUSE:
                    if (lion && lion.alive) won = true;
                    break;
                case ROLES.CROW:
                    // Simplified: Crow wins if alive
                    if (p.alive) won = true;
                    break;
                case ROLES.SNAKE:
                    if (deads.length >= 9) won = true;
                    break;
            }

            if (won) winners.push(p);
        });

        return winners;
    }
}
