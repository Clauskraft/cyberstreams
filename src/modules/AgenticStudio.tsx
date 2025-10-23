import { useState, useEffect } from "react";
import {
  Bot,
  Settings,
  Database,
  Search,
  Play,
  Pause,
  RefreshCw,
  Shield,
  Globe,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  BarChart3,
  Cpu,
  Network,
  Brain,
  Plus,
  Trash2,
  Edit,
  Eye,
  Download,
  Upload,
  Wifi,
  MapPin,
} from "lucide-react";
import WigleMapsIntegration from "../components/WigleMapsIntegration";
import PentestModule from "../components/PentestModule";

interface AgenticRun {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "created" | "running" | "completed" | "failed" | "cancelled";
  priority: string;
  createdAt: string;
  updatedAt: string;
  inputs: any;
  steps: Array<{
    id: string;
    name: string;
    type: string;
    status: "pending" | "running" | "completed" | "failed";
    inputs: any;
    outputs: any;
    createdAt: string | null;
    completedAt: string | null;
    error: string | null;
  }>;
  currentStepIndex: number;
  results: any;
  error: string | null;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  stepCount: number;
  estimatedDuration: string;
  triggers: string[];
}

interface Tool {
  id: string;
  name: string;
  kind: string;
  url?: string;
  meta: any;
  registeredAt: string;
}

interface BootstrapDefaults {
  keywords: string[];
  sources: Array<{
    name: string;
    domain: string;
    url: string;
  }>;
  ollamaModels: string[];
}

