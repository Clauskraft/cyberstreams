import logger from "./logger.js";

export default function createWigleMapsIntegration() {
  const WIGLE_API_BASE = "https://api.wigle.net/api/v2";
  const GOOGLE_MAPS_API_BASE = "https://maps.googleapis.com/maps/api";

  let wigleApiKey = process.env.WIGLE_API_KEY;
  let googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

  // Wigle WiFi API functions
  async function searchWifiNetworks({
    ssid,
    bssid,
    lat,
    lon,
    radius = 0.01,
    results = 100,
  }) {
    if (!wigleApiKey) {
      throw new Error("Wigle API key not configured");
    }

    const params = new URLSearchParams({
      onlymine: "false",
      results: results.toString(),
      latrange1: lat ? (lat - radius).toString() : "",
      latrange2: lat ? (lat + radius).toString() : "",
      longrange1: lon ? (lon - radius).toString() : "",
      longrange2: lon ? (lon + radius).toString() : "",
    });

    if (ssid) params.append("ssid", ssid);
    if (bssid) params.append("bssid", bssid);

    try {
      const response = await fetch(
        `${WIGLE_API_BASE}/network/search?${params}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${wigleApiKey}:`).toString(
              "base64"
            )}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Wigle API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.results || [],
        total: data.totalResults || 0,
      };
    } catch (error) {
      logger.error({ err: error }, "Failed to search Wigle WiFi networks");
      return { success: false, error: error.message };
    }
  }

  async function getWifiNetworkDetails(bssid) {
    if (!wigleApiKey) {
      throw new Error("Wigle API key not configured");
    }

    try {
      const response = await fetch(
        `${WIGLE_API_BASE}/network/detail?netid=${bssid}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${wigleApiKey}:`).toString(
              "base64"
            )}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Wigle API error: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      logger.error({ err: error }, "Failed to get WiFi network details");
      return { success: false, error: error.message };
    }
  }

  // Google Maps API functions
  async function geocodeAddress(address) {
    if (!googleMapsApiKey) {
      throw new Error("Google Maps API key not configured");
    }

    try {
      const params = new URLSearchParams({
        address: address,
        key: googleMapsApiKey,
      });

      const response = await fetch(
        `${GOOGLE_MAPS_API_BASE}/geocode/json?${params}`
      );

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: data.results || [] };
    } catch (error) {
      logger.error({ err: error }, "Failed to geocode address");
      return { success: false, error: error.message };
    }
  }

  async function reverseGeocode(lat, lon) {
    if (!googleMapsApiKey) {
      throw new Error("Google Maps API key not configured");
    }

    try {
      const params = new URLSearchParams({
        latlng: `${lat},${lon}`,
        key: googleMapsApiKey,
      });

      const response = await fetch(
        `${GOOGLE_MAPS_API_BASE}/geocode/json?${params}`
      );

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: data.results || [] };
    } catch (error) {
      logger.error({ err: error }, "Failed to reverse geocode");
      return { success: false, error: error.message };
    }
  }

  async function getNearbyPlaces(
    lat,
    lon,
    radius = 1000,
    type = "establishment"
  ) {
    if (!googleMapsApiKey) {
      throw new Error("Google Maps API key not configured");
    }

    try {
      const params = new URLSearchParams({
        location: `${lat},${lon}`,
        radius: radius.toString(),
        type: type,
        key: googleMapsApiKey,
      });

      const response = await fetch(
        `${GOOGLE_MAPS_API_BASE}/place/nearbysearch/json?${params}`
      );

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: data.results || [] };
    } catch (error) {
      logger.error({ err: error }, "Failed to get nearby places");
      return { success: false, error: error.message };
    }
  }

  // Combined intelligence functions
  async function analyzeLocation(lat, lon, radius = 0.01) {
    try {
      // Get WiFi networks in area
      const wifiResult = await searchWifiNetworks({ lat, lon, radius });

      // Get address information
      const addressResult = await reverseGeocode(lat, lon);

      // Get nearby places
      const placesResult = await getNearbyPlaces(lat, lon);

      return {
        success: true,
        data: {
          coordinates: { lat, lon },
          wifiNetworks: wifiResult.success ? wifiResult.data : [],
          address: addressResult.success ? addressResult.data[0] : null,
          nearbyPlaces: placesResult.success ? placesResult.data : [],
          analysis: {
            totalWifiNetworks: wifiResult.success ? wifiResult.data.length : 0,
            hasAddress: addressResult.success && addressResult.data.length > 0,
            nearbyPlacesCount: placesResult.success
              ? placesResult.data.length
              : 0,
          },
        },
      };
    } catch (error) {
      logger.error({ err: error }, "Failed to analyze location");
      return { success: false, error: error.message };
    }
  }

  async function trackDevice(bssid) {
    try {
      // Get WiFi network details
      const networkResult = await getWifiNetworkDetails(bssid);

      if (!networkResult.success) {
        return networkResult;
      }

      const network = networkResult.data;

      // Get location information
      const addressResult = await reverseGeocode(
        network.trilat,
        network.trilong
      );

      // Get nearby places
      const placesResult = await getNearbyPlaces(
        network.trilat,
        network.trilong
      );

      return {
        success: true,
        data: {
          bssid: network.bssid,
          ssid: network.ssid,
          coordinates: { lat: network.trilat, lon: network.trilong },
          address: addressResult.success ? addressResult.data[0] : null,
          nearbyPlaces: placesResult.success ? placesResult.data : [],
          networkInfo: {
            encryption: network.encryption,
            channel: network.channel,
            frequency: network.frequency,
            firstSeen: network.firstseen,
            lastSeen: network.lastseen,
          },
        },
      };
    } catch (error) {
      logger.error({ err: error }, "Failed to track device");
      return { success: false, error: error.message };
    }
  }

  // Utility functions
  function parseMacAddress(mac) {
    // Remove separators and convert to uppercase
    return mac.replace(/[:\-\.]/g, "").toUpperCase();
  }

  function getOuiFromMac(mac) {
    const cleanMac = parseMacAddress(mac);
    return cleanMac.substring(0, 6);
  }

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  return {
    // Wigle WiFi functions
    searchWifiNetworks,
    getWifiNetworkDetails,

    // Google Maps functions
    geocodeAddress,
    reverseGeocode,
    getNearbyPlaces,

    // Combined intelligence functions
    analyzeLocation,
    trackDevice,

    // Utility functions
    parseMacAddress,
    getOuiFromMac,
    calculateDistance,

    // Configuration
    isConfigured: () => !!(wigleApiKey && googleMapsApiKey),
    getConfig: () => ({
      wigleConfigured: !!wigleApiKey,
      googleMapsConfigured: !!googleMapsApiKey,
    }),
  };
}

