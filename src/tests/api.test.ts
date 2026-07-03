import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import { RoomService } from '../services/roomService.js';
import { PlayerSchema, BingoTypeSchema } from '../models/schemas.js';

// Minimal test to ensure schemas and services are importable and work as expected in an API context
describe('API logic', () => {
  it('validates player schema', () => {
    const player = { id: '123', firstName: 'John' };
    const result = PlayerSchema.safeParse(player);
    expect(result.success).toBe(true);
  });

  it('validates bingo type', () => {
    expect(BingoTypeSchema.safeParse('BINGO_75').success).toBe(true);
    expect(BingoTypeSchema.safeParse('INVALID').success).toBe(false);
  });
});
