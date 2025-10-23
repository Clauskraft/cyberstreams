import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Load knowledge base data
let knowledgeBase = null;

async function loadKnowledgeBase() {
  if (!knowledgeBase) {
    try {
      const dataPath = path.join(__dirname, "../data/knowledge-base.json");
      const data = await fs.readFile(dataPath, "utf-8");
      knowledgeBase = JSON.parse(data);
    } catch (error) {
      console.error("Failed to load knowledge base:", error);
      knowledgeBase = { categories: {}, search_index: { keywords: {} } };
    }
  }
  return knowledgeBase;
}

// Search knowledge base
router.post("/search", async (req, res) => {
  try {
    const { query, category, limit = 10 } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Query parameter is required"
      });
    }

    const kb = await loadKnowledgeBase();
    const results = [];
    const queryLower = query.toLowerCase();

    // Search through all categories and articles
    for (const [categoryKey, categoryData] of Object.entries(kb.categories)) {
      if (category && category !== categoryKey) continue;
      
      if (categoryData.articles) {
        for (const article of categoryData.articles) {
          const searchText = [
            article.title,
            article.summary,
            article.content,
            ...(article.tags || [])
          ].join(" ").toLowerCase();

          if (searchText.includes(queryLower)) {
            results.push({
              ...article,
              category: categoryKey,
              categoryName: categoryData.name,
              relevanceScore: calculateRelevance(queryLower, searchText)
            });
          }
        }
      }
    }

    // Sort by relevance and limit results
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const limitedResults = results.slice(0, limit);

    res.json({
      success: true,
      data: {
        query,
        results: limitedResults,
        totalResults: results.length,
        categories: Object.keys(kb.categories).map(key => ({
          key,
          name: kb.categories[key].name,
          description: kb.categories[key].description,
          articleCount: kb.categories[key].articles?.length || 0
        }))
      }
    });

  } catch (error) {
    console.error("Knowledge base search error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// Get knowledge base categories
router.get("/categories", async (req, res) => {
  try {
    const kb = await loadKnowledgeBase();
    
    const categories = Object.entries(kb.categories).map(([key, data]) => ({
      key,
      name: data.name,
      description: data.description,
      articleCount: data.articles?.length || 0
    }));

    res.json({
      success: true,
      data: {
        categories,
        totalCategories: categories.length,
        totalArticles: categories.reduce((sum, cat) => sum + cat.articleCount, 0)
      }
    });

  } catch (error) {
    console.error("Knowledge base categories error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// Get articles by category
router.get("/category/:categoryKey", async (req, res) => {
  try {
    const { categoryKey } = req.params;
    const kb = await loadKnowledgeBase();
    
    const category = kb.categories[categoryKey];
    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found"
      });
    }

    res.json({
      success: true,
      data: {
        category: {
          key: categoryKey,
          name: category.name,
          description: category.description
        },
        articles: category.articles || [],
        articleCount: category.articles?.length || 0
      }
    });

  } catch (error) {
    console.error("Knowledge base category error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// Get specific article
router.get("/article/:articleId", async (req, res) => {
  try {
    const { articleId } = req.params;
    const kb = await loadKnowledgeBase();
    
    // Search for article across all categories
    for (const [categoryKey, categoryData] of Object.entries(kb.categories)) {
      if (categoryData.articles) {
        const article = categoryData.articles.find(a => a.id === articleId);
        if (article) {
          return res.json({
            success: true,
            data: {
              ...article,
              category: categoryKey,
              categoryName: categoryData.name
            }
          });
        }
      }
    }

    res.status(404).json({
      success: false,
      error: "Article not found"
    });

  } catch (error) {
    console.error("Knowledge base article error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// Get knowledge base statistics
router.get("/stats", async (req, res) => {
  try {
    const kb = await loadKnowledgeBase();
    
    const stats = {
      totalCategories: Object.keys(kb.categories).length,
      totalArticles: 0,
      categoryBreakdown: {},
      topTags: {},
      lastUpdated: kb.metadata?.lastUpdated || "Unknown"
    };

    // Calculate statistics
    for (const [categoryKey, categoryData] of Object.entries(kb.categories)) {
      const articleCount = categoryData.articles?.length || 0;
      stats.totalArticles += articleCount;
      stats.categoryBreakdown[categoryKey] = {
        name: categoryData.name,
        articleCount
      };

      // Count tags
      if (categoryData.articles) {
        for (const article of categoryData.articles) {
          if (article.tags) {
            for (const tag of article.tags) {
              stats.topTags[tag] = (stats.topTags[tag] || 0) + 1;
            }
          }
        }
      }
    }

    // Sort top tags
    stats.topTags = Object.entries(stats.topTags)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .reduce((obj, [tag, count]) => {
        obj[tag] = count;
        return obj;
      }, {});

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Knowledge base stats error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// Helper function to calculate relevance score
function calculateRelevance(query, text) {
  const queryWords = query.split(/\s+/);
  let score = 0;
  
  for (const word of queryWords) {
    const regex = new RegExp(word, "gi");
    const matches = text.match(regex);
    if (matches) {
      score += matches.length;
    }
  }
  
  // Boost score for title matches
  if (text.includes(query)) {
    score += 10;
  }
  
  return score;
}

export default router;
