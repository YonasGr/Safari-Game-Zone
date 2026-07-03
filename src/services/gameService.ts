import { BingoType, BingoCard } from '../models/schemas.js';

export class GameService {
  /**
   * Generates a seeded random number generator.
   */
  private static mulberry32(a: number) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }

  /**
   * Generates a bingo card for a player.
   */
  static generateCard(playerId: string, type: BingoType, seed: string): BingoCard {
    const combinedSeed = this.hashString(playerId + seed);
    const rng = this.mulberry32(combinedSeed);

    if (type === 'BINGO_75') {
      return {
        playerId,
        type,
        numbers: this.generate75Card(rng),
      };
    } else {
      return {
        playerId,
        type,
        numbers: this.generate90Card(rng),
      };
    }
  }

  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private static generate75Card(rng: () => number): (number | null)[][] {
    const card: (number | null)[][] = Array.from({ length: 5 }, () => Array(5).fill(null));
    const ranges = [
      [1, 15], [16, 30], [31, 45], [46, 60], [61, 75]
    ];

    for (let col = 0; col < 5; col++) {
      const [min, max] = ranges[col];
      const possibleNumbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);

      // Shuffle possible numbers
      for (let i = possibleNumbers.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [possibleNumbers[i], possibleNumbers[j]] = [possibleNumbers[j], possibleNumbers[i]];
      }

      for (let row = 0; row < 5; row++) {
        if (col === 2 && row === 2) {
          card[row][col] = null; // Free space
        } else {
          card[row][col] = possibleNumbers[row];
        }
      }
    }
    return card;
  }

  private static generate90Card(rng: () => number): (number | null)[][] {
    const card: (number | null)[][] = Array.from({ length: 3 }, () => Array(9).fill(null));
    const columns: number[][] = Array.from({ length: 9 }, () => []);

    // Each column gets at least one number
    for (let col = 0; col < 9; col++) {
        const min = col === 0 ? 1 : col * 10;
        const max = col === 8 ? 90 : col * 10 + 9;
        const possible = Array.from({ length: max - min + 1 }, (_, i) => min + i);
        // Shuffle
        for (let i = possible.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [possible[i], possible[j]] = [possible[j], possible[i]];
        }
        columns[col] = possible.slice(0, 3).sort((a, b) => a - b);
    }

    // Assign numbers to rows, ensuring each row has exactly 5 numbers
    for (let row = 0; row < 3; row++) {
        const colsToFill = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        // Shuffle columns to pick 5
        for (let i = colsToFill.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [colsToFill[i], colsToFill[j]] = [colsToFill[j], colsToFill[i]];
        }
        const selectedCols = colsToFill.slice(0, 5).sort((a, b) => a - b);
        for (const col of selectedCols) {
            card[row][col] = columns[col].pop() || null;
        }
    }

    return card;
  }

  /**
   * Checks if a card has a winning pattern.
   */
  static checkWin(card: BingoCard, drawnNumbers: number[]): boolean {
    const drawnSet = new Set(drawnNumbers);
    const numbers = card.numbers;

    if (card.type === 'BINGO_75') {
      // 75-ball: horizontal, vertical, or diagonal
      // Horizontal
      for (let r = 0; r < 5; r++) {
        if (numbers[r].every(num => num === null || drawnSet.has(num))) return true;
      }
      // Vertical
      for (let c = 0; c < 5; c++) {
        let win = true;
        for (let r = 0; r < 5; r++) {
          const num = numbers[r][c];
          if (num !== null && !drawnSet.has(num)) {
            win = false;
            break;
          }
        }
        if (win) return true;
      }
      // Diagonals
      let diag1 = true;
      let diag2 = true;
      for (let i = 0; i < 5; i++) {
        const n1 = numbers[i][i];
        const n2 = numbers[i][4 - i];
        if (n1 !== null && !drawnSet.has(n1)) diag1 = false;
        if (n2 !== null && !drawnSet.has(n2)) diag2 = false;
      }
      if (diag1 || diag2) return true;

    } else if (card.type === 'BINGO_90') {
      // 90-ball: typically full house (all 15 numbers)
      let count = 0;
      let matchCount = 0;
      for (const row of numbers) {
        for (const num of row) {
          if (num !== null) {
            count++;
            if (drawnSet.has(num)) matchCount++;
          }
        }
      }
      return count > 0 && count === matchCount;
    }

    return false;
  }

  static drawNumbers(type: BingoType, seed: string, count: number): number[] {
    const rng = this.mulberry32(this.hashString(seed));
    const max = type === 'BINGO_75' ? 75 : 90;
    const allNumbers = Array.from({ length: max }, (_, i) => i + 1);

    // Shuffle all numbers
    for (let i = allNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [allNumbers[i], allNumbers[j]] = [allNumbers[j], allNumbers[i]];
    }

    return allNumbers.slice(0, count);
  }
}
