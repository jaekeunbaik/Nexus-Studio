import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameEngine, ROLES } from './GameEngine.js';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all for dev
        methods: ["GET", "POST"]
    }
});

// In-memory storage
const rooms = {}; // roomId -> { id, name, players: [], gameEngine: instance, phase: 'lobby', moves: {}, persistent: boolean }

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

    socket.on('startGame', ({ roomId, gameType }) => {
        const room = rooms[roomId];
        if (!room) return;

        // Reset game state if needed
        room.gameEngine = new GameEngine(); // Fresh engine

        // Assign Roles
        const roles = Object.values(ROLES);
        const shuffledRoles = roles.sort(() => 0.5 - Math.random());

        room.players.forEach((p, i) => {
            p.role = shuffledRoles[i % shuffledRoles.length];
            p.alive = true;
            p.hunger = 0;
            p.location = 'Forest';
        });

        room.gameEngine.initRound(room.players);
        room.phase = 'moving';

        io.to(roomId).emit('gameStarted', { gameType }); // Tell clients which game started
        io.to(roomId).emit('gameStateUpdate', {
            phase: room.phase,
            round: room.gameEngine.round,
            players: room.players,
            locationMap: getLocationMap(room.players)
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
            // If player exists, update their socket ID? 
            // For now, just send state. If they are new (refresh), they might need to be added?
            // If game is in progress, we can't easily add them as a player with a role unless we persist player sessions.
            // For this MVP, we'll just send the current state.

            // Send state only to the rejoining client
            socket.emit('gameStateUpdate', {
                phase: room.phase,
                round: room.gameEngine ? room.gameEngine.round : 1,
                players: room.players,
                locationMap: room.gameEngine ? getLocationMap(room.players) : {}
            });
        }
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

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
