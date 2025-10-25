import { useState, useEffect } from "react";
import {
  Bot,
  Shield,
  AlertTriangle,
  Clock,
  Filter,
  Search,
  Globe,
  Eye,
  Target,
  Zap,
  Calendar,
  TrendingUp,
  Database,
  Activity,
  Settings,
} from "lucide-react";
// import KnowledgeUploader from "../components/KnowledgeUploader"; // Removed - component doesn't exist

interface AgentFinding {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  category: "threat" | "politics" | "both";
  severity: "critical" | "high" | "medium" | "low";
  source: string;
  sourceType: "government" | "vendor" | "media" | "social" | "darkweb";
  confidence: number;
  cves?: string[];
  iocs?: string[];
  verified: boolean;
  link?: string;
  audience: string[];
  tags: string[];
}

interface AgentStats {
  totalFindings: number;
  newToday: number;
  threatsActive: number;
  politicsActive: number;
  unverified: number;
  lastRun: string;
  nextRun: string;
}

const politicalKeywords = [
  "politik",
  "policy",
  "law",
  "lov",
  "government",
  "regulation",
  "eu",
  "parliament",
];
const threatKeywords = [
  "ransomware",
  "malware",
  "apt",
  "exploit",
  "vulnerability",
  "cve",
  "threat",
  "phishing",
];

