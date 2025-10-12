// Cloudflare Worker for Cyberstreams
// Handles edge routing, caching, and API gateway functionality

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return handleCORS()
    }
    
    // Route API requests
    if (url.pathname.startsWith('/api/')) {
      return handleAPIRequest(request, env, ctx)
    }
    
    // Serve static assets with caching
    if (isStaticAsset(url.pathname)) {
      return handleStaticAsset(request, env, ctx)
    }
    
    // Default to serving the React app
    return handleSPARequest(request, env)
  }
}

function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  })
}

async function handleAPIRequest(request, env, ctx) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')
  
  // Check cache for GET requests
  if (request.method === 'GET') {
    const cacheKey = new Request(url.toString(), request)
    const cache = caches.default
    let response = await cache.match(cacheKey)
    
    if (response) {
      return response
    }
    
    // If not in cache, fetch from origin
    response = await fetchFromOrigin(request, env)
    
    // Cache successful responses
    if (response.status === 200) {
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'public, max-age=60')
      
      const cachedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      })
      
      ctx.waitUntil(cache.put(cacheKey, cachedResponse.clone()))
      return cachedResponse
    }
    
    return response
  }
  
  // Handle mutations (POST, PUT, DELETE)
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    // Authenticate request
    const authResult = await authenticateRequest(request, env)
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Route to appropriate handler
    switch (path) {
      case 'admin/keywords':
        return handleKeywordsAPI(request, env)
      case 'admin/sources':
        return handleSourcesAPI(request, env)
      case 'admin/rag-config':
        return handleRAGConfigAPI(request, env)
      case 'run-scraper':
        return handleScraperAPI(request, env, ctx)
      case 'search':
        return handleSearchAPI(request, env)
      default:
        return fetchFromOrigin(request, env)
    }
  }
  
  return fetchFromOrigin(request, env)
}

async function handleKeywordsAPI(request, env) {
  const method = request.method
  
  if (method === 'POST') {
    const data = await request.json()
    
    // Store in D1 database
    const stmt = env.DB.prepare(
      'INSERT INTO keywords (keyword, category, priority) VALUES (?, ?, ?)'
    ).bind(data.keyword, data.category, data.priority || 1)
    
    try {
      const result = await stmt.run()
      return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  return new Response('Method not allowed', { status: 405 })
}

async function handleSearchAPI(request, env) {
  const { query, limit = 10 } = await request.json()
  
  // Use Vectorize for similarity search
  try {
    // Generate embedding for query
    const embedding = await generateEmbedding(query, env)
    
    // Search in Vectorize
    const results = await env.VECTORSTORE.query({
      vector: embedding,
      topK: limit,
      namespace: 'documents'
    })
    
    // Enhance results with metadata from D1
    const enhancedResults = await enhanceSearchResults(results, env)
    
    return new Response(JSON.stringify(enhancedResults), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function handleScraperAPI(request, env, ctx) {
  // Queue scraper job using Cloudflare Queues or Durable Objects
  const job = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    status: 'queued'
  }
  
  // Store job in KV
  await env.CACHE.put(`job:${job.id}`, JSON.stringify(job), {
    expirationTtl: 3600 // 1 hour
  })
  
  // Trigger async processing
  ctx.waitUntil(runScraperJob(job.id, env))
  
  return new Response(JSON.stringify({
    message: 'Scraper job queued',
    jobId: job.id
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

async function runScraperJob(jobId, env) {
  try {
    // Update job status
    await env.CACHE.put(`job:${jobId}`, JSON.stringify({
      id: jobId,
      status: 'running',
      startedAt: new Date().toISOString()
    }), {
      expirationTtl: 3600
    })
    
    // Get active sources from D1
    const sources = await env.DB.prepare(
      'SELECT * FROM monitoring_sources WHERE active = 1'
    ).all()
    
    // Process each source
    for (const source of sources.results) {
      await processSingleSource(source, env)
    }
    
    // Update job status
    await env.CACHE.put(`job:${jobId}`, JSON.stringify({
      id: jobId,
      status: 'completed',
      completedAt: new Date().toISOString()
    }), {
      expirationTtl: 3600
    })
  } catch (err) {
    await env.CACHE.put(`job:${jobId}`, JSON.stringify({
      id: jobId,
      status: 'failed',
      error: err.message,
      failedAt: new Date().toISOString()
    }), {
      expirationTtl: 3600
    })
  }
}

async function processSingleSource(source, env) {
  try {
    // Fetch content from source
    const response = await fetch(source.url)
    const content = await response.text()
    
    // Extract text and generate embedding
    const text = extractText(content)
    const embedding = await generateEmbedding(text, env)
    
    // Store in Vectorize
    await env.VECTORSTORE.upsert({
      id: `doc_${Date.now()}`,
      vector: embedding,
      metadata: {
        sourceId: source.id,
        sourceUrl: source.url,
        timestamp: new Date().toISOString()
      },
      namespace: 'documents'
    })
    
    // Update last_scanned timestamp
    await env.DB.prepare(
      'UPDATE monitoring_sources SET last_scanned = ? WHERE id = ?'
    ).bind(new Date().toISOString(), source.id).run()
  } catch (err) {
    console.error(`Error processing source ${source.url}:`, err)
  }
}

async function generateEmbedding(text, env) {
  // Use Cloudflare AI for embeddings
  const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: text.slice(0, 512) // Limit text length
  })
  
  return response.data[0]
}

function extractText(html) {
  // Simple HTML to text extraction
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function enhanceSearchResults(results, env) {
  const enhanced = []
  
  for (const result of results.matches) {
    // Get document details from D1
    const doc = await env.DB.prepare(
      'SELECT * FROM document_embeddings WHERE id = ?'
    ).bind(result.id).first()
    
    if (doc) {
      enhanced.push({
        ...result,
        content: doc.content,
        metadata: JSON.parse(doc.metadata || '{}')
      })
    }
  }
  
  return enhanced
}

async function authenticateRequest(request, env) {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false }
  }
  
  const token = authHeader.substring(7)
  
  // Validate token (implement your auth logic here)
  // For now, check against environment variable
  if (token === env.API_KEY) {
    return { success: true }
  }
  
  return { success: false }
}

async function fetchFromOrigin(request, env) {
  const originUrl = env.ORIGIN_URL || 'http://localhost:3001'
  const url = new URL(request.url)
  url.hostname = new URL(originUrl).hostname
  url.port = new URL(originUrl).port
  
  return fetch(url.toString(), request)
}

function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2']
  return staticExtensions.some(ext => pathname.endsWith(ext))
}

async function handleStaticAsset(request, env, ctx) {
  const cache = caches.default
  let response = await cache.match(request)
  
  if (!response) {
    response = await env.ASSETS.fetch(request)
    
    if (response.status === 200) {
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      
      const cachedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      })
      
      ctx.waitUntil(cache.put(request, cachedResponse.clone()))
      return cachedResponse
    }
  }
  
  return response
}

async function handleSPARequest(request, env) {
  // Serve index.html for all non-API, non-static routes
  return env.ASSETS.fetch(new Request('https://placeholder.com/index.html', request))
}
