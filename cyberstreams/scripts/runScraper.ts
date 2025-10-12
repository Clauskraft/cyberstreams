/*
 * runScraper.ts
 *
 * This script demonstrates how to integrate the Crawlee web scraping
 * framework into the Cyberstreams project.  It fetches content from
 * configured RSS feeds and web pages, extracts the relevant text using
 * Crawlee/cheerio, and then invokes a Python process to update the
 * vector database used for retrieval‑augmented generation (RAG).
 *
 * Requirements:
 *   - Install Crawlee and its peer dependencies: `npm install @apify/crawlee`
 *   - Ensure Python environment has feedparser, beautifulsoup4 and scikit‑learn
 *     available for vectorization.
 *
 * Note: This script is a skeleton; adapt it to your specific feed sources
 * and extraction schema.  The integrated Admin page invokes this script
 * via an API endpoint (see /api/run-scraper).  When executed, the script
 * writes the updated vector DB to ./vector_db.pkl.
 */

import { CheerioCrawler, Dataset } from '@apify/crawlee'
import { promises as fs } from 'fs'
import path from 'path'
import { execFile } from 'child_process'

// Load the feed list.  In production you might fetch this from a
// database or configuration file; here we import the TypeScript module
// that defines it.  Note: dynamic import used because this script runs
// in Node (CommonJS) context.
async function loadFeeds() {
  const feedsModule = await import('../src/data/rssFeeds')
  return feedsModule.default
}

// Define a Crawlee crawler instance.  CheerioCrawler is efficient for
// static HTML pages.  For JavaScript heavy sites, use PuppeteerCrawler
// or PlaywrightCrawler instead.
async function crawlUrls(urls: string[]): Promise<string[]> {
  const dataset = await Dataset.open('scraped')
  const extractedTexts: string[] = []
  const crawler = new CheerioCrawler({
    maxConcurrency: 5,
    requestHandler: async ({ request, response, $, log }) => {
      try {
        // Extract all text from the body; adjust selectors to your needs
        const text = $('body').text()
        extractedTexts.push(text)
      } catch (err) {
        console.error(`Error parsing ${request.url}:`, err)
      }
    }
  })
  // Add requests to the queue
  for (const url of urls) {
    await crawler.addRequests([url])
  }
  await crawler.run()
  await dataset.drop()
  return extractedTexts
}

async function main() {
  const feeds = await loadFeeds()
  const urls = feeds.map((f: any) => f.url)
  // For demonstration, crawl the feed URLs directly.  For more advanced
  // extraction you may parse the RSS feed to get article links and then
  // crawl those pages instead.
  const texts = await crawlUrls(urls)
  // Combine texts into one JSON array for the Python script
  const tmpDir = path.join(__dirname, '..', '.tmp')
  await fs.mkdir(tmpDir, { recursive: true })
  const inputPath = path.join(tmpDir, 'scraped_texts.json')
  await fs.writeFile(inputPath, JSON.stringify(texts, null, 2), 'utf-8')
  // Call the Python script to update the vector DB.  The Python script
  // should read the JSON file, compute embeddings (e.g. TF‑IDF) and
  // save a pickled vector store to the expected location.
  const pythonScript = path.join(__dirname, 'update_vector_db.py')
  await new Promise<void>((resolve, reject) => {
    execFile('python', [pythonScript, inputPath], (error, stdout, stderr) => {
      if (error) {
        console.error('Python error:', stderr)
        return reject(error)
      }
      console.log(stdout)
      resolve()
    })
  })
}

main().catch(err => {
  console.error('Scraper failed:', err)
  process.exit(1)
})