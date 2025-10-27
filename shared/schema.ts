import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Cases table - represents legal cases the user is working on
export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  caseNumber: text("case_number"),
  plaintiff: text("plaintiff").notNull(),
  defendant: text("defendant").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  status: text("status").notNull().default("active"), // active, pending, closed
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Documents table - stores legal documents associated with cases
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  documentType: text("document_type").notNull(), // complaint, motion, response, discovery, brief, order, etc.
  content: text("content").notNull(), // extracted text content
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  aiAnalysis: jsonb("ai_analysis"), // stores AI-generated analysis
  complianceCheck: jsonb("compliance_check"), // stores Rule 12(b)(6) and other compliance results
  metadata: jsonb("metadata"), // stores parties, dates, citations, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Deadlines table - tracks important dates and filing deadlines
export const deadlines = pgTable("deadlines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  deadlineType: text("deadline_type").notNull(), // filing, hearing, response, discovery, etc.
  isCompleted: boolean("is_completed").default(false).notNull(),
  reminderSent: boolean("reminder_sent").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat messages table - stores AI assistant conversations
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").references(() => cases.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user or assistant
  content: text("content").notNull(),
  sources: jsonb("sources"), // stores citations and references
  metadata: jsonb("metadata"), // stores context like jurisdiction, document references
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Learning data table - stores patterns and improvements from document analysis
export const learningData = pgTable("learning_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // document_quality, compliance_patterns, jurisdiction_rules, etc.
  jurisdiction: text("jurisdiction"),
  documentType: text("document_type"),
  patterns: jsonb("patterns").notNull(), // stores learned patterns and improvements
  successMetrics: jsonb("success_metrics"), // tracks what worked well
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const casesRelations = relations(cases, ({ many }) => ({
  documents: many(documents),
  deadlines: many(deadlines),
  chatMessages: many(chatMessages),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  case: one(cases, {
    fields: [documents.caseId],
    references: [cases.id],
  }),
}));

export const deadlinesRelations = relations(deadlines, ({ one }) => ({
  case: one(cases, {
    fields: [deadlines.caseId],
    references: [cases.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  case: one(cases, {
    fields: [chatMessages.caseId],
    references: [cases.id],
  }),
}));

// Insert schemas
export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeadlineSchema = createInsertSchema(deadlines).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertLearningDataSchema = createInsertSchema(learningData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Case = typeof cases.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Deadline = typeof deadlines.$inferSelect;
export type InsertDeadline = z.infer<typeof insertDeadlineSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type LearningData = typeof learningData.$inferSelect;
export type InsertLearningData = z.infer<typeof insertLearningDataSchema>;