function formatRelativeTime(timestamp?: string | null) {
  if (!timestamp) {
    return "N/A";
  }

  const value = new Date(timestamp).getTime();
  if (Number.isNaN(value)) {
    return "N/A";
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - value) / 1000));

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }
  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `${minutes}m ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffSeconds / 86400);
  return `${days}d ago`;
}

function determineCategory(
  title: string,
  description: string,
  tags: string[]
): "threat" | "politics" | "both" {
  const text = `${title} ${description}`.toLowerCase();
  const tagText = tags.join(" ").toLowerCase();
  const combined = `${text} ${tagText}`;

  const hasThreat = threatKeywords.some((keyword) =>
    combined.includes(keyword)
  );
  const hasPolitical = politicalKeywords.some((keyword) =>
    combined.includes(keyword)
  );

  if (hasThreat && hasPolitical) {
    return "both";
  }
  if (hasPolitical) {
    return "politics";
  }
  return "threat";
}

function buildAudience(
  category: "threat" | "politics" | "both",
  severity: AgentFinding["severity"]
): string[] {
  const base = new Set<string>();
  if (category === "politics" || category === "both") {
    base.add("Ledelse");
    base.add("Compliance");
  }
  if (category === "threat" || category === "both") {
    base.add("CISO");
    base.add("SOC");
  }
  if (severity === "critical" || severity === "high") {
    base.add("Incident Response");
  }
  return Array.from(base);
}

function mapFindingFromApi(item: any): AgentFinding {
  const title = item.title || "Intel finding";
  const description = item.description || "Ingen beskrivelse tilgængelig";
  const tags: string[] = Array.isArray(item.tags) ? item.tags : [];
  const category = determineCategory(title, description, tags);
  const severity = (item.severity as AgentFinding["severity"]) || "medium";
  const timestamp = item.timestamp || new Date().toISOString();

  return {
    id: item.id || `intel-${Date.now()}`,
    timestamp: formatRelativeTime(timestamp),
    title,
    description,
    category,
    severity,
    source: item.source || "Ukendt kilde",
    confidence: item.confidence ?? 50,
    cves: Array.isArray(item.cves) ? item.cves : [],
    iocs: Array.isArray(item.iocs) ? item.iocs : [],
    verified: item.verified ?? true,
    link: item.url || undefined,
    audience: buildAudience(category, severity),
    tags,
    sourceType: item.origin === "opencti" ? "vendor" : "government",
  };
}

const CyberstreamsAgent = () => {
  const [activeTab, setActiveTab] = useState<"trusler" | "politik" | "begge">(
    "trusler"
  );
  const [findings, setFindings] = useState<AgentFinding[]>([]);
  const [filteredFindings, setFilteredFindings] = useState<AgentFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [scraperStatus, setScraperStatus] = useState({
    isRunning: false,
    lastActivity: "",
    activeSources: 0,
    totalSources: 0,
  });
  const [stats, setStats] = useState<AgentStats>({
    totalFindings: 0,
    newToday: 0,
    threatsActive: 0,
    politicsActive: 0,
    unverified: 0,
    lastRun: "N/A",
    nextRun: "N/A",
  });
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatModel, setChatModel] = useState(
    (import.meta as any)?.env?.VITE_DEFAULT_CHAT_MODEL || "llama3.1:8b"
  );

  useEffect(() => {
    // Load Intel Scraper status and findings
    const loadData = async () => {
      try {
        // Get Intel Scraper status
        const scraperResponse = await fetch("/api/intel-scraper/status");
        if (scraperResponse.ok) {
          const scraperData = await scraperResponse.json();
          setScraperStatus(scraperData.data);
        }
      } catch (error) {
        console.warn("Could not load Intel Scraper status:", error);
      }
    };

    loadData();

    const fallbackFindings: AgentFinding[] = [
      {
        id: "AGENT-001",
        timestamp: "2 min ago",
        title: "Critical RCE in Microsoft Exchange Server (CVE-2025-0001)",
        description:
          "CFCS.dk advarer om aktiv udnyttelse af Remote Code Execution sårbarhed i Exchange Server. Påvirker danske virksomheder.",
        category: "threat",
        severity: "critical",
        source: "CFCS.dk",
        sourceType: "government",
        confidence: 95,
        cves: ["CVE-2025-0001"],
        iocs: ["malicious-exchange.com", "192.168.100.50"],
        verified: true,
        link: "https://cfcs.dk/advisories/cve-2025-0001",
        audience: ["CISO", "SOC", "DevSecOps"],
        tags: ["Exchange", "RCE", "Microsoft", "Danmark"],
      },
      {
        id: "AGENT-002",
        timestamp: "15 min ago",
        title: "Folketinget vedtager ny cybersikkerhedslov",
        description:
          "Ny lovgivning om obligatorisk incident rapportering for kritisk infrastruktur. Træder i kraft 1. januar 2026.",
        category: "politics",
        severity: "medium",
        source: "Folketinget (ft.dk)",
        sourceType: "government",
        confidence: 100,
        verified: true,
        link: "https://ft.dk/lovforslag/cyber-2025",
        audience: ["Ledelse", "Compliance", "CISO"],
        tags: ["Lovgivning", "Compliance", "Infrastruktur"],
      },
      {
        id: "AGENT-003",
        timestamp: "30 min ago",
        title:
          "Ransomware gruppe LockBit rammer danske energiselskaber - politisk respons",
        description:
          "LockBit 3.0 kampagne mod dansk energisektor. Energiminister indkalder til krisemøde om kritisk infrastrukturbeskyttelse.",
        category: "both",
        severity: "high",
        source: "DR Nyheder + BreachForums",
        sourceType: "media",
        confidence: 87,
        cves: [],
        iocs: ["lockbit-energy.onion", "energy-leak.zip"],
        verified: true,
        link: "https://dr.dk/nyheder/ransomware-energi",
        audience: ["CISO", "SOC", "Ledelse", "PR"],
        tags: ["Ransomware", "LockBit", "Energi", "Politik", "Infrastruktur"],
      },
      {
        id: "AGENT-004",
        timestamp: "45 min ago",
        title: "Zero-day exploit leaked on XSS forum",
        description:
          "Unverified reports of Chrome zero-day being sold on Russian underground forum. No official vendor confirmation yet.",
        category: "threat",
        severity: "high",
        source: "XSS Forum",
        sourceType: "darkweb",
        confidence: 65,
        cves: [],
        iocs: ["chrome-0day.js", "exploit-seller.onion"],
        verified: false,
        audience: ["SOC", "DevSecOps"],
        tags: ["Zero-day", "Chrome", "Darkweb", "Unverified"],
      },
      {
        id: "AGENT-005",
        timestamp: "1 hour ago",
        title:
          "EU Digital Services Act påvirker danske cybersikkerhedsudbydere",
        description:
          "Nye DSA-regler kræver enhanced incident reporting. Danske security vendors skal tilpasse compliance processer.",
        category: "politics",
        severity: "medium",
        source: "Version2",
        sourceType: "media",
        confidence: 90,
        verified: true,
        link: "https://version2.dk/artikel/dsa-cybersecurity",
        audience: ["Ledelse", "Compliance"],
        tags: ["EU", "DSA", "Compliance", "Security Vendors"],
      },
      {
        id: "AGENT-006",
        timestamp: "2 hours ago",
        title:
          "APT28 campaign targeting Nordic government entities with new malware",
        description:
          "CERT-EU reports sophisticated campaign using novel persistence mechanisms. Danish government entities advised to implement additional monitoring.",
        category: "threat",
        severity: "high",
        source: "CERT-EU",
        sourceType: "government",
        confidence: 92,
        cves: [],
        iocs: ["apt28-nordic.dll", "203.0.113.77", "gov-backdoor.exe"],
        verified: true,
        link: "https://cert.europa.eu/publications/apt28-nordic",
        audience: ["CISO", "SOC", "Government"],
        tags: ["APT28", "Nordic", "Government", "Malware"],
      },
      {
        id: "AGENT-007",
        timestamp: "3 hours ago",
        title:
          "Regeringen fremlægger national AI-sikkerhedsstrategi med cybertrusselsfokus",
        description:
          "Ny strategi adresserer AI-drevne cyberangreb og kræver særlige sikkerhedsforanstaltninger for AI-systemer i kritisk infrastruktur.",
        category: "both",
        severity: "medium",
        source: "Regeringen.dk + Computerworld",
        sourceType: "government",
        confidence: 95,
        verified: true,
        link: "https://regeringen.dk/ai-sikkerhed-2025",
        audience: ["Ledelse", "CISO", "DevSecOps"],
        tags: ["AI", "Strategi", "Regering", "Infrastruktur", "Innovation"],
      },
    ];

    const loadScraperData = async () => {
      try {
        const response = await fetch("/api/intel-scraper/status");
        if (!response.ok) {
          throw new Error("Failed to fetch Intel Scraper status");
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(
            result.error || "Intel Scraper status returned error"
          );
        }

        const statusData = result.data;
        if (statusData) {
          setScraperStatus({
            isRunning: statusData.isRunning,
            lastActivity: formatRelativeTime(statusData.lastActivity),
            activeSources: statusData.activeSources,
            totalSources: statusData.totalSources,
          });
        }

        const apiFindings: AgentFinding[] = Array.isArray(
          statusData?.latestFindings
        )
          ? statusData.latestFindings.map(mapFindingFromApi)
          : [];

        const dataset = apiFindings.length ? apiFindings : fallbackFindings;
        setFindings(dataset);
        setFilteredFindings(dataset);
        setStats({
          totalFindings: dataset.length,
          newToday: dataset.filter((f) => f.timestamp.includes("ago")).length,
          threatsActive: dataset.filter(
            (f) => f.category === "threat" || f.category === "both"
          ).length,
          politicsActive: dataset.filter(
            (f) => f.category === "politics" || f.category === "both"
          ).length,
          unverified: dataset.filter((f) => !f.verified).length,
          lastRun: formatRelativeTime(statusData?.lastRunAt),
          nextRun: formatRelativeTime(statusData?.nextRun),
        });
      } catch (error) {
        console.warn(
          "Could not load Intel Scraper data, using fallback set:",
          error
        );
        setFindings(fallbackFindings);
        setFilteredFindings(fallbackFindings);
        setStats({
          totalFindings: fallbackFindings.length,
          newToday: fallbackFindings.filter(
            (f) => f.timestamp.includes("min") || f.timestamp.includes("hour")
          ).length,
          threatsActive: fallbackFindings.filter(
            (f) => f.category === "threat" || f.category === "both"
          ).length,
          politicsActive: fallbackFindings.filter(
            (f) => f.category === "politics" || f.category === "both"
          ).length,
          unverified: fallbackFindings.filter((f) => !f.verified).length,
          lastRun: "N/A",
          nextRun: "N/A",
        });
      } finally {
        setLoading(false);
      }
    };

    loadScraperData();
  }, []);

  useEffect(() => {
    // Filter findings baseret på aktiv tab
    let filtered = findings.filter((finding) => {
      if (activeTab === "trusler") {
        return finding.category === "threat" || finding.category === "both";
      } else if (activeTab === "politik") {
        return finding.category === "politics" || finding.category === "both";
      } else {
        return finding.category === "both";
      }
    });

    // Anvend søge- og andre filtre
    if (searchQuery) {
      filtered = filtered.filter(
        (finding) =>
          finding.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          finding.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          finding.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    if (severityFilter !== "all") {
      filtered = filtered.filter(
        (finding) => finding.severity === severityFilter
      );
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter(
        (finding) => finding.sourceType === sourceFilter
      );
    }

    setFilteredFindings(filtered);
  }, [findings, activeTab, searchQuery, severityFilter, sourceFilter]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "threat":
        return "bg-red-500/20 text-red-300";
      case "politics":
        return "bg-blue-500/20 text-blue-300";
      case "both":
        return "bg-purple-500/20 text-purple-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case "government":
        return Shield;
      case "vendor":
        return Database;
      case "media":
        return Globe;
      case "social":
        return Activity;
      case "darkweb":
        return Eye;
      case "technical":
        return Database;
      case "osint":
        return Globe;
      default:
        return Globe;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-blue mx-auto mb-4"></div>
          <p className="text-gray-400">
            CYBERSTREAMS-AGENT analyserer sources...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agent Header */}
      <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-lg p-6 border border-purple-500/30">
        <div className="flex items-center gap-3 mb-3">
          <Bot className="w-8 h-8 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              CYBERSTREAMS-AGENT
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                ACTIVE
              </span>
            </h1>
            <p className="text-sm text-gray-400">
              Deterministisk threat-intel-agent for Danmark &amp; EU
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
          <div className="text-gray-400">
            <Clock className="w-4 h-4 inline mr-1" />
            Sidst kørt: {stats.lastRun}
          </div>
          <div className="text-gray-400">
            <Calendar className="w-4 h-4 inline mr-1" />
            Næste: {stats.nextRun}
          </div>
          <div className="text-green-400">
            <Target className="w-4 h-4 inline mr-1" />
            {stats.newToday} nye i dag
          </div>
          <div className="text-blue-400">
            <Database className="w-4 h-4 inline mr-1" />
            {stats.totalFindings} total
          </div>
          <div className="text-yellow-400">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            {stats.unverified} unverified
          </div>
          <div
            className={`${
              scraperStatus.isRunning ? "text-green-400" : "text-gray-400"
            }`}
          >
            <Activity className="w-4 h-4 inline mr-1" />
            Scraper: {scraperStatus.isRunning ? "RUNNING" : "STOPPED"} (
            {scraperStatus.activeSources}/{scraperStatus.totalSources})
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-900 rounded-lg border border-gray-700">
        <nav className="flex">
          {[
            {
              id: "trusler" as const,
              label: "Trusler",
              count: stats.threatsActive,
              icon: Shield,
            },
            {
              id: "politik" as const,
              label: "Politik",
              count: stats.politicsActive,
              icon: TrendingUp,
            },
            {
              id: "begge" as const,
              label: "Begge",
              count: findings.filter((f) => f.category === "both").length,
              icon: Zap,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
                activeTab === tab.id
                  ? "border-b-2 border-purple-400 text-purple-400 bg-gray-800"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Søg i findings, CVE'er, IoC'er, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-400 text-white placeholder-gray-400"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-400 text-white"
            >
              <option value="all">Alle Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-400 text-white"
            >
              <option value="all">Alle Kilder</option>
              <option value="government">Government</option>
              <option value="vendor">Vendor</option>
              <option value="media">Media</option>
              <option value="social">Social</option>
              <option value="darkweb">Dark Web</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chat & Knowledge Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Agent Chat
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto mb-3">
            {chatHistory.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded ${
                  m.role === "user"
                    ? "bg-gray-800"
                    : "bg-gray-800/60 border border-gray-700"
                }`}
              >
                <p className="text-xs text-gray-400 mb-1">
                  {m.role === "user" ? "You" : "Agent"}
                </p>
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
            {chatLoading && (
              <div className="text-xs text-gray-400">Agent tænker...</div>
            )}
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!chatInput.trim()) return;
              const userMsg = {
                role: "user" as const,
                content: chatInput.trim(),
              };
              setChatHistory((h) => [...h, userMsg]);
              setChatInput("");
              setChatLoading(true);
              try {
                const res = await fetch("/api/agent/chat", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    messages: [{ role: "user", content: userMsg.content }],
                    model: chatModel,
                  }),
                });
                const data = await res.json();
                const answer = data?.answer || data?.message || "Ingen respons";
                setChatHistory((h) => [
                  ...h,
                  { role: "assistant", content: answer },
                ]);
              } catch (err) {
                setChatHistory((h) => [
                  ...h,
                  {
                    role: "assistant",
                    content: "Fejl: kunne ikke kontakte agenten",
                  },
                ]);
              } finally {
                setChatLoading(false);
              }
            }}
            className="flex gap-2"
          >
            <select
              value={chatModel}
              onChange={(e) => setChatModel(e.target.value)}
              className="px-2 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
              title="Vælg model"
            >
              <option value="llama3.1:8b">llama3.1:8b</option>
              <option value="llama3.1:latest">llama3.1:latest</option>
              <option value="dolphin-llama3:8b">dolphin-llama3:8b</option>
              <option value="nomic-embed-text:latest">
                nomic-embed-text:latest
              </option>
            </select>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Stil et spørgsmål om cyberangreb, IoCs, CVEs..."
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-purple-400"
            />
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm">
              Send
            </button>
          </form>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Intelligence Knowledge Base
          </h2>
          <div className="space-y-4">
            <div className="bg-gray-800 rounded p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Available Knowledge Categories
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-300">CIA Methods (3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-300">OSINT Techniques (3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Analysis Frameworks (3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-300">WikiLeaks Intel (2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-300">Cyber Intelligence (2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-300">Counterintelligence (1)</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Sample Knowledge Queries
              </h3>
              <div className="space-y-1 text-xs text-gray-300">
                <p>• "CIA HUMINT collection techniques"</p>
                <p>• "OSINT social media intelligence"</p>
                <p>• "Intelligence analysis cycle"</p>
                <p>• "CIA Vault7 tools analysis"</p>
                <p>• "Threat actor profiling methods"</p>
                <p>• "Malware analysis techniques"</p>
              </div>
            </div>

            <button
              onClick={() => {
                // Load knowledge base
                fetch("/api/knowledge/search", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    query: "CIA intelligence methods",
                    limit: 5,
                  }),
                })
                  .then((res) => res.json())
                  .then((data) => {
                    if (data?.success && Array.isArray(data?.data)) {
                      const knowledge = data.data
                        .map((doc: any) => {
                          const snippet = (
                            doc.snippet ||
                            doc.content ||
                            ""
                          ).slice(0, 100);
                          return `• ${doc.title}: ${snippet}...`;
                        })
                        .join("\n");
                      setChatHistory((prev) => [
                        ...prev,
                        {
                          role: "assistant",
                          content: `Knowledge Base Results:\n\n${knowledge}\n\nUse this knowledge to enhance your analysis.`,
                        },
                      ]);
                    } else {
                      setChatHistory((prev) => [
                        ...prev,
                        {
                          role: "assistant",
                          content:
                            "Ingen viden fundet eller endpoint utilgængeligt. Prøv igen senere.",
                        },
                      ]);
                    }
                  });
              }}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm flex items-center justify-center gap-2"
            >
              <Database className="w-4 h-4" />
              Search Knowledge Base
            </button>
          </div>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {filteredFindings.map((finding) => {
          const SourceIcon = getSourceTypeIcon(finding.sourceType);
          return (
            <div
              key={finding.id}
              className="bg-gray-900 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {/* Header badges */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono text-gray-500">
                      {finding.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(
                        finding.severity
                      )}`}
                    >
                      {finding.severity.toUpperCase()}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(
                        finding.category
                      )}`}
                    >
                      {finding.category === "threat"
                        ? "TRUSSEL"
                        : finding.category === "politics"
                        ? "POLITIK"
                        : "BEGGE"}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        finding.verified
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {finding.verified ? "VERIFIED" : "UNVERIFIED"}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                      {finding.confidence}% confidence
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    {finding.title}
                    {!finding.verified && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                        [Unverified]
                      </span>
                    )}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-400 mb-4">
                    {finding.description}
                  </p>

                  {/* Technical details */}
                  {finding.cves && finding.cves.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">CVE'er:</p>
                      <div className="flex flex-wrap gap-1">
                        {finding.cves.map((cve, idx) => (
                          <code
                            key={idx}
                            className="text-xs px-2 py-1 bg-red-900/30 text-red-300 rounded"
                          >
                            {cve}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  {finding.iocs && finding.iocs.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">IoC'er:</p>
                      <div className="flex flex-wrap gap-1">
                        {finding.iocs.map((ioc, idx) => (
                          <code
                            key={idx}
                            className="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded"
                          >
                            {ioc}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {finding.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <SourceIcon className="w-3 h-3" />
                      {finding.link ? (
                        <a
                          href={finding.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 underline"
                        >
                          {finding.source}
                        </a>
                      ) : (
                        finding.source
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {finding.timestamp}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Målgruppe: {finding.audience.join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFindings.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Ingen findings matcher dine filtre for "{activeTab}" kategorien</p>
        </div>
      )}
    </div>
  );
};

export default CyberstreamsAgent;
