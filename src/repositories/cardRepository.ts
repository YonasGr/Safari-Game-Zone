import { db } from '../core/firebase.js';
import { BingoCard, BingoCardSchema } from '../models/schemas.js';

export class CardRepository {
  private collection = db.collection('cards');

  async save(roomId: string, card: BingoCard): Promise<void> {
    const id = `${roomId}_${card.playerId}`;
    await this.collection.doc(id).set({
      ...card,
      roomId,
    });
  }

  async get(roomId: string, playerId: string): Promise<BingoCard | null> {
    const id = `${roomId}_${playerId}`;
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return BingoCardSchema.parse(doc.data());
  }

  async getByRoom(roomId: string): Promise<BingoCard[]> {
    const snapshot = await this.collection.where('roomId', '==', roomId).get();
    return snapshot.docs.map(doc => BingoCardSchema.parse(doc.data()));
  }
}
