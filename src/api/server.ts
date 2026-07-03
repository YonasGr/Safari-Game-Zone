import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { RoomService } from '../services/roomService.js';
import { RoomRepository } from '../repositories/roomRepository.js';
import { CardRepository } from '../repositories/cardRepository.js';
import { PlayerSchema, BingoTypeSchema } from '../models/schemas.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../static')));

const roomRepo = new RoomRepository();
const cardRepo = new CardRepository();
const roomService = new RoomService(roomRepo, cardRepo);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create Room
app.post('/api/rooms', async (req, res) => {
  try {
    const { host, type } = req.body;
    const validatedHost = PlayerSchema.parse(host);
    const validatedType = BingoTypeSchema.parse(type);
    const room = await roomService.createRoom(validatedHost, validatedType);
    res.status(201).json(room);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Join Room
app.post('/api/rooms/:id/join', async (req, res) => {
  try {
    const { player } = req.body;
    const validatedPlayer = PlayerSchema.parse(player);
    const room = await roomService.joinRoom(req.params.id, validatedPlayer);

    io.to(req.params.id).emit('player_joined', { player: validatedPlayer });
    res.json(room);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get Room State
app.get('/api/rooms/:id', async (req, res) => {
    try {
      const room = await roomRepo.get(req.params.id);
      if (!room) return res.status(404).json({ error: 'Room not found' });
      res.json(room);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
});

// Get Card
app.get('/api/rooms/:roomId/cards/:playerId', async (req, res) => {
    try {
      const card = await cardRepo.get(req.params.roomId, req.params.playerId);
      if (!card) return res.status(404).json({ error: 'Card not found' });
      res.json(card);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
});

// WebSocket Events
io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('start_game', async (roomId) => {
    try {
      const room = await roomService.startGame(roomId);
      io.to(roomId).emit('game_started', room);
    } catch (error: any) {
      socket.emit('error', error.message);
    }
  });

  socket.on('draw_number', async (roomId) => {
    try {
      const number = await roomService.drawNumber(roomId);
      if (number !== null) {
        io.to(roomId).emit('number_drawn', { number });
      }
    } catch (error: any) {
      socket.emit('error', error.message);
    }
  });

  socket.on('claim_bingo', async ({ roomId, playerId }) => {
    try {
      const success = await roomService.claimBingo(roomId, playerId);
      if (success) {
        const room = await roomRepo.get(roomId);
        io.to(roomId).emit('bingo_claimed', { playerId, room });
      } else {
        socket.emit('error', 'Invalid Bingo claim');
      }
    } catch (error: any) {
      socket.emit('error', error.message);
    }
  });
});

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
