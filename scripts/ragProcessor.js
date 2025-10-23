// RAG Processor for Cyberstreams
// Handles document processing through retrieval-augmented generation pipeline

const OpenAI = require('openai')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/cyberstreams'
})

class RAGProcessor {
  constructor(config) {
    this.config = config
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  async processDocuments(documents, keywords) {
    const results = []
    
    for (const doc of documents) {
      try {
        // Generate embedding for document
        const embedding = await this.generateEmbedding(doc.content)
        
        // Store in vector database
        await this.storeEmbedding(doc, embedding)
        
        // Check for keyword matches and relevance
        const analysis = await this.analyzeDocument(doc, keywords)
        
        // Store analysis results
        if (analysis.relevance > 0.7) {
          await this.storeAnalysis(doc, analysis)
          results.push(analysis)
        }
      } catch (err) {
        console.error('Error processing document:', err)
      }
    }
    
    return results
  }

  async generateEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: this.config.embeddingModel || 'text-embedding-ada-002',
        input: text.slice(0, 8000) // Limit text length
      })
      
      return response.data[0].embedding
    } catch (err) {
      console.error('Error generating embedding:', err)
      return null
    }
  }

  async storeEmbedding(doc, embedding) {
    if (!embedding) return
    
    try {
      await pool.query(
        `INSERT INTO document_embeddings (document_id, content, embedding, metadata) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (document_id) 
         DO UPDATE SET 
           content = $2, 
           embedding = $3, 
           metadata = $4, 
           created_at = CURRENT_TIMESTAMP`,
        [
          doc.id || `doc_${Date.now()}`,
          doc.content,
          `[${embedding.join(',')}]`,
          JSON.stringify({
            source: doc.source,
            timestamp: doc.timestamp,
            keywords: doc.keywords_matched
          })
        ]
      )
    } catch (err) {
      console.error('Error storing embedding:', err)
    }
  }

  async analyzeDocument(doc, keywords) {
    try {
      // Create context from document and keywords
      const prompt = this.createAnalysisPrompt(doc, keywords)
      
      // Get LLM analysis
      const response = await this.openai.chat.completions.create({
        model: this.config.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a cybersecurity analyst specializing in threat intelligence. Analyze the given document for security threats, vulnerabilities, and indicators of compromise.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: parseFloat(this.config.temperature) || 0.7,
        max_tokens: parseInt(this.config.maxTokens) || 2000
      })
      
      const analysis = response.choices[0].message.content
      
      // Parse the response
      return this.parseAnalysis(analysis, doc, keywords)
    } catch (err) {
      console.error('Error analyzing document:', err)
      return {
        relevance: 0,
        summary: '',
        threats: [],
        keywords_matched: []
      }
    }
  }

  createAnalysisPrompt(doc, keywords) {
    return `
Analyze the following document for cybersecurity threats and relevance to these keywords: ${keywords.map(k => k.keyword).join(', ')}

Document:
${doc.content.slice(0, 4000)}

Please provide:
1. Relevance score (0-1) for security threat importance
2. Summary of key threats or vulnerabilities found
3. List of matched keywords with context
4. Recommended actions if applicable

Format your response as JSON with keys: relevance, summary, threats, keywords_matched, recommendations
`
  }

  parseAnalysis(analysisText, doc, keywords) {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(analysisText)
      return {
        ...parsed,
        document_id: doc.id,
        timestamp: new Date()
      }
    } catch (err) {
      // Fallback parsing if not valid JSON
      const keywordsFound = keywords.filter(k => 
        doc.content.toLowerCase().includes(k.keyword.toLowerCase())
      )
      
      return {
        relevance: keywordsFound.length > 0 ? 0.5 : 0.1,
        summary: analysisText.slice(0, 500),
        threats: [],
        keywords_matched: keywordsFound.map(k => k.keyword),
        document_id: doc.id,
        timestamp: new Date()
      }
    }
  }

  async storeAnalysis(doc, analysis) {
    try {
      await pool.query(
        `INSERT INTO rag_outputs (input_text, processed_output, keywords_matched, confidence_score) 
         VALUES ($1, $2, $3, $4)`,
        [
          doc.content.slice(0, 1000),
          JSON.stringify(analysis),
          analysis.keywords_matched || [],
          analysis.relevance || 0
        ]
      )
    } catch (err) {
      console.error('Error storing analysis:', err)
    }
  }

  async retrieveSimilarDocuments(query, limit = 5) {
    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(query)
      
      if (!queryEmbedding) {
        throw new Error('Failed to generate query embedding')
      }
      
      // Search for similar documents using vector similarity
      const result = await pool.query(
        `SELECT content, metadata, 
         1 - (embedding <=> $1::vector) as similarity
         FROM document_embeddings 
         ORDER BY embedding <=> $1::vector 
         LIMIT $2`,
        [`[${queryEmbedding.join(',')}]`, limit]
      )
      
      return result.rows
    } catch (err) {
      console.error('Error retrieving similar documents:', err)
      return []
    }
  }

  async generateResponse(query, context) {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a cybersecurity intelligence analyst. Use the provided context to answer questions about threats and vulnerabilities.'
          },
          {
            role: 'user',
            content: `Context:\n${context.map(c => c.content).join('\n\n')}\n\nQuestion: ${query}`
          }
        ],
        temperature: parseFloat(this.config.temperature) || 0.7,
        max_tokens: parseInt(this.config.maxTokens) || 2000
      })
      
      return response.choices[0].message.content
    } catch (err) {
      console.error('Error generating response:', err)
      return 'Unable to generate response at this time.'
    }
  }
}

// Main execution when called from server
if (require.main === module) {
  const input = JSON.parse(process.argv[2])
  const processor = new RAGProcessor(input.config)
  
  processor.processDocuments(input.documents, input.keywords)
    .then(results => {
      console.log(JSON.stringify({ 
        processed: results.length,
        highPriority: results.filter(r => r.relevance > 0.8).length 
      }))
      process.exit(0)
    })
    .catch(err => {
      console.error('Processing failed:', err)
      process.exit(1)
    })
}

module.exports = RAGProcessor
