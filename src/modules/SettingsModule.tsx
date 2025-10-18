import React, { useState, useEffect } from 'react'
import { Key, Server, Plus, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Badge } from '@components/ui/Badge'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'

interface ApiKey {
  name: string
  value: string
  created: string
}

interface McpServer {
  id: string
  name: string
  status: 'configured' | 'not_configured'
}

/**
 * Settings Module - API Key and MCP Server Management
 * Allows users to configure integrations with ChatGPT, Claude, and custom MCP servers
 */
export const SettingsModule: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [mcpServers, setMcpServers] = useState<McpServer[]>([])
  const [loading, setLoading] = useState(true)
  const [newKey, setNewKey] = useState({ name: '', value: '' })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadKeys()
    loadMcpServers()
  }, [])

  const loadKeys = async () => {
    try {
      const response = await fetch('/api/keys')
      const result = await response.json()
      if (result.success) {
        setApiKeys(result.data)
      }
    } catch (error) {
      showMessage('error', 'Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  const loadMcpServers = async () => {
    try {
      const response = await fetch('/api/mcp/servers')
      const result = await response.json()
      if (result.success) {
        setMcpServers(result.data)
      }
    } catch (error) {
      showMessage('error', 'Failed to load MCP servers')
    }
  }

  const saveKey = async () => {
    if (!newKey.name || !newKey.value) {
      showMessage('error', 'Please provide both name and API key')
      return
    }

    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey)
      })
      const result = await response.json()

      if (result.success) {
        showMessage('success', 'API key saved successfully!')
        setNewKey({ name: '', value: '' })
        loadKeys()
        loadMcpServers()
      } else {
        showMessage('error', result.error || 'Failed to save key')
      }
    } catch (error) {
      showMessage('error', 'Failed to save API key')
    }
  }

  const deleteKey = async (name: string) => {
    if (!confirm(`Delete API key "${name}"?`)) return

    try {
      const response = await fetch(`/api/keys/${name}`, { method: 'DELETE' })
      const result = await response.json()

      if (result.success) {
        showMessage('success', 'API key deleted')
        loadKeys()
        loadMcpServers()
      } else {
        showMessage('error', result.error || 'Failed to delete key')
      }
    } catch (error) {
      showMessage('error', 'Failed to delete API key')
    }
  }

  const testMcpConnection = async (server: McpServer) => {
    try {
      const response = await fetch('/api/mcp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ server: server.id, apiKey: 'test' })
      })
      const result = await response.json()

      if (result.success) {
        showMessage('success', `${server.name}: ${result.message}`)
      } else {
        showMessage('error', `Test failed for ${server.name}`)
      }
    } catch (error) {
      showMessage('error', `Failed to test ${server.name}`)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  if (loading) {
    return <LoadingSpinner message="Loading settings..." />
  }

  return (
    <div className="space-y-6">
      {/* Message Banner */}
      {message && (
        <div
          className={`rounded-lg p-4 border flex items-center space-x-3 ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* API Key Management */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center space-x-3 mb-6">
          <Key className="w-6 h-6 text-cyber-blue" />
          <div>
            <h2 className="text-2xl font-bold">API Key Management</h2>
            <p className="text-sm text-gray-400">Manage API keys for external integrations</p>
          </div>
        </div>

        {/* Add New Key */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mb-4">
          <h3 className="font-semibold mb-4">Add New API Key</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Service Name</label>
              <select
                value={newKey.name}
                onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-cyber-blue focus:outline-none"
              >
                <option value="">Select service...</option>
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="custom_mcp">Custom MCP Server</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">API Key</label>
              <input
                type="password"
                value={newKey.value}
                onChange={(e) => setNewKey({ ...newKey, value: e.target.value })}
                placeholder="sk-..."
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-cyber-blue focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={saveKey}
            className="mt-4 flex items-center space-x-2 px-4 py-2 bg-cyber-blue hover:bg-cyber-blue/80 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add API Key</span>
          </button>
        </div>

        {/* Existing Keys */}
        <div>
          <h3 className="font-semibold mb-3">Saved API Keys</h3>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No API keys configured</p>
            </div>
          ) : (
            <div className="space-y-2">
              {apiKeys.map((key) => (
                <div
                  key={key.name}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="font-medium">{key.name}</p>
                    <p className="text-sm text-gray-500 font-mono">{key.value}</p>
                  </div>
                  <button
                    onClick={() => deleteKey(key.name)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MCP Server Integration */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center space-x-3 mb-6">
          <Server className="w-6 h-6 text-cyber-purple" />
          <div>
            <h2 className="text-2xl font-bold">MCP Server Integration</h2>
            <p className="text-sm text-gray-400">Configure Model Context Protocol servers</p>
          </div>
        </div>

        <div className="space-y-3">
          {mcpServers.map((server) => (
            <div
              key={server.id}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <Server className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">{server.name}</p>
                  <p className="text-xs text-gray-500">ID: {server.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant={server.status === 'configured' ? 'info' : 'default'}>
                  {server.status === 'configured' ? 'Configured' : 'Not Configured'}
                </Badge>
                {server.status === 'configured' && (
                  <button
                    onClick={() => testMcpConnection(server)}
                    className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Test Connection
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-semibold mb-1">MCP Integration Guide</p>
              <p className="text-blue-400/80">
                Add API keys above to enable MCP server integrations. Supported: OpenAI (ChatGPT), Anthropic (Claude), and custom MCP servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModule
