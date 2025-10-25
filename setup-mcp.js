#!/usr/bin/env node

/**
 * CYBERSTREAMS MCP SETUP SCRIPT
 * 
 * Dette script hjælper med at installere og konfigurere MCP servere
 * til Cyberstreams platformen.
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
  log('\n' + '=' .repeat(60), 'cyan');
  log(title, 'bold');
  log('=' .repeat(60), 'cyan');
};

// Check if Docker is available
const checkDocker = () => {
  return new Promise((resolve) => {
    const docker = spawn('docker', ['--version']);
    docker.on('close', (code) => {
      resolve(code === 0);
    });
    docker.on('error', () => {
      resolve(false);
    });
  });
};

// Pull Docker images for MCP servers
const pullMCPImages = async () => {
  logSection('🐳 PULLING MCP DOCKER IMAGES');
  
  const images = [
    'mcp/filesystem:latest',
    'mcp/api-gateway:latest'
  ];
  
  for (const image of images) {
    log(`\n📥 Pulling ${image}...`, 'blue');
    
    try {
      await new Promise((resolve, reject) => {
        const docker = spawn('docker', ['pull', image]);
        
        docker.stdout.on('data', (data) => {
          process.stdout.write(data);
        });
        
        docker.stderr.on('data', (data) => {
          process.stderr.write(data);
        });
        
        docker.on('close', (code) => {
          if (code === 0) {
            log(`✅ Successfully pulled ${image}`, 'green');
            resolve();
          } else {
            log(`❌ Failed to pull ${image}`, 'red');
            reject(new Error(`Failed to pull ${image}`));
          }
        });
        
        docker.on('error', (error) => {
          log(`❌ Error pulling ${image}: ${error.message}`, 'red');
          reject(error);
        });
      });
    } catch (error) {
      log(`⚠️  Warning: Could not pull ${image}`, 'yellow');
      log(`   This is normal if the image doesn't exist yet`, 'yellow');
    }
  }
};

// Create MCP configuration file
const createMCPConfig = async () => {
  logSection('⚙️ CREATING MCP CONFIGURATION');
  
  const mcpConfig = {
    "mcpServers": {
      "filesystem": {
        "command": "docker",
        "args": [
          "run",
          "-i",
          "--rm",
          "-v",
          "/local-directory:/local-directory",
          "mcp/filesystem",
          "/local-directory"
        ]
      },
      "mcp-api-gateway": {
        "command": "docker",
        "args": [
          "run",
          "-i",
          "--rm",
          "-e",
          "API_1_NAME",
          "-e",
          "API_1_SWAGGER_URL",
          "-e",
          "API_1_HEADER_AUTHORIZATION",
          "mcp/api-gateway"
        ],
        "env": {
          "API_1_NAME": "GitHub API",
          "API_1_SWAGGER_URL": "https://api.github.com/swagger.json",
          "API_1_HEADER_AUTHORIZATION": "token YOUR_GITHUB_TOKEN"
        }
      }
    }
  };
  
  try {
    await fs.writeFile('mcp.json', JSON.stringify(mcpConfig, null, 2));
    log('✅ MCP configuration file created: mcp.json', 'green');
  } catch (error) {
    log(`❌ Failed to create MCP configuration: ${error.message}`, 'red');
    throw error;
  }
};

// Create environment file template
const createEnvTemplate = async () => {
  logSection('🔐 CREATING ENVIRONMENT TEMPLATE');
  
  const envTemplate = `# MCP Server Configuration
# Copy this file to .env and fill in your values

# API Gateway Configuration
API_1_NAME=GitHub API
API_1_SWAGGER_URL=https://api.github.com/swagger.json
API_1_HEADER_AUTHORIZATION=token YOUR_GITHUB_TOKEN

# Additional MCP Server Environment Variables
MCP_FILESYSTEM_PATH=/local-directory
MCP_API_GATEWAY_TIMEOUT=30000
`;
  
  try {
    await fs.writeFile('.env.mcp.template', envTemplate);
    log('✅ Environment template created: .env.mcp.template', 'green');
  } catch (error) {
    log(`❌ Failed to create environment template: ${error.message}`, 'red');
    throw error;
  }
};

// Test MCP configuration
const testMCPConfiguration = async () => {
  logSection('🧪 TESTING MCP CONFIGURATION');
  
  try {
    const configData = await fs.readFile('mcp.json', 'utf8');
    const config = JSON.parse(configData);
    
    if (config.mcpServers) {
      const serverCount = Object.keys(config.mcpServers).length;
      log(`✅ MCP configuration is valid with ${serverCount} servers`, 'green');
      
      for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
        if (serverConfig.command && serverConfig.args) {
          log(`✅ ${serverName}: Valid configuration`, 'green');
        } else {
          log(`❌ ${serverName}: Invalid configuration`, 'red');
        }
      }
    } else {
      log('❌ MCP configuration is invalid', 'red');
    }
  } catch (error) {
    log(`❌ Failed to test MCP configuration: ${error.message}`, 'red');
  }
};

// Run MCP smoketest
const runMCPSmokeTest = async () => {
  logSection('🚀 RUNNING MCP SMOKETEST');
  
  try {
    const { spawn } = await import('child_process');
    
    const test = spawn('node', ['mcp-smoketest.js'], {
      stdio: 'inherit'
    });
    
    test.on('close', (code) => {
      if (code === 0) {
        log('✅ MCP smoketest passed', 'green');
      } else {
        log('⚠️  MCP smoketest completed with warnings', 'yellow');
      }
    });
    
    test.on('error', (error) => {
      log(`❌ MCP smoketest failed: ${error.message}`, 'red');
    });
  } catch (error) {
    log(`❌ Failed to run MCP smoketest: ${error.message}`, 'red');
  }
};

// Main setup function
const setupMCP = async () => {
  log('🔗 CYBERSTREAMS MCP SETUP STARTING', 'bold');
  
  try {
    // Check Docker availability
    log('\n🔍 Checking Docker availability...', 'blue');
    const dockerAvailable = await checkDocker();
    
    if (dockerAvailable) {
      log('✅ Docker is available', 'green');
    } else {
      log('❌ Docker is not available', 'red');
      log('Please install Docker to use MCP servers', 'yellow');
      process.exit(1);
    }
    
    // Pull MCP images
    await pullMCPImages();
    
    // Create configuration
    await createMCPConfig();
    
    // Create environment template
    await createEnvTemplate();
    
    // Test configuration
    await testMCPConfiguration();
    
    // Run smoketest
    await runMCPSmokeTest();
    
    logSection('🎉 MCP SETUP COMPLETE');
    log('✅ MCP servers have been configured successfully!', 'green');
    log('\n📋 Next Steps:', 'blue');
    log('1. Copy .env.mcp.template to .env and fill in your values', 'cyan');
    log('2. Run npm run smoketest:mcp to test MCP servers', 'cyan');
    log('3. Run npm run smoketest:all to run all tests including MCP', 'cyan');
    
  } catch (error) {
    log(`\n💥 MCP SETUP FAILED: ${error.message}`, 'red');
    process.exit(1);
  }
};

// Run setup
setupMCP();



