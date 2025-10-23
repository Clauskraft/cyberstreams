import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  X,
  Clock,
  TrendingUp,
  Database,
  Globe,
  Bot,
  Shield,
  Wifi,
  History,
  ChevronDown,
  Loader,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  content?: string;
  type: "knowledge" | "intelligence" | "agent" | "source" | "wifi";
  source?: string;
  category?: string;
  severity?: string;
  relevance?: number;
  timestamp?: string;
  createdAt?: string;
  tags?: string[];
  [key: string]: any;
}

interface SearchFilters {
  type?: string;
  source?: string;
  severity?: string;
  category?: string;
  dateRange?: string;
}

interface UnifiedSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  placeholder?: string;
  showFilters?: boolean;
  showSuggestions?: boolean;
  showHistory?: boolean;
  maxResults?: number;
  className?: string;
}

const UnifiedSearch: React.FC<UnifiedSearchProps> = ({
  onResultSelect,
  placeholder = "Search across all data sources...",
  showFilters = true,
  showSuggestions = true,
  showHistory = true,
  maxResults = 20,
  className = "",
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [searchType, setSearchType] = useState("unified");
  const [analytics, setAnalytics] = useState<any>(null);

  // Load search history and analytics on mount
  useEffect(() => {
    loadSearchHistory();
    loadSearchAnalytics();
  }, []);

  // Load suggestions when query changes
  useEffect(() => {
    if (query.length >= 2) {
      loadSuggestions(query);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const loadSearchHistory = async () => {
    try {
      const response = await fetch("/api/search/history?limit=10");
      const data = await response.json();
      if (data.success) {
        const historyQueries = data.data.history.map((h: any) => h.query);
        setHistory(historyQueries);
      }
    } catch (error) {
      console.error("Failed to load search history:", error);
    }
  };

  const loadSearchAnalytics = async () => {
    try {
      const response = await fetch("/api/search/analytics");
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error("Failed to load search analytics:", error);
    }
  };

  const loadSuggestions = async (searchQuery: string) => {
    try {
      const response = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(
          searchQuery
        )}&type=${searchType}`
      );
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.data.suggestions || []);
      }
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    }
  };

  const performSearch = useCallback(
    async (searchQuery: string, searchFilters: SearchFilters = {}) => {
      if (!searchQuery.trim()) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/search/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQuery,
            type: searchType,
            limit: maxResults,
            filters: searchFilters,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setResults(data.data.results || []);
          setShowResults(true);

          // Add to history
          if (!history.includes(searchQuery)) {
            setHistory((prev) => [searchQuery, ...prev.slice(0, 9)]);
          }
        } else {
          setError(data.error || "Search failed");
        }
      } catch (error) {
        setError("Network error occurred");
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    },
    [searchType, maxResults, history]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query, filters);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion, filters);
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    performSearch(historyQuery, filters);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Auto-search when filters change
    if (query) {
      performSearch(query, newFilters);
    }
  };

  const clearFilters = () => {
    setFilters({});
    if (query) {
      performSearch(query, {});
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "knowledge":
        return <Database className="w-4 h-4" />;
      case "intelligence":
        return <Shield className="w-4 h-4" />;
      case "agent":
        return <Bot className="w-4 h-4" />;
      case "source":
        return <Globe className="w-4 h-4" />;
      case "wifi":
        return <Wifi className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "knowledge":
        return "text-blue-400";
      case "intelligence":
        return "text-red-400";
      case "agent":
        return "text-purple-400";
      case "source":
        return "text-green-400";
      case "wifi":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-500";
      case "high":
        return "text-orange-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex items-center bg-gray-800 rounded-lg border border-gray-700 focus-within:border-purple-400 transition-colors">
          <Search className="absolute left-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 pl-10 pr-4 py-3 bg-transparent text-white placeholder-gray-400 focus:outline-none"
            autoComplete="off"
          />

          {showFilters && (
            <button
              type="button"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`p-2 mr-2 rounded ${
                showFiltersPanel ? "bg-purple-600" : "hover:bg-gray-700"
              }`}
            >
              <Filter className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {loading && (
            <Loader className="w-5 h-5 text-purple-400 animate-spin mr-3" />
          )}

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setShowResults(false);
                setSuggestions([]);
              }}
              className="p-2 mr-2 hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </form>

      {/* Search Type Selector */}
      <div className="flex gap-2 mt-2">
        {[
          "unified",
          "knowledge",
          "intelligence",
          "agents",
          "sources",
          "wifi",
        ].map((type) => (
          <button
            key={type}
            onClick={() => setSearchType(type)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              searchType === type
                ? "bg-purple-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Filters Panel */}
      {showFiltersPanel && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg p-4 z-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Type</label>
              <select
                value={filters.type || ""}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              >
                <option value="">All Types</option>
                <option value="knowledge">Knowledge</option>
                <option value="intelligence">Intelligence</option>
                <option value="agent">Agent</option>
                <option value="source">Source</option>
                <option value="wifi">WiFi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Severity
              </label>
              <select
                value={filters.severity || ""}
                onChange={(e) => handleFilterChange("severity", e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Source</label>
              <select
                value={filters.source || ""}
                onChange={(e) => handleFilterChange("source", e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              >
                <option value="">All Sources</option>
                <option value="cfcs">CFCS</option>
                <option value="enisa">ENISA</option>
                <option value="cisa">CISA</option>
                <option value="nato">NATO</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Date Range
              </label>
              <select
                value={filters.dateRange || ""}
                onChange={(e) =>
                  handleFilterChange("dateRange", e.target.value)
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              >
                <option value="">All Time</option>
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm text-gray-400 hover:text-white"
            >
              Clear Filters
            </button>

            <div className="text-xs text-gray-500">
              {Object.values(filters).filter(Boolean).length} filters active
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && !showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg p-2 z-40">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center gap-2"
            >
              <Search className="w-3 h-3 text-gray-500" />
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Search History */}
      {showHistory && history.length > 0 && !query && !showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg p-2 z-40">
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500">
            <History className="w-3 h-3" />
            Recent Searches
          </div>
          {history.slice(0, 5).map((historyQuery, index) => (
            <button
              key={index}
              onClick={() => handleHistoryClick(historyQuery)}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center gap-2"
            >
              <Clock className="w-3 h-3 text-gray-500" />
              {historyQuery}
            </button>
          ))}
        </div>
      )}

      {/* Search Results */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg max-h-96 overflow-y-auto z-40">
          {error && (
            <div className="p-4 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {results.length === 0 && !loading && (
            <div className="p-4 text-gray-400 text-center">
              No results found for "{query}"
            </div>
          )}

          {results.map((result) => (
            <div
              key={result.id}
              onClick={() => onResultSelect?.(result)}
              className="p-4 border-b border-gray-700 hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 ${getTypeColor(result.type)}`}>
                  {getTypeIcon(result.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium truncate">
                      {result.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded ${getTypeColor(
                        result.type
                      )} bg-gray-700`}
                    >
                      {result.type}
                    </span>
                    {result.severity && (
                      <span
                        className={`text-xs px-2 py-1 rounded ${getSeverityColor(
                          result.severity
                        )} bg-gray-700`}
                      >
                        {result.severity}
                      </span>
                    )}
                  </div>

                  {(result.description || result.content) && (
                    <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                      {result.description || result.content}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {result.source && <span>Source: {result.source}</span>}
                    {result.category && (
                      <span>Category: {result.category}</span>
                    )}
                    {(result.timestamp || result.createdAt) && (
                      <span>
                        {new Date(
                          result.timestamp || result.createdAt
                        ).toLocaleDateString()}
                      </span>
                    )}
                    {result.relevance && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {Math.round(result.relevance)}% match
                      </span>
                    )}
                  </div>

                  {result.tags && result.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {result.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {results.length > 0 && (
            <div className="p-3 text-center text-xs text-gray-500 border-t border-gray-700">
              Showing {results.length} results for "{query}"
            </div>
          )}
        </div>
      )}

      {/* Analytics Summary */}
      {analytics && (
        <div className="mt-4 text-xs text-gray-500 flex items-center gap-4">
          <span>{analytics.totalSearches} total searches</span>
          <span>{analytics.averageResults?.toFixed(1)} avg results</span>
          <span>
            Most popular: {analytics.popularQueries?.[0]?.query || "N/A"}
          </span>
        </div>
      )}
    </div>
  );
};

export default UnifiedSearch;
