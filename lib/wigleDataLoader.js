import logger from "./logger.js";

export default function createWigleDataLoader() {
  const WIGLE_API_BASE = "https://api.wigle.net/api/v2";
  let wigleApiKey = process.env.WIGLE_API_KEY;

  // Denmark bounding box coordinates
  const DENMARK_BOUNDS = {
    north: 57.7517,
    south: 54.5594,
    east: 15.1588,
    west: 8.0756,
  };

  // Data storage
  const wifiNetworks = new Map();
  const lastUpdate = new Map();

  // Load Denmark WiFi data from 2021 to now
  async function loadDenmarkData() {
    if (!wigleApiKey) {
      logger.warn("Wigle API key not configured, skipping data load");
      return { success: false, error: "Wigle API key not configured" };
    }

    try {
      logger.info("Starting Denmark WiFi data load from 2021 to present");

      const results = [];
      let totalLoaded = 0;
      const batchSize = 1000; // Wigle API limit
      let page = 0;

      // Search in batches across Denmark
      while (true) {
        const params = new URLSearchParams({
          onlymine: "false",
          results: batchSize.toString(),
          latrange1: DENMARK_BOUNDS.south.toString(),
          latrange2: DENMARK_BOUNDS.north.toString(),
          longrange1: DENMARK_BOUNDS.west.toString(),
          longrange2: DENMARK_BOUNDS.east.toString(),
          lastupdt: "20210101", // From 2021-01-01
          page: page.toString(),
        });

        logger.info(`Loading batch ${page + 1}, offset: ${page * batchSize}`);

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
          if (response.status === 429) {
            logger.warn("Rate limited, waiting 60 seconds");
            await new Promise((resolve) => setTimeout(resolve, 60000));
            continue;
          }
          throw new Error(`Wigle API error: ${response.status}`);
        }

        const data = await response.json();
        const networks = data.results || [];

        if (networks.length === 0) {
          logger.info("No more networks found, loading complete");
          break;
        }

        // Process and store networks
        for (const network of networks) {
          const networkId = network.bssid;
          wifiNetworks.set(networkId, {
            ...network,
            country: "DK",
            region: "Denmark",
            loadedAt: new Date().toISOString(),
          });
          totalLoaded++;
        }

        results.push(...networks);
        page++;

        // Rate limiting - be respectful to Wigle API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Safety limit to prevent infinite loops
        if (page > 1000) {
          logger.warn("Reached safety limit of 1000 pages");
          break;
        }
      }

      logger.info(
        `Denmark WiFi data load complete. Loaded ${totalLoaded} networks`
      );

      return {
        success: true,
        data: {
          totalNetworks: totalLoaded,
          networks: Array.from(wifiNetworks.values()),
          lastUpdate: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error({ err: error }, "Failed to load Denmark WiFi data");
      return { success: false, error: error.message };
    }
  }

  // Get networks by location
  async function getNetworksByLocation(lat, lon, radius = 0.01) {
    const networks = Array.from(wifiNetworks.values());

    return networks.filter((network) => {
      const distance = calculateDistance(
        lat,
        lon,
        network.trilat,
        network.trilong
      );
      return distance <= radius * 111; // Convert degrees to km
    });
  }

  // Get networks by SSID pattern
  async function getNetworksBySSID(pattern) {
    const networks = Array.from(wifiNetworks.values());
    const regex = new RegExp(pattern, "i");

    return networks.filter(
      (network) => network.ssid && regex.test(network.ssid)
    );
  }

  // Get networks by MAC address pattern
  async function getNetworksByMAC(pattern) {
    const networks = Array.from(wifiNetworks.values());
    const regex = new RegExp(pattern, "i");

    return networks.filter((network) => regex.test(network.bssid));
  }

  // Get statistics
  function getStatistics() {
    const networks = Array.from(wifiNetworks.values());

    const stats = {
      totalNetworks: networks.length,
      uniqueSSIDs: new Set(networks.map((n) => n.ssid)).size,
      encryptionTypes: {},
      channels: {},
      frequencies: {},
      regions: {},
      lastSeen: {},
      firstSeen: {},
    };

    networks.forEach((network) => {
      // Encryption types
      stats.encryptionTypes[network.encryption] =
        (stats.encryptionTypes[network.encryption] || 0) + 1;

      // Channels
      stats.channels[network.channel] =
        (stats.channels[network.channel] || 0) + 1;

      // Frequencies
      stats.frequencies[network.frequency] =
        (stats.frequencies[network.frequency] || 0) + 1;

      // Regions
      const region = network.region || "Unknown";
      stats.regions[region] = (stats.regions[region] || 0) + 1;

      // Time analysis
      if (network.lastseen) {
        const year = new Date(network.lastseen).getFullYear();
        stats.lastSeen[year] = (stats.lastSeen[year] || 0) + 1;
      }

      if (network.firstseen) {
        const year = new Date(network.firstseen).getFullYear();
        stats.firstSeen[year] = (stats.firstSeen[year] || 0) + 1;
      }
    });

    return stats;
  }

  // Calculate distance between two points
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

  // Update data (incremental)
  async function updateData() {
    if (!wigleApiKey) {
      return { success: false, error: "Wigle API key not configured" };
    }

    try {
      const lastUpdateTime = lastUpdate.get("denmark") || "20210101";
      const now = new Date();
      const today = now.toISOString().split("T")[0].replace(/-/g, "");

      logger.info(
        `Updating Denmark WiFi data from ${lastUpdateTime} to ${today}`
      );

      const params = new URLSearchParams({
        onlymine: "false",
        results: "1000",
        latrange1: DENMARK_BOUNDS.south.toString(),
        latrange2: DENMARK_BOUNDS.north.toString(),
        longrange1: DENMARK_BOUNDS.west.toString(),
        longrange2: DENMARK_BOUNDS.east.toString(),
        lastupdt: lastUpdateTime,
      });

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
      const networks = data.results || [];

      let updated = 0;
      for (const network of networks) {
        const networkId = network.bssid;
        if (!wifiNetworks.has(networkId)) {
          wifiNetworks.set(networkId, {
            ...network,
            country: "DK",
            region: "Denmark",
            loadedAt: new Date().toISOString(),
          });
          updated++;
        }
      }

      lastUpdate.set("denmark", today);

      logger.info(`Updated ${updated} new networks`);

      return {
        success: true,
        data: {
          updatedNetworks: updated,
          totalNetworks: wifiNetworks.size,
          lastUpdate: today,
        },
      };
    } catch (error) {
      logger.error({ err: error }, "Failed to update Denmark WiFi data");
      return { success: false, error: error.message };
    }
  }

  // Schedule automatic updates
  function scheduleUpdates(intervalHours = 24) {
    const intervalMs = intervalHours * 60 * 60 * 1000;

    // Initial update
    setTimeout(() => {
      updateData();
    }, 5000); // Wait 5 seconds after startup

    // Regular updates
    setInterval(() => {
      updateData();
    }, intervalMs);

    logger.info(
      `Scheduled Denmark WiFi data updates every ${intervalHours} hours`
    );
  }

  return {
    loadDenmarkData,
    getNetworksByLocation,
    getNetworksBySSID,
    getNetworksByMAC,
    getStatistics,
    updateData,
    scheduleUpdates,

    // Configuration
    isConfigured: () => !!wigleApiKey,
    getConfig: () => ({
      wigleConfigured: !!wigleApiKey,
      totalNetworks: wifiNetworks.size,
      lastUpdate: lastUpdate.get("denmark") || "Never",
    }),
  };
}

