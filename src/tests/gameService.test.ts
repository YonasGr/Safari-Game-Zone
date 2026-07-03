import { describe, it, expect } from 'vitest';
import { GameService } from '../services/gameService.js';

describe('GameService', () => {
  it('generates valid 75-ball bingo cards', () => {
    const card = GameService.generateCard('player1', 'BINGO_75', 'seed123');
    expect(card.playerId).toBe('player1');
    expect(card.type).toBe('BINGO_75');
    expect(card.numbers).toHaveLength(5);
    expect(card.numbers[0]).toHaveLength(5);
    expect(card.numbers[2][2]).toBeNull(); // Free space
  });

  it('generates valid 90-ball bingo cards', () => {
    const card = GameService.generateCard('player2', 'BINGO_90', 'seed456');
    expect(card.type).toBe('BINGO_90');
    expect(card.numbers).toHaveLength(3);
    expect(card.numbers[0]).toHaveLength(9);

    // Check that each row has 5 numbers
    for (const row of card.numbers) {
      const nonNulls = row.filter(n => n !== null);
      expect(nonNulls).toHaveLength(5);
    }
  });

  it('detects a win in 75-ball bingo (horizontal)', () => {
    const card = GameService.generateCard('p1', 'BINGO_75', 's1');
    const row0 = card.numbers[0].filter(n => n !== null) as number[];
    expect(GameService.checkWin(card, row0)).toBe(true);
  });

  it('detects a win in 90-ball bingo (full house)', () => {
    const card = GameService.generateCard('p2', 'BINGO_90', 's2');
    const allNumbers: number[] = [];
    card.numbers.forEach(row => {
      row.forEach(num => {
        if (num !== null) allNumbers.push(num);
      });
    });
    expect(GameService.checkWin(card, allNumbers)).toBe(true);
    expect(GameService.checkWin(card, allNumbers.slice(0, 14))).toBe(false);
  });

  it('is deterministic with seed', () => {
    const card1 = GameService.generateCard('p1', 'BINGO_75', 'seed');
    const card2 = GameService.generateCard('p1', 'BINGO_75', 'seed');
    expect(card1.numbers).toEqual(card2.numbers);
  });
});
