import { z } from 'zod';

export const PlayerSchema = z.object({
  id: z.string(),
  username: z.string().optional(),
  firstName: z.string(),
  lastName: z.string().optional(),
  photoUrl: z.string().optional(),
  joinedAt: z.date().default(() => new Date()),
});

export type Player = z.infer<typeof PlayerSchema>;

export const BingoTypeSchema = z.enum(['BINGO_75', 'BINGO_90']);
export type BingoType = z.infer<typeof BingoTypeSchema>;

export const RoomStatusSchema = z.enum(['WAITING', 'PLAYING', 'FINISHED']);
export type RoomStatus = z.infer<typeof RoomStatusSchema>;

export const BingoCardSchema = z.object({
  playerId: z.string(),
  numbers: z.array(z.array(z.number().nullable())), // 2D array representing the card
  type: BingoTypeSchema,
});

export type BingoCard = z.infer<typeof BingoCardSchema>;

export const GameRoomSchema = z.object({
  id: z.string(),
  hostId: z.string(),
  type: BingoTypeSchema,
  status: RoomStatusSchema.default('WAITING'),
  players: z.array(PlayerSchema).default([]),
  drawnNumbers: z.array(z.number()).default([]),
  seed: z.string(),
  createdAt: z.date().default(() => new Date()),
  startedAt: z.date().optional(),
  finishedAt: z.date().optional(),
  winners: z.array(z.string()).default([]), // Player IDs
});

export type GameRoom = z.infer<typeof GameRoomSchema>;

export const GameEventSchema = z.object({
  type: z.enum(['PLAYER_JOINED', 'GAME_STARTED', 'NUMBER_DRAWN', 'BINGO_CLAIMED', 'GAME_FINISHED']),
  payload: z.any(),
  timestamp: z.date().default(() => new Date()),
});

export type GameEvent = z.infer<typeof GameEventSchema>;
