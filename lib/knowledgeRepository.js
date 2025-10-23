import { randomUUID } from "crypto";
import logger from "./logger.js";

// In-memory knowledge repository for now
// In production, this would use a proper database
const knowledgeDocuments = new Map();

export default function createKnowledgeRepository() {
  function upsertDocument({
    title,
    content,
    tags = [],
    category = "general",
    source = "unknown",
    classification = "unclassified",
    relevance = "medium",
  }) {
    const id = randomUUID();
    const document = {
      id,
      title,
      content,
      tags,
      category,
      source,
      classification,
      relevance,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    knowledgeDocuments.set(id, document);
    logger.info(
      { documentId: id, title, category },
      "Knowledge document upserted"
    );

    return { id };
  }

  function search(query, { limit = 5 } = {}) {
    const queryLower = query.toLowerCase();
    const results = [];

    for (const [id, doc] of knowledgeDocuments) {
      const score = calculateRelevanceScore(doc, queryLower);
      if (score > 0) {
        results.push({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          snippet: doc.content.slice(0, 160),
          tags: doc.tags,
          category: doc.category,
          source: doc.source,
          classification: doc.classification,
          relevance: doc.relevance,
          score,
          createdAt: doc.createdAt,
        });
      }
    }

    // Sort by relevance score and limit results
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  function calculateRelevanceScore(doc, queryLower) {
    let score = 0;

    // Title match (highest weight)
    if (doc.title.toLowerCase().includes(queryLower)) {
      score += 10;
    }

    // Content match
    if (doc.content.toLowerCase().includes(queryLower)) {
      score += 5;
    }

    // Tag match
    for (const tag of doc.tags) {
      if (tag.toLowerCase().includes(queryLower)) {
        score += 3;
      }
    }

    // Category match
    if (doc.category.toLowerCase().includes(queryLower)) {
      score += 2;
    }

    // Source match
    if (doc.source.toLowerCase().includes(queryLower)) {
      score += 1;
    }

    return score;
  }

  function listDocuments() {
    return Array.from(knowledgeDocuments.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  function getStats() {
    const documents = Array.from(knowledgeDocuments.values());
    const categories = [...new Set(documents.map((doc) => doc.category))];

    // Build category counts
    const categoryCounts = {};
    for (const doc of documents) {
      const cat = doc.category || 'Uncategorized';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    return {
      totalDocuments: documents.length,
      categories: categories.length,
      categoryCounts,
      categoryBreakdown: categories.map((cat) => ({
        category: cat,
        count: documents.filter((doc) => doc.category === cat).length,
      })),
      classificationBreakdown: {
        unclassified: documents.filter(
          (doc) => doc.classification === "unclassified"
        ).length,
        confidential: documents.filter(
          (doc) => doc.classification === "confidential"
        ).length,
        secret: documents.filter((doc) => doc.classification === "secret")
          .length,
        top_secret: documents.filter(
          (doc) => doc.classification === "top_secret"
        ).length,
      },
      relevanceBreakdown: {
        low: documents.filter((doc) => doc.relevance === "low").length,
        medium: documents.filter((doc) => doc.relevance === "medium").length,
        high: documents.filter((doc) => doc.relevance === "high").length,
        critical: documents.filter((doc) => doc.relevance === "critical")
          .length,
      },
    };
  }

  function getDocument(id) {
    return knowledgeDocuments.get(id);
  }

  function deleteDocument(id) {
    const deleted = knowledgeDocuments.delete(id);
    if (deleted) {
      logger.info({ documentId: id }, "Knowledge document deleted");
    }
    return deleted;
  }

  return {
    upsertDocument,
    search,
    listDocuments,
    getStats,
    getDocument,
    deleteDocument,
  };
}
