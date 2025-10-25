import React, { useState, useEffect } from "react";
import {
  Settings,
  Database,
  Search,
  Play,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Keyword {
  id: number;
  keyword: string;
  category: string;
  priority: number;
  active: boolean;
  created_at: string;
}

interface Source {
  id: number;
  source_type: string;
  url: string;
  scan_frequency: number;
  last_scanned: string | null;
  active: boolean;
  created_at: string;
}

interface RAGConfig {
  model: string;
  temperature: string;
  max_tokens: string;
  vector_store_provider: string;
  embedding_model: string;
}

export default function AdminV2Page() {
  const [activeTab, setActiveTab] = useState<
    "keywords" | "sources" | "rag" | "analysis" | "agents"
  >("keywords");
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [ragConfig, setRagConfig] = useState<RAGConfig>({
    model: "gpt-4",
    temperature: "0.7",
    max_tokens: "2000",
    vector_store_provider: "pgvector",
    embedding_model: "text-embedding-ada-002",
  });
  const [loading, setLoading] = useState(false);
  const [newKeyword, setNewKeyword] = useState({
    keyword: "",
    category: "",
    priority: 1,
  });
  const [newSource, setNewSource] = useState({
    sourceType: "",
    url: "",
    scanFrequency: 3600,
  });

  // Load data on component mount
  useEffect(() => {
    loadKeywords();
    loadSources();
    loadRAGConfig();
    loadAgents();
  }, []);
  const [agents, setAgents] = useState<
    { id: string; name: string; systemPrompt: string }[]
  >([]);
  const [savingAgents, setSavingAgents] = useState(false);

  const loadAgents = async () => {
    try {
      const response = await fetch("/api/admin/agents");
      const data = await response.json();
      if (data.success) setAgents(data.data);
    } catch (e) {
      console.error("Error loading agents", e);
    }
  };

  const saveAgents = async () => {
    setSavingAgents(true);
    try {
      const response = await fetch("/api/admin/agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agents }),
      });
      const data = await response.json();
      if (data.success) setAgents(data.data);
    } catch (e) {
      console.error("Error saving agents", e);
    } finally {
      setSavingAgents(false);
    }
  };

  const loadKeywords = async () => {
    try {
      const response = await fetch("/api/admin/keywords");
      const data = await response.json();
      if (data.success) {
        setKeywords(data.data);
      }
    } catch (error) {
      console.error("Error loading keywords:", error);
    }
  };

  const loadSources = async () => {
    try {
      const response = await fetch("/api/admin/sources");
      const data = await response.json();
      if (data.success) {
        setSources(data.data);
      }
    } catch (error) {
      console.error("Error loading sources:", error);
    }
  };

  const loadRAGConfig = async () => {
    try {
      const response = await fetch("/api/admin/rag-config");
      const data = await response.json();
      if (data.success) {
        setRagConfig(data.data);
      }
    } catch (error) {
      console.error("Error loading RAG config:", error);
    }
  };

  const addKeyword = async () => {
    if (!newKeyword.keyword.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newKeyword),
      });
      const data = await response.json();
      if (data.success) {
        setKeywords([data.data, ...keywords]);
        setNewKeyword({ keyword: "", category: "", priority: 1 });
      }
    } catch (error) {
      console.error("Error adding keyword:", error);
    } finally {
      setLoading(false);
    }
  };

  const addSource = async () => {
    if (!newSource.url.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSource),
      });
      const data = await response.json();
      if (data.success) {
        setSources([data.data, ...sources]);
        setNewSource({ sourceType: "", url: "", scanFrequency: 3600 });
      }
    } catch (error) {
      console.error("Error adding source:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteKeyword = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/keywords/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setKeywords(keywords.filter((k) => k.id !== id));
      }
    } catch (error) {
      console.error("Error deleting keyword:", error);
    }
  };

  const deleteSource = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/sources/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSources(sources.filter((s) => s.id !== id));
      }
    } catch (error) {
      console.error("Error deleting source:", error);
    }
  };

  const toggleKeyword = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/keywords/${id}/toggle`, {
        method: "PUT",
      });
      const data = await response.json();
      if (data.success) {
        setKeywords(keywords.map((k) => (k.id === id ? data.data : k)));
      }
    } catch (error) {
      console.error("Error toggling keyword:", error);
    }
  };

  const updateRAGConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/rag-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ragConfig),
      });
      if (response.ok) {
        alert("RAG configuration updated successfully");
      }
    } catch (error) {
      console.error("Error updating RAG config:", error);
    } finally {
      setLoading(false);
    }
  };

  const runRAGAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/run-rag-analysis", {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        alert("RAG analysis completed successfully");
      }
    } catch (error) {
      console.error("Error running RAG analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyber-dark to-cyber-darker p-6 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyber-blue to-cyber-purple bg-clip-text text-transparent mb-2">
            Admin v2.0
          </h1>
          <p className="text-gray-400">
            Advanced configuration and management for Cyberstreams v2.0
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-700 mb-6">
          <div className="border-b border-gray-800">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "keywords", label: "Keywords", icon: Search },
                { id: "sources", label: "Sources", icon: Database },
                { id: "rag", label: "RAG Config", icon: Settings },
                { id: "analysis", label: "Analysis", icon: Play },
                { id: "agents", label: "Agents & Roles", icon: Settings },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === id
                      ? "border-cyber-blue text-cyber-blue"
                      : "border-transparent text-gray-400 hover:text-white hover:border-gray-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Keywords Tab */}
            {activeTab === "keywords" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Monitoring Keywords</h2>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      placeholder="Keyword"
                      value={newKeyword.keyword}
                      onChange={(e) =>
                        setNewKeyword({
                          ...newKeyword,
                          keyword: e.target.value,
                        })
                      }
                      className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-cyber-blue"
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={newKeyword.category}
                      onChange={(e) =>
                        setNewKeyword({
                          ...newKeyword,
                          category: e.target.value,
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Priority"
                      value={newKeyword.priority}
                      onChange={(e) =>
                        setNewKeyword({
                          ...newKeyword,
                          priority: parseInt(e.target.value) || 1,
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-20"
                    />
                    <button
                      onClick={addKeyword}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="grid grid-cols-1 gap-4">
                    {keywords.map((keyword) => (
                      <div
                        key={keyword.id}
                        className="bg-gray-900 p-4 rounded-lg border border-gray-700 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => toggleKeyword(keyword.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {keyword.active ? (
                              <ToggleRight className="w-5 h-5 text-green-500" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                          <div>
                            <div className="font-medium">{keyword.keyword}</div>
                            <div className="text-sm text-gray-400">
                              {keyword.category} • Priority: {keyword.priority}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteKeyword(keyword.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sources Tab */}
            {activeTab === "sources" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Monitoring Sources</h2>
                  <div className="flex space-x-3">
                    <select
                      value={newSource.sourceType}
                      onChange={(e) =>
                        setNewSource({
                          ...newSource,
                          sourceType: e.target.value,
                        })
                      }
                      className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-cyber-blue"
                    >
                      <option value="">Select Type</option>
                      <option value="rss">RSS Feed</option>
                      <option value="twitter">Twitter</option>
                      <option value="website">Website</option>
                      <option value="api">API</option>
                    </select>
                    <input
                      type="url"
                      placeholder="URL"
                      value={newSource.url}
                      onChange={(e) =>
                        setNewSource({ ...newSource, url: e.target.value })
                      }
                      className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-cyber-blue w-64"
                    />
                    <input
                      type="number"
                      placeholder="Frequency (seconds)"
                      value={newSource.scanFrequency}
                      onChange={(e) =>
                        setNewSource({
                          ...newSource,
                          scanFrequency: parseInt(e.target.value) || 3600,
                        })
                      }
                      className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-cyber-blue w-32"
                    />
                    <button
                      onClick={addSource}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="grid grid-cols-1 gap-4">
                    {sources.map((source) => (
                      <div
                        key={source.id}
                        className="bg-gray-900 p-4 rounded-lg border border-gray-700 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">
                            {source.source_type}
                          </div>
                          <div className="text-sm text-gray-400">
                            {source.url}
                          </div>
                          <div className="text-xs text-gray-500">
                            Frequency: {source.scan_frequency}s • Last scanned:{" "}
                            {source.last_scanned
                              ? new Date(source.last_scanned).toLocaleString()
                              : "Never"}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteSource(source.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* RAG Config Tab */}
            {activeTab === "rag" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">RAG Configuration</h2>
                  <button
                    onClick={updateRAGConfig}
                    disabled={loading}
                    className="px-4 py-2 bg-cyber-blue rounded-md hover:bg-cyber-blue/80 disabled:opacity-50"
                  >
                    Save Configuration
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Model
                    </label>
                    <select
                      value={ragConfig.model}
                      onChange={(e) =>
                        setRagConfig({ ...ragConfig, model: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-cyber-blue"
                    >
                      <option value="llama3.1:8b">Ollama - Llama3.1:8B</option>
                      <option value="dolphin-llama3:8b">
                        Ollama - Dolphin Llama3:8B (uncensored)
                      </option>
                      <option value="gpt-4">OpenAI - GPT-4</option>
                      <option value="gpt-3.5-turbo">
                        OpenAI - GPT-3.5 Turbo
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Temperature
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={ragConfig.temperature}
                      onChange={(e) =>
                        setRagConfig({
                          ...ragConfig,
                          temperature: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-cyber-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      value={ragConfig.max_tokens}
                      onChange={(e) =>
                        setRagConfig({
                          ...ragConfig,
                          max_tokens: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-cyber-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Vector Store Provider
                    </label>
                    <select
                      value={ragConfig.vector_store_provider}
                      onChange={(e) =>
                        setRagConfig({
                          ...ragConfig,
                          vector_store_provider: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-cyber-blue"
                    >
                      <option value="memory">In-memory (default)</option>
                      <option value="pgvector">PostgreSQL + pgvector</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Embedding Model
                    </label>
                    <select
                      value={ragConfig.embedding_model}
                      onChange={(e) =>
                        setRagConfig({
                          ...ragConfig,
                          embedding_model: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-cyber-blue"
                    >
                      <option value="nomic-embed-text">
                        nomic-embed-text (default)
                      </option>
                      <option value="text-embedding-3-small">
                        text-embedding-3-small
                      </option>
                      <option value="text-embedding-3-large">
                        text-embedding-3-large
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Tab */}
            {activeTab === "analysis" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">RAG Analysis</h2>
                  <button
                    onClick={runRAGAnalysis}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 rounded-md hover:bg-green-500 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    <span>Run Analysis</span>
                  </button>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="text-center">
                    <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Run RAG Analysis
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Execute RAG analysis on configured keywords and sources to
                      generate intelligence insights.
                    </p>
                    <div className="text-sm text-gray-400">
                      This will process all active keywords against configured
                      sources and generate AI-powered analysis.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Agents & Roles Tab */}
            {activeTab === "agents" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Agents & Roles</h2>
                  <button
                    onClick={saveAgents}
                    disabled={savingAgents}
                    className="px-4 py-2 bg-cyber-blue rounded-md hover:bg-cyber-blue/80 disabled:opacity-50"
                  >
                    Save Prompts
                  </button>
                </div>
                <div className="mb-4">
                  <button
                    onClick={async () => {
                      try {
                        const goals = agents.map(
                          (a) =>
                            `Run ${a.name}: ${
                              a.systemPrompt?.slice(0, 180) || ""
                            }`
                        );
                        for (const goal of goals) {
                          await fetch("/api/orchestrator/runs", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ goal }),
                          });
                        }
                        alert("Started runs for all agents");
                      } catch (e) {
                        console.error("Run all agents failed", e);
                        alert("Failed to start runs for all agents");
                      }
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-sm"
                  >
                    Run All Agents
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                    >
                      <div className="font-medium mb-2">{agent.name}</div>
                      <textarea
                        value={agent.systemPrompt}
                        onChange={(e) =>
                          setAgents(
                            agents.map((a) =>
                              a.id === agent.id
                                ? { ...a, systemPrompt: e.target.value }
                                : a
                            )
                          )
                        }
                        className="w-full h-32 px-3 py-2 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue text-sm"
                      />
                      <div className="mt-3 flex items-center justify-end">
                        <button
                          onClick={async () => {
                            try {
                              const goal = `Run ${agent.name}: ${
                                agent.systemPrompt?.slice(0, 180) || ""
                              }`;
                              const res = await fetch(
                                "/api/orchestrator/runs",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ goal }),
                                }
                              );
                              if (res.ok) {
                                alert(`${agent.name} started`);
                              } else {
                                const j = await res
                                  .json()
                                  .catch(() => ({} as any));
                                alert(`Failed: ${j?.error || res.status}`);
                              }
                            } catch (e) {
                              console.error("Run agent failed", e);
                              alert("Failed to start agent");
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs"
                        >
                          Run Agent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
