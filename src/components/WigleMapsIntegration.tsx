import { useState, useEffect } from "react";
import {
  Wifi,
  MapPin,
  Search,
  Target,
  Navigation,
  Smartphone,
  Building,
  Globe,
  AlertCircle,
  CheckCircle,
  Loader,
} from "lucide-react";

interface WiFiNetwork {
  bssid: string;
  ssid: string;
  trilat: number;
  trilong: number;
  encryption: string;
  channel: number;
  frequency: number;
  firstseen: string;
  lastseen: string;
}

interface LocationAnalysis {
  coordinates: { lat: number; lon: number };
  wifiNetworks: WiFiNetwork[];
  address: any;
  nearbyPlaces: any[];
  analysis: {
    totalWifiNetworks: number;
    hasAddress: boolean;
    nearbyPlacesCount: number;
  };
}

const WigleMapsIntegration = () => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("location");
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Search parameters
  const [searchParams, setSearchParams] = useState({
    ssid: "",
    bssid: "",
    lat: "",
    lon: "",
    radius: "0.01",
    address: "",
    results: "100",
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/wigle-maps/config");
      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  };

  const searchWiFiNetworks = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        ssid: searchParams.ssid || undefined,
        bssid: searchParams.bssid || undefined,
        lat: searchParams.lat ? parseFloat(searchParams.lat) : undefined,
        lon: searchParams.lon ? parseFloat(searchParams.lon) : undefined,
        radius: parseFloat(searchParams.radius),
        results: parseInt(searchParams.results),
      };

      const response = await fetch("/api/wigle-maps/search-wifi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      if (data.success) {
        setResults({ type: "wifi", data: data.data });
      } else {
        setError(data.error || "Search failed");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddress = async () => {
    if (!searchParams.address) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/wigle-maps/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: searchParams.address }),
      });

      const data = await response.json();
      if (data.success) {
        setResults({ type: "geocode", data: data.data });
      } else {
        setError(data.error || "Geocoding failed");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const analyzeLocation = async () => {
    if (!searchParams.lat || !searchParams.lon) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/wigle-maps/analyze-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: parseFloat(searchParams.lat),
          lon: parseFloat(searchParams.lon),
          radius: parseFloat(searchParams.radius),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResults({ type: "analysis", data: data.data });
      } else {
        setError(data.error || "Analysis failed");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const trackDevice = async (bssid: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/wigle-maps/track-device/${bssid}`);
      const data = await response.json();
      if (data.success) {
        setResults({ type: "tracking", data: data.data });
      } else {
        setError(data.error || "Device tracking failed");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Wifi className="w-8 h-8 text-cyber-blue" />
          <div>
            <h1 className="text-2xl font-bold text-white">
              Wigle WiFi & Maps Integration
            </h1>
            <p className="text-gray-400">
              WiFi Intelligence & Geolocation Analysis
            </p>
          </div>
        </div>

        {config && (
          <div className="flex items-center space-x-2">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                config.wigleConfigured
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {config.wigleConfigured ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              Wigle API
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                config.googleMapsConfigured
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {config.googleMapsConfigured ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              Google Maps
            </div>
          </div>
        )}
      </div>

      {/* Search Controls */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Search Controls
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Type
            </label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
            >
              <option value="location">Location Analysis</option>
              <option value="wifi">WiFi Network Search</option>
              <option value="geocode">Address Geocoding</option>
              <option value="tracking">Device Tracking</option>
            </select>
          </div>

          {searchType === "wifi" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SSID (Network Name)
                </label>
                <input
                  type="text"
                  value={searchParams.ssid}
                  onChange={(e) =>
                    setSearchParams({ ...searchParams, ssid: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
                  placeholder="e.g., Linksys, NETGEAR"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  BSSID (MAC Address)
                </label>
                <input
                  type="text"
                  value={searchParams.bssid}
                  onChange={(e) =>
                    setSearchParams({ ...searchParams, bssid: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
                  placeholder="e.g., 00:11:22:33:44:55"
                />
              </div>
            </>
          )}

          {searchType === "geocode" && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Address
              </label>
              <input
                type="text"
                value={searchParams.address}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, address: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
                placeholder="e.g., 123 Main St, Copenhagen, Denmark"
              />
            </div>
          )}

          {(searchType === "location" || searchType === "wifi") && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={searchParams.lat}
                  onChange={(e) =>
                    setSearchParams({ ...searchParams, lat: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
                  placeholder="55.6761"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={searchParams.lon}
                  onChange={(e) =>
                    setSearchParams({ ...searchParams, lon: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
                  placeholder="12.5683"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Radius (degrees)
            </label>
            <input
              type="number"
              step="0.001"
              value={searchParams.radius}
              onChange={(e) =>
                setSearchParams({ ...searchParams, radius: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
              placeholder="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Results
            </label>
            <input
              type="number"
              value={searchParams.results}
              onChange={(e) =>
                setSearchParams({ ...searchParams, results: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
              placeholder="100"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-400">
            {searchType === "location" &&
              "Analyze WiFi networks and nearby places at coordinates"}
            {searchType === "wifi" && "Search for specific WiFi networks"}
            {searchType === "geocode" && "Convert address to coordinates"}
            {searchType === "tracking" && "Track device by MAC address"}
          </div>

          <button
            onClick={() => {
              if (searchType === "location") analyzeLocation();
              else if (searchType === "wifi") searchWiFiNetworks();
              else if (searchType === "geocode") geocodeAddress();
            }}
            disabled={loading}
            className="px-6 py-2 bg-cyber-blue hover:bg-cyber-blue/80 rounded text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-300 mt-1">{error}</p>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Search Results
          </h2>

          {results.type === "analysis" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded p-4 text-center">
                  <Wifi className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">
                    {results.data.analysis.totalWifiNetworks}
                  </div>
                  <div className="text-sm text-gray-400">WiFi Networks</div>
                </div>
                <div className="bg-gray-800 rounded p-4 text-center">
                  <MapPin className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">
                    {results.data.analysis.nearbyPlacesCount}
                  </div>
                  <div className="text-sm text-gray-400">Nearby Places</div>
                </div>
                <div className="bg-gray-800 rounded p-4 text-center">
                  <Building className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">
                    {results.data.analysis.hasAddress ? "Yes" : "No"}
                  </div>
                  <div className="text-sm text-gray-400">Address Found</div>
                </div>
              </div>

              {results.data.address && (
                <div className="bg-gray-800 rounded p-4">
                  <h3 className="font-medium text-white mb-2">
                    Address Information
                  </h3>
                  <p className="text-gray-300">
                    {results.data.address.formatted_address}
                  </p>
                </div>
              )}

              {results.data.wifiNetworks.length > 0 && (
                <div className="bg-gray-800 rounded p-4">
                  <h3 className="font-medium text-white mb-3">
                    WiFi Networks ({results.data.wifiNetworks.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {results.data.wifiNetworks
                      .slice(0, 10)
                      .map((network: WiFiNetwork, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-700 rounded"
                        >
                          <div className="flex items-center gap-3">
                            <Wifi className="w-4 h-4 text-blue-400" />
                            <div>
                              <div className="text-sm font-medium text-white">
                                {network.ssid || "Hidden Network"}
                              </div>
                              <div className="text-xs text-gray-400">
                                {network.bssid}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {network.encryption} • Ch {network.channel}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {results.type === "wifi" && (
            <div className="space-y-4">
              <div className="text-lg font-medium text-white">
                Found {results.data.length} WiFi networks
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.data.map((network: WiFiNetwork, index: number) => (
                  <div key={index} className="bg-gray-800 rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Wifi className="w-5 h-5 text-blue-400" />
                        <div>
                          <div className="font-medium text-white">
                            {network.ssid || "Hidden Network"}
                          </div>
                          <div className="text-sm text-gray-400">
                            {network.bssid}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => trackDevice(network.bssid)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs"
                      >
                        Track
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400">
                      <div>Encryption: {network.encryption}</div>
                      <div>Channel: {network.channel}</div>
                      <div>Frequency: {network.frequency}MHz</div>
                      <div>
                        Last Seen:{" "}
                        {new Date(network.lastseen).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.type === "geocode" && (
            <div className="space-y-4">
              <div className="text-lg font-medium text-white">
                Found {results.data.length} location results
              </div>
              {results.data.map((result: any, index: number) => (
                <div key={index} className="bg-gray-800 rounded p-4">
                  <div className="font-medium text-white mb-2">
                    {result.formatted_address}
                  </div>
                  <div className="text-sm text-gray-400">
                    Lat: {result.geometry.location.lat}, Lon:{" "}
                    {result.geometry.location.lng}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WigleMapsIntegration;

