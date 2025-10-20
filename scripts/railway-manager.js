#!/usr/bin/env node
/**
 * Railway Release Manager Script
 * 
 * This script helps manage Railway deployments by:
 * - Checking deployment status
 * - Running health checks
 * - Generating deployment reports
 * - Managing deployment history
 */

import https from 'https'
import http from 'http'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const RAILWAY_APP_URL = process.env.RAILWAY_APP_URL || process.env.PUBLIC_URL || ''
const DEPLOYMENT_HISTORY_FILE = '.railway-deployments.json'

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const client = urlObj.protocol === 'https:' ? https : http

    const req = client.get(url, { timeout }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: data,
            json: JSON.parse(data)
          })
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data,
            json: null
          })
        }
      })
    })

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
  })
}

/**
 * Check health endpoint
 */
async function checkHealth(url) {
  try {
    const healthUrl = `${url}/api/health`
    console.log(`Checking health at: ${healthUrl}`)
    
    const response = await makeRequest(healthUrl, 15000)
    
    return {
      success: response.statusCode === 200,
      statusCode: response.statusCode,
      data: response.json,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Load deployment history
 */
function loadDeploymentHistory() {
  try {
    if (existsSync(DEPLOYMENT_HISTORY_FILE)) {
      const data = readFileSync(DEPLOYMENT_HISTORY_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.warn('Could not load deployment history:', error.message)
  }
  return { deployments: [] }
}

/**
 * Save deployment history
 */
function saveDeploymentHistory(history) {
  try {
    writeFileSync(
      DEPLOYMENT_HISTORY_FILE,
      JSON.stringify(history, null, 2),
      'utf8'
    )
  } catch (error) {
    console.error('Could not save deployment history:', error.message)
  }
}

/**
 * Add deployment record
 */
function recordDeployment(status, healthCheck) {
  const history = loadDeploymentHistory()
  
  const deployment = {
    timestamp: new Date().toISOString(),
    status: status,
    commit: process.env.GITHUB_SHA?.substring(0, 7) || 'unknown',
    branch: process.env.GITHUB_REF_NAME || 'unknown',
    actor: process.env.GITHUB_ACTOR || 'unknown',
    healthCheck: healthCheck,
    url: RAILWAY_APP_URL
  }
  
  history.deployments.unshift(deployment)
  
  // Keep last 50 deployments
  if (history.deployments.length > 50) {
    history.deployments = history.deployments.slice(0, 50)
  }
  
  saveDeploymentHistory(history)
  return deployment
}

/**
 * Generate deployment report
 */
function generateReport() {
  const history = loadDeploymentHistory()
  const deployments = history.deployments || []
  
  if (deployments.length === 0) {
    console.log('\n📊 No deployment history found\n')
    return
  }
  
  console.log('\n📊 Railway Deployment Report')
  console.log('═'.repeat(60))
  
  const recent = deployments.slice(0, 10)
  const successCount = recent.filter(d => d.status === 'success').length
  const failureCount = recent.filter(d => d.status === 'failure').length
  const successRate = Math.round((successCount / recent.length) * 100)
  
  console.log(`\n📈 Statistics (Last ${recent.length} deployments)`)
  console.log(`   Success Rate: ${successRate}%`)
  console.log(`   Successful: ${successCount}`)
  console.log(`   Failed: ${failureCount}`)
  
  console.log('\n📋 Recent Deployments:')
  console.log('─'.repeat(60))
  
  recent.forEach((deployment, index) => {
    const statusIcon = deployment.status === 'success' ? '✅' : '❌'
    const healthIcon = deployment.healthCheck?.success ? '💚' : '💔'
    
    console.log(`\n${index + 1}. ${statusIcon} ${deployment.timestamp}`)
    console.log(`   Commit: ${deployment.commit}`)
    console.log(`   Branch: ${deployment.branch}`)
    console.log(`   Actor: ${deployment.actor}`)
    console.log(`   Health: ${healthIcon} ${deployment.healthCheck?.success ? 'Healthy' : 'Unhealthy'}`)
    
    if (deployment.healthCheck?.data) {
      console.log(`   Status: ${deployment.healthCheck.data.status}`)
      console.log(`   Services: ${Object.keys(deployment.healthCheck.data.services || {}).length}`)
    }
  })
  
  console.log('\n' + '═'.repeat(60) + '\n')
}

/**
 * Run health check command
 */
async function runHealthCheck() {
  if (!RAILWAY_APP_URL) {
    console.error('❌ RAILWAY_APP_URL environment variable not set')
    process.exit(1)
  }
  
  console.log('🏥 Running Railway Health Check...')
  console.log('─'.repeat(60))
  
  const result = await checkHealth(RAILWAY_APP_URL)
  
  if (result.success) {
    console.log('✅ Service is healthy')
    console.log('\n📊 Health Status:')
    console.log(JSON.stringify(result.data, null, 2))
    return true
  } else {
    console.log('❌ Service is unhealthy')
    if (result.error) {
      console.log(`Error: ${result.error}`)
    }
    if (result.statusCode) {
      console.log(`Status Code: ${result.statusCode}`)
    }
    return false
  }
}

/**
 * Run deployment check command
 */
async function runDeploymentCheck() {
  if (!RAILWAY_APP_URL) {
    console.error('❌ RAILWAY_APP_URL environment variable not set')
    process.exit(1)
  }
  
  console.log('🚀 Checking Railway Deployment...')
  console.log('─'.repeat(60))
  
  const healthCheck = await checkHealth(RAILWAY_APP_URL)
  const status = healthCheck.success ? 'success' : 'failure'
  
  const deployment = recordDeployment(status, healthCheck)
  
  console.log(`\n📦 Deployment recorded:`)
  console.log(`   Status: ${status}`)
  console.log(`   Timestamp: ${deployment.timestamp}`)
  console.log(`   Commit: ${deployment.commit}`)
  console.log(`   Branch: ${deployment.branch}`)
  
  if (healthCheck.success) {
    console.log('\n✅ Deployment successful and service is healthy')
    return true
  } else {
    console.log('\n❌ Deployment failed or service is unhealthy')
    return false
  }
}

/**
 * Main command handler
 */
async function main() {
  const command = process.argv[2] || 'help'
  
  switch (command) {
    case 'health':
      const healthOk = await runHealthCheck()
      process.exit(healthOk ? 0 : 1)
      break
      
    case 'check':
      const checkOk = await runDeploymentCheck()
      process.exit(checkOk ? 0 : 1)
      break
      
    case 'report':
      generateReport()
      break
      
    case 'help':
    default:
      console.log(`
Railway Release Manager

Usage:
  node scripts/railway-manager.js <command>

Commands:
  health    Check if Railway service is healthy
  check     Check deployment and record status
  report    Generate deployment report
  help      Show this help message

Environment Variables:
  RAILWAY_APP_URL    URL of the Railway deployed app
  GITHUB_SHA         Current commit SHA
  GITHUB_REF_NAME    Current branch name
  GITHUB_ACTOR       GitHub username who triggered the action
`)
      break
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })
}

export { checkHealth, recordDeployment, generateReport }
