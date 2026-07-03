import { RoomRepository } from '../repositories/roomRepository.js';
import { CardRepository } from '../repositories/cardRepository.js';
import { GameService } from './gameService.js';
import { GameRoom, Player, BingoType, RoomStatus } from '../models/schemas.js';
import { v4 as uuidv4 } from 'uuid';

export class RoomService {
  constructor(
    private roomRepo: RoomRepository,
    private cardRepo: CardRepository
  ) {}

  async createRoom(host: Player, type: BingoType): Promise<GameRoom> {
    const room: GameRoom = {
      id: Math.random().toString(36).substring(2, 8).toUpperCase(),
      hostId: host.id,
      type,
      status: 'WAITING',
      players: [host],
      drawnNumbers: [],
      seed: uuidv4(),
      createdAt: new Date(),
      winners: [],
    };
    await this.roomRepo.create(room);
    return room;
  }

  async joinRoom(roomId: string, player: Player): Promise<GameRoom> {
    const room = await this.roomRepo.get(roomId);
    if (!room) throw new Error('Room not found');
    if (room.status !== 'WAITING') throw new Error('Game already started');
    if (room.players.find(p => p.id === player.id)) return room;

    const updatedPlayers = [...room.players, player];
    await this.roomRepo.update(roomId, { players: updatedPlayers });
    return { ...room, players: updatedPlayers };
  }

  async startGame(roomId: string): Promise<GameRoom> {
    const room = await this.roomRepo.get(roomId);
    if (!room) throw new Error('Room not found');
    if (room.status !== 'WAITING') throw new Error('Room not in waiting status');

    const startedAt = new Date();
    await this.roomRepo.update(roomId, { status: 'PLAYING', startedAt });

    // Generate cards for all players
    for (const player of room.players) {
      const card = GameService.generateCard(player.id, room.type, room.seed);
      await this.cardRepo.save(roomId, card);
    }

    return { ...room, status: 'PLAYING', startedAt };
  }

  async drawNumber(roomId: string): Promise<number | null> {
    const room = await this.roomRepo.get(roomId);
    if (!room || room.status !== 'PLAYING') return null;

    const max = room.type === 'BINGO_75' ? 75 : 90;
    if (room.drawnNumbers.length >= max) return null;

    const allDrawn = GameService.drawNumbers(room.type, room.seed, room.drawnNumbers.length + 1);
    const newNumber = allDrawn[allDrawn.length - 1];

    const updatedDrawn = [...room.drawnNumbers, newNumber];
    await this.roomRepo.update(roomId, { drawnNumbers: updatedDrawn });

    return newNumber;
  }

  async claimBingo(roomId: string, playerId: string): Promise<boolean> {
    const room = await this.roomRepo.get(roomId);
    if (!room || room.status !== 'PLAYING') return false;

    const card = await this.cardRepo.get(roomId, playerId);
    if (!card) return false;

    const isWin = GameService.checkWin(card, room.drawnNumbers);
    if (isWin) {
      const updatedWinners = [...room.winners, playerId];
      const updates: Partial<GameRoom> = { winners: updatedWinners };

      // End game if it's the first winner (or custom logic)
      if (updatedWinners.length === 1) {
        updates.status = 'FINISHED';
        updates.finishedAt = new Date();
      }

      await this.roomRepo.update(roomId, updates);
      return true;
    }

    return false;
  }
}
