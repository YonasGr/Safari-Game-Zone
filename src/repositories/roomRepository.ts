import admin from 'firebase-admin';
import { db } from '../core/firebase.js';
import { GameRoom, GameRoomSchema } from '../models/schemas.js';

export class RoomRepository {
  private collection = db.collection('rooms');

  async create(room: GameRoom): Promise<void> {
    await this.collection.doc(room.id).set({
      ...room,
      createdAt: admin.firestore.Timestamp.fromDate(room.createdAt),
      startedAt: room.startedAt ? admin.firestore.Timestamp.fromDate(room.startedAt) : null,
      finishedAt: room.finishedAt ? admin.firestore.Timestamp.fromDate(room.finishedAt) : null,
    });
  }

  async get(id: string): Promise<GameRoom | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    return GameRoomSchema.parse({
      ...data,
      createdAt: (data.createdAt as admin.firestore.Timestamp).toDate(),
      startedAt: data.startedAt ? (data.startedAt as admin.firestore.Timestamp).toDate() : undefined,
      finishedAt: data.finishedAt ? (data.finishedAt as admin.firestore.Timestamp).toDate() : undefined,
    });
  }

  async update(id: string, data: Partial<GameRoom>): Promise<void> {
    const updateData: any = { ...data };
    if (data.createdAt) updateData.createdAt = admin.firestore.Timestamp.fromDate(data.createdAt);
    if (data.startedAt) updateData.startedAt = admin.firestore.Timestamp.fromDate(data.startedAt);
    if (data.finishedAt) updateData.finishedAt = admin.firestore.Timestamp.fromDate(data.finishedAt);

    await this.collection.doc(id).update(updateData);
  }
}
