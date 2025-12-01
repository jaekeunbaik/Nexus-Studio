import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameEngine, ROLES } from './GameEngine.js';
import { MafiaGameEngine, ROLES as MAFIA_ROLES, PHASES } from './MafiaGameEngine.js';

const app = express();
app.use(cors({
    origin: "*"
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// In-memory storage
const rooms = {}; // roomId -> { id, name, players: [], gameEngine: instance, gameType: 'animalSurvival' | 'mafiaGame', phase: 'lobby', moves: {}, persistent: boolean }

// Admin Endpoints
app.use(express.json());

app.post('/api/admin/rooms', (req, res) => {
    const { name, password } = req.body;
    if (password !== 'admin123') return res.status(401).json({ error: 'Unauthorized' });

    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms[roomId] = {
        id: roomId,
        name: name || `Room ${roomId}`,
        players: [],
        gameEngine: new GameEngine(),
        phase: 'lobby',
        moves: {},
        persistent: true
    };

    res.json({ roomId, name: rooms[roomId].name });
});

app.get('/api/admin/rooms', (req, res) => {
    // Simple auth check could be added here too
    const roomList = Object.values(rooms).map(r => ({
        id: r.id,
        name: r.name,
        playerCount: r.players.length,
        phase: r.phase
    }));
    res.json(roomList);
});

app.delete('/api/admin/rooms/:id', (req, res) => {
    const { password } = req.body;
    const roomId = req.params.id;
    if (rooms[roomId]) {
        delete rooms[roomId];
        io.to(roomId).emit('roomClosed'); // Notify players
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Room not found' });
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinRoom', ({ roomId, nickname }) => {
        // Check if room exists
        if (!rooms[roomId]) {
            // If it's a random non-persistent room request (from GameList create), create it
            rooms[roomId] = {
                id: roomId,
                name: `Room ${roomId}`,
                players: [],
                gameEngine: new GameEngine(),
                phase: 'lobby',
                moves: {},
                persistent: false
            };
        }

        socket.join(roomId);
        const room = rooms[roomId];

        const existingPlayer = room.players.find(p => p.id === socket.id);

        if (!existingPlayer) {
            room.players.push({
                id: socket.id,
                nickname,
                isHost: room.players.length === 0, // First player is host
                role: null,
                alive: true,
                hunger: 0,
                location: null
            });
        }

        io.to(roomId).emit('roomUpdate', {
            players: room.players,
            roomName: room.name,
            isPersistent: room.persistent
        });
    });

    socket.on('startGame', ({ roomId }) => {
        const room = rooms[roomId];
        if (!room) return;

        // Always use Mafia Game (Shepherd & Wolf)
        const gameType = 'mafiaGame';
        room.gameType = gameType;

        // Initialize Mafia Game
        room.gameEngine = new MafiaGameEngine();
        const initResult = room.gameEngine.initGame(room.players);
        room.phase = 'night';

        io.to(roomId).emit('gameStarted', { gameType });
        io.to(roomId).emit('mafiaGameStateUpdate', {
            phase: initResult.phase,
            round: initResult.round,
            players: initResult.players,
            locationCounts: room.gameEngine.getLocationCounts()
        });

        // Send private role info to each player
        room.players.forEach(p => {
            const privateData = room.gameEngine.getPrivatePlayerData(p.id);
            io.to(p.id).emit('mafiaPrivateData', privateData);
        });
    });

    socket.on('selectMove', ({ roomId, location }) => {
        const room = rooms[roomId];
        if (!room || room.phase !== 'moving') return;

        room.moves[socket.id] = location;

        const alivePlayers = room.players.filter(p => p.alive);
        if (Object.keys(room.moves).length >= alivePlayers.length) {
            processRound(roomId);
        }
    });

    socket.on('rejoin', ({ roomId }) => {
        const room = rooms[roomId];
        if (room) {
            socket.join(roomId);

            if (room.gameType === 'mafiaGame' && room.gameEngine) {
                // Send Mafia Game State
                socket.emit('mafiaGameStateUpdate', room.gameEngine.getGameState());

                // Send Private Data (Role, etc.)
                const privateData = room.gameEngine.getPrivatePlayerData(socket.id);
                if (privateData) {
                    socket.emit('mafiaPrivateData', privateData);
                }
            } else {
                // Legacy Game State
                socket.emit('gameStateUpdate', {
                    phase: room.phase,
                    round: room.gameEngine ? room.gameEngine.round : 1,
                    players: room.players,
                    locationMap: room.gameEngine ? getLocationMap(room.players) : {}
                });
            }
        }
    });

    // Mafia Game Events
    socket.on('mafiaSubmitNightAction', ({ roomId, actionType, targetId }) => {
        const room = rooms[roomId];
        if (!room || room.gameType !== 'mafiaGame') return;

        const result = room.gameEngine.submitNightAction(socket.id, actionType, targetId);
        socket.emit('mafiaActionResult', result);

        // Check if all alive players have submitted actions
        const alivePlayers = room.players.filter(p => p.alive);
        const nightActionCount = Object.keys(room.gameEngine.nightActions).length;

        // Auto-advance if all players with night actions have submitted
        // (Not all roles have night actions)
        if (nightActionCount >= alivePlayers.filter(p =>
            [MAFIA_ROLES.WOLF, MAFIA_ROLES.TURTLE, MAFIA_ROLES.OWL, MAFIA_ROLES.HONEY_BADGER].includes(p.role)
        ).length) {
            processMafiaNight(roomId);
        }
    });

    socket.on('mafiaSubmitDayAction', ({ roomId, actionType, targetId }) => {
        const room = rooms[roomId];
        if (!room || room.gameType !== 'mafiaGame') return;

        const result = room.gameEngine.submitDayAction(socket.id, actionType, targetId);
        socket.emit('mafiaActionResult', result);
    });

    socket.on('mafiaMoveLocation', ({ roomId, location }) => {
        const room = rooms[roomId];
        if (!room || room.gameType !== 'mafiaGame') return;

        // Only allow movement scheduling during Night
        if (room.gameEngine.phase === PHASES.NIGHT) {
            const result = room.gameEngine.scheduleMove(socket.id, location);
            if (result.success) {
                // We don't broadcast state update for secret moves, but we might want to acknowledge to the user
                socket.emit('mafiaMoveSuccess', { location });
            } else {
                socket.emit('mafiaMoveError', { error: result.error });
            }
        } else {
            socket.emit('mafiaMoveError', { error: 'Movement is only allowed at Night' });
        }
    });

    socket.on('mafiaAdvancePhase', ({ roomId }) => {
        const room = rooms[roomId];
        if (!room || room.gameType !== 'mafiaGame') return;

        // Check if host
        const player = room.players.find(p => p.id === socket.id);
        if (!player || !player.isHost) return;

        if (room.gameEngine.phase === PHASES.NIGHT) {
            processMafiaNight(roomId);
        } else {
            processMafiaDay(roomId);
        }
    });

    socket.on('mafiaGetPrivateData', ({ roomId }) => {
        const room = rooms[roomId];
        if (!room || room.gameType !== 'mafiaGame') return;

        const privateData = room.gameEngine.getPrivatePlayerData(socket.id);
        socket.emit('mafiaPrivateData', privateData);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        Object.values(rooms).forEach(room => {
            const index = room.players.findIndex(p => p.id === socket.id);
            if (index !== -1) {
                room.players.splice(index, 1);
                io.to(room.id).emit('roomUpdate', {
                    players: room.players,
                    roomName: room.name,
                    isPersistent: room.persistent
                });

                // If empty and not persistent, delete room
                if (room.players.length === 0 && !room.persistent) {
                    delete rooms[room.id];
                }
            }
        });
    });
});

function processRound(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    const engine = room.gameEngine;

    // 1. Apply Moves
    engine.applyMoves(room.moves);
    room.moves = {};

    // 2. Resolve Predation
    const predationResult = engine.resolvePredation();

    // 3. Update Hunger
    const hungerResult = engine.updateHunger();

    const logs = [...predationResult.logs, ...hungerResult.logs];
    io.to(roomId).emit('gameLogs', logs);

    // 4. Check Round End
    const isGameOver = engine.checkRoundEnd();

    if (isGameOver) {
        const winners = engine.calculateWinners();
        io.to(roomId).emit('gameOver', winners);
        room.phase = 'result';
    } else {
        room.phase = 'moving';
        io.to(roomId).emit('gameStateUpdate', {
            phase: room.phase,
            round: engine.round,
            players: room.players,
            locationMap: getLocationMap(room.players)
        });
    }
}

function getLocationMap(players) {
    const map = { Forest: [], Field: [], River: [], Sky: [] };
    players.forEach(p => {
        if (p.alive && p.location) {
            map[p.location].push(p);
        }
    });
    return map;
}

// Mafia Game Processing Functions
function processMafiaNight(roomId) {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'mafiaGame') return;

    const engine = room.gameEngine;

    // Process night actions
    const result = engine.processNightActions();

    // Send logs
    if (result.logs.length > 0) {
        io.to(roomId).emit('mafiaGameLogs', result.logs);
    }

    // Check win conditions
    const winCheck = engine.checkWinConditions();

    if (winCheck.gameOver) {
        io.to(roomId).emit('mafiaGameOver', {
            winners: winCheck.winners,
            allPlayers: engine.players.map(p => ({
                id: p.id,
                nickname: p.nickname,
                role: p.role,
                alive: p.alive
            }))
        });
        room.phase = 'result';
    } else {
        // Advance to day phase
        engine.advancePhase();
        room.phase = 'day';

        io.to(roomId).emit('mafiaGameStateUpdate', {
            phase: engine.phase,
            round: engine.round,
            players: engine.getPublicPlayerData(),
            locationCounts: engine.getLocationCounts()
        });

        // Update private data for players (scan results, wolf detection)
        room.players.forEach(p => {
            const privateData = engine.getPrivatePlayerData(p.id);
            io.to(p.id).emit('mafiaPrivateData', privateData);
        });
    }
}

function processMafiaDay(roomId) {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'mafiaGame') return;

    const engine = room.gameEngine;

    // Process day actions
    const result = engine.processDayActions();

    // Send logs
    if (result.logs.length > 0) {
        io.to(roomId).emit('mafiaGameLogs', result.logs);
    }

    // Check win conditions
    const winCheck = engine.checkWinConditions();

    if (winCheck.gameOver) {
        io.to(roomId).emit('mafiaGameOver', {
            winners: winCheck.winners,
            allPlayers: engine.players.map(p => ({
                id: p.id,
                nickname: p.nickname,
                role: p.role,
                alive: p.alive
            }))
        });
        room.phase = 'result';
    } else {
        // Advance to night phase
        engine.advancePhase();
        room.phase = 'night';

        io.to(roomId).emit('mafiaGameStateUpdate', {
            phase: engine.phase,
            round: engine.round,
            players: engine.getPublicPlayerData(),
            locationCounts: engine.getLocationCounts()
        });

        // Update private data for players
        room.players.forEach(p => {
            const privateData = engine.getPrivatePlayerData(p.id);
            io.to(p.id).emit('mafiaPrivateData', privateData);
        });
    }
}

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