const AgenticStudio = () => {
  const [activeTab, setActiveTab] = useState("workflows");
  const [runs, setRuns] = useState<AgenticRun[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [defaults, setDefaults] = useState<BootstrapDefaults | null>(null);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState("");
  const [osintStatus, setOsintStatus] = useState<any>(null);
  const [ollamaStatus, setOllamaStatus] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSource, setNewSource] = useState({
    name: "",
    domain: "",
    url: "",
    type: "osint",
    credibilityScore: 50,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        workflowsRes,
        runsRes,
        toolsRes,
        defaultsRes,
        osintRes,
        ollamaRes,
        sourcesRes,
        candidatesRes,
        approvalsRes,
      ] = await Promise.all([
        fetch("/api/agentic/workflows").then((r) => r.json()),
        fetch("/api/agentic/runs").then((r) => r.json()),
        fetch("/api/agentic/tools").then((r) => r.json()),
        fetch("/api/bootstrap/defaults").then((r) => r.json()),
        fetch("/api/intel-scraper/status").then((r) => r.json()),
        fetch("/api/bootstrap/ollama", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ allowPull: false }),
        }).then((r) => r.json()),
        fetch("/api/config/sources").then((r) => r.json()),
        fetch("/api/intel-scraper/candidates").then((r) => r.json()),
        fetch("/api/intel-scraper/approvals").then((r) => r.json()),
      ]);

      if (workflowsRes.success) setWorkflows(workflowsRes.data.workflows || []);
      if (runsRes.success) setRuns(runsRes.data.runs || []);
      if (toolsRes.success) setTools(toolsRes.data);
      if (defaultsRes.success) setDefaults(defaultsRes.data);
      if (osintRes.success) setOsintStatus(osintRes.data);
      if (ollamaRes.success) setOllamaStatus(ollamaRes.data);
      if (sourcesRes.success) setSources(sourcesRes.data);
      if (candidatesRes.success) setCandidates(candidatesRes.data);
      if (approvalsRes.success) setApprovals(approvalsRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createRun = async (workflowId: string, inputs: any) => {
    try {
      const res = await fetch("/api/agentic/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
          inputs,
          priority: "normal",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRuns((prev) => [data.data, ...prev]);
        loadData(); // Refresh data
      }
    } catch (error) {
      console.error("Failed to create run:", error);
    }
  };

  const standardizeEnvironment = async () => {
    try {
      await fetch("/api/bootstrap/standardize", { method: "POST" });
      await loadData();
    } catch (error) {
      console.error("Failed to standardize environment:", error);
    }
  };

  const seedSources = async () => {
    try {
      await fetch("/api/bootstrap/seed-sources", { method: "POST" });
      await loadData();
    } catch (error) {
      console.error("Failed to seed sources:", error);
    }
  };

  const toggleOsintScraper = async () => {
    try {
      const endpoint = osintStatus?.isRunning
        ? "/api/intel-scraper/stop"
        : "/api/intel-scraper/start";
      await fetch(endpoint, { method: "POST" });
      await loadData();
    } catch (error) {
      console.error("Failed to toggle scraper:", error);
    }
  };

  const addSource = async () => {
    try {
      const res = await fetch("/api/config/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSource),
      });
      if (res.ok) {
        setShowAddSource(false);
        setNewSource({
          name: "",
          domain: "",
          url: "",
          type: "osint",
          credibilityScore: 50,
        });
        await loadData();
      }
    } catch (error) {
      console.error("Failed to add source:", error);
    }
  };

  const approveCandidate = async (candidateId: string) => {
    try {
      await fetch(`/api/intel-scraper/candidates/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });
      await loadData();
    } catch (error) {
      console.error("Failed to approve candidate:", error);
    }
  };

  const dismissCandidate = async (candidateId: string) => {
    try {
      await fetch(`/api/intel-scraper/candidates/dismiss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });
      await loadData();
    } catch (error) {
      console.error("Failed to dismiss candidate:", error);
    }
  };

  const resolveApproval = async (approvalId: string, decision: string) => {
    try {
      await fetch(`/api/intel-scraper/approvals/${approvalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      await loadData();
    } catch (error) {
      console.error("Failed to resolve approval:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-blue mx-auto mb-4"></div>
          <p className="text-gray-400">Loading OSINT Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Bot className="w-8 h-8 text-cyber-blue" />
          <div>
            <h1 className="text-2xl font-bold text-white">OSINT Studio</h1>
            <p className="text-gray-400">
              Centralized OSINT & Agent Orchestration
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={standardizeEnvironment}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Standardize Env
          </button>
          <button
            onClick={seedSources}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Seed Sources
          </button>
        </div>
      </div>

      <div className="border-b border-gray-800 backdrop-blur-xl bg-cyber-dark/30">
        <nav className="flex space-x-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "osint", label: "OSINT Sources", icon: Globe },
            { id: "wigle-maps", label: "WiFi & Maps", icon: Wifi },
            { id: "pentest", label: "Pentest Tools", icon: Shield },
            { id: "tools", label: "Tools", icon: Cpu },
            { id: "runs", label: "Agent Runs", icon: Activity },
            { id: "models", label: "AI Models", icon: Brain },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all ${
                activeTab === tab.id
                  ? "border-b-2 border-cyber-blue text-cyber-blue"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="py-6">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  OSINT Scraper Status
                </h2>
                <div className="flex items-center justify-between">
                  <p
                    className={`text-2xl font-bold ${
                      osintStatus?.isRunning ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {osintStatus?.isRunning ? "Active" : "Inactive"}
                  </p>
                  <button
                    onClick={toggleOsintScraper}
                    className={`px-4 py-2 rounded text-sm flex items-center gap-2 ${
                      osintStatus?.isRunning
                        ? "bg-red-600 hover:bg-red-500"
                        : "bg-green-600 hover:bg-green-500"
                    }`}
                  >
                    {osintStatus?.isRunning ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {osintStatus?.isRunning ? "Stop" : "Start"}
                  </button>
                </div>
                {osintStatus?.lastRun && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last run:{" "}
                    {new Date(osintStatus.lastRun.at).toLocaleString()} (
                    {osintStatus.lastRun.trigger})
                  </p>
                )}
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Ollama Status
                </h2>
                <p
                  className={`text-2xl font-bold ${
                    ollamaStatus?.reachable ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {ollamaStatus?.reachable ? "Reachable" : "Unreachable"}
                </p>
                {ollamaStatus?.reachable && (
                  <p className="text-xs text-gray-500 mt-2">
                    Models installed: {ollamaStatus.results.length}
                  </p>
                )}
                {!ollamaStatus?.reachable && (
                  <p className="text-xs text-red-400 mt-2">
                    Check Ollama server at{" "}
                    {defaults?.ollamaModels[0] || "localhost:11434"}
                  </p>
                )}
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-yellow-400" />
                  Pending Approvals
                </h2>
                <p className="text-2xl font-bold text-yellow-400">
                  {approvals.length}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  New sources awaiting review
                </p>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Recent Agent Runs
              </h2>
              {runs.length === 0 ? (
                <p className="text-gray-500">No agent runs yet.</p>
              ) : (
                <ul className="space-y-2">
                  {runs.slice(0, 5).map((run) => (
                    <li
                      key={run.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{run.workflowName}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          run.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : run.status === "failed"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {run.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === "wigle-maps" && <WigleMapsIntegration />}

        {activeTab === "pentest" && <PentestModule />}

        {activeTab === "osint" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Globe className="w-6 h-6" />
                OSINT Sources
              </h2>
              <button
                onClick={() => setShowAddSource(!showAddSource)}
                className="px-4 py-2 bg-cyber-blue hover:bg-cyber-blue/80 rounded text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New Source
              </button>
            </div>

            {showAddSource && (
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 space-y-3">
                <h3 className="text-lg font-semibold">Add New OSINT Source</h3>
                <input
                  type="text"
                  placeholder="Source Name (e.g., CISA KEV)"
                  value={newSource.name}
                  onChange={(e) =>
                    setNewSource({ ...newSource, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
                />
                <input
                  type="text"
                  placeholder="Domain (e.g., cisa.gov)"
                  value={newSource.domain}
                  onChange={(e) =>
                    setNewSource({ ...newSource, domain: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
                />
                <input
                  type="url"
                  placeholder="URL (e.g., https://www.cisa.gov/)"
                  value={newSource.url}
                  onChange={(e) =>
                    setNewSource({ ...newSource, url: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
                />
                <div className="flex items-center gap-2">
                  <label className="text-gray-400 text-sm">
                    Credibility Score:
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newSource.credibilityScore}
                    onChange={(e) =>
                      setNewSource({
                        ...newSource,
                        credibilityScore: parseInt(e.target.value),
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-white">
                    {newSource.credibilityScore}
                  </span>
                </div>
                <button
                  onClick={addSource}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Save Source
                </button>
              </div>
            )}

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">
                Active Sources ({sources.length})
              </h3>
              {sources.length === 0 ? (
                <p className="text-gray-500">No active sources configured.</p>
              ) : (
                <ul className="space-y-3">
                  {sources.map((source, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between bg-gray-800 p-3 rounded"
                    >
                      <div>
                        <p className="font-medium">{source.name}</p>
                        <p className="text-xs text-gray-400">{source.url}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          Credibility: {source.credibilityScore}
                        </span>
                        <button className="text-blue-400 hover:text-blue-300">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {approvals.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">
                  Pending Approvals ({approvals.length})
                </h3>
                <ul className="space-y-3">
                  {approvals.map((approval) => (
                    <li
                      key={approval.id}
                      className="flex items-center justify-between bg-gray-800 p-3 rounded"
                    >
                      <div>
                        <p className="font-medium">{approval.source}</p>
                        <p className="text-xs text-gray-400">
                          Status: {approval.status}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            resolveApproval(approval.id, "approve")
                          }
                          className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => resolveApproval(approval.id, "reject")}
                          className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs"
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {candidates.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">
                  Candidate Sources ({candidates.length})
                </h3>
                <ul className="space-y-3">
                  {candidates.map((candidate) => (
                    <li
                      key={candidate.id}
                      className="flex items-center justify-between bg-gray-800 p-3 rounded"
                    >
                      <div>
                        <p className="font-medium">{candidate.url}</p>
                        <p className="text-xs text-gray-400">
                          Score: {(candidate.score * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => approveCandidate(candidate.id)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-xs"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => dismissCandidate(candidate.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs"
                        >
                          Dismiss
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === "tools" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="w-6 h-6" />
              Agentic Tools
            </h2>
            {tools.length === 0 ? (
              <p className="text-gray-500">No agentic tools registered.</p>
            ) : (
              <ul className="space-y-3">
                {tools.map((tool) => (
                  <li
                    key={tool.id}
                    className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                  >
                    <p className="font-medium text-lg">{tool.name}</p>
                    <p className="text-sm text-gray-400">Kind: {tool.kind}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {tool.meta?.description || "No description"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "runs" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Agent Runs
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Define a new agent goal (e.g., 'Research latest ransomware trends')"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
              />
              <button
                onClick={() =>
                  workflows.length > 0 &&
                  createRun(workflows[0].id, { goal: newGoal })
                }
                className="px-4 py-2 bg-cyber-blue hover:bg-cyber-blue/80 rounded text-sm"
                disabled={workflows.length === 0 || !newGoal.trim()}
              >
                Create Run
              </button>
            </div>

            {runs.length === 0 ? (
              <p className="text-gray-500">No agent runs created yet.</p>
            ) : (
              <ul className="space-y-4">
                {runs.map((run) => (
                  <li
                    key={run.id}
                    className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-lg">{run.workflowName}</p>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          run.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : run.status === "failed"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {run.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(run.createdAt).toLocaleString()}
                    </p>
                    {run.steps.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">
                          Steps:
                        </h4>
                        <ul className="space-y-1 text-xs text-gray-500">
                          {run.steps.map((step) => (
                            <li
                              key={step.id}
                              className="flex items-center gap-2"
                            >
                              {step.status === "completed" ? (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              ) : (
                                <AlertCircle className="w-3 h-3 text-yellow-500" />
                              )}
                              <span>
                                {step.type}: {JSON.stringify(step.inputs)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "models" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="w-6 h-6" />
              AI Models (Ollama)
            </h2>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">
                Ollama Configuration
              </h3>
              <p
                className={`text-lg font-bold ${
                  ollamaStatus?.reachable ? "text-green-400" : "text-red-400"
                } mb-2`}
              >
                Status: {ollamaStatus?.reachable ? "Reachable" : "Unreachable"}
              </p>
              <p className="text-sm text-gray-400">
                Base URL:{" "}
                {defaults?.ollamaModels[0] || "http://localhost:11434"}
              </p>
              <p className="text-sm text-gray-400">
                Chat Model: {defaults?.ollamaModels[1] || "llama3.1:8b"}
              </p>
              <p className="text-sm text-gray-400">
                Embed Model: {defaults?.ollamaModels[2] || "nomic-embed-text"}
              </p>
              {!ollamaStatus?.reachable && (
                <p className="text-xs text-red-400 mt-3">
                  Ollama server is not reachable. Please ensure it is running
                  and accessible at the configured URL.
                </p>
              )}
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Installed Models</h3>
              {ollamaStatus?.reachable && ollamaStatus.results.length > 0 ? (
                <ul className="space-y-2">
                  {ollamaStatus.results.map((model: any) => (
                    <li
                      key={model.name}
                      className="flex items-center justify-between text-sm bg-gray-800 p-2 rounded"
                    >
                      <span>{model.name}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          model.ok
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {model.ok ? "Installed" : "Failed"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">
                  No models installed or Ollama is unreachable.
                </p>
              )}
              <button
                onClick={() =>
                  fetch("/api/bootstrap/ollama", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ allowPull: true }),
                  }).then(loadData)
                }
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Ensure Default Models
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgenticStudio;
