import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoomService } from '../services/roomService.js';
import { RoomRepository } from '../repositories/roomRepository.js';
import { CardRepository } from '../repositories/cardRepository.js';
import { Player } from '../models/schemas.js';

vi.mock('../repositories/roomRepository.js');
vi.mock('../repositories/cardRepository.js');

describe('RoomService', () => {
  let roomService: RoomService;
  let mockRoomRepo: any;
  let mockCardRepo: any;

  beforeEach(() => {
    mockRoomRepo = new RoomRepository() as any;
    mockCardRepo = new CardRepository() as any;
    roomService = new RoomService(mockRoomRepo, mockCardRepo);
  });

  const host: Player = { id: 'host1', firstName: 'Host', joinedAt: new Date() };

  it('creates a room', async () => {
    mockRoomRepo.create.mockResolvedValue(undefined);
    const room = await roomService.createRoom(host, 'BINGO_75');
    expect(room.hostId).toBe(host.id);
    expect(room.players).toContainEqual(host);
    expect(mockRoomRepo.create).toHaveBeenCalled();
  });

  it('joins a player to a room', async () => {
    const player: Player = { id: 'p1', firstName: 'Player 1', joinedAt: new Date() };
    const room = { id: 'ROOM1', players: [host], status: 'WAITING' };
    mockRoomRepo.get.mockResolvedValue(room);
    mockRoomRepo.update.mockResolvedValue(undefined);

    const updatedRoom = await roomService.joinRoom('ROOM1', player);
    expect(updatedRoom.players).toHaveLength(2);
    expect(mockRoomRepo.update).toHaveBeenCalledWith('ROOM1', { players: [...room.players, player] });
  });

  it('starts a game and generates cards', async () => {
    const room = { id: 'ROOM1', players: [host], status: 'WAITING', type: 'BINGO_75', seed: 'seed' };
    mockRoomRepo.get.mockResolvedValue(room);
    mockRoomRepo.update.mockResolvedValue(undefined);
    mockCardRepo.save.mockResolvedValue(undefined);

    await roomService.startGame('ROOM1');
    expect(mockRoomRepo.update).toHaveBeenCalledWith('ROOM1', expect.objectContaining({ status: 'PLAYING' }));
    expect(mockCardRepo.save).toHaveBeenCalled();
  });
});
