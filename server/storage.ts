// server/storage.ts
import {
  cases,
  documents,
  deadlines,
  chatMessages,
  learningData,
  type Case,
  type InsertCase,
  type Document,
  type InsertDocument,
  type Deadline,
  type InsertDeadline,
  type ChatMessage,
  type InsertChatMessage,
  type LearningData,
  type InsertLearningData,
} from "../shared/schema.js"; // <-- ADDED .js
import { db } from "./db.js"; // <-- ADDED .js
import { eq, desc, and, gte, lt, isNull } from "drizzle-orm"; // <-- Includes isNull

export interface IStorage {
  // ... (interface is the same)
  getCases(): Promise<Case[]>;
  getCase(id: string): Promise<Case | undefined>;
  createCase(data: InsertCase): Promise<Case>;
  updateCase(id: string, data: Partial<InsertCase>): Promise<Case | undefined>;
  getDocuments(): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  getCaseDocuments(caseId: string): Promise<Document[]>;
  createDocument(data: InsertDocument): Promise<Document>;
  updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined>;
  getDeadlines(): Promise<Deadline[]>;
  getDeadline(id: string): Promise<Deadline | undefined>;
  getCaseDeadlines(caseId: string): Promise<Deadline[]>;
  getUpcomingDeadlines(): Promise<Deadline[]>;
  createDeadline(data: InsertDeadline): Promise<Deadline>;
  updateDeadline(id: string, data: Partial<InsertDeadline>): Promise<Deadline | undefined>;
  getChatMessages(caseId: string | null): Promise<ChatMessage[]>;
  createChatMessage(data: InsertChatMessage): Promise<ChatMessage>;
  getLearningData(category: string, jurisdiction?: string): Promise<LearningData[]>;
  createLearningData(data: InsertLearningData): Promise<LearningData>;
}

export class DatabaseStorage implements IStorage {
  // ... (all other functions are the same)
  async getCases(): Promise<Case[]> {
    return await db.select().from(cases).orderBy(desc(cases.createdAt));
  }

  async getCase(id: string): Promise<Case | undefined> {
    const [result] = await db.select().from(cases).where(eq(cases.id, id));
    return result || undefined;
  }

  async createCase(data: InsertCase): Promise<Case> {
    const [result] = await db.insert(cases).values(data).returning();
    return result;
  }

  async updateCase(id: string, data: Partial<InsertCase>): Promise<Case | undefined> {
    const [result] = await db
      .update(cases)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(cases.id, id))
      .returning();
    return result || undefined;
  }

  async getDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.createdAt));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [result] = await db.select().from(documents).where(eq(documents.id, id));
    return result || undefined;
  }

  async getCaseDocuments(caseId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.caseId, caseId))
      .orderBy(desc(documents.createdAt));
  }

  async createDocument(data: InsertDocument): Promise<Document> {
    const [result] = await db.insert(documents).values(data).returning();
    return result;
  }

  async updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined> {
    const [result] = await db
      .update(documents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return result || undefined;
  }

  async getDeadlines(): Promise<Deadline[]> {
    return await db.select().from(deadlines).orderBy(deadlines.dueDate);
  }

  async getDeadline(id: string): Promise<Deadline | undefined> {
    const [result] = await db.select().from(deadlines).where(eq(deadlines.id, id));
    return result || undefined;
  }

  async getCaseDeadlines(caseId: string): Promise<Deadline[]> {
    return await db
      .select()
      .from(deadlines)
      .where(eq(deadlines.caseId, caseId))
      .orderBy(deadlines.dueDate);
  }

  async getUpcomingDeadlines(): Promise<Deadline[]> {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return await db
      .select()
      .from(deadlines)
      .where(
        and(
          eq(deadlines.isCompleted, false),
          gte(deadlines.dueDate, now),
          lt(deadlines.dueDate, thirtyDaysFromNow)
        )
      )
      .orderBy(deadlines.dueDate);
  }

  async createDeadline(data: InsertDeadline): Promise<Deadline> {
    const [result] = await db.insert(deadlines).values(data).returning();
    return result;
  }

  async updateDeadline(id: string, data: Partial<InsertDeadline>): Promise<Deadline | undefined> {
    const [result] = await db
      .update(deadlines)
      .set(data)
      .where(eq(deadlines.id, id))
      .returning();
    return result || undefined;
  }

  // Chat Messages
  async getChatMessages(caseId: string | null): Promise<ChatMessage[]> {
    if (caseId) {
      return await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.caseId, caseId))
        .orderBy(chatMessages.createdAt);
    } else {
      // THIS IS THE DRIZZLE FIX
      return await db
        .select()
        .from(chatMessages)
        .where(isNull(chatMessages.caseId))
        .orderBy(chatMessages.createdAt);
    }
  }

  async createChatMessage(data: InsertChatMessage): Promise<ChatMessage> {
    const [result] = await db.insert(chatMessages).values(data).returning();
    return result;
  }

  async getLearningData(category: string, jurisdiction?: string): Promise<LearningData[]> {
    if (jurisdiction) {
      return await db
        .select()
        .from(learningData)
        .where(
          and(
            eq(learningData.category, category),
            eq(learningData.jurisdiction, jurisdiction)
          )
        )
        .orderBy(desc(learningData.createdAt));
    } else {
      return await db
        .select()
        .from(learningData)
        .where(eq(learningData.category, category))
        .orderBy(desc(learningData.createdAt));
    }
  }

  async createLearningData(data: InsertLearningData): Promise<LearningData> {
    const [result] = await db.insert(learningData).values(data).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
