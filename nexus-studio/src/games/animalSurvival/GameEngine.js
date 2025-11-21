/**
 * Animal Survival Game Engine
 * Pure JS logic independent of UI
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
        this.players = []; // { id, role, alive, hunger, location, disguiseRole, targetRole (for crow) }
        this.round = 1;
        this.logs = [];
        this.deaths = [];
        this.survivors = [];
    }

    initRound(players) {
        // Initialize players for the start of the game or round
        // If it's the first round, players should already have roles assigned externally or here.
        // This function mainly resets round-specific flags if any.
        this.players = players;
        return {
            round: this.round,
            players: this.players
        };
    }

    applyMoves(moveMap) {
        // moveMap: { playerId: location }
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
        // Group players by location
        const locationMap = {};
        LOCATIONS.forEach(loc => locationMap[loc] = []);

        this.players.forEach(p => {
            if (p.alive && p.location) {
                locationMap[p.location].push(p);
            }
        });

        const roundDeaths = [];
        const roundLogs = [];

        // Process each location
        Object.keys(locationMap).forEach(loc => {
            const animals = locationMap[loc];
            if (animals.length < 2) return;

            // Sort by predation priority: Lion > Crocodile > Eagle > Hyena > Snake > Others
            // Note: Snake is special (attacker dies), so we handle it separately or within logic

            // Priority list for attackers
            const predators = [ROLES.LION, ROLES.CROCODILE, ROLES.EAGLE, ROLES.HYENA];

            // Check for Snake first (defensive kill)
            const snake = animals.find(p => p.role === ROLES.SNAKE);

            // Find highest priority predator
            let attacker = null;
            for (const predRole of predators) {
                attacker = animals.find(p => p.role === predRole);
                if (attacker) break;
            }

            if (attacker) {
                // Determine victim
                // Predators eat anyone lower in hierarchy or herbivores
                // Hierarchy: Lion > Crocodile > Eagle > Hyena
                // Same species usually don't eat each other in this simplified rule unless specified, 
                // but prompt implies "Predation Logic". 
                // Let's assume: Highest predator eats ONE victim. 
                // If multiple highest predators, they might compete or random? 
                // Prompt says: "Lion > Crocodile > Eagle > Hyena > Normal Animals"

                // Filter potential victims (anyone except the attacker)
                // In this logic, we need to be careful about who eats whom.
                // Let's assume strictly hierarchical.

                const potentialVictims = animals.filter(p => p.id !== attacker.id);

                if (potentialVictims.length > 0) {
                    // If Snake is present and is NOT the attacker, and attacker attacks snake?
                    // Or snake kills attacker if snake is attacked?
                    // Prompt: "Snake: Attacker dies (Invincible)"
                    // So if Attacker attacks Snake, Attacker dies.

                    // Who does the attacker choose? Random for now unless targeted.
                    // Let's pick a random victim from potential victims.
                    const victimIndex = Math.floor(Math.random() * potentialVictims.length);
                    const victim = potentialVictims[victimIndex];

                    // Check protections
                    // Otter/Deer/Rabbit/Duck: Protected if in same place? 
                    // Prompt: "Otter/Deer/Rabbit/Duck: Protected if in same place" -> This likely means if they are together with SAME species? 
                    // Or if they are together with ANY other animal? 
                    // Usually "Protected if together" means "Safety in numbers" or specific pair.
                    // Let's assume: If there are multiple of (Otter/Deer/Rabbit/Duck) in the same location, they are safe?
                    // Re-reading: "Otter/Deer/Rabbit/Duck are protected if they are in the same place"
                    // This is slightly ambiguous. Could mean "If Otter and Deer are together" or "If 2 Otters".
                    // Let's assume: If there is MORE THAN ONE of these "Herbivores" combined in the location, they help each other?
                    // OR it means "Protected if they are in the same place [as the predator]?" No, that makes no sense.
                    // Let's assume: If there are >= 2 herbivores (Otter, Deer, Rabbit, Duck) in this location, they are immune to attack.

                    const herbivores = [ROLES.OTTER, ROLES.DEER, ROLES.RABBIT, ROLES.DUCK];
                    const herbivoreCount = animals.filter(p => herbivores.includes(p.role)).length;
                    const isProtected = herbivores.includes(victim.role) && herbivoreCount >= 2;

                    if (isProtected) {
                        roundLogs.push(`[${loc}] ${attacker.role} tried to attack ${victim.role}, but they were protected!`);
                    } else {
                        // Attack proceeds
                        if (victim.role === ROLES.SNAKE) {
                            // Snake kills attacker
                            attacker.alive = false;
                            this.deaths.push(attacker);
                            roundDeaths.push(attacker.id);
                            roundLogs.push(`[${loc}] ${attacker.role} attacked Snake and died from poison!`);
                        } else {
                            // Victim dies
                            victim.alive = false;
                            this.deaths.push(victim);
                            roundDeaths.push(victim.id);
                            roundLogs.push(`[${loc}] ${attacker.role} ate ${victim.role}!`);

                            // Attacker feeds
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

            // Increase hunger for predators
            if ([ROLES.LION, ROLES.CROCODILE, ROLES.EAGLE, ROLES.HYENA].includes(p.role)) {
                p.hunger += 1;

                let starved = false;
                if (p.role === ROLES.LION && p.hunger >= 1) starved = true; // Dies if not eaten every turn? Prompt: "Lion: Dies if not eaten once" -> means if hunger reaches 1 (missed 1 meal)? Or missed 1 turn? Usually "Once" means immediate next turn. Let's assume hunger starts at 0. If end of round hunger is 1, it means didn't eat this round.
                // Wait, "Lion: Dies if not eaten once" -> If it eats, hunger resets to 0. If it doesn't, hunger becomes 1.
                // So if hunger >= 1, dies.

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
        return this.round > 4; // Game ends after 4 rounds
    }

    calculateWinners() {
        // Determine winners based on survival and specific rules
        const winners = [];
        const survivors = this.players.filter(p => p.alive);
        const deads = this.players.filter(p => !p.alive);

        const lion = this.players.find(p => p.role === ROLES.LION);
        const crocodile = this.players.find(p => p.role === ROLES.CROCODILE);
        const eagle = this.players.find(p => p.role === ROLES.EAGLE); // Fixed: was finding crocodile
        const hyena = this.players.find(p => p.role === ROLES.HYENA);

        this.players.forEach(p => {
            let won = false;
            if (!p.alive && p.role !== ROLES.SNAKE) {
                // Most deads lose, except maybe Crow/Snake specific conditions?
                // Snake: 9+ deaths.
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
                    if (crocodile && crocodile.alive) won = true; // Win if Crocodile wins (survives)
                    break;
                case ROLES.MOUSE:
                    if (lion && lion.alive) won = true; // Win if Lion wins (survives)
                    break;
                case ROLES.CROW:
                    // Crow wins if their target wins. 
                    // Need to assign target at start. Assuming p.targetRole exists.
                    // For now, if target is alive, Crow wins.
                    // If target is self?
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
